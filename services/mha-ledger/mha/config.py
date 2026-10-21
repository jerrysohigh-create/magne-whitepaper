from dataclasses import dataclass
import os
from pathlib import Path
import re

CONTRACT = "0x37c563cdf4606d4302abb395cdb94e79d31233ed"
ZERO = "0x" + "0" * 40
TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"


def load_env(path):
    if not path or not Path(path).exists():
        return
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, sep, value = line.partition("=")
        if not sep or not re.fullmatch(r"[A-Z][A-Z0-9_]*", key):
            raise ValueError("Invalid environment configuration")
        os.environ.setdefault(key, value.strip().strip("\"'"))


@dataclass
class Config:
    rpc_url: str
    db_path: str = "data/mha.sqlite3"
    chunk: int = 2000
    poll: float = 5
    timeout: int = 25
    retries: int = 4
    log_limit: int = 10000
    pending_limit: int = 500
    reconcile_interval: int = 3600
    full_reconcile_interval: int = 86400
    deployment_block: int | None = None
    public_urls: tuple[str, ...] = ()
    live_urls: tuple[str, ...] = ()
    history_urls: tuple[str, ...] = ()
    rpc_interval: float = 1
    rpc_cooldown: float = 120
    live_window: int = 256
    live_chunk: int = 128
    live_retention: int = 768
    history_retry: float = 300
    audit_chunk_size: int = 90

    @classmethod
    def env(cls):
        load_env(os.getenv("MHA_ENV_FILE", ".env"))
        start = os.getenv("MHA_DEPLOYMENT_BLOCK")
        config = cls(
            rpc_url=os.getenv("MHA_RPC_URL", "https://bsc-mainnet.public.blastapi.io"),
            db_path=os.getenv("MHA_DB_PATH", "data/mha.sqlite3"),
            chunk=int(os.getenv("MHA_CHUNK_BLOCKS", "2000")),
            poll=float(os.getenv("MHA_POLL_SECONDS", "5")),
            log_limit=int(os.getenv("MHA_LOG_RESULT_CAP", "10000")),
            reconcile_interval=int(os.getenv("MHA_RECONCILE_SECONDS", "3600")),
            full_reconcile_interval=int(os.getenv("MHA_FULL_RECONCILE_SECONDS", "86400")),
            deployment_block=int(start) if start else None,
            public_urls=tuple(url.strip() for url in os.getenv("MHA_PUBLIC_RPC_URLS", "https://bsc.rpc.sentio.xyz,https://56.rpc.thirdweb.com,https://bsc-rpc.blockreq.com/v1/rpc/public,https://rpc-bsc.48.club,https://bsc-rpc.publicnode.com,https://bsc-mainnet.public.blastapi.io").split(",") if url.strip()),
            live_urls=tuple(url.strip() for url in os.getenv("MHA_LIVE_RPC_URLS", "https://bsc-rpc.blockreq.com/v1/rpc/public,https://rpc-bsc.48.club,https://bsc-rpc.publicnode.com").split(",") if url.strip()),
            history_urls=tuple(url.strip() for url in os.getenv("MHA_HISTORY_RPC_URLS", "https://bsc.rpc.sentio.xyz,https://56.rpc.thirdweb.com,https://bsc-mainnet.public.blastapi.io").split(",") if url.strip()),
            rpc_interval=float(os.getenv("MHA_RPC_MIN_INTERVAL", "1")),
            rpc_cooldown=float(os.getenv("MHA_RPC_COOLDOWN", "120")),
            live_window=int(os.getenv("MHA_LIVE_WINDOW", "256")),
            live_chunk=int(os.getenv("MHA_LIVE_CHUNK", "128")),
            live_retention=int(os.getenv("MHA_LIVE_RETENTION", "768")),
            history_retry=float(os.getenv("MHA_HISTORY_RETRY_SECONDS", "300")),
            audit_chunk_size=int(os.getenv("MHA_AUDIT_CHUNK_ADDRESSES", "90")),
        )
        if config.chunk < 1 or config.poll < 1 or config.reconcile_interval < 1 or config.full_reconcile_interval < 1 or config.log_limit < 1:
            raise ValueError("Positive chunk, poll >= 1 and reconciliation interval required")
        if config.rpc_interval < 0.5 or config.rpc_cooldown < 30 or config.history_retry < 30 or not 1 <= config.live_chunk <= config.live_window < config.live_retention <= 900:
            raise ValueError("Invalid public polling limits/window/cooldown")
        if not 1 <= config.audit_chunk_size <= 90:
            raise ValueError("Audit chunk must contain 1–90 addresses")
        return config


def amount(raw, decimals=18):
    # No floating point and no Decimal context rounding, including uint256 extremes.
    value = int(raw)
    sign = "-" if value < 0 else ""
    digits = str(abs(value)).zfill(decimals + 1)
    return sign + digits[:-decimals] + "." + digits[-decimals:] if decimals else sign + digits
