from datetime import datetime, timezone
import hashlib
import json
import re
import time
import urllib.request

from .config import CONTRACT, TRANSFER, ZERO, amount
from .rpc import RPCError
from .store import IntegrityError, now


def number(value):
    if not isinstance(value, str) or not re.fullmatch(r"0x[0-9a-fA-F]+", value):
        raise IntegrityError("Invalid hexadecimal quantity")
    return int(value, 16)


def hash32(value):
    if not isinstance(value, str) or not re.fullmatch(r"0x[0-9a-fA-F]{64}", value):
        raise IntegrityError("Invalid 32-byte hash")
    return value.lower()


def normalize_logs(logs, start, end):
    if not isinstance(logs, list):
        raise IntegrityError("Logs response is not an array")
    unique = {}
    for original in logs:
        if original.get("removed"):
            raise IntegrityError("Removed log in a canonical range")
        if str(original.get("address", "")).lower() != CONTRACT:
            raise IntegrityError("Foreign contract in filtered logs")
        log = {"address": CONTRACT, "removed": False}
        for key in ("blockNumber", "transactionIndex", "logIndex"):
            log[key] = hex(number(original.get(key)))
        for key in ("blockHash", "transactionHash"):
            log[key] = hash32(original.get(key))
        if not start <= number(log["blockNumber"]) <= end:
            raise IntegrityError("Log outside requested range")
        topics = original.get("topics")
        if not isinstance(topics, list) or len(topics) > 4:
            raise IntegrityError("Invalid log topics")
        log["topics"] = [hash32(topic) for topic in topics]
        data = original.get("data")
        if not isinstance(data, str) or not re.fullmatch(r"0x(?:[0-9a-fA-F]{2})*", data):
            raise IntegrityError("Invalid event data")
        log["data"] = data.lower()
        key = (log["blockHash"], number(log["logIndex"]))
        if key in unique and unique[key] != log:
            raise IntegrityError("Duplicate log with conflicting data")
        unique[key] = log
    result = sorted(unique.values(), key=lambda log: (number(log["blockNumber"]), number(log["transactionIndex"]), number(log["logIndex"])))
    tx_keys = set()
    for log in result:
        key = (log["transactionHash"], number(log["logIndex"]))
        if key in tx_keys:
            raise IntegrityError("One transaction/log has competing block hashes")
        tx_keys.add(key)
    return result


def decode_transfer(log, header):
    topics = log["topics"]
    if not topics or topics[0] != TRANSFER:
        return None
    if len(topics) != 3 or len(log["data"]) != 66:
        raise IntegrityError("Malformed Transfer event")
    if any(topic[2:26] != "0" * 24 for topic in topics[1:]):
        raise IntegrityError("Nonzero ABI address padding")
    return {
        "block": number(log["blockNumber"]), "block_hash": log["blockHash"],
        "tx_hash": log["transactionHash"], "log_index": number(log["logIndex"]),
        "from": "0x" + topics[1][-40:], "to": "0x" + topics[2][-40:],
        "value": int(log["data"], 16),
        "time": datetime.fromtimestamp(number(header["timestamp"]), timezone.utc).isoformat(),
    }


def abi_string(value):
    raw = bytes.fromhex(value[2:])
    if len(raw) == 32:
        return raw.rstrip(b"\0").decode()
    offset = int.from_bytes(raw[:32], "big")
    if offset + 32 > len(raw):
        raise IntegrityError("Invalid string ABI offset")
    size = int.from_bytes(raw[offset:offset + 32], "big")
    if offset + 32 + size > len(raw):
        raise IntegrityError("Invalid string ABI length")
    return raw[offset + 32:offset + 32 + size].decode()


