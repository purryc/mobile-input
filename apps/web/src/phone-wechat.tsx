import {useWeChatInput} from './wechat-input-adapter';
import {uiText} from './i18n';
import {ApplicationActionChip} from './application-action-chip';
import {PolishControls} from './ai-polish';
import {InputDock} from './input-dock';
import {usePhoneEditing} from './use-phone-editing';
import {PhoneControllerFrame} from './phone-controller-frame';
import {ChatAvatar} from './chat-avatar';
import {useEffect,useRef,useState} from 'react';
import * as I from 'lucide-react';
import {chatTitles} from '../../../packages/core/interactions';
import {command,currentState,useRuntime} from './runtime';
import {recommendations,suggestions,ServicePage} from './wechat';
import type {Action} from './hover/assist/types';
import HoverIcon from './hover/assist/AppIcon';
export function SwitchButton({className,beforeSwitch,icon,disabled=false}:{className?:string;beforeSwitch?:()=>void;icon?:React.ReactNode;disabled?:boolean}={}){const step=()=>{beforeSwitch?.();command('switch-step');};return <button className={className} disabled={disabled} aria-label={uiText('切换应用')} title={uiText('切换应用')} onPointerUp={e=>{if(e.pointerType==='touch'&&!e.isPrimary)step();}} onClick={step}>{icon||<I.PanelsTopLeft size={20}/>}</button>;}


export function PhoneWeChat(){const {state}=useRuntime(),id=state.chat.conversation;return id?<WeChatController key={id} id={id}/>:<PhoneControllerFrame tasks={false}><section className="phone-chat-list">{Object.entries(chatTitles).map(([id,title])=><button key={id} onClick={()=>command('chat-open',id)}><ChatAvatar identity={id}/>{title}</button>)}</section></PhoneControllerFrame>;}
function WeChatController({id}:{id:string}){
 const r=useRuntime(),s=r.state,input=useWeChatInput(id),area=useRef<HTMLTextAreaElement>(null),[service,setService]=useState<Action|null>(null),[touched,setTouched]=useState(false);
 const context=s.chat.context,source=context?.conversation===id?s.chat.messages[id].find(m=>m.id===context.messageId):undefined,ready=s.chat.activation?.phase==='ready';
 const sourceKey=context?.messageId||'';
 useEffect(()=>{setTouched(false);setService(null);},[sourceKey]);
 const begin=()=>{setTouched(true);void input.bind();};
 const update=(text:string)=>{setTouched(true);input.update(text);};
 const editing=usePhoneEditing(input.text,update,area,`wechat:${s.demoGeneration}:${id}`,input.connected&&!input.blocked,false,{target:{app:'wechat',id:`composer:${id}`,kind:'text'},stamp:()=>{const n=currentState();return JSON.stringify([n.demoGeneration,n.app,n.chat.conversation,n.chat.context?.messageId,n.chat.drafts[id]?.revision,n.inputSession?.id]);},beforeVoice:begin});
 const showReplies=ready&&!touched&&!input.text.trim()&&!s.texts['reply-dismissed:'+id+':'+sourceKey];
 return <PhoneControllerFrame tasks={false} className="wechat-phone" beforeSwitch={editing.cancel} dock={<InputDock editing={editing} area={area} editable={input.connected&&!input.blocked} voiceDisabled={!input.connected||input.blocked} disabled={input.blocked||input.sending||!input.connected}/>}>
  <WeChatContext identity={id} message={source?.text} ready={ready} replies={showReplies?suggestions(source?.text||''):[]} actions={ready?recommendations(s):[]} disabled={!input.connected||input.sending||input.blocked} onReply={text=>{setTouched(true);void input.adoptReply(text);}} onService={action=>{void command('switch-cancel');setService(action);}}/>
  <section className="glass-input">
   {input.blocked&&<div className="draft-warning">{uiText('草稿已保留')}<button onClick={input.recover}>{uiText('继续编辑当前会话')}</button></div>}
   <div className="phone-draft-surface"><textarea ref={area} inputMode="none" disabled={!input.connected||input.blocked} aria-label={uiText('手机输入草稿')} placeholder={uiText('输入回复…')} value={input.text} onSelect={editing.select} onFocus={begin} onChange={e=>{editing.selection.current={start:e.target.selectionStart,end:e.target.selectionEnd};editing.change(e.target.value);}} onKeyUp={editing.select}/></div>
   <button className="wechat-inline-send" aria-label={uiText('发送回复')} disabled={!input.text.trim()||input.blocked||!input.connected||editing.speech!=='idle'||input.sending} onClick={()=>void input.send()}><I.ArrowUp size={18}/>{uiText('发送')}</button>
  </section>
  <PolishControls editing={editing}/>
  {service&&<ServicePage action={service} onClose={()=>setService(null)}/>}
 </PhoneControllerFrame>;
}
/** A shared scene view consumes context and callbacks, never a demo/Mac transport. */
export function WeChatContext({identity,message,ready,replies,actions,disabled,onReply,onService}:{identity:string;message?:string;ready:boolean;replies:string[];actions:Action[];disabled:boolean;onReply:(text:string)=>void;onService:(action:Action)=>void}){
 return <section className="glass-context"><h1><ChatAvatar identity={identity}/>{chatTitles[identity]||identity}</h1>{message&&<blockquote aria-busy={!ready}>{message}</blockquote>}{replies.length>0&&<><label>{uiText('建议回复')}</label><div className="reply-options pop-actions">{replies.map((text,index)=><button style={{animationDelay:`${index*110}ms`}} disabled={disabled} key={text} onClick={()=>onReply(text)}>{text}<I.ChevronRight size={20}/></button>)}</div></>}{actions.length>0&&<><label>{uiText('推荐下一步')}</label><div className="related-actions ready pop-actions">{actions.map((action,index)=><ApplicationActionChip disabled={disabled} style={{animationDelay:`${(index+2)*110}ms`}} key={action.id} onClick={()=>onService(action)}><HoverIcon app={action.app}/>{action.label}</ApplicationActionChip>)}</div></>}</section>;
}
