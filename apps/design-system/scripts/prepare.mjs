import {readFileSync,writeFileSync,mkdirSync,copyFileSync,cpSync,readdirSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const site=fileURLToPath(new URL('..',import.meta.url)),repo=path.resolve(site,'../..');
const read=p=>JSON.parse(readFileSync(path.join(repo,p),'utf8'));
const definitions=read('docs/input-design-contract/definitions.json'), bindings=read('apps/design-system/content/component-bindings.json'),rules=read('apps/design-system/content/rules-snapshot.json');
const inputControls=read('apps/design-system/content/input-controls-contract.json');
const coverage=read('apps/design-system/content/extraction-coverage.json');
const rows=read('docs/input-design-contract/component-functions.json').rows;
const publicDir=path.join(site,'public/generated');mkdirSync(publicDir,{recursive:true});rmSync(path.join(publicDir,'previews'),{recursive:true,force:true});
const category=c=>/媒体|播放|绘画|旋钮|推杆|键盘|触控|设备|画笔|控制/.test(c.名称)?'device':/状态|反馈|任务提醒|动效/.test(c.名称)?'feedback':/材料|附件|采集|相机|草图/.test(c.名称)?'materials':/颜色|参数|滑杆|步进|日期|选项/.test(c.名称)?'parameters':/文本|编辑|输入|语音|选区/.test(c.名称)?'text':'actions';
const components=definitions.components.map(c=>{const b=bindings[c.id];return {id:c.id,extraction:coverage.records[c.id],zh:b?.zh||c.名称.split(' · ')[0],en:b?.en||(c.名称.split(' · ')[1]||c.id).replace(/-/g,' '),category:b?.category||category(c),level:c.层级,export:b?.export||null,aliases:b?.aliases||[],source:b?.source||c.代码证据.split('；')[0].split(':')[0],design:b?.design||c.设计证据,states:c.状态,params:c.参数,events:c.事件,implementation:b?'shared-display':c.实现状态,adoption:b?'product-wrapper-source':(/apps\/web/.test(c.代码证据)?'source-referenced':'not-verified'),lifecycle:/被.*替代/.test(c.实现状态)?'replaced':/历史/.test(c.名称)?'historical':/需.*迁移/.test(c.实现状态)?'migration-needed':'current',gap:c.缺口,functions:rows.find(r=>r.component.id===c.id)?.functions||[]};});
for(const [id,b] of Object.entries(bindings))if(!components.some(c=>c.id===id))components.push({id,...b,extraction:coverage.records[id],level:'输入组合',design:b.design||null,states:b.states||'Empty / Ready / Busy / Error',params:b.params||'See executable Catalog',events:b.events||'See executable Catalog',implementation:'shared-display',adoption:b.source.startsWith('packages/input-controls/')?'standalone-react-extraction':'product-wrapper-source',lifecycle:'current',gap:'',functions:[]});
for(const component of components){if(!coverage.records[component.id])throw Error('Unreviewed registry ID: '+component.id);const owner=coverage.records[component.id].sharedOwner;if(owner&&!bindings[owner])throw Error('Missing shared owner: '+owner);}
for(const dir of ['figma/input-dock','figma/paint','figma/presentation','figma/fc','bilibili']){
 const from=path.join(repo,'apps/web/public/assets',dir),to=path.join(site,'public/assets',dir);mkdirSync(to,{recursive:true});
 for(const f of readdirSync(from))if(/\.(svg|woff2)$/.test(f))copyFileSync(path.join(from,f),path.join(to,f));
}
const sentenceDir=path.join(site,'public/assets/figma/sentence-parameters');mkdirSync(sentenceDir,{recursive:true});
for(const f of readdirSync(path.join(repo,'apps/web/public/assets/figma/sentence-parameters')))if(f.endsWith('.svg'))copyFileSync(path.join(repo,'apps/web/public/assets/figma/sentence-parameters',f),path.join(sentenceDir,f));
const widgetDir=path.join(site,'public/reference-assets/workbuddy-widgets');mkdirSync(widgetDir,{recursive:true});
for(const f of readdirSync(path.join(repo,'apps/web/public/reference-assets/workbuddy-widgets')))if(f.endsWith('.svg'))copyFileSync(path.join(repo,'apps/web/public/reference-assets/workbuddy-widgets',f),path.join(widgetDir,f));
let commit='unknown';try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
const hash=p=>createHash('sha256').update(readFileSync(path.join(repo,p))).digest('hex');
const sharedFiles=readdirSync(path.join(repo,'packages/ui/src')).sort();
const sharedHash=createHash('sha256');for(const file of sharedFiles){sharedHash.update(file);sharedHash.update(readFileSync(path.join(repo,'packages/ui/src',file)));}
cpSync(path.join(repo,'packages/input-controls/public'),path.join(site,'public/input-controls'),{recursive:true});
const sourceDirty=execFileSync('git',['status','--porcelain','--','apps/design-system','packages/ui','packages/input-controls','apps/web/src'],{cwd:repo,encoding:'utf8'}).trim().length>0;
const provenance={sourceDirty,sharedUiHash:sharedHash.digest('hex'),release:rules.release+' · Input controls '+inputControls.version,inputControls,sourceCommit:commit,registryVersion:definitions.version,registryHash:hash('docs/input-design-contract/definitions.json'),ruleHash:hash('apps/design-system/content/rules-snapshot.json'),polishHash:hash('packages/core/polish-actions.ts'),notion:rules.source,protocol:'v0.9.1',reactRenderer:'0.15.0',generatedBy:'scripts/prepare.mjs'};
const data={components,icons:definitions.icons,provenance,rules:rules.rules};
writeFileSync(path.join(site,'src/generated.json'),JSON.stringify(data));
for(const [name,value] of Object.entries({'extraction-coverage.json':coverage,'registry.json':data,'rules.json':rules,'release.json':provenance,'tokens.json':read('docs/liquid-glass-tokens.json')}))writeFileSync(path.join(publicDir,name),JSON.stringify(value,null,2));
const source=readFileSync(path.join(repo,'packages/core/polish-actions.ts'),'utf8');
const prompts=[...source.matchAll(/\{id:'([^']+)',label:'([^']+)',instruction:'([^']+)'\}/g)].map(m=>({id:m[1],label:m[2],instruction:m[3],exposed:m[1]!=='task-clear'}));
writeFileSync(path.join(publicDir,'prompts.json'),JSON.stringify({source:'packages/core/polish-actions.ts',hash:provenance.polishHash,prompts},null,2));
writeFileSync(path.join(site,'src/prompts.json'),JSON.stringify(prompts,null,2));
console.log(`Prepared ${components.length} components, ${prompts.length} read-only instructions.`);

// Preserve actual font files and their license, not only the CSS family name.
const fontDir=path.join(site,'public/reference-assets/fonts');mkdirSync(fontDir,{recursive:true});
for(const file of readdirSync(path.join(repo,'apps/web/public/reference-assets/fonts')))copyFileSync(path.join(repo,'apps/web/public/reference-assets/fonts',file),path.join(fontDir,file));
const fontFaces=[...readFileSync(path.join(repo,'apps/web/src/replica.css'),'utf8').matchAll(/@font-face\{[^}]+\}/g)].map(match=>match[0]).join('\n');

// Derived verbatim from the product's base reset, before application layout rules.
const baseSource=readFileSync(path.join(repo,'apps/web/src/style.css'),'utf8');
const baseReset=baseSource.slice(0,baseSource.indexOf('.tablet{')).replaceAll(':root',':scope').replace(/(?<=})body(?=\{)/g,':scope');
writeFileSync(path.join(site,'src/product-base.generated.css'),`${fontFaces}\n/* Font faces derived from apps/web/src/replica.css; SHA-256 ${hash('apps/web/src/replica.css')}. */\n/* Generated from apps/web/src/style.css; SHA-256 ${hash('apps/web/src/style.css')}. Do not edit. */\n@scope (.preview-host) {\n${baseReset}\n:scope {line-height:normal;font-weight:400;letter-spacing:normal;text-align:start;}\n}\n`);

// Host application context is derived, never reinterpreted as documentation styling.
const contextFiles=['apps/web/src/interaction.css','apps/web/src/phone-wechat-layout.css'];
writeFileSync(path.join(site,'src/product-context.generated.css'),contextFiles.map(file=>`/* Generated from ${file}; SHA-256 ${hash(file)}. Do not edit. */\n@scope (.preview-host) {\n${readFileSync(path.join(repo,file),'utf8')}\n}\n`).join(''));

// Fictional image content, not a screenshot of a UI control.
writeFileSync(path.join(publicDir,'sample-image.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="176" height="112" viewBox="0 0 176 112"><rect width="176" height="112" fill="#cadad4"/><path d="M0 112L70 35L176 112Z" fill="#6e9185"/><circle cx="140" cy="24" r="10" fill="#fff3d1"/></svg>');
