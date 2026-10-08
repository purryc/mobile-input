from pathlib import Path
import zipfile,hashlib,json
root=Path(__file__).resolve().parents[1]
out=root/'artifacts/delivery';out.mkdir(parents=True,exist_ok=True)
allowed=['AGENTS.md','README.md','.gitignore','package.json','package-lock.json','tsconfig.json','vite.config.ts','playwright.config.ts','apps','packages','scripts','tests','docs','samples','reference/README.md','reference/asset-manifest.json','reference/frame-map.json','reference/hover-import.json','reference/clean-icons.json','design-qa.md','vendor']
skip_dirs={'node_modules','oh_modules','build','.hvigor','.git','private'}
def permitted(p):
 rel=p.relative_to(root)
 if any(x in skip_dirs for x in rel.parts):return False
 if p.suffix in {'.p12','.p7b','.cer','.keystore'}:return False
 if p.name in {'local.properties','.DS_Store'}:return False
 if p.name=='build-profile.json5' and p.parent.name in {'tablet','phone'}:return False
 return p.is_file()
def archive(name,files,prefix):
 with zipfile.ZipFile(out/name,'w',zipfile.ZIP_DEFLATED) as z:
  for p in sorted(files):z.write(p,str(p.relative_to(prefix)))
source=[]
for name in allowed:
 p=root/name
 source.extend([p] if p.is_file() else [f for f in p.rglob('*') if permitted(f)])
archive('mobile-input-source.zip',source,root)
archive('mobile-input-web.zip',[p for p in (root/'dist').rglob('*') if p.is_file()],root/'dist')
records=[]
for p in sorted([*out.glob('*.zip'),*(root/'artifacts/hap').rglob('*.hap')]):
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None
  names=z.namelist()
  assert not any(n.endswith(('.p12','.p7b','.keystore')) or '/private/' in n for n in names)
  if p.suffix=='.hap':
   web_index=next(n for n in names if n.endswith('/web/index.html'))
   prefix=web_index.removesuffix('index.html')
   for asset in (root/'dist').rglob('*'):
    if asset.is_file():assert z.read(prefix+str(asset.relative_to(root/'dist')))==asset.read_bytes(), 'stale web bundle: '+str(asset)
 records.append({'file':str(p.relative_to(root)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'signing':'unsigned' if p.name.endswith('-unsigned.hap') else 'signed' if p.suffix=='.hap' else 'not-applicable'})
(out/'manifest.json').write_text(json.dumps({'status':'see-docs/validation.md-for-device-acceptance','files':records},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(records,ensure_ascii=False,indent=2))
