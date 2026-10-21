from datetime import datetime, timezone
import json
from pathlib import Path
import sqlite3

from .config import CONTRACT, ZERO, amount


def now():
    return datetime.now(timezone.utc).isoformat()


class IntegrityError(RuntimeError):
    pass


class Store:
    def __init__(self, path, readonly=False):
        self.path = path
        if not readonly:
            Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(f"file:{Path(path).resolve()}?mode=ro" if readonly else path, uri=readonly, timeout=30)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA foreign_keys=ON")
        if not readonly:
            self.db.execute("PRAGMA journal_mode=WAL")
            self.db.execute("PRAGMA synchronous=FULL")
            self.db.executescript(Path(__file__).with_name("schema.sql").read_text())

    def meta(self, key, default=None):
        row = self.db.execute("SELECT value FROM metadata WHERE key=?", (key,)).fetchone()
        return json.loads(row[0]) if row else default

    def set_meta(self, key, value):
        self.db.execute("INSERT INTO metadata VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, json.dumps(value)))

    def alert(self, code, message, severity="error"):
        with self.db:
            self.db.execute("INSERT INTO alerts(severity,code,message,created_at) VALUES (?,?,?,?)", (severity, code, message, now()))

    def state(self, raw_id, new):
        row = self.db.execute("SELECT state FROM log_state WHERE raw_id=?", (raw_id,)).fetchone()
        old = row[0] if row else None
        if old == new:
            return
        stamp = now()
        self.db.execute("INSERT INTO log_state VALUES (?,?,?) ON CONFLICT(raw_id) DO UPDATE SET state=excluded.state,updated_at=excluded.updated_at", (raw_id, new, stamp))
        self.db.execute("INSERT INTO state_history(raw_id,old_state,new_state,changed_at) VALUES (?,?,?,?)", (raw_id, old, new, stamp))

    def raw(self, log, source):
        payload = json.dumps(log, sort_keys=True, separators=(",", ":"))
        key = (56, log["blockHash"].lower(), int(log["logIndex"], 16))
        existing = self.db.execute("SELECT id,payload FROM raw_logs WHERE chain_id=? AND block_hash=? AND log_index=?", key).fetchone()
        if existing:
            if existing["payload"] != payload:
                raise IntegrityError("Conflicting payload for one block log")
            return existing["id"]
        row = self.db.execute("INSERT INTO raw_logs(chain_id,contract,block_number,block_hash,tx_hash,tx_index,log_index,payload,observed_at,source) VALUES (?,?,?,?,?,?,?,?,?,?)", (56, CONTRACT, int(log["blockNumber"], 16), key[1], log["transactionHash"].lower(), int(log["transactionIndex"], 16), key[2], payload, now(), source))
        return row.lastrowid

    def initialize(self, metadata):
        with self.db:
            old = self.meta("token")
            if old and old != metadata:
                raise IntegrityError("Existing ledger configuration disagrees with chain identity")
            self.set_meta("token", metadata)
            if self.meta("cursor") is None:
                self.set_meta("cursor", {"number": metadata["deployment_block"] - 1, "hash": metadata["predeployment_hash"]})
                self.set_meta("supply_raw", "0")

    def update_balance(self, address, incoming, outgoing, block):
        if address == ZERO:
            return
        row = self.db.execute("SELECT * FROM balances WHERE address=?", (address,)).fetchone()
        balance = int(row["balance_raw"]) if row else 0
        balance += incoming - outgoing
        if balance < 0:
            raise IntegrityError(f"Negative reconstructed balance for {address}: history incomplete or token semantics unsupported")
        inflow = (int(row["inflow_raw"]) if row else 0) + incoming
        outflow = (int(row["outflow_raw"]) if row else 0) + outgoing
        count = (row["event_count"] if row else 0) + 1
        first = row["first_block"] if row else block
        self.db.execute("INSERT INTO balances VALUES (?,?,?,?,?,?,?) ON CONFLICT(address) DO UPDATE SET balance_raw=excluded.balance_raw,inflow_raw=excluded.inflow_raw,outflow_raw=excluded.outflow_raw,event_count=excluded.event_count,last_block=excluded.last_block", (address, str(balance), str(inflow), str(outflow), count, first, block))

    def apply(self, start, end, end_hash, logs, transfers, source):
        # All source validation must complete before this transaction begins.
        with self.db:
            cursor = self.meta("cursor")
            if start != cursor["number"] + 1:
                raise IntegrityError("Non-contiguous commit rejected")
            batch_id = self.db.execute("INSERT INTO batches(start_block,end_block,end_hash,source,log_count,observed_at) VALUES (?,?,?,?,?,?)", (start, end, end_hash, source, len(logs), now())).lastrowid
            raw_ids = {}
            for log in logs:
                raw_id = self.raw(log, source)
                raw_ids[(log["blockHash"].lower(), int(log["logIndex"], 16))] = raw_id
                self.state(raw_id, "finalized")
            supply = int(self.meta("supply_raw", "0"))
            for transfer in transfers:
                raw_id = raw_ids[(transfer["block_hash"], transfer["log_index"])]
                value = transfer["value"]
                self.db.execute("INSERT INTO transfers VALUES (?,?,?,?,?,?,?,?,?,?)", (raw_id, batch_id, 56, transfer["tx_hash"], transfer["log_index"], transfer["block"], transfer["time"], transfer["from"], transfer["to"], str(value)))
                sender, receiver = transfer["from"], transfer["to"]
                if sender == receiver:
                    self.update_balance(sender, value, value, transfer["block"])
                else:
                    self.update_balance(sender, 0, value, transfer["block"])
                    self.update_balance(receiver, value, 0, transfer["block"])
                supply += (value if sender == ZERO else 0) - (value if receiver == ZERO else 0)
            if supply < 0:
                raise IntegrityError("Negative reconstructed total supply")
            self.set_meta("supply_raw", str(supply))
            self.set_meta("cursor", {"number": end, "hash": end_hash})
            self.set_meta("last_commit_at", now())
            self.set_meta("last_error", None)
            # Keep gap evidence, but resolve the warning once contiguous history covers it.
            for gap in self.db.execute("SELECT start_block,end_block FROM live_gaps WHERE end_block<=?", (end,)):
                self.db.execute("UPDATE alerts SET resolved_at=? WHERE code='live_gap' AND resolved_at IS NULL AND message=?",
                                (now(), f"Uncovered recent interval {gap['start_block']}-{gap['end_block']}; resuming a new observed segment"))

    def stage(self, logs, finalized, head, source):
        with self.db:
            current = set()
            for log in logs:
                raw_id = self.raw(log, source)
                self.state(raw_id, "pending")
                current.add(raw_id)
            for row in self.db.execute("SELECT raw_id FROM log_state WHERE state='pending'").fetchall():
                if row[0] not in current:
                    self.state(row[0], "orphaned")
            self.set_meta("pending_window", {"from": finalized + 1, "to": head})

    def summary(self):
        balances = self.db.execute("SELECT balance_raw FROM balances").fetchall()
        count = sum(int(row[0]) > 0 for row in balances)
        total = sum(int(row[0]) for row in balances)
        rec = self.db.execute("SELECT report FROM reconciliations ORDER BY id DESC LIMIT 1").fetchone()
        cursor = self.meta("cursor")
        network = self.meta("network")
        complete = bool(self.meta("caught_up_at"))
        full_audit = self.meta("full_audit")
        error = self.meta("last_error")
        if self.meta("halted", False):
            phase = "halted"
        elif error:
            phase = "rpc_error"
        elif not complete or (network and cursor and network["finalized"] - cursor["number"] > 50):
            phase = "backfill" if self.meta("last_commit_at") else "awaiting_history"
        elif not full_audit or full_audit.get("status") != "passed":
            phase = "awaiting_full_reconciliation"
        else:
            phase = "following"
        coverage_start = self.meta("token", {}).get("deployment_block")
        remaining = max(0, network["finalized"] - cursor["number"]) if network and cursor else None
        coverage_percent = None
        if network and cursor and coverage_start is not None:
            total_blocks = max(1, network["finalized"] - coverage_start + 1)
            coverage_percent = round(100 * max(0, cursor["number"] - coverage_start + 1) / total_blocks, 4)
        return {
            "token": self.meta("token"), "cursor": self.meta("cursor"),
            "network": self.meta("network"), "last_commit_at": self.meta("last_commit_at"),
            "last_heartbeat_at": self.meta("last_heartbeat_at"), "last_error": self.meta("last_error"),
            "halted": self.meta("halted", False), "complete_history": bool(self.meta("caught_up_at")),
            "caught_up_at": self.meta("caught_up_at"), "pending_window": self.meta("pending_window"),
            "raw_logs": self.db.execute("SELECT count(*) FROM raw_logs").fetchone()[0],
            "finalized_transfers": self.db.execute("SELECT count(*) FROM transfers").fetchone()[0],
            "positive_balance_addresses": count, "balance_sum_raw": str(total), "balance_sum_mha": amount(total),
            "reconstructed_supply_raw": self.meta("supply_raw"),
            "latest_reconciliation": json.loads(rec[0]) if rec else None,
            "phase": phase, "full_audit": full_audit,
            "audit_progress": self.audit_progress(), "audit_last_error": self.meta("audit_last_error"),
            "audit_request_inflight": self.meta("audit_request_inflight", False),
            "history_coverage": {"from": coverage_start, "through": cursor["number"] if cursor else None, "remaining_blocks": remaining, "percent": coverage_percent},
            "live": self.live_summary(), "public_nodes": self.meta("public_nodes"),
            "worker_mode": self.meta("worker_mode"), "history_request_inflight": self.meta("history_request_inflight"),
            "pending_logs": self.db.execute("SELECT count(*) FROM log_state WHERE state='pending'").fetchone()[0],
            "unresolved_alerts": self.db.execute("SELECT count(*) FROM alerts WHERE resolved_at IS NULL").fetchone()[0],
        }

    def capture(self, start, end, end_hash, logs, transfers, source, reset=False):
        with self.db:
            cursor = self.meta("live_cursor")
            if cursor and start != cursor["number"] + 1:
                if not reset or start <= cursor["number"] + 1:
                    raise IntegrityError("Non-contiguous live capture without explicit gap")
                gap_start, gap_end = cursor["number"] + 1, start - 1
                self.db.execute("INSERT INTO live_gaps(start_block,end_block,reason,recorded_at) VALUES (?,?,?,?)", (gap_start, gap_end, "Public recent-block window exceeded; historical backfill still required", now()))
                self.db.execute("INSERT INTO alerts(severity,code,message,created_at) VALUES (?,?,?,?)", ("warning", "live_gap", f"Uncovered recent interval {gap_start}-{gap_end}; resuming a new observed segment", now()))
            batch = self.db.execute("INSERT INTO live_batches(start_block,end_block,end_hash,source,log_count,observed_at) VALUES (?,?,?,?,?,?)", (start, end, end_hash, source, len(logs), now())).lastrowid
            raw_ids = {}
            for log in logs:
                raw_id = self.raw(log, source)
                self.state(raw_id, "finalized")
                raw_ids[(log["blockHash"], int(log["logIndex"], 16))] = raw_id
            for transfer in transfers:
                self.db.execute("INSERT INTO live_transfers VALUES (?,?,?,?,?,?,?,?,?)", (raw_ids[(transfer["block_hash"], transfer["log_index"])], batch, transfer["tx_hash"], transfer["log_index"], transfer["block"], transfer["time"], transfer["from"], transfer["to"], str(transfer["value"])))
            if self.meta("live_started_from") is None:
                self.set_meta("live_started_from", start)
            self.set_meta("live_cursor", {"number": end, "hash": end_hash})
            self.set_meta("live_last_commit_at", now())
            self.set_meta("live_last_error", None)

    def live_summary(self):
        cursor = self.meta("live_cursor")
        network = self.meta("network")
        lag = network["finalized"] - cursor["number"] if cursor and network else None
        return {"scope": "Recent finalized observations only; not a complete historical ledger or reconstructed balances",
                "started_from": self.meta("live_started_from"), "cursor": cursor,
                "lag_blocks": lag, "last_commit_at": self.meta("live_last_commit_at"),
                "last_heartbeat_at": self.meta("live_heartbeat_at"), "last_error": self.meta("live_last_error"),
                "finalized_transfers": self.db.execute("SELECT count(*) FROM live_transfers").fetchone()[0],
                "covered_batches": self.db.execute("SELECT count(*) FROM live_batches").fetchone()[0],
                "gaps": [dict(row, covered_by_history=bool(self.meta("cursor") and self.meta("cursor")["number"] >= row["end_block"]))
                         for row in self.db.execute("SELECT * FROM live_gaps ORDER BY id")]}

    def audit_progress(self):
        row = self.db.execute("SELECT * FROM audit_jobs WHERE status='running' ORDER BY id DESC LIMIT 1").fetchone()
        if not row:
            return None
        checked = self.db.execute("SELECT count(*) FROM audit_balances WHERE job_id=? AND onchain_raw IS NOT NULL", (row["id"],)).fetchone()[0]
        return dict(row, addresses_checked=checked)

    def start_audit(self):
        active = self.audit_progress()
        if active:
            return active
        with self.db:
            cursor = self.meta("cursor")
            balances = self.db.execute("SELECT balance_raw FROM balances").fetchall()
            total = sum(int(row[0]) for row in balances)
            job_id = self.db.execute("INSERT INTO audit_jobs(block_number,block_hash,started_at,status,supply_raw,ledger_sum_raw,addresses_known) VALUES (?,?,?,'running',?,?,?)",
                                     (cursor["number"], cursor["hash"], now(), self.meta("supply_raw"), str(total), len(balances))).lastrowid
            self.db.execute("INSERT INTO audit_balances(job_id,address,balance_raw) SELECT ?,address,balance_raw FROM balances", (job_id,))
        return self.audit_progress()

    def commit_audit_chunk(self, result):
        with self.db:
            job = self.db.execute("SELECT * FROM audit_jobs WHERE id=? AND status='running'", (result["job_id"],)).fetchone()
            if not job or result["block_hash"] != job["block_hash"]:
                raise IntegrityError("Audit result does not match its immutable snapshot")
            for address, value in result["balances"]:
                row = self.db.execute("SELECT balance_raw,onchain_raw FROM audit_balances WHERE job_id=? AND address=?", (job["id"], address)).fetchone()
                if not row or (row["onchain_raw"] is not None and row["onchain_raw"] != str(value)):
                    raise IntegrityError("Conflicting audit result")
                self.db.execute("UPDATE audit_balances SET onchain_raw=? WHERE job_id=? AND address=?", (str(value), job["id"], address))
            pending = self.db.execute("SELECT count(*) FROM audit_balances WHERE job_id=? AND onchain_raw IS NULL", (job["id"],)).fetchone()[0]
            differences = [dict(address=row["address"], ledger_raw=row["balance_raw"], onchain_raw=row["onchain_raw"])
                           for row in self.db.execute("SELECT * FROM audit_balances WHERE job_id=? AND onchain_raw IS NOT NULL AND balance_raw!=onchain_raw", (job["id"],))]
            supply = result["supply_raw"]
            matched = str(supply) == job["supply_raw"] == job["ledger_sum_raw"] and not differences
            self.set_meta("audit_last_error", None)
            if pending and matched:
                return None
            report = {"block_number": job["block_number"], "block_hash": job["block_hash"], "checked_at": now(),
                      "started_at": job["started_at"], "mode": "full-known-addresses", "addresses_checked": job["addresses_known"] - pending,
                      "addresses_known": job["addresses_known"], "ledger_sum_raw": job["ledger_sum_raw"],
                      "onchain_supply_raw": str(supply), "onchain_supply_mha": amount(supply),
                      "status": "passed" if matched and not pending else "failed", "differences": differences,
                      "scope": "All known addresses frozen at this checkpoint, including zero balances; unseen omitted addresses require independent verification."}
            self.db.execute("UPDATE audit_jobs SET status=?,finished_at=? WHERE id=?", (report["status"], report["checked_at"], job["id"]))
            # Same transaction as the last checked row; no partial audit is marked passed.
            self.db.execute("INSERT INTO reconciliations(block_number,block_hash,mode,status,checked_at,report) VALUES (?,?,?,?,?,?)",
                            (report["block_number"], report["block_hash"], report["mode"], report["status"], report["checked_at"], json.dumps(report)))
            self.set_meta("full_audit", report)
        if report["status"] != "passed":
            self.alert("reconciliation_failed", f"Reconciliation failed at block {report['block_number']}")
        return report

    def save_reconciliation(self, report):
        with self.db:
            self.db.execute("INSERT INTO reconciliations(block_number,block_hash,mode,status,checked_at,report) VALUES (?,?,?,?,?,?)", (report["block_number"], report["block_hash"], report["mode"], report["status"], report["checked_at"], json.dumps(report)))
            if report["mode"] == "full-known-addresses":
                self.set_meta("full_audit", report)
        if report["status"] != "passed":
            self.alert("reconciliation_failed", f"Reconciliation failed at block {report['block_number']}")

    def holders(self, limit=100, offset=0):
        # TEXT integer comparison by digit length, then lexical order (nonnegative).
        rows = self.db.execute("SELECT * FROM balances WHERE balance_raw!='0' ORDER BY length(balance_raw) DESC,balance_raw DESC,address LIMIT ? OFFSET ?", (limit, offset))
        return [dict(row, balance_mha=amount(row["balance_raw"])) for row in rows]

    def close(self):
        self.db.close()
