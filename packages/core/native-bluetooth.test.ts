import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';
const SERVICE='f468b188-20d3-4b47-a4bd-8e573840a070',RX=SERVICE.slice(0,-1)+'1',TX=SERVICE.slice(0,-1)+'2';
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function setup(manualMtu=false){
 const clients:any[]=[],received:string[]=[],events:any[]=[];let failed=0,opened=0;
 const ble={GattWriteType:{WRITE:1,WRITE_NO_RESPONSE:2},createGattClientDevice:(device:string)=>{const c={device,callbacks:{} as Record<string,Function>,writes:[] as Uint8Array[],writeKinds:[] as number[],closed:false,notifications:[] as any[],on:(k:string,f:Function)=>{c.callbacks[k]=f;},off:()=>{},connect:()=>{},disconnect:()=>{},close:()=>{c.closed=true;},setBLEMtuSize:()=>{if(!manualMtu)c.callbacks.BLEMtuChange(247);},getServices:async()=>[{serviceUuid:SERVICE,characteristics:[RX,TX].map(characteristicUuid=>({serviceUuid:SERVICE,characteristicUuid,characteristicValue:new ArrayBuffer(0),descriptors:[]}))}],setCharacteristicChangeNotification:async(value:any,enabled:boolean)=>{c.notifications.push({value,enabled});},writeCharacteristicValue:async(value:any,kind:number)=>{c.writeKinds.push(kind);c.writes.push(new Uint8Array(value.characteristicValue));}};clients.push(c);return c;}};
 const module:any={exports:{}};const code=transformSync(readFileSync(new URL('../../apps/harmony/shared/MacBluetooth.ets',import.meta.url),'utf8'),{loader:'ts',format:'cjs'}).code;
 runInNewContext(code,{module,exports:module.exports,Uint8Array,ArrayBuffer,JSON,console,setTimeout:()=>1,clearTimeout:()=>{},require:(name:string)=>name==='@kit.ConnectivityKit'?{ble,connection:{}}:{util:{TextEncoder:class{encodeInto(t:string){return new TextEncoder().encode(t);}},TextDecoder:class{decodeWithStream(t:Uint8Array){return new TextDecoder('utf-8',{fatal:true}).decode(t);}}}}});
 const link=new module.exports.MacBluetooth({},(name:string,data:string)=>events.push({name,data}));
 const connect=async()=>{link.connect('bt-AABBCCDDEEFF',()=>opened++,(text:string)=>received.push(text),()=>failed++);clients.at(-1).callbacks.BLEConnectionStateChange({state:2});await settle();};
 return {link,connect,clients,received,events,status:()=>({failed,opened})};
}
test('GATT subscribes before opening and preserves fragmented Chinese across notification packets',async()=>{
 const s=setup();await s.connect();const c=s.clients[0];assert.equal(c.device,'AA:BB:CC:DD:EE:FF');assert.equal(c.notifications[0].enabled,true);assert.equal(s.status().opened,1);
 const data=new TextEncoder().encode('{"text":"中文😀"}\n{"kind":"pong"}\n');for(const byte of data)c.callbacks.BLECharacteristicChange({characteristicUuid:TX,characteristicValue:new Uint8Array([byte]).buffer});assert.deepEqual(s.received,['{"text":"中文😀"}','{"kind":"pong"}']);
 c.callbacks.BLECharacteristicChange({characteristicUuid:RX,characteristicValue:data.buffer});assert.equal(s.received.length,2);
});
test('GATT serializes acknowledged writes within negotiated MTU without losing payload',async()=>{
 const s=setup();await s.connect();const c=s.clients[0];c.callbacks.BLEMtuChange(83);const text=JSON.stringify({text:'草图'.repeat(100)});assert.equal(s.link.send(text),true);await settle();await settle();assert.ok(c.writes.every((x:Uint8Array)=>x.length<=80));assert.equal(Buffer.concat(c.writes).toString(),text+'\n');
});
test('GATT ignores late old target notifications and write completions',async()=>{
 const s=setup();await s.connect();const old=s.clients[0];let release!:()=>void;old.writeCharacteristicValue=async()=>new Promise<void>(r=>release=r);s.link.send('{"old":true}');s.link.close();await s.connect();old.callbacks.BLECharacteristicChange({characteristicUuid:TX,characteristicValue:new TextEncoder().encode('{}\n').buffer});old.callbacks.BLEConnectionStateChange({state:0});release();await settle();assert.equal(s.received.length,0);assert.equal(s.status().failed,0);assert.equal(s.link.send('{}'),true);await settle();assert.equal(Buffer.concat(s.clients[1].writes).toString(),'{}\n');
});
test('GATT disconnects honestly on oversize frames or failed subscriptions',async()=>{
 const s=setup();await s.connect();s.clients[0].callbacks.BLECharacteristicChange({characteristicUuid:TX,characteristicValue:new Uint8Array(262145).buffer});assert.equal(s.status().failed,1);assert.equal(s.clients[0].closed,true);assert.equal(s.link.send('{}'),false);
 const n=setup();n.link.connect('bt-AABBCCDDEEFF',()=>{},()=>{},()=>{});const c=n.clients[0];c.setCharacteristicChangeNotification=async()=>{throw {code:2901005};};c.callbacks.BLEConnectionStateChange({state:2});await settle();assert.equal(c.closed,true);assert.equal(n.link.send('{}'),false);
});

