import {test} from 'node:test';import assert from 'node:assert/strict';
import {Store,type Command} from './model';import {inferWbInput,initialWbInput,roadmapSlides} from './workbuddy-input';import {restoreWorkBuddy,newWbDraft} from './workbuddy';
test('adaptive intent parses color/layout but excludes negatives and idioms',()=>{const d=newWbDraft('');inferWbInput(d,'指标飘红，让人左右为难');assert.equal(d.input?.color,null);assert.equal(d.input?.layout,false);inferWbInput(d,'做公司 Roadmap PPT，主色用红色，左侧里程碑，右侧关键成果');assert.equal(inferWbInput(d,'主色用红色').color?.hex,'#E03131');inferWbInput(d,'左侧里程碑，右侧关键成果');assert.equal(d.input?.layout,true);inferWbInput(d,'主色用红色，不过不要红色');assert.equal(d.input?.color,null);assert.deepEqual(d.input?.excludedColors,['红色']);});
test('user color survives subsequent speech, invalid parameter and stale target are rejected',()=>{const store=new Store();let i=0;const cmd=(type:string,value:unknown={},extra:Partial<Command>={})=>store.dispatch({id:String(++i),type,value,...extra});cmd('open','workbuddy');cmd('wb-focus',{id:'wb:draft:new'});const t=store.state.target!,anchor={targetId:t.id,targetRevision:t.revision};assert.equal(cmd('wb-input',{action:'color',hex:'#C92A2A',revision:0},anchor).ok,true);assert.equal(store.state.workbuddy.drafts.new.text,'');assert.equal(store.state.workbuddy.drafts.new.input?.color?.hex,'#C92A2A');assert.equal(cmd('wb-input',{action:'color',hex:'#C92A2Z',revision:1},anchor).ok,false);const d=store.state.workbuddy.drafts.new;inferWbInput(d,'主色用蓝色');assert.equal(d.input?.color?.hex,'#C92A2A');cmd('wb-input-task',{action:'new'});assert.equal(cmd('wb-input',{action:'color',hex:'#111111',revision:1},anchor).ok,false);assert.equal(store.state.workbuddy.drafts.new.input?.color?.hex,'#C92A2A');});
test('raw sketch confirmation is separate from submitting and Roadmap uses chosen color/layout',()=>{const store=new Store();let i=0;const cmd=(type:string,value:unknown={},extra:Partial<Command>={})=>store.dispatch({id:String(++i),type,value,...extra});cmd('open','workbuddy');cmd('wb-focus',{id:'wb:draft:new'});const t=store.state.target!,anchor={targetId:t.id,targetRevision:t.revision};assert.equal(cmd('wb-input',{action:'sketch-confirm',revision:0},anchor).ok,false);const countBefore=store.state.workbuddy.tasks.length;const raw=[[[.1,.1],[.1,.8],[.4,.8],[.4,.1],[.1,.1]]];assert.equal(cmd('wb-input',{action:'sketch',strokes:raw,revision:0},anchor).ok,true);assert.equal(cmd('wb-input',{action:'sketch-confirm',revision:1},anchor).ok,true);assert.deepEqual(store.state.workbuddy.drafts.new.input?.sketch.strokes,raw);assert.equal(store.state.workbuddy.tasks.length,countBefore);const input=initialWbInput();input.color={word:'红色',hex:'#C92A2A',source:'user_edit',original:'红色'};input.sketch={strokes:raw,confirmed:true,interpretation:{left:'里程碑',right:'关键成果'}};const slides=roadmapSlides(input);assert.equal(slides.length,6);assert.ok(slides.every(x=>x.themeColor==='#C92A2A'&&x.layout==='two-column'));assert.match(slides[0].body,/里程碑/);});

test('inferred color stays structured without changing the users text and undo remains stable',()=>{
 const store=new Store();let i=0;const cmd=(type:string,value:unknown={},extra:Partial<Command>={})=>store.dispatch({id:String(++i),type,value,...extra});
 cmd('open','workbuddy');cmd('wb-focus',{id:'wb:draft:new'});const t=store.state.target!,anchor={targetId:t.id,targetRevision:t.revision};
 const d=store.state.workbuddy.drafts.new;d.text='公司 Roadmap 主色用红色';
 assert.equal(cmd('wb-input',{action:'infer',revision:0,draftRevision:d.revision},anchor).ok,true);
 assert.equal(store.state.workbuddy.drafts.new.text,'公司 Roadmap 主色用红色');assert.equal(store.state.workbuddy.drafts.new.input?.color?.hex,'#E03131');
 assert.equal(cmd('wb-input',{action:'color-undo',revision:1},anchor).ok,true);
 const undone=store.state.workbuddy.drafts.new;
 assert.equal(undone.text,'公司 Roadmap 主色用红色');assert.equal(undone.input?.dismissedColor?.original,'红色');
 assert.equal(cmd('wb-input',{action:'infer',revision:2,draftRevision:undone.revision},anchor).ok,true);
 assert.equal(store.state.workbuddy.drafts.new.input?.color,null);
});

