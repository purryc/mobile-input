from pathlib import Path
import os
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
source = root / 'apps/harmony/hid-probe'
project = Path.home() / '.cache/input-agent-hid-probe'
dev = Path('/Applications/DevEco-Studio.app/Contents')
project.mkdir(parents=True, exist_ok=True)
shutil.copy2(source / 'AGENTS.md', project / 'AGENTS.md')
subprocess.run(['rsync', '-a', '--exclude', 'build', '--exclude', '.hvigor', '--exclude', '.idea',
                '--exclude', 'oh_modules', '--exclude', 'local.properties', '--exclude', '/build-profile.json5',
                str(source) + '/', str(project) + '/'], check=True)
profile = project / 'build-profile.json5'
if not profile.exists():
    shutil.copy2(source / 'build-profile.example.json5', profile)
env = os.environ.copy()
env.update(JAVA_HOME=str(dev / 'jbr/Contents/Home'), DEVECO_SDK_HOME=str(dev / 'sdk'), NODE_HOME=str(dev / 'tools/node'))
env['PATH'] = str(dev / 'tools/node/bin') + ':' + str(dev / 'jbr/Contents/Home/bin') + ':' + env['PATH']
result = subprocess.run([str(dev / 'tools/hvigor/bin/hvigorw'), 'assembleHap', '-p', 'product=default', '--no-daemon'], cwd=project, env=env)
if result.returncode:
    sys.exit(result.returncode)
out = root / 'artifacts/hid-probe/hap'
out.mkdir(parents=True, exist_ok=True)
for path in (project / 'entry/build').rglob('*.hap'):
    shutil.copy2(path, out / path.name)
print('HAP_OUTPUT', out)
