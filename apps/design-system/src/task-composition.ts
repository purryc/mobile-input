import {resolveLiveParameters,type LiveParameter} from '../../../packages/core/live-workbuddy';
import {contextualPolishActions} from '../../../packages/core/polish-actions';
import bindings from '../content/component-bindings.json';
import {catalogId,validateMessages,catalogValueIssue,type CatalogName} from './catalog-api';

export const taskSamples=[
  ['产品演示','Product presentation','请介绍今年的重点产品，面向新客户讲解使用场景。演讲10分钟，主题色用蓝色，添加产品图片，布局我来画一下。'],
  ['生成图片','Generate an image','生成一张产品图片'],
  ['缺少参数','Missing values','调整背景颜色，调整演示时长，参考这份资料'],
  ['否定与改口','Negation and correction','不要添加图片，背景用红色，背景改成蓝色']
];

// These are fictional host fixtures, never declarations supplied by a model.
export const hostProfiles={
  agent:{text:true,attachments:['photo','sketch'] as readonly string[]},
  'text-only':{text:true,attachments:[] as readonly string[]},
  unavailable:{text:false,attachments:[] as readonly string[]}
};
export type HostProfile=keyof typeof hostProfiles;
export interface TaskContext {owner:string;revision:number;capabilityVersion:number;profile:HostProfile}
export interface Candidate {id:string;component:CatalogName|null;parameter?:LiveParameter;actions?:string[];available:boolean;reason:'ready'|'no-target'|'missing-value'|'unsupported-material'|'not-in-catalog'|'unsupported-role'|'invalid-value'}
export interface TaskPlan {template:'agent-input-preview-v1';context:TaskContext;text:string;candidates:Candidate[]}
const componentFor:Record<LiveParameter['kind'],CatalogName|null>={color:'ColorInput',duration:'DurationInput',photo:'ImageInput',sketch:'SketchInput',document:null};

// Adapter from shared semantic roles to this Catalog's smaller role vocabulary.
const colorRoles:Record<string,'primary'|'background'|'text'>={主题色:'primary',主色:'primary',背景:'background',背景颜色:'background',字体:'text',文字颜色:'text',标题:'text'};
export function componentLabel(component:CatalogName|null):[string,string]{
  const binding=Object.values(bindings).find(b=>b.export===component);
  return binding?[binding.zh,binding.en]:['参考文件','Reference file'];
}
export class TaskPlanError extends Error {constructor(readonly code:'stale'|'unavailable'|'context'|'length'){super(code);}}

function validContext(context:TaskContext){
  if(!context.owner||!Number.isSafeInteger(context.revision)||context.revision<0||!Number.isSafeInteger(context.capabilityVersion)||context.capabilityVersion<0||!Object.hasOwn(hostProfiles,context.profile))throw new TaskPlanError('context');
}
export function selectTaskComponents(text:string,context:TaskContext,previous:LiveParameter[]=[]):TaskPlan{
  validContext(context);
  if(text.length>4000)throw new TaskPlanError('length');
  const host=hostProfiles[context.profile];
  const candidates:Candidate[]=resolveLiveParameters(text,previous).map(parameter=>{
    const component=componentFor[parameter.kind];
    const reason:Candidate['reason']=!host.text?'no-target':!component?'not-in-catalog':
      ['photo','sketch'].includes(parameter.kind)&&!host.attachments.includes(parameter.kind)?'unsupported-material':
      parameter.kind==='color'&&!Object.hasOwn(colorRoles,parameter.role)?'unsupported-role':catalogValueIssue(component,parameter.value)||'ready';
    return {id:parameter.id,component,parameter,available:reason==='ready',reason};
  });
  const actions=contextualPolishActions(host.text?{app:'workbuddy',id:'demo:task',kind:'text'}:null,text).map(a=>a.id);
  if(actions.length)candidates.push({id:'polish',component:'ContextualPolishActions',actions,available:true,reason:'ready'});
  return {template:'agent-input-preview-v1',context:{...context},text,candidates};
}

// Recompute from trusted inputs before compiling; a copied/edited plan grants no authority.
// The caller must supply the CURRENT context. Production must obtain it from its host.
export function compileTaskPreview(plan:TaskPlan,current:TaskContext,currentText:string,selectedId:string,currentParameters:LiveParameter[]=[]){
  validContext(current);
  if(plan.template!=='agent-input-preview-v1'||plan.text!==currentText||(['owner','revision','capabilityVersion','profile'] as const).some(k=>plan.context[k]!==current[k]))throw new TaskPlanError('stale');
  const fresh=selectTaskComponents(currentText,current,currentParameters);
  const selected=fresh.candidates.find(c=>c.id===selectedId);
  if(!selected?.available||!selected.component)throw new TaskPlanError('unavailable');
  const widget:Record<string,unknown>={id:'active-widget',component:selected.component};
  const value=selected.parameter?.value;
  if(selected.component==='ColorInput')Object.assign(widget,{value:{path:'/value'},role:colorRoles[selected.parameter!.role]});
  if(selected.component==='DurationInput')widget.value={path:'/value'};
  if(selected.component==='ImageInput')widget.contextId='demo-image';
  if(selected.component==='SketchInput')widget.contextId='demo-sketch';
  if(selected.component==='ContextualPolishActions')widget.contextId='demo-editor';
  const name=componentLabel(selected.component).join(' / ');
  const heading=selected.parameter?`${name} · ${selected.parameter.kind==='photo'?'图片':selected.parameter.role} · ${selected.parameter.scope}`:name;
  const messages=[
    {version:'v0.9.1',createSurface:{surfaceId:'preview',catalogId}},
    {version:'v0.9.1',updateDataModel:{surfaceId:'preview',path:'/',value:{title:heading,...(value?{value}:{})}}},
    {version:'v0.9.1',updateComponents:{surfaceId:'preview',components:[
      {id:'root',component:'Column',children:['heading','active-widget']},
      {id:'heading',component:'Text',text:{path:'/title'}},widget
    ]}}
  ];
  validateMessages(messages);
  return messages;
}
