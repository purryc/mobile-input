import test from 'node:test';
import assert from 'node:assert/strict';
import {BluetoothPeer} from './bluetooth-route.mjs';
test('Bluetooth preserves the existing packet contract and peer ownership',()=>{
 const writes=[],messages=[];const peer=new BluetoothPeer('first',p=>writes.push(p));peer.on('message',b=>messages.push(JSON.parse(b)));
 peer.receive(JSON.stringify({kind:'probe'}));peer.send(JSON.stringify({kind:'route',bridgeId:'test'}));
 assert.deepEqual(messages,[{kind:'probe'}]);assert.equal(writes[0].peer,'first');assert.equal(JSON.parse(writes[0].data).bridgeId,'test');
 let closes=0;peer.on('close',()=>closes++);peer.close();peer.close();peer.receive('{"kind":"command"}');peer.send('ignored');assert.equal(closes,1);assert.equal(messages.length,1);assert.equal(writes.length,2);
});
test('Bluetooth rejects oversized and unframed messages rather than executing them',()=>{
 for(const text of ['x'.repeat(262145),'{}\n{}']){const peer=new BluetoothPeer('test',()=>{});let called=false;peer.on('message',()=>called=true);peer.receive(text);assert.equal(called,false);assert.equal(peer.readyState,3);}
});

test('native GATT framing isolates reconnects and bounds queued output',async t=>{
 if(process.platform!=='darwin')return t.skip('Swift native adapter is macOS-only');
 const {readFileSync,writeFileSync,mkdtempSync,rmSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const dir=mkdtempSync(join(tmpdir(),'input-agent-bt-test-'));
 try{
  let source=readFileSync(new URL('./bluetooth.swift',import.meta.url),'utf8');
  const start=source.indexOf('func emit('),end=source.indexOf('final class BluetoothServer');
  source=source.slice(0,start)+'var events = [[String:Any]]()\nfunc emit(_ value:[String:Any]) { events.append(value) }\n'+source.slice(end,source.indexOf('let server=BluetoothServer();'));
  source+=String.raw`
let server=BluetoothServer()
let pair=Data("{\"kind\":\"pair\"}\n".utf8)
for byte in pair { server.receive(Data([byte])) }
assert(events.count == 2 && events[0]["kind"] as? String == "open")
let first=server.peer
server.receive(Data("{\"text\":\"中文😀\"}\n".utf8))
assert(events.last?["data"] as? String == "{\"text\":\"中文😀\"}")
server.command(try! JSONSerialization.data(withJSONObject:["kind":"data","peer":first,"data":"{}"]));assert(!server.outgoing.isEmpty)
server.receive(pair);assert(server.peer != first && server.outgoing.isEmpty)
server.command(try! JSONSerialization.data(withJSONObject:["kind":"data","peer":first,"data":"stale"]));assert(server.outgoing.isEmpty)
server.receive(Data(repeating:65,count:262145));assert(server.peer.isEmpty && server.incoming.isEmpty)
print("native-framing-passed")
`;
  const path=join(dir,'test.swift');writeFileSync(path,source);const run=spawnSync('/usr/bin/swift',[path],{encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);assert.match(run.stdout,/native-framing-passed/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
