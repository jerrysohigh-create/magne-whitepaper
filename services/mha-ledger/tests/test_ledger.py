import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
import sqlite3
import tempfile
import unittest

from mha.config import Config, CONTRACT, TRANSFER, ZERO, amount
from mha.indexer import Indexer, normalize_logs, decode_transfer
from mha.rpc import RPCError
from mha.rpc import RPC
from mha.store import Store, IntegrityError
from mha.__main__ import WriterLock, export
from mha.preflight import preflight, DEPLOYMENT, DEPLOYMENT_HASH

A = "0x" + "a" * 40
B = "0x" + "b" * 40
C = "0x" + "c" * 40


def h(n):
    return "0x" + format(n, "064x")


def event(block, sender, receiver, value, index=0, branch=0, topic=TRANSFER):
    return {"address": CONTRACT, "blockNumber": hex(block), "blockHash": h(block + branch),
            "transactionHash": h(1000 + block + index + branch), "transactionIndex": "0x0", "logIndex": hex(index),
            "topics": [topic, "0x" + sender[2:].zfill(64), "0x" + receiver[2:].zfill(64)],
            "data": h(value), "removed": False}


class FakeRPC:
    source = "fake.test"

    def __init__(self):
        self.final = 2
        self.latest = 3
        self.branches = {}
        self.events = [event(1, ZERO, A, 100), event(2, A, B, 30)]
        self.range_cap = 10000
        self.fail_logs = False
        self.queries = []

    def block(self, number):
        n = self.final if number == "finalized" else self.latest if number == "latest" else number
        return {"number": hex(n), "hash": h(n + self.branches.get(n, 0)),
                "parentHash": h(n - 1 + self.branches.get(n - 1, 0)), "timestamp": hex(1700000000 + n)}

    def call(self, method, params):
        if method == "eth_chainId":
            return "0x38"
        if method != "eth_getLogs":
            raise AssertionError(method)
        request = params[0]
        start, end = int(request["fromBlock"], 16), int(request["toBlock"], 16)
        self.queries.append((start, end))
        if self.fail_logs:
            raise RPCError(method, 401, "denied")
        if end - start + 1 > self.range_cap:
            raise RPCError(method, -32005, "block range limit exceeded")
        return [log for log in self.events if start <= int(log["blockNumber"], 16) <= end]

    def uint(self, selector, block):
        supply, balances = 0, {}
        for log in self.events:
            if int(log["blockNumber"], 16) > block or log["topics"][0] != TRANSFER:
                continue
            sender = "0x" + log["topics"][1][-40:]
            receiver = "0x" + log["topics"][2][-40:]
            value = int(log["data"], 16)
            if sender == ZERO:
                supply += value
            else:
                balances[sender] = balances.get(sender, 0) - value
            if receiver == ZERO:
                supply -= value
            else:
                balances[receiver] = balances.get(receiver, 0) + value
        if selector == "0x18160ddd":
            return supply
        return balances.get("0x" + selector[-40:], 0)


class LedgerTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.path = str(Path(self.temp.name) / "ledger.sqlite3")
        self.store = Store(self.path)
        self.store.initialize({"chain_id": 56, "contract": CONTRACT, "decimals": 18,
                               "deployment_block": 1, "predeployment_hash": h(0)})
        self.config = Config("https://fake.test", db_path=self.path, chunk=2)
        self.rpc = FakeRPC()
        self.indexer = Indexer(self.config, self.rpc, self.store)

    def tearDown(self):
        self.store.close()
        self.temp.cleanup()

    def balance(self, address):
        row = self.store.db.execute("SELECT balance_raw FROM balances WHERE address=?", (address,)).fetchone()
        return int(row[0]) if row else 0

    def test_finalized_balances_and_full_reconciliation(self):
        self.indexer.sync_once()
        self.assertEqual((self.balance(A), self.balance(B)), (70, 30))
        report = self.indexer.reconcile(full=True)
        self.assertEqual(report["status"], "passed")
        self.assertEqual(report["addresses_checked"], 2)

    def test_repeated_sync_is_idempotent(self):
        self.indexer.sync_once()
        self.indexer.sync_once()
        self.assertEqual(self.store.summary()["finalized_transfers"], 2)
        self.assertEqual(self.balance(A), 70)

    def test_restart_and_contiguous_resume(self):
        self.indexer.chunk = self.config.chunk = 1
        self.indexer.sync_once(max_batches=1)
        self.assertEqual(self.store.meta("cursor")["number"], 1)
        self.store.close()
        self.store = Store(self.path)
        Indexer(self.config, self.rpc, self.store).sync_once()
        self.assertEqual(self.store.meta("cursor")["number"], 2)
        self.assertEqual(self.balance(B), 30)

    def test_provider_failure_does_not_advance_checkpoint(self):
        self.rpc.fail_logs = True
        with self.assertRaises(RPCError):
            self.indexer.sync_once()
        self.assertEqual(self.store.meta("cursor")["number"], 0)
        self.assertEqual(self.store.summary()["raw_logs"], 0)

    def test_range_limit_adaptively_subdivides(self):
        self.rpc.range_cap = 1
        self.indexer.sync_once()
        self.assertIn((1, 1), self.rpc.queries)
        self.assertIn((2, 2), self.rpc.queries)
        self.assertEqual(self.balance(B), 30)

    def test_zero_event_blocks_still_advance(self):
        self.rpc.final = self.rpc.latest = 4
        self.indexer.sync_once()
        self.assertEqual(self.store.meta("cursor")["number"], 4)
        self.assertEqual(self.store.summary()["finalized_transfers"], 2)

    def test_uint256_is_exact_without_float_or_decimal_rounding(self):
        maximum = 2 ** 256 - 1
        self.rpc.events = [event(1, ZERO, A, maximum), event(2, A, B, maximum - 1)]
        self.indexer.sync_once()
        self.assertEqual(self.balance(A), 1)
        self.assertEqual(self.balance(B), maximum - 1)
        self.assertEqual(amount(maximum), str(maximum // 10 ** 18) + "." + str(maximum % 10 ** 18).zfill(18))

    def test_self_transfer_changes_gross_flows_without_net_balance(self):
        self.rpc.events[1] = event(2, A, A, 70)
        self.indexer.sync_once()
        self.assertEqual(self.balance(A), 100)
        row = self.store.db.execute("SELECT inflow_raw,outflow_raw FROM balances WHERE address=?", (A,)).fetchone()
        self.assertEqual(tuple(row), ("170", "70"))

    def test_burn_changes_supply_and_excludes_zero_address_balance(self):
        self.rpc.events[1] = event(2, A, ZERO, 40)
        self.indexer.sync_once()
        self.assertEqual(self.balance(A), 60)
        self.assertEqual(self.store.meta("supply_raw"), "60")
        self.assertEqual(self.balance(ZERO), 0)
        self.assertEqual(self.indexer.reconcile(True)["status"], "passed")

    def test_approval_is_preserved_but_does_not_credit_balance(self):
        self.rpc.events[1] = event(2, A, B, 30, topic=h(99))
        self.indexer.sync_once()
        self.assertEqual(self.store.summary()["raw_logs"], 2)
        self.assertEqual(self.store.summary()["finalized_transfers"], 1)
        self.assertEqual(self.balance(A), 100)

    def test_duplicate_provider_logs_are_deduplicated(self):
        self.rpc.events.append(dict(self.rpc.events[1]))
        self.indexer.sync_once()
        self.assertEqual(self.store.summary()["finalized_transfers"], 2)

    def test_conflicting_duplicate_log_is_rejected(self):
        log = self.rpc.events[1]
        other = dict(log, data=h(31))
        with self.assertRaises(IntegrityError):
            normalize_logs([log, other], 1, 2)

    def test_negative_balance_rolls_back_entire_batch(self):
        self.rpc.events[1] = event(2, A, B, 101)
        with self.assertRaises(IntegrityError):
            self.indexer.sync_once()
        self.assertEqual(self.balance(A), 0)
        self.assertEqual(self.store.meta("cursor")["number"], 0)
        self.assertEqual(self.store.db.execute("SELECT count(*) FROM batches").fetchone()[0], 0)

    def test_pending_reorg_preserves_orphaned_evidence(self):
        self.rpc.events.append(event(3, B, C, 10))
        self.indexer.sync_once()
        self.assertEqual(self.balance(C), 0)
        self.rpc.branches[3] = 2000
        self.rpc.events[2] = event(3, B, C, 5, branch=2000)
        self.indexer.sync_once()
        states = [row[0] for row in self.store.db.execute("SELECT s.state FROM raw_logs r JOIN log_state s ON s.raw_id=r.id WHERE block_number=3 ORDER BY r.id")]
        self.assertEqual(states, ["orphaned", "pending"])
        self.rpc.final = 3
        self.indexer.sync_once()
        self.assertEqual(self.balance(C), 5)
        self.assertEqual(self.store.summary()["finalized_transfers"], 3)

    def test_finalized_reorg_halts_and_preserves_balances(self):
        self.indexer.sync_once()
        self.rpc.branches[2] = 2000
        with self.assertRaises(IntegrityError):
            self.indexer.sync_once()
        self.assertTrue(self.store.meta("halted"))
        self.assertEqual(self.balance(A), 70)

    def test_event_header_mismatch_rejected_without_commit(self):
        self.rpc.events[0]["blockHash"] = h(9999)
        with self.assertRaises(IntegrityError):
            self.indexer.sync_once()
        self.assertEqual(self.store.meta("cursor")["number"], 0)

    def test_incomplete_batch_cannot_skip_block(self):
        with self.assertRaises(IntegrityError):
            self.store.apply(2, 2, h(2), [], [], "fake")

    def test_raw_log_update_and_delete_blocked_by_database(self):
        self.indexer.sync_once()
        with self.assertRaises(sqlite3.IntegrityError):
            self.store.db.execute("UPDATE raw_logs SET payload='{}'")
        self.store.db.rollback()
        with self.assertRaises(sqlite3.IntegrityError):
            self.store.db.execute("DELETE FROM raw_logs")
        self.store.db.rollback()

    def test_same_supply_but_corrupt_address_balance_fails_reconciliation(self):
        self.indexer.sync_once()
        with self.store.db:
            self.store.db.execute("UPDATE balances SET balance_raw='69' WHERE address=?", (A,))
            self.store.db.execute("UPDATE balances SET balance_raw='31' WHERE address=?", (B,))
        report = self.indexer.reconcile(True)
        self.assertEqual(report["status"], "failed")
        self.assertEqual(len(report["differences"]), 2)

    def test_single_writer_lock(self):
        with WriterLock(self.path):
            with self.assertRaises(IntegrityError):
                with WriterLock(self.path):
                    pass

    def test_export_snapshot_includes_raw_events(self):
        self.indexer.sync_once()
        directory = Path(export(self.store, Path(self.temp.name) / "exports"))
        self.assertEqual(json.loads((directory / "status.json").read_text())["finalized_transfers"], 2)
        self.assertEqual(len((directory / "raw_logs.jsonl").read_text().splitlines()), 2)

    def test_invalid_transfer_padding_rejected(self):
        log = dict(self.rpc.events[1])
        log["topics"] = [TRANSFER, h(2 ** 200), h(0)]
        with self.assertRaises(IntegrityError):
            decode_transfer(log, self.rpc.block(2))

    def test_wrong_contract_and_outside_range_rejected(self):
        with self.assertRaises(IntegrityError):
            normalize_logs([dict(self.rpc.events[0], address=A)], 1, 2)
        with self.assertRaises(IntegrityError):
            normalize_logs(self.rpc.events, 3, 4)

    def test_rpc_refuses_transaction_submission(self):
        with self.assertRaises(ValueError):
            RPC(self.config).call("eth_sendRawTransaction", ["0x"])

    def test_rpc_refuses_wrong_block_height(self):
        rpc = RPC(self.config)
        rpc.call = lambda *args: self.rpc.block(2)
        with self.assertRaises(RPCError):
            rpc.block(1)

    def test_stale_finalized_provider_does_not_halt_valid_ledger(self):
        self.indexer.sync_once()
        self.rpc.final = 1
        with self.assertRaises(RPCError):
            self.indexer.sync_once()
        self.assertFalse(self.store.meta("halted", False))
        self.assertEqual(self.store.meta("cursor")["number"], 2)

    def test_initial_follow_requires_full_address_audit(self):
        self.indexer.sync_once()
        self.assertTrue(self.indexer.needs_full_audit())
        self.indexer.reconcile(full=False)
        self.assertTrue(self.indexer.needs_full_audit())
        self.assertEqual(self.store.summary()["phase"], "awaiting_full_reconciliation")
        self.indexer.reconcile(full=True)
        self.assertFalse(self.indexer.needs_full_audit())
        self.assertEqual(self.store.summary()["phase"], "following")

    def test_full_audit_expires_and_failed_full_audit_needs_retry(self):
        self.indexer.sync_once()
        self.indexer.reconcile(full=True)
        audit = self.store.meta("full_audit")
        audit["checked_at"] = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        with self.store.db:
            self.store.set_meta("full_audit", audit)
        self.assertTrue(self.indexer.needs_full_audit())
        audit["checked_at"] = datetime.now(timezone.utc).isoformat()
        audit["status"] = "failed"
        with self.store.db:
            self.store.set_meta("full_audit", audit)
        self.assertTrue(self.indexer.needs_full_audit())

    def test_initial_zero_balances_are_not_reported_as_full_history(self):
        summary = self.store.summary()
        self.assertFalse(summary["complete_history"])
        self.assertIsNone(summary["full_audit"])
        self.assertEqual(summary["phase"], "awaiting_history")

    def test_failed_startup_audit_halts_worker(self):
        original = self.rpc.uint
        self.rpc.uint = lambda data, block: 101 if data == "0x18160ddd" else original(data, block)
        with self.assertRaises(IntegrityError):
            self.indexer.run()
        self.assertTrue(self.store.meta("halted"))
        self.assertEqual(self.store.meta("full_audit")["status"], "failed")

    def test_preflight_rejects_empty_deployment_history(self):
        self.rpc.call = lambda method, params: "0x38" if method == "eth_chainId" else []
        report = preflight(self.config, self.rpc)
        self.assertFalse(report["ready"])
        self.assertEqual(report["checks"][-1]["check"], "deployment_logs")

    def test_preflight_rejects_wrong_chain(self):
        self.rpc.call = lambda *args: "0x1"
        report = preflight(self.config, self.rpc)
        self.assertFalse(report["ready"])
        self.assertEqual(report["checks"][-1]["check"], "chain_identity")

    def test_preflight_validates_logs_state_and_finality(self):
        class Source:
            source = "fake-ready.test"

            def call(self, method, params):
                if method == "eth_chainId":
                    return "0x38"
                if method == "eth_getCode":
                    return "0x" if params[1] == hex(DEPLOYMENT - 1) else "0x60"
                if method == "eth_getLogs":
                    return [dict(event(DEPLOYMENT, ZERO, A, 100), blockHash=DEPLOYMENT_HASH)]
                raise AssertionError(method)

            def block(self, height):
                n = DEPLOYMENT + 2 if height == "finalized" else height
                return {"number": hex(n), "hash": DEPLOYMENT_HASH if n == DEPLOYMENT else h(n), "timestamp": hex(1700000000)}

            def uint(self, selector, block):
                return 18 if selector == "0x313ce567" else 100

        self.assertTrue(preflight(self.config, Source())["ready"])


if __name__ == "__main__":
    unittest.main()
