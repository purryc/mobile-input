import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Store,initialState,type Command} from './model';
function setup(){const store=new Store();let n=0;const run=(type:string,value?:unknown,extra:Partial<Command>={})=>store.dispatch({id:'reset-test-'+ ++n,type,value,...extra});return {store,run};}
test('reset restores business seeds, clears undo, keeps device name and rejects old commands',(ctx)=>{
 // Seed file metadata and reset state must use the same clock for a stable comparison.
 ctx.mock.method(Date,'now',()=>1792773000000);
 const {store,run}=setup();run('device-name','测试大屏');run('open','mail');run('mail-compose','reply');
 const t=store.state.target!;run('input','需要清空的回复',{app:'mail',targetId:t.id,targetRevision:t.revision});run('mail-send');
 store.state.workbuddy.tasks.push({...store.state.workbuddy.tasks[0],id:'private-task',title:'新建的任务'});
 store.state.texts['notes-text']='手机编辑过的笔记';store.state.chat.drafts['wx-boss'].text='未发送';
 const revision=store.state.revision;
 const reset={id:'one-reset',type:'demo-reset',demoGeneration:0,inputClient:'phone-not-enabled'};
 assert.equal(store.dispatch(reset).ok,true);const generation=store.state.demoGeneration!;
 assert(generation>0);assert.equal(store.state.revision,revision+1);assert.equal(store.state.tabletName,'测试大屏');
 const seed=initialState();for(const key of ['workbuddy','chat','mails','texts','officeFiles','paint','bilibili','products'] as const)assert.deepEqual(store.state[key],seed[key]);
 assert.equal(store.state.inputSession,undefined);assert.equal(store.state.target,null);
 assert.equal(store.dispatch(reset).ok,true);assert.equal(store.state.demoGeneration,generation);
 assert.equal(run('undo',undefined,{demoGeneration:generation}).ok,false);
 assert.equal(run('open','workbuddy',{demoGeneration:0}).ok,false);
 assert.equal(run('input-session-client',{client:'late'},{demoGeneration:0}).ok,false);
 assert.equal(run('open','workbuddy',{demoGeneration:generation}).ok,true);
});
test('connected adapted field directly activates without a dock or confirmation, desktop still confirms',()=>{
 const {store,run}=setup();run('input-session-client',{client:'phone'});assert.equal(store.state.inputSession?.phase,'idle');
 run('open','workbuddy');run('wb-focus',{id:'wb:draft:new'});assert.equal(store.state.inputSession?.phase,'active');assert.equal(store.state.inputSession?.client,'phone');
 run('input-session-pause');run('wb-focus',{id:'wb:draft:new'});assert.equal(store.state.inputSession?.phase,'active');
 run('demo-reset');run('input-session-client',{client:'phone'});assert.equal(store.state.inputSession?.phase,'idle');
 run('input-session-request',{source:'taskbar'});assert.equal(store.state.inputSession?.phase,'pending');
});
test('field clicked before client registration becomes active only after registration; WeChat reading remains required',()=>{
 const {store,run}=setup();run('open','wechat');run('chat-focus',{conversation:'wx-boss'});
 assert.equal(store.state.inputSession?.phase,'pending');assert.notEqual(store.state.chat.activation?.phase,'ready');
 run('input-session-client',{client:'phone'});assert.equal(store.state.inputSession?.phase,'active');assert.notEqual(store.state.chat.activation?.phase,'ready');
 run('input-session-client',{client:'new-process'});assert.equal(store.state.inputSession?.phase,'idle');
 run('chat-focus',{conversation:'wx-boss'});assert.equal(store.state.inputSession?.phase,'active');
});
