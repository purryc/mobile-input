import {contextualPolishActions,type PolishTarget} from '../../../packages/core/polish-actions';
import {protectPolishParameters,validatePolishParameters} from '../../../packages/core/polish-parameters';
export const promptSample='请介绍今年的重点产品，面向新客户讲解使用场景。背景用灰色，字体用黑色。';
export const samples={prompt:promptSample,message:'您好，烦请您明天下午把已经确认的会议资料发给我，谢谢。',mail:'请将已确认的客户报价单发给我，我们需要在明天下午开会前完成核对。',title:'今年重点产品的使用场景介绍',speech:'今天我们介绍今年的重点产品，然后讲解它们的使用场景。',notes:'今天讨论了产品的使用场景，下周继续核对客户需求。',short:'做个产品介绍',parameters:'背景用灰色，字体用黑色，主题色用红色'};
export const targets:Record<string,PolishTarget>={prompt:{app:'workbuddy',id:'demo:prompt',kind:'text'},message:{app:'wechat',id:'demo:reply',kind:'text'},mail:{app:'mail',id:'demo:body',kind:'text'},title:{app:'slides',id:'demo:title',kind:'text'},speech:{app:'slides',id:'demo:notes',kind:'text'},notes:{app:'notes',id:'demo:note',kind:'text'},short:{app:'workbuddy',id:'demo:short',kind:'text'},parameters:{app:'workbuddy',id:'demo:parameters',kind:'text'}};
export type Outcome='success'|'failure'|'unchanged'|'stale'|'protected';
export interface DemoEvent {name:string;contextId:string;actionId?:string;status?:string;attachmentId?:string}
export interface Snapshot {text:string;selection:[number,number];target:PolishTarget;revision:number;status:string;active:string;failed:string;history:string[];future:string[];materials:string[];events:DemoEvent[]}
export class DemoEditor {
 private listeners=new Set<()=>void>(); private serial=0; private disposed=false;
 state:Snapshot;
 constructor(readonly id='demo-editor',sample:keyof typeof samples='prompt'){this.state={text:samples[sample],selection:[0,0],target:targets[sample],revision:0,status:'ready',active:'',failed:'',history:[],future:[],materials:['fixture-reference'],events:[]};}
 subscribe=(f:()=>void)=>{this.listeners.add(f);return()=>{this.listeners.delete(f);};};
 snapshot=()=>this.state;
 private patch(p:Partial<Snapshot>){this.state={...this.state,...p};this.listeners.forEach(f=>f());}
 event(e:Omit<DemoEvent,'contextId'>){this.patch({events:[...this.state.events,{...e,contextId:this.id}].slice(-40)});}
 selected(){const [a,b]=this.state.selection;return a===b?this.state.text:this.state.text.slice(a,b);}
 actions(){return contextualPolishActions(this.state.target,this.selected());}
 select(a:number,b:number){const n=this.state.text.length;this.patch({selection:[Math.max(0,Math.min(n,a)),Math.max(0,Math.min(n,b))]});}
 change(text:string,history=true){this.patch({text,revision:this.state.revision+1,status:'ready',failed:'',history:history?[...this.state.history,this.state.text]:this.state.history,future:[]});}
 sample(sample:keyof typeof samples){this.serial++;this.patch({text:samples[sample],target:targets[sample],selection:[0,0],revision:this.state.revision+1,status:'ready',active:'',failed:'',history:[],future:[]});}
 undo(){const s=this.state;if(!s.history.length)return;this.patch({text:s.history.at(-1)!,history:s.history.slice(0,-1),future:[...s.future,s.text],revision:s.revision+1,selection:[0,0],status:'undone'});}
 redo(){const s=this.state;if(!s.future.length)return;this.patch({text:s.future.at(-1)!,future:s.future.slice(0,-1),history:[...s.history,s.text],revision:s.revision+1,selection:[0,0],status:'ready'});}
 begin(actionId:string){if(this.disposed||this.state.active||!this.actions().some(a=>a.id===actionId)){this.event({name:'polish.rejected',actionId,status:'unavailable'});return null;}
 const source=this.selected(),allowed=Object.values(samples).includes(source)||source==='请介绍今年的重点产品，面向新客户讲解使用场景。';
 if(!allowed){this.patch({status:'no-fixture'});this.event({name:'polish.request',actionId,status:'no-fixture'});return null;}
 const ticket={serial:++this.serial,revision:this.state.revision,target:this.state.target.id,text:this.state.text,selection:[...this.state.selection] as [number,number],source,actionId};
 this.patch({active:actionId,failed:'',status:'busy'});this.event({name:'polish.request',actionId,status:'proposed'});return ticket;
 }
 finish(ticket:NonNullable<ReturnType<DemoEditor['begin']>>,outcome:Outcome){if(this.disposed||ticket.serial!==this.serial)return null;
 if(ticket.revision!==this.state.revision||ticket.target!==this.state.target.id||outcome==='stale'){this.patch({active:'',status:'stale'});this.event({name:'polish.result',actionId:ticket.actionId,status:'stale'});return 'stale';}
 if(outcome==='failure'){this.patch({active:'',failed:ticket.actionId,status:'failure'});return 'failure';}
 const protectedText=protectPolishParameters(ticket.source);
 // Fixed fixture transformations, never a model call or arbitrary generation.
 let mock=outcome==='unchanged'?protectedText.text:protectedText.text.replace(/，/g,'；\n').replace('烦请您','请您').replace('然后','再');
 if(outcome==='protected')mock='参数保护失败的固定样例';
 let restored:string;
 try{if(outcome==='protected')throw Error('fixture');restored=protectedText.restore(mock);validatePolishParameters(ticket.source,restored);}catch{this.patch({active:'',status:'protected'});return 'protected';}
 if(restored===ticket.source){this.patch({active:'',status:'unchanged'});return 'unchanged';}
 const [a,b]=ticket.selection,whole=a===b,next=whole?restored:ticket.text.slice(0,a)+restored+ticket.text.slice(b);
 this.patch({text:next,selection:[whole?restored.length:a+restored.length,whole?restored.length:a+restored.length],active:'',status:'applied',revision:this.state.revision+1,history:[...this.state.history,ticket.text],future:[]});
 this.event({name:'polish.result',actionId:ticket.actionId,status:'applied'});return 'applied';
 }
 activate(){this.disposed=false;}
 dispose(){this.disposed=true;this.serial++;this.listeners.clear();}
}
export type ImageState='empty'|'pending'|'syncing'|'synced'|'sync-failed'|'removing'|'remove-failed';
export function imageTransition(state:ImageState,action:'pick'|'confirm'|'ok'|'fail'|'remove'|'retry'):ImageState{
 if(action==='pick'&&state==='empty')return 'pending';
 if(action==='confirm'&&state==='pending'||action==='retry'&&state==='sync-failed')return 'syncing';
 if(action==='remove'&&state==='pending')return 'empty';
 if(action==='remove'&&['synced','sync-failed'].includes(state)||action==='retry'&&state==='remove-failed')return 'removing';
 if(action==='ok')return state==='syncing'?'synced':state==='removing'?'empty':state;
 if(action==='fail')return state==='syncing'?'sync-failed':state==='removing'?'remove-failed':state;
 return state;
}
