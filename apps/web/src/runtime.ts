import {snapshotDelta,applySnapshotDelta,type Delta} from '../../../packages/core/snapshot-delta';
import {restorePaint} from '../../../packages/core/paint';
import {restoreBilibili} from '../../../packages/core/bilibili';
import { browserState, saveBrowserFile, fileDirty } from '../../../packages/core/workbuddy-files';
import {restoreWorkBuddy} from '../../../packages/core/workbuddy';
import {setChatContext} from '../../../packages/core/interactions';
import {migrateChat,migrateSpeakerNotes} from '../../../packages/core/migrate';
import {useSyncExternalStore} from 'react';
import {Store,initialState,describe,type State,type Command,type Ack} from '../../../packages/core/model';
export type ConnectionMethod='lan'|'distributed';
export interface DistributedStatus {phase:string;message:string;devices:{id:string;name:string;type:string}[];peer:string;}
export interface Native {transportMode?():string;selectTransport?(mode:string):string;distributedDiscover?():string;distributedConnect?(id:string):string;distributedStatus?():string;aiControl?(operation:string):string;aiConfigure?(key:string,model:string):string;polish?(id:string,text:string,style:string):string;cancelPolish?(id:string):string;inputTheme?(dark:boolean):string;captureResult?(id:string):string;clearCapture?(id:string):string;capture?(id:string,kind:string):string;layoutInsets?():string;presentationMotion?(id:string,operation:string):string;gameLayout?(enabled:boolean):string;clipboard(id:string,operation:string,text:string):string;role():string;host(pin:string):string;connect(address:string,pin:string):string;discover():string;send(data:string):string;scan():string;startRecognition(id:string,online:boolean,manual?:boolean):string;stopRecognition(id:string):string;cancelRecognition(id:string):string;}
declare global {interface Window {MobileNative?:Native;}}
export const role=window.MobileNative?.role()==='phone'||location.hash.includes('phone')||new URLSearchParams(location.search).get('role')==='phone'?'phone':'tablet';
const pinArray=new Uint32Array(1);crypto.getRandomValues(pinArray);
export const uid=()=>Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join('');
export const pin=String(100000+pinArray[0]%900000);
const store=new Store(load());
function load():State {try {const saved=JSON.parse(localStorage.getItem('mobile-input-state-v1')||'null');if(saved?.products&&saved?.slides){const base=initialState();if(!saved.officeFiles){base.officeFiles[0].products=structuredClone(saved.products);base.officeFiles[1].paragraphs=structuredClone(saved.paragraphs||base.paragraphs);base.officeFiles[2].slides=structuredClone(saved.slides);if(saved.texts?.['wechat-draft'])base.chat.drafts['wx-boss'].text=saved.texts['wechat-draft'];}let next={...base,...saved,bilibili:restoreBilibili(saved.bilibili),capture:null,presentation:{...base.presentation,...saved.presentation,runningSince:0,captions:base.presentation.captions,live:null,pointer:base.presentation.pointer},gameKeys:[],presenting:false,target:null,switcher:null};try{const backup=(key:string,value:string)=>{if(!localStorage.getItem(key))localStorage.setItem(key,value);};if(!saved.paint)delete (next as Partial<State>).paint;restorePaint(next,backup);next.editSession=undefined;next.inputPointer=undefined;next=migrateChat(next,backup);next=migrateSpeakerNotes(next,backup);if(!saved.workbuddy)delete (next as Partial<State>).workbuddy;next=restoreWorkBuddy(next,backup);localStorage.setItem('mobile-input-state-v1',JSON.stringify(next));}catch{console.error('场景备份失败，已保留旧聊天');if(!next.workbuddy)next.workbuddy=base.workbuddy;}if(next.app==='slides'){next.slide=0;next.presentation.lastSlide=0;next.presentation.elapsed=0;next.presentation.session=uid();next.startedAt=Math.max(Date.now(),next.startedAt+1);}if(next.app==='wechat'){next.chat.activation=null;next.chat.conversation='wx-boss';setChatContext(next,'wx-boss',uid());}return next;};}catch{}return initialState();}
const savedMethod=window.MobileNative?.transportMode?.()||localStorage.getItem('input-agent-connection-method');
let method:ConnectionMethod|null=savedMethod==='lan'||savedMethod==='distributed'?savedMethod:null;
let distributed:DistributedStatus={phase:'idle',message:'',devices:[],peer:''};
let snap={method,distributed,state:store.state,connected:false,syncing:false,status:role==='tablet'?'等待手机连接':'未连接',address:'',toast:'',pin};
const listeners=new Set<()=>void>();
function notify(){snap={...snap};for(const f of listeners)f();}
export function useRuntime(){return useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f);},()=>snap);}
export function toast(t:string){snap.toast=t;notify();setTimeout(()=>{if(snap.toast===t){snap.toast='';notify();}},4000);}
const requestedPort=Number(new URLSearchParams(location.search).get('bridge'));
const bridgePort=Number.isInteger(requestedPort)&&requestedPort>0&&requestedPort<65536?requestedPort:5189;
let ws:WebSocket|undefined;let credentials:{address:string;pin:string}|undefined;let reconnect:ReturnType<typeof setTimeout>|undefined;let saveTimer:ReturnType<typeof setTimeout>;
const pending=new Map<string,{resolve:(a:Ack)=>void;timer:ReturnType<typeof setTimeout>;failureKey?:string;ack?:Ack}>();
const reportedGestures=new Set<string>();
function commandError(message:string,key?:string){if(key){if(reportedGestures.has(key))return;reportedGestures.add(key);if(reportedGestures.size>64)reportedGestures.delete(reportedGestures.values().next().value!);}toast(message);}
function transmit(data:unknown){const text=JSON.stringify(data);if(window.MobileNative?.send)return window.MobileNative.send(text)==='sent';if(ws?.readyState===1){ws.send(text);return true;}return false;}
let sentSnapshot:State|undefined;let receivedSnapshot=false;
let transportConnected=false,syncRequest='',syncSince=0,lastProbe=0,probeId='';
function requestStateSync(){
 if(role!=='phone'||method!=='distributed'){transmit({kind:'sync'});return;}
 if(!transportConnected||syncRequest)return;
 syncRequest=uid();syncSince=Date.now();snap.syncing=true;snap.connected=false;snap.status='正在同步大屏应用';notify();
 transmit({kind:'sync',syncId:syncRequest});
}
export function retryStateSync(){if(!transportConnected){retryConnection();return;}syncRequest='';requestStateSync();}
function stateStamp(s:State){return JSON.stringify([s.startedAt,s.revision,s.app,s.target?.id||'',s.target?.revision||0]);}
function sendSnapshot(force=false,syncId?:string){
 if(method!=='distributed'){transmit({kind:'snapshot',state:store.state,context:describe(store.state)});return;}
 if(!snap.connected)return;
 const next=JSON.parse(JSON.stringify(store.state)) as State;
 const packet=sentSnapshot&&!force?{kind:'snapshot-delta',base:sentSnapshot.revision,session:sentSnapshot.startedAt,delta:snapshotDelta(sentSnapshot,next)}:{kind:'snapshot',state:next,syncId};
 if(transmit(packet))sentSnapshot=next;
}
function publish(){snap.state=store.state;notify();sendSnapshot();clearTimeout(saveTimer);saveTimer=setTimeout(()=>localStorage.setItem('mobile-input-state-v1',JSON.stringify({...store.state,gameKeys:[]})),300);}
function saveCritical(type:string,ok:boolean){if(!ok||!type.startsWith('paint-')&&!type.startsWith('wb-')&&!type.startsWith('bili-')||['wb-edit','wb-focus'].includes(type))return;clearTimeout(saveTimer);try{localStorage.setItem('mobile-input-state-v1',JSON.stringify({...store.state,gameKeys:[]}));}catch{toast('本地保存失败，请导出数据');}}
function receive(m:{kind:string;state?:State;command?:Command;ack?:Ack;message?:string;base?:number;session?:number;delta?:Delta[];syncId?:string;probeId?:string;stamp?:string}){
 if(m.kind==='connected'){connected();return;}
 if(m.kind==='disconnected'){disconnected();return;}
 if(m.kind==='error'){snap.status=m.message||'连接失败';notify();return;}
 if(m.kind==='sync'&&role==='tablet'){sendSnapshot(true,m.syncId);return;}
 if(m.kind==='state-probe'&&role==='tablet'){transmit({kind:'state-stamp',probeId:m.probeId,session:store.state.startedAt,base:store.state.revision,stamp:stateStamp(store.state)});return;}
 if(m.kind==='state-stamp'&&role==='phone'&&method==='distributed'){
  if(!transportConnected||m.probeId!==probeId)return;
  probeId='';if(m.session===snap.state.startedAt&&typeof m.base==='number'&&m.base<snap.state.revision)return;if(m.stamp!==stateStamp(snap.state))requestStateSync();return;
 }
 if(m.kind==='command'&&role==='tablet'&&m.command){if(['capture-started',...(snap.state.capture?.kind==='camera'?[]:['capture-ready','capture-failed']),'chat-read-stage','present-volume-result','wb-tick','wb-fb-ai-finish','bili-time'].includes(m.command.type))return;const ack=store.dispatch(m.command);publish();if(!ack.ok&&m.command.type.startsWith('bili-'))toast(ack.error||'视频操作失败');saveCritical(m.command.type,ack.ok);transmit({kind:'ack',ack});}
 if(m.kind==='snapshot-delta'&&role==='phone'){
  if(syncRequest)return;
  if(!receivedSnapshot||snap.state.revision!==m.base||snap.state.startedAt!==m.session){requestStateSync();return;}
  try{receive({kind:'snapshot',state:applySnapshotDelta(snap.state,m.delta||[])});}catch{requestStateSync();}return;
 }
 if(m.kind==='snapshot'&&role==='phone'&&m.state){
  // A requested authority snapshot may replace a cached state after reconnect.
  // Old sync replies cannot roll back the current authority or clear its guard.
  if(method==='distributed'){
   if(!transportConnected||m.syncId&&m.syncId!==syncRequest)return;
   if(syncRequest&&m.syncId!==syncRequest)return;
  }
  if(!syncRequest&&m.state.startedAt===snap.state.startedAt&&m.state.revision<snap.state.revision)return;
  syncRequest='';syncSince=0;snap.syncing=false;
  receivedSnapshot=true;snap.state=m.state;snap.connected=true;snap.status='已连接';notify();for(const id of pending.keys())settleReceipt(id);
 }
 if(m.kind==='ack'&&m.ack){const p=pending.get(m.ack.id);if(p){p.ack=m.ack;settleReceipt(m.ack.id);}}

}
// Native delivery of an ack and a large snapshot can complete independently.
// Resolve successful writes only once their authoritative state is available.
function settleReceipt(id:string){const p=pending.get(id),ack=p?.ack;if(!p||!ack)return;
 if(ack.ok&&snap.state.revision<ack.revision)return;
 clearTimeout(p.timer);pending.delete(id);p.resolve(ack);if(!ack.ok)commandError(ack.error||'操作失败',p.failureKey);
}
function connected(){clearTimeout(reconnect);transportConnected=true;syncRequest='';probeId='';lastProbe=Date.now();snap.syncing=role==='phone'&&method==='distributed';receivedSnapshot=false;sentSnapshot=undefined;snap.connected=role==='tablet'||method!=='distributed';snap.status=method==='distributed'&&role==='phone'?'正在同步工作台':'已连接';notify();if(role==='tablet'){if(method!=='distributed')publish();}else requestStateSync();}
function disconnected(){transportConnected=false;syncRequest='';probeId='';syncSince=0;snap.syncing=false;sentSnapshot=undefined;receivedSnapshot=false;snap.connected=false;snap.status='连接已断开，正在重新连接';if(role==='tablet'){store.dispatch({id:uid(),type:'release'});snap.state=store.state;}notify();for(const [id,p] of pending){clearTimeout(p.timer);p.resolve({id,ok:false,error:'连接中断，请核对平板结果',revision:snap.state.revision});}pending.clear();if(method!=='distributed'&&role==='phone'&&credentials){clearTimeout(reconnect);reconnect=setTimeout(()=>connect(credentials!.address,credentials!.pin),2500);}else if(role==='tablet'&&!window.MobileNative&&ws?.readyState!==1){clearTimeout(reconnect);reconnect=setTimeout(()=>startWeb(pin),2500);}}
export async function command(type:string,value?:unknown,anchor?:{id?:string;targetId?:string;targetRevision?:number;app?:State['app']}):Promise<Ack>{const c:Command={id:uid(),type,value,app:snap.state.app,sessionId:snap.state.startedAt,...anchor};if(role==='tablet'){const ack=store.dispatch(c);if(!ack.ok)toast(ack.error||'操作失败');publish();saveCritical(type,ack.ok);return ack;}
 if(!snap.connected){toast('尚未连接，输入已保留');return {id:c.id,ok:false,error:'未连接',revision:snap.state.revision};}
 const failureKey=type.startsWith('present-')&&value&&typeof value==='object'&&'gesture' in value?String(value.gesture):undefined;
 return new Promise(resolve=>{const timer=setTimeout(()=>{pending.delete(c.id);resolve({id:c.id,ok:false,error:'未收到回执，请核对平板',revision:snap.state.revision});commandError('未收到回执，请核对平板',failureKey);requestStateSync();},4000);pending.set(c.id,{resolve,timer,failureKey});transmit({kind:'command',command:c});});}
