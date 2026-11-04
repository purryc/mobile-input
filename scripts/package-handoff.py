"""Package a reviewed working tree and matching runtime; never publish or sign."""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import hashlib
import json
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
STAMP = datetime.now(ZoneInfo('America/Toronto')).strftime('%Y-%m-%d-%H%M%S')
OUT = ROOT / 'artifacts' / 'backup' / STAMP
OUT.mkdir(parents=True, exist_ok=False)
ROOTS = ['AGENTS.md', 'README.md', 'CHANGELOG.md', '.gitignore', 'package.json',
         'package-lock.json', 'tsconfig.json', 'vite.config.ts', 'playwright.config.ts',
         'apps', 'packages', 'scripts', 'tests', 'docs', 'samples', 'vendor', 'design-qa.md']
SKIP = {'.git', 'node_modules', 'oh_modules', 'build', '.hvigor', 'private',
        '__pycache__', '.pytest_cache', '.idea'}
SECRET_EXT = {'.p12', '.p7b', '.cer', '.keystore', '.pem', '.key', '.pyc'}
PATTERNS = [rb'AIza[0-9A-Za-z_-]{35}', rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
            rb'\bgh[pousr]_[A-Za-z0-9]{30,}', rb'\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{40,}']

def permitted(p):
    rel = p.relative_to(ROOT)
    return (p.is_file() and not p.is_symlink() and not (set(rel.parts) & SKIP)
            and p.suffix.lower() not in SECRET_EXT
            and p.name not in {'local.properties', '.DS_Store', 'Google API.md'}
            and not (p.name.startswith('.env') and p.name != '.env.example')
            and not (p.name == 'build-profile.json5' and p.parent.name in {'phone', 'tablet'}))

def check(data, name):
    if any(re.search(pattern, data) for pattern in PATTERNS):
        raise RuntimeError('Credential-shaped value found; inspect privately: ' + name)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def archive(path, entries):
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for name, data in entries:
            check(data, name)
            z.writestr(name, data)
    with zipfile.ZipFile(path) as z:
        assert z.testzip() is None

base = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
dirty = subprocess.check_output(['git', 'status', '--short'], cwd=ROOT, text=True)
files = set()
for name in ROOTS:
    p = ROOT / name
    files.update([p] if p.is_file() else p.rglob('*'))
files.update((ROOT / 'reference').glob('*.json'))
files.add(ROOT / 'reference/README.md')
files.update((ROOT / 'reference/icon-library-custom').rglob('*'))
files = sorted(p for p in files if permitted(p))
entries = [(str(p.relative_to(ROOT)), p.read_bytes()) for p in files]
inventory = [{'path': n, 'bytes': len(b), 'sha256': digest(b)} for n, b in entries]
meta = {'snapshot': STAMP, 'timezone': 'America/Toronto', 'baseCommit': base,
        'type': 'uncommitted-working-tree', 'gitStatus': dirty.splitlines(),
        'sourceFiles': inventory,
        'excluded': ['credentials/signing inputs', 'Git history', 'private references',
                     'device data/logs', 'recordings', 'dependencies/caches'],
        'validation': {'zipIntegrity': True, 'credentialPatternScan': True}}
source = OUT / f'mobile-input-source-{STAMP}-{base[:7]}-worktree.zip'
archive(source, entries + [('HANDOFF-SNAPSHOT.json', json.dumps(meta, ensure_ascii=False, indent=2).encode())])
# Refuse a mixed snapshot if a concurrent edit occurred while reading.
for p, (_, data) in zip(files, entries):
    assert p.read_bytes() == data, 'Source changed while packaging: ' + str(p)

web = [(str(p.relative_to(ROOT / 'dist')), p.read_bytes())
       for p in sorted((ROOT / 'dist').rglob('*')) if p.is_file()]
assert web, 'Build dist/ before packaging'
runtime_entries = [('web/' + n, b) for n, b in web]
builds = []
for role in ['phone', 'tablet']:
    p = ROOT / f'artifacts/hap/{role}/entry-default-signed.hap'
    with zipfile.ZipFile(p) as z:
        assert z.testzip() is None
        prefix = next(n for n in z.namelist() if n.endswith('/web/index.html')).removesuffix('index.html')
        build = json.loads(z.read(prefix + 'demo-build.json'))
        for name, data in web:
            packaged = z.read(prefix + name)
            if name == 'index.html':
                packaged = re.sub(rb'<script>window\.__INPUT_AGENT_BUILD__=\d+;</script>', b'', packaged)
            assert packaged == data, f'Stale HAP Web: {role}/{name}'
        for name in z.namelist():
            check(z.read(name), role + '/' + name)
    payload = p.read_bytes()
    runtime_entries.append((f'hap/input-agent-{role}-signed.hap', payload))
    builds.append({'role': role, 'sha256': digest(payload), 'build': build})
assert builds[0]['build']['generation'] == builds[1]['build']['generation']
assert builds[0]['build']['builtAt'] == builds[1]['build']['builtAt']
runtime_meta = {'builds': builds, 'webMatchesBothHaps': True,
                'distribution': 'debug-signed; device authorization required; no private signing inputs'}
runtime_entries.append(('runtime-manifest.json', json.dumps(runtime_meta, indent=2).encode()))
runtime = OUT / f'mobile-input-runtime-{STAMP}.zip'
archive(runtime, runtime_entries)
for lang in ['zh', 'en']:
    p = ROOT / f'docs/handoff-2026-11-03-{lang}.md'
    (OUT / p.name).write_bytes(p.read_bytes())
deliverables = []
for p in sorted(OUT.iterdir()):
    data = p.read_bytes()
    deliverables.append({'file': p.name, 'bytes': len(data), 'sha256': digest(data),
                         'md5': hashlib.md5(data).hexdigest()})
meta.update({'runtime': runtime_meta, 'deliverables': deliverables})
(OUT / 'manifest.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')
(OUT / 'SHA256SUMS.txt').write_text(''.join(f'{digest(p.read_bytes())}  {p.name}\n' for p in sorted(OUT.iterdir()) if p.is_file()))
print(json.dumps({'directory': str(OUT), 'sourceFileCount': len(files), 'deliverables': deliverables}, indent=2))
