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
test('relative movement sums unsent deltas and preserves drag/release barriers',async()=>{
 const s=setup();s.queue.push({x:.5,y:.5,dy:0,action:'down',relative:true,deltaX:0,deltaY:0});
 for(let i=0;i<100;i++)s.queue.push({x:.5,y:.5,dy:0,action:'move',relative:true,deltaX:3,deltaY:-2});
 s.queue.push({x:.5,y:.5,dy:0,action:'up',relative:true,deltaX:0,deltaY:0});
 s.acks.shift()!(true);await tick();assert.equal(s.sent[1].deltaX,300);assert.equal(s.sent[1].deltaY,-200);
 s.acks.shift()!(true);await tick();assert.equal(s.sent[2].action,'up');
});
function streamSetup(intervalMs=0){const sent:PointerSample[]=[],acks:((ok:boolean)=>void)[]=[];let failures=0;const queue=new PointerQueue(p=>{sent.push(p);return new Promise(resolve=>acks.push(resolve));},()=>failures++,{maxMoveInFlight:4,intervalMs});const move=(dx:number)=>queue.push({x:0,y:0,dy:0,action:'move',relative:true,deltaX:dx,deltaY:0});const edge=(action:PointerSample['action'])=>queue.push({x:0,y:0,dy:0,action,relative:true,deltaX:0,deltaY:0});return{sent,acks,queue,move,edge,failures:()=>failures};}
test('relative stream advances before each receipt with bounded outstanding work and conserved travel',async()=>{
 const s=streamSetup();for(let i=0;i<20;i++)s.move(3);
 assert.equal(s.sent.length,4);s.acks.shift()!(true);await tick();assert.equal(s.sent.length,5);
 assert.equal(s.sent.reduce((sum,p)=>sum+(p.deltaX||0),0),60);
});
test('out-of-order motion receipts cannot overtake a button barrier',async()=>{
 const s=streamSetup();s.move(1);s.move(2);s.edge('down');s.move(4);s.edge('up');
 assert.deepEqual(s.sent.map(p=>p.action),['move','move']);
 s.acks.splice(1,1)[0](true);await tick();assert.equal(s.sent.length,2);
 s.acks.shift()!(true);await tick();assert.equal(s.sent.at(-1)!.action,'down');
 s.acks.shift()!(true);await tick();assert.equal(s.sent.at(-1)!.action,'move');
 s.acks.shift()!(true);await tick();assert.equal(s.sent.at(-1)!.action,'up');
});
test('failed stream receipt drops queued work and ignores remaining late acknowledgements',async()=>{
 const s=streamSetup();for(let i=0;i<12;i++)s.move(2);s.edge('left');
 s.acks.shift()!(false);await tick();assert.equal(s.failures(),1);
 for(const ack of s.acks.splice(0))ack(true);await tick();assert.equal(s.sent.length,4);
 s.move(1);assert.equal(s.sent.length,5);
});
test('paced stream does not burst on one input callback, and clear cancels scheduled motion',async()=>{
 const s=streamSetup(16);s.move(1);s.move(2);s.move(3);assert.equal(s.sent.length,1);
 await new Promise(r=>setTimeout(r,25));assert.equal(s.sent.length,2);assert.equal(s.sent[1].deltaX,5);
 s.move(4);s.queue.clear();await new Promise(r=>setTimeout(r,25));assert.equal(s.sent.length,2);
});
test('coalescing retains travel beyond a single protocol delta limit',async()=>{
 const s=streamSetup();s.edge('down');s.move(3000);s.move(3000);
 s.acks.shift()!(true);await tick();assert.equal(s.sent.filter(p=>p.action==='move').reduce((sum,p)=>sum+(p.deltaX||0),0),6000);
});