export function choose(id:string,label:string,kind:'text'|'number'|'drawing'|'slide'|'media'|'game'|'message',value=''){return command('select',{id,label,kind,value});}
export function input(value:string){const t=snap.state.target;return command('input',value,{targetId:t?.id,targetRevision:t?.revision});}
export function connect(address:string,code:string){if(method!=='lan')selectConnectionMethod('lan');credentials={address,pin:code};snap.status='正在连接';notify();if(window.MobileNative){window.MobileNative.connect(address,code);return;}startWeb(code,address);}
export function retryConnection(){if(method==='distributed'){discoverDistributed();return;}if(credentials)connect(credentials.address,credentials.pin);else{window.MobileNative?.discover();toast('请重新配对平板');}}
function startWeb(code:string,address=location.hostname){ws?.close();const next=new WebSocket(`ws://${address||location.hostname}:${bridgePort}`);ws=next;next.onopen=()=>{if(ws===next&&method!=='distributed')next.send(JSON.stringify({kind:'register',role,pin:code}));};next.onmessage=e=>{if(ws!==next||method==='distributed')return;try{receive(JSON.parse(e.data));}catch{}};next.onclose=()=>{if(ws===next)disconnected();};next.onerror=()=>{if(ws!==next||method==='distributed')return;snap.status='无法连接，请检查平板与网络';notify();};}
let started=false;
function start(){if(started)return;started=true;if(window.MobileNative){if(method==='distributed'){try{snap.distributed=JSON.parse(window.MobileNative.distributedStatus?.()||'{}');}catch{}notify();}else if(role==='tablet')window.MobileNative.host(pin);else window.MobileNative.discover();}else if(role==='tablet')startWeb(pin);}
window.addEventListener('native-ready',start);
window.addEventListener('native-message',e=>receive((e as CustomEvent).detail));
window.addEventListener('native-status',e=>{const d=(e as CustomEvent).detail;if(d.transport&&d.transport!==method)return;if(method==='distributed'&&!d.transport)return;if(d.type==='connected')connected();else if(d.type==='disconnected'){disconnected();if(method==='distributed'){snap.status='协同连接已断开，请重新连接';notify();}}else{if(d.address)snap.address=d.address;snap.status=d.type==='hosting'?'等待手机连接':d.type==='found'?'已发现平板':d.message||snap.status;notify();}});
window.addEventListener('native-scan',e=>{try{const d=JSON.parse((e as CustomEvent).detail);if(method!=='lan')return;if(d.kind==='mobile-input'&&typeof d.address==='string'&&/^\d{6}$/.test(d.pin))connect(d.address,d.pin);else toast('这不是 Input Agent 配对码');}catch{toast('无法读取配对信息');}});
window.addEventListener('native-foreground',e=>{if(role==='tablet')command('presentation-active',Boolean((e as CustomEvent).detail));if(!(e as CustomEvent).detail)command('release');else if(method==='distributed'&&role==='phone')requestStateSync();else if(method!=='distributed'&&credentials)connect(credentials.address,credentials.pin);});
document.addEventListener('visibilitychange',()=>{if(role==='tablet')command('presentation-active',!document.hidden);if(document.hidden)command('release');else if(method==='distributed'&&role==='phone')requestStateSync();});
setInterval(()=>{if(role==='tablet'&&((store.state.gameKeys.length&&Date.now()-store.state.gameHeartbeat>700)||(store.state.presentation.pointer.active&&Date.now()-store.state.presentation.pointer.heartbeat>700))){store.dispatch({id:uid(),type:'release'});publish();}},200);
setTimeout(start,100);

