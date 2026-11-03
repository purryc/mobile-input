import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';
function setup(){
 let saved:any=null;const FakeTrust=class{read(){return saved;}save(value:any){saved={...value};}};
 const sockets:any[]=[],events:any[]=[];let now=10000,timerId=0;const timers=new Map<number,{at:number,run:Function}>();
 const webSocket={createWebSocket(){const callbacks:Record<string,Function>={},writes:string[]=[];const socket={connection:null as any,callbacks,writes,closed:false,on:(name:string,fn:Function)=>{callbacks[name]=fn;},connect:async(url:string,options:unknown)=>{socket.connection={url,options};},send:async(data:string)=>{writes.push(data);},close:async()=>{socket.closed=true;}};sockets.push(socket);return socket;}};
 const module:{exports:any}={exports:{}};const code=transformSync(readFileSync(new URL('../../apps/harmony/shared/MacLink.ets',import.meta.url),'utf8'),{loader:'ts',format:'cjs'}).code;
 runInNewContext(code,{module,exports:module.exports,require:(name:string)=>name==='@kit.NetworkKit'?{webSocket}:name==='./MacTrust'?{MacTrust:FakeTrust}:{util:{generateRandomUUID:()=> 'phone-process',TextDecoder:class{decodeWithStream(value:Uint8Array){return new TextDecoder().decode(value);}}}},Uint8Array,JSON,Date:{now:()=>now},setTimeout:(run:Function,ms:number)=>{timers.set(++timerId,{run,at:now+ms});return timerId;},clearTimeout:(id:number)=>timers.delete(id)});
 const message=(socket:any,data:unknown)=>socket.callbacks.message(null,JSON.stringify(data));
 const create=()=>new module.exports.MacLink((name:string,data:string)=>events.push({name,...JSON.parse(data)}));
 const auth=(socket:any)=>{socket.callbacks.open();message(socket,{kind:'connected',session:'stable-session',bridgeId:'same-mac',resumeToken:'a'.repeat(64)});};
 return {link:create(),create,sockets,events,message,auth,advance:(ms:number)=>{now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.run();}}};
}
test('Mac native connection ignores old socket events after reconnect',()=>{
 const {link,sockets,events,auth}=setup();link.connect('first','127.0.0.1',39872,'123456');const old=sockets[0];link.connect('second','127.0.0.1',39872,'654321');const next=sockets[1];auth(next);const n=events.length;
 old.callbacks.open();old.callbacks.message(null,'old');old.callbacks.error();old.callbacks.close();assert.equal(old.closed,true);assert.equal(old.writes.length,0);assert.equal(events.length,n);
 assert.equal(next.connection.options.header['X-Input-Agent-Client'],'harmony-phone');assert.equal(link.send('first','{}'),'unavailable');assert.equal(link.send('second','{"kind":"ping"}'),'sent');
});
test('USB is tried before saved Wi-Fi, authenticates, and does not need Wi-Fi to be available',()=>{
 const {link,sockets,auth,events}=setup();assert.equal(link.connect('x','host',39872,'bad'),'unavailable');assert.equal(sockets.length,0);link.connect('x','172.20.10.2',39872,'123456');assert.match(sockets[0].connection.url,/127.0.0.1/);auth(sockets[0]);assert.equal(sockets.length,1);assert.ok(events.some(e=>e.status==='transport'&&e.message==='usb'));assert.equal(link.send('x','{"kind":"ping"}'),'sent');link.close();assert.equal(link.send('x','{}'),'unavailable');
});
test('missing USB falls back to Wi-Fi; promotion requires same bridge and idle commands',()=>{
 const {link,sockets,auth,message,advance,events}=setup();link.connect('x','172.20.10.2',39872,'123456');sockets[0].callbacks.error();const wifi=sockets[1];assert.match(wifi.connection.url,/172.20.10.2/);auth(wifi);
 link.send('x','{"kind":"command","id":"one"}');advance(1000);link.send('x','{"kind":"ping"}');assert.equal(sockets.length,2);
 message(wifi,{kind:'ack',id:'one'});link.send('x','{"kind":"ping"}');const probe=sockets[2];probe.callbacks.open();message(probe,{kind:'route',bridgeId:'another-mac'});assert.equal(probe.closed,true);assert.equal(wifi.closed,false);
 advance(6000);link.send('x','{"kind":"ping"}');const usb=sockets[3];usb.callbacks.open();message(usb,{kind:'route',bridgeId:'same-mac'});assert.equal(JSON.parse(usb.writes.at(-1)).pin,'a'.repeat(64));assert.equal(link.send('x','{"kind":"command","id":"blocked"}'),'unavailable');
 // Server may close old socket before new connected packet arrives.
 wifi.callbacks.close();assert.equal(sockets.length,4);message(usb,{kind:'connected',bridgeId:'same-mac',session:'stable-session',resumeToken:'a'.repeat(64)});assert.equal(wifi.closed,true);assert.ok(events.some(e=>e.status==='transport'&&e.message==='usb'));
 usb.callbacks.close();const fallback=sockets[4];assert.match(fallback.connection.url,/172.20.10.2/);fallback.callbacks.open();assert.equal(JSON.parse(fallback.writes[0]).pin,'a'.repeat(64));auth(fallback);assert.equal(fallback.writes.some((x:string)=>x.includes('"command"')),false);
});
test('failed handover restores Wi-Fi without replaying uncertain commands',()=>{
 const {link,sockets,auth,message,advance}=setup();link.connect('x','172.20.10.2',39872,'123456');sockets[0].callbacks.error();auth(sockets[1]);link.send('x','{"kind":"ping"}');const probe=sockets[2];probe.callbacks.open();message(probe,{kind:'route',bridgeId:'same-mac'});advance(1200);assert.equal(probe.closed,true);assert.match(sockets[3].connection.url,/172.20.10.2/);auth(sockets[3]);assert.equal(link.send('x','{"kind":"ping"}'),'sent');
});
test('USB silence falls back without replay; held mouse button prevents route promotion',()=>{
 const first=setup();first.link.connect('x','172.20.10.2',39872,'123456');first.auth(first.sockets[0]);first.advance(7000);first.link.send('x','{"kind":"ping"}');assert.match(first.sockets[1].connection.url,/172.20.10.2/);assert.ok(first.events.some(e=>e.status==='reconnecting'));
 const second=setup();second.link.connect('x','172.20.10.2',39872,'123456');second.sockets[0].callbacks.error();second.auth(second.sockets[1]);second.link.send('x','{"kind":"command","id":"down","op":"pointer","action":"down"}');second.message(second.sockets[1],{kind:'ack',id:'down'});second.advance(6000);second.link.send('x','{"kind":"ping"}');assert.equal(second.sockets.length,2);
});

