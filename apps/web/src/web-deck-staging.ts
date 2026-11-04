import {useEffect,useSyncExternalStore} from 'react';
import {currentState} from './runtime';
import {localDeckAsset,legacyDeckMaterials,discardDeckMaterial,transferDeviceMaterial} from './web-deck-device';
import {uploadDeckAsset} from './web-deck-api';
import type {DeckAsset,DeckInput} from '../../../packages/core/web-deck';

export interface StagedDeckInput {
 assets:DeckAsset[]; removed:string[]; sketches:NonNullable<DeckInput['sketchDrafts']>;
 pendingPhotos?:DeckAsset[];
 submission?:string;
}
const empty=():StagedDeckInput=>({assets:[],removed:[],sketches:[]});
const cache=new Map<string,StagedDeckInput>(),queues=new Map<string,Promise<unknown>>(),listeners=new Set<()=>void>();
let version=0;
const notify=()=>{version++;listeners.forEach(f=>f());};
const db=()=>new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('input-agent-deck-staging',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('手机材料存储不可用'));});
async function read(key:string){const d=await db();try{return await new Promise<StagedDeckInput|undefined>((resolve,reject)=>{const r=d.transaction('drafts').objectStore('drafts').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{d.close();}}
async function write(key:string,value:StagedDeckInput){const d=await db();try{await new Promise<void>((resolve,reject)=>{const t=d.transaction('drafts','readwrite');t.objectStore('drafts').put(value,key);t.oncomplete=()=>resolve();t.onerror=()=>reject(Error('手机存储不足，材料尚未保存'));});}finally{d.close();}}
export function deckStageKey(task:string,owner:string){const s=currentState();return JSON.stringify([s.demoGeneration||0,task,owner]);}
export async function loadDeckStage(key:string){if(!cache.has(key)){const saved=await read(key);if(!cache.has(key))cache.set(key,saved||empty());notify();}return cache.get(key)!;}
export async function updateDeckStage(key:string,change:(value:StagedDeckInput)=>StagedDeckInput){
 const pending=(queues.get(key)||Promise.resolve()).catch(()=>{}).then(async()=>{const next=change(structuredClone(await loadDeckStage(key)));await write(key,next);cache.set(key,next);notify();return next;});
 queues.set(key,pending);try{return await pending;}finally{if(queues.get(key)===pending)queues.delete(key);}
}
export async function flushDeckStage(key:string){await queues.get(key);return structuredClone(await loadDeckStage(key));}
export function clearDeckStage(key:string){return updateDeckStage(key,()=>empty());}
export function useDeckStage(key:string,task:string,owner:string,enabled=true){
 useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f);},()=>version);
 useEffect(()=>{if(!enabled)return;void loadDeckStage(key).then(async()=>{for(const p of await legacyDeckMaterials(task,owner)){const stored=await localDeckAsset(p.id);await updateDeckStage(key,v=>({...v,assets:[...v.assets.filter(a=>a.id!==p.id&&a.id!==p.replace),stored.asset]}));await discardDeckMaterial(p.id);}}).catch(()=>{cache.set(key,{...empty(),submission:'storage-error'});notify();});},[key,enabled]);
 return cache.get(key);
}
export function stagedAssets(remote:DeckAsset[],stage?:StagedDeckInput){const removed=new Set(stage?.removed);return [...remote.filter(a=>!removed.has(a.id)&&!stage?.assets.some(b=>b.id===a.id)),...(stage?.assets||[])];}
export function validateStagedAssets(assets:DeckAsset[]){if(assets.length>12)throw Error('最多采用 12 份材料');if(assets.reduce((n,a)=>n+a.size,0)>24*1024*1024)throw Error('总材料超过 24 MB');}
export async function sendStagedAsset(asset:DeckAsset,task:string,valid:()=>boolean){
 const stored=await localDeckAsset(asset.id);
 if(window.MobileNative){await transferDeviceMaterial(asset.id,task,valid);return asset;}
 const remote=await uploadDeckAsset(new File([stored.bytes],asset.name,{type:asset.mime}),asset.kind,asset.scope);
 return {...remote,strokes:asset.strokes};
}
window.addEventListener('demo-reset',()=>{cache.clear();notify();void db().then(d=>{const t=d.transaction('drafts','readwrite');t.objectStore('drafts').clear();t.oncomplete=()=>d.close();});});
