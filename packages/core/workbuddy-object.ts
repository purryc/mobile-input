import {selectionStyle,formatRange,replaceRange} from './text-runs';
import type {Command,State,ObjectTextStyle} from './model';
import {browserState,findFileView,fileBody,fileConflict,fileReadOnly,fileDraft,pathText,working,changePath,editBody,saveBrowserFile} from './workbuddy-files';
export interface ObjectInput {
 start?:number;end?:number;mixed?:string[];revision:number;view:string;file:string;path:string;source:string;base:number;version:number;style:ObjectTextStyle;
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
  const start=p.start===undefined?0:Number(p.start),end=p.end===undefined?source.length:Number(p.end);if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>source.length||end<start||end===start&&source.length>0||[start,end].some(i=>i>0&&i<source.length&&/[\uD800-\uDBFF]/.test(source[i-1])&&/[\uDC00-\uDFFF]/.test(source[i])))return '文字选区无效';
  const rebound=!old||old.base!==b.docs[file].revision||old.version!==a.version||old.start!==start||old.end!==end;const picked=selectionStyle(source,body.textRuns?.[path],start,end,{color:'#122D39',size:path.endsWith('/title')?36:24,...body.objectStyles?.[path]});
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
  const text=String(p.text||'').trim();if(!text||text.length>20000)return '请输入修改要求';
  if(/(?:不要|别|不用).*(?:改为|改成|替换|换成)/.test(text))return '修改要求包含否定，请明确要保留或替换的内容';
  const match=text.match(/(?:改为|改成|替换为|换成)[\s:：]*[“「『"']([^”」』"']+)[”」』"']/)||text.match(/(?:改为|改成|替换为|换成)[\s:：]*([^，。；\n]+)/);
  let after=match?.[1]?.trim();
  if(!after&&/^(?:直接替换[:：])/.test(text))after=text.replace(/^直接替换[:：]\s*/,'');
  if(!after&&/^(?:应用格式|仅调整格式|只调整格式)[。！]?$/.test(text))after=o.source;
  if(!after)return '请写明“改为……”或使用“直接替换：新内容”';
  const next=structuredClone(a.body),full=pathText(next,o.path),start=o.start??0,end=o.end??full.length,changed=replaceRange(full,next.textRuns?.[o.path],start,end,after);const error=changePath(next,o.path,changed.text);next.textRuns={...next.textRuns,[o.path]:changed.runs};o.end=start+after.length;if(error)return error;
  const edit=editBody(s,v,o.file,next,'对象修改');if(edit)return edit;
  o.preview=null;o.base=b.docs[o.file].revision;o.version=working(s,v,o.file).version;o.source=after;
  d.text='';d.revision++;target.value='';return null;
 }
 if(c.type==='wb-object-apply')return '旧修改预览已停用，请重新发送修改要求';
 return '对象操作不存在';
}