test('native trust restores after phone process restart without returning token to Web',()=>{const s=setup();s.link.connect('first','172.20.10.2',39872,'123456');s.auth(s.sockets[0]);assert.ok(s.events.every(e=>!String(e.payload).includes('a'.repeat(64))));s.link.close();const next=s.create();assert.equal(next.resume('restored'),'connecting');const socket=s.sockets.at(-1);socket.callbacks.open();assert.equal(JSON.parse(socket.writes[0]).pin,'a'.repeat(64));assert.equal(JSON.parse(socket.writes[0]).clientId,'phone-process');assert.match(socket.connection.url,/127.0.0.1/);assert.equal(socket.writes.some((v:string)=>v.includes('command')),false);});

test('USB appearance is probed on the next 1.5-second heartbeat without waiting five seconds',()=>{
 const s=setup();s.link.connect('x','172.20.10.2',39872,'123456');s.sockets[0].callbacks.error();s.auth(s.sockets[1]);s.link.send('x','{"kind":"ping"}');const missing=s.sockets[2];missing.callbacks.error();
 s.advance(1499);s.link.send('x','{"kind":"ping"}');assert.equal(s.sockets.length,3);
 s.advance(1);s.link.send('x','{"kind":"ping"}');const present=s.sockets[3];present.callbacks.open();s.message(present,{kind:'route',bridgeId:'same-mac'});s.message(present,{kind:'connected',bridgeId:'same-mac',session:'stable-session',resumeToken:'a'.repeat(64)});
 assert.ok(s.events.some(e=>e.status==='transport'&&e.message==='usb'));assert.equal(s.sockets[1].closed,true);
});

test('lost receipts close the uncertain route within five seconds without replay and allow USB recovery',()=>{
 const s=setup();s.link.connect('x','172.20.10.2',39872,'123456');s.sockets[0].callbacks.error();const wifi=s.sockets[1];s.auth(wifi);
 s.link.send('x',JSON.stringify({kind:'command',id:'uncertain',op:'replace-text',text:'never-replay'}));s.advance(4999);assert.equal(wifi.closed,false);s.advance(1);assert.equal(wifi.closed,true);assert.ok(s.events.some(e=>e.status==='error'&&e.message.includes('不会重复执行')));
 assert.equal(s.link.send('x','{"kind":"ping"}'),'unavailable');assert.equal(s.link.resume('new'),'connecting');const usb=s.sockets.at(-1);s.auth(usb);assert.match(usb.connection.url,/127.0.0.1/);assert.equal(usb.writes.some((m:string)=>m.includes('never-replay')),false);
});
test('receipts and close cancel their watchdog, while late replies cannot affect a new route',()=>{
 const s=setup();s.link.connect('x','172.20.10.2',39872,'123456');const old=s.sockets[0];s.auth(old);s.link.send('x','{"kind":"command","id":"done"}');s.message(old,{kind:'ack',id:'done'});s.advance(5000);assert.equal(old.closed,false);
 s.link.send('x','{"kind":"command","id":"abandoned"}');s.link.close();s.link.resume('new');s.auth(s.sockets.at(-1));const n=s.events.length;s.advance(5000);s.message(old,{kind:'ack',id:'abandoned'});assert.equal(s.events.length,n);assert.equal(s.sockets.at(-1).closed,false);
});
