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