setInterval(()=>{if(role==='tablet'&&snap.state.switcher&&Date.now()>=snap.state.switcher.deadline)command('switch-commit',{epoch:snap.state.switcher.epoch});},50);
export function navigateBack(){if(snap.state.switcher){command('switch-cancel');return;}const e=new CustomEvent('app-back',{cancelable:true});if(window.dispatchEvent(e))command('back');}
window.addEventListener('native-back',navigateBack);

export function currentState(){return snap.state;}

setInterval(()=>{if(role!=='tablet'||document.hidden||snap.state.app!=='workbuddy')return;for(const task of [...store.state.workbuddy.tasks])if(task.status==='running'&&Date.now()-task.startedAt>=750)command('wb-tick',{id:task.id,epoch:task.epoch});const now=new Date();for(const a of [...store.state.workbuddy.automations])if(a.enabled&&a.lastDay!==now.toLocaleDateString('en-CA')&&a.days.includes(now.getDay())&&a.time===now.toTimeString().slice(0,5))command('wb-automation',{id:a.id,action:'due'});},1000);

setInterval(()=>{if(role!=="tablet"||document.hidden||snap.state.app!=="workbuddy")return;const b=browserState(store.state);if(!b)return;for(const [file,co]of Object.entries(b.conversations))if(co.pending&&Date.now()-co.pending.at>=700)command("wb-fb-ai-finish",{file,epoch:co.pending.id});for(const view of [...b.windows,b.panel])for(const file of view.tabs){const format=store.state.workbuddy.files.find(f=>f.id===file)?.kind,a=view.working[file];if(a&&["markdown","text"].includes(format||"")&&Date.now()-a.changedAt>=500&&fileDirty(store.state,view,file)&&a.base===b.docs[file]?.revision)command("wb-fb-save",{view:view.id,file,source:"自动保存"});}},100);

