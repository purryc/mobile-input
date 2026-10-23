import {sentenceParameters} from './workbuddy-sentence';
import {wbInput} from './workbuddy-input';
import type {State,Command,AppId} from './model';
import {wbDraftFor} from './workbuddy';
import {fileDraft} from './workbuddy-files';
export type CaptureKind='screenshot'|'recording'|'camera';
export interface CaptureState {
 id:string;kind:CaptureKind;app:AppId;source:string;task:string;target:string;targetRevision:number;
 phase:'requested'|'recording'|'stopping'|'preview'|'failed'|'used';at:number;
 slot?:{kind:CaptureKind;phrase:string};data?:string;width?:number;height?:number;duration?:number;error?:string;file?:string;
}
export function captureMatches(s:State,c:CaptureState){return s.app===c.app&&(s.target?.id||'')===c.target&&(s.target?.revision||0)===c.targetRevision&&(s.app!=='workbuddy'||s.workbuddy.task===c.task);}
export function reconcileCapture(s:State){if(s.capture&&!captureMatches(s,s.capture))s.capture=null;}
export function captureInteraction(s:State,c:Command):string|null|undefined {
 if(!c.type.startsWith('capture-'))return undefined;
 const p=(c.value||{}) as Record<string,unknown>,active=s.capture;
 if(c.type==='capture-photo-use'){
  const origin=p.origin as {app:string;task:string;target:string},photoId=String(p.photoId||'');
  if(!/^[a-z0-9-]{1,80}$/i.test(photoId)||!origin||!['workbuddy','bilibili'].includes(s.app))return '照片来源无效';
  if(origin.app!==s.app||origin.target!==(s.target?.id||'')||s.app==='workbuddy'&&origin.task!==s.workbuddy.task||c.targetId!==(s.target?.id||'')||c.targetRevision!==(s.target?.revision||0))return '输入目标已变化，请回到拍照前的任务后再用';
  if(s.workbuddy.files.some(file=>file.id==='capture-'+photoId))return '这张照片已加入参考';
  if(active&&['requested','recording','stopping'].includes(active.phase))return '请先结束当前采集';
  s.capture={id:photoId,kind:'camera',source:'手机相机',app:s.app,task:s.workbuddy.task,target:s.target?.id||'',targetRevision:s.target?.revision||0,phase:'requested',at:Date.now(),slot:p.slot as CaptureState['slot']};
  const ready=captureInteraction(s,{...c,type:'capture-ready',value:{id:photoId,data:p.data,width:p.width,height:p.height}});if(ready)return ready;
  return captureInteraction(s,{...c,type:'capture-use',value:{id:photoId,task:p.task,purpose:p.purpose,crop:p.crop,data:p.croppedData}});
 }

 if(c.type==='capture-remove'){const t=s.target;if(!t||c.targetId!==t.id||c.targetRevision!==t.revision)return '输入目标已变化';const draft=wbDraftFor(s,t.id);if(!draft)return '输入草稿不存在';draft.attachments=draft.attachments.filter(id=>id!==p.file);draft.revision++;return null;}
 if(c.type==='capture-request'){
  if(!['workbuddy','bilibili'].includes(s.app))return '请先打开要采集的应用';
  if(!['screenshot','recording','camera'].includes(String(p.kind)))return '采集方式无效';
  if(c.targetId!==(s.target?.id||'')||c.targetRevision!==(s.target?.revision||0))return '采集目标已变化';
  if(active&&['requested','recording','stopping'].includes(active.phase))return '请先停止或取消当前采集';
  s.capture={id:c.id,kind:p.kind as CaptureKind,app:s.app,source:p.kind==='camera'?'手机相机':s.app==='workbuddy'?'平板 · WorkBuddy 应用窗口':'平板 · 哔哩哔哩应用窗口',task:s.workbuddy.task,target:s.target?.id||'',targetRevision:s.target?.revision||0,phase:'requested',at:Date.now(),slot:p.slot as CaptureState['slot']};return null;
 }
 if(!active||p.id!==active.id||!captureMatches(s,active))return '采集会话已结束或目标已变化';
 if(c.type==='capture-cancel'){s.capture=null;return null;}
 if(c.type==='capture-started'){if(active.phase!=='requested'||active.kind!=='recording')return '录屏状态已变化';active.phase='recording';return null;}
 if(c.type==='capture-stop'){if(active.kind!=='recording'||!['requested','recording'].includes(active.phase))return '没有正在进行的录屏';active.phase='stopping';return null;}
 if(c.type==='capture-failed'){if(!['requested','recording','stopping'].includes(active.phase))return '采集状态已变化';active.phase='failed';active.error=String(p.error||'采集失败，请重试').slice(0,200);return null;}
 if(c.type==='capture-ready'){
  if(!['requested','recording','stopping'].includes(active.phase))return '采集已完成';
  const data=String(p.data||''),video=active.kind==='recording';
  if(!(video?/^data:video\/(?:webm|mp4)(?:;codecs=[^;,]+)?;base64,[a-zA-Z0-9+/]+=*$/:/^data:image\/(?:jpeg|png);base64,[a-zA-Z0-9+/]+=*$/).test(data)||data.length>600000)return '采集内容过大或格式无效，请缩短录屏后重试';
  const width=Number(p.width),height=Number(p.height),duration=Number(p.duration||0);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>4096||height>4096||!Number.isFinite(duration)||duration<0||duration>60000)return '采集尺寸或时长无效';
  Object.assign(active,{phase:'preview',data,width,height,duration});if(JSON.stringify(s).length>1800000)return '本地参考材料已满，请先移除旧材料';return null;
 }
 if(c.type==='capture-use'){
  if(active.phase!=='preview'||!active.data)return '请先预览采集内容';
  const task=String(p.task||active.task),draft=active.app==='workbuddy'?wbDraftFor(s,active.target):s.workbuddy.drafts[task];
  if(!draft||!(task==='new'&&s.workbuddy.drafts.new||s.workbuddy.tasks.some(t=>t.id===task))||active.app==='workbuddy'&&task!==active.task)return '请选择有效的 WorkBuddy 任务';
  if(!['reference','layout'].includes(String(p.purpose)))return '请选择参考用途';
  let data=active.data,width=active.width!,height=active.height!;
  if(p.crop){const rect=p.crop as {x:number;y:number;width:number;height:number};if(active.kind==='recording'||Object.values(rect).some(v=>!Number.isFinite(v))||rect.x<0||rect.y<0||rect.width<=0||rect.height<=0||rect.x+rect.width>1.001||rect.y+rect.height>1.001)return '裁剪区域无效';data=String(p.data||'');if(!/^data:image\/jpeg;base64,[a-zA-Z0-9+/]+=*$/.test(data)||data.length>600000)return '裁剪图片无效';width=Math.round(width*rect.width);height=Math.round(height*rect.height);}
  const id='capture-'+active.id,name=(active.kind==='recording'?'录屏':active.kind==='camera'?'照片':'截图')+' · '+new Date(active.at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})+(active.kind==='recording'?(active.data.startsWith('data:video/mp4')?'.mp4':'.webm'):'.jpg');
  s.workbuddy.files.push({id,name,kind:active.kind==='recording'?'video':'image',asset:data,content:`${active.source} · ${p.crop?'圈选区域':'完整窗口'} · ${width}×${height} · ${p.purpose==='layout'?'布局参考':'任务参考'}`,draft:fileDraft(),folder:'采集参考',task,edited:false,dataVersion:s.reportRevision});
  draft.attachments=[...new Set([...draft.attachments,id])];
  const slot=active.slot;
  if(slot&&slot.kind===active.kind&&active.app==='workbuddy'&&sentenceParameters(draft.text,{task,target:active.target,targetRevision:active.targetRevision,inputRevision:draft.revision}).some(x=>x.kind===slot.kind&&x.phrase===slot.phrase)){const input=wbInput(draft),previous=input.materialSlots?.[slot.kind];if(previous?.phrase===slot.phrase)draft.attachments=draft.attachments.filter(f=>f!==previous.file);(input.materialSlots??={})[slot.kind]={phrase:slot.phrase,file:id};input.revision++;}
 draft.revision++;active.phase='used';active.file=id;delete active.data;
  if(JSON.stringify(s).length>1400000)return '本地参考材料已满，请先移除旧材料';return null;
 }
 return '采集操作无效';
}
