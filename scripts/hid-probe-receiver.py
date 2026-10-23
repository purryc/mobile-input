from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from datetime import datetime, timezone
import json

root = Path(__file__).resolve().parents[1]
page = root / 'apps/harmony/hid-probe/receiver/index.html'
out = root / 'artifacts/hid-probe'
out.mkdir(parents=True, exist_ok=True)
log = out / ('mac-events-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '.jsonl')
origin = 'http://127.0.0.1:8768'

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != '/':
            self.send_error(404)
            return
        data = page.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path != '/events' or self.headers.get('Origin') != origin:
            self.send_error(403)
            return
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if size <= 0 or size > 8192:
                raise ValueError('invalid length')
            value = json.loads(self.rfile.read(size))
            keys = ['run', 'time', 'type', 'trusted', 'code', 'key', 'repeat', 'inputType', 'value']
            if not isinstance(value, dict) or value.get('type') not in ['keydown', 'keyup', 'input']:
                raise ValueError('invalid event')
            with log.open('a') as file:
                file.write(json.dumps({k: value.get(k) for k in keys}, ensure_ascii=False) + '\n')
            self.send_response(204)
            self.end_headers()
        except (ValueError, json.JSONDecodeError):
            self.send_error(400)

    def log_message(self, *_):
        pass

print(origin, flush=True)
print('Evidence:', log, flush=True)
HTTPServer(('127.0.0.1', 8768), Handler).serve_forever()
