import test from 'node:test';import assert from 'node:assert/strict';
import {Store,type Command} from './model';
import {emptyDeckInput,applyDeckColors,validateDeck,type WebDeck} from './web-deck';
import {resolveLiveParameters} from './live-workbuddy';
import {browserState,working,fileBody} from './workbuddy-files';
function setup(){const store=new Store();let i=0;const send=(type:string,value:unknown={},extra:Partial<Command>={})=>store.dispatch({id:`deck-test-${++i}`,type,value,...extra});send('open','workbuddy');send('wb-deck-new');return {store,send};}
const sample=():WebDeck=>({schemaVersion:1,id:'deck',title:'产品介绍',pages:[{id:'page-a',label:'封面',title:'产品介绍',body:'真实内容',notes:'讲稿',layout:'cover',photoIds:[],background:'#FFFFFF',primary:'#146C64',textColor:'#182431',imageFit:'contain'},{id:'page-b',label:'产品展示页',title:'产品展示',body:'要点',notes:'说明',layout:'image-left',photoIds:[],background:'#FFFFFF',primary:'#146C64',textColor:'#182431',imageFit:'contain'}],assets:[],input:{text:'介绍',parameters:[]},layoutNotes:'',model:'test-fixture'});
function start(f:ReturnType<typeof setup>){const s=f.store.state,t=s.target!,d=s.workbuddy.drafts[s.workbuddy.task];f.send('wb-edit',{text:'产品介绍，讲十分钟',revision:d.revision,sequence:1,session:'input'},{targetId:t.id,targetRevision:t.revision});const now=f.store.state;assert.equal(f.send('wb-deck-start',{task:now.workbuddy.task,revision:now.workbuddy.drafts[now.workbuddy.task].revision},{targetId:now.target!.id,targetRevision:now.target!.revision}).ok,true);return f.store.state.workbuddy.tasks[0];}
test('fixed rules expose optional widgets without model calls and respect explicit negation',()=>{assert.equal(resolveLiveParameters('参考产品资料，添加实拍照片。背景用灰色，主色用红色，文字用黑色。产品展示页布局我画一下。讲十分钟').length,7);assert.equal(resolveLiveParameters('调整背景颜色，调整演示时长').length,2);assert.deepEqual(resolveLiveParameters('不要照片，不参考资料，不用布局'),[]);});
test('submission snapshots inputs, clears draft, and never completes via demo ticks',()=>{const f=setup(),task=start(f);assert.equal(task.deckJob?.request?.input.parameters.find(p=>p.kind==='duration')?.value,'10');assert.equal(f.store.state.workbuddy.drafts[task.id].text,'');assert.equal(f.send('wb-tick',{id:task.id,epoch:task.epoch}).ok,false);assert.equal(f.store.state.workbuddy.tasks[0].files.length,0);});
test('stop and retry invalidate old completions and preserve request',()=>{const f=setup(),task=start(f),epoch=task.epoch;f.send('wb-deck-stop',{task:task.id});assert.equal(f.send('wb-deck-complete',{task:task.id,epoch,deck:sample()}).ok,false);assert.equal(f.send('wb-deck-retry',{task:task.id}).ok,true);assert.notEqual(f.store.state.workbuddy.tasks[0].epoch,epoch);assert.equal(f.store.state.workbuddy.tasks[0].deckJob!.request!.text,'产品介绍，讲10分钟');});
test('completion registers editable file; stale AI patch is rejected; save and undo use existing history',()=>{const f=setup(),task=start(f);assert.equal(f.send('wb-deck-complete',{task:task.id,epoch:task.epoch,deck:sample()}).ok,true);const file=f.store.state.workbuddy.tasks[0].files[0];f.send('wb-fb-tab',{view:'panel',file});const v=browserState(f.store.state).panel;assert.equal(v.active,file);let a=working(f.store.state,v,file);const base=a.base,version=a.version;assert.equal(f.send('wb-deck-edit',{file,view:'panel',pageId:'page-a',base,version,action:'patch',patch:{title:'用户改的标题'}}).ok,true);assert.equal(f.send('wb-deck-edit',{file,view:'panel',pageId:'page-a',base,version,action:'patch',patch:{title:'过期 AI'}}).ok,false);assert.equal(f.send('wb-fb-save',{file,view:'panel'}).ok,true);assert.equal(browserState(f.store.state).docs[file].saved.webDeck?.pages[0].title,'用户改的标题');assert.equal(f.send('wb-fb-undo',{file,view:'panel'}).ok,true);assert.equal(fileBody(f.store.state,browserState(f.store.state).panel,file).webDeck?.pages[0].title,'产品介绍');});
test('manual exact colors override generated colors at the correct page scope',()=>{const parameters=resolveLiveParameters('背景用灰色。产品展示页主色用红色');const deck=applyDeckColors(sample(),parameters);assert.equal(deck.pages[0].background,'#D9DEDF');assert.equal(deck.pages[0].primary,'#146C64');assert.equal(deck.pages[1].primary,'#C92A2A');assert.ok(validateDeck(deck));const bad=sample();bad.pages[0].photoIds=['unknown'];assert.equal(validateDeck(bad),false);});
test('unfinished sketches persist in their task and block unadopted submission',()=>{const f=setup(),s=f.store.state,id=s.workbuddy.task;assert.equal(f.send('wb-deck-input',{task:id,revision:0,action:'sketch-draft',scope:'产品展示页',replace:'',strokes:[[[0.1,0.2],[0.5,0.6]]]}).ok,true);const draft=f.store.state.workbuddy.drafts[id];assert.equal(draft.deckInput!.sketchDrafts!.length,1);f.send('wb-edit',{text:'产品介绍',revision:draft.revision,sequence:1,session:'test'},{targetId:f.store.state.target!.id,targetRevision:f.store.state.target!.revision});assert.equal(f.send('wb-deck-start',{task:id,revision:f.store.state.workbuddy.drafts[id].revision},{targetId:f.store.state.target!.id,targetRevision:f.store.state.target!.revision}).ok,false);assert.equal(f.store.state.workbuddy.drafts[id].text,'产品介绍');f.send('wb-deck-new');assert.equal(f.store.state.workbuddy.drafts[id].deckInput!.sketchDrafts!.length,1);});

