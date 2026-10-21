"""Independent finalized tail capture + bounded historical backfill."""
import json
import time
from concurrent.futures import ThreadPoolExecutor

from .indexer import Indexer, number, hash32
from .rpc import RPCError
from .store import Store, IntegrityError, now


class PublicFollower:
    def __init__(self, config, rpc, store, history_rpc=None):
        self.config, self.rpc, self.store = config, rpc, store
        self.indexer = Indexer(config, rpc, store)
        self.stop_requested = False
        self.next_history = 0
        self.last_reconcile = 0
        self.history_rpc = history_rpc
        self.executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="mha-history") if history_rpc else None
        self.future = None
        self.future_kind = None
        self.history_chunk = config.chunk
        self.next_audit = 0
        self.last_job = None
        self.audit_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="mha-audit") if history_rpc else None
        self.audit_future = None

    def capture_once(self, on_batch=None):
        if self.store.meta("halted", False):
            raise IntegrityError("Ledger halted; investigate finalized conflicts before resuming")
        self.indexer.initialize()
        final = self.rpc.block("finalized")
        latest = self.rpc.block("latest")
        target, head = number(final["number"]), number(latest["number"])
        if target > head:
            raise RPCError("eth_getBlockByNumber", "heads", "finalized head ahead of latest")
        with self.store.db:
            self.store.set_meta("network", {"latest": head, "finalized": target, "observed_at": now(), "source": self.rpc.source})
            self.store.set_meta("live_heartbeat_at", now())
            self.store.set_meta("last_heartbeat_at", now())
        cursor = self.store.meta("live_cursor")
        if cursor and target < cursor["number"]:
            raise RPCError("eth_getBlockByNumber", "stale", "finalized head behind live checkpoint")
        reset = bool(cursor and target - cursor["number"] > self.config.live_retention)
        if cursor and not reset:
            if hash32(self.rpc.block(cursor["number"])["hash"]) != cursor["hash"]:
                raise IntegrityError("Finalized live checkpoint hash changed; evidence preserved, indexing halted")
            start = cursor["number"] + 1
        else:
            start = max(self.store.meta("token")["deployment_block"], target - self.config.live_window + 1)
            # On recovery, disclose the inaccessible interval instead of claiming continuity.
            # A brand-new tail also does not claim coverage before this start.
        chunk = self.config.live_chunk
        committed = 0
        while start <= target and committed < 4 and not self.stop_requested:
            end = min(start + chunk - 1, target)
            # For the first isolated segment the historical cursor is deliberately unrelated.
            checkpoint = cursor if cursor and not reset else {"number": start - 2, "hash": "unused"}
            try:
                logs, transfers, end_hash = self.indexer.fetch_range(start, end, checkpoint)
            except RPCError as exc:
                if exc.range_limit and chunk > 1:
                    chunk = max(1, chunk // 2)
                    continue
                raise
            self.store.capture(start, end, end_hash, logs, transfers, self.indexer.log_source, reset=reset)
            if on_batch:
                on_batch({"track": "live", "start": start, "end": end, "target": target,
                          "logs": len(logs), "transfers": len(transfers), "source": self.indexer.log_source})
            cursor = self.store.meta("live_cursor")
            reset = False
            start = end + 1
            committed += 1
        with self.store.db:
            self.store.set_meta("live_last_error", None)
        return committed

    def cycle(self, on_batch=None):
        try:
            self.capture_once(on_batch)
        except RPCError as exc:
            with self.store.db:
                self.store.set_meta("live_last_error", str(exc))
            if on_batch:
                on_batch({"track": "live", "error": str(exc)})
            # A recent-provider outage must not starve independent historical providers.
            if self.history_rpc:
                self.background_history(on_batch)
            return
        if self.history_rpc:
            self.background_history(on_batch)
            return
        if time.monotonic() >= self.next_history and not self.stop_requested:
            try:
                self.indexer.sync_once(max_batches=1, on_batch=lambda item: on_batch(dict(item, track="history")) if on_batch else None)
                self.next_history = time.monotonic() + self.config.poll
                if self.store.meta("caught_up_at"):
                    if self.indexer.needs_full_audit():
                        report = self.indexer.reconcile(full=True)
                        if report["status"] != "passed":
                            raise IntegrityError("Full historical reconciliation failed")
                        self.last_reconcile = time.monotonic()
                    elif time.monotonic() - self.last_reconcile >= self.config.reconcile_interval:
                        report = self.indexer.reconcile()
                        if report["status"] != "passed":
                            raise IntegrityError("Historical reconciliation failed")
                        self.last_reconcile = time.monotonic()
                with self.store.db:
                    self.store.set_meta("last_error", None)
            except RPCError as exc:
                self.next_history = time.monotonic() + self.config.history_retry
                with self.store.db:
                    self.store.set_meta("last_error", str(exc))
                if on_batch:
                    on_batch({"track": "history", "error": str(exc), "retry_in_seconds": self.config.history_retry})

    def prepare_history(self, target):
        # The worker thread owns its own read-only connection. It NEVER writes DB state.
        store = Store(self.store.path, readonly=True)
        try:
            store.db.execute("BEGIN")
            cursor = store.meta("cursor")
            if hasattr(self.history_rpc, "head"):
                self.history_rpc.head = max(self.history_rpc.head, target)
            indexer = Indexer(self.config, self.history_rpc, store)
            indexer.check_cursor(persist_halt=False)
            start = cursor["number"] + 1
            chunk = self.history_chunk
            while True:
                end = min(start + chunk - 1, target)
                try:
                    logs, transfers, end_hash = indexer.fetch_range(start, end, cursor)
                    return {"start": start, "end": end, "end_hash": end_hash, "logs": logs,
                            "transfers": transfers, "source": indexer.log_source, "target": target,
                            "next_chunk": min(self.config.chunk, chunk * 2)}
                except RPCError as exc:
                    if not exc.range_limit or chunk <= 1:
                        raise
                    chunk = max(1, chunk // 2)
        finally:
            store.close()

    def prepare_audit(self, full):
        store = Store(self.store.path, readonly=True)
        try:
            store.db.execute("BEGIN")
            return Indexer(self.config, self.history_rpc, store).reconcile(full=full, persist=False)
        finally:
            store.close()

    def prepare_audit_chunk(self, job_id):
        store = Store(self.store.path, readonly=True)
        try:
            store.db.execute("BEGIN")
            job = dict(store.db.execute("SELECT * FROM audit_jobs WHERE id=? AND status='running'", (job_id,)).fetchone())
            rows = [dict(row) for row in store.db.execute("SELECT address,balance_raw FROM audit_balances WHERE job_id=? AND onchain_raw IS NULL ORDER BY address LIMIT ?", (job_id, self.config.audit_chunk_size))]
        finally:
            store.close()  # Do not pin SQLite WAL during network work.
        block = job["block_number"]
        if hash32(self.history_rpc.block(block)["hash"]) != job["block_hash"]:
            raise IntegrityError("Finalized audit checkpoint hash changed")
        selectors = ["0x18160ddd"] + ["0x70a08231" + row["address"][2:].zfill(64) for row in rows]
        if hasattr(self.history_rpc, "batch_uint"):
            values = []
            for offset in range(0, len(selectors), 10):
                if self.stop_requested:
                    raise RPCError("eth_call", "cancelled", "Audit paused for worker shutdown; persisted progress preserved")
                values.extend(self.history_rpc.batch_uint(selectors[offset:offset + 10], block))
        else:
            values = [self.history_rpc.uint(selector, block) for selector in selectors]
        if len(values) != len(selectors):
            raise RPCError("eth_call", "protocol", "Missing audit results")
        if hash32(self.history_rpc.block(block)["hash"]) != job["block_hash"]:
            raise IntegrityError("Finalized audit checkpoint hash changed during batch")
        return {"job_id": job_id, "block_hash": job["block_hash"], "supply_raw": values[0],
                "balances": [(row["address"], value) for row, value in zip(rows, values[1:])]}

    def background_history(self, on_batch=None):
        if self.audit_future and self.audit_future.done():
            try:
                report = self.store.commit_audit_chunk(self.audit_future.result())
                progress = self.store.audit_progress()
                if report and report["status"] != "passed":
                    raise IntegrityError("Historical balance/supply reconciliation failed")
                if report:
                    self.last_reconcile = time.monotonic()
                if on_batch:
                    on_batch({"track": "audit", "status": report["status"] if report else "running",
                              "addresses_checked": report["addresses_checked"] if report else progress["addresses_checked"],
                              "addresses_known": report["addresses_known"] if report else progress["addresses_known"]})
            except RPCError as exc:
                self.next_audit = time.monotonic() + self.config.history_retry
                with self.store.db:
                    self.store.set_meta("audit_last_error", str(exc))
                if on_batch:
                    on_batch({"track": "audit", "error": str(exc), "retry_in_seconds": self.config.history_retry})
            finally:
                self.audit_future = None
        if self.future and self.future.done():
            kind = self.future_kind
            try:
                result = self.future.result()
                if kind == "history":
                    self.store.apply(result["start"], result["end"], result["end_hash"], result["logs"], result["transfers"], result["source"])
                    self.history_chunk = result["next_chunk"]
                    if result["end"] >= result["target"]:
                        with self.store.db:
                            self.store.set_meta("caught_up_at", now())
                    if on_batch:
                        on_batch({"track": "history", "start": result["start"], "end": result["end"], "target": result["target"], "logs": len(result["logs"]), "transfers": len(result["transfers"]), "source": result["source"]})
                elif kind == "audit_chunk":
                    report = self.store.commit_audit_chunk(result)
                    progress = self.store.audit_progress()
                    if report and report["status"] != "passed":
                        raise IntegrityError("Historical balance/supply reconciliation failed")
                    if report:
                        self.last_reconcile = time.monotonic()
                    if on_batch:
                        on_batch({"track": "audit", "status": report["status"] if report else "running",
                                  "addresses_checked": report["addresses_checked"] if report else progress["addresses_checked"],
                                  "addresses_known": report["addresses_known"] if report else progress["addresses_known"]})
                else:
                    self.store.save_reconciliation(result)
                    if result["status"] != "passed":
                        raise IntegrityError("Historical balance/supply reconciliation failed")
                    self.last_reconcile = time.monotonic()
                    if on_batch:
                        on_batch({"track": "audit", "status": result["status"], "mode": result["mode"], "block": result["block_number"]})
                with self.store.db:
                    if kind != "audit_chunk":
                        self.store.set_meta("last_error", None)
                self.next_history = time.monotonic()
            except RPCError as exc:
                with self.store.db:
                    if kind in ("audit", "audit_chunk"):
                        self.next_audit = time.monotonic() + self.config.history_retry
                        self.store.set_meta("audit_last_error", str(exc))
                    else:
                        self.next_history = time.monotonic() + self.config.history_retry
                        self.store.set_meta("last_error", str(exc))
                if on_batch:
                    on_batch({"track": kind, "error": str(exc), "retry_in_seconds": self.config.history_retry})
            finally:
                self.future = None
                self.future_kind = None
                self.last_job = kind
        if self.stop_requested:
            return
        full = self.store.meta("caught_up_at") and self.indexer.needs_full_audit()
        sample = self.store.meta("caught_up_at") and time.monotonic() - self.last_reconcile >= self.config.reconcile_interval
        network = self.store.meta("network")
        if not network:
            return  # No validated target yet; retry head discovery on the next live cycle.
        target = network["finalized"]
        lag = target - self.store.meta("cursor")["number"]
        # caught_up_at means "ever caught up", not "still caught up".
        # Two independent read-only jobs share the thread-safe historical RPC pool.
        # Only this main writer commits either result; no audit blocks history scheduling.
        if not self.future and time.monotonic() >= self.next_history:
            if lag > 0:
                self.future_kind = "history"
                self.future = self.executor.submit(self.prepare_history, target)
            elif sample and not full and not self.audit_future and time.monotonic() >= self.next_audit:
                self.future_kind = "audit"
                self.future = self.executor.submit(self.prepare_audit, False)
        active = self.store.audit_progress()
        if not self.audit_future and time.monotonic() >= self.next_audit and (active or (full and lag <= 50)):
            job = active or self.store.start_audit()
            self.audit_future = self.audit_executor.submit(self.prepare_audit_chunk, job["id"])

    def close(self):
        if self.executor:
            self.executor.shutdown(wait=False, cancel_futures=True)
        if self.audit_executor:
            self.audit_executor.shutdown(wait=False, cancel_futures=True)

    def run(self, on_batch=None):
        emit = on_batch or (lambda value: print(json.dumps(value), flush=True))
        while not self.stop_requested:
            started = time.monotonic()
            try:
                self.cycle(emit)
            except IntegrityError as exc:
                with self.store.db:
                    self.store.set_meta("halted", True)
                    self.store.set_meta("last_error", str(exc))
                    self.store.set_meta("live_last_error", str(exc))
                self.store.alert("integrity_halt", str(exc))
                raise
            finally:
                with self.store.db:
                    self.store.set_meta("public_nodes", self.rpc.status())
                    if self.history_rpc:
                        nodes = [dict(node, track="live") for node in self.rpc.status()]
                        nodes += [dict(node, track="history") for node in self.history_rpc.status()]
                        self.store.set_meta("public_nodes", nodes)
                        self.store.set_meta("history_request_inflight", self.future_kind)
                        self.store.set_meta("audit_request_inflight", bool(self.audit_future))
                    self.store.set_meta("worker_mode", "public-polling")
            while not self.stop_requested and time.monotonic() - started < self.config.poll:
                time.sleep(min(1, max(0, self.config.poll - (time.monotonic() - started))))
