import test from 'node:test';
import assert from 'node:assert/strict';
import {expandBluetoothPointer} from './bluetooth-pointer-codec.mjs';
import {validateCommand} from './protocol.mjs';
const id='11111111-1111-4111-8111-111111111111';
const row=['p1',id,1,id,id,id,'move',12.345678,-6.75,0];
test('compact pointer preserves full identity, sequence and exact relative displacement',()=>{
 const result=expandBluetoothPointer(row);
 assert.deepEqual(result,{kind:'command',op:'pointer',id,seq:1,session:id,window:id,target:id,action:'move',relative:true,x:0,y:0,deltaX:12.345678,deltaY:-6.75,dy:0});
 assert.equal(validateCommand(result,id),'');
 assert.ok(Buffer.byteLength(JSON.stringify(row)+'\n')<=244);
 assert.ok(Buffer.byteLength(JSON.stringify(result))>244);
});
test('compact pointer does not evade stale session, magnitude or action validation',()=>{
 assert.notEqual(validateCommand(expandBluetoothPointer(row),'other'),'');
 for(const [index,value] of [[7,9000],[8,null],[6,'send'],[2,-1],[4,'']]){
  const invalid=[...row];invalid[index]=value;
  assert.notEqual(validateCommand(expandBluetoothPointer(invalid),id),'');
 }
});
test('malformed compact frames reject and legacy objects retain original semantics',()=>{
 for(const value of [[],['p1'],['p2',...row.slice(1)],[...row,1]])assert.throws(()=>expandBluetoothPointer(value));
 const old={kind:'command',op:'pointer',x:.5,y:.3};assert.equal(expandBluetoothPointer(old),old);
});
