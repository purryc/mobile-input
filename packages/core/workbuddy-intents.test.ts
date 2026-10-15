import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workBuddyIntents} from './workbuddy-intents';
import {inferWbInput} from './workbuddy-input';
import {newWbDraft} from './workbuddy';
const binding={task:'task-a',target:'wb:draft:task-a',targetRevision:7,inputRevision:12};
test('intent chips retain source range and task identity; negations do not offer tools',()=>{
 const text='主色用红色，画个布局，拍照补充，添加文档';const intents=workBuddyIntents(text,binding);
 assert.deepEqual(intents.map(x=>x.kind),['color','sketch','camera','document']);
 for(const i of intents){assert.equal(text.slice(i.start,i.end),i.phrase);assert.equal(i.task,'task-a');assert.equal(i.targetRevision,7);assert.equal(i.inputRevision,12);}
 assert.equal(workBuddyIntents('不要拍照，不用画个布局，无需添加文档，别主色用红色',binding).length,0);
 assert.equal(workBuddyIntents('指标飘红，左右为难',binding).length,0);
});
test('removing color intent invalidates suggestion without discarding confirmed sketch',()=>{
 const d=newWbDraft();inferWbInput(d,'主色用红色');d.input!.sketch={strokes:[[[0,0],[1,1]]],confirmed:true,interpretation:null};
 inferWbInput(d,'整理会议纪要');assert.equal(d.input!.color,null);assert.equal(d.input!.sketch.confirmed,true);assert.equal(d.input!.sketch.strokes.length,1);
});

test('every task accepts everyday shade and layout requests without a template keyword',()=>{
 for(const [text,word,hex] of [
  ['我想做一个主题测试深红色的ppt。主题色是深红色的ppt。','深红色','#A51127'],
  ['做一个红色的方案，布局我画一下','红色','#E03131'],
  ['背景换成浅蓝色，画一下页面布局','浅蓝色','#A5D8FF'],
  ['颜色用 #345678，手绘一个布局','#345678','#345678'],
 ]){
  const items=workBuddyIntents(text,binding);assert.ok(items.some(i=>i.kind==='color'),text);
  for(const i of items)assert.equal(text.slice(i.start,i.end),i.phrase);
  const d=newWbDraft(text);inferWbInput(d,text);assert.equal(d.input?.color?.word,word);assert.equal(d.input?.color?.hex,hex);
  if(/布局/.test(text))assert.ok(items.some(i=>i.kind==='sketch'),text);
 }
 for(const text of ['不要深红色，暂时不用画布局','不要把背景改成蓝色','指标飘红，左右为难','去年蓝色方案已经取消'])assert.equal(workBuddyIntents(text,binding).length,0,text);
 const d=newWbDraft();inferWbInput(d,'主色用红色，改成深蓝色');assert.equal(d.input?.color?.word,'深蓝色');
});
