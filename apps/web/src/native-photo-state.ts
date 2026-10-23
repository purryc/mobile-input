import {useSyncExternalStore} from 'react';
import {currentState,role,uid} from './runtime';
import type {CaptureState} from '../../../packages/core/capture';
export interface NativePhoto extends CaptureState {taskLabel:string;targetLabel:string;}
const key='input-agent:pending-camera-v1',listeners=new Set<()=>void>();
let photo:NativePhoto|null=null;
try{if(role==='phone'){const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved?.id&&saved.kind==='camera')photo={...saved,phase:'requested'};}}catch{}
function persistMetadata(){
 // Storage can be unavailable in a WebView. Keep the live photo usable;
 // only cross-reload recovery depends on this metadata, never the image itself.
 try{if(photo&&photo.phase!=='used'){const {data,...metadata}=photo;sessionStorage.setItem(key,JSON.stringify(metadata));}else sessionStorage.removeItem(key);}catch{}
}
function notify(){persistMetadata();for(const listener of listeners)listener();}
export function useNativePhoto(){return useSyncExternalStore(callback=>{listeners.add(callback);return()=>listeners.delete(callback);},()=>photo);}
export function discardNativePhoto(){if(photo)window.MobileNative?.clearCapture?.(photo.id);photo=null;notify();}
export function markNativePhotoUsed(file:string){if(!photo)return;photo={...photo,phase:'used',file,data:undefined};window.MobileNative?.clearCapture?.(photo.id);notify();}
export function beginNativePhoto(slot?:CaptureState['slot']){
 if(photo?.phase==='requested')return;
 discardNativePhoto();const s=currentState(),id=uid();photo={id,slot,kind:'camera',app:s.app,source:'手机相机',task:s.workbuddy.task,target:s.target?.id||'',targetRevision:s.target?.revision||0,phase:'requested',at:Date.now(),taskLabel:s.workbuddy.tasks.find(t=>t.id===s.workbuddy.task)?.title||'新建任务草稿',targetLabel:s.target?.label||'当前应用'};notify();
 try{if(window.MobileNative?.capture?.(id,'camera')!=='pending'){photo={...photo,phase:'failed',error:'当前设备无法打开相机，请检查权限或更新 Input Agent'};notify();}}catch{photo={...photo,phase:'failed',error:'无法打开相机，原草稿已保留'};notify();}
}
function accept(result:{id:string;data?:string;error?:string;pending?:boolean}){
 if(!photo||result.id!==photo.id||photo.phase==='used'||result.pending)return;
 if(result.error||!result.data){photo={...photo,phase:'failed',error:result.error||'上次拍照未完成，请重新拍照'};notify();return;}
 const id=photo.id,image=new Image();image.onload=()=>{if(!photo||photo.id!==id||photo.phase==='used')return;photo={...photo,phase:'preview',data:result.data,width:image.naturalWidth,height:image.naturalHeight};notify();};image.onerror=()=>{if(photo?.id===id&&photo.phase!=='used'){photo={...photo,phase:'failed',error:'无法读取照片，原草稿已保留'};notify();}};image.src=result.data;
}
function recover(){if(!photo||!window.MobileNative?.captureResult||photo.phase==='used')return;try{const result=window.MobileNative.captureResult(photo.id);if(result)accept(JSON.parse(result));else if(photo.phase==='requested'){photo={...photo,phase:'failed',error:'上次拍照未完成，请重新拍照'};notify();}}catch{}}
window.addEventListener('native-capture',event=>accept((event as CustomEvent).detail));
window.addEventListener('native-ready',recover);
window.addEventListener('native-foreground',event=>{if((event as CustomEvent).detail)recover();});
setTimeout(recover,100);

window.addEventListener('demo-reset',discardNativePhoto);
