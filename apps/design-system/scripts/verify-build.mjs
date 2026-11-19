import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const html=readFileSync(path.join(root,'index.html'),'utf8');
if(!html.includes('/mobile-input/assets/'))throw Error('Incorrect Pages base.');
for(const f of ['registry.json','rules.json','release.json','catalog.json','catalog-schema.json','common_types.json','catalog-v1.json','ImageInput.json','ContextualPolishActions.json','task-composition.json'])if(!existsSync(path.join(root,'generated',f)))throw Error('Missing public artifact '+f);
const assets=readdirSync(path.join(root,'assets')).filter(f=>f.endsWith('.js')).map(f=>readFileSync(path.join(root,'assets',f),'utf8')).join('\n');
for(const forbidden of ['input-agent:ui-language','WebSocket(','api.openai.com','generativelanguage.googleapis.com'])if(assets.includes(forbidden))throw Error('Runtime isolation failed: '+forbidden);
if(!existsSync(path.join(root,'reference-assets/workbuddy-widgets/check.svg')))throw Error('Missing shared widget asset.');
for(const file of ['harmonyos-sans-sc-regular.ttf','harmonyos-sans-sc-medium.ttf','harmonyos-sans-sc-bold.ttf','LICENSE.txt'])if(!existsSync(path.join(root,'reference-assets/fonts',file)))throw Error('Missing original font '+file);
if(existsSync(path.join(root,'generated/previews')))throw Error('Component screenshots must not be shipped.');
console.log('Verified base path, release artifacts and runtime isolation.');

for(const name of ['catalog.json','catalog-schema.json','common_types.json']){const doc=JSON.parse(readFileSync(path.join(root,'generated',name),'utf8'));const refs=(v)=>{if(!v||typeof v!=='object')return;if(v.$ref){const [file,fragment]=v.$ref.split('#');const target=file?JSON.parse(readFileSync(path.join(root,'generated',file),'utf8')):doc;let value=target;for(const part of (fragment||'').split('/').filter(Boolean))value=value?.[part.replaceAll('~1','/').replaceAll('~0','~')];if(value===undefined)throw Error('Unresolved schema reference: '+v.$ref);}Object.values(v).forEach(refs);};refs(doc);}

const inputKinds=['duration','color','font','palette','document','photo','scanner','sketch','expert','skills','connectors','formats','capture'];
const registry=JSON.parse(readFileSync(path.join(root,'generated/registry.json'),'utf8'));
for(const kind of inputKinds)if(!registry.components.some(c=>c.id==='input-'+kind))throw Error('Missing independent widget '+kind);
for(const name of ['design-expert-design.png','design-skill-ppt.png','design-format-pptx.png'])if(!existsSync(path.join(root,'input-controls/assets/xiaoyi-work',name)))throw Error('Missing input library asset '+name);

const compactHtml=readFileSync(path.join(root,'xiaoyi-controls.html'),'utf8');
if(!compactHtml.includes('/mobile-input/assets/'))throw Error('Incorrect compact library base path.');
for(const match of compactHtml.matchAll(/(?:src|href)="(\/mobile-input\/assets\/[^"]+)"/g))if(!existsSync(path.join(root,match[1].replace('/mobile-input/',''))))throw Error('Missing compact entry resource '+match[1]);
const {version} = JSON.parse(readFileSync(new URL('../../../packages/input-controls/package.json', import.meta.url), 'utf8'));
if (!existsSync(path.join(root, 'generated/input-controls', 'mobile-input-controls-' + version + '.tgz'))) {
  throw Error('Missing Xiaoyi npm download ' + version);
}
console.log('Verified standalone Xiaoyi compact entry and its resources.');
