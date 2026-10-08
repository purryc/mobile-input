import {setChatContext} from '../../../packages/core/interactions';
import {migrateChat,migrateSpeakerNotes} from '../../../packages/core/migrate';
import {useSyncExternalStore} from 'react';
import {Store,initialState,describe,type State,type Command,type Ack} from '../../../packages/core/model';
export interface Native {layoutInsets?():string;presentationMotion?(id:string,operation:string):string;gameLayout?(enabled:boolean):string;clipboard(id:string,operation:string,text:string):string;role():string;host(pin:string):string;connect(address:string,pin:string):string;discover():string;send(data:string):string;scan():string;startRecognition(id:string,online:boolean):string;stopRecognition(id:string):string;cancelRecognition(id:string):string;}
declare global {interface Window {MobileNative?:Native;}}
export const role=window.MobileNative?.role()==='phone'||location.hash.includes('phone')||new URLSearchParams(location.search).get('role')==='phone'?'phone':'tablet';
const pinArray=new Uint32Array(1);crypto.getRandomValues(pinArray);
export const uid=()=>Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join('');
export const pin=String(100000+pinArray[0]%900000);
const store=new Store(load());
function load():State {try {const saved=JSON.parse(localStorage.getItem('mobile-input-state-v1')||'null');if(saved?.products&&saved?.slides){const base=initialState();if(!saved.officeFiles){base.officeFiles[0].products=structuredClone(saved.products);base.officeFiles[1].paragraphs=structuredClone(saved.paragraphs||base.paragraphs);base.officeFiles[2].slides=structuredClone(saved.slides);if(saved.texts?.['wechat-draft'])base.chat.drafts['wx-boss'].text=saved.texts['wechat-draft'];}let next={...base,...saved,presentation:{...base.presentation,...saved.presentation,runningSince:0,captions:base.presentation.captions,live:null,pointer:base.presentation.pointer},gameKeys:[],presenting:false,target:null,switcher:null};try{const backup=(key:string,value:string)=>{if(!localStorage.getItem(key))localStorage.setItem(key,value);};next=migrateChat(next,backup);next=migrateSpeakerNotes(next,backup);localStorage.setItem('mobile-input-state-v1',JSON.stringify(next));}catch{console.error('场景备份失败，已保留旧聊天');}if(next.app==='slides'){next.slide=0;next.presentation.lastSlide=0;next.presentation.elapsed=0;next.presentation.session=uid();next.startedAt=Math.max(Date.now(),next.startedAt+1);}if(next.app==='wechat'){next.chat.activation=null;next.chat.conversation='wx-boss';setChatContext(next,'wx-boss',uid());}return next;};}catch{}return initialState();}
let snap={state:store.state,connected:false,status:role==='tablet'?'等待手机连接':'未连接',address:'',toast:'',pin};
const listeners=new Set<()=>void>();
function notify(){snap={...snap};for(const f of listeners)f();}
export function useRuntime(){return useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f);},()=>snap);}
export function toast(t:string){snap.toast=t;notify();setTimeout(()=>{if(snap.toast===t){snap.toast='';notify();}},4000);}
const requestedPort=Number(new URLSearchParams(location.search).get('bridge'));
const bridgePort=Number.isInteger(requestedPort)&&requestedPort>0&&requestedPort<65536?requestedPort:5189;
let ws:WebSocket|undefined;let credentials:{address:string;pin:string}|undefined;let reconnect:ReturnType<typeof setTimeout>|undefined;let saveTimer:ReturnType<typeof setTimeout>;
const pending=new Map<string,{resolve:(a:Ack)=>void;timer:ReturnType<typeof setTimeout>;failureKey?:string}>();
const reportedGestures=new Set<string>();
function commandError(message:string,key?:string){if(key){if(reportedGestures.has(key))return;reportedGestures.add(key);if(reportedGestures.size>64)reportedGestures.delete(reportedGestures.values().next().value!);}toast(message);}
function transmit(data:unknown){const text=JSON.stringify(data);if(window.MobileNative)return window.MobileNative.send(text)==='sent';if(ws?.readyState===1){ws.send(text);return true;}return false;}
function publish(){snap.state=store.state;notify();transmit({kind:'snapshot',state:store.state,context:describe(store.state)});clearTimeout(saveTimer);saveTimer=setTimeout(()=>localStorage.setItem('mobile-input-state-v1',JSON.stringify({...store.state,gameKeys:[]})),300);}
function receive(m:{kind:string;state?:State;command?:Command;ack?:Ack;message?:string}){
 if(m.kind==='connected'){connected();return;}
 if(m.kind==='disconnected'){disconnected();return;}
 if(m.kind==='error'){snap.status=m.message||'连接失败';notify();return;}
 if(m.kind==='sync'&&role==='tablet'){transmit({kind:'snapshot',state:store.state,context:describe(store.state)});return;}
 if(m.kind==='command'&&role==='tablet'&&m.command){if(['chat-read-stage','present-volume-result'].includes(m.command.type))return;const ack=store.dispatch(m.command);publish();transmit({kind:'ack',ack});}
 if(m.kind==='snapshot'&&role==='phone'&&m.state){snap.state=m.state;notify();}
 if(m.kind==='ack'&&m.ack){const p=pending.get(m.ack.id);if(p){clearTimeout(p.timer);pending.delete(m.ack.id);p.resolve(m.ack);if(!m.ack.ok)commandError(m.ack.error||'操作失败',p.failureKey);}}
}
function connected(){snap.connected=true;snap.status='已连接';notify();if(role==='tablet')publish();else transmit({kind:'sync'});}
function disconnected(){snap.connected=false;snap.status='连接已断开，正在重新连接';if(role==='tablet'){store.dispatch({id:uid(),type:'release'});snap.state=store.state;}notify();for(const [id,p] of pending){clearTimeout(p.timer);p.resolve({id,ok:false,error:'连接中断，请核对平板结果',revision:snap.state.revision});}pending.clear();if(role==='phone'&&credentials){clearTimeout(reconnect);reconnect=setTimeout(()=>connect(credentials!.address,credentials!.pin),2500);}else if(role==='tablet'&&!window.MobileNative&&ws?.readyState!==1){clearTimeout(reconnect);reconnect=setTimeout(()=>startWeb(pin),2500);}}
export async function command(type:string,value?:unknown,anchor?:{targetId?:string;targetRevision?:number;app?:State['app']}):Promise<Ack>{const c:Command={id:uid(),type,value,app:snap.state.app,sessionId:snap.state.startedAt,...anchor};if(role==='tablet'){const ack=store.dispatch(c);if(!ack.ok)toast(ack.error||'操作失败');publish();return ack;}
 if(!snap.connected){toast('尚未连接，输入已保留');return {id:c.id,ok:false,error:'未连接',revision:snap.state.revision};}
 const failureKey=type.startsWith('present-')&&value&&typeof value==='object'&&'gesture' in value?String(value.gesture):undefined;
 return new Promise(resolve=>{const timer=setTimeout(()=>{pending.delete(c.id);resolve({id:c.id,ok:false,error:'未收到回执，请核对平板',revision:snap.state.revision});commandError('未收到回执，请核对平板',failureKey);transmit({kind:'sync'});},4000);pending.set(c.id,{resolve,timer,failureKey});transmit({kind:'command',command:c});});}
