import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("snapshot", Path(__file__).with_name("snapshot.py"))
snapshot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(snapshot)


class SnapshotTests(unittest.TestCase):
    def test_online_wal_backup_and_non_overwriting_restore(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "source.sqlite3"
            db = sqlite3.connect(source)
            try:
                db.execute("PRAGMA journal_mode=WAL")
                db.execute("CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT)")
                db.execute("CREATE TABLE transfers(id INTEGER PRIMARY KEY)")
                values = {"token": {"chain_id": 56, "contract": snapshot.CONTRACT, "decimals": 18},
                          "cursor": {"number": 123, "hash": "test-checkpoint"}, "halted": False}
                db.executemany("INSERT INTO metadata VALUES (?,?)", [(key, json.dumps(value)) for key, value in values.items()])
                db.execute("INSERT INTO transfers VALUES (1)")
                db.commit()  # The open connection keeps the WAL alive.
                result = snapshot.backup(source, root / "backups")
                self.assertEqual(result["transfers"], 1)
                target = root / "restored.sqlite3"
                snapshot.restore(result["snapshot"], target)
                self.assertEqual(snapshot.inspect(target)["cursor"], values["cursor"])
                before = snapshot.digest(target)
                with self.assertRaises(ValueError):
                    snapshot.restore(result["snapshot"], target)
                self.assertEqual(snapshot.digest(target), before)
                with Path(result["snapshot"]).open("ab") as stream:
                    stream.write(b"corruption")
                with self.assertRaisesRegex(ValueError, "checksum"):
                    snapshot.restore(result["snapshot"], root / "bad.sqlite3")
                self.assertFalse((root / "bad.sqlite3").exists())
                values["token"]["chain_id"] = 1
                db.execute("UPDATE metadata SET value=? WHERE key='token'", (json.dumps(values["token"]),))
                db.commit()
                with self.assertRaisesRegex(ValueError, "expected BSC"):
                    snapshot.inspect(source)
            finally:
                db.close()


if __name__ == "__main__":
    unittest.main()
