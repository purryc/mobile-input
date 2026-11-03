import {useSyncExternalStore} from 'react';
import {currentState,command,role,sendDeckPacket,deckLinkReady} from './runtime';
import {validAsset,type DeckAsset} from '../../../packages/core/web-deck';
interface Stored {id:string;asset:DeckAsset;bytes:ArrayBuffer;hash:string;generation:number;}
interface Pending {owner?:string;id:string;task:string;replace:string;generation:number;session:number;error:string;}
interface Packet {kind:'deck-asset'|'deck-asset-reply';id:string;op?:string;session:number;generation:number;client:string;task?:string;asset?:DeckAsset;hash?:string;assetId?:string;offset?:number;data?:string;ok?:boolean;error?:string;complete?:boolean;}
const CHUNK=24*1024,MAX=8*1024*1024;
const generation=()=>currentState().demoGeneration||0;
const db=()=>new Promise<IDBDatabase>((resolve,reject)=>{const q=indexedDB.open('input-agent-deck-assets',1);q.onupgradeneeded=()=>{q.result.createObjectStore('assets',{keyPath:'id'});q.result.createObjectStore('pending',{keyPath:'id'});};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(Error('材料存储不可用，请检查设备空间'));});
async function read<T>(store:string,id?:string):Promise<T>{const d=await db();try{return await new Promise<T>((resolve,reject)=>{const tx=d.transaction(store,'readonly'),q=id===undefined?tx.objectStore(store).getAll():tx.objectStore(store).get(id);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}finally{d.close();}}
async function write(store:string,value:unknown,remove?:string){const d=await db();try{if(value&&typeof value==='object'&&'generation' in value&&value.generation!==generation())throw Error('演示已重置');await new Promise<void>((resolve,reject)=>{const tx=d.transaction(store,'readwrite');if(remove)tx.objectStore(store).delete(remove);else tx.objectStore(store).put(value);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(Error('材料存储失败，请检查设备空间'));});}finally{d.close();}}
const hash=async(bytes:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
const base64=(bytes:Uint8Array)=>{let out='';for(let i=0;i<bytes.length;i+=CHUNK)out+=String.fromCharCode(...bytes.subarray(i,i+CHUNK));return btoa(out);};
const decode=(text:string)=>Uint8Array.from(atob(text),x=>x.charCodeAt(0));
export async function storeDeckAsset(file:File,asset:DeckAsset){const ownedGeneration=generation(),bytes=await file.arrayBuffer();if(bytes.byteLength!==asset.size||!validAsset(asset))throw Error('材料格式无效');await write('assets',{id:asset.id,asset,bytes,hash:await hash(bytes),generation:ownedGeneration} satisfies Stored);}
export async function localDeckAsset(id:string){const found=await read<Stored|undefined>('assets',id);if(!found||found.generation!==generation())throw Error('材料不在本机，请连接原平板后重试');return found;}
export async function deviceDeckSources(assets:DeckAsset[]){const result=[];let total=0;for(const a of assets){const r=await localDeckAsset(a.id);if(r.asset.size!==a.size||r.asset.mime!==a.mime||await hash(r.bytes)!==r.hash)throw Error('材料校验失败，请重新选择');total+=r.bytes.byteLength;if(total>24*1024*1024)throw Error('总材料超过 24 MB');result.push({asset:a,base64:base64(new Uint8Array(r.bytes)),text:a.mime.startsWith('text/')?new TextDecoder().decode(r.bytes):undefined});}return result;}
const waiters=new Map<string,{resolve:(p:Packet)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
async function rpc(op:string,fields:Partial<Packet>):Promise<Packet>{if(!deckLinkReady())throw Error('连接中断，材料已保留');const s=currentState(),id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiters.delete(id);reject(Error('材料传输未确认，已保留待重试'));},15000);waiters.set(id,{resolve,reject,timer});if(!sendDeckPacket({kind:'deck-asset',id,op,session:s.startedAt,generation:generation(),client:s.inputSession?.client||'',...fields})){clearTimeout(timer);waiters.delete(id);reject(Error('连接中断，材料已保留'));}});}
const uploads=new Map<string,{asset:DeckAsset;hash:string;bytes:Uint8Array<ArrayBuffer>;offset:number;task:string;session:number;generation:number;client:string;at:number}>();
export async function receiveDeckPacket(raw:unknown){const p=raw as Packet;if(!p||!['deck-asset','deck-asset-reply'].includes(p.kind))return;
 if(p.kind==='deck-asset-reply'){const w=waiters.get(p.id);if(!w)return;const s=currentState();if(p.session!==s.startedAt||p.generation!==generation()||p.client!==s.inputSession?.client)return;clearTimeout(w.timer);waiters.delete(p.id);p.ok?w.resolve(p):w.reject(Error(p.error||'材料传输失败'));return;}
 if(role!=='tablet'||!deckLinkReady())return;const s=currentState();if(p.session!==s.startedAt||p.generation!==generation()||!p.client||p.client!==s.inputSession?.client||s.inputSession?.phase!=='active')return;
 const reply:Packet={kind:'deck-asset-reply',id:p.id,session:p.session,generation:p.generation,client:p.client,ok:false};
 try{
  for(const [id,u]of uploads)if(Date.now()-u.at>120000)uploads.delete(id);
  if(p.op==='get'){
   const referenced=s.workbuddy.files.some(f=>s.workbuddy.fileBrowser?.docs[f.id]?.saved.webDeck?.assets.some(a=>a.id===p.assetId))||Object.values(s.workbuddy.drafts).some(d=>d.deckInput?.assets.some(a=>a.id===p.assetId))||s.workbuddy.tasks.some(t=>t.deckJob?.request?.input.assets.some(a=>a.id===p.assetId));
   if(!referenced)throw Error('材料不属于当前演示');const r=await localDeckAsset(p.assetId!);if(!Number.isInteger(p.offset)||p.offset!<0||p.offset!>=r.bytes.byteLength)throw Error('读取范围无效');reply.asset=r.asset;reply.hash=r.hash;reply.data=base64(new Uint8Array(r.bytes).subarray(p.offset,p.offset!+CHUNK));
  }else{
   const task=s.workbuddy.tasks.find(t=>t.id===p.task);if((!task&&p.task!=='new')||!!task?.receipts||!!task?.referenceRequest||!s.workbuddy.drafts[p.task!]||task?.status==='running')throw Error('原任务不可采用材料');
   if(p.op==='begin'){
    if(!validAsset(p.asset)||!/^([a-f0-9]{64})$/.test(p.hash||''))throw Error('材料信息无效');const stored=await read<Stored|undefined>('assets',p.asset.id);if(stored?.generation===p.generation&&stored.hash===p.hash&&stored.asset.size===p.asset.size){reply.complete=true;}
    else{if(uploads.size>=2&&!uploads.has(p.asset.id))throw Error('正在传输其他材料，请稍后重试');uploads.set(p.asset.id,{asset:p.asset,hash:p.hash!,bytes:new Uint8Array(p.asset.size),offset:0,task:p.task!,session:p.session,generation:p.generation,client:p.client,at:Date.now()});}
   }else{const u=uploads.get(p.assetId||'');if(!u||u.task!==p.task||u.session!==p.session||u.generation!==p.generation||u.client!==p.client)throw Error('材料传输已失效，请重试');u.at=Date.now();
    if(p.op==='chunk'){if(typeof p.data!=='string'||p.data.length>CHUNK*4/3+4||p.offset!==u.offset)throw Error('材料分块顺序无效');const bytes=decode(p.data);if(!bytes.length||bytes.length>CHUNK||u.offset+bytes.length>u.asset.size)throw Error('材料分块无效');u.bytes.set(bytes,u.offset);u.offset+=bytes.length;}
    else if(p.op==='finish'){if(u.offset!==u.asset.size||await hash(u.bytes.buffer as ArrayBuffer)!==u.hash)throw Error('材料不完整或校验失败');if(generation()!==p.generation)throw Error('演示已重置');await write('assets',{id:u.asset.id,asset:u.asset,bytes:u.bytes.buffer as ArrayBuffer,hash:u.hash,generation:u.generation} satisfies Stored);uploads.delete(u.asset.id);reply.complete=true;}
    else throw Error('不支持的材料操作');
   }
  }reply.ok=true;
 }catch(e){reply.error=(e as Error).message;}if(currentState().startedAt===p.session&&generation()===p.generation)sendDeckPacket(reply);
}
async function transfer(asset:Stored,task:string){const begin=await rpc('begin',{task,asset:asset.asset,hash:asset.hash});if(begin.complete)return;const bytes=new Uint8Array(asset.bytes);for(let offset=0;offset<bytes.length;offset+=CHUNK)await rpc('chunk',{task,assetId:asset.id,offset,data:base64(bytes.subarray(offset,offset+CHUNK))});await rpc('finish',{task,assetId:asset.id});}
const urls=new Map<string,string>();
export async function deviceDeckAssetUrl(id:string){if(urls.has(id))return urls.get(id)!;let r:Stored;
 try{r=await localDeckAsset(id);}catch{if(role!=='phone')throw Error('原图片缺失，请重新选择');const first=await rpc('get',{assetId:id,offset:0});if(!validAsset(first.asset)||!first.hash)throw Error('图片信息无效');const bytes=new Uint8Array(first.asset.size);let part=first,offset=0;while(offset<bytes.length){const chunk=decode(part.data||'');if(!chunk.length||offset+chunk.length>bytes.length||part.hash!==first.hash)throw Error('图片传输不完整');bytes.set(chunk,offset);offset+=chunk.length;if(offset<bytes.length)part=await rpc('get',{assetId:id,offset});}if(await hash(bytes.buffer)!==first.hash)throw Error('图片校验失败');r={id,asset:first.asset,bytes:bytes.buffer,hash:first.hash,generation:generation()};await write('assets',r);}
 const url=URL.createObjectURL(new Blob([r.bytes],{type:r.asset.mime}));urls.set(id,url);return url;}
