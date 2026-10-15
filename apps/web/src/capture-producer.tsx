import {useEffect,useRef} from 'react';
import {toCanvas} from 'html-to-image';
import {command,currentState,role,uid,useRuntime} from './runtime';
import type {CaptureState} from '../../../packages/core/capture';
export function readImage(url:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('无法读取采集图片'));image.src=url;});}
export function blobData(blob:Blob):Promise<string>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('无法读取采集内容'));reader.readAsDataURL(blob);});}
export async function nativeCapture(kind:'window'|'camera'):Promise<string>{
 if(!window.MobileNative?.capture)throw new Error('当前设备未提供采集能力，请更新 Input Agent');
 const id=uid();return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>finish('',kind==='camera'?'相机操作超时，请重新打开':'窗口截图超时，请重试'),kind==='camera'?120000:10000);
  const listener=(event:Event)=>{const d=(event as CustomEvent).detail;if(d.id===id)finish(d.data,d.error);};
  function finish(data:string,error?:string){clearTimeout(timeout);window.removeEventListener('native-capture',listener);error||!data?reject(new Error(error||'未获得采集内容')):resolve(data);}
  window.addEventListener('native-capture',listener);
  if(window.MobileNative!.capture!(id,kind)!=='pending')finish('','当前设备无法采集，请保持应用在前台');
 });
}
async function appCanvas(c:CaptureState){
 if(currentState().capture?.id!==c.id||document.hidden)throw new Error('采集已取消');
 const root=document.querySelector<HTMLElement>(c.app==='workbuddy'?'.application > .workbuddy':'.bili-tablet');
 if(!root)throw new Error('目标应用窗口不可见');
 const rect=root.getBoundingClientRect(),width=Math.max(1,Math.min(960,Math.round(rect.width))),height=Math.max(1,Math.round(width*rect.height/rect.width));
 if(window.MobileNative){
  const image=await readImage(await nativeCapture('window')),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const xScale=image.width/innerWidth,yScale=image.height/innerHeight;
  canvas.getContext('2d')!.drawImage(image,rect.left*xScale,rect.top*yScale,rect.width*xScale,rect.height*yScale,0,0,width,height);return canvas;
 }
 return toCanvas(root,{width:rect.width,height:rect.height,canvasWidth:width,canvasHeight:height,pixelRatio:1,skipFonts:true,backgroundColor:'#ffffff',filter:node=>!(node instanceof Element&&node.matches('[data-capture-exclude]'))});
}
export function CaptureProducer(){
 const r=useRuntime(),active=r.state.capture,processing=useRef('');
 useEffect(()=>{
  if(role!=='tablet'||!active||active.kind==='camera'||active.phase!=='requested'||processing.current===active.id)return;
  processing.current=active.id;let cancelled=false,recorder:MediaRecorder|undefined,stream:MediaStream|undefined;
  const still=()=>!cancelled&&currentState().capture?.id===active.id;
  const emit=(type:string,value:Record<string,unknown>)=>still()?command(type,{id:active.id,...value}):Promise.resolve(null);
  (async()=>{
   try{
    const first=await appCanvas(active);if(!still())return;
    if(active.kind==='screenshot'){const ack=await emit('capture-ready',{data:first.toDataURL('image/jpeg',.82),width:first.width,height:first.height});if(ack&&!ack.ok)await emit('capture-failed',{error:ack.error});return;}
    if(typeof MediaRecorder==='undefined'||typeof first.captureStream!=='function')throw new Error('当前设备不支持应用窗口录屏，仍可使用截图');
    const mime=['video/webm;codecs=vp8','video/webm','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));if(!mime)throw new Error('当前设备没有可用的录屏编码器');
    stream=first.captureStream(4);const chunks:Blob[]=[];let bytes=0;
    recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:160000});
    const done=new Promise<Blob>((resolve,reject)=>{recorder!.ondataavailable=e=>{if(e.data.size){chunks.push(e.data);bytes+=e.data.size;}};recorder!.onstop=()=>resolve(new Blob(chunks,{type:mime.split(';')[0]}));recorder!.onerror=()=>reject(new Error('录屏中断，请重新录制'));});
    recorder.start(500);const start=Date.now();await emit('capture-started',{});
    while(still()&&currentState().capture?.phase==='recording'&&!document.hidden&&Date.now()-start<20000&&bytes<350000){const frame=await appCanvas(active);if(!still())break;first.getContext('2d')!.drawImage(frame,0,0,first.width,first.height);await new Promise(resolve=>setTimeout(resolve,250));}
    if(recorder.state!=='inactive')recorder.stop();const blob=await done;stream.getTracks().forEach(track=>track.stop());
    if(!still())return;if(document.hidden)throw new Error('应用已进入后台，录屏已停止');
    const ack=await emit('capture-ready',{data:await blobData(blob),width:first.width,height:first.height,duration:Date.now()-start});if(ack&&!ack.ok)await emit('capture-failed',{error:ack.error});
   }catch(error){await emit('capture-failed',{error:error instanceof Error?error.message:'采集失败，请重试'});}finally{stream?.getTracks().forEach(track=>track.stop());}
  })();
  return()=>{cancelled=true;if(recorder&&recorder.state!=='inactive')recorder.stop();stream?.getTracks().forEach(track=>track.stop());};
 },[active?.id]);
 return active?.kind==='recording'&&['requested','recording','stopping'].includes(active.phase)?<div className="capture-recording-badge" data-capture-exclude>● {active.phase==='stopping'?'正在结束录屏':'正在录制应用窗口'}</div>:null;
}