export function choose(id:string,label:string,kind:'text'|'number'|'drawing'|'slide'|'media'|'game'|'message',value=''){return command('select',{id,label,kind,value});}
export function input(value:string){const t=snap.state.target;return command('input',value,{targetId:t?.id,targetRevision:t?.revision});}
export function connect(address:string,code:string){credentials={address,pin:code};snap.status='正在连接';notify();if(window.MobileNative){window.MobileNative.connect(address,code);return;}startWeb(code,address);}
export function retryConnection(){if(credentials)connect(credentials.address,credentials.pin);else{window.MobileNative?.discover();toast('请重新配对平板');}}
function startWeb(code:string,address=location.hostname){ws?.close();const next=new WebSocket(`ws://${address||location.hostname}:${bridgePort}`);ws=next;next.onopen=()=>next.send(JSON.stringify({kind:'register',role,pin:code}));next.onmessage=e=>{try{receive(JSON.parse(e.data));}catch{}};next.onclose=()=>{if(ws===next)disconnected();};next.onerror=()=>{snap.status='无法连接，请检查平板与网络';notify();};}
let started=false;
function start(){if(started)return;started=true;if(window.MobileNative){if(role==='tablet')window.MobileNative.host(pin);else window.MobileNative.discover();}else if(role==='tablet')startWeb(pin);}
window.addEventListener('native-ready',start);
window.addEventListener('native-message',e=>receive((e as CustomEvent).detail));
window.addEventListener('native-status',e=>{const d=(e as CustomEvent).detail;if(d.type==='connected')connected();else if(d.type==='disconnected')disconnected();else{if(d.address)snap.address=d.address;snap.status=d.type==='hosting'?'等待手机连接':d.type==='found'?'已发现平板':d.message||snap.status;notify();}});
window.addEventListener('native-scan',e=>{try{const d=JSON.parse((e as CustomEvent).detail);if(d.kind==='mobile-input'&&typeof d.address==='string'&&/^\d{6}$/.test(d.pin))connect(d.address,d.pin);else toast('这不是 Input Agent 配对码');}catch{toast('无法读取配对信息');}});
window.addEventListener('native-foreground',e=>{if(role==='tablet')command('presentation-active',Boolean((e as CustomEvent).detail));if(!(e as CustomEvent).detail)command('release');else if(credentials)connect(credentials.address,credentials.pin);});
document.addEventListener('visibilitychange',()=>{if(role==='tablet')command('presentation-active',!document.hidden);if(document.hidden)command('release');});
setInterval(()=>{if(role==='tablet'&&((store.state.gameKeys.length&&Date.now()-store.state.gameHeartbeat>700)||(store.state.presentation.pointer.active&&Date.now()-store.state.presentation.pointer.heartbeat>700))){store.dispatch({id:uid(),type:'release'});publish();}},200);
setTimeout(start,100);

setInterval(()=>{if(role==='tablet'&&snap.state.switcher&&Date.now()>=snap.state.switcher.deadline)command('switch-commit',{epoch:snap.state.switcher.epoch});},50);
export function navigateBack(){if(snap.state.switcher){command('switch-cancel');return;}const e=new CustomEvent('app-back',{cancelable:true});if(window.dispatchEvent(e))command('back');}
window.addEventListener('native-back',navigateBack);

export function currentState(){return snap.state;}
