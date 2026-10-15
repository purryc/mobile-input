import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DistributedReader,DistributedWriter} from './distributed-wire';
test('distributed text preserves Chinese, emoji, SVG and large JSON without duplicate execution',()=>{
 const payload=JSON.stringify({svg:'<svg><text>中文😀</text></svg>',body:'海边😀'.repeat(60000)}),writer=new DistributedWriter(),reader=new DistributedReader();let received:string[]=[];
 const frames=writer.frames(payload);for(const f of frames){const v=reader.read(f);if(v!==null)received.push(v);}
 for(const f of frames)assert.equal(reader.read(f),null);
 assert.deepEqual(received,[payload]);assert.equal(reader.read(writer.frames('next')[0]),'next');
});
test('missing, corrupt, oversized and expired packets cannot become application messages',()=>{
 const frames=new DistributedWriter().frames('a'.repeat(5000));
 assert.throws(()=>new DistributedReader().read(frames[1]));
 const r=new DistributedReader();r.read(frames[0],1);assert.throws(()=>r.read(frames[1],31002));
 assert.throws(()=>new DistributedReader().read(JSON.stringify({protocol:'input-agent/1',id:1,index:0,total:16385,body:''})));
 assert.throws(()=>new DistributedWriter().frames('a'.repeat(2097153)));
});

test('every serialized packet fits the native 1 KiB limit with escaped and multi-byte text',()=>{
 for(const text of ['中文😀'.repeat(5000),'"\\\n\u0000'.repeat(5000),'a'.repeat(2097152),'\ud800'.repeat(3000)]){
  const frames=new DistributedWriter().frames(text),r=new DistributedReader();let result:string|null=null;
  for(const frame of frames){assert.ok(Buffer.byteLength(frame,'utf8')<=1024);result=r.read(frame);}
  assert.equal(result,text);
 }
});