test('legacy generated annotations migrate once, preserving wording, color and artwork',()=>{
 const store=new Store(),s=store.state,d=s.workbuddy.drafts.new;
 d.text='请保留手写色值 #123456，主色用红色 [主色 #C92A2A]';d.input=initialWbInput();
 d.input.color={word:'红色',hex:'#C92A2A',source:'user_edit',original:'红色'};
 d.input.sketch={strokes:[[[0,0],[1,1]]],confirmed:true,interpretation:null};
 const backups:string[]=[];restoreWorkBuddy(s,(key,value)=>backups.push(key+value));
 assert.equal(d.text,'请保留手写色值 #123456，主色用红色');assert.equal(d.input.color.hex,'#C92A2A');assert.equal(d.input.sketch.confirmed,true);
 assert.equal(backups.filter(x=>x.includes('color-annotation-v1')).length,1);const revision=d.revision;
 restoreWorkBuddy(s,(key,value)=>backups.push(key+value));assert.equal(d.revision,revision);assert.equal(backups.filter(x=>x.includes('color-annotation-v1')).length,1);
});

test('removing a sketch preserves text color and other attachments and inference never reattaches it',()=>{
 const store=new Store();let n=0;const send=(type:string,value:unknown={},extra:Partial<Command>={})=>store.dispatch({id:String(++n),type,value,...extra});
 send('open','workbuddy');send('wb-focus',{id:'wb:draft:new'});const t=store.state.target!,anchor={targetId:t.id,targetRevision:t.revision};
 const d=store.state.workbuddy.drafts.new;d.text='主色用红色，左侧里程碑，右侧成果';d.attachments=['sales-reference'];inferWbInput(d,d.text);d.input!.sketch.strokes=[[[0,0],[1,1]]];d.input!.sketch.confirmed=true;
 const before=d.text,color=d.input!.color;
 const command={id:'remove-layout',type:'wb-input',value:{action:'sketch-remove',revision:d.input!.revision},...anchor};assert.equal(store.dispatch(command).ok,true);assert.equal(store.dispatch(command).ok,true);
 const next=store.state.workbuddy.drafts.new;assert.equal(next.text,before);assert.deepEqual(next.input!.color,color);assert.deepEqual(next.attachments,['sales-reference']);assert.deepEqual(next.input!.sketch.strokes,[]);assert.equal(next.input!.sketch.confirmed,false);
 inferWbInput(next,next.text);assert.equal(next.input!.sketch.confirmed,false);assert.deepEqual(next.input!.sketch.strokes,[]);
 send('wb-input-task',{action:'new'});assert.equal(send('wb-input',{action:'sketch-remove',revision:next.input!.revision},anchor).ok,false);
});

test('inference tolerates a newer manual parameter but rejects an older draft across every task',()=>{
 const store=new Store();let n=0;const send=(type:string,value:unknown={},extra:Partial<Command>={})=>store.dispatch({id:`all-task-${++n}`,type,value,...extra});
 send('open','workbuddy');
 for(const id of ['new','sample-brief','sample-quote','sample-proposal','created']){
  if(id==='created')send('wb-input-task',{action:'new'});else send('wb-input-task',{id});
  const t=store.state.target!,a={targetId:t.id,targetRevision:t.revision};const d=store.state.workbuddy.drafts[store.state.workbuddy.task];
  send('wb-edit',{text:'主色用红色，画个布局',revision:d.revision,sequence:1,session:`edit-${id}`},a);
  const draftRevision=store.state.workbuddy.drafts[store.state.workbuddy.task].revision;
  send('wb-input',{action:'color',hex:'#345678',revision:0},a);
  assert.equal(send('wb-input',{action:'infer',revision:0,draftRevision},a).ok,true,id);
  assert.equal(store.state.workbuddy.drafts[store.state.workbuddy.task].input?.color?.hex,'#345678');
  assert.equal(send('wb-input',{action:'infer',revision:0,draftRevision:draftRevision-1},a).ok,false);
  assert.equal(send('wb-input',{action:'color',hex:'#000000',revision:0},a).ok,false);
 }
});

test('unconfirmed sketch blocks atomic submit after its panel closes and survives task switching',()=>{
 const store=new Store();let i=0;const cmd=(type:string,value:unknown={},extra:Partial<Command>={})=>store.dispatch({id:`elastic-${++i}`,type,value,...extra});
 cmd('open','workbuddy');cmd('wb-focus',{id:'wb:draft:new'});
 let t=store.state.target!,anchor={targetId:t.id,targetRevision:t.revision};
 cmd('wb-input',{action:'sketch',strokes:[[[.1,.1],[.8,.8]]],revision:0},anchor);
 const count=store.state.workbuddy.tasks.length;
 const send=()=>cmd('wb-submit',{text:'生成销售方案',revision:store.state.workbuddy.drafts.new.revision},anchor);
 assert.equal(send().error,'先确认草图，再发送');assert.equal(store.state.workbuddy.tasks.length,count);
 cmd('wb-input-task',{action:'new'});cmd('wb-input-task',{id:'new'});t=store.state.target!;anchor={targetId:t.id,targetRevision:t.revision};
 assert.equal(send().ok,false);
 assert.equal(cmd('wb-input',{action:'sketch-confirm',revision:1},anchor).ok,true);
 assert.equal(send().ok,true);
});
