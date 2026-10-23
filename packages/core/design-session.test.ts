import {test} from 'node:test';import assert from 'node:assert/strict';
import {Store,type Command} from './model';
import {activeFileView,fileBody,fileDirty} from './workbuddy-files';
import {objectContext} from './workbuddy-object';
import {selectionStyle} from './text-runs';
function setup(){const s=new Store();let i=0;const run=(type:string,value:unknown={},extra:Partial<Command>={})=>s.dispatch({id:'design-'+ ++i,type,value,...extra});return {s,run};}
test('pointer samples preserve business revisions and references while enforcing session and app',()=>{
 const {s,run}=setup();run('input-session-client',{client:'phone'});
 run('input-session-request');run('input-session-confirm',{id:s.state.inputSession!.id});
 const scope={inputClient:'phone',inputSession:s.state.inputSession!.id,app:s.state.app};
 const {revision,workbuddy,officeFiles,editSession}=s.state;
 for(let i=0;i<200;i++){const ack=run('input-pointer',{x:i/200,y:.5,action:'move'},scope);assert.equal(ack.ok,true);assert.equal(ack.revision,revision);}
 assert.equal(s.state.workbuddy,workbuddy);assert.equal(s.state.officeFiles,officeFiles);assert.equal(s.state.editSession,editSession);
 assert.equal(s.state.inputPointer!.x,199/200);
 assert.equal(run('input-pointer',{x:0,y:0,action:'move'},{...scope,app:'wechat'}).ok,false);
 assert.equal(run('input-pointer',{x:0,y:0,action:'move'},{...scope,inputSession:'old'}).ok,false);
 run('open','workbuddy',scope);assert(s.state.revision>revision);
 assert.equal(s.state.inputPointer,undefined);
});
test('pointer cancel releases a drag without changing tasks, drafts or input session',()=>{
 const {s,run}=setup();run('input-session-request');run('input-session-confirm',{id:s.state.inputSession!.id});
 run('input-pointer',{x:.4,y:.5,action:'down'});assert.equal(s.state.inputPointer?.held,true);
 const session=structuredClone(s.state.inputSession),workbuddy=JSON.stringify(s.state.workbuddy);
 run('input-pointer',{x:.4,y:.5,action:'cancel'});
 assert.equal(s.state.inputPointer,undefined);assert.deepEqual(s.state.inputSession,session);
 assert.equal(JSON.stringify(s.state.workbuddy),workbuddy);
});
test('keyboard entries share a stable confirmation and never change drafts or start controls',()=>{
 const {s,run}=setup();run('input-session-client',{client:'phone1'});
 const drafts=JSON.stringify(s.state.workbuddy.drafts),chat=JSON.stringify(s.state.chat.drafts);
 run('input-session-request',{source:'taskbar'});const id=s.state.inputSession!.id;
 run('input-session-request',{source:'keyboard'});
 assert.equal(s.state.inputSession!.id,id);
 assert.equal(run('input-session-confirm',{id}).ok,true);
 run('input-session-request',{source:'taskbar'});
 assert.equal(s.state.inputSession!.id,id);assert.equal(s.state.inputSession!.phase,'active');
 assert.equal(s.state.app,'desktop');assert.equal(s.state.target,null);
 assert.equal(JSON.stringify(s.state.workbuddy.drafts),drafts);assert.equal(JSON.stringify(s.state.chat.drafts),chat);
 assert.equal(s.state.inputPointer,undefined);assert.deepEqual(s.state.gameKeys,[]);
});
test('pairing is idle, explicit request confirms once, pause and process replacement reject old writes',()=>{const {s,run}=setup();run('input-session-client',{client:'phone1'});assert.equal(s.state.inputSession?.phase,'idle');run('input-session-request');const id=s.state.inputSession!.id;const phone={inputClient:'phone1',inputSession:id};assert.equal(run('open','workbuddy',phone).ok,false);assert.equal(run('input-session-confirm',{id}).ok,true);assert.equal(run('open','workbuddy',phone).ok,true);run('wb-focus',{id:'wb:draft:new'});assert.equal(s.state.inputSession!.phase,'active');run('input-session-pause');assert.equal(run('input-pointer',{action:'down',x:.5,y:.5},phone).ok,false);run('input-session-resume',{client:'phone1'});assert.equal(run('input-pointer',{action:'down',x:.5,y:.5},phone).ok,false);phone.inputSession=s.state.inputSession!.id;assert.equal(run('input-pointer',{action:'down',x:.5,y:.5},phone).ok,true);run('release');assert.equal(s.state.inputPointer,undefined);run('input-session-client',{client:'phone2'});assert.equal(s.state.inputSession!.phase,'idle');assert.equal(run('open','mail',phone).ok,false);});
test('reply adopts exactly once, stays unsent, editing then clearing cannot reopen it',()=>{const {s,run}=setup();run('open','wechat');run('chat-focus',{conversation:'wx-boss'});s.state.chat.activation!.startedAt=Date.now()-2600;const epoch=s.state.chat.activation!.epoch;run('chat-read-stage',{epoch,phase:'scan'});run('chat-read-stage',{epoch,phase:'ready'});const ctx=s.state.chat.context!,count=s.state.chat.messages['wx-boss'].length,p={conversation:'wx-boss',text:'收到，我来安排。',messageId:ctx.messageId,contextEpoch:ctx.epoch};assert.equal(run('chat-reply',p).ok,true);assert.equal(s.state.chat.messages['wx-boss'].length,count);assert.equal(s.state.chat.drafts['wx-boss'].text,p.text);const target=s.state.target!,d=s.state.chat.drafts['wx-boss'];assert.equal(run('chat-edit',{conversation:'wx-boss',text:'',revision:d.revision,session:'edit',sequence:1},{targetId:target.id,targetRevision:target.revision}).ok,true);assert.equal(run('chat-reply',p).ok,false);assert.equal(s.state.chat.messages['wx-boss'].length,count);});
test('range formats preserve neighbours, mixed state, undo redo and manual save to same Office file',()=>{const {s,run}=setup();run('open','workbuddy');run('wb-fb-open',{file:'sales-slides'});const view=activeFileView(s.state).id,path='slide/0/title',file='sales-slides',body=()=>fileBody(s.state,activeFileView(s.state),file),select=(start:number,end:number)=>run('wb-object-select',{view,file,path,start,end});const before=body().slides![0].title;select(0,2);const anchor=()=>({targetId:s.state.target!.id,targetRevision:s.state.target!.revision});assert.equal(run('wb-object-style',{revision:objectContext(s.state)!.revision,style:{bold:true,color:'#FF0000',size:40}},anchor()).ok,true);assert.equal(fileDirty(s.state,activeFileView(s.state),file),true);assert.equal(s.state.officeFiles.find(f=>f.id==='sample-slides')!.textRuns,undefined);select(0,before.length);assert(selectionStyle(before,body().textRuns?.[path],0,before.length,{size:36}).mixed.includes('bold'));run('wb-fb-undo',{view,file});assert.equal(body().textRuns,undefined);run('wb-fb-redo',{view,file});assert.equal(body().textRuns?.[path][0].end,2);select(0,2);const old={...anchor()},d=s.state.workbuddy.entityDrafts[s.state.target!.id];assert.equal(run('wb-submit',{revision:d.revision,text:'改为新😀'},anchor()).ok,true);assert.equal(body().slides![0].title,'新😀'+before.slice(2));assert.equal(s.state.officeFiles.find(f=>f.id==='sample-slides')!.slides![0].title,before);run('wb-fb-save',{view,file});assert.equal(s.state.officeFiles.find(f=>f.id==='sample-slides')!.slides![0].title,'新😀'+before.slice(2));select(3,4);assert.equal(run('wb-object-style',{revision:0,style:{bold:true}},old).ok,false);});
test('mail suggestion stays in the current draft until explicit send, never replaces user text',()=>{const {s,run}=setup();run('open','mail');run('mail-compose','reply');const before=s.state.mails.length,source=s.state.mailId;assert.equal(run('mail-adopt',{source:'other',text:'错误归属'}).ok,false);assert.equal(run('mail-adopt',{source,text:'收到，稍后回复。'}).ok,true);assert.equal(s.state.mails.length,before);assert.equal(s.state.draft,'收到，稍后回复。');const t=s.state.target!;run('input','',{app:'mail',targetId:t.id,targetRevision:t.revision});assert.equal(run('mail-adopt',{source,text:'旧建议'}).ok,false);run('input','已确认报价。',{app:'mail',targetId:s.state.target!.id,targetRevision:s.state.target!.revision});assert.equal(run('mail-send').ok,true);assert.equal(s.state.mails.length,before+1);});
test('clipboard range replacement is version guarded, undoable and remains unsaved',()=>{const {s,run}=setup();run('open','workbuddy');run('wb-fb-open',{file:'sales-slides'});const view=activeFileView(s.state).id,file='sales-slides',path='slide/0/title',body=()=>fileBody(s.state,activeFileView(s.state),file),before=body().slides![0].title;run('wb-object-select',{view,file,path,start:0,end:2});const t=s.state.target!,anchor={targetId:t.id,targetRevision:t.revision},revision=objectContext(s.state)!.revision;assert.equal(run('wb-object-replace',{revision,text:'新😀'},anchor).ok,true);assert.equal(body().slides![0].title,'新😀'+before.slice(2));assert.equal(run('wb-object-replace',{revision,text:'晚到剪切'},anchor).ok,false);run('wb-fb-undo',{view,file});assert.equal(body().slides![0].title,before);run('wb-fb-redo',{view,file});assert.equal(body().slides![0].title,'新😀'+before.slice(2));assert.equal(s.state.officeFiles.find(f=>f.id==='sample-slides')!.slides![0].title,before);});
