import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';
function setup(){
 const listeners=new Map<string,Function>(),sent:any[]=[];let channel='',updates=0,id=0;
 const module:any={exports:{}};
 const window={addEventListener:(key:string,callback:Function)=>listeners.set(key,callback),MobileNative:{macClose:()=>{},macConnect:(key:string)=>{channel=key;return 'connecting';},macSend:(_:string,value:string)=>{sent.push(JSON.parse(value));return 'sent';}}};
 const code=transformSync(readFileSync(new URL('../../apps/web/src/mac-link.ts',import.meta.url),'utf8'),{loader:'ts',format:'cjs'}).code;
 runInNewContext(code,{module,exports:module.exports,window,document:{hidden:false,addEventListener:()=>{}},localStorage:{getItem:()=>null,setItem:()=>{}},crypto:{randomUUID:()=>String(++id)},setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{},require:(name:string)=>name==='react'?{useSyncExternalStore:(subscribe:Function,read:Function)=>{subscribe(()=>updates++);return read();}}:{controlDestination:()=> 'mac'}});
 const api=module.exports;api.useMacLink();
 const receive=(value:any)=>listeners.get('native-mac')!({detail:{channel,payload:JSON.stringify(value)}});
 api.connectMac('127.0.0.1','123456');
 return {api,receive,sent,updates:()=>updates};
}
test('pointer window is explicitly negotiated and resets for legacy reconnection',()=>{
 const s=setup();s.receive({kind:'connected',session:'s',pointerWindow:4});assert.equal(s.api.macSnapshot().pointerWindow,4);
 s.receive({kind:'connected',session:'s'});assert.equal(s.api.macSnapshot().pointerWindow,1);
 s.receive({kind:'connected',session:'s',pointerWindow:999});assert.equal(s.api.macSnapshot().pointerWindow,4);
});
test('motion receipts resolve execution without rebuilding the entire controller, authoritative changes still notify',async()=>{
 const s=setup();s.receive({kind:'connected',session:'s',pointerWindow:4});
 const state={app:'codex',window:'w',target:'t',text:''};s.receive({kind:'state',session:'s',state});
 const count=s.updates(),pending=s.api.macCommand('pointer',{action:'move'});const id=s.sent.at(-1).id;
 s.receive({kind:'ack',session:'s',id,ok:true});assert.equal((await pending).ok,true);assert.equal(s.updates(),count);
 const edit=s.api.macCommand('replace-text',{text:'fictional'});s.receive({kind:'ack',session:'s',id:s.sent.at(-1).id,ok:true,state:{...state,text:'fictional'}});await edit;
 assert.equal(s.updates(),count+1);assert.equal(s.api.macSnapshot().state.text,'fictional');
});
