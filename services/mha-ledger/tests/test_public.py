from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from concurrent.futures import Future
import threading
from datetime import datetime, timezone, timedelta
import urllib.error
from email.utils import format_datetime
from mha.rpc import RPC

from mha.config import Config, CONTRACT, ZERO
from mha.indexer import Indexer
from mha.pool import RPCPool, FIFOGate
from mha.public_follower import PublicFollower
from mha.rpc import RPCError
from mha.store import Store, IntegrityError
from test_ledger import FakeRPC, event, h, A, B


class Clock:
    def __init__(self):
        self.value = 1000

    def __call__(self):
        return self.value

    def sleep(self, seconds):
        self.value += seconds


class FairGateTest(unittest.TestCase):
    def test_waiting_history_is_not_starved_by_audit_reacquisition(self):
        gate = FIFOGate()
        order = []
        entered = threading.Event()
        gate.__enter__()
        def waiter():
            entered.set()
            with gate:
                order.append("history")
        thread = threading.Thread(target=waiter)
        thread.start()
        self.assertTrue(entered.wait(timeout=2))
        # Observe queue state rather than rely on a timing-dependent sleep.
        with gate.condition:
            gate.condition.wait_for(lambda:len(gate.waiters)==2,timeout=2)
            self.assertEqual(len(gate.waiters),2)
        gate.__exit__()
        with gate:
            order.append("audit-next-request")
        thread.join(timeout=2)
        self.assertEqual(order,["history","audit-next-request"])


