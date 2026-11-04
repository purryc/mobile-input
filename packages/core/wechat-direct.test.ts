import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Store} from './model';
const cmd=(type:string,value?:unknown)=>({id:crypto.randomUUID(),type,value});
test('meaningful read is independent of reply focus; voice binding preserves source and read epoch',()=>{
 const s=new Store();s.dispatch(cmd('open','wechat'));const id='wx-boss',source=s.state.chat.context!.messageId;
 assert.ok(s.dispatch(cmd('chat-read',{conversation:id,sourceMessageId:source})).ok);assert.equal(s.state.target,null);
 const a=s.state.chat.activation!;s.state.chat.activation!.startedAt=Date.now()-2600;
 assert.ok(s.dispatch(cmd('chat-read-stage',{epoch:a.epoch,phase:'ready'})).ok);
 const context=s.state.chat.context!;
 assert.ok(s.dispatch(cmd('chat-focus',{conversation:id,preserveRead:true})).ok);
 assert.equal(s.state.chat.context!.epoch,context.epoch);assert.equal(s.state.chat.activation!.epoch,a.epoch);assert.equal(s.state.chat.activation!.phase,'ready');
 const before=s.state.chat.messages[id].length;
 assert.ok(s.dispatch(cmd('chat-reply',{conversation:id,messageId:source,contextEpoch:context.epoch,text:'我尽量在明天下午两点前整理好资料。'})).ok);
 assert.equal(s.state.chat.messages[id].length,before);assert.equal(s.state.target!.value,s.state.chat.drafts[id].text);
 s.dispatch(cmd('chat-open','wx-daily'));assert.equal(s.dispatch(cmd('chat-read-stage',{epoch:a.epoch,phase:'ready'})).ok,false);
});
test('suggestion adoption focuses composer, never overwrites a selected message or sends',()=>{
 const s=new Store();s.dispatch(cmd('open','wechat'));const id='wx-boss',source=s.state.chat.context!.messageId;
 s.dispatch(cmd('chat-focus',{conversation:id,messageId:source}));s.dispatch(cmd('chat-read',{conversation:id,sourceMessageId:source}));s.state.chat.activation!.startedAt=Date.now()-2600;
 s.dispatch(cmd('chat-read-stage',{epoch:s.state.chat.activation!.epoch,phase:'ready'}));
 const before=structuredClone(s.state.chat.messages[id]),context=s.state.chat.context!;
 assert.ok(s.dispatch(cmd('chat-reply',{conversation:id,messageId:source,contextEpoch:context.epoch,text:'收到，我来准备。'})).ok);
 assert.equal(s.state.target!.id,'composer:'+id);assert.deepEqual(s.state.chat.messages[id],before);
 assert.equal(s.dispatch(cmd('chat-read',{conversation:id,sourceMessageId:'missing'})).ok,false);
});