export function selectConnectionMethod(next:ConnectionMethod){
 if(method===next)return;
 if(snap.connected)void command('release');
 clearTimeout(reconnect);method=next;snap.method=next;localStorage.setItem('input-agent-connection-method',next);
 // Resolve pending commands as uncertain; never replay them on a replacement transport.
 disconnected();clearTimeout(reconnect);snap.status=next==='distributed'?'选择设备建立协同连接':'等待网络配对';
 if(ws){const old=ws;ws=undefined;old.close();}
 window.MobileNative?.selectTransport?.(next);
 if(next==='lan'){if(window.MobileNative){if(role==='tablet')window.MobileNative.host(pin);else window.MobileNative.discover();}else if(role==='tablet')startWeb(pin);}
 snap.distributed={phase:'idle',message:'',devices:[],peer:''};notify();
}
export function discoverDistributed(){
 if(method!=='distributed')return;
 if(!window.MobileNative?.distributedDiscover){snap.distributed={phase:'unavailable',message:'请在手机或平板的 Input Agent 中连接鸿蒙设备',devices:[],peer:''};notify();return;}
 window.MobileNative.distributedDiscover();
}
export function connectDistributed(id:string){if(method==='distributed')window.MobileNative?.distributedConnect?.(id);}
window.addEventListener('native-distributed',e=>{if(method!=='distributed')return;const d=(e as CustomEvent).detail as DistributedStatus;snap.distributed=d;if(d.phase!=='connected')snap.status=d.message||snap.status;notify();});

// Lightweight authority checks repair a lost final app/focus update without replaying input.
setInterval(()=>{
 if(role!=='phone'||method!=='distributed'||!transportConnected||document.hidden)return;
 const now=Date.now();
 if(syncRequest){if(now-syncSince>12000&&snap.status!=='同步较慢，可重新连接'){snap.status='同步较慢，可重新连接';notify();}return;}
 if(probeId){if(now-lastProbe>5000)requestStateSync();return;}
 if(now-lastProbe<1500)return;
 lastProbe=now;probeId=uid();transmit({kind:'state-probe',probeId});
},500);
