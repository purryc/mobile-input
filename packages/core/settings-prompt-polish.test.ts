import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Store,type Command} from './model';
import {activeFileView,fileBody} from './workbuddy-files';
import {promptArtifactContext} from './workbuddy-prompt';
import {protectPolishParameters} from './polish-parameters';
import {contextualPolishActions} from './polish-actions';
function fixture(){const s=new Store();let i=0;const send=(type:string,value:unknown={},extra:Partial<Command>={})=>s.dispatch({id:'persistent-'+ ++i,type,value,app:s.state.app,...extra});send('open','workbuddy');send('wb-input-task',{action:'new'});return {s,send};}
test('task prompt edits keep artifact selection and explicit submit freezes its versioned context',()=>{
 const {s,send}=fixture(),id=s.state.workbuddy.task;
 send('wb-fb-open',{file:'sales-slides'});const v=activeFileView(s.state);send('wb-object-select',{view:v.id,file:'sales-slides',path:'slide/0/title',start:0,end:2});
 const selection=structuredClone(s.state.target),body=structuredClone(fileBody(s.state,v,'sales-slides'));
 let d=s.state.workbuddy.drafts[id];assert.equal(send('wb-deck-prompt-edit',{task:id,owner:d.owner||'',revision:d.revision,text:'介绍产品特点，补充会前演讲要点。',session:'phone',sequence:1}).ok,true);
 assert.deepEqual(s.state.target,selection);assert.deepEqual(fileBody(s.state,activeFileView(s.state),'sales-slides'),body);
 d=s.state.workbuddy.drafts[id];const context=promptArtifactContext(s.state),payload={task:id,owner:d.owner||'',revision:d.revision,inputRevision:d.deckInput?.revision||0,assets:[],prompt:true,context};
 assert.equal(send('wb-deck-start',{...payload,context:{...context,version:999}}).ok,false);
 assert.equal(send('wb-deck-start',payload,{id:'accepted-once'}).ok,true);
 const event=s.state.workbuddy.lastSubmission;assert.equal(event?.id,'accepted-once');assert.deepEqual(s.state.workbuddy.tasks.find(t=>t.id===id)!.deckJob!.request!.context,context);
 assert.deepEqual(s.state.target,selection);assert.equal(s.state.workbuddy.fileBrowser?.visible,true);
 assert.equal(send('wb-deck-start',payload,{id:'accepted-once'}).ok,true);assert.deepEqual(s.state.workbuddy.lastSubmission,event);
 assert.equal(s.state.workbuddy.drafts[id].text,'');
});
test('task prompt rejects stale task, owner, version and repeated edit sequence',()=>{
 const {s,send}=fixture(),id=s.state.workbuddy.task,d=s.state.workbuddy.drafts[id],v={task:id,owner:d.owner||'',revision:d.revision,text:'保留我的参数',session:'phone',sequence:1};
 assert.equal(send('wb-deck-prompt-edit',{...v,owner:'other'}).ok,false);assert.equal(send('wb-deck-prompt-edit',v).ok,true);assert.equal(send('wb-deck-prompt-edit',v).ok,false);
 send('wb-input-task',{action:'new'});assert.equal(send('wb-deck-prompt-edit',{...v,revision:s.state.workbuddy.drafts[id].revision,sequence:2}).ok,false);
});
test('UI language changes only chrome setting, survives reset and rejects unknown locale',()=>{
 const {s,send}=fixture(),snapshot=structuredClone(s.state.workbuddy);assert.equal(send('ui-language','en').ok,true);assert.equal(s.state.uiLanguage,'en');assert.deepEqual(s.state.workbuddy,snapshot);assert.equal(send('ui-language','xx').ok,false);send('demo-reset');assert.equal(s.state.uiLanguage,'en');
});
test('polish protects minimal role/value and material anchors while allowing prose rewrites',()=>{
 const text='我想介绍一下今年的产品，背景用灰色的简洁风格，字体用黑色，主题色用红色。参考我的文件，添加一些产品照片。布局我画一下，讲十分钟。不要蓝色。';
 const p=protectPolishParameters(text);assert.ok(p.text.includes('的简洁风格'));const output=p.restore(p.text.replace('我想介绍一下今年的产品','介绍今年产品').replace('的简洁风格','的清爽风格'));assert.ok(output.includes('背景用灰色的清爽风格'));assert.ok(output.includes('不要蓝色'));
 const tokens=p.text.match(/⟦[^⟧]+⟧/g)!;assert.throws(()=>p.restore(p.text.replace(tokens[0],'')));assert.throws(()=>p.restore(p.text.replace(tokens[0],'TEMP').replace(tokens[1],tokens[0]).replace('TEMP',tokens[1])));
});
test('prompt polish offers only useful distinct actions and no parameter-only suggestions',()=>{
 for(const app of ['workbuddy','codex']){const target={app,id:'task',kind:'text'};assert.deepEqual(contextualPolishActions(target,'背景用灰色，字体用黑色，主题色用红色'),[]);assert.deepEqual(contextualPolishActions(target,'做个产品介绍'),[]);assert.deepEqual(contextualPolishActions(target,'请介绍今年的重点产品，面向新客户讲解使用场景。').map(a=>a.label),['整理结构']);assert.deepEqual(contextualPolishActions(target,'介绍今年的产品，介绍今年的产品，然后展示方案，然后展示方案。').map(a=>a.label),['整理结构','精简表达']);}
});
