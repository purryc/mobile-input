import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PointerQueue,type PointerSample} from './pointer-queue';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){const sent:PointerSample[]=[],acks:((ok:boolean)=>void)[]=[];let failures=0;const queue=new PointerQueue(p=>{sent.push(p);return new Promise(resolve=>acks.push(resolve));},()=>failures++);const push=(action:PointerSample['action'],x:number,dy=0)=>queue.push({action,x,y:.5,dy});return {sent,acks,queue,push,failures:()=>failures};}
test('slow transport collapses hundreds of moves to newest coordinate across ordered button edges',async()=>{
 const s=setup();s.push('down',0);
 for(let i=1;i<=300;i++)s.push('move',i/300);
 s.push('up',1);
 assert.deepEqual(s.sent.map(p=>p.action),['down']);
 s.acks.shift()!(true);await tick();assert.equal(s.sent[1].x,1);
 s.acks.shift()!(true);await tick();assert.deepEqual(s.sent.map(p=>p.action),['down','move','up']);
 s.acks.shift()!(true);await tick();assert.equal(s.sent.length,3);
});
test('reset invalidates pending samples and late receipts cannot drain a replacement gesture',async()=>{
 const s=setup();s.push('move',.1);s.push('move',.2);const old=s.acks.shift()!;
 s.queue.clear();s.push('move',.7);s.push('move',.8);
 old(true);await tick();assert.deepEqual(s.sent.map(p=>p.x),[.1,.7]);
 s.acks.shift()!(true);await tick();assert.equal(s.sent.at(-1)!.x,.8);
});
test('failed receipt drops old moves and buttons; scroll accumulates only within its boundary',async()=>{
 const s=setup();s.push('move',.1);s.push('scroll',.2,40);s.push('scroll',.2,50);s.push('right',.2);
 s.acks.shift()!(true);await tick();assert.equal(s.sent[1].dy,90);
 s.acks.shift()!(false);await tick();assert.equal(s.sent.length,2);assert.equal(s.failures(),1);
});
