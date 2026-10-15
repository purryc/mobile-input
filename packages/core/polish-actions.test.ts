import {test} from 'node:test';
import assert from 'node:assert/strict';
import {polishActionsForTarget,polishInstruction} from './polish-actions';
const labels=(app:string,id:string,kind='text')=>polishActionsForTarget({app,id,kind}).map(a=>a.label);
test('polish suggestions follow editable scene and keep new tasks format neutral',()=>{
 assert.deepEqual(labels('wechat','composer'),['自然回复','更礼貌','简短回复']);
 assert.deepEqual(labels('workbuddy','wb:task:new'),['说清需求','整理要点','精简指令']);
 assert.deepEqual(labels('workbuddy','wb:object:f:slide/0/title'),['说清需求','整理要点','精简指令']);
 assert.deepEqual(labels('workbuddy','wb:doc:f:slide/0/title'),['标题清晰','精简标题','修正语病']);
 assert.deepEqual(labels('workbuddy','wb:doc:f:paragraph/0'),['规范表述','精简表达','修正语病']);
 assert.deepEqual(labels('slides','slide:0:notes'),['口语讲述','提炼要点','压缩讲稿']);
 assert.deepEqual(labels('bilibili','danmaku'),['自然评论','简短弹幕','更礼貌']);
 assert.deepEqual(labels('mail','mail-draft'),['商务表达','说清诉求','精简表达']);
 assert.deepEqual(labels('paint','paint:l:name'),['清晰命名','精简表达','修正语病']);
 assert.deepEqual(labels('sheet','cell','number'),[]);assert.deepEqual(polishActionsForTarget(null),[]);
});
test('every exposed action has an allowlisted rewrite instruction, unknown actions are rejected',()=>{
 for(const app of ['wechat','workbuddy','mail','notes','word','slides','paint','bilibili','doubao']){
  const actions=polishActionsForTarget({app,id:'text',kind:'text'});assert.equal(actions.length,3);
  assert.equal(new Set(actions.map(a=>a.id)).size,3);
  for(const action of actions)assert.ok(polishInstruction(action.id));
 }
 assert.equal(polishInstruction('execute-task'),'');assert.ok(polishInstruction('简洁'));
});
