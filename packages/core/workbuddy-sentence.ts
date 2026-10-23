import {workBuddyIntents,colorValue,type AuxiliaryIntent,type IntentBinding} from './workbuddy-intents';
export type SentenceKind=AuxiliaryIntent['kind']|'screenshot'|'recording'|'path'|'scope'|'format'|'template'|'size'|'count';
export type ValueKind='scope'|'format'|'template'|'size'|'count';
export interface SentenceParameter extends Omit<AuxiliaryIntent,'kind'> {kind:SentenceKind;value:string; suggested:boolean;}
export const valueLabels:Record<ValueKind,string>={scope:'选择范围',format:'选择格式',template:'选择模板',size:'设置尺寸',count:'设置数量'};
/** Source offsets refer to plain task text, never to the display label or generated markup. */
export function sentenceParameters(text:string,binding:IntentBinding):SentenceParameter[]{
 const result:SentenceParameter[]=workBuddyIntents(text,binding).map(x=>({...x,value:'',suggested:x.kind!=='color'}));
 for(const x of result){
  if(x.kind==='color'){const c=colorValue(x.phrase)!;x.start+=x.phrase.indexOf(c.word);x.phrase=c.word;x.end=x.start+c.word.length;x.value=c.word;x.label=c.word;}
  if(x.kind==='sketch'){
   // Left/right prose remains ordinary editable context. Insert the empty canvas at its beginning.
   if(/^(?:左侧|左边)/.test(x.phrase)){x.end=x.start;x.phrase='';}else if(x.phrase.startsWith('布局')){x.start+=2;x.phrase=x.phrase.slice(2);}
   x.label='画一下';
  }
  if(x.kind==='camera')x.label='添加照片';
  if(x.kind==='document')x.label='选择文件';
 }
 const add=(kind:SentenceKind,pattern:RegExp,label:string,value?:(s:string)=>string)=>{
  for(const m of text.matchAll(pattern)){
   const start=m.index!,end=start+m[0].length,prefix=text.slice(Math.max(0,start-20),start).split(/[，。；\n]/).at(-1)||'',suffix=text.slice(end).split(/[，。；\n]/)[0];
   if(/(?:不要|不用|不想|无需|别|取消|不需要|先不).{0,12}$/.test(prefix)||/^.{0,8}(?:已经取消|不需要|不用了|不要了)/.test(suffix))continue;
   if(kind==='count'&&m[0]!=='设置数量'&&!/(?:^|[，。；\n])\s*$|(?:数量(?:为|是|用|[:：])?|生成|制作|设计|需要|做|要|请)\s*$/.test(text.slice(Math.max(0,start-12),start)))continue;
   if(kind==='size'&&/[:：]/.test(m[0])&&!/^(?:16:9|9:16|4:3|3:4|1:1)$/.test(m[0].replace(/\s/g,'').replace('：',':'))&&!/(?:尺寸|比例|画幅|宽高比)(?:为|是|用|[:：])?\s*$/.test(prefix))continue;
   if(kind==='path')for(let i=result.length-1;i>=0;i--)if(start<result[i].end&&end>result[i].start)result.splice(i,1);
   if(result.some(x=>x.kind===kind||start<x.end&&end>x.start))continue;
   const v=value?.(m[0])||'';result.push({...binding,app:'workbuddy',kind,phrase:m[0],start,end,label:v||label,value:v,suggested:!v});
  }
 };
 add('camera',/(?:添加|附上|上传|参考|选择)(?:一张|这张)?(?:照片|图片)/g,'添加照片');
 add('screenshot',/(?:截个图|截屏|截图)/g,'截图');
 add('recording',/(?:录屏|录制屏幕)/g,'录屏');
 add('path',/(?:[A-Za-z]:[\\/]|\/|\.\/)[^\s，。；？！<>"“”]+\.[a-zA-Z0-9]{1,8}/g,'选择文件',s=>s.split(/[\\/]/).at(-1)||s);
 add('scope',/(?:第\s*\d+\s*[-–至到]\s*\d+\s*页|第\s*\d+\s*页|全文|全部|选择范围)/g,'选择范围',s=>s==='选择范围'?'':s.replace(/\s/g,''));
 add('format',/(?:\bPPTX?\b|\bPDF\b|\bDOCX\b|\bXLSX\b|\bMarkdown\b|选择格式)/gi,'选择格式',s=>s==='选择格式'?'':s.toUpperCase());
 add('template',/(?:周报模板|月报模板|销售汇报模板|选择模板)/g,'选择模板',s=>s==='选择模板'?'':s);
 add('size',/(?:\b\d{1,4}\s*[:：×x]\s*\d{1,4}\b|设置尺寸)/g,'设置尺寸',s=>s==='设置尺寸'?'':s.replace(/\s/g,'').replace('：',':'));
 add('count',/(?:\d{1,3}\s*(?:个|份|张)(?!设备|产品)|设置数量)/g,'设置数量',s=>s==='设置数量'?'':s.replace(/\s/g,''));
 return result.sort((a,b)=>a.start-b.start||a.end-b.end);
}
export function validateSentenceValue(kind:string,value:string):boolean{
 if(!value.trim()||value.length>60)return false;
 if(kind==='scope')return /^(?:全文|全部|第\d+(?:[-–至到]\d+)?页)$/.test(value);
 if(kind==='format')return ['PPT','PPTX','PDF','DOCX','XLSX','MARKDOWN'].includes(value);
 if(kind==='template')return ['周报模板','月报模板','销售汇报模板'].includes(value);
 if(kind==='size')return /^\d{1,4}[:×x]\d{1,4}$/.test(value)&&value.split(/[:×x]/).every(x=>Number(x)>0);
 if(kind==='count')return /^\d{1,3}(?:个|份|张)$/.test(value)&&Number.parseInt(value)>0;
 return false;
}
