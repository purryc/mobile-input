import {CHAT_SCENE_VERSION,BOSS_MESSAGE_ID,salesMeeting,bossMessages,type SalesMeeting} from './chat-scene';
import {pausePresentation,releasePointer} from './presentation';
import type {AppId,State,Command} from './model';
import scenarios from '../../apps/web/src/hover/data/scenarios.json' with {type:'json'};
import original from '../../apps/web/src/hover/wechat/data/original.json' with {type:'json'};
export const CHAT_READ_TIMING={pulse:480,scan:2000} as const;
export const demoApps=['mail','wps','wechat','doubao','notes','paint','mario'] as const;
export type ChatMessage={id:string;text:string;me:boolean;image?:string;author?:string};
export type ChatDraft={text:string;revision:number;sequence:number;session:string};
export interface ChatState{activation:{epoch:string;conversation:string;messageId:string;startedAt:number;phase:'pulse'|'scan'|'ready'}|null;sceneVersion:number;meeting:SalesMeeting;context:{conversation:string;messageId:string;epoch:string;readAt:number;sourceRevision:number}|null;conversation:string|null;messages:Record<string,ChatMessage[]>;drafts:Record<string,ChatDraft>}
export const chatTitles:Record<string,string>={'wx-boss':'陈总','wx-daily':'老婆','wx-family':'一家人','wx-alex':'Alex'};
export function initialChats():ChatState{
 const messages:Record<string,ChatMessage[]>={};
 for(const [key,id] of Object.entries({boss:'wx-boss',wife:'wx-daily',alex:'wx-alex'})){
  const c=scenarios.chats[key as keyof typeof scenarios.chats];if(c)messages[id]=c.messages.map(m=>({id:m.id,text:m.text,me:m.me,...('image' in m?{image:typeof m.image==='string'&&m.image.startsWith('/')?m.image:'/assets/patchwork-bag.png'}:{})}));
 }
 messages['wx-family']=(original.conversations.find(c=>c.id==='wx-family')?.messages||[]).slice(0,24).map(m=>({id:m.id,text:m.text||'',me:m.role==='user',...('sender' in m?{author:String(m.sender)}:{})}));
 const meeting=salesMeeting();messages['wx-boss']=bossMessages(meeting.text);
 return {activation:null,sceneVersion:CHAT_SCENE_VERSION,meeting,context:null,conversation:null,messages,drafts:Object.fromEntries(Object.keys(messages).map(id=>[id,{text:'',revision:0,sequence:0,session:''}]))};
}
export interface Switcher{index:number;deadline:number;epoch:string}
export function appGroup(app:AppId){return ['sheet','word','slides'].includes(app)?'wps':app;}
export function saveOffice(n:State){const file=n.officeFiles.find(f=>f.id===n.officeFile);if(!file)return;if(n.app==='sheet')file.products=structuredClone(n.products);if(n.app==='word')file.paragraphs=[...n.paragraphs];if(n.app==='slides')file.slides=structuredClone(n.slides);}
export function activate(n:State,app:AppId){saveOffice(n);pausePresentation(n);n.chat.context=null;n.chat.activation=null;n.app=app;n.target=null;n.presenting=false;n.gameKeys=[];n.gamePaused=app!=='mario';n.playing=false;n.switcher=null;n.recent=[...new Set([app,...n.recent])].filter(x=>x!=='desktop').slice(0,8);}
export function setChatContext(n:State,id:string,epoch:string,messageId?:string,read=false){
 const m=messageId?n.chat.messages[id]?.find(m=>m.id===messageId):id==='wx-boss'?n.chat.messages[id]?.find(m=>m.id===BOSS_MESSAGE_ID):[...(n.chat.messages[id]||[])].reverse().find(m=>!m.me);
 n.chat.context=m?{conversation:id,messageId:m.id,epoch,readAt:read?Date.now():0,sourceRevision:n.revision+1}:null;
}
export function launch(n:State,app:AppId){
 activate(n,app);
 if(app==='wechat'){n.chat.conversation='wx-boss';setChatContext(n,'wx-boss',crypto.randomUUID());}
 if(app==='wps'){
  const file=n.officeFiles.find(f=>f.id==='sample-slides');
  n.app='slides';n.officeFile='sample-slides';if(file?.slides)n.slides=structuredClone(file.slides);
  n.slide=0;n.presentation.lastSlide=0;n.presentation.elapsed=0;n.presentation.runningSince=0;n.presentation.mode='laser';n.presentation.session=crypto.randomUUID();n.startedAt=Math.max(Date.now(),n.startedAt+1);
 }
}
export function interaction(n:State,c:Command):string|null|undefined{
 const v=c.value as Record<string,unknown>|undefined;
 switch(c.type){
 case 'office-open':{
  saveOffice(n);
  const kind=String(v?.kind);let file=n.officeFiles.find(f=>f.id===v?.id);
  if(v?.create&&['sheet','word','slides'].includes(kind)){
   const count=n.officeFiles.filter(f=>f.kind===kind).length;
   file={id:c.id,kind:kind as 'sheet'|'word'|'slides',name:`未命名${{sheet:'表格',word:'文档',slides:'演示'}[kind]} ${count}`};
   if(kind==='sheet')file.products=[{id:c.id,name:'产品',quantity:1,cost:0,price:0,discount:0}];
   if(kind==='word')file.paragraphs=['未命名文档','需求摘要','产品方案','报价说明','交付安排'];
   if(kind==='slides')file.slides=Array.from({length:6},(_,i)=>({title:`幻灯片 ${i+1}`,body:'点击编辑内容',notes:''}));
   n.officeFiles.unshift(file);
  }
  if(!file)return '文件不存在';activate(n,file.kind);n.officeFile=file.id;
  if(file.products)n.products=structuredClone(file.products);if(file.paragraphs)n.paragraphs=[...file.paragraphs];if(file.slides)n.slides=structuredClone(file.slides);n.slide=0;if(file.kind==='slides'){n.presentation.elapsed=0;n.presentation.session=crypto.randomUUID();n.presentation.mode='laser';n.startedAt=Math.max(Date.now(),n.startedAt+1);}return null;
 }
 case 'switch-step':{n.presentation.captions={...n.presentation.captions,id:'',enabled:false,status:'off',text:'',error:''};const i=n.switcher?.index??demoApps.indexOf(appGroup(n.app) as typeof demoApps[number]);n.switcher={index:(i+1)%demoApps.length,deadline:Date.now()+1200,epoch:c.id};n.gameKeys=[];n.gamePaused=true;releasePointer(n);return null;}
 case 'switch-cancel':n.switcher=null;return null;
 case 'switch-commit':if(!n.switcher||v?.epoch!==n.switcher.epoch)return '切换已取消';launch(n,demoApps[n.switcher.index]);return null;
 case 'back':{
  if(n.switcher){n.switcher=null;return null;}if(n.presenting){pausePresentation(n);n.presenting=false;return null;}
  if(['sheet','word','slides'].includes(n.app)){activate(n,'wps');return null;}
  if(n.app==='mail'&&n.texts.composing==='1'){n.texts.composing='0';n.target=null;return null;}
  activate(n,'desktop');return null;
 }
 case 'chat-open':{const id=String(c.value);if(!n.chat.messages[id])return '会话不存在';n.chat.conversation=id;n.target=null;n.chat.activation=null;setChatContext(n,id,c.id);return null;}
 case 'chat-focus':{
  const id=String(v?.conversation);if(n.app!=='wechat'||n.chat.conversation!==id)return '会话已变化';
  const mid=String(v?.messageId||'');const m=n.chat.messages[id]?.find(m=>m.id===mid);
  if(mid&&!m)return '消息不存在';
  if(!mid&&n.target?.id===`composer:${id}`&&n.chat.activation&&(!v?.sourceMessageId||v.sourceMessageId===n.chat.context?.messageId)){n.switcher=null;return null;}
  const sourceId=mid||String(v?.sourceMessageId||'');
  if(sourceId&&!n.chat.messages[id]?.some(m=>m.id===sourceId))return '消息不存在';
  setChatContext(n,id,c.id,sourceId||undefined,!mid);
  n.chat.activation=!mid&&n.chat.context?{epoch:c.id,conversation:id,messageId:n.chat.context.messageId,startedAt:Date.now(),phase:'pulse'}:null;
  n.target={id:mid?`message:${id}:${mid}`:`composer:${id}`,label:chatTitles[id],app:'wechat',kind:mid?'message':'text',revision:n.revision+1,value:mid?m!.text:n.chat.drafts[id].text};n.switcher=null;return null;
 }
 case 'chat-read-stage':{
  const a=n.chat.activation;if(n.app!=='wechat'||!a||v?.epoch!==a.epoch||n.chat.conversation!==a.conversation||n.target?.id!==`composer:${a.conversation}`)return '读取已取消';
  const elapsed=Date.now()-a.startedAt;
  if(v?.phase==='scan'&&a.phase==='pulse'&&elapsed>=CHAT_READ_TIMING.pulse){a.phase='scan';return null;}
  if(v?.phase==='ready'&&a.phase==='scan'&&elapsed>=CHAT_READ_TIMING.pulse+CHAT_READ_TIMING.scan){a.phase='ready';return null;}
  return '读取阶段已过期';
 }
 case 'chat-edit':case 'chat-submit':case 'chat-reply':{
  const id=String(v?.conversation),d=n.chat.drafts[id];
  if(n.app!=='wechat'||n.chat.conversation!==id||!d)return '回复目标已变化，草稿已保留';
  const text=String(v?.text??'');if(text.length>20000)return '内容过长';
  if(c.type==='chat-reply'){
   const context=n.chat.context;if(n.chat.activation?.phase!=='ready')return '请先点击平板输入框';if(!context||context.conversation!==id||v?.contextEpoch!==context.epoch||v?.messageId!==context.messageId)return '消息已变化';
  }else{
   if(!n.target||c.targetId!==n.target.id||c.targetRevision!==n.target.revision)return '回复目标已变化，草稿已保留';
   if(n.target.id!==`composer:${id}`)return '请选择回复框';
   if(v?.revision!==d.revision)return '平板草稿已修改，请重新选择回复框';
   if(c.type==='chat-edit'){
    const seq=Number(v?.sequence),session=String(v?.session||'');if(!session||!Number.isInteger(seq)||seq<1)return '编辑序号无效';
    if(session===d.session&&seq<=d.sequence)return '已忽略过期编辑';
    d.text=text;d.revision++;d.sequence=seq;d.session=session;n.target.value=text;n.switcher=null;return null;
   }
  }
  if(!text.trim())return '请输入内容';
  n.chat.messages[id].push({id:c.id,text,me:true});
  if(c.type==='chat-submit'){d.text='';d.revision++;d.session='';d.sequence=0;if(n.target)n.target.value='';}
  n.switcher=null;return null;
 }
 default:return undefined;
 }
}
