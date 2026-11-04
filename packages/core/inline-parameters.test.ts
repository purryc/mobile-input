import {test} from 'node:test';import assert from 'node:assert/strict';
import {extractLiveParameters,resolveLiveParameters} from './live-workbuddy';
import {protectPolishParameters,validatePolishParameters} from './polish-parameters';
import {Store,type Command} from './model';
const prompt='我想做一个十分钟的演示文稿，介绍今年的产品。背景用灰色，字体用黑色，主题色用红色。请参考我的文件，添加一些产品照片。布局我画一下，左边是今年产品总览，右边是分产品的介绍。';
test('all seven happy-path entries plus colloquial and ASR-punctuated equivalents keep source positions',()=>{assert.equal(extractLiveParameters(prompt).length,7);for(const text of ['背景是灰，字体是黑，主色是红。还有一些产品的照片。','背景是。灰色。字体是。黑色。主题色是。红色。参考产品图片。']){const p=extractLiveParameters(text);assert.equal(p.length,4);assert.equal(p.filter(x=>x.kind==='color').length,3);for(const x of p)assert.equal(text.slice(x.start,x.end),x.phrase);}});
test('role aliases correct one value, preserve other scopes/manual settings, never bridge unrelated prose',()=>{const p=extractLiveParameters('背景用灰色，字体用黑色，主色用红色，主题色改为蓝色。');assert.equal(p.length,3);assert.equal(p.find(x=>x.role==='主题色')?.value,'#356FE4');for(const text of ['背景是。明天下午开会。红色。','字体是黑人写的','不要字体用黑色','不用产品照片','背景不是灰色'])assert.equal(extractLiveParameters(text).length,0);const old={...extractLiveParameters('主色红色')[0],id:'color:全文:主色',role:'主色',manual:true,value:'#123456'};assert.equal(resolveLiveParameters('主色红色',[old])[0].value,'#123456');assert.equal(resolveLiveParameters('主色蓝色',[old])[0].value,'#356FE4');});
test('polish roundtrip keeps parameter role, values, invitations and source bindings',()=>{const input=prompt+'请帮我把话说清楚。',guard=protectPolishParameters(input),result=guard.restore(guard.text.replace('请帮我把话说清楚','请清楚说明产品价值'));assert.deepEqual(extractLiveParameters(result).map(({id,value,phrase})=>({id,value,phrase})),extractLiveParameters(input).map(({id,value,phrase})=>({id,value,phrase})));assert.throws(()=>guard.restore('精简成一份简报'),/输入参数/);assert.throws(()=>guard.restore(guard.text+guard.text),/输入参数/);const split='背景是。灰色。再加一句。';assert.equal(protectPolishParameters(split).restore(protectPolishParameters(split).text),split);});
test('new drafts stay on home, owner selection retains materials, explicit submit alone enters conversation',()=>{const s=new Store();let i=0;const send=(type:string,value:unknown={},bound=false)=>s.dispatch({id:'inline-'+ ++i,type,value,...(bound?{targetId:s.state.target!.id,targetRevision:s.state.target!.revision}:{})} as Command);send('open','workbuddy');send('wb-input-task',{action:'new'});const id=s.state.workbuddy.task;assert.equal(s.state.workbuddy.page,'home');const d=s.state.workbuddy.drafts[id];send('wb-edit',{text:prompt,revision:d.revision,sequence:1,session:'test'},true);assert.equal(s.state.workbuddy.page,'home');assert.match(s.state.target!.value,/#D9DEDF/);assert.match(s.state.target!.value,/#182431/);assert.match(s.state.target!.value,/#C92A2A/);assert.equal(s.state.workbuddy.tasks[0].messages.length,0);send('wb-input-task',{action:'new'});send('wb-input-task',{id});assert.equal(s.state.workbuddy.page,'home');assert.equal(s.state.workbuddy.drafts[id].text,prompt);assert.equal(send('wb-deck-start',{task:id,revision:s.state.workbuddy.drafts[id].revision},true).ok,true);assert.equal(s.state.workbuddy.page,'task');assert.equal(s.state.workbuddy.tasks.find(t=>t.id===id)!.messages.length,1);});

test('partial selection polish cannot destroy a surrounding parameter or add an unrequested one',()=>{assert.throws(()=>validatePolishParameters('背景用灰色。请介绍产品。','背景用浅蓝色。请介绍产品。'),/输入参数/);assert.throws(()=>validatePolishParameters('请介绍产品。','请介绍产品。主色红色'),/输入参数/);});
test('PPT intent adoption remains in the selected unsent draft',()=>{const s=new Store();let i=0;const run=(type:string,value:unknown={})=>s.dispatch({id:'home-'+ ++i,type,value} as Command);run('open','workbuddy');run('wb-input-task',{action:'new'});const id=s.state.workbuddy.task;run('wb-template',{text:'介绍今年的产品'});run('wb-deck-prepare');assert.equal(s.state.workbuddy.task,id);assert.equal(s.state.workbuddy.page,'home');assert.match(s.state.workbuddy.drafts[id].text,/介绍今年的产品/);assert.equal(s.state.workbuddy.drafts.new.text,'');assert.equal(s.state.workbuddy.tasks.find(t=>t.id===id)!.messages.length,0);});

test('ASR roles tolerate pauses, filler copulas and consecutive color roles',()=>{
 for(const text of ['背景要灰色，字体要黑色，主题色要红色。','背景。用灰色，字体。用黑色，主色。用红色。','背景用灰色字体黑色主色红色','背景的颜色是灰色，字体颜色用黑色，主题颜色使用红色。']){
  const p=extractLiveParameters(text).filter(x=>x.kind==='color');assert.deepEqual(p.map(x=>x.role),['背景','字体','主题色'],text);assert.deepEqual(p.map(x=>x.value),['#D9DEDF','#182431','#C92A2A'],text);
 }
});
test('bare layout and draw invitations suggest one widget, never on negation',()=>{
 for(const text of ['布局','这个布局左边是产品','排版','画一下','我画一下','布局我画一下，排版左右分栏'])assert.equal(extractLiveParameters(text).filter(p=>p.kind==='sketch').length,1,text);
 for(const text of ['不要布局','不用画一下','无需排版','不需要布局','取消布局','不要再画一下'])assert.equal(extractLiveParameters(text).filter(p=>p.kind==='sketch').length,0,text);
});
test('atomic material manifest commits only on a valid explicit Send',()=>{
 const store=new Store();let i=0;const cmd=(type:string,value:unknown={},id='atomic-'+ ++i)=>store.dispatch({id,type,value,targetId:store.state.target?.id,targetRevision:store.state.target?.revision} as Command);
 cmd('open','workbuddy');cmd('wb-focus',{id:'wb:draft:new'});cmd('wb-edit',{text:'生成产品PPT',revision:0,sequence:1,session:'materials'});
 const d=store.state.workbuddy.drafts.new,asset={id:'11111111-1111-4111-8111-111111111111',name:'测试.txt',mime:'text/plain',size:10,kind:'document',scope:'全文'};
 const payload={task:'new',owner:d.owner,revision:d.revision,inputRevision:d.deckInput?.revision||0,assets:[asset]};
 assert.equal(cmd('wb-deck-start',{...payload,owner:'wrong'}).ok,false);assert.equal(store.state.workbuddy.drafts.new.deckInput!.assets.length,0);
 assert.equal(cmd('wb-deck-start',payload,'one-send').ok,true);assert.deepEqual(store.state.workbuddy.tasks[0].deckJob!.request!.input.assets,[asset]);
 assert.equal(cmd('wb-deck-start',payload,'one-send').ok,true);assert.equal(store.state.workbuddy.tasks[0].messages.length,1);
});

test('explicit Gemini Send accepts ordinary wording and materials in new and named drafts',()=>{
 for(const named of [false,true])for(const text of ['介绍今年产品，使用这些参考资料和照片。','帮我做一个演讲稿','做个 ppt 演示文稿']){
  const store=new Store();let i=0;const cmd=(type:string,value:unknown={},id='unrestricted-'+ ++i)=>store.dispatch({id,type,value,targetId:store.state.target?.id,targetRevision:store.state.target?.revision} as Command);
  cmd('open','workbuddy');if(named)cmd('wb-input-task',{action:'new'});else cmd('wb-focus',{id:'wb:draft:new'});
  const task=store.state.workbuddy.task;cmd('wb-edit',{text,revision:store.state.workbuddy.drafts[task].revision,sequence:1,session:'test'});
  const d=store.state.workbuddy.drafts[task],asset={id:'22222222-2222-4222-8222-222222222222',name:'fictional.txt',mime:'text/plain',size:10,kind:'document',scope:'全文'};
  assert.equal(cmd('wb-deck-start',{task,owner:d.owner,revision:d.revision,inputRevision:d.deckInput?.revision||0,assets:[asset]},'send-once').ok,true);
  const accepted=store.state.workbuddy.tasks.find(t=>t.messages.some(m=>m.id==='send-once'))!;
  assert.equal(accepted.status,'running');assert.equal(accepted.deckJob!.request!.text,text);assert.deepEqual(accepted.deckJob!.request!.input.assets,[asset]);assert.equal(store.state.workbuddy.page,'task');
 }
});

test('observed ASR theme-color homophone is bounded, source-preserving and polish-safe',()=>{
 for(const text of ['主题测试，红色','主题测试。红色。','主题测试红色','主题测试是，红色','背景灰色，字体黑色，主题测试，红色']){
  const p=extractLiveParameters(text).find(p=>p.role==='主题色');assert.ok(p,text);assert.equal(p.value,'#C92A2A');assert.equal(p.id,'color:全文:主题色');assert.equal(text.slice(p.start,p.end),'红色');
  const guard=protectPolishParameters(text);assert.ok(!guard.text.includes('主题测试'),text);assert.equal(guard.restore(guard.text),text);
 }
 for(const text of ['主题测试','主题测试，明天开会，红色','主题测试，红色警报','不要主题测试，红色','主题测试不是红色'])assert.equal(extractLiveParameters(text).length,0,text);
 const source='主题测试，红色',p=extractLiveParameters(source)[0];assert.equal(resolveLiveParameters(source,[{...p,manual:true,value:'#123456'}])[0].value,'#123456');
 assert.equal(extractLiveParameters('主题测试，红色，主题色改为蓝色').filter(p=>p.kind==='color').length,1);
 assert.equal(extractLiveParameters('主题测试，红色，主题色改为蓝色')[0].value,'#356FE4');
});
