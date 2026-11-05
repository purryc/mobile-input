import test from 'node:test';import assert from 'node:assert/strict';import {SnapshotGate,snapshotFingerprint} from './snapshot-gate.mjs';
test('a continuous pointer gesture cannot enqueue background AX scans, then polling resumes',()=>{let time=0;const gate=new SnapshotGate(()=>time);assert.equal(gate.canPoll(),true);for(let i=0;i<600;i++){time+=16;gate.pointer();assert.equal(gate.canPoll(),false);}time+=249;assert.equal(gate.canPoll(),false);time++;assert.equal(gate.canPoll(),true);});

test('BLE pointer receipts slower than 250ms still suppress background scans during motion',()=>{
 let now=0;const gate=new SnapshotGate(()=>now,1200);
 for(let i=0;i<20;i++){gate.pointer();now+=600;assert.equal(gate.canPoll(),false);}
 now+=599;assert.equal(gate.canPoll(),false);now++;assert.equal(gate.canPoll(),true);
});
test('Bluetooth suppresses only cursor-only snapshots, retaining real control state changes',()=>{
 const state={app:'workbuddy',target:'task-1',text:'fictional',selection:[0,0],pointer:{x:0,y:0},tasks:[{id:'1',status:'running'}]};
 const moved={...state,pointer:{x:0.9,y:0.5}};
 assert.equal(snapshotFingerprint(state,true),snapshotFingerprint(moved,true));
 assert.notEqual(snapshotFingerprint(state),snapshotFingerprint(moved));
 for(const change of [{target:'task-2'},{text:'new fictional'},{selection:[1,0]},{app:'codex'},{tasks:[{id:'1',status:'needs-input'}]}])
  assert.notEqual(snapshotFingerprint(state,true),snapshotFingerprint({...state,...change},true));
 assert.deepEqual(state.pointer,{x:0,y:0});
});
