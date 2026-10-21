"""Read-only source checks; never modifies an existing ledger."""
from datetime import datetime, timezone

from .config import CONTRACT, TRANSFER, ZERO
from .indexer import number, normalize_logs, decode_transfer, hash32
from .rpc import RPC, RPCError
from .store import IntegrityError

DEPLOYMENT = 119114651
DEPLOYMENT_HASH = "0x560d691bde3fd3a69d04c4e4a64da686d0f3e272b86ffdee27d13eda19155960"


def preflight(config, rpc=None):
    rpc = rpc or RPC(config)
    checks = []
    report = {"source": rpc.source, "ready": False, "checked_at": datetime.now(timezone.utc).isoformat(), "checks": checks}
    stage = "chain_identity"
    try:
        if number(rpc.call("eth_chainId", [])) != 56:
            raise IntegrityError("Expected BNB Smart Chain mainnet, chain ID 56")
        checks.append({"check": stage, "passed": True})
        stage = "deployment_logs"
        original = rpc.call("eth_getLogs", [{"address": CONTRACT, "fromBlock": hex(DEPLOYMENT), "toBlock": hex(DEPLOYMENT)}])
        logs = normalize_logs(original, DEPLOYMENT, DEPLOYMENT)
        if not logs:
            raise IntegrityError("Empty deployment logs: cannot establish mint history")
        stage = "deployment_anchor"
        header = rpc.block(DEPLOYMENT)
        if hash32(header["hash"]) != DEPLOYMENT_HASH or any(log["blockHash"] != DEPLOYMENT_HASH for log in logs):
            raise IntegrityError("Deployment header/events do not match the verified MHA anchor")
        checks.append({"check": stage, "passed": True})
        transfers = [decode_transfer(log, header) for log in logs if log["topics"] and log["topics"][0] == TRANSFER]
        minted = sum(t["value"] for t in transfers if t["from"] == ZERO)
        burned = sum(t["value"] for t in transfers if t["to"] == ZERO)
        if minted <= 0:
            raise IntegrityError("No MHA initial mint found")
        checks.append({"check": "deployment_logs", "passed": True, "events": len(logs), "minted_raw": str(minted)})
        stage = "historical_state"
        supply = rpc.uint("0x18160ddd", DEPLOYMENT)
        precision = rpc.uint("0x313ce567", DEPLOYMENT)
        if supply != minted - burned or precision != 18:
            raise IntegrityError("Deployment supply/precision disagrees with mint logs")
        before = rpc.call("eth_getCode", [CONTRACT, hex(DEPLOYMENT - 1)])
        code = rpc.call("eth_getCode", [CONTRACT, hex(DEPLOYMENT)])
        if before not in ("0x", "0x0", "") or code in ("0x", "0x0", ""):
            raise IntegrityError("Historical contract code boundary disagrees with deployment")
        checks.append({"check": stage, "passed": True})
        stage = "finality"
        finalized = rpc.block("finalized")
        if number(finalized["number"]) < DEPLOYMENT:
            raise IntegrityError("Finalized head predates deployment")
        checks.append({"check": stage, "passed": True, "height": number(finalized["number"])})
        report["ready"] = True
    except (RPCError, IntegrityError) as exc:
        checks.append({"check": stage, "passed": False, "error": str(exc)})
    return report
