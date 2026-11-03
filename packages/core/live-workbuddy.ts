/** Real-app input data is intentionally independent of the demo WorkBuddy state. */
export type LiveInputKind='color'|'duration'|'document'|'photo'|'sketch';
export interface LiveParameter {id:string;kind:LiveInputKind;start:number;end:number;phrase:string;label:string;role:string;scope:string;value:string;manual:boolean;}
export interface LiveMaterial {id:string;name:string;size:number;sha256:string;kind:'document'|'photo'|'sketch';preview?:string;scope?:string;}
export const liveColors:Record<string,string>={'红色':'#C92A2A','深红':'#962D34','蓝色':'#356FE4','黑色':'#182431','白色':'#FFFFFF','灰色':'#D9DEDF','绿色':'#238359','黄色':'#E9BF38','橙色':'#DC762F','紫色':'#8053B7'};
function minutes(value:string):number {if(/^\d+$/.test(value))return Number(value);const digits:Record<string,number>={'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'零':0};let total=0,current=0;for(const c of value){if(c==='百'||c==='十'){total+=(current||1)*(c==='百'?100:10);current=0;}else if(c in digits)current=digits[c];else return 0;}return total+current;}
/** Fixed happy-path grammar. No network/model calls; source spans are authoritative. */
export function extractLiveParameters(text:string):LiveParameter[]{
 const items:LiveParameter[]=[];let scope='全文';let scopeStart=0;
 for(const match of text.matchAll(/[^。；;\n]+/g)){
  const sentence=match[0],origin=match.index!;const page=sentence.match(/(?:第[一二三四五六七八九十\d]+页|[\u4e00-\u9fff]{2,10}页)/);
  if(page){scope=page[0];scopeStart=origin;}else if(origin>scopeStart&&/[。；;\n]/.test(text[origin-1]||''))scope='全文';
  const add=(kind:LiveInputKind,m:RegExpMatchArray,phrase:string,role:string,value=phrase,label=phrase)=>{const start=origin+m.index!+m[0].lastIndexOf(phrase);items.push({id:`${kind}:${scope}:${role}:${items.filter(i=>i.kind===kind&&i.scope===scope&&i.role===role).length}`,kind,start,end:start+phrase.length,phrase,label,role,scope,value,manual:false});};
  for(const m of sentence.matchAll(/(背景|主题色|主色|字体|文字|标题|强调色)(?:颜色|色)?\s*(?:用|设为|设置为|改成|改为|是|为|采用|：|:)?\s*(#[0-9a-fA-F]{6}|深红|红色|蓝色|黑色|白色|灰色|绿色|黄色|橙色|紫色|高级灰)/g)){
   const before=sentence.slice(Math.max(0,m.index!-6),m.index!);if(/(?:不要|不用|别|取消)[^，,]*$/.test(before))continue;
   const phrase=m[2];add('color',m,phrase,m[1],liveColors[phrase]||(/^#/.test(phrase)?phrase.toUpperCase():''));
  }
  for(const pattern of [/(?:讲|演讲|汇报|时长|控制在|大约|约)\s*(\d{1,3}|[零一二两三四五六七八九十百]{1,5})\s*分钟/g,/(\d{1,3}|[零一二两三四五六七八九十百]{1,5})\s*分钟(?:的)?(?:演讲|演示|汇报|发言|讲话)/g])for(const m of sentence.matchAll(pattern)){if(/(?:不要|取消|别)[^，,]*$/.test(sentence.slice(0,m.index)))continue;const n=minutes(m[1]);if(n>0&&n<=60)add('duration',m,m[1],'演讲时长',String(n),String(n));}
  for(const m of sentence.matchAll(/(?:参考|依据|用|附上|添加|上传|选择)(?:这份|我的|一下|一份)?\s*([^，。；\n]{0,20}?(?:资料|文档|文件|\.pdf|\.docx))/g)){if(/(?:不要|不用|别|不)[^，,]*$/.test(sentence.slice(0,m.index)))continue;add('document',m,m[1],'参考资料','');}
  for(const m of sentence.matchAll(/(?:放入|放|加入|添加|拍|上传|提供|用)(?:一些|几张|一下|入|张|一张|两张|[一二三四五六七八九十\d]+张)?\s*((?:实拍|产品|参考)?照片)/g)){if(/(?:不要|不用|别|不)[^，,]*$/.test(sentence.slice(0,m.index)))continue;add('photo',m,m[1],'实拍照片','');}
  for(const m of sentence.matchAll(/(?:布局|排版|结构)[^，。；\n]{0,12}?((?:我来|我)?画(?:一下|个|一张|出来)?)/g)){if(/(?:不要|不用|你来|你帮我|你帮忙)[^，,]*$/.test(sentence.slice(0,m.index!+m[0].indexOf(m[1]))))continue;add('sketch',m,m[1],'布局草图','');}
  for(const m of sentence.matchAll(/(?:我来画|添加)([^，。；\n]{0,12}?(?:布局草图|布局))/g)){if(!items.some(p=>p.kind==='sketch'&&p.scope===scope))add('sketch',m,m[1],'布局草图','');}
  for(const m of sentence.matchAll(/(?:调整|设置)(背景颜色|主色|文字颜色|演示时长)/g)){const kind=m[1]==='演示时长'?'duration':'color';if(!items.some(p=>p.kind===kind&&p.start>=origin))add(kind,m,m[1],m[1],'');}
  for(const m of sentence.matchAll(/(?:参考|根据)(?:这个)?(链接)/g)){if(!/(?:不要|不|不用)[^，,]*$/.test(sentence.slice(0,m.index)))add('document',m,m[1],'参考链接','');}
 }
 // Correcting the same parameter in the same scope uses the last explicit value.
 const last=new Map<string,LiveParameter>();for(const p of items)last.set(`${p.kind}/${p.scope}/${p.role}`,p);
 return [...last.values()].sort((a,b)=>a.start-b.start).map(p=>({...p,id:`${p.kind}:${p.scope}:${p.role}`}));
}
export function resolveLiveParameters(text:string,previous:LiveParameter[]=[]):LiveParameter[]{
 return extractLiveParameters(text).map(p=>{const old=previous.find(x=>x.id===p.id);return old?.manual&&old.phrase===p.phrase?{...p,value:old.value,label:old.label,manual:true}:p;});
}
/** The editor stays rich locally; adapters only receive this target-compatible projection. */
export interface TargetMaterial {id:string;name:string;kind:'document'|'photo'|'sketch';scope?:string;}
export interface TargetInputCapabilities {text:boolean;attachments:readonly TargetMaterial['kind'][];}
export const workBuddyInputCapabilities:TargetInputCapabilities={text:true,attachments:['document','photo','sketch']};
export interface TargetInputProjection<M extends TargetMaterial> {
 text:string;attachments:M[];unavailable:{id:string;reason:string}[];
 spans:{id:string;sourceStart:number;sourceEnd:number;targetStart:number;targetEnd:number}[];
}
export function projectTargetInput<M extends TargetMaterial>(text:string,parameters:LiveParameter[],materials:M[],capabilities:TargetInputCapabilities):TargetInputProjection<M>{
 const resolved=resolveLiveParameters(text,parameters),spans:TargetInputProjection<M>['spans']=[];
 let output='',cursor=0;
 for(const p of resolved){
  if(p.start<cursor)continue;
  let value=p.phrase;
  if(p.kind==='color'&&/^#[0-9a-f]{6}$/i.test(p.value))value=p.value.toUpperCase();
  if(p.kind==='duration'&&/^\d+$/.test(p.value)&&+p.value>=1&&+p.value<=60)value=String(+p.value);
  // Empty tool invitations need their role and unit retained when assigned a value.
  if(value!==p.phrase&&p.phrase===p.role)value=p.role+'为'+value+(p.kind==='duration'?' 分钟':'');
  output+=text.slice(cursor,p.start);const start=output.length;output+=value;
  spans.push({id:p.id,sourceStart:p.start,sourceEnd:p.end,targetStart:start,targetEnd:output.length});cursor=p.end;
 }
 output+=text.slice(cursor);
 const attachments=materials.filter(m=>capabilities.attachments.includes(m.kind));
 const unavailable=materials.filter(m=>!capabilities.attachments.includes(m.kind)).map(m=>({id:m.id,reason:`当前应用不支持${m.kind==='document'?'文件':'图片'}附件：${m.name}`}));
 if(!capabilities.text)unavailable.unshift({id:'text',reason:'当前目标不支持文字输入'});
 // Purpose is ordinary text, never an attachment receipt. Include it before Send as well.
 for(const m of attachments.filter(m=>m.kind==='sketch')){
  const purpose=`布局参考图片「${m.name}」：${m.scope&&m.scope!=='全文'&&m.scope!=='未指定'?'按此图安排'+m.scope+'布局':'按此图安排布局'}`;
  if(!output.includes(purpose))output+='\n'+purpose;
 }
 return {text:output,attachments,unavailable,spans};
}
export function livePrompt(text:string,parameters:LiveParameter[],materials:LiveMaterial[]):string{
 return projectTargetInput(text,parameters,materials,workBuddyInputCapabilities).text;
}
/** Echoes preserve assisted source; genuine remote edits discard stale parameter overrides. */
export function reconcileTargetInput(text:string,parameters:LiveParameter[],remote:string,projected:string){
 return remote===projected?{text,parameters}: {text:remote,parameters:resolveLiveParameters(remote)};
}
export const isPresentationRequest=(text:string)=>text.split(/[。；;，,\n]/).some(clause=>/(?:PPT|幻灯片|网页演示|演示文稿)/i.test(clause)&&!/(?:不要|不做|取消|别做)/.test(clause));
