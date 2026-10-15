import {test} from 'node:test';import assert from 'node:assert/strict';
import {snapshotDelta,applySnapshotDelta} from './snapshot-delta';
import {initialState} from './model';
test('distributed snapshots transfer only changed fields and preserve original state',()=>{
 const before=JSON.parse(JSON.stringify(initialState())),after=structuredClone(before);after.revision++;after.texts.example='中文😀 <svg/>';after.slides[0].title='新标题';delete after.texts['wechat-draft'];
 const ops=snapshotDelta(before,after);assert.deepEqual(applySnapshotDelta(before,ops),after);assert.notEqual(before.slides[0].title,after.slides[0].title);assert.ok(JSON.stringify(ops).length<1000);
});
test('snapshot deltas cover array insertions/removals and reject unsafe paths',()=>{
 for(const [a,b] of [[{a:[1,2]},{a:[1,2,3]}],[{a:{b:1,c:2}},{a:{b:2}}],[{a:1},{a:null}]])assert.deepEqual(applySnapshotDelta(a,snapshotDelta(a,b)),b);
 assert.throws(()=>applySnapshotDelta({},[{path:['__proto__','x'],value:1}]));assert.throws(()=>applySnapshotDelta({},[{path:['missing','x'],value:1}]));
});