test('new task preparation does not execute; target text and submitted request share projection',()=>{
 const store=new Store();let i=0;const send=(type:string,value:unknown={},extra:Partial<Command>={})=>store.dispatch({id:`home-${++i}`,type,value,...extra});send('open','workbuddy');const count=store.state.workbuddy.tasks.length;send('wb-deck-prepare');assert.equal(store.state.workbuddy.page,'home');assert.equal(store.state.workbuddy.tasks.length,count);
 const owner=store.state.workbuddy.drafts.new.owner;let t=store.state.target!;send('wb-edit',{text:'生成PPT，背景用红色，讲三分钟',revision:store.state.workbuddy.drafts.new.revision,sequence:1,session:'input'},{targetId:t.id,targetRevision:t.revision});
 send('wb-deck-input',{task:'new',revision:0,action:'parameter',id:'color:全文:背景',value:'#123456'});assert.equal(store.state.target?.value,'生成PPT，背景用#123456，讲3分钟');
 t=store.state.target!;assert.equal(send('wb-deck-start',{task:'new',revision:store.state.workbuddy.drafts.new.revision},{targetId:t.id,targetRevision:t.revision}).ok,true);const task=store.state.workbuddy.tasks[0];assert.equal(task.deckJob?.request?.text,'生成PPT，背景用#123456，讲3分钟');assert.equal(task.status,'running');assert.equal(store.state.workbuddy.tasks.length,count+1);
 assert.equal(send('wb-deck-input',{task:'new',owner,revision:0,action:'asset',asset:{id:'12345678-1234-1234-1234-123456789abc',name:'晚到.txt',kind:'document',mime:'text/plain',size:3,scope:'全文'}}).ok,false);assert.equal(store.state.workbuddy.drafts.new.deckInput?.assets.length,0);
});

