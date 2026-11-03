import {markdownSelectionStyle} from './markdown-selection';
import {validTextRange,validEditTarget,markdownMark,type FileEditTarget} from './workbuddy-edit-contract';
import {selectionStyle,formatRange,replaceRange} from './text-runs';
import type {Command,State,ObjectTextStyle} from './model';
import {browserState,findFileView,fileBody,fileConflict,fileReadOnly,fileDraft,pathText,working,changePath,editBody,saveBrowserFile} from './workbuddy-files';
export interface ObjectInput {
 pending?:{id:string;target:FileEditTarget;instruction:string;targetRevision:number;draftRevision:number};error?:string;
 start?:number;end?:number;mixed?:string[];revision:number;view:string;file:string;path:string;source:string;base:number;version:number;style:ObjectTextStyle;
 preview:null|{id:string;before:string;after:string;style:ObjectTextStyle;draftRevision:number;base:number;version:number;consumed:boolean};
}
export function objectContext(s:State){const id=s.target?.id||'';return browserState(s).objectInputs?.[id];}
export function objectInteraction(s:State,c:Command):string|null|undefined{
 const isSubmit=c.type==='wb-submit'&&s.target?.id.startsWith('wb:object:');
 if(!c.type.startsWith('wb-object-')&&!isSubmit)return undefined;
 const b=browserState(s),p=(c.value||{}) as Record<string,unknown>;
 if(c.type==='wb-object-ai-cancel'){const o=b.objectInputs?.[String(p.owner)];if(o?.pending&&o.pending.id===p.request){delete o.pending;o.error='已取消，修改要求已保留';}return null;}
 if(c.type==='wb-object-ai-finish'||c.type==='wb-object-ai-fail'){
  if(c.inputClient)return '仅执行端确认修改结果';
  const id=String(p.owner),o=b.objectInputs?.[id],job=o?.pending;
  if(!o||!job||job.id!==p.request)return '修改请求已失效';
  delete o.pending;
  if(c.type==='wb-object-ai-fail'){o.error=String(p.error||'修改未完成，要求已保留').slice(0,200);return null;}
  const v=findFileView(s,o.view),a=v&&working(s,v,o.file),d=s.workbuddy.entityDrafts[id];
  if(s.app!=='workbuddy'||s.target?.id!==id||s.target.revision!==job.targetRevision||!v||v.active!==o.file||!a||a.base!==job.target.base||b.docs[o.file].revision!==job.target.base||a.version!==job.target.version||d?.revision!==job.draftRevision||fileReadOnly(s,v,o.file)||fileConflict(s,v,o.file)){o.error='目标或内容已变化，修改要求已保留';return null;}
  const full=pathText(a.body,o.path),t=job.target;
  if(!validTextRange(full,t.start,t.end)||full.slice(t.start,t.end)!==t.source||typeof p.text!=='string'||p.text.length>20000){o.error='修改结果无效，原内容已保留';return null;}
  const next=structuredClone(a.body),changed=replaceRange(full,next.textRuns?.[o.path],t.start,t.end,p.text),error=changePath(next,o.path,changed.text);
  if(error){o.error=error;return null;}next.textRuns={...next.textRuns,[o.path]:changed.runs};o.end=t.start+p.text.length;
  const edited=editBody(s,v,o.file,next,'对象修改');if(edited){o.error=edited;return null;}
  o.source=p.text;o.version=working(s,v,o.file).version;o.base=b.docs[o.file].revision;o.error='';d.text='';d.revision++;s.target.value='';return null;
 }
 if(c.type==='wb-object-direct'){
  const t=p.target as FileEditTarget;if(!validEditTarget(t)||typeof p.text!=='string'||p.text.length>100000)return '编辑参数无效';
  const v=findFileView(s,t.view);if(!v||v.active!==t.file)return '文件已切换';const a=working(s,v,t.file),full=pathText(a.body,t.path);
  if(a.version!==t.version||a.base!==t.base||!validTextRange(full,t.start,t.end)||full.slice(t.start,t.end)!==t.source)return '内容已变化，编辑未覆盖';
  const next=structuredClone(a.body),error=changePath(next,t.path,full.slice(0,t.start)+p.text+full.slice(t.end));if(error)return error;
  const edited=editBody(s,v,t.file,next,'直接编辑');if(!edited){const selected=objectContext(s);if(selected?.file===t.file&&selected.view===t.view&&selected.path===t.path){selected.start=0;selected.end=pathText(next,t.path).length;selected.source=pathText(next,t.path);selected.version=working(s,v,t.file).version;selected.base=b.docs[t.file].revision;selected.revision++;}}return edited;
 }
 if(c.type==='wb-object-select'){
  const view=String(p.view),file=String(p.file),path=String(p.path),v=findFileView(s,view);
  if(!v||v.active!==file||!(path==='text'||/^slide\/\d+\/(title|body)$/.test(path)||/^deck\/[^/]+\/(title|body|notes)$/.test(path)))return '请选择可编辑的幻灯片对象';
  if(fileReadOnly(s,v,file)||fileConflict(s,v,file))return '当前文件只读或已在别处更新';
  const body=fileBody(s,v,file);if(path==='text'&&!['markdown','text'].includes(s.workbuddy.files.find(f=>f.id===file)?.kind||''))return '该文件不支持此文字选区';const check=changePath(structuredClone(body),path,pathText(body,path));if(check)return check;
  const id=`wb:object:${view}:${file}:${path}`,source=pathText(body,path),a=working(s,v,file);
  b.objectInputs??={};const old=b.objectInputs[id];
  const start=p.start===undefined?0:Number(p.start),end=p.end===undefined?source.length:Number(p.end);if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>source.length||end<start||end===start&&source.length>0||[start,end].some(i=>i>0&&i<source.length&&/[\uD800-\uDBFF]/.test(source[i-1])&&/[\uDC00-\uDFFF]/.test(source[i])))return '文字选区无效';
  const rebound=!old||old.base!==b.docs[file].revision||old.version!==a.version||old.start!==start||old.end!==end;const picked=path==='text'?markdownSelectionStyle(source,start,end):selectionStyle(source,body.textRuns?.[path],start,end,{color:'#122D39',size:path.endsWith('/title')?36:24,...body.objectStyles?.[path]});
  if(rebound&&old?.pending){delete old.pending;}
  if(rebound)b.objectInputs[id]={revision:0,view,file,path,start,end,source:source.slice(start,end),base:b.docs[file].revision,version:a.version,style:{...picked.style,align:(body.paragraphAlign?.[path]?.[source.slice(0,start).split('\n').length-1]||body.objectStyles?.[path]?.align||'left') as ObjectTextStyle['align']},mixed:picked.mixed,preview:null};
  const selected=b.objectInputs[id],first=source.slice(0,start).split('\n').length-1,last=source.slice(0,Math.max(start,end-1)).split('\n').length-1;const aligns=Array.from({length:last-first+1},(_,i)=>body.paragraphAlign?.[path]?.[first+i]||body.objectStyles?.[path]?.align||'left');if(aligns.some(a=>a!==aligns[0]))selected.mixed=[...(selected.mixed||[]),'align'];
  s.workbuddy.entityDrafts[id]??=fileDraft();v.selection={file,paths:[path],text:source.slice(start,end),start,end};
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
 if(c.type==='wb-object-mark'){
  if(o.path!=='text'||p.revision!==o.revision)return '选区已变化';
  const next=structuredClone(a.body),marked=markdownMark(next.text,o.start??0,o.end??0,String(p.mark),String(p.href||''));if(!marked)return '格式或选区无效';
  next.text=marked.text;o.start=marked.start;o.end=marked.end;return editBody(s,v,o.file,next,'对象格式');
 }
 if(c.type==='wb-object-style'){
  if(o.start===o.end)return '请选择文字后调整格式';
  if(p.revision!==o.revision)return '格式参数已变化';
  const style=p.style as ObjectTextStyle;
  if(!style||Object.keys(style).some(k=>!['color','size','align','bold','italic','underline','strike','href'].includes(k))||style.color!==undefined&&!/^#[0-9a-f]{6}$/i.test(style.color)||style.size!==undefined&&(!Number.isFinite(style.size)||style.size<4/3||style.size>800/3)||style.align!==undefined&&!['left','center','right'].includes(style.align))return '格式参数无效';
  if(['bold','italic','underline','strike'].some(k=>(style as any)[k]!==undefined&&typeof (style as any)[k]!=='boolean')||style.href!==undefined&&(typeof style.href!=='string'||style.href.length>2000||style.href&&!/^(https?:\/\/|mailto:)/i.test(style.href)))return '格式或链接无效';
  const next=structuredClone(a.body),full=pathText(next,o.path),start=o.start??0,end=o.end??full.length;
  if(style.align){const first=full.slice(0,start).split('\n').length-1,last=full.slice(0,Math.max(start,end-1)).split('\n').length-1;next.paragraphAlign??={};next.paragraphAlign[o.path]??={};for(let i=first;i<=last;i++)next.paragraphAlign[o.path][i]=style.align;}
  const {align,...runStyle}=style;next.textRuns={...next.textRuns,[o.path]:formatRange(full,next.textRuns?.[o.path],start,end,runStyle)};
  const edit=editBody(s,v,o.file,next,'对象格式');if(edit)return edit;
  o.style={...o.style,...style};o.revision++;o.preview=null;o.base=b.docs[o.file].revision;o.version=working(s,v,o.file).version;return null;
 }
 if(c.type==='wb-object-replace'){
  if(p.revision!==o.revision||typeof p.text!=='string'||p.text.length>20000)return '选区内容已变化';const next=structuredClone(a.body),full=pathText(next,o.path),start=o.start??0,end=o.end??full.length,changed=replaceRange(full,next.textRuns?.[o.path],start,end,p.text);const error=changePath(next,o.path,changed.text);if(error)return error;next.textRuns={...next.textRuns,[o.path]:changed.runs};o.end=start+p.text.length;const edit=editBody(s,v,o.file,next,'对象修改');if(edit)return edit;if(!p.text)s.target=null;return null;
 }
 if(c.type==='wb-object-cancel'){o.preview=null;return null;}
 if(isSubmit){
  if(p.revision!==d.revision)return '修改要求已变化';
  const instruction=String(p.text||'').trim();if(!instruction||instruction.length>5000)return '请输入 5000 字以内的修改要求';
  if(o.pending)return '正在修改所选内容';
  o.pending={id:c.id,target:{view:o.view,file:o.file,path:o.path,start:o.start??0,end:o.end??o.source.length,base:o.base,version:o.version,source:o.source},instruction,targetRevision:target.revision,draftRevision:d.revision};o.error='';return null;
 }
 if(c.type==='wb-object-apply')return '旧修改预览已停用，请重新发送修改要求';
 return '对象操作不存在';
}
