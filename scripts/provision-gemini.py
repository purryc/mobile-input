"""Import a user's key into the phone's native Asset Store; never put it in a HAP.
Run after starting the debug app, then reopen connection settings to import.
"""
from pathlib import Path
import argparse,json,os,subprocess,tempfile
p=argparse.ArgumentParser()
p.add_argument('--device',required=True)
p.add_argument('--config',type=Path,help='Private JSON file containing apiKey and optional model; otherwise GEMINI_API_KEY')
a=p.parse_args()
c=json.loads(a.config.expanduser().read_text()) if a.config else {'apiKey':os.environ.get('GEMINI_API_KEY','')}
if not c.get('apiKey'):raise SystemExit('No Gemini key configured; use a private config file or GEMINI_API_KEY.')
payload={'apiKey':c['apiKey'],'model':c.get('model','gemini-3.8-flash')}
hdc='/Applications/DevEco-Studio.app/Contents/sdk/default/openharmony/toolchains/hdc'
with tempfile.TemporaryDirectory(prefix='input-agent-private-') as temp:
 path=Path(temp)/'gemini-import.json'
 fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'w') as f:json.dump(payload,f)
 r=subprocess.run([hdc,'-t',a.device,'file','send','-b','com.hmilab.mobileinput.phone',str(path),'data/storage/el2/base/haps/entry/cache/gemini-import.json'],capture_output=True,text=True)
 if r.returncode or 'finish' not in r.stdout.lower():raise SystemExit('Private transfer failed. Start and unlock the debug phone app, then retry.')
print('Transferred privately. Reopen connection settings; verify configured status and that the one-use import file was removed.')
