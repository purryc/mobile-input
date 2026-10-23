import {beginNativePhoto,markNativePhotoUsed,type NativePhoto} from './native-photo-state';
import {useEffect,useRef,useState} from 'react';
import * as I from 'lucide-react';
import {command,currentState,useRuntime} from './runtime';
import {nativeCapture,readImage} from './capture-producer';
import type {CaptureKind,CaptureState} from '../../../packages/core/capture';
import './capture.css';
type Crop={x:number;y:number;width:number;height:number};
export function CapturePanel({close,photo,initialKind,slot}:{close:()=>void;photo?:NativePhoto;initialKind?:CaptureKind;slot?:CaptureState['slot']}){
 const r=useRuntime(),c=photo||r.state.capture,[stage,setStage]=useState<'choose'|'record'|'camera'>('choose'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[purpose,setPurpose]=useState<'reference'|'layout'>('reference'),[cropping,setCropping]=useState(false),[crop,setCrop]=useState<Crop|null>(null),[task,setTask]=useState(r.state.workbuddy.task);
 const adoptedOwner=c?.phase==='used'&&c.file?r.state.workbuddy.files.find(f=>f.id===c.file)?.task:undefined;
 const previewElement=useRef<HTMLDivElement>(null),video=useRef<HTMLVideoElement>(null),media=useRef<MediaStream|null>(null),origin=useRef({x:0,y:0}),seen=useRef(''),mounted=useRef(true);
 useEffect(()=>{return()=>{mounted.current=false;media.current?.getTracks().forEach(track=>track.stop());};},[]);
 useEffect(()=>{if(c)seen.current=c.id;else if(seen.current)close();},[c?.id]);
 useEffect(()=>{const back=(event:Event)=>{event.preventDefault();void cancel();};window.addEventListener('app-back',back);window.addEventListener('native-back',back);return()=>{window.removeEventListener('app-back',back);window.removeEventListener('native-back',back);};},[c?.id]);
 const requestedInitial=useRef(false);
 useEffect(()=>{if(initialKind&&!requestedInitial.current){requestedInitial.current=true;if(initialKind==='recording')setStage('record');else void request(initialKind);}},[]);
 async function cancel(){media.current?.getTracks().forEach(track=>track.stop());if(c&&!photo)if(!photo)await command('capture-cancel',{id:c.id});close();}
 async function readyPhoto(data:string,id:string){const image=await readImage(data),canvas=document.createElement('canvas'),scale=Math.min(1,960/Math.max(image.width,image.height));canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d')!.drawImage(image,0,0,canvas.width,canvas.height);if(!mounted.current||currentState().capture?.id!==id)return;const ack=await command('capture-ready',{id,data:canvas.toDataURL('image/jpeg',.82),width:canvas.width,height:canvas.height});if(!ack.ok)setError(ack.error||'照片未接收');}
 async function request(kind:CaptureKind){
  if(kind==='camera'&&window.MobileNative){beginNativePhoto(slot);close();return;}
  setError('');setBusy(true);const s=currentState();const ack=await command('capture-request',{kind,slot},{targetId:s.target?.id||'',targetRevision:s.target?.revision||0});if(!ack.ok){setError(ack.error||'采集未开始');setBusy(false);return;}if(!mounted.current){await command('capture-cancel',{id:ack.id});return;}seen.current=ack.id;
  try{if(kind==='camera'){
   if(window.MobileNative)await readyPhoto(await nativeCapture('camera'),ack.id);
   else{if(!navigator.mediaDevices?.getUserMedia)throw new Error('当前页面无法使用相机，请使用手机 Input Agent');const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:960}},audio:false});if(!mounted.current||currentState().capture?.id!==ack.id){stream.getTracks().forEach(track=>track.stop());return;}media.current=stream;setStage('camera');requestAnimationFrame(()=>{if(video.current){video.current.srcObject=stream;void video.current.play();}});}
  }}catch(e){await command('capture-failed',{id:ack.id,error:e instanceof DOMException?({NotAllowedError:'相机权限未获允许，输入草稿已保留',NotFoundError:'未找到可用相机，输入草稿已保留',NotReadableError:'相机正在被占用，请关闭其他相机应用'}[e.name]||'无法打开相机，输入草稿已保留'):e instanceof Error?e.message:'相机不可用'});}finally{setBusy(false);}
 }
 async function takePhoto(){const source=video.current;if(!source?.videoWidth)return;const canvas=document.createElement('canvas');canvas.width=source.videoWidth;canvas.height=source.videoHeight;canvas.getContext('2d')!.drawImage(source,0,0);media.current?.getTracks().forEach(track=>track.stop());await readyPhoto(canvas.toDataURL('image/jpeg',.82),c!.id);}
 async function use(purpose:string){if(!c)return;setBusy(true);setError('');try{let data:string|undefined;if(crop&&c.data){const image=await readImage(c.data),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*crop.width));canvas.height=Math.max(1,Math.round(image.height*crop.height));canvas.getContext('2d')!.drawImage(image,image.width*crop.x,image.height*crop.y,image.width*crop.width,image.height*crop.height,0,0,canvas.width,canvas.height);data=canvas.toDataURL('image/jpeg',.85);}const now=currentState();const ack=photo?await command('capture-photo-use',{photoId:photo.id,slot:photo.slot,origin:{app:photo.app,task:photo.task,target:photo.target},data:photo.data,width:photo.width,height:photo.height,purpose,task:photo.app==='workbuddy'?photo.task:task,...(crop?{crop,croppedData:data}:{})},{targetId:now.target?.id||'',targetRevision:now.target?.revision||0}):await command('capture-use',{id:c.id,purpose,task: c.app==='workbuddy'?c.task:task,...(crop?{crop,data}:{})});if(!ack.ok)setError(ack.error||'未加入参考');else if(photo)markNativePhotoUsed('capture-'+photo.id);}catch{setError('裁剪失败，原图已保留');}finally{setBusy(false);}}
 async function returnToTask(){
  const destination=adoptedOwner;
  if(!destination){setError('材料所属任务已变化，请重新选择任务');return;}
  if(!r.connected){setError('请先恢复连接');return;}
  const opened=await command('open','workbuddy');if(!opened.ok){setError(opened.error||'未打开 WorkBuddy');return;}
  const focused=await command('wb-input-task',{id:destination});if(!focused.ok){setError(focused.error||'任务已变化');return;}close();
 }
 const photoTargetMatches=!photo||(r.state.app===photo.app&&(r.state.target?.id||'')===photo.target&&(photo.app!=='workbuddy'||r.state.workbuddy.task===photo.task));
 const position=(event:React.PointerEvent<HTMLElement>)=>{const b=event.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(event.clientX-b.left)/b.width)),y:Math.max(0,Math.min(1,(event.clientY-b.top)/b.height))};};
 return <section className="capture-panel" role="dialog" aria-label="采集参考" data-capture-exclude>
 <header><b>{c?.phase==='preview'?'采集预览':c?.phase==='used'?'已加入任务参考':'采集方式'}</b><button aria-label="关闭采集方式" onClick={cancel}><I.X size={22}/></button></header>
 <div className="capture-panel-scroll">{photo&&<div className="capture-photo-owner"><small>原任务 · {photo.taskLabel}</small><p>{photo.targetLabel}</p>{!r.connected?<p>照片保留在手机，请先恢复连接。</p>:!photoTargetMatches?<p>输入目标已变化，请回到拍照前的任务后再用。</p>:null}</div>}
 <div className="capture-source"><small>采集来源与范围</small><p>{c?.source||(r.state.app==='workbuddy'?'平板 · WorkBuddy 应用窗口':'平板 · 哔哩哔哩应用窗口')}</p></div>
 {c?.phase==='preview'&&c.data?<>
 <div ref={previewElement} style={{maxWidth:`${180*(c.width||1)/(c.height||1)}px`}} className={'capture-preview '+(cropping?'cropping':'')} onPointerDown={e=>{if(!cropping)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);origin.current=position(e);setCrop(null);}} onPointerMove={e=>{if(!cropping||!e.buttons)return;const p=position(e),o=origin.current;setCrop({x:Math.min(o.x,p.x),y:Math.min(o.y,p.y),width:Math.abs(o.x-p.x),height:Math.abs(o.y-p.y)});}} onPointerUp={()=>{if(crop&&(crop.width<.025||crop.height<.025))setCrop(null);}}>
 {c.kind==='recording'?<video src={c.data} controls playsInline/>:<img src={c.data} alt="实际采集预览" draggable={false}/>}
 {crop&&<i style={{left:`${crop.x*100}%`,top:`${crop.y*100}%`,width:`${crop.width*100}%`,height:`${crop.height*100}%`}}/>}</div>
 <small>{c.kind==='recording'?`${((c.duration||0)/1000).toFixed(1)} 秒 · 无声录屏`:`${c.width} × ${c.height} · ${crop?'已圈选区域':'完整范围'}`}</small>
 <div className="capture-uses">{c.kind!=='recording'&&<button aria-pressed={cropping} onClick={()=>{setCropping(!cropping);setCrop(null);requestAnimationFrame(()=>previewElement.current?.scrollIntoView({block:'nearest'}));}}><I.Scan/>圈选参考范围</button>}
 {c.app==='bilibili'&&<label>加入 WorkBuddy 任务<select aria-label="采集目标任务" value={task} onChange={e=>setTask(e.target.value)}><option value="new">新建任务草稿</option>{r.state.workbuddy.tasks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>}
 <label>用途<select aria-label="参考用途" value={purpose} onChange={e=>setPurpose(e.target.value as typeof purpose)}><option value="reference">任务参考</option><option value="layout">布局参考</option></select></label></div></>
 :c?.phase==='used'?<div className="capture-success"><I.CheckCircle/><p>已加入任务参考</p><p>{r.state.workbuddy.tasks.find(t=>t.id===(adoptedOwner||task))?.title||'当前任务'}</p><button onClick={cancel}>返回输入</button>{c.app==='bilibili'&&<button onClick={returnToTask}>返回材料任务</button>}</div>
 :c?.phase==='failed'?<div role="alert"><p>{c.error}</p><button onClick={async()=>{if(!photo)await command('capture-cancel',{id:c.id});close();}}>返回输入</button></div>
 :c&&['requested','recording','stopping'].includes(c.phase)?<div className="capture-progress">{stage==='camera'?<><video ref={video} muted playsInline autoPlay/><button onClick={takePhoto}>拍照</button></>:<><I.ScanLine/><p>{c.kind==='recording'?(c.phase==='stopping'?'正在处理录屏…':'正在录制应用窗口'):c.kind==='camera'?'等待相机返回…':'正在截取应用窗口…'}</p>{c.kind==='recording'&&<button disabled={c.phase==='stopping'} onClick={()=>command('capture-stop',{id:c.id})}>停止录屏</button>}</>}</div>
 :stage==='record'?<div className="capture-uses"><p>当前应用窗口 · 无声录屏</p><small>最长 20 秒</small><button disabled={busy} onClick={()=>request('recording')}><I.Circle/>开始录屏</button><button onClick={()=>setStage('choose')}>返回采集方式</button></div>
 :<div className="capture-choices"><button disabled={busy} onClick={()=>request('screenshot')}><I.ScanLine/>截图</button><button disabled={busy} onClick={()=>setStage('record')}><I.Video/>录屏</button><button disabled={busy} onClick={()=>request('camera')}><I.Camera/>相机</button></div>}
 {error&&<p role="alert">{error}</p>}
 </div>{c?.phase==='preview'&&c.data&&<footer className="capture-confirm-footer"><button disabled={busy||!r.connected||!photoTargetMatches} onClick={()=>use(purpose)}><I.Check/>{purpose==='layout'?'作为布局参考':'作为任务参考'}</button></footer>}</section>;
}

export function CaptureAttachments({exclude=[]}:{exclude?:string[]}={}){
 const s=useRuntime().state,t=s.target;if(!t)return null;const [,type,id]=t.id.split(':');
 const draft=type==='draft'?s.workbuddy.drafts[id]:s.workbuddy.entityDrafts[t.id];const files=s.workbuddy.files.filter(f=>draft?.attachments.includes(f.id)&&f.id.startsWith('capture-')&&!exclude.includes(f.id));
 if(!files.length)return null;
 return <div className="capture-attachments">{files.map(file=><details key={file.id}><summary>{file.name}</summary>{file.kind==='video'?<video src={file.asset} controls playsInline/>:<img src={file.asset} alt={file.name}/>}<small>{file.content}</small><button onClick={()=>command('capture-remove',{file:file.id},{targetId:t.id,targetRevision:t.revision})}>移除参考</button></details>)}</div>;
}
