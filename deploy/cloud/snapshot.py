"""Online SQLite backup and empty-target restore; never overwrites a ledger."""
import argparse
from contextlib import closing
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3

CONTRACT = "0x37c563cdf4606d4302abb395cdb94e79d31233ed"


def digest(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def inspect(path):
    with closing(sqlite3.connect(Path(path).resolve().as_uri() + "?mode=ro", uri=True)) as db:
        db.execute("BEGIN")
        if db.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
            raise ValueError("SQLite integrity check failed")
        meta = {key: json.loads(value) for key, value in db.execute("SELECT key,value FROM metadata")}
        token = meta.get("token") or {}
        if token.get("chain_id") != 56 or token.get("contract", "").lower() != CONTRACT or token.get("decimals") != 18:
            raise ValueError("Snapshot is not the expected BSC MHA ledger")
        cursor = meta.get("cursor")
        if not cursor or not isinstance(cursor.get("number"), int):
            raise ValueError("Snapshot has no valid committed checkpoint")
        return {"contract": CONTRACT, "chainId": 56, "cursor": cursor,
                "halted": bool(meta.get("halted")),
                "transfers": db.execute("SELECT COUNT(*) FROM transfers").fetchone()[0]}


def backup(source, directory):
    destination = Path(directory)
    destination.mkdir(parents=True, exist_ok=True)
    target = destination / ("mha-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + ".sqlite3")
    # Exclusive creation protects existing files even if called concurrently.
    with target.open("xb"):
        pass
    with closing(sqlite3.connect(Path(source).resolve().as_uri() + "?mode=ro", uri=True)) as src:
        with closing(sqlite3.connect(target)) as dst:
            src.backup(dst)
    record = {**inspect(target), "sha256": digest(target), "createdAt": datetime.now(timezone.utc).isoformat()}
    Path(str(target) + ".manifest.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    return {"snapshot": str(target), **record}


def restore(source, target):
    source, target = Path(source), Path(target)
    # A complete snapshot plus its manifest must be transferred out of band.
    expected = json.loads(Path(str(source) + ".manifest.json").read_text(encoding="utf-8"))
    if digest(source) != expected["sha256"]:
        raise ValueError("Snapshot checksum mismatch")
    record = inspect(source)
    if record["halted"]:
        raise ValueError("Snapshot is halted; investigate before restoring production")
    if record["cursor"] != expected["cursor"] or record["transfers"] != expected["transfers"]:
        raise ValueError("Snapshot manifest does not match its contents")
    if any(Path(str(target) + suffix).exists() for suffix in ("", "-wal", "-shm", ".writer.lock")):
        raise ValueError("Restore requires a new empty database path; stop services and preserve the old directory")
    target.parent.mkdir(parents=True, exist_ok=True)
    # Never copy a running database's bare file: input must be a completed snapshot.
    with target.open("xb") as dst, source.open("rb") as src:
        import shutil
        shutil.copyfileobj(src, dst)
    if digest(target) != expected["sha256"]:
        raise ValueError("Restored checksum mismatch; do not start the worker")
    return {"restored": str(target), **record}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["backup", "restore", "inspect"])
    parser.add_argument("source")
    parser.add_argument("destination", nargs="?")
    args = parser.parse_args()
    if args.command != "inspect" and not args.destination:
        parser.error("destination is required")
    result = inspect(args.source) if args.command == "inspect" else globals()[args.command](args.source, args.destination)
    print(json.dumps(result, indent=2))
