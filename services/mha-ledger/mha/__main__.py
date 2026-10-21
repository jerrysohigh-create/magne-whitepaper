import argparse
import csv
from datetime import datetime, timezone
try:
    import fcntl
except ModuleNotFoundError:
    from . import _win_fcntl as fcntl
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import signal
import sqlite3
import sys
import urllib.parse
from dataclasses import replace

from .config import Config, amount
from .indexer import Indexer
from .rpc import RPC, RPCError
from .store import Store, IntegrityError


def emit(value):
    print(json.dumps(value, ensure_ascii=False, indent=2), flush=True)


class WriterLock:
    def __init__(self, path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.file = open(path + ".writer.lock", "a")

    def __enter__(self):
        try:
            fcntl.flock(self.file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            self.file.close()
            raise IntegrityError("Another writer is running; use its read-only API or stop it before this command") from None
        return self

    def __exit__(self, *args):
        fcntl.flock(self.file, fcntl.LOCK_UN)
        self.file.close()


def serve(config, host, port):
    static = {"/": ("index.html", "text/html; charset=utf-8"),
              "/assets/styles.css": ("styles.css", "text/css; charset=utf-8"),
              "/assets/app.js": ("app.js", "text/javascript; charset=utf-8")}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            query = urllib.parse.urlsplit(self.path)
            if query.path in static:
                filename, mime = static[query.path]
                try:
                    body = Path(__file__).with_name("web").joinpath(filename).read_bytes()
                    code = 200
                except OSError:
                    body, mime, code = b"Dashboard assets unavailable", "text/plain; charset=utf-8", 503
                self.send_response(code)
                self.send_header("Content-Type", mime)
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Cache-Control", "no-store")
                self.send_header("X-Content-Type-Options", "nosniff")
                self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")
                self.end_headers()
                self.wfile.write(body)
                return
            args = urllib.parse.parse_qs(query.query)
            store = None
            try:
                store = Store(config.db_path, readonly=True)
                store.db.execute("BEGIN")  # Consistent read snapshot for every request.
                limit = min(500, max(1, int(args.get("limit", [100])[0])))
                offset = max(0, int(args.get("offset", [0])[0]))
                code = 200
                if query.path in ("/v1/status", "/healthz"):
                    data = store.summary()
                    if query.path == "/healthz":
                        stamp = data["last_heartbeat_at"]
                        fresh = bool(stamp) and (datetime.now(timezone.utc) - datetime.fromisoformat(stamp)).total_seconds() < max(90, config.poll * 4)
                        cursor = data["cursor"]
                        chain = data["network"]
                        lag = chain["finalized"] - cursor["number"] if cursor and chain else None
                        checked = data["latest_reconciliation"]
                        audit = data["full_audit"]
                        audit_fresh = bool(audit) and audit.get("status") == "passed" and (datetime.now(timezone.utc) - datetime.fromisoformat(audit["checked_at"])).total_seconds() <= config.full_reconcile_interval + 90
                        healthy = fresh and data["complete_history"] and audit_fresh and not data["halted"] and not data["last_error"] and lag is not None and 0 <= lag <= 50 and checked and checked["status"] == "passed"
                        code = 200 if healthy else 503
                        data = {"healthy": bool(healthy), "heartbeat_fresh": fresh, "lag_blocks": lag, "status": data}
                elif query.path in ("/v1/live/status", "/livez"):
                    data = store.live_summary()
                    if query.path == "/livez":
                        stamp = data["last_heartbeat_at"]
                        fresh = bool(stamp) and (datetime.now(timezone.utc) - datetime.fromisoformat(stamp)).total_seconds() < max(90, config.poll * 4)
                        lag = data["lag_blocks"]
                        healthy = fresh and not store.meta("halted", False) and not data["last_error"] and lag is not None and 0 <= lag <= 50
                        code = 200 if healthy else 503
                        data = {"healthy": bool(healthy), "scope": "live capture only, NOT full-history readiness", "status": data}
                elif query.path == "/v1/holders":
                    data = {"cursor": store.meta("cursor"), "complete_history": bool(store.meta("caught_up_at")), "scope": "Reconstructed balances at historical cursor, not current balances while backfilling", "items": store.holders(limit, offset), "limit": limit, "offset": offset}
                elif query.path in ("/v1/transfers", "/v1/live/transfers"):
                    address = args.get("address", [None])[0]
                    condition, parameters = "", []
                    if address:
                        import re
                        if not re.fullmatch(r"0x[0-9a-fA-F]{40}", address):
                            raise ValueError("Invalid address")
                        condition = "WHERE from_address=? OR to_address=?"
                        parameters = [address.lower(), address.lower()]
                    live = query.path == "/v1/live/transfers"
                    table = "live_transfers" if live else "transfers"
                    rows = store.db.execute(f"SELECT * FROM {table} {condition} ORDER BY block_number DESC,log_index DESC LIMIT ? OFFSET ?", (*parameters, limit, offset))
                    data = {"cursor": store.meta("live_cursor" if live else "cursor"), "complete_history": bool(store.meta("caught_up_at")), "scope": "recent observations" if live else "historical replay", "items": [dict(row, amount_mha=amount(row["value_raw"])) for row in rows]}
                elif query.path == "/v1/labels":
                    data = [dict(row) for row in store.db.execute("SELECT * FROM labels ORDER BY effective_block DESC LIMIT ? OFFSET ?", (limit, offset))]
                elif query.path == "/v1/alerts":
                    data = [dict(row) for row in store.db.execute("SELECT * FROM alerts ORDER BY id DESC LIMIT ? OFFSET ?", (limit, offset))]
                elif query.path == "/v1/reconciliations":
                    data = [json.loads(row[0]) for row in store.db.execute("SELECT report FROM reconciliations ORDER BY id DESC LIMIT ? OFFSET ?", (limit, offset))]
                else:
                    data, code = {"error": "Not found"}, 404
            except ValueError:
                data, code = {"error": "Invalid query parameter"}, 400
            except sqlite3.Error:
                data, code = {"error": "Ledger not initialized or unavailable"}, 503
            finally:
                if store:
                    store.close()
            body = json.dumps(data, ensure_ascii=False).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, format, *args):
            return

    emit({"api": f"http://{host}:{port}", "read_only": True})
    ThreadingHTTPServer((host, port), Handler).serve_forever()


def export(store, destination):
    path = Path(destination)
    path.mkdir(parents=True, exist_ok=True)
    store.db.execute("BEGIN")
    try:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        output = path / stamp
        output.mkdir()
        (output / "status.json").write_text(json.dumps(store.summary(), ensure_ascii=False, indent=2))
        for table in ("transfers", "balances", "labels", "batches", "reconciliations", "live_transfers", "live_batches", "live_gaps"):
            cursor = store.db.execute(f"SELECT * FROM {table}")
            with (output / f"{table}.csv").open("w", newline="") as file:
                writer = csv.writer(file)
                writer.writerow([column[0] for column in cursor.description])
                writer.writerows(cursor)
        with (output / "raw_logs.jsonl").open("w") as file:
            for row in store.db.execute("SELECT r.*,s.state FROM raw_logs r JOIN log_state s ON s.raw_id=r.id ORDER BY r.block_number,r.log_index"):
                file.write(json.dumps(dict(row), ensure_ascii=False) + "\n")
        return str(output.resolve())
    finally:
        store.db.rollback()


def main():
    parser = argparse.ArgumentParser(description="MHA chain ledger; all RPC calls are read-only")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("init")
    commands.add_parser("doctor")
    sync = commands.add_parser("sync")
    sync.add_argument("--max-batches", type=int)
    commands.add_parser("run")
    commands.add_parser("public-run")
    commands.add_parser("status")
    check = commands.add_parser("reconcile")
    check.add_argument("--full", action="store_true")
    commands.add_parser("import-disclosure")
    api = commands.add_parser("serve")
    api.add_argument("--host", default="127.0.0.1")
    api.add_argument("--port", type=int, default=8787)
    save = commands.add_parser("export")
    save.add_argument("--directory", default="exports")
    backup = commands.add_parser("backup")
    backup.add_argument("--output", required=True)
    args = parser.parse_args()
    config = Config.env()
    if args.command == "doctor":
        from .preflight import preflight
        result = preflight(config)
        emit(result)
        if not result["ready"]:
            raise SystemExit(2)
        return
    if args.command == "serve":
        serve(config, args.host, args.port)
        return
    writing = args.command in {"init", "sync", "run", "public-run", "reconcile", "import-disclosure"}
    lock = WriterLock(config.db_path) if writing else None
    store = None
    locked = False
    try:
        if lock:
            lock.__enter__()
            locked = True
        store = Store(config.db_path, readonly=not writing)
        indexer = Indexer(config, RPC(config), store)
        if args.command == "init":
            emit(indexer.initialize())
        elif args.command == "sync":
            if args.max_batches is not None and args.max_batches < 1:
                raise ValueError("max-batches must be positive")
            indexer.sync_once(args.max_batches, lambda item: print(json.dumps(item), flush=True))
            emit(store.summary())
        elif args.command == "run":
            signal.signal(signal.SIGTERM, lambda *unused: setattr(indexer, "stop_requested", True))
            signal.signal(signal.SIGINT, lambda *unused: setattr(indexer, "stop_requested", True))
            indexer.run(lambda item: print(json.dumps(item), flush=True))
        elif args.command == "public-run":
            from .pool import RPCPool
            from .public_follower import PublicFollower
            if not config.live_urls or not config.history_urls:
                raise ValueError("Both live and history endpoint pools must be configured")
            live_hosts = {urllib.parse.urlsplit(url).hostname for url in config.live_urls}
            history_hosts = {urllib.parse.urlsplit(url).hostname for url in config.history_urls}
            if live_hosts & history_hosts:
                raise ValueError("Live and history pools must not overlap providers; preserve independent rate limits")
            live_rpc = RPCPool(replace(config, public_urls=config.live_urls))
            history_rpc = RPCPool(replace(config, public_urls=config.history_urls), request_timeout=25)
            live_rpc.restore(store.meta("public_nodes"))
            history_rpc.restore(store.meta("public_nodes"))
            follower = PublicFollower(config, live_rpc, store, history_rpc=history_rpc)
            signal.signal(signal.SIGTERM, lambda *unused: setattr(follower, "stop_requested", True))
            signal.signal(signal.SIGINT, lambda *unused: setattr(follower, "stop_requested", True))
            try:
                follower.run(lambda item: print(json.dumps(item), flush=True))
            finally:
                follower.close()
        elif args.command == "status":
            store.db.execute("BEGIN")
            emit(store.summary())
        elif args.command == "reconcile":
            result = indexer.reconcile(args.full)
            emit(result)
            if result["status"] != "passed":
                raise SystemExit(2)
        elif args.command == "import-disclosure":
            emit(indexer.import_disclosure())
        elif args.command == "export":
            emit({"export": export(store, args.directory)})
        elif args.command == "backup":
            target = Path(args.output)
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists():
                raise ValueError("Backup target already exists; choose a new path")
            with sqlite3.connect(target) as destination:
                store.db.backup(destination)
            emit({"backup": str(target.resolve())})
    except (RPCError, IntegrityError, ValueError) as exc:
        if store and writing:
            with store.db:
                store.set_meta("last_error", str(exc))
                if isinstance(exc, IntegrityError):
                    store.set_meta("halted", True)
        emit({"error": str(exc)})
        raise SystemExit(1)
    finally:
        if store:
            store.close()
        if locked:
            lock.__exit__()


if __name__ == "__main__":
    main()
