import io
import json
from concurrent.futures import Future
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch

from mha.config import Config
from mha.indexer import Indexer
from mha.public_follower import PublicFollower
from mha.rpc import RPC, RPCError
from mha.store import IntegrityError, Store
from test_ledger import A, B, FakeRPC, event, h


class BatchRPCTest(unittest.TestCase):
    def rpc(self):
        return RPC(Config("https://example.test", retries=1))

    def response(self, rows):
        return patch("urllib.request.urlopen", return_value=io.BytesIO(json.dumps(rows).encode()))

    def test_unordered_response_ids_are_mapped_not_zipped(self):
        with self.response([{"id":2,"result":h(2)}, {"id":1,"result":h(1)}]):
            self.assertEqual(self.rpc().batch_uint(["0x01","0x02"], 10), [1, 2])

    def test_duplicate_id_rejected(self):
        with self.response([{"id":1,"result":h(1)}, {"id":1,"result":h(2)}]):
            with self.assertRaises(RPCError):
                self.rpc().batch_uint(["0x01","0x02"], 10)

    def test_missing_response_rejected(self):
        with self.response([{"id":1,"result":h(1)}]):
            with self.assertRaises(RPCError):
                self.rpc().batch_uint(["0x01","0x02"], 10)

    def test_partial_rpc_error_rejects_whole_chunk(self):
        with self.response([{"id":1,"result":h(1)}, {"id":2,"error":{"code":-32005,"message":"limited"}}]):
            with self.assertRaises(RPCError):
                self.rpc().batch_uint(["0x01","0x02"], 10)

    def test_non_hex_uint_rejected(self):
        with self.response([{"id":1,"result":"0x"+"z"*64}]):
            with self.assertRaises(RPCError):
                self.rpc().batch_uint(["0x01"], 10)

    def test_batch_size_is_bounded(self):
        with self.assertRaises(ValueError):
            self.rpc().batch_uint(["0x01"]*11, 10)


class ResumableAuditTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.store = Store(str(Path(self.directory.name) / "ledger.sqlite3"))
        self.store.initialize({"chain_id":56,"deployment_block":1,"predeployment_hash":h(0)})
        self.rpc = FakeRPC()
        self.config = Config("https://fake.test", db_path=self.store.path, audit_chunk_size=9)
        Indexer(self.config, self.rpc, self.store).sync_once()
        self.follower = PublicFollower(self.config, self.rpc, self.store, history_rpc=self.rpc)

    def tearDown(self):
        self.follower.close()
        self.store.close()
        self.directory.cleanup()

    def test_past_catchup_does_not_prioritize_audit_over_new_history(self):
        with self.store.db:
            self.store.set_meta("network", {"finalized":200})
        self.assertIsNotNone(self.store.meta("caught_up_at"))
        with patch.object(self.follower.executor, "submit", return_value=Future()) as submit:
            self.follower.background_history()
            self.assertEqual(self.follower.future_kind, "history")
            self.assertEqual(submit.call_args.args[1], 200)
        self.assertIsNone(self.store.audit_progress())

    def test_audit_error_backoff_does_not_block_history(self):
        with self.store.db:
            self.store.set_meta("network", {"finalized":200})
        self.follower.future = Future()
        self.follower.future_kind = "audit_chunk"
        self.follower.future.set_exception(RPCError("eth_call",429,"limited"))
        with patch.object(self.follower.executor,"submit",return_value=Future()):
            self.follower.background_history()
        self.assertEqual(self.follower.future_kind,"history")
        self.assertGreater(self.follower.next_audit,time.monotonic())
        self.assertIsNone(self.store.meta("last_error"))
        self.assertIn("limited",self.store.meta("audit_last_error"))

    def test_live_rpc_outage_still_schedules_independent_history(self):
        with self.store.db:
            self.store.set_meta("network", {"finalized":200})
        with patch.object(self.follower,"capture_once",side_effect=RPCError("eth_chainId",429,"limited")):
            with patch.object(self.follower.executor,"submit",return_value=Future()):
                self.follower.cycle()
        self.assertEqual(self.follower.future_kind,"history")

    def test_near_head_audit_chunk_then_new_history_gets_a_turn(self):
        with self.store.db:
            self.store.set_meta("network", {"finalized":3})
        with patch.object(self.follower.executor,"submit",return_value=Future()):
            with patch.object(self.follower.audit_executor,"submit",return_value=Future()):
                self.follower.background_history()
        self.assertEqual(self.follower.future_kind,"history")
        self.assertIsNotNone(self.follower.audit_future)
        job=self.store.audit_progress()
        self.follower.audit_future.set_result(self.follower.prepare_audit_chunk(job["id"]))
        with patch.object(self.follower.executor,"submit",return_value=Future()):
            self.follower.background_history()
        self.assertEqual(self.follower.future_kind,"history")
        self.assertEqual(self.store.meta("full_audit")["status"],"passed")

    def add_zero_addresses(self):
        with self.store.db:
            for number in range(1,13):
                self.store.update_balance("0x"+format(number,"040x"),0,0,2)

    def test_partial_progress_survives_restart_without_false_pass(self):
        self.add_zero_addresses()
        job = self.store.start_audit()
        chunk = self.follower.prepare_audit_chunk(job["id"])
        self.assertIsNone(self.store.commit_audit_chunk(chunk))
        self.assertEqual(self.store.audit_progress()["addresses_checked"],9)
        self.assertIsNone(self.store.meta("full_audit"))
        # Duplicate delivery does not inflate checked address counts.
        self.assertIsNone(self.store.commit_audit_chunk(chunk))
        self.assertEqual(self.store.audit_progress()["addresses_checked"],9)
        reopened = Store(self.store.path)
        try:
            self.assertEqual(reopened.start_audit()["id"],job["id"])
            self.assertEqual(reopened.audit_progress()["addresses_checked"],9)
            chunk = self.follower.prepare_audit_chunk(job["id"])
            report = reopened.commit_audit_chunk(chunk)
            self.assertEqual(report["status"],"passed")
            self.assertEqual(report["addresses_checked"],14)
            self.assertEqual(report["addresses_known"],14)
        finally:
            reopened.close()

    def test_snapshot_is_fixed_while_history_continues(self):
        job = self.store.start_audit()
        self.rpc.final=3
        self.rpc.latest=4
        self.rpc.events.append(event(3,B,A,5))
        Indexer(self.config,self.rpc,self.store).sync_once()
        report = self.store.commit_audit_chunk(self.follower.prepare_audit_chunk(job["id"]))
        self.assertEqual(report["status"],"passed")
        self.assertEqual(report["block_number"],2)
        self.assertEqual(self.store.meta("cursor")["number"],3)
        self.assertEqual(self.store.holders()[0]["balance_raw"],"75")

    def test_mismatch_stops_audit_without_marking_partial_passed(self):
        self.add_zero_addresses()
        job=self.store.start_audit()
        chunk=self.follower.prepare_audit_chunk(job["id"])
        chunk["balances"][0]=(chunk["balances"][0][0],1)
        report=self.store.commit_audit_chunk(chunk)
        self.assertEqual(report["status"],"failed")
        self.assertLess(report["addresses_checked"],report["addresses_known"])
        self.assertEqual(self.store.meta("full_audit")["status"],"failed")

    def test_finalized_hash_conflict_cannot_advance_audit(self):
        job=self.store.start_audit()
        self.rpc.branches[2]=100
        with self.assertRaises(IntegrityError):
            self.follower.prepare_audit_chunk(job["id"])
        self.assertEqual(self.store.audit_progress()["addresses_checked"],0)

    def test_bad_chunk_is_atomic(self):
        job=self.store.start_audit()
        chunk=self.follower.prepare_audit_chunk(job["id"])
        chunk["balances"].append(("0x"+"f"*40,0))
        with self.assertRaises(IntegrityError):
            self.store.commit_audit_chunk(chunk)
        self.assertEqual(self.store.audit_progress()["addresses_checked"],0)

    def test_gap_warning_resolves_only_after_contiguous_history_covers_it(self):
        self.config.live_window=2
        self.config.live_chunk=1
        self.config.live_retention=10
        self.follower.capture_once()
        self.rpc.final=30
        self.rpc.latest=31
        self.follower.capture_once()
        self.assertEqual(self.store.summary()["unresolved_alerts"],1)
        self.assertFalse(self.store.live_summary()["gaps"][0]["covered_by_history"])
        Indexer(self.config,self.rpc,self.store).sync_once()
        self.assertEqual(self.store.summary()["unresolved_alerts"],0)
        self.assertTrue(self.store.live_summary()["gaps"][0]["covered_by_history"])
        self.assertEqual(len(self.store.live_summary()["gaps"]),1)


if __name__ == "__main__":
    unittest.main()
