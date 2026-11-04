import {test} from 'node:test';import assert from 'node:assert/strict';
import {selectionAfterTextChange,mapProjectedSelection} from './text-selection';
import {projectTargetInput,resolveLiveParameters,workBuddyInputCapabilities} from './live-workbuddy';
test('caret follows insertion and replacement, while positions outside edits are retained',()=>{
 assert.deepEqual(selectionAfterTextChange('甲乙','甲😀乙',{start:1,end:1}),{start:3,end:3});
 assert.deepEqual(selectionAfterTextChange('甲乙丙','甲替换丙',{start:1,end:2}),{start:3,end:3});
 assert.deepEqual(selectionAfterTextChange('甲乙','甲乙',{start:1,end:1}),{start:1,end:1});
 assert.deepEqual(selectionAfterTextChange('甲乙','甲乙新',{start:0,end:0}),{start:0,end:0});
});
test('projection maps caret and selection past independent color/duration chips in both directions',()=>{
 const text='讲十分钟，背景灰色，字体黑色，主题红色。结束';const p=projectTargetInput(text,resolveLiveParameters(text),[],workBuddyInputCapabilities);
 for(const range of [{start:0,end:0},{start:text.length,end:text.length},{start:text.length-2,end:text.length},...p.spans.map(s=>({start:s.sourceStart,end:s.sourceEnd}))]){
  const target=mapProjectedSelection(range,p.spans);assert.deepEqual(mapProjectedSelection(target,p.spans,true),range);
 }
});
