import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Store,type Command} from './model';
import {initialWbInput} from './workbuddy-input';
function setup(){const store=new Store();let n=0;const send=(type:string,value:unknown={},extra:Partial<Command>={})=>store.dispatch({id:`submission-${++n}`,type,value,...extra});send('open','workbuddy');send('wb-focus',{id:'wb:draft:new'});const anchor=()=>({targetId:store.state.target!.id,targetRevision:store.state.target!.revision});return {store,send,anchor};}
test('accepted submission archives parameters and materials then clears both old and next draft',()=>{
 const {store,send,anchor}=setup();const d=store.state.workbuddy.drafts.new;d.input=initialWbInput();d.input.sketch={strokes:[[[0,0],[1,1]]],confirmed:true,interpretation:null};d.input.color={word:'红色',hex:'#C92A2A',source:'user_edit',original:'红色'};d.attachments=[store.state.workbuddy.files[0].id];d.references=['客户资料'];const input=structuredClone(d.input),attachments=[...d.attachments];
 const command={id:'accepted-once',type:'wb-submit',value:{text:'制作红色销售汇报，布局我画一下',revision:d.revision},...anchor()};assert.equal(store.dispatch(command).ok,true);const task=store.state.workbuddy.tasks[0];assert.deepEqual(task.input?.sketch,input.sketch);assert.equal(task.input?.color?.hex,'#C92A2A');assert.deepEqual(task.sourceFiles,attachments);
 for(const id of ['new',task.id]){const next=store.state.workbuddy.drafts[id];assert.equal(next.text,'');assert.deepEqual(next.attachments,[]);assert.deepEqual(next.references,[]);assert.deepEqual(next.input?.sketch.strokes,[]);assert.equal(next.input?.color,null);}
 assert.equal(store.dispatch(command).ok,true);assert.equal(store.state.workbuddy.tasks.filter(t=>t.id===task.id).length,1);
});
test('rejected unconfirmed or stale sends retain canvas and references',()=>{
 const {store,send,anchor}=setup();const d=store.state.workbuddy.drafts.new;d.text='生成汇报';d.input=initialWbInput();d.input.sketch.strokes=[[[0,0],[1,1]]];d.attachments=[store.state.workbuddy.files[0].id];const before=structuredClone(d);
 assert.equal(send('wb-submit',{text:d.text,revision:d.revision},anchor()).ok,false);assert.deepEqual(store.state.workbuddy.drafts.new,before);
 assert.equal(send('wb-submit',{text:d.text,revision:d.revision+1},anchor()).ok,false);assert.deepEqual(store.state.workbuddy.drafts.new,before);
});
test('pending reference task is reusable; file-only submission starts once and retains adopted source',()=>{
 const {store,send,anchor}=setup();send('wb-reference-task');const id=store.state.workbuddy.task;send('wb-reference-task');assert.equal(store.state.workbuddy.task,id);
 assert.equal(send('wb-submit',{text:'制作汇报',revision:0},anchor()).ok,false);
 const file=store.state.workbuddy.files[0].id;assert.equal(send('wb-attach',{id:file},anchor()).ok,true);assert.equal(store.state.workbuddy.tasks[0].status,'needs-materials');assert.equal(store.state.workbuddy.drafts[id].text,'');
 assert.equal(send('wb-submit',{text:'',revision:store.state.workbuddy.drafts[id].revision},anchor()).ok,true);
 const task=store.state.workbuddy.tasks[0];assert.equal(task.title,'补充汇报材料');assert.equal(task.status,'running');assert.deepEqual(task.sourceFiles,[file]);assert.deepEqual(store.state.workbuddy.drafts[task.id].attachments,[]);
});
test('receipt submission clears its same-target draft only after accepted approval request',()=>{
 const {store,send,anchor}=setup();send('wb-material-task');const id=store.state.workbuddy.task;
 const task=()=>store.state.workbuddy.tasks.find(t=>t.id===id)!;
 send('wb-material',{action:'add',material:'demo-receipts',task:id,revision:task().receipts!.revision},anchor());
 const d=store.state.workbuddy.drafts[id];d.input=initialWbInput();d.input.sketch={strokes:[[[0,0],[1,1]]],confirmed:true,interpretation:null};d.attachments=[store.state.workbuddy.files[0].id];const file=d.attachments[0];
 assert.equal(send('wb-submit',{text:'整理票据',revision:d.revision},anchor()).ok,true);
 assert.equal(task().status,'approval');assert.equal(task().input?.sketch.strokes.length,1);assert.ok(task().sourceFiles?.includes(file));assert.deepEqual(store.state.workbuddy.drafts[id].attachments,[]);assert.deepEqual(store.state.workbuddy.drafts[id].input?.sketch.strokes,[]);assert.equal(store.state.target!.value,'');
});
