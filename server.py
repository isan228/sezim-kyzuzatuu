"""Локальный сервер приглашения + API анкет."""
from __future__ import annotations

import json
import os
import secrets
import sys
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

DATA_DIR = ROOT / "data"
DATA_FILE = DATA_DIR / "rsvps.json"
PIN = os.environ.get("ADMIN_PIN", "2026")
PORT = int(os.environ.get("PORT", "5173"))

DATA_DIR.mkdir(exist_ok=True)
if not DATA_FILE.exists():
    DATA_FILE.write_text("[]", encoding="utf-8")


def load_rsvps() -> list:
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def save_rsvps(items: list) -> None:
    DATA_FILE.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")


def stats(items: list) -> dict:
    coming = [x for x in items if x.get("attend") in ("yes", "plus")]
    declined = [x for x in items if x.get("attend") == "no"]
    guests = sum(int(x.get("people") or 0) for x in coming)
    return {
        "total": len(items),
        "coming": len(coming),
        "plus": len([x for x in items if x.get("attend") == "plus"]),
        "declined": len(declined),
        "guests": guests,
    }


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/rsvps":
            self._admin_list(parsed)
            return
        if parsed.path.startswith("/data/"):
            self.send_error(403)
            return
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/rsvp":
            self._create()
            return
        self.send_error(404)

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/rsvps/"):
            self._delete(parsed)
            return
        self.send_error(404)

    def _json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def _pin_ok(self, parsed, body=None) -> bool:
        qs = parse_qs(parsed.query)
        pin = (qs.get("pin") or [""])[0]
        if body and body.get("pin"):
            pin = str(body.get("pin"))
        header = self.headers.get("X-Admin-Pin") or ""
        return secrets.compare_digest(str(pin or header), PIN)

    def _create(self) -> None:
        data = self._body()
        name = str(data.get("name") or "").strip()[:80]
        attend = str(data.get("attend") or "")
        if attend not in ("yes", "plus", "no") or not name:
            self._json(400, {"ok": False, "error": "bad_request"})
            return
        try:
            people = int(data.get("people") or 1)
        except (TypeError, ValueError):
            people = 1
        people = max(0, min(20, people))
        if attend == "no":
            people = 0
        elif attend == "plus":
            people = max(2, people)
        else:
            people = max(1, people)

        items = load_rsvps()
        item = {
            "id": secrets.token_hex(8),
            "name": name,
            "attend": attend,
            "people": people,
            "createdAt": datetime.now().isoformat(timespec="seconds"),
        }
        items.append(item)
        save_rsvps(items)
        self._json(200, {"ok": True, "item": item})

    def _admin_list(self, parsed) -> None:
        if not self._pin_ok(parsed):
            self._json(401, {"ok": False, "error": "unauthorized"})
            return
        items = load_rsvps()
        self._json(200, {"ok": True, "items": items, "stats": stats(items)})

    def _delete(self, parsed) -> None:
        if not self._pin_ok(parsed):
            self._json(401, {"ok": False, "error": "unauthorized"})
            return
        rsvp_id = parsed.path.rsplit("/", 1)[-1]
        items = [x for x in load_rsvps() if x.get("id") != rsvp_id]
        save_rsvps(items)
        self._json(200, {"ok": True, "items": items, "stats": stats(items)})

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"http://127.0.0.1:{PORT}", flush=True)
    print(f"Admin: http://127.0.0.1:{PORT}/admin.html  PIN: {PIN}", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()
