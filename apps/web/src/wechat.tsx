import {ChatAvatar} from './chat-avatar';
import {useRuntime} from './runtime';
import {useBack} from './back';
import {useEffect,useRef,useState} from 'react';
import * as I from 'lucide-react';
import {chatTitles,type ChatMessage} from '../../../packages/core/interactions';
import type {State} from '../../../packages/core/model';
import {command,uid} from './runtime';
import TranslationFocus from './hover/assist/TranslationFocus';
import type {Action} from './hover/assist/types';
import {NativeService,isNativeAction} from './hover/assist/NativeService';
import MockApp from './hover/assist/MockApp';
import './hover/assist/native-service.css';
import './hover/assist/mock-app.css';
import './hover/assist/xiaoyi-answer.css';
export {recommendations} from './chat-actions';
import {visibleMessageSource} from './chat-actions';
export function suggestions(text:string){
 if(/会议|会面|开会|日历|两点|安排上/.test(text))return ['收到，我确认时间后安排。','好的，我会提前准备好会议资料。'];
 if(/酒店|住宿/.test(text))return ['收到，先整理符合预算的酒店供您参考。','好的，确认入住时间后再预订。'];
 if(/邮件|草稿/.test(text))return ['收到，邮件先存草稿，等您确认。','好的，我整理后发您过目。'];
 return ['收到，我来安排。','好的，整理好后回复您。'];
}
function Bubble({m,identity,active,scan,onClick}:{m:ChatMessage;identity:string;active:boolean;scan:boolean;onClick:()=>void}){
 return <div data-message-id={m.id} className={'wx-message '+(m.me?'me':'')}><ChatAvatar identity={m.me?'我':m.author||identity}/><button className={'wx-bubble '+(active?'focused':'')+(scan?' scanning read-halo':'')} onClick={onClick} aria-label={m.text}>{m.author&&<small>{m.author}</small>}{m.image&&<img src={m.image} alt="消息图片"/>}{m.text}</button></div>;
}
export function WeChat({s}:{s:State}){
 const r=useRuntime(),id=s.chat.conversation||'wx-boss',area=useRef<HTMLDivElement>(null),input=useRef<HTMLTextAreaElement>(null);
 const messages=id?s.chat.messages[id]:[],previous=useRef({id,count:messages.length}),[phase,setPhase]=useState('idle');
 const ctx=s.chat.context;
 useEffect(()=>{if(area.current)area.current.scrollTop=area.current.scrollHeight;},[id]);
 useEffect(()=>{if(input.current){input.current.style.height='0px';input.current.style.height=Math.min(108,Math.max(40,input.current.scrollHeight))+'px';}},[id,id?s.chat.drafts[id].text:'']);
 const activation=s.chat.activation;
 useEffect(()=>{
  if(!activation||!r.connected||activation.phase==='ready'){setPhase('idle');return;}
  setPhase(activation.phase);
  const next=activation.phase==='pulse'?'scan':'ready',delay=(next==='scan'?480:1180)-(Date.now()-activation.startedAt);
  const timer=setTimeout(()=>void command('chat-read-stage',{epoch:activation.epoch,phase:next}),Math.max(0,delay)+8);
  return()=>clearTimeout(timer);
 },[activation?.epoch,activation?.phase,r.connected]);
 useEffect(()=>{if(previous.current.id===id&&messages.length>previous.current.count&&messages.at(-1)?.me)area.current?.scrollTo({top:area.current.scrollHeight,behavior:'smooth'});previous.current={id,count:messages.length};},[id,messages.length]);
 const focused=s.target?.id===`composer:${id}`;
 const focus=()=>{
  const viewport=area.current?.getBoundingClientRect();
  const visible=viewport?Array.from(area.current!.querySelectorAll<HTMLElement>('[data-message-id]')).filter(el=>{const b=el.getBoundingClientRect();return b.bottom>viewport.top+8&&b.top<viewport.bottom-8;}).map(el=>el.dataset.messageId!):[];
  const sourceMessageId=visibleMessageSource(s,id,visible);
  if(!focused||!s.chat.activation||sourceMessageId!==ctx?.messageId)command('chat-focus',{conversation:id,sourceMessageId});
 };
 return <div className="wx-app"><aside><header>微信 <I.Plus size={20}/></header><label className="wx-search"><I.Search size={17}/><input placeholder="搜索" onChange={e=>{for(const el of document.querySelectorAll<HTMLElement>('.wx-contact'))el.hidden=!el.textContent?.includes(e.target.value);}}/></label>{Object.entries(chatTitles).filter(([key])=>s.chat.messages[key]).map(([key,title])=><button key={key} className={'wx-contact '+(id===key?'active':'')} onClick={()=>command('chat-open',key)}><ChatAvatar identity={key}/><span><b>{title}</b><small>{s.chat.messages[key].at(-1)?.text}</small></span></button>)}<nav><I.MessageCircle/><I.Contact/><I.Compass/><I.User/></nav></aside><section>{id?<><header>{chatTitles[id]}<I.MoreHorizontal/></header><div className="wx-messages" ref={area}>{messages.map(m=><Bubble key={m.id} m={m} identity={id} active={s.target?.id===`message:${id}:${m.id}`} scan={ctx?.messageId===m.id&&phase==='scan'} onClick={()=>command('chat-focus',{conversation:id,messageId:m.id})}/>)}</div><div className="wx-composer wx-native-composer"><button aria-label="语音输入" onClick={focus}><I.AudioLines size={25}/></button><div className={'wx-input-bar '+(focused?'focused ':'')+(focused&&phase==='pulse'?'focus-pulse':'')}><textarea ref={input} aria-label="微信回复输入框" rows={1} onPointerDown={focus} value={s.chat.drafts[id].text} onFocus={focus} onChange={e=>command('chat-edit',{conversation:id,text:e.target.value,revision:s.chat.drafts[id].revision,sequence:s.chat.drafts[id].sequence+1,session:'tablet'},{targetId:s.target?.id,targetRevision:s.target?.revision})}/><I.Mic size={19}/></div><I.Smile size={27}/>{s.chat.drafts[id].text.trim()?<button className="wx-send" onClick={()=>command('chat-submit',{conversation:id,text:s.chat.drafts[id].text,revision:s.chat.drafts[id].revision},{targetId:s.target?.id,targetRevision:s.target?.revision})}>发送</button>:<I.PlusCircle size={27}/>}</div></>:<div className="wx-empty"><img src="/assets/apps/wechat.png" alt="微信"/></div>}</section></div>;
}
export function ServicePage({action,onClose}:{action:Action;onClose:()=>void}){
 useBack(()=>{onClose();return true;},50);
 return <div className="hover-services" key={action.recordKey}>{isNativeAction(action)?<NativeService action={action} onClose={onClose}/>:<MockApp action={action} onClose={onClose}/>}</div>;
}
