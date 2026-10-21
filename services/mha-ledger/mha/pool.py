"""Bounded public endpoint rotation. No proxying, key discovery or auth bypass."""
from dataclasses import replace
import time
import threading
from collections import deque
from datetime import datetime, timezone

from .rpc import RPC, RPCError


class FIFOGate:
    """A waiter cannot be starved by a long audit's repeated lock acquisitions."""
    def __init__(self):
        self.condition = threading.Condition()
        self.waiters = deque()

    def __enter__(self):
        token = object()
        with self.condition:
            self.waiters.append(token)
            try:
                self.condition.wait_for(lambda: self.waiters[0] is token)
            except BaseException:
                self.waiters.remove(token)
                self.condition.notify_all()
                raise
        return self

    def __exit__(self, *unused):
        with self.condition:
            self.waiters.popleft()
            self.condition.notify_all()


class RPCPool(RPC):
    def __init__(self, config, factory=RPC, clock=time.monotonic, sleep=time.sleep, request_timeout=8):
        super().__init__(config)
        urls = tuple(dict.fromkeys(config.public_urls))
        if not urls:
            raise ValueError("At least one public RPC endpoint is required")
        self.clock, self.sleep = clock, sleep
        self.nodes = [dict(client=factory(replace(config, rpc_url=url, retries=1, timeout=min(request_timeout, config.timeout))),
                           checked=False, disabled=False, cooldown=0, last=-1e9, scopes={},
                           success=0, failures=0, error=None) for url in urls]
        self.position = 0
        self.head = 0
        self.source = "public-pool"
        self.log_source = None
        self.request_lock = FIFOGate()

    def scope(self, method, params):
        block = None
        if method == "eth_getLogs":
            block = params[0].get("fromBlock")
        elif method == "eth_getBlockByNumber":
            block = params[0]
        elif method in ("eth_call", "eth_getCode"):
            block = params[1]
        historical = isinstance(block, str) and block.startswith("0x") and self.head and int(block, 16) < self.head - 1024
        return method + (":history" if historical else ":recent")

    def request(self, node, method, params):
        wait = self.config.rpc_interval - (self.clock() - node["last"])
        if wait > 0:
            self.sleep(wait)
        node["last"] = self.clock()
        return node["client"].call(method, params)

    def call(self, method, params):
        # History and audit readers share ONE provider pacing/cooldown budget.
        with self.request_lock:
            return self._call(method, params)

    def _call(self, method, params):
        if method not in self.ALLOWED:
            raise ValueError("Only read-only RPC methods are supported")
        scope = self.scope(method, params)
        errors = []
        attempts = 0
        position = 0 if scope.endswith(":history") else self.position
        for offset in range(len(self.nodes)):
            index = (position + offset) % len(self.nodes)
            node = self.nodes[index]
            if node["disabled"] or self.clock() < max(node["cooldown"], node["scopes"].get(scope, 0)):
                continue
            attempts += 1
            try:
                if not node["checked"]:
                    chain = self.request(node, "eth_chainId", [])
                    if not isinstance(chain, str) or int(chain, 16) != 56:
                        node["disabled"] = True
                        raise RPCError(method, "chain", "wrong chain; endpoint quarantined")
                    node["checked"] = True
                result = self.request(node, method, params)
                if method == "eth_getBlockByNumber" and not result:
                    raise RPCError(method, "missing", "block unavailable")
                node["success"] += 1
                node["error"] = None
                self.source = node["client"].source
                if method == "eth_getLogs":
                    self.log_source = self.source
                if method == "eth_getBlockByNumber" and params[0] in ("latest", "finalized"):
                    self.head = max(self.head, int(result["number"], 16))
                self.position = (index + 1) % len(self.nodes)
                return result
            except RPCError as exc:
                node["failures"] += 1
                node["error"] = str(exc)
                errors.append(f"{node['client'].source}: {exc}")
                if exc.range_limit:
                    # Let the caller subdivide; don't penalize a functioning node.
                    self.position = index
                    raise
                message = exc.message.lower()
                scope_failure = any(word in message for word in ("archive", "historical", "header not found", "disabled", "not supported", "unavailable")) or exc.code == -32601
                if scope_failure:
                    node["scopes"][scope] = self.clock() + 3600
                else:
                    # Whole-provider cooldown, not rotating to aliases to defeat limits.
                    node["cooldown"] = self.clock() + max(self.config.rpc_cooldown, exc.retry_after)
                if attempts >= 3:
                    break
        self.position = (self.position + 1) % len(self.nodes)
        raise RPCError(method, "pool", "; ".join(errors) or "all eligible public endpoints are cooling down or unavailable for this scope")

    def status(self):
        stamp = self.clock()
        observed_at = datetime.now(timezone.utc).isoformat()
        return [{"source": node["client"].source, "chain_checked": node["checked"],
                 "observed_at": observed_at,
                 "quarantined": node["disabled"], "successful_requests": node["success"],
                 "failed_requests": node["failures"], "last_error": node["error"],
                 "cooldown_seconds": max(0, round(node["cooldown"] - stamp, 1)),
                 "unavailable_scopes": {scope: round(until - stamp, 1) for scope, until in node["scopes"].copy().items() if until > stamp}}
                for node in self.nodes]

    def batch_uint(self, selectors, block):
        with self.request_lock:
            return self._batch_uint(selectors, block)

    def _batch_uint(self, selectors, block):
        if not 1 <= len(selectors) <= 10:
            raise ValueError("Read batch must contain 1–10 calls")
        # Reuse chain verification, provider pacing and persistent cooldown policy.
        scope = self.scope("eth_call", [{}, hex(block)])
        errors = []
        for offset in range(len(self.nodes)):
            index = (self.position + offset) % len(self.nodes)
            node = self.nodes[index]
            if node["disabled"] or self.clock() < max(node["cooldown"], node["scopes"].get(scope, 0)):
                continue
            try:
                if not node["checked"]:
                    chain = self.request(node, "eth_chainId", [])
                    if not isinstance(chain, str) or int(chain, 16) != 56:
                        node["disabled"] = True
                        raise RPCError("eth_call", "chain", "wrong chain; endpoint quarantined")
                    node["checked"] = True
                # Ten-call batches are limited to at most one per second/provider.
                wait = max(1, self.config.rpc_interval) - (self.clock() - node["last"])
                if wait > 0:
                    self.sleep(wait)
                node["last"] = self.clock()
                result = node["client"].batch_uint(selectors, block)
                node["success"] += 1
                node["error"] = None
                self.source = node["client"].source
                self.position = (index + 1) % len(self.nodes)
                return result
            except RPCError as exc:
                node["failures"] += 1
                node["error"] = str(exc)
                errors.append(f"{node['client'].source}: {exc}")
                if any(word in exc.message.lower() for word in ("archive", "historical", "header not found", "not supported", "unavailable")) or exc.code == -32601:
                    node["scopes"][scope] = self.clock() + 3600
                else:
                    node["cooldown"] = self.clock() + max(self.config.rpc_cooldown, exc.retry_after)
        raise RPCError("eth_call", "pool", "; ".join(errors) or "all batch endpoints are cooling down or unavailable")

    def restore(self, snapshots):
        """Respect persisted cooldowns after a daemon restart; re-check chain identity."""
        for snapshot in snapshots or []:
            try:
                elapsed = max(0, (datetime.now(timezone.utc) - datetime.fromisoformat(snapshot["observed_at"])).total_seconds())
            except (KeyError, ValueError, TypeError):
                continue
            for node in self.nodes:
                if node["client"].source != snapshot.get("source"):
                    continue
                node["cooldown"] = self.clock() + max(0, snapshot.get("cooldown_seconds", 0) - elapsed)
                node["scopes"] = {scope: self.clock() + max(0, remaining - elapsed) for scope, remaining in snapshot.get("unavailable_scopes", {}).items()}
                node["disabled"] = snapshot.get("quarantined", False)
                node["success"] = snapshot.get("successful_requests", 0)
                node["failures"] = snapshot.get("failed_requests", 0)
                node["error"] = snapshot.get("last_error")
