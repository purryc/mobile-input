import {useBack} from './back';
import {useEffect,useRef,useState} from 'react';
import * as I from 'lucide-react';
import {chatTitles,type ChatMessage} from '../../../packages/core/interactions';
import type {State} from '../../../packages/core/model';
import {command,uid} from './runtime';
import TranslationFocus from './hover/assist/TranslationFocus';
import {LocalIntentProvider} from './hover/assist/intents';
import type {Action} from './hover/assist/types';
import {NativeService,isNativeAction} from './hover/assist/NativeService';
import MockApp from './hover/assist/MockApp';
import './hover/assist/native-service.css';
import './hover/assist/mock-app.css';
import './hover/assist/xiaoyi-answer.css';
const provider=new LocalIntentProvider();
export function recommendations(s:State):Action[]{
 const id=s.chat.conversation;if(!id||s.target?.kind!=='message')return [];
 const mid=s.target.id.split(':').at(-1)!;
 return provider.recommend({conversationId:id,context:s.chat.messages[id],question:'',tool:'ask',target:{id:mid,messageId:mid,text:s.target.value,kind:'message',rect:{x:0,y:0,width:0,height:0}}}).filter(a=>['calendar','phone','contacts','notes','xiaoyi','mail','feishu','gaode','ctrip','meituan','taobao','jd','sf','damai','wechat'].includes(a.app)).map(a=>({...a,recordKey:`${id}:${mid}:${a.id}`}));
}
export function suggestions(text:string){
 if(/会议|会面|开会|日历|两点|安排上/.test(text))return ['收到，我确认时间后安排。','好的，我会提前准备好会议资料。'];
 if(/酒店|住宿/.test(text))return ['收到，先整理符合预算的酒店供您参考。','好的，确认入住时间后再预订。'];
 if(/邮件|草稿/.test(text))return ['收到，邮件先存草稿，等您确认。','好的，我整理后发您过目。'];
 return ['收到，我来安排。','好的，整理好后回复您。'];
}
function Bubble({m,active,onClick}:{m:ChatMessage;active:boolean;onClick:()=>void}){
 const ref=useRef<HTMLButtonElement>(null),[size,setSize]=useState({width:0,height:0});
 useEffect(()=>{if(!ref.current)return;const obs=new ResizeObserver(([e])=>setSize({width:e.target.clientWidth,height:e.target.clientHeight}));obs.observe(ref.current);return()=>obs.disconnect();},[]);
 return <div className={'wx-message '+(m.me?'me':'')}><span className="wx-avatar">{m.me?'我':m.author?.slice(0,1)||'陈'}</span><button ref={ref} className={'wx-bubble '+(active?'focused':'')} onClick={onClick} aria-label={m.text}>{m.author&&<small>{m.author}</small>}{m.image&&<img src={m.image} alt="消息图片"/>}{m.text}{active&&size.width>0&&<TranslationFocus rect={{x:-5,y:-5,width:size.width+10,height:size.height+10}} reading semantic/>}</button></div>;
}
export function WeChat({s}:{s:State}){
 const id=s.chat.conversation,area=useRef<HTMLDivElement>(null);const messages=id?s.chat.messages[id]:[];const previous=useRef({id,count:messages.length});
 useEffect(()=>{if(area.current)area.current.scrollTop=0;},[id]);
 useEffect(()=>{if(previous.current.id===id&&messages.length>previous.current.count&&messages.at(-1)?.me)area.current?.scrollTo({top:area.current.scrollHeight,behavior:'smooth'});previous.current={id,count:messages.length};},[id,messages.length]);
 return <div className="wx-app"><aside><header>微信 <I.Plus size={20}/></header><label className="wx-search"><I.Search size={17}/><input placeholder="搜索" onChange={e=>{for(const el of document.querySelectorAll<HTMLElement>('.wx-contact'))el.hidden=!el.textContent?.includes(e.target.value);}}/></label>{Object.entries(chatTitles).filter(([key])=>s.chat.messages[key]).map(([key,title])=><button key={key} className={'wx-contact '+(id===key?'active':'')} onClick={()=>command('chat-open',key)}><span className="wx-avatar">{title.slice(0,1)}</span><span><b>{title}</b><small>{s.chat.messages[key].at(-1)?.text}</small></span></button>)}<nav><I.MessageCircle/><I.Contact/><I.Compass/><I.User/></nav></aside><section>{id?<><header>{chatTitles[id]}<I.MoreHorizontal/></header><div className="wx-messages" ref={area}>{messages.map(m=><Bubble key={m.id} m={m} active={s.target?.id===`message:${id}:${m.id}`} onClick={()=>command('chat-focus',{conversation:id,messageId:m.id})}/>)}</div><div className={'wx-composer '+(s.target?.id===`composer:${id}`?'focused':'')} onClick={e=>{if(!(e.target instanceof HTMLTextAreaElement)&&s.target?.id!==`composer:${id}`)command('chat-focus',{conversation:id});}}><div><I.Smile/><I.Folder/><I.Scissors/><I.Phone/><I.Video/></div><textarea aria-label="微信回复输入框" value={s.chat.drafts[id].text} onFocus={()=>{if(s.target?.id!==`composer:${id}`)command('chat-focus',{conversation:id});}} onChange={e=>command('chat-edit',{conversation:id,text:e.target.value,revision:s.chat.drafts[id].revision,sequence:s.chat.drafts[id].sequence+1,session:'tablet'},{targetId:s.target?.id,targetRevision:s.target?.revision})}/><button disabled={!s.chat.drafts[id].text.trim()} onClick={e=>{e.stopPropagation();command('chat-submit',{conversation:id,text:s.chat.drafts[id].text,revision:s.chat.drafts[id].revision},{targetId:s.target?.id,targetRevision:s.target?.revision});}}>发送</button></div></>:<div className="wx-empty"><img src="/assets/apps/wechat.png" alt="微信"/></div>}</section></div>;
}
export function ServicePage({action,onClose}:{action:Action;onClose:()=>void}){
 useBack(()=>{onClose();return true;},50);
 return <div className="hover-services" key={action.recordKey}>{isNativeAction(action)?<NativeService action={action} onClose={onClose}/>:<MockApp action={action} onClose={onClose}/>}</div>;
}
