"""Re-extract reviewed non-mail assets from the provenance manifest. No mail ranges allowed."""
from pathlib import Path
import subprocess,json,hashlib,concurrent.futures
root=Path(__file__).resolve().parents[1]
video=Path('/tmp/mobile-input-inspection-VID_1791414349_032.mp4')
manifest=root/'reference/asset-manifest.json'
data=json.loads(manifest.read_text())
def extract(a):
 assert not 112 <= a['time'] <= 155, 'Mail range is prohibited'
 x,y,w,h=a['rect']; p=root/a['file'];p.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(a['time']),'-i',str(video),'-frames:v','1','-vf',f'crop={w}:{h}:{x}:{y}',str(p)],check=True)
 a['sha256']=hashlib.sha256(p.read_bytes()).hexdigest();return a
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:data['assets']=list(pool.map(extract,data['assets']))
manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('Extracted',len(data['assets']),'reviewed assets')
