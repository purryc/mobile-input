import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';
function setup(){
 let saved:any=null;const FakeTrust=class{read(){return saved;}save(value:any){saved={...value};}};
 const sockets:any[]=[],events:any[]=[];let now=10000,timerId=0;const timers=new Map<number,{at:number,run:Function}>();
 const webSocket={createWebSocket(){const callbacks:Record<string,Function>={},writes:string[]=[];const socket={connection:null as any,callbacks,writes,closed:false,on:(name:string,fn:Function)=>{callbacks[name]=fn;},connect:async(url:string,options:unknown)=>{socket.connection={url,options};},send:async(data:string)=>{writes.push(data);},close:async()=>{socket.closed=true;}};sockets.push(socket);return socket;}};
 const bluetooth:any[]=[];const FakeBluetooth=class{callbacks:any;writes:string[]=[];closed=false;constructor(){bluetooth.push(this);}discover(){}connect(address:string,open:Function,data:Function,error:Function){this.closed=false;this.callbacks={address,open,data,error};}send(data:string){this.writes.push(data);return !this.closed;}close(){this.closed=true;}};
 const module:{exports:any}={exports:{}};const code=transformSync(readFileSync(new URL('../../apps/harmony/shared/MacLink.ets',import.meta.url),'utf8'),{loader:'ts',format:'cjs'}).code;
 runInNewContext(code,{module,exports:module.exports,require:(name:string)=>name==='./MacBluetooth'?{MacBluetooth:FakeBluetooth}:name==='@kit.NetworkKit'?{webSocket}:name==='./MacTrust'?{MacTrust:FakeTrust}:{util:{generateRandomUUID:()=> 'phone-process',TextDecoder:class{decodeWithStream(value:Uint8Array){return new TextDecoder().decode(value);}}}},Uint8Array,JSON,Date:{now:()=>now},setTimeout:(run:Function,ms:number)=>{timers.set(++timerId,{run,at:now+ms});return timerId;},clearTimeout:(id:number)=>timers.delete(id)});
 const message=(socket:any,data:unknown)=>socket.callbacks.message(null,JSON.stringify(data));
 const create=()=>new module.exports.MacLink({},(name:string,data:string)=>events.push({name,...JSON.parse(data)}));
 const auth=(socket:any)=>{socket.callbacks.open();message(socket,{kind:'connected',session:'stable-session',bridgeId:'same-mac',resumeToken:'a'.repeat(64)});};
 return {link:create(),create,sockets,bluetooth,events,message,auth,advance:(ms:number)=>{now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.run();}}};
}
test('manual Wi-Fi never probes or switches to USB on heartbeat',()=>{
 const s=setup();s.link.connect('x','172.20.10.2',39872,'123456','wifi');assert.match(s.sockets[0].connection.url,/172.20.10.2/);s.auth(s.sockets[0]);for(let i=0;i<3;i++){s.advance(1500);s.link.send('x','{"kind":"ping"}');}assert.equal(s.sockets.length,1);s.sockets[0].callbacks.close();assert.equal(s.sockets.length,1);assert.ok(s.events.some(e=>e.status==='error'));
});
test('manual USB never falls back to another route and retains trust across process restart',()=>{
 const s=setup();s.link.connect('x','172.20.10.2',39872,'123456','usb');assert.match(s.sockets[0].connection.url,/127.0.0.1/);s.auth(s.sockets[0]);s.sockets[0].callbacks.close();assert.equal(s.sockets.length,1);assert.equal(s.bluetooth[0].callbacks,undefined);const next=s.create();next.resume('next','usb');const socket=s.sockets.at(-1);socket.callbacks.open();assert.equal(JSON.parse(socket.writes[0]).pin,'a'.repeat(64));assert.equal(s.events.some(e=>String(e.payload).includes('a'.repeat(64))),false);
});
test('explicit Bluetooth connects directly without trying USB, and uses existing trust',()=>{
 const s=setup();s.link.connect('x','127.0.0.1',39872,'123456','usb');s.auth(s.sockets[0]);s.link.connect('bt','bt-AABBCCDDEEFF',39872,'','bluetooth');assert.equal(s.sockets.length,1);const bt=s.bluetooth[0];assert.equal(bt.callbacks.address,'bt-AABBCCDDEEFF');bt.callbacks.open();assert.equal(JSON.parse(bt.writes[0]).pin,'a'.repeat(64));bt.callbacks.data(JSON.stringify({kind:'connected',session:'stable-session',bridgeId:'same-mac',resumeToken:'a'.repeat(64)}));assert.ok(s.events.some(e=>e.status==='transport'&&e.message==='bluetooth'));s.link.send('bt','{"kind":"ping"}');assert.equal(s.sockets.length,1);
});
test('unknown receipts time out without replay, and explicit method switch rejects old callbacks',()=>{
 const s=setup();s.link.connect('x','127.0.0.1',39872,'123456','usb');const old=s.sockets[0];s.auth(old);s.link.send('x','{"kind":"command","id":"uncertain","op":"replace-text"}');s.advance(5000);assert.equal(old.closed,true);s.link.resume('new','usb');const next=s.sockets.at(-1);s.auth(next);const n=s.events.length;s.message(old,{kind:'ack',id:'uncertain'});old.callbacks.error();assert.equal(s.events.length,n);assert.equal(next.writes.some((m:string)=>m.includes('replace-text')),false);
});
test('missing method endpoint and stale connection fail honestly',()=>{
 const s=setup();s.link.connect('x','127.0.0.1',39872,'123456','usb');s.auth(s.sockets[0]);assert.equal(s.link.resume('wifi','wifi'),'unavailable');s.advance(10001);assert.equal(s.link.send('x','{"kind":"ping"}'),'unavailable');assert.ok(s.events.some(e=>e.status==='error'));
});
test('a different Mac cannot claim a resumed transport or overwrite existing trust',()=>{
 const s=setup();s.link.connect('x','127.0.0.1',39872,'123456','usb');s.auth(s.sockets[0]);s.link.connect('bt','bt-AABBCCDDEEFF',39872,'','bluetooth');const bt=s.bluetooth[0];bt.callbacks.open();bt.callbacks.data(JSON.stringify({kind:'connected',bridgeId:'different-mac',resumeToken:'b'.repeat(64)}));assert.ok(s.events.some(e=>e.status==='error'&&e.message.includes('身份不匹配')));assert.equal(bt.closed,true);assert.equal(s.events.some(e=>e.status==='transport'&&e.message==='bluetooth'),false);
 const next=s.create();next.resume('usb','usb');const socket=s.sockets.at(-1);socket.callbacks.open();assert.equal(JSON.parse(socket.writes[0]).pin,'a'.repeat(64));
});
