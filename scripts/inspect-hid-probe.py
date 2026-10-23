from pathlib import Path
import argparse
import json
import re
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('device')
parser.add_argument('label')
parser.add_argument('action', nargs='*')
args = parser.parse_args()
if not re.fullmatch(r'[a-z0-9-]+', args.label):
    parser.error('Use a lowercase capture label')
root = Path(__file__).resolve().parents[1]
out = root / 'artifacts/hid-probe/captures'
out.mkdir(parents=True, exist_ok=True)
hdc = '/Applications/DevEco-Studio.app/Contents/sdk/default/openharmony/toolchains/hdc'

def run(*command):
    result = subprocess.run([hdc, '-t', args.device, *command], capture_output=True, text=True, timeout=30)
    if result.returncode or '[Fail]' in result.stdout:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout

if args.action:
    print(run('shell', 'uitest', 'uiInput', *args.action))
run('shell', 'uitest', 'dumpLayout', '-p', '/data/local/tmp/hid-probe-layout.json')
run('shell', 'uitest', 'screenCap', '-p', '/data/local/tmp/hid-probe-screen.png')
for ext, remote in [('json', 'layout.json'), ('png', 'screen.png')]:
    run('file', 'recv', '/data/local/tmp/hid-probe-' + remote, str(out / (args.label + '.' + ext)))
rows = []

def walk(value):
    if isinstance(value, dict):
        attributes = value.get('attributes', {})
        if attributes.get('text') or attributes.get('description'):
            rows.append({k: attributes.get(k) for k in ['text', 'description', 'bounds', 'type', 'enabled']})
        for child in value.values():
            walk(child)
    elif isinstance(value, list):
        for child in value:
            walk(child)

walk(json.loads((out / (args.label + '.json')).read_text()))
(out / (args.label + '.texts.json')).write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n')
for row in rows:
    print(json.dumps(row, ensure_ascii=False))
