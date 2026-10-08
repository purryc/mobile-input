from pathlib import Path
import urllib.request,json
root=Path(__file__).resolve().parents[1]
sha='613ca58c16205304d78e68769bfff7a6c95ae80b'
base='https://raw.githubusercontent.com/mia1232/ClassicSuperMario/'+sha+'/'
tree=json.load(urllib.request.urlopen('https://api.github.com/repos/mia1232/ClassicSuperMario/git/trees/'+sha+'?recursive=1'))
for item in tree['tree']:
 p=item['path']
 if item['type']!='blob' or not (p.startswith('public/') or p in ['readme.md','package.json']):continue
 if p.endswith('.DS_Store'):continue
 target=root/'vendor/classic-super-mario'/p;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(urllib.request.urlopen(base+p).read())
print('Pinned Mario source downloaded',sha)
