import {useSyncExternalStore} from 'react';
import {controlDestination} from './control-destination';
export interface MacState {locked?:boolean;taskTitle?:string;taskId?:string;tasks?:{id:string;title:string}[];attachments?:string[];device:string;permission:boolean;app:string;appName:string;subapp?:string;windowTitle:string;window:string;target:string;text:string;editable:boolean;textKnown:boolean;selection:[number,number];capabilities:string[];pointer?:{x:number;y:number};}
export type Receipt={ok:boolean;error?:string;outcome?:string;state?:MacState;version?:number;modelRevision?:string;elapsedMs?:number;fileId?:string;file?:import('../../../packages/core/live-workbuddy').LiveMaterial};
let snap:{synced:boolean;connected:boolean;status:string;session:string;state:MacState|null;address:string;canResume:boolean;transport?:'usb'|'wireless'}={synced:false,canResume:false,connected:false,status:'连接 Mac 后选择应用',session:'',state:null,address:localStorage.getItem('input-agent-mac-address')||''};
const listeners=new Set<()=>void>();const notify=()=>{snap={...snap};listeners.forEach(f=>f());};
export const macSnapshot=()=>snap;
export function useMacLink(){return useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f);},macSnapshot);}
let attempting=false;
let ws:WebSocket|null=null,epoch=0,sequence=0,channel='',resumeToken='',resumePort=39872,heartbeat:ReturnType<typeof setInterval>|undefined,connectTimer:ReturnType<typeof setTimeout>|undefined;
let automatic=localStorage.getItem('input-agent-mac-auto-connect')==='true',foreground=!document.hidden,retryTimer:ReturnType<typeof setTimeout>|undefined;const clientId=crypto.randomUUID();
function rememberAutomatic(value:boolean){automatic=value;localStorage.setItem('input-agent-mac-auto-connect',String(value));}
function scheduleRetry(){clearTimeout(retryTimer);if(automatic&&foreground&&controlDestination()==='mac'&&(resumeToken||window.MobileNative?.macResume))retryTimer=setTimeout(()=>resumeMac(),3000);}
const pending=new Map<string,{resolve:(r:Receipt)=>void;timer:ReturnType<typeof setTimeout>}>();
function raw(data:unknown){const text=JSON.stringify(data);if(window.MobileNative?.macSend)return window.MobileNative.macSend(channel,text)==='sent';if(ws?.readyState===1){ws.send(text);return true;}return false;}
function receive(data:unknown,generation:number){if(generation!==epoch||controlDestination()!=='mac')return;const m=data as {kind:string;session:string;state:MacState;message:string;id:string;resumeToken?:string}&Receipt;
 if(m.kind==='connected'){attempting=false;clearTimeout(connectTimer);snap.connected=true;snap.session=m.session;if(m.resumeToken)resumeToken=m.resumeToken;snap.canResume=!!resumeToken||!!window.MobileNative?.macResume;rememberAutomatic(true);clearTimeout(retryTimer);snap.status=snap.transport==='usb'?'Mac 已连接 · USB':snap.transport==='wireless'?'Mac 已连接 · 无线':'Mac 已连接';notify();}
 if(m.kind==='state'&&m.session===snap.session){snap.state=m.state;snap.synced=true;notify();}
 if(m.kind==='ack'&&m.session===snap.session){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);if(m.state)snap.state=m.state;p.resolve(m);notify();}}
 if(m.kind==='error'){snap.status=m.message;stopLink(false);if(/配对码|过期/.test(m.message)){rememberAutomatic(false);snap.canResume=false;notify();}else scheduleRetry();}
}
export function disconnectMac(clear=true){rememberAutomatic(false);stopLink(clear);}
function stopLink(clear=true){attempting=false;clearTimeout(retryTimer);if(snap.connected)raw({kind:'command',id:crypto.randomUUID(),seq:++sequence,session:snap.session,op:'release'});epoch++;clearInterval(heartbeat);clearTimeout(connectTimer);window.MobileNative?.macClose?.();ws?.close();ws=null;for(const p of pending.values()){clearTimeout(p.timer);p.resolve({ok:false,error:'连接中断，输入已保留；请核对 Mac 结果',outcome:'unknown'});}pending.clear();snap.connected=false;snap.synced=false;snap.session='';if(clear)snap.status='Mac 已断开，输入已保留';notify();}
export function connectMac(address:string,pin:string,port=39872,restore=false){stopLink();if(controlDestination()!=='mac')return;if(!/^[a-zA-Z0-9.-]+$/.test(address)||!(restore&&window.MobileNative?.macResume)&&!(/^(\d{6}|[a-f0-9]{64})$/.test(pin))||!Number.isInteger(port)||port<1024||port>65535){snap.status='请检查 Mac 地址和六位配对码';notify();return;}snap.address=address;resumePort=port;localStorage.setItem('input-agent-mac-address',address);snap.status='正在连接 Mac';attempting=true;snap.state=null;if(pin.length===6)sequence=0;const generation=epoch;channel=crypto.randomUUID();notify();const pair=()=>raw({kind:'pair',target:'mac',pin,clientId});
 if(window.MobileNative){if(!window.MobileNative.macConnect){snap.status='手机需安装支持 Mac 连接的新版';notify();return;}const result=restore?window.MobileNative.macResume?.(channel):window.MobileNative.macConnect(channel,address,port,pin);if(result==='unavailable'){attempting=false;snap.status='请解锁手机，或扫描 Mac 二维码连接';snap.canResume=false;notify();scheduleRetry();return;}}else{ws=new WebSocket(`ws://${address}:${port}/control`);ws.onopen=pair;ws.onmessage=e=>{try{receive(JSON.parse(e.data),generation)}catch{}};ws.onclose=()=>{if(epoch===generation){stopLink();scheduleRetry();}};ws.onerror=()=>{if(epoch===generation){snap.status='无法连接 Mac，请检查桥接服务与网络';stopLink(false);scheduleRetry();}};}
 connectTimer=setTimeout(()=>{if(epoch===generation&&!snap.connected){snap.status='Mac 连接超时，请检查地址与网络';stopLink(false);scheduleRetry();}},9000);
 heartbeat=setInterval(()=>{if(snap.connected)raw({kind:'ping'});},1500);
}
export function macCommand(op:string,args:Record<string,unknown>={},binding=macSnapshot().state):Promise<Receipt>{if(!snap.connected||!snap.synced||controlDestination()!=='mac')return Promise.resolve({ok:false,error:'Mac 尚未连接'});const id=crypto.randomUUID(),m={...args,kind:'command',id,seq:++sequence,session:snap.session,op,window:binding?.window,target:binding?.target};return new Promise(resolve=>{const timer=setTimeout(()=>{pending.delete(id);resolve({ok:false,outcome:'unknown',error:'未确认执行结果，请查看 Mac；不会自动重试'});},5000);pending.set(id,{resolve,timer});if(!raw(m)){clearTimeout(timer);pending.delete(id);resolve({ok:false,error:'连接不可用'});}});}
window.addEventListener('native-mac',e=>{const d=(e as CustomEvent).detail;if(d.channel!==channel)return;if(d.status==='address'){snap.address=d.message;localStorage.setItem('input-agent-mac-address',d.message);notify();return;}if(d.status==='transport'){snap.transport=d.message;notify();return;}if(d.status==='reconnecting'){snap.connected=false;snap.synced=false;snap.status=d.message;for(const p of pending.values()){clearTimeout(p.timer);p.resolve({ok:false,outcome:'unknown',error:'连接切换，输入已保留；不会自动重试'});}pending.clear();notify();return;}if(d.status==='closed'){stopLink();scheduleRetry();return;}if(d.status==='error'){snap.status=d.message||'Mac 连接失败';stopLink(false);scheduleRetry();return;}if(d.payload){try{receive(JSON.parse(d.payload),epoch)}catch{}};});
window.addEventListener('control-destination-leave',()=>stopLink());
window.addEventListener('control-destination-change',()=>{if(controlDestination()==='mac'&&automatic)resumeMac();});
function pauseMac(){foreground=false;stopLink();}
function foregroundMac(){foreground=true;if(automatic&&controlDestination()==='mac'&&!snap.connected)resumeMac();}
window.addEventListener('native-foreground',e=>{(e as CustomEvent).detail?foregroundMac():pauseMac();});
document.addEventListener('visibilitychange',()=>{document.hidden?pauseMac():foregroundMac();});
window.addEventListener('native-scan',e=>{if(controlDestination()!=='mac')return;try{const d=JSON.parse((e as CustomEvent).detail);if(d.kind==='input-agent-mac')connectMac(d.address,d.pin,d.port);}catch{}});

export function resumeMac(){if(!foreground||controlDestination()!=='mac'||snap.connected||attempting)return;rememberAutomatic(true);if(window.MobileNative?.macResume)connectMac(snap.address||'127.0.0.1','',resumePort,true);else if(resumeToken&&snap.address)connectMac(snap.address,resumeToken,resumePort);}
// Wait for the native bridge to be available; credentials remain in native storage.
setTimeout(()=>{if(automatic&&foreground&&controlDestination()==='mac')resumeMac();},700);