test('GATT never starts authentication while MTU negotiation is still pending',async()=>{
 const s=setup(true);await s.connect();assert.equal(s.status().opened,0);assert.equal(s.link.send('{}'),false);assert.equal(s.clients[0].writes.length,0);s.clients[0].callbacks.BLEMtuChange(247);await settle();assert.equal(s.status().opened,1);assert.equal(s.link.send('{}'),true);await settle();assert.equal(s.clients[0].writes.length,1);
});

test('duplicate connected callbacks do not repeat GATT setup or authentication',async()=>{
 const s=setup(true);await s.connect();const c=s.clients[0];c.callbacks.BLEConnectionStateChange({state:2});await settle();assert.equal(c.notifications.length,1);c.callbacks.BLEMtuChange(247);await settle();c.callbacks.BLEConnectionStateChange({state:2});await settle();assert.equal(s.status().opened,1);assert.equal(c.notifications.length,1);
});

test('compact pointer is negotiated, fits one MTU and preserves identity and deltas',async()=>{
 const s=setup();await s.connect();const c=s.clients[0];const id='11111111-1111-4111-8111-111111111111';
 const packet={kind:'command',op:'pointer',id,seq:7,session:id,window:id,target:id,action:'move',relative:true,x:.456789,y:.876543,deltaX:12.345678,deltaY:-6.75,dy:0};
 s.link.send(JSON.stringify(packet));await settle();assert.equal(Buffer.concat(c.writes).toString(),JSON.stringify(packet)+'\n');c.writes=[];
 c.callbacks.BLECharacteristicChange({characteristicUuid:TX,characteristicValue:new TextEncoder().encode(JSON.stringify({kind:'connected',bluetoothFeatures:['compact-pointer-v1']})+'\n').buffer});
 s.link.send(JSON.stringify(packet));await settle();assert.equal(c.writes.length,1);assert.deepEqual(JSON.parse(Buffer.concat(c.writes).toString()),['p1',id,7,id,id,id,'move',12.345678,-6.75,0]);
 c.writes=[];s.link.send(JSON.stringify({...packet,relative:false}));await settle();assert.equal(JSON.parse(Buffer.concat(c.writes).toString()).relative,false);
 s.link.close();await s.connect();s.link.send(JSON.stringify(packet));await settle();assert.equal(Buffer.concat(s.clients[1].writes).toString(),JSON.stringify(packet)+'\n');
});

test('negotiated one-packet moves skip only ATT response; edges and materials remain acknowledged',async()=>{
 const s=setup();await s.connect();const c=s.clients[0],id='11111111-1111-4111-8111-111111111111';
 const move={kind:'command',op:'pointer',id,seq:1,session:id,window:id,target:id,action:'move',relative:true,deltaX:2,deltaY:3,dy:0};
 c.callbacks.BLECharacteristicChange({characteristicUuid:TX,characteristicValue:new TextEncoder().encode(JSON.stringify({kind:'connected',bluetoothFeatures:['compact-pointer-v1','pointer-write-command-v1']})+'\n').buffer});
 s.link.send(JSON.stringify(move));await settle();assert.deepEqual(c.writeKinds,[2]);
 s.link.send(JSON.stringify({...move,action:'up'}));await settle();assert.equal(c.writeKinds.at(-1),1);
 s.link.send(JSON.stringify({kind:'command',op:'file-chunk',data:'fictional'}));await settle();assert.equal(c.writeKinds.at(-1),1);
 c.callbacks.BLEMtuChange(83);c.writeKinds=[];s.link.send(JSON.stringify(move));await settle();assert.ok(c.writeKinds.length>1);assert.ok(c.writeKinds.every((k:number)=>k===1));
 s.link.close();await s.connect();s.link.send(JSON.stringify(move));await settle();assert.ok(s.clients[1].writeKinds.every((k:number)=>k===1));
});
