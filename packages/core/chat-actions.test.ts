import test from 'node:test';
import assert from 'node:assert/strict';
import {Store} from './model';
import {messageActions,visibleMessageSource} from '../../apps/web/src/chat-actions';
const cmd=(type:string,value?:unknown)=>({id:crypto.randomUUID(),type,value});
test('each conversation maps visible meaningful messages, skipping closing chatter',()=>{
 const s=new Store().state;
 for(const id of Object.keys(s.chat.messages)){
  const visible=s.chat.messages[id].slice(-8).map(m=>m.id);
  const mid=visibleMessageSource(s,id,visible)!;
  assert.ok(visible.includes(mid),id);assert.ok(messageActions(s,id,mid).length,id);
  for(const action of messageActions(s,id,mid))assert.ok(action.recordKey?.startsWith(`${id}:${mid}:`));
 }
 assert.equal(visibleMessageSource(s,'wx-alex',['e7']),'e7');
 assert.equal(visibleMessageSource(s,'wx-alex',['e3']),'e3');
 assert.deepEqual(messageActions(s,'wx-alex','e7'),[]);
 assert.equal(visibleMessageSource(s,'wx-daily',['l0','dummy-life-01']),'l0');
 const menu=messageActions(s,'wx-daily','l0');assert.ok(menu.length);assert.ok(menu.every(a=>!['pay','order'].includes(a.id)));
});
test('reading uses the explicit visible source while preserving draft and rejecting invalid sources',()=>{
 const s=new Store();s.dispatch(cmd('open','wechat'));s.dispatch(cmd('chat-open','wx-alex'));
 s.state.chat.drafts['wx-alex'].text='保留我的草稿';
 s.dispatch(cmd('chat-focus',{conversation:'wx-alex',sourceMessageId:'e5'}));
 assert.equal(s.state.chat.context?.messageId,'e5');assert.equal(s.state.chat.activation?.messageId,'e5');
 s.dispatch(cmd('chat-focus',{conversation:'wx-alex',sourceMessageId:'e4'}));
 assert.equal(s.state.chat.context?.messageId,'e4');assert.equal(s.state.chat.drafts['wx-alex'].text,'保留我的草稿');
 assert.equal(s.dispatch(cmd('chat-focus',{conversation:'wx-alex',sourceMessageId:'w-garden'})).ok,false);
});
