/** Local demo intent rules. A suggestion never opens a tool or executes a task. */
export type AuxiliaryKind='color'|'sketch'|'camera'|'document';
export interface AuxiliaryIntent {kind:AuxiliaryKind;phrase:string;start:number;end:number;label:string;app:'workbuddy';task:string;target:string;targetRevision:number;inputRevision:number;}
export interface IntentBinding {task:string;target:string;targetRevision:number;inputRevision:number;}
export function workBuddyIntents(text:string,binding:IntentBinding):AuxiliaryIntent[]{
 const result:AuxiliaryIntent[]=[];
 const add=(kind:AuxiliaryKind,pattern:RegExp,label:string)=>{
  for(const match of text.matchAll(pattern)){
   const start=match.index!,prefix=text.slice(Math.max(0,start-12),start).split(/[，。；\n]/).at(-1)||'';
   if(/(?:不要|不用|不想|无需|别|取消|不需要|先不).{0,5}$/.test(prefix))continue;
   result.push({...binding,app:'workbuddy',kind,phrase:match[0],start,end:start+match[0].length,label});break;
  }
 };
 add('color',/(?:主色(?:调)?|主题色|背景(?:色)?|颜色)\s*(?:用|为|改为|换成|是|选|设置成)?\s*(?:红色|蓝色|绿色|紫色|橙色|黄色|黑色|白色)/g,'调整颜色');
 add('sketch',/(?:画(?:个|一[个张只]|只|张|一下)?(?:布局|草图|图案|小猫|猫咪)|手绘(?:草图|布局)?|(?:左侧|左边)[^。\n]+(?:右侧|右边)[^。\n]*)/g,'画个布局');
 const sketch=result.find(x=>x.kind==='sketch');if(sketch&&!/左侧|左边|布局/.test(sketch.phrase))sketch.label=sketch.phrase;
 add('camera',/(?:拍(?:一张)?照(?:片)?(?:补充)?|拍张照片|用相机|打开相机)/g,'拍照补充');
 add('document',/(?:添加|附上|上传|选择|引用)(?:一份|这个|这份)?(?:文档|文件|资料)/g,'添加文档');
 return result;
}
