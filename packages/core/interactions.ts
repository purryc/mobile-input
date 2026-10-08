import type {AppId,State,Command} from './model';
import scenarios from '../../apps/web/src/hover/data/scenarios.json' with {type:'json'};
import original from '../../apps/web/src/hover/wechat/data/original.json' with {type:'json'};
export const demoApps=['mail','wps','wechat','doubao','notes','paint','mario'] as const;
export type ChatMessage={id:string;text:string;me:boolean;image?:string;author?:string};
export type ChatDraft={text:string;revision:number;sequence:number;session:string};
export interface ChatState{conversation:string|null;messages:Record<string,ChatMessage[]>;drafts:Record<string,ChatDraft>}
export const chatTitles:Record<string,string>={'wx-boss':'陈总','wx-daily':'老婆','wx-family':'一家人','wx-alex':'Alex'};
export function initialChats():ChatState{
 const messages:Record<string,ChatMessage[]>={};
 for(const [key,id] of Object.entries({boss:'wx-boss',wife:'wx-daily',alex:'wx-alex'})){
  const c=scenarios.chats[key as keyof typeof scenarios.chats];if(c)messages[id]=c.messages.map(m=>({id:m.id,text:m.text,me:m.me,...('image' in m?{image:typeof m.image==='string'&&m.image.startsWith('/')?m.image:'/assets/patchwork-bag.png'}:{})}));
 }
 messages['wx-family']=(original.conversations.find(c=>c.id==='wx-family')?.messages||[]).slice(0,24).map(m=>({id:m.id,text:m.text||'',me:m.role==='user',...('sender' in m?{author:String(m.sender)}:{})}));
 return {conversation:null,messages,drafts:Object.fromEntries(Object.keys(messages).map(id=>[id,{text:'',revision:0,sequence:0,session:''}]))};
}
export interface Switcher{index:number;deadline:number;epoch:string}
export function appGroup(app:AppId){return ['sheet','word','slides'].includes(app)?'wps':app;}
export function saveOffice(n:State){const file=n.officeFiles.find(f=>f.id===n.officeFile);if(!file)return;if(n.app==='sheet')file.products=structuredClone(n.products);if(n.app==='word')file.paragraphs=[...n.paragraphs];if(n.app==='slides')file.slides=structuredClone(n.slides);}
export function activate(n:State,app:AppId){saveOffice(n);n.app=app;n.target=null;n.presenting=false;n.gameKeys=[];n.gamePaused=app!=='mario';n.playing=false;n.switcher=null;n.recent=[...new Set([app,...n.recent])].filter(x=>x!=='desktop').slice(0,8);}
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
  if(file.products)n.products=structuredClone(file.products);if(file.paragraphs)n.paragraphs=[...file.paragraphs];if(file.slides)n.slides=structuredClone(file.slides);n.slide=0;return null;
 }
 case 'switch-step':{const i=n.switcher?.index??demoApps.indexOf(appGroup(n.app) as typeof demoApps[number]);n.switcher={index:(i+1)%demoApps.length,deadline:Date.now()+1200,epoch:c.id};n.gameKeys=[];n.gamePaused=true;return null;}
 case 'switch-cancel':n.switcher=null;return null;
 case 'switch-commit':if(!n.switcher||v?.epoch!==n.switcher.epoch)return '切换已取消';activate(n,demoApps[n.switcher.index]);return null;
 case 'back':{
  if(n.switcher){n.switcher=null;return null;}if(n.presenting){n.presenting=false;return null;}
  if(n.app==='wechat'&&n.chat.conversation){n.chat.conversation=null;n.target=null;return null;}
  if(['sheet','word','slides'].includes(n.app)){activate(n,'wps');return null;}
  if(n.app==='mail'&&n.texts.composing==='1'){n.texts.composing='0';n.target=null;return null;}
  activate(n,'desktop');return null;
 }
 case 'chat-open':{const id=String(c.value);if(!n.chat.messages[id])return '会话不存在';n.chat.conversation=id;n.target=null;return null;}
 case 'chat-focus':{
  const id=String(v?.conversation);if(n.app!=='wechat'||n.chat.conversation!==id)return '会话已变化';
  const mid=String(v?.messageId||'');const m=n.chat.messages[id]?.find(m=>m.id===mid);
  if(mid&&!m)return '消息不存在';
  n.target={id:mid?`message:${id}:${mid}`:`composer:${id}`,label:chatTitles[id],app:'wechat',kind:mid?'message':'text',revision:n.revision+1,value:mid?m!.text:n.chat.drafts[id].text};n.switcher=null;return null;
 }
 case 'chat-edit':case 'chat-submit':case 'chat-reply':{
  const id=String(v?.conversation),d=n.chat.drafts[id];
  if(n.app!=='wechat'||n.chat.conversation!==id||!d||!n.target||c.targetId!==n.target?.id||c.targetRevision!==n.target?.revision)return '回复目标已变化，草稿已保留';
  const text=String(v?.text??'');if(text.length>20000)return '内容过长';
  if(c.type==='chat-reply'){
   if(!n.target.id.startsWith('message:'))return '请选择消息';
  }else{
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
  if(c.type==='chat-submit'){d.text='';d.revision++;d.session='';d.sequence=0;n.target.value='';}
  n.switcher=null;return null;
 }
 default:return undefined;
 }
}