class PoolTest(unittest.TestCase):
    def pool(self, behavior):
        self.clock = Clock()
        self.calls = []
        class Client:
            def __init__(client, config):
                client.source = config.rpc_url.split('/')[2]

            def call(client, method, params):
                self.calls.append((client.source, method, self.clock()))
                if client.source in behavior:
                    return behavior[client.source](method, params)
                return "0x38" if method == "eth_chainId" else []

            def batch_uint(client, selectors, block):
                self.calls.append((client.source, "batch_uint", self.clock()))
                if client.source in behavior:
                    return behavior[client.source]("batch_uint", [selectors, block])
                return [0] * len(selectors)
        config = Config("https://a.test", public_urls=("https://a.test", "https://b.test"))
        return RPCPool(config, factory=Client, clock=self.clock, sleep=self.clock.sleep)

    def test_rate_limited_provider_cools_down_across_methods(self):
        def fail(method, params):
            if method == "eth_chainId":
                return "0x38"
            raise RPCError(method, 429, "limited", retry_after=300)
        pool = self.pool({"a.test": fail})
        self.assertEqual(pool.call("eth_getLogs", [{}]), [])
        self.assertEqual(pool.source, "b.test")
        self.assertGreaterEqual(pool.status()[0]["cooldown_seconds"], 298)
        before = len([c for c in self.calls if c[0] == "a.test"])
        pool.call("eth_call", [{}, "latest"])
        self.assertEqual(before, len([c for c in self.calls if c[0] == "a.test"]))

    def test_wrong_chain_quarantined_before_data_read(self):
        pool = self.pool({"a.test": lambda method, params: "0x1"})
        pool.call("eth_getLogs", [{}])
        self.assertTrue(pool.status()[0]["quarantined"])
        self.assertEqual([c[1] for c in self.calls if c[0] == "a.test"], ["eth_chainId"])

    def test_history_capability_failure_does_not_disable_recent_logs(self):
        def restricted(method, params):
            if method == "eth_chainId":
                return "0x38"
            if int(params[0]["fromBlock"], 16) < 1000:
                raise RPCError(method, -32601, "Only recent blocks; historical archive access required")
            return []
        pool = self.pool({"a.test": restricted})
        pool.head = 5000
        pool.call("eth_getLogs", [{"fromBlock": "0x1"}])
        pool.position = 0
        pool.call("eth_getLogs", [{"fromBlock": hex(4999)}])
        self.assertEqual(pool.source, "a.test")
        self.assertEqual(pool.status()[0]["cooldown_seconds"], 0)

    def test_per_endpoint_pacing_includes_chain_check(self):
        pool = self.pool({})
        for _ in range(4):
            pool.call("eth_getLogs", [{}])
        for source in ("a.test", "b.test"):
            stamps = [c[2] for c in self.calls if c[0] == source]
            self.assertTrue(all(right - left >= 1 for left, right in zip(stamps, stamps[1:])))

    def test_range_error_is_returned_for_subdivision(self):
        def cap(method, params):
            if method == "eth_chainId":
                return "0x38"
            raise RPCError(method, -32005, "block range limit exceeded")
        pool = self.pool({"a.test": cap})
        with self.assertRaises(RPCError) as error:
            pool.call("eth_getLogs", [{}])
        self.assertTrue(error.exception.range_limit)
        self.assertEqual(pool.status()[0]["cooldown_seconds"], 0)

    def test_transaction_submission_forbidden_in_pool(self):
        pool = self.pool({})
        with self.assertRaises(ValueError):
            pool.call("eth_sendRawTransaction", ["0x00"])
        self.assertEqual(self.calls, [])

    def test_restart_restores_cooldown_without_trusting_old_chain_check(self):
        pool = self.pool({})
        pool.restore([{'source': 'a.test', 'observed_at': datetime.now(timezone.utc).isoformat(),
                       'cooldown_seconds': 300, 'unavailable_scopes': {'eth_getLogs:history': 1000},
                       'successful_requests': 12, 'chain_checked': True}])
        self.assertGreater(pool.status()[0]['cooldown_seconds'], 298)
        self.assertFalse(pool.status()[0]['chain_checked'])
        pool.call('eth_getLogs', [{}])
        self.assertEqual(pool.source, 'b.test')

    def test_expired_persisted_cooldown_does_not_block_restart(self):
        pool = self.pool({})
        pool.restore([{'source': 'a.test', 'observed_at': (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
                       'cooldown_seconds': 120}])
        pool.call('eth_getLogs', [{}])
        self.assertEqual(pool.source, 'a.test')

    def test_http_retry_after_date_is_honored(self):
        until = datetime.now(timezone.utc) + timedelta(minutes=10)
        rejection = urllib.error.HTTPError('https://a.test', 429, 'limited', {'Retry-After': format_datetime(until)}, None)
        with patch('urllib.request.urlopen', side_effect=rejection):
            with self.assertRaises(RPCError) as error:
                RPC(Config('https://a.test', retries=1)).call('eth_chainId', [])
        self.assertGreater(error.exception.retry_after, 598)

    def test_batch_provider_cooldown_applies_to_other_methods(self):
        def limited(method, params):
            if method == "eth_chainId":
                return "0x38"
            raise RPCError(method,429,"limited",retry_after=300)
        pool = self.pool({"a.test":limited})
        self.assertEqual(pool.batch_uint(["0x01"],10),[0])
        self.assertGreater(pool.status()[0]["cooldown_seconds"],298)
        before=len([call for call in self.calls if call[0]=="a.test"])
        pool.call("eth_getLogs",[{}])
        self.assertEqual(before,len([call for call in self.calls if call[0]=="a.test"]))

    def test_batch_wrong_chain_is_quarantined_before_balance_reads(self):
        pool=self.pool({"a.test":lambda method,params:"0x1"})
        self.assertEqual(pool.batch_uint(["0x01"],10),[0])
        self.assertTrue(pool.status()[0]["quarantined"])
        self.assertEqual([call[1] for call in self.calls if call[0]=="a.test"],["eth_chainId"])

    def test_batch_pacing_and_rotation_are_bounded(self):
        pool=self.pool({})
        for _ in range(4):
            pool.batch_uint(["0x01"]*10,10)
        for source in ("a.test","b.test"):
            stamps=[call[2] for call in self.calls if call[0]==source]
            self.assertTrue(all(right-left>=1 for left,right in zip(stamps,stamps[1:])))

    def test_invalid_batch_never_contacts_provider(self):
        pool=self.pool({})
        with self.assertRaises(ValueError):
            pool.batch_uint(["0x01"]*11,10)
        self.assertEqual(self.calls,[])


class TailTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.store = Store(str(Path(self.directory.name) / 'ledger.sqlite3'))
        self.store.initialize({"chain_id": 56, "contract": CONTRACT, "decimals": 18,
                               "deployment_block": 1, "predeployment_hash": h(0)})
        self.config = Config("https://fake.test", db_path=self.store.path, live_window=2, live_chunk=1, live_retention=10)
        self.rpc = FakeRPC()
        self.follower = PublicFollower(self.config, self.rpc, self.store)

    def tearDown(self):
        self.store.close()
        self.directory.cleanup()

    def test_tail_records_events_without_inventing_balances(self):
        self.follower.capture_once()
        self.assertEqual(self.store.live_summary()["finalized_transfers"], 2)
        self.assertEqual(self.store.meta("cursor")["number"], 0)
        self.assertEqual(self.store.db.execute("SELECT count(*) FROM balances").fetchone()[0], 0)
        self.assertFalse(self.store.summary()["complete_history"])

    def test_tail_idempotent_and_restart_resumes(self):
        self.follower.capture_once()
        self.follower.capture_once()
        self.assertEqual(self.store.live_summary()["finalized_transfers"], 2)
        self.rpc.final = 3
        self.rpc.latest = 4
        self.rpc.events.append(event(3, B, A, 5))
        restarted = PublicFollower(self.config, self.rpc, self.store)
        restarted.capture_once()
        self.assertEqual(self.store.live_summary()["finalized_transfers"], 3)
        self.assertEqual(self.store.meta("live_cursor")["number"], 3)

    def test_history_reuses_raw_tail_without_double_counting(self):
        self.follower.capture_once()
        Indexer(self.config, self.rpc, self.store).sync_once()
        self.assertEqual(self.store.summary()["raw_logs"], 2)
        self.assertEqual(self.store.summary()["finalized_transfers"], 2)
        balances = {row['address']: row['balance_raw'] for row in self.store.db.execute("SELECT * FROM balances")}
        self.assertEqual(balances[A], "70")
        self.assertEqual(balances[B], "30")

    def test_finalized_tail_hash_conflict_stops(self):
        self.follower.capture_once()
        self.rpc.branches[2] = 100
        with self.assertRaises(IntegrityError):
            self.follower.capture_once()
        self.assertEqual(self.store.meta("live_cursor")["hash"], h(2))

    def test_failed_tail_read_does_not_advance(self):
        self.rpc.fail_logs = True
        with self.assertRaises(RPCError):
            self.follower.capture_once()
        self.assertIsNone(self.store.meta("live_cursor"))

    def test_retention_gap_is_explicit_and_not_full_history(self):
        self.follower.capture_once()
        self.rpc.final = 30
        self.rpc.latest = 31
        self.follower.capture_once()
        live = self.store.live_summary()
        self.assertEqual([(g['start_block'], g['end_block']) for g in live['gaps']], [(3, 28)])
        self.assertEqual(live['cursor']['number'], 30)
        self.assertFalse(self.store.summary()['complete_history'])

    def test_no_unmarked_live_gap_can_commit(self):
        self.follower.capture_once()
        with self.assertRaises(IntegrityError):
            self.store.capture(5, 5, h(5), [], [], 'test')
        self.assertEqual(self.store.meta('live_cursor')['number'], 2)

    def test_zero_logs_preserve_range_coverage(self):
        self.rpc.events = []
        self.follower.capture_once()
        live = self.store.live_summary()
        self.assertEqual(live['covered_batches'], 2)
        self.assertEqual(live['cursor']['number'], 2)
        self.assertEqual(live['finalized_transfers'], 0)

    def test_stale_finalized_head_transient_not_integrity_failure(self):
        self.follower.capture_once()
        self.rpc.final = 1
        with self.assertRaises(RPCError):
            self.follower.capture_once()
        self.assertFalse(self.store.meta('halted', False))

    def test_history_failure_does_not_stop_tail_polling(self):
        with patch.object(self.follower.indexer, 'sync_once', side_effect=RPCError('eth_getLogs', 429, 'limited')):
            self.follower.cycle()
        self.assertIsNone(self.store.meta('live_last_error'))
        self.assertIn('limited', self.store.meta('last_error'))
        self.rpc.final = 3
        self.follower.cycle()
        self.assertEqual(self.store.meta('live_cursor')['number'], 3)

    def test_range_limits_subdivide_live_capture(self):
        self.config.live_chunk = 2
        self.rpc.range_cap = 1
        self.follower.capture_once()
        self.assertEqual(self.store.live_summary()['finalized_transfers'], 2)

    def test_readonly_history_fetch_does_not_write_database(self):
        follower = PublicFollower(self.config, self.rpc, self.store, history_rpc=self.rpc)
        try:
            prepared = follower.executor.submit(follower.prepare_history, 2).result(timeout=5)
            self.assertEqual(prepared['start'], 1)
            self.assertEqual(len(prepared['transfers']), 2)
            self.assertEqual(self.store.meta('cursor')['number'], 0)
            self.assertEqual(self.store.db.execute('SELECT count(*) FROM raw_logs').fetchone()[0], 0)
        finally:
            follower.close()

    def test_finished_history_is_committed_only_by_main_writer(self):
        follower = PublicFollower(self.config, self.rpc, self.store, history_rpc=self.rpc)
        try:
            prepared = follower.executor.submit(follower.prepare_history, 2).result(timeout=5)
            follower.future = Future()
            follower.future_kind = 'history'
            follower.future.set_result(prepared)
            follower.stop_requested = True  # Prevent scheduling another job in this unit test.
            follower.background_history()
            self.assertEqual(self.store.meta('cursor')['number'], 2)
            self.assertEqual(self.store.summary()['finalized_transfers'], 2)
        finally:
            follower.close()

    def test_readonly_audit_returns_report_without_persisting(self):
        Indexer(self.config, self.rpc, self.store).sync_once()
        follower = PublicFollower(self.config, self.rpc, self.store, history_rpc=self.rpc)
        try:
            report = follower.executor.submit(follower.prepare_audit, True).result(timeout=5)
            self.assertEqual(report['status'], 'passed')
            self.assertIsNone(self.store.meta('full_audit'))
            self.store.save_reconciliation(report)
            self.assertEqual(self.store.meta('full_audit')['status'], 'passed')
        finally:
            follower.close()

    def test_blocked_history_does_not_block_live_capture(self):
        entered, release = threading.Event(), threading.Event()
        rpc = FakeRPC()
        normal_block = rpc.block
        def delayed_block(height):
            if height == 0:
                entered.set()
                release.wait(timeout=5)
            return normal_block(height)
        rpc.block = delayed_block
        follower = PublicFollower(self.config, self.rpc, self.store, history_rpc=rpc)
        try:
            follower.cycle()
            self.assertTrue(entered.wait(timeout=2))
            self.rpc.final = 3
            follower.cycle()
            self.assertEqual(self.store.meta('live_cursor')['number'], 3)
            self.assertEqual(self.store.meta('cursor')['number'], 0)
        finally:
            release.set()
            if follower.future:
                follower.future.result(timeout=5)
            follower.close()

    def test_background_rpc_failure_preserves_checkpoint_and_live_capture(self):
        follower = PublicFollower(self.config, self.rpc, self.store, history_rpc=self.rpc)
        try:
            follower.future = Future()
            follower.future_kind = 'history'
            follower.future.set_exception(RPCError('eth_getLogs', 429, 'limited'))
            follower.background_history()
            self.assertEqual(self.store.meta('cursor')['number'], 0)
            self.assertIn('limited', self.store.meta('last_error'))
            follower.capture_once()
            self.assertEqual(self.store.meta('live_cursor')['number'], 2)
        finally:
            follower.close()


if __name__ == '__main__':
    unittest.main()
