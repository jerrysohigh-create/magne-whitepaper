import itertools
import json
import random
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime


class RPCError(RuntimeError):
    def __init__(self, method, code, message, retry_after=0):
        super().__init__(f"{method}: RPC error {code}: {message}")
        self.code = code
        self.message = message
        self.retry_after = retry_after

    @property
    def range_limit(self):
        text = self.message.lower()
        return any(s in text for s in ("block range", "log query range", "too many results", "response size", "limit exceeded", "query returned more", "maximum range", "too wide", "range limit"))


class RPC:
    # Explicit read allowlist: this client cannot submit or sign transactions.
    ALLOWED = {"eth_chainId", "eth_getBlockByNumber", "eth_getCode", "eth_getLogs", "eth_call", "eth_blockNumber"}

    def __init__(self, config):
        self.config = config
        self.ids = itertools.count(1)
        parsed = urllib.parse.urlsplit(config.rpc_url)
        if parsed.scheme not in ("https", "http") or not parsed.hostname:
            raise ValueError("RPC must be an HTTP(S) endpoint")
        self.source = parsed.hostname  # Never record API keys, full paths, or query strings.

    def call(self, method, params):
        if method not in self.ALLOWED:
            raise ValueError("Only read-only RPC methods are supported")
        request_id = next(self.ids)
        body = json.dumps({"jsonrpc": "2.0", "id": request_id, "method": method, "params": params}).encode()
        for attempt in range(self.config.retries):
            try:
                request = urllib.request.Request(self.config.rpc_url, body, {"Content-Type": "application/json", "User-Agent": "MHA-Ledger/1.0"})
                with urllib.request.urlopen(request, timeout=self.config.timeout) as response:
                    reply = json.load(response)
                if not isinstance(reply, dict) or reply.get("id") != request_id:
                    raise RPCError(method, "protocol", "invalid response ID or structure")
                if "error" in reply:
                    error = reply["error"]
                    # RPC providers can echo secrets/URLs; redact the configured endpoint.
                    message = str(error.get("message", "unknown")).replace(self.config.rpc_url, "[RPC]")
                    raise RPCError(method, error.get("code"), message)
                if "result" not in reply:
                    raise RPCError(method, "protocol", "missing result")
                return reply["result"]
            except urllib.error.HTTPError as exc:
                if exc.code not in (429, 500, 502, 503, 504) or attempt + 1 == self.config.retries:
                    retry_after = 0
                    try:
                        retry_after = float(exc.headers.get("Retry-After", "0"))
                    except (ValueError, TypeError):
                        try:
                            until = parsedate_to_datetime(exc.headers.get("Retry-After", ""))
                            retry_after = max(0, (until - datetime.now(timezone.utc)).total_seconds())
                        except (ValueError, TypeError, OverflowError):
                            pass
                    raise RPCError(method, exc.code, "HTTP request rejected", retry_after=retry_after) from None
            except RPCError as exc:
                if exc.range_limit or exc.code not in (-32000, -32005, -32603, 19) or attempt + 1 == self.config.retries:
                    raise
            except (OSError, ValueError):
                if attempt + 1 == self.config.retries:
                    raise RPCError(method, "transport", "network or JSON failure") from None
            time.sleep(min(2 ** attempt, 8) + random.random() / 4)

    def block(self, number):
        tag = hex(number) if isinstance(number, int) else number
        result = self.call("eth_getBlockByNumber", [tag, False])
        if not result:
            raise RPCError("eth_getBlockByNumber", "missing", "block unavailable")
        if isinstance(number, int) and int(result.get("number", "0x0"), 16) != number:
            raise RPCError("eth_getBlockByNumber", "protocol", "returned wrong block height")
        return result

    def uint(self, data, block):
        result = self.call("eth_call", [{"to": "0x37c563cdf4606d4302abb395cdb94e79d31233ed", "data": data}, hex(block)])
        if not isinstance(result, str) or len(result) != 66:
            raise RPCError("eth_call", "ABI", "expected a uint256 result")
        return int(result, 16)

    def batch_uint(self, selectors, block):
        """Small read-only batches, with strict unordered ID/result validation."""
        if not 1 <= len(selectors) <= 10:
            raise ValueError("Read batch must contain 1–10 calls")
        ids = [next(self.ids) for _ in selectors]
        body = json.dumps([{"jsonrpc": "2.0", "id": ident, "method": "eth_call",
                            "params": [{"to": "0x37c563cdf4606d4302abb395cdb94e79d31233ed", "data": selector}, hex(block)]}
                           for ident, selector in zip(ids, selectors)]).encode()
        try:
            request = urllib.request.Request(self.config.rpc_url, body, {"Content-Type": "application/json", "User-Agent": "MHA-Ledger/1.0"})
            with urllib.request.urlopen(request, timeout=self.config.timeout) as response:
                replies = json.load(response)
        except urllib.error.HTTPError as exc:
            try:
                retry_after = float(exc.headers.get("Retry-After", "0"))
            except (ValueError, TypeError):
                try:
                    until = parsedate_to_datetime(exc.headers.get("Retry-After", ""))
                    retry_after = max(0, (until - datetime.now(timezone.utc)).total_seconds())
                except (ValueError, TypeError, OverflowError):
                    retry_after = 0
            raise RPCError("eth_call", exc.code, "Batch HTTP request rejected", retry_after) from None
        except (OSError, ValueError):
            raise RPCError("eth_call", "transport", "Batch network or JSON failure") from None
        if not isinstance(replies, list) or len(replies) != len(ids):
            raise RPCError("eth_call", "protocol", "Invalid batch structure or missing responses")
        by_id = {}
        for reply in replies:
            if not isinstance(reply, dict) or type(reply.get("id")) is not int or reply["id"] not in ids or reply["id"] in by_id:
                raise RPCError("eth_call", "protocol", "Invalid or duplicate batch ID")
            if "error" in reply:
                error = reply["error"]
                raise RPCError("eth_call", error.get("code"), str(error.get("message", "unknown")).replace(self.config.rpc_url, "[RPC]"))
            result = reply.get("result")
            if not isinstance(result, str) or len(result) != 66 or not result.startswith("0x"):
                raise RPCError("eth_call", "ABI", "Expected a uint256 batch result")
            try:
                by_id[reply["id"]] = int(result, 16)
            except ValueError:
                raise RPCError("eth_call", "ABI", "Invalid hexadecimal batch result") from None
        return [by_id[ident] for ident in ids]
