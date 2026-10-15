/** Local demo intent rules. A suggestion never opens a tool or executes a task. */
export type AuxiliaryKind='color'|'sketch'|'camera'|'document';
export interface AuxiliaryIntent {kind:AuxiliaryKind;phrase:string;start:number;end:number;label:string;app:'workbuddy';task:string;target:string;targetRevision:number;inputRevision:number;}
export interface IntentBinding {task:string;target:string;targetRevision:number;inputRevision:number;}
export const intentColors:Record<string,string>={
 '深红色':'#A51127','浅红色':'#FFA8A8','深蓝色':'#1864AB','浅蓝色':'#A5D8FF','深绿色':'#2B8A3E','浅绿色':'#B2F2BB',
 '深紫色':'#5F3DC4','浅紫色':'#D0BFFF','深灰色':'#495057','浅灰色':'#DEE2E6','粉红色':'#F783AC',
 '红色':'#E03131','蓝色':'#1971C2','绿色':'#2F9E44','紫色':'#7048E8','橙色':'#F76707','黄色':'#F08C00','黑色':'#212529','白色':'#FFFFFF','灰色':'#868E96','粉色':'#F783AC',
};
const colorPattern=Object.keys(intentColors).join('|')+'|#[0-9a-fA-F]{6}(?![0-9a-fA-F])';
export function colorValue(phrase:string){const word=phrase.match(new RegExp(colorPattern))?.[0];return word?{word,hex:intentColors[word]||word.toUpperCase()}:null;}
export function workBuddyIntents(text:string,binding:IntentBinding):AuxiliaryIntent[]{
 const result:AuxiliaryIntent[]=[];
 const add=(kind:AuxiliaryKind,pattern:RegExp,label:string,last=false)=>{
  for(const match of text.matchAll(pattern)){
   const start=match.index!,prefix=text.slice(Math.max(0,start-20),start).split(/[，。；\n]/).at(-1)||'';
   const suffix=text.slice(start+match[0].length).split(/[，。；\n]/)[0];
   if(/(?:不要|不用|不想|无需|别|取消|不需要|先不).{0,12}$/.test(prefix)||/^(?:.{0,8})(?:已经取消|不需要|不用了|不要了)/.test(suffix))continue;
   const item={...binding,app:'workbuddy' as const,kind,phrase:match[0],start,end:start+match[0].length,label};
   const previous=result.findIndex(x=>x.kind===kind);if(previous>=0)result[previous]=item;else result.push(item);if(!last)break;
  }
 };
 add('color',new RegExp('(?:(?:主色(?:调)?|主题色?|背景(?:色)?|颜色)\\s*(?:用|为|改为|换成|是|选|设置成)?\\s*)?(?:'+colorPattern+')','g'),'调整颜色',true);
 add('sketch',/(?:画(?:个|一[个张只]|只|张|一下)?(?:页面|大概的?)?(?:布局|草图|图案|小猫|猫咪)|(?:页面)?布局(?:我来?|让我|可以)?画(?:个|一下)?|手绘(?:一个|一张)?(?:草图|布局)?|(?:左侧|左边)[^。\n]+(?:右侧|右边)[^。\n]*)/g,'画个布局');
 const sketch=result.find(x=>x.kind==='sketch');if(sketch&&!/左侧|左边|布局/.test(sketch.phrase))sketch.label=sketch.phrase;
 add('camera',/(?:拍(?:一张)?照(?:片)?(?:补充)?|拍张照片|用相机|打开相机)/g,'拍照补充');
 add('document',/(?:添加|附上|上传|选择|引用)(?:一份|这个|这份)?(?:文档|文件|资料)/g,'添加文档');
 return result;
}
