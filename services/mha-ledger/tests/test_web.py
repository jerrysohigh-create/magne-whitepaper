import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.error
import urllib.request

from mha.config import CONTRACT
from mha.store import Store


class WebTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.directory = tempfile.TemporaryDirectory()
        path = str(Path(cls.directory.name) / "test.sqlite3")
        store = Store(path)
        store.initialize({"chain_id":56,"contract":CONTRACT,"symbol":"MHA","decimals":18,
                          "deployment_block":1,"predeployment_hash":"0x" + "0" * 64})
        store.close()
        with socket.socket() as candidate:
            candidate.bind(("127.0.0.1",0))
            port = candidate.getsockname()[1]
        env = dict(os.environ, MHA_DB_PATH=path, MHA_ENV_FILE="/dev/null")
        cls.base = f"http://127.0.0.1:{port}"
        cls.process = subprocess.Popen([sys.executable,"-m","mha","serve","--port",str(port)], env=env,
                                       cwd=Path(__file__).resolve().parents[1], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                with urllib.request.urlopen(cls.base,timeout=1):
                    return
            except (OSError, urllib.error.URLError):
                time.sleep(.02)
        cls.process.terminate()
        raise RuntimeError("Test API did not start")

    @classmethod
    def tearDownClass(cls):
        cls.process.terminate()
        cls.process.wait(timeout=5)
        cls.directory.cleanup()

    def get(self,path):
        try:
            response = urllib.request.urlopen(self.base+path,timeout=2)
        except urllib.error.HTTPError as response_error:
            response = response_error
        with response:
            return response.status, response.headers, response.read().decode()

    def test_root_serves_mha_dashboard_with_local_assets(self):
        code,headers,body = self.get("/")
        self.assertEqual(code,200)
        self.assertIn("text/html",headers["Content-Type"])
        self.assertIn("<title>MHA 全量账本</title>",body)
        self.assertIn('src="assets/app.js"',body)
        from urllib.parse import urljoin
        self.assertEqual(urljoin("https://example.test/mha/", "assets/app.js"), "https://example.test/mha/assets/app.js")
        self.assertIn("不代表当前持仓",body)
        self.assertIn("script-src 'self'",headers["Content-Security-Policy"])

    def test_css_and_js_types_are_correct_and_not_sniffed(self):
        for path,mime in (("/assets/styles.css","text/css"),("/assets/app.js","text/javascript")):
            code,headers,body = self.get(path)
            self.assertEqual(code,200)
            self.assertIn(mime,headers["Content-Type"])
            self.assertEqual(headers["X-Content-Type-Options"],"nosniff")
            self.assertGreater(len(body),1000)

    def test_static_routes_are_exact_allowlist_no_path_traversal(self):
        for path in ("/assets/../config.py","/assets/%2e%2e/config.py","/assets/missing.css"):
            code,_,_ = self.get(path)
            self.assertEqual(code,404)

    def test_json_status_remains_available(self):
        code,headers,body = self.get("/v1/status")
        self.assertEqual(code,200)
        self.assertIn("application/json",headers["Content-Type"])
        self.assertEqual(json.loads(body)["token"]["contract"],CONTRACT)

    def test_history_health_not_ready_for_partial_ledger(self):
        code,_,body = self.get("/healthz")
        self.assertEqual(code,503)
        self.assertFalse(json.loads(body)["healthy"])

    def test_both_transfer_scopes_remain_readonly(self):
        for path in ("/v1/transfers","/v1/live/transfers"):
            code,_,body = self.get(path)
            self.assertEqual(code,200)
            self.assertEqual(json.loads(body)["items"],[])
        _,_,body = self.get("/v1/status")
        self.assertEqual(json.loads(body)["cursor"]["number"],0)

    def test_invalid_address_is_not_interpolated_into_sql(self):
        code,_,_ = self.get("/v1/transfers?address=invalid")
        self.assertEqual(code,400)

    def test_post_cannot_mutate_ledger(self):
        request = urllib.request.Request(self.base + "/", data=b"{}", method="POST")
        with self.assertRaises(urllib.error.HTTPError) as result:
            urllib.request.urlopen(request,timeout=2)
        self.assertEqual(result.exception.code,501)


if __name__ == "__main__":
    unittest.main()
