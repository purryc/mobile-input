import type {Command,State,ObjectTextStyle} from './model';
import {browserState,findFileView,fileBody,fileConflict,fileReadOnly,fileDraft,pathText,working,changePath,editBody,saveBrowserFile} from './workbuddy-files';
export interface ObjectInput {
 revision:number;view:string;file:string;path:string;source:string;base:number;version:number;style:ObjectTextStyle;
 preview:null|{id:string;before:string;after:string;style:ObjectTextStyle;draftRevision:number;base:number;version:number;consumed:boolean};
}
export function objectContext(s:State){const id=s.target?.id||'';return browserState(s).objectInputs?.[id];}
export function objectInteraction(s:State,c:Command):string|null|undefined{
 const isSubmit=c.type==='wb-submit'&&s.target?.id.startsWith('wb:object:');
 if(!c.type.startsWith('wb-object-')&&!isSubmit)return undefined;
 const b=browserState(s),p=(c.value||{}) as Record<string,unknown>;
 if(c.type==='wb-object-select'){
  const view=String(p.view),file=String(p.file),path=String(p.path),v=findFileView(s,view);
  if(!v||v.active!==file||!/^slide\/\d+\/(title|body)$/.test(path))return '请选择可编辑的幻灯片对象';
  if(fileReadOnly(s,v,file)||fileConflict(s,v,file))return '当前文件只读或已在别处更新';
  const body=fileBody(s,v,file);if(!body.slides?.[Number(path.split('/')[1])])return '幻灯片对象不存在';
  const id=`wb:object:${view}:${file}:${path}`,source=pathText(body,path),a=working(s,v,file);
  b.objectInputs??={};const old=b.objectInputs[id];
  const rebound=!old||old.base!==b.docs[file].revision||old.version!==a.version;
  if(rebound)b.objectInputs[id]={revision:0,view,file,path,source,base:b.docs[file].revision,version:a.version,style:{...body.objectStyles?.[path]},preview:null};
  s.workbuddy.entityDrafts[id]??=fileDraft();v.selection={file,paths:[path],text:source};
  if(s.target?.id!==id||rebound)s.target={id,app:'workbuddy',kind:'text',label:String(p.label||'幻灯片对象'),revision:s.revision+1,value:s.workbuddy.entityDrafts[id].text};
  return null;
 }
 const target=s.target,o=objectContext(s),d=target&&s.workbuddy.entityDrafts[target.id];
 if(!target||!o||!d||c.targetId!==target.id||c.targetRevision!==target.revision)return '选中对象已变化，修改草稿已保留';
 const v=findFileView(s,o.view);if(!v||v.active!==o.file)return '文件目标已切换';
 if(fileReadOnly(s,v,o.file)||fileConflict(s,v,o.file))return '文件已变化，请重新选择对象';
 const a=working(s,v,o.file);
 if(o.base!==b.docs[o.file].revision||o.version!==a.version)return '对象已被修改，请重新选择';
 if(c.type==='wb-object-pointer'){
  const x=Number(p.x),y=Number(p.y),sequence=Number(p.sequence),gesture=String(p.gesture||''),last=b.objectPointer;
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1||!gesture||!Number.isInteger(sequence)||sequence<1)return '指向参数无效';
  if(last?.gesture===gesture&&sequence<=last.sequence)return '指向顺序已过期';
  if(!['move','commit','release'].includes(String(p.phase)))return '指向状态无效';
  b.objectPointer={view:o.view,file:o.file,targetRevision:target.revision,x,y,gesture,sequence,commit:p.phase==='commit'?c.id:'',at:Date.now()};return null;
 }
 if(c.type==='wb-object-style'){
  if(p.revision!==o.revision)return '格式参数已变化';
  const style=p.style as ObjectTextStyle;
  if(!style||Object.keys(style).some(k=>!['color','size','align'].includes(k))||style.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(style.color)||style.size!==undefined&&(!Number.isFinite(style.size)||style.size<12||style.size>72)||style.align!==undefined&&!['left','center','right'].includes(style.align))return '格式参数无效';
  const next=structuredClone(a.body);const merged={...o.style,...style};next.objectStyles={...next.objectStyles,[o.path]:merged};
  const edit=editBody(s,v,o.file,next,'对象格式');if(edit)return edit;
  const save=saveBrowserFile(s,v,o.file,'对象格式');if(save)return save;
  o.style=merged;o.revision++;o.preview=null;o.base=b.docs[o.file].revision;o.version=working(s,v,o.file).version;return null;
 }
 if(c.type==='wb-object-cancel'){o.preview=null;return null;}
 if(isSubmit){
  if(p.revision!==d.revision)return '修改要求已变化';
  const text=String(p.text||'').trim();if(!text||text.length>20000)return '请输入修改要求';
  if(/(?:不要|别|不用).*(?:改为|改成|替换|换成)/.test(text))return '修改要求包含否定，请明确要保留或替换的内容';
  const match=text.match(/(?:改为|改成|替换为|换成)[\s:：]*[“「『"']([^”」』"']+)[”」』"']/)||text.match(/(?:改为|改成|替换为|换成)[\s:：]*([^，。；\n]+)/);
  let after=match?.[1]?.trim();
  if(!after&&/^(?:直接替换[:：])/.test(text))after=text.replace(/^直接替换[:：]\s*/,'');
  if(!after&&/^(?:应用格式|仅调整格式|只调整格式)[。！]?$/.test(text))after=o.source;
  if(!after)return '请写明“改为……”或使用“直接替换：新内容”';
  const next=structuredClone(a.body);const error=changePath(next,o.path,after);if(error)return error;
  next.objectStyles={...next.objectStyles,[o.path]:{...o.style}};
  const edit=editBody(s,v,o.file,next,'对象修改');if(edit)return edit;
  const save=saveBrowserFile(s,v,o.file,'对象修改');if(save)return save;
  o.preview=null;o.base=b.docs[o.file].revision;o.version=working(s,v,o.file).version;o.source=after;
  d.text='';d.revision++;target.value='';return null;
 }
 if(c.type==='wb-object-apply')return '旧修改预览已停用，请重新发送修改要求';
 return '对象操作不存在';
}