class Indexer:
    def __init__(self, config, rpc, store):
        self.config, self.rpc, self.store = config, rpc, store
        self.chunk = config.chunk
        self.stop_requested = False

    def initialize(self):
        if number(self.rpc.call("eth_chainId", [])) != 56:
            raise IntegrityError("Wrong chain: expected BNB Smart Chain mainnet (56)")
        if self.store.meta("token"):
            return self.store.meta("token")
        head = self.rpc.block("finalized")
        latest = number(head["number"])
        code = self.rpc.call("eth_getCode", [CONTRACT, hex(latest)])
        if code in ("0x", "0x0", ""):
            raise IntegrityError("Contract does not exist at finalized head")
        decimals = self.rpc.uint("0x313ce567", latest)
        if decimals != 18:
            raise IntegrityError("Unexpected MHA precision")
        symbol = abi_string(self.rpc.call("eth_call", [{"to": CONTRACT, "data": "0x95d89b41"}, hex(latest)]))
        name = abi_string(self.rpc.call("eth_call", [{"to": CONTRACT, "data": "0x06fdde03"}, hex(latest)]))
        if symbol != "MHA":
            raise IntegrityError("Unexpected token symbol")
        deployment = self.config.deployment_block
        if deployment is None:
            low, high = 0, latest
            while low < high:
                middle = (low + high) // 2
                historical = self.rpc.call("eth_getCode", [CONTRACT, hex(middle)])
                if historical in ("0x", "0x0", ""):
                    low = middle + 1
                else:
                    high = middle
            deployment = low
        if deployment <= 0 or deployment > latest:
            raise IntegrityError("Invalid deployment boundary")
        before = self.rpc.call("eth_getCode", [CONTRACT, hex(deployment - 1)])
        at = self.rpc.call("eth_getCode", [CONTRACT, hex(deployment)])
        if before not in ("0x", "0x0", "") or at in ("0x", "0x0", ""):
            raise IntegrityError("Deployment boundary not confirmed by historical code")
        preheader = self.rpc.block(deployment - 1)
        deployheader = self.rpc.block(deployment)
        if deployheader["parentHash"].lower() != preheader["hash"].lower():
            raise IntegrityError("Deployment headers are not contiguous")
        metadata = {
            "chain_id": 56, "contract": CONTRACT, "symbol": symbol, "name": name, "decimals": decimals,
            "deployment_block": deployment, "deployment_hash": hash32(deployheader["hash"]),
            "deployment_time": datetime.fromtimestamp(number(deployheader["timestamp"]), timezone.utc).isoformat(),
            "predeployment_hash": hash32(preheader["hash"]),
            "runtime_code_sha256": hashlib.sha256(bytes.fromhex(code[2:])).hexdigest(),
        }
        self.store.initialize(metadata)
        return metadata

    def check_cursor(self, persist_halt=True):
        cursor = self.store.meta("cursor")
        if hash32(self.rpc.block(cursor["number"])["hash"]) != cursor["hash"]:
            # A finalized conflict is not silently repaired: preserve evidence and stop.
            if persist_halt:
                with self.store.db:
                    self.store.set_meta("halted", True)
            raise IntegrityError("Finalized checkpoint hash changed; indexing halted for replay/recovery")

    def fetch_range(self, start, end, checkpoint=None):
        end_header = self.rpc.block(end)
        start_header = end_header if start == end else self.rpc.block(start)
        cursor = checkpoint if checkpoint is not None else self.store.meta("cursor")
        if start == cursor["number"] + 1 and hash32(start_header["parentHash"]) != cursor["hash"]:
            raise IntegrityError("Batch parent does not match stored checkpoint")
        original = self.rpc.call("eth_getLogs", [{"address": CONTRACT, "fromBlock": hex(start), "toBlock": hex(end)}])
        self.log_source = getattr(self.rpc, "log_source", None) or self.rpc.source
        if not isinstance(original, list):
            raise IntegrityError("Logs response is not an array")
        if len(original) >= self.config.log_limit:
            raise RPCError("eth_getLogs", "range", "response size at configured log cap; subdivide")
        logs = normalize_logs(original, start, end)
        headers = {start: start_header, end: end_header}
        transfers = []
        for log in logs:
            height = number(log["blockNumber"])
            if height not in headers:
                headers[height] = self.rpc.block(height)
            header = headers[height]
            if hash32(header["hash"]) != log["blockHash"]:
                raise IntegrityError("Event/header hash conflict during range read")
            transfer = decode_transfer(log, header)
            if transfer:
                transfers.append(transfer)
        # Confirm the range didn't change while querying logs and timestamps.
        if hash32(self.rpc.block(end)["hash"]) != hash32(end_header["hash"]):
            raise IntegrityError("Chain changed while reading batch")
        return logs, transfers, hash32(end_header["hash"])

    def sync_once(self, max_batches=None, on_batch=None):
        self.initialize()
        if self.store.meta("halted", False):
            raise IntegrityError("Ledger halted; use a fresh DB and replay after investigation")
        self.check_cursor()
        finalized = self.rpc.block("finalized")  # Fail closed: no invented confirmation count.
        latest = self.rpc.block("latest")
        head, target = number(latest["number"]), number(finalized["number"])
        if target > head:
            raise RPCError("eth_getBlockByNumber", -32603, "RPC returned inconsistent latest/finalized heads")
        if target < self.store.meta("cursor")["number"]:
            raise RPCError("eth_getBlockByNumber", -32603, "RPC finalized head is behind stored checkpoint")
        with self.store.db:
            self.store.set_meta("network", {"latest": head, "finalized": target, "observed_at": now(), "source": self.rpc.source})
            self.store.set_meta("last_heartbeat_at", now())
        committed = 0
        while not self.stop_requested:
            start = self.store.meta("cursor")["number"] + 1
            if start > target or (max_batches is not None and committed >= max_batches):
                break
            end = min(start + self.chunk - 1, target)
            try:
                logs, transfers, end_hash = self.fetch_range(start, end)
            except RPCError as exc:
                if exc.range_limit and self.chunk > 1:
                    self.chunk = max(1, self.chunk // 2)
                    continue
                raise
            self.store.apply(start, end, end_hash, logs, transfers, self.log_source)
            committed += 1
            if on_batch:
                on_batch({"start": start, "end": end, "target": target, "logs": len(logs), "transfers": len(transfers)})
            self.chunk = min(self.config.chunk, max(1, self.chunk * 2))
        if self.store.meta("cursor")["number"] >= target:
            with self.store.db:
                self.store.set_meta("caught_up_at", now())
            if target < head and head - target <= self.config.pending_limit:
                try:
                    end_header = self.rpc.block(head)
                    pending_result = self.rpc.call("eth_getLogs", [{"address": CONTRACT, "fromBlock": hex(target + 1), "toBlock": hex(head)}])
                    if len(pending_result) >= self.config.log_limit:
                        raise RPCError("eth_getLogs", "range", "pending response size at configured log cap")
                    pending = normalize_logs(pending_result, target + 1, head)
                    # Validate pending event blocks, not just the tail anchor.
                    for height in {number(log["blockNumber"]) for log in pending}:
                        header = self.rpc.block(height)
                        if any(log["blockHash"] != hash32(header["hash"]) for log in pending if number(log["blockNumber"]) == height):
                            raise IntegrityError("Pending event/header conflict")
                    if hash32(self.rpc.block(head)["hash"]) == hash32(end_header["hash"]):
                        self.store.stage(pending, target, head, self.rpc.source)
                except (RPCError, IntegrityError) as exc:
                    # Pending preview failure doesn't invalidate confirmed ledger balances.
                    self.store.alert("pending_preview", str(exc), "warning")
            elif target == head:
                self.store.stage([], target, head, self.rpc.source)
        return committed

    def reconcile(self, full=False, sample_size=25, persist=True):
        self.check_cursor(persist_halt=persist)
        cursor = self.store.meta("cursor")
        block = cursor["number"]
        rows = list(self.store.db.execute("SELECT address,balance_raw FROM balances ORDER BY address"))
        computed = sum(int(row["balance_raw"]) for row in rows)
        supply = self.rpc.uint("0x18160ddd", block)
        selected = rows if full else sorted(rows, key=lambda row: int(row["balance_raw"]), reverse=True)[:sample_size]
        differences = []
        for row in selected:
            onchain = self.rpc.uint("0x70a08231" + row["address"][2:].zfill(64), block)
            if onchain != int(row["balance_raw"]):
                differences.append({"address": row["address"], "ledger_raw": row["balance_raw"], "onchain_raw": str(onchain)})
        self.check_cursor(persist_halt=persist)
        matched = computed == supply == int(self.store.meta("supply_raw")) and not differences
        report = {
            "block_number": block, "block_hash": cursor["hash"], "checked_at": now(),
            "mode": "full-known-addresses" if full else "top-balance-sample",
            "addresses_checked": len(selected), "addresses_known": len(rows),
            "ledger_sum_raw": str(computed), "onchain_supply_raw": str(supply), "onchain_supply_mha": amount(supply),
            "status": "passed" if matched else "failed", "differences": differences,
            "scope": "Known addresses discovered from this contract's logs; unseen omitted addresses require independent source verification.",
        }
        if persist:
            self.store.save_reconciliation(report)
        return report

    def import_disclosure(self):
        url = "https://w3.magne.ai/api/v1/mha/supply"
        request = urllib.request.Request(url, headers={"User-Agent": "MHA-Ledger/1.0"})
        with urllib.request.urlopen(request, timeout=self.config.timeout) as response:
            reply = json.load(response)
        token = reply["data"]["token"]
        if token["contract"].lower() != CONTRACT or token["chainId"] != 56:
            raise IntegrityError("Official disclosure token mismatch")
        block = int(reply["_meta"]["blockNumber"])
        with self.store.db:
            stamp = now()
            evidence = self.store.db.execute("INSERT INTO evidence(source,fetched_at,payload) VALUES (?,?,?)", (url, stamp, json.dumps(reply))).lastrowid
            labels = [(wallet["address"], wallet["category"], wallet["label"], wallet["treatment"]) for wallet in reply["data"]["wallets"]]
            labels += [(wallet["address"], "exchange-custody", wallet["exchange"] + " pooled custody", "observation-only") for wallet in reply["data"].get("evidence", {}).get("exchangeCustodyWallets", [])]
            for address, category, label, treatment in labels:
                if not re.fullmatch(r"0x[0-9a-fA-F]{40}", address):
                    raise IntegrityError("Invalid disclosed wallet address")
                self.store.db.execute("INSERT OR IGNORE INTO labels(address,category,label,treatment,source,effective_block,evidence_id) VALUES (?,?,?,?,?,?,?)", (address.lower(), category, label, treatment, url, block, evidence))
        return {"evidence_id": evidence, "labels": len(labels), "disclosure_block": block, "authority": "Project-declared wallet classification, not independently proven identity"}

    def run(self, on_batch=None):
        last_reconcile = 0
        while not self.stop_requested:
            try:
                self.sync_once(on_batch=on_batch)
                if self.store.meta("caught_up_at") and self.needs_full_audit():
                    report = self.reconcile(full=True)
                    if report["status"] != "passed":
                        raise IntegrityError("Full-known-address reconciliation failed; indexing halted")
                    last_reconcile = time.monotonic()
                elif self.store.meta("caught_up_at") and time.monotonic() - last_reconcile >= self.config.reconcile_interval:
                    report = self.reconcile()
                    if report["status"] != "passed":
                        raise IntegrityError("Balance/supply sample reconciliation failed; indexing halted")
                    last_reconcile = time.monotonic()
                with self.store.db:
                    self.store.set_meta("last_error", None)
            except IntegrityError as exc:
                with self.store.db:
                    self.store.set_meta("halted", True)
                    self.store.set_meta("last_error", str(exc))
                self.store.alert("integrity_halt", str(exc))
                raise
            except RPCError as exc:
                with self.store.db:
                    self.store.set_meta("last_error", str(exc))
                    self.store.set_meta("last_heartbeat_at", now())
                print(json.dumps({"error": str(exc), "retry_in_seconds": max(30, self.config.poll)}), flush=True)
                for _ in range(int(max(30, self.config.poll))):
                    if self.stop_requested:
                        return
                    time.sleep(1)
                continue
            for _ in range(int(self.config.poll)):
                if self.stop_requested:
                    return
                time.sleep(1)

    def needs_full_audit(self):
        audit = self.store.meta("full_audit")
        if not audit or audit.get("status") != "passed":
            return True
        age = (datetime.now(timezone.utc) - datetime.fromisoformat(audit["checked_at"])).total_seconds()
        return age >= self.config.full_reconcile_interval