test('a delayed parameter edit cannot apply to a different source version',()=>{
 const f=setup(),id=f.store.state.workbuddy.task,t=f.store.state.target!;
 f.send('wb-edit',{text:'主色用蓝色',revision:0,sequence:1,session:'input'},{targetId:t.id,targetRevision:t.revision});
 assert.equal(f.send('wb-deck-input',{task:id,revision:0,action:'parameter',id:'color:全文:主色',value:'#123456',sourceText:'主色用红色'}).ok,false);
 assert.equal(f.store.state.workbuddy.drafts[id].text,'主色用蓝色');
});


test('unspecified sketches remain layout context without rejecting a valid model deck',async()=>{
 const {generateDeck}=await import('./web-deck-generation');
 for(const scope of ['全文','整份','未指定']){
  const asset={id:'12345678-1234-1234-1234-123456789abc',name:'布局草图.png',kind:'sketch' as const,mime:'image/png',size:3,scope};let calls=0;
  const google=async(parts:unknown[])=>{calls++;if(calls===1)return {pages:[{scope,layout:'columns',description:'左侧总览，右侧产品介绍'}]};assert.match(JSON.stringify(parts),/左侧总览/);return sample();};
  const deck=await generateDeck({text:'布局我画一下，左边今年产品总览，右边分产品介绍',input:{...emptyDeckInput(),assets:[asset]}},[{asset,base64:'AAAA'}],google,new AbortController().signal,()=>{});
  assert.ok(validateDeck(deck));assert.equal(calls,2);assert.equal(deck.pages[0].layout,'cover');assert.equal(deck.pages[1].layout,'image-left');assert.deepEqual(deck.assets,[asset]);
 }
});
test('explicit sketch target still binds only its intended page',async()=>{
 const {generateDeck}=await import('./web-deck-generation');
 for(const scope of ['产品展示页','不存在页']){
  const asset={id:'12345678-1234-1234-1234-123456789abc',name:'布局草图.png',kind:'sketch' as const,mime:'image/png',size:3,scope};let calls=0;
  const pending=generateDeck({text:'介绍产品',input:{...emptyDeckInput(),assets:[asset]}},[{asset,base64:'AAAA'}],async()=>++calls===1?{pages:[{scope,layout:'stack',description:'上下布局'}]}:sample(),new AbortController().signal,()=>{});
  if(scope==='不存在页')await assert.rejects(pending,/目标页名/);else{const deck=await pending;assert.equal(deck.pages[0].layout,'cover');assert.equal(deck.pages[1].layout,'stack');}
 }
});

test('confirmed draft attachment adoption and removal are idempotent and never start generation',()=>{
 const f=setup(),id=f.store.state.workbuddy.task,owner=f.store.state.workbuddy.drafts[id].owner,asset={id:'12345678-1234-1234-1234-123456789abc',name:'fictional.txt',kind:'document',mime:'text/plain',size:3,scope:'全文'};
 const act=(value:any)=>f.send('wb-deck-input',{task:id,owner,revision:f.store.state.workbuddy.drafts[id].deckInput?.revision||0,...value});
 assert.equal(act({action:'asset',asset}).ok,true);assert.equal(act({action:'asset',asset}).ok,true);
 assert.equal(f.store.state.workbuddy.drafts[id].deckInput!.assets.length,1);assert.notEqual(f.store.state.workbuddy.tasks.find(t=>t.id===id)?.status,'running');
 assert.equal(act({action:'remove',assetId:asset.id}).ok,true);assert.equal(act({action:'remove',assetId:asset.id}).ok,true);assert.equal(f.store.state.workbuddy.drafts[id].deckInput!.assets.length,0);
 assert.equal(act({action:'asset',asset,owner:'another-owner'}).ok,false);
});
