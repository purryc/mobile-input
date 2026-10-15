import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';

// Execute the native bridge; replace only device services and sockets.
function bridge(){
 const sockets:any[]=[],events:any[]=[];
 const fakeService=class {stop(){} cancelRecognition(){} status(){} cancel(){} close(){}};
 const kits:Record<string,unknown>={
  './Gemini':{Gemini:fakeService},'./PhotoCapture':{},'./WindowCapture':{},'./PresentationMotion':{PresentationMotion:fakeService},'./Speech':{Speech:fakeService},
  './DistributedLink':{distributedLink:{configure(){},attach(){},getMode(){return 'lan';}}},
  './Config':{ROLE:'phone'},'./LocalAssets':{LOCAL_ORIGIN:'https://mobile-input.invalid'},
  '@kit.NetworkKit':{socket:{constructTCPSocketInstance:()=>{
   const callbacks:Record<string,Function>={},writes:{data:ArrayBuffer;resolve:()=>void;reject:(e:Error)=>void}[]=[];
   const s={closed:false,callbacks,writes,on:(event:string,fn:Function)=>{callbacks[event]=fn;},connect:async()=>{},close:()=>{s.closed=true;return Promise.resolve();},send:({data}:{data:ArrayBuffer})=>new Promise<void>((resolve,reject)=>writes.push({data,resolve,reject}))};sockets.push(s);return s;
  }},mdns:{}},
  '@kit.ArkTS':{util:{TextEncoder:class{encodeInto(text:string){return new TextEncoder().encode(text);}},TextDecoder:class{decodeWithStream(bytes:Uint8Array){return new TextDecoder().decode(bytes);}}}},
 };
 const module:{exports:any}={exports:{}};const code=transformSync(readFileSync(new URL('../../apps/harmony/shared/NativeBridge.ets',import.meta.url),'utf8'),{loader:'ts',format:'cjs',target:'es2022'}).code;
 runInNewContext(code,{module,exports:module.exports,require:(name:string)=>kits[name]||{},AppStorage:{setOrCreate(){}},Uint8Array,DataView,Date,JSON,Error,setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{}});
 const controller={getUrl:()=> 'https://mobile-input.invalid/index.html',runJavaScript:async(script:string)=>{runInNewContext(script,{window:{dispatchEvent:(e:any)=>events.push(e)},CustomEvent:class{type:string;detail:unknown;constructor(type:string,o:any){this.type=type;this.detail=o.detail;}}});}};
 const native=new module.exports.NativeBridge({},controller);
 function welcome(s:any){const body=new TextEncoder().encode(JSON.stringify({kind:'welcome',pin:'',payload:''})),packet=new Uint8Array(body.length+4);new DataView(packet.buffer).setUint32(0,body.length);packet.set(body,4);s.callbacks.message({message:packet.buffer});}
 return {native,sockets,events,welcome};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('failure from a replaced native socket cannot disconnect the new session',async()=>{
 const {native,sockets,events,welcome}=bridge();native.connect('172.20.10.4','123456');await flush();const old=sockets[0];assert.equal(old.writes.length,1);
 native.connect('172.20.10.4','123456');await flush();const current=sockets[1];welcome(current);assert.equal(events.at(-1).detail.type,'connected');
 old.writes[0].reject(new Error('old connection ended'));await flush();assert.equal(current.closed,false);assert.equal(events.at(-1).detail.type,'connected');
});
test('native frames are sent sequentially and disconnected queues never leak into a new socket',async()=>{
 const {native,sockets,welcome}=bridge();native.connect('172.20.10.4','123456');await flush();const first=sockets[0];first.writes[0].resolve();await flush();welcome(first);
 native.send('first');native.send('second');await flush();assert.equal(first.writes.length,2,'second payload must wait for first send');
 first.writes[1].resolve();await flush();assert.equal(first.writes.length,3);
 native.send('cancelled');native.connect('172.20.10.4','123456');await flush();first.writes[2].resolve();await flush();assert.equal(first.writes.length,3);assert.equal(sockets[1].writes.length,1,'new connection sends only its own handshake');
});
