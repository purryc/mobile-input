import {test} from 'node:test';
import assert from 'node:assert/strict';
import {controlKinds} from '../src/types';
import {catalog,spec} from '../example/compact-catalog';
test('final spec covers exactly the existing 13 widgets and all 325 bilingual cases',()=>{
 assert.deepEqual([...spec.controls.map(c=>c.kind)].sort(),[...controlKinds].sort());
 assert.equal(spec.controls.flatMap(c=>c.cases).length,325);
 assert.deepEqual(spec.controls.map(c=>c.priority),[...Array(4).fill('P0'),...Array(4).fill('P1'),...Array(5).fill('P2')]);
 for(const control of spec.controls){assert.equal(control.cases.length,25);assert.deepEqual(control.cases.map(c=>c.id),Array.from({length:25},(_,i)=>i+1));assert.ok(control.nodeId&&control.examplesNodeId);for(const c of control.cases)assert.ok(c.zh&&c.en);}
 assert.deepEqual(Object.keys(catalog).sort(),[...controlKinds].sort());
});
