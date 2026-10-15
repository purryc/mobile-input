import type {Command,State,Slide} from './model';
import {workBuddyIntents,colorValue,intentColors} from './workbuddy-intents';
import type {WbDraft} from './workbuddy';

export interface InputColor {word:string;hex:string;source:'system_default'|'user_edit';original:string}
export interface InputSketch {strokes:number[][][];confirmed:boolean;interpretation:{left:string;right:string}|null}
export interface WorkBuddyInput {revision:number;color:InputColor|null;dismissedColor?:InputColor;excludedColors:string[];layout:boolean;sketch:InputSketch;mode:'keyboard'|'trackpad'|null;}
export const initialWbInput=():WorkBuddyInput=>({revision:0,color:null,excludedColors:[],layout:false,sketch:{strokes:[],confirmed:false,interpretation:null},mode:null});
export const wbInput=(d:WbDraft)=>d.input??(d.input=initialWbInput());
/** Deterministic demo grammar; does not pretend to understand arbitrary language. */
export function inferWbInput(d:WbDraft,text:string){const input=wbInput(d);const negated=[...text.matchAll(new RegExp('(?:不要|不用|别用|排除)\\s*('+Object.keys(intentColors).join('|')+')','g'))].map(x=>x[1]);input.excludedColors=[...new Set(negated)];
 const intent=workBuddyIntents(text,{task:'',target:'',targetRevision:0,inputRevision:0}).find(x=>x.kind==='color');
 const color=intent?colorValue(intent.phrase):null,word=color?.word;
 if(!word||negated.includes(word))input.color=null;
 else if(word!==input.dismissedColor?.word&&input.color?.source!=='user_edit')input.color={word,hex:color!.hex,source:'system_default',original:word};
 input.layout=/(?:左侧|左边).+(?:右侧|右边)/.test(text)&&!/(?:不要|不用).*(?:左右布局|左右分栏)/.test(text);
 if(input.layout)input.sketch.interpretation={left:text.match(/(?:左侧|左边)\s*([^，。；\n]+)/)?.[1]||'待补充',right:text.match(/(?:右侧|右边)\s*([^，。；\n]+)/)?.[1]||'待补充'};
 return input;
}
export const stripLegacyColorAnnotation=(text:string)=>text.replace(/[ \t]*\[主色 #[0-9a-f]{6}\]/ig,'');
export function wbAdaptiveInteraction(s:State,c:Command):string|null|undefined {
 if(c.type==='wb-input-task'){
  if(s.app!=='workbuddy')return 'WorkBuddy 已退出';
  const v=(c.value||{}) as Record<string,unknown>,w=s.workbuddy;
  let task=w.tasks.find(t=>t.id===v.id);
  if(v.action==='new'){
    const id=c.id;
    task={id,title:String(v.title||'新建任务'),messages:[],status:'draft',kind:null,mode:'agent',model:w.settings.model,expert:'',project:'chengxing',favorite:false,step:0,epoch:id,startedAt:0,elapsed:0,files:[],dataVersion:s.reportRevision};
    w.tasks.unshift(task);w.drafts[id]={text:'',revision:0,session:'',sequence:0,attachments:[],references:[],input:initialWbInput()};
  }
  if(!task&&v.id!=='new')return '任务不存在';
  const id=task?.id||'new',d=w.drafts[id];if(!d)return '草稿不存在';
  w.task=id;w.page=task?'task':'home';w.preview=[];w.previewActive=null;w.filePanel=false;
  s.target={id:`wb:draft:${id}`,app:'workbuddy',kind:'text',label:task?.title||'新建任务',value:d.text,revision:s.revision+1};return null;
 }
 if(c.type!=='wb-input')return undefined;
 const v=(c.value||{}) as Record<string,unknown>,t=s.target,w=s.workbuddy;
 if(s.app!=='workbuddy'||!t||!t.id.startsWith('wb:draft:')||c.targetId!==t.id||c.targetRevision!==t.revision)return '任务输入目标已变化';
 const id=t.id.slice('wb:draft:'.length),d=w.drafts[id];if(!d||w.task!==id)return '任务已切换';
 const input=wbInput(d);if(v.action!=='infer'&&v.revision!==input.revision)return '输入参数已变化，请同步后重试';
 switch(v.action){
  case 'infer':{
    if(v.draftRevision!==d.revision)return '意图结果已过期';inferWbInput(d,d.text);
    const next=stripLegacyColorAnnotation(d.text);
    if(next!==d.text){d.text=next;d.revision++;t.value=next;}break;
  }
  case 'color':{const hex=String(v.hex||'').toUpperCase();if(!/^#[0-9A-F]{6}$/.test(hex))return '请输入六位 HEX 色值';delete input.dismissedColor;input.color={word:input.color?.word||'自定义',original:input.color?.original||'',hex,source:'user_edit'};break;}
  case 'color-undo':if(input.color)input.dismissedColor={...input.color};input.color=null;break;
  case 'mode':if(![null,'keyboard','trackpad'].includes(v.mode as null|'keyboard'|'trackpad'))return '输入模式无效';input.mode=v.mode as WorkBuddyInput['mode'];break;
  case 'sketch':{const strokes=v.strokes as number[][][];if(!Array.isArray(strokes)||strokes.length>100||strokes.some(stroke=>!Array.isArray(stroke)||stroke.length>2000||stroke.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)||n<0||n>1))))return '草图笔迹无效';input.sketch.strokes=structuredClone(strokes);input.sketch.confirmed=false;break;}
  case 'sketch-confirm':if(!input.sketch.strokes.some(x=>x.length>1))return '请先绘制草图';input.sketch.confirmed=true;break;
  case 'sketch-remove':input.sketch={strokes:[],confirmed:false,interpretation:null};break;
  case 'sketch-edit':input.sketch.confirmed=false;input.layout=true;break;
  default:return '输入操作不存在';
 }
 input.revision++;return null;
}
export function roadmapSlides(input:WorkBuddyInput):Slide[]{const hex=input.color?.hex||'#E03131',layout=input.sketch.confirmed?input.sketch.interpretation:null;
 return ['公司 Roadmap','第一季度 · 需求与验证','第二季度 · 核心体验','第三季度 · 试点上线','第四季度 · 持续迭代','下一步行动'].map((title,i)=>({title,body:layout?`${layout.left}\n${['明确目标与负责人','完成需求验证','交付核心流程','完成客户试点','复盘使用数据','确认排期与风险'][i]}\n\n${layout.right}\n${['以用户目标驱动产品节奏','可验证的需求清单','可演示的产品原型','可追踪的试点反馈','持续改善的使用体验','共同确认交付标准'][i]}`:['明确目标与里程碑','把需求变成可验证的成果','按季度复盘并调整计划'].join('\n'),notes:`这一页介绍${title}。我们先对齐这一阶段要解决的问题，再核对负责人、交付物和验证方式。当前内容是可编辑的演示计划，具体日期与指标等待团队补充。`,themeColor:hex,layout:layout?'two-column':undefined}));
}
