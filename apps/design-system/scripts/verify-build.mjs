import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const html=readFileSync(path.join(root,'index.html'),'utf8');
if(!html.includes('/mobile-input/assets/'))throw Error('Incorrect Pages base.');
for(const f of ['registry.json','rules.json','release.json','catalog.json','catalog-schema.json','common_types.json','catalog-v1.json','ImageInput.json','ContextualPolishActions.json'])if(!existsSync(path.join(root,'generated',f)))throw Error('Missing public artifact '+f);
const assets=readdirSync(path.join(root,'assets')).filter(f=>f.endsWith('.js')).map(f=>readFileSync(path.join(root,'assets',f),'utf8')).join('\n');
for(const forbidden of ['input-agent:ui-language','WebSocket(','api.openai.com','generativelanguage.googleapis.com'])if(assets.includes(forbidden))throw Error('Runtime isolation failed: '+forbidden);
if(!existsSync(path.join(root,'reference-assets/workbuddy-widgets/check.svg')))throw Error('Missing shared widget asset.');
console.log('Verified base path, release artifacts and runtime isolation.');

for(const name of ['catalog.json','catalog-schema.json','common_types.json']){const doc=JSON.parse(readFileSync(path.join(root,'generated',name),'utf8'));const refs=(v)=>{if(!v||typeof v!=='object')return;if(v.$ref){const [file,fragment]=v.$ref.split('#');const target=file?JSON.parse(readFileSync(path.join(root,'generated',file),'utf8')):doc;let value=target;for(const part of (fragment||'').split('/').filter(Boolean))value=value?.[part.replaceAll('~1','/').replaceAll('~0','~')];if(value===undefined)throw Error('Unresolved schema reference: '+v.$ref);}Object.values(v).forEach(refs);};refs(doc);}