let pending:Pending[]=[],revision=0;const listeners=new Set<()=>void>(),running=new Set<string>();
const changed=()=>{revision++;for(const f of listeners)f();};
async function refresh(){pending=(await read<Pending[]>('pending')).filter(p=>p.generation===generation());changed();}
export function usePendingDeckMaterials(task:string){useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f);},()=>revision);return pending.filter(p=>p.task===task);}
export async function adoptDeviceMaterial(asset:DeckAsset,task:string,replace='',owner?:string){const stored=await localDeckAsset(asset.id);stored.asset=asset;await write('assets',stored);if((task!=='new'&&!currentState().workbuddy.tasks.some(t=>t.id===task&&!t.receipts&&!t.referenceRequest))||!currentState().workbuddy.drafts[task]||owner!==currentState().workbuddy.drafts[task].owner)throw Error('原任务已结束，材料未放入其他任务');await write('pending',{id:asset.id,task,replace,owner,generation:generation(),session:currentState().startedAt,error:''} satisfies Pending);await refresh();void resumeDeckMaterials();}
export async function retryDeckMaterial(id:string){const p=await read<Pending>('pending',id);if(p){p.error='';await write('pending',p);await refresh();void resumeDeckMaterials();}}
export async function discardDeckMaterial(id:string){if(running.has(id))return;await write('pending',null,id);await refresh();}
export async function resumeDeckMaterials(){if(!window.MobileNative||role==='phone'&&(!deckLinkReady()||currentState().inputSession?.phase!=='active'))return;for(const item of pending){if(running.size)break;if(item.error)continue;const s=currentState(),d=s.workbuddy.drafts[item.task];if(item.session!==s.startedAt||item.generation!==generation()||!d||item.owner!==d.owner){item.error='原任务已结束，可移除此材料';void write('pending',item).then(refresh);continue;}running.add(item.id);
 void(async()=>{try{if(!d.deckInput?.assets.some(a=>a.id===item.id)){const stored=await localDeckAsset(item.id);if(role==='phone')await transfer(stored,item.task);if(generation()!==item.generation)throw Error('演示已重置');const latest=currentState().workbuddy.drafts[item.task];if(!latest)throw Error('原任务不存在');const ack=await command('wb-deck-input',{task:item.task,owner:item.owner,revision:latest.deckInput?.revision||0,action:'asset',asset:stored.asset,replace:item.replace});if(!ack.ok&&!currentState().workbuddy.drafts[item.task]?.deckInput?.assets.some(a=>a.id===item.id))throw Error(ack.error||'材料采用未确认');}await write('pending',null,item.id);}catch(e){item.error=(e as Error).message;if(item.generation===generation())await write('pending',item);else await write('pending',null,item.id);}finally{running.delete(item.id);await refresh();void resumeDeckMaterials();}})();
 }}
export function deckConnectionChanged(){if(!window.MobileNative)return;if(!deckLinkReady()){uploads.clear();for(const w of waiters.values()){clearTimeout(w.timer);w.reject(Error('连接中断，材料已保留'));}waiters.clear();}else void resumeDeckMaterials();}
if(typeof window!=='undefined'){
 window.addEventListener('native-ready',()=>{void refresh().then(resumeDeckMaterials);});
 window.addEventListener('demo-reset',()=>{for(const w of waiters.values()){clearTimeout(w.timer);w.reject(Error('演示已重置'));}waiters.clear();void db().then(d=>{const tx=d.transaction(['assets','pending'],'readwrite');tx.objectStore('assets').clear();tx.objectStore('pending').clear();tx.oncomplete=()=>d.close();tx.onerror=()=>d.close();});uploads.clear();pending=[];for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();changed();});
 // LocalAssets may already have delivered native-ready before JS mounted.
 if(window.MobileNative)setTimeout(()=>void refresh().then(resumeDeckMaterials),0);
}
