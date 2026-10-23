import {PolishControls} from './ai-polish';
import {InputDock} from './input-dock';
import {usePhoneEditing} from './use-phone-editing';
import {ConnectionButton} from './connection-access';
import {usePhoneInsets} from './phone-insets';
import {ChatAvatar} from './chat-avatar';
import {useEffect,useRef,useState} from 'react';
import * as I from 'lucide-react';
import {chatTitles} from '../../../packages/core/interactions';
import type {Target} from '../../../packages/core/model';
import {command,currentState,toast,uid,useRuntime} from './runtime';
import {recommendations,suggestions,ServicePage} from './wechat';
import type {Action} from './hover/assist/types';
import HoverIcon from './hover/assist/AppIcon';
import {clipboardRead,clipboardWrite} from './phone-native';
export function SwitchButton({className,beforeSwitch,icon,disabled=false}:{className?:string;beforeSwitch?:()=>void;icon?:React.ReactNode;disabled?:boolean}={}){const step=()=>{beforeSwitch?.();command('switch-step');};return <button className={className} disabled={disabled} aria-label="切换应用" title="切换应用" onPointerUp={e=>{if(e.pointerType==='touch'&&!e.isPrimary)step();}} onClick={step}>{icon||<I.PanelsTopLeft size={20}/>}</button>;}
export function PhoneWeChat(){
 const r=useRuntime(),s=r.state,id=s.chat.conversation;
 return <main className="glass-phone wechat-phone" style={usePhoneInsets()}><header className="glass-status"><span><i className={r.connected?'online-dot':'offline-dot'}/>{r.connected?'已连接':'未连接'}</span><span>微信</span><SwitchButton/><ConnectionButton/></header>{id?<ChatEditor key={id} id={id}/>:<section className="phone-chat-list"><h2>微信</h2>{Object.entries(chatTitles).map(([key,title])=><button key={key} onClick={()=>command('chat-open',key)}><ChatAvatar identity={key}/>{title}<I.ChevronRight/></button>)}<SwitchButton/></section>}{r.toast&&<div className="toast" role="status">{r.toast}</div>}</main>;
}
function ChatEditor({id}:{id:string}){
 const r=useRuntime(),s=r.state,remote=s.chat.drafts[id];
 const cacheKey='mobile-input:phone-draft:'+id;
 const [restored]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem(cacheKey)||'null');return saved?.pending&&typeof saved.text==='string'?saved:{text:remote.text,pending:false};}catch{return {text:remote.text,pending:false};}});
 const [draft,setDraft]=useState<string>(restored.text),[service,setService]=useState<Action|null>(null),[speech,setSpeech]=useState('idle'),[polish,setPolish]=useState(false),[blocked,setBlocked]=useState(Boolean(restored.pending)),[pad,setPad]=useState(false),[sending,setSending]=useState(false),[history,setHistory]=useState<string[]>([]),[future,setFuture]=useState<string[]>([]),[online,setOnline]=useState(false),[error,setError]=useState('');
 const area=useRef<HTMLTextAreaElement>(null),sel=useRef({start:0,end:0}),value=useRef(draft),anchor=useRef<Target|null>(null),revision=useRef(remote.revision),session=useRef(uid()),seq=useRef(0),queued=useRef<string|null>(null),inflight=useRef<Promise<void>|null>(null),speechId=useRef(''),speechBefore=useRef(''),speechSelection=useRef({start:0,end:0}),press=useRef(false),dirty=useRef(Boolean(restored.pending)),blockedRef=useRef(Boolean(restored.pending)),mounted=useRef(true),timer=useRef<ReturnType<typeof setTimeout>|null>(null),lastWrite=useRef(0);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;if(timer.current)clearTimeout(timer.current);if(speechId.current)window.MobileNative?.cancelRecognition(speechId.current);};},[]);
 const [generation]=useState(s.demoGeneration||0);
 function persist(){if((currentState().demoGeneration||0)!==generation)return;localStorage.setItem(cacheKey,JSON.stringify({text:value.current,pending:dirty.current}));}
 function block(){blockedRef.current=true;setBlocked(true);persist();}
 const active=s.target,context=s.chat.context,selected=context?.conversation===id?s.chat.messages[id].find(m=>m.id===context.messageId)?.text:null;
 const [touched,setTouched]=useState(false);
 useEffect(()=>setTouched(false),[context?.messageId]);
 const showReplies=!touched&&!draft.trim()&&!s.texts['reply-dismissed:'+id+':'+context?.messageId];
 const ready=s.chat.activation?.phase==='ready';
 const [pop]=useState(()=>{const key='mobile-input:read-shown',epoch=s.chat.activation?.epoch||'';const fresh=sessionStorage.getItem(key)!==epoch;sessionStorage.setItem(key,epoch);return fresh;});

 useEffect(()=>{
  if(anchor.current&& (active?.id!==anchor.current.id||active?.revision!==anchor.current.revision)){
   if(dirty.current||inflight.current){block();queued.current=null;}else anchor.current=null;
  }
  if(!dirty.current&&!inflight.current){revision.current=remote.revision;value.current=remote.text;setDraft(remote.text);if(active?.id===`composer:${id}`)anchor.current=active;}
 },[active?.id,active?.revision,remote.revision]);
 async function bind(){
  if(blockedRef.current)return false;
  if(currentState().target?.id!==`composer:${id}`){const ack=await command('chat-focus',{conversation:id});if(!ack.ok)return false;}
  const state=currentState();if(state.chat.conversation!==id||state.target?.id!==`composer:${id}`)return false;
  anchor.current=state.target;revision.current=state.chat.drafts[id].revision;return true;
 }
 async function flush():Promise<void>{
  if(inflight.current){await inflight.current;if(queued.current!==null)return flush();return;}
  if(queued.current===null||!mounted.current)return;
  const run=async()=>{
   if(!anchor.current&&!(await bind())){queued.current=null;return;}
   const t=anchor.current!;const text=queued.current;queued.current=null;if(text===null)return;
   const ack=await command('chat-edit',{conversation:id,text,revision:revision.current,sequence:++seq.current,session:session.current},{app:'wechat',targetId:t.id,targetRevision:t.revision});
   if(ack.ok){revision.current=currentState().chat.drafts[id].revision;if(value.current===text)dirty.current=false;persist();}
   else{queued.current=null;if(mounted.current)block();}
  };inflight.current=run();await inflight.current;inflight.current=null;
  if(queued.current!==null)return flush();
 }
 function update(text:string,remember=true){
  if(text.trim())setTouched(true);
  command('switch-cancel');if(remember&&text!==value.current){const previous=value.current;setHistory(h=>[...h,previous].slice(-40));setFuture([]);}value.current=text;setDraft(text);dirty.current=true;persist();
  if(!blockedRef.current){queued.current=text;if(!timer.current)timer.current=setTimeout(()=>{timer.current=null;void flush();},Math.max(0,100-(Date.now()-lastWrite.current)));lastWrite.current=Date.now();}
 }
 function selectRange(){if(area.current)sel.current={start:area.current.selectionStart,end:area.current.selectionEnd};}
 function replace(text:string){const {start,end}=sel.current;update(value.current.slice(0,start)+text+value.current.slice(end));const pos=start+text.length;requestAnimationFrame(()=>{area.current?.focus();area.current?.setSelectionRange(pos,pos);sel.current={start:pos,end:pos};});}
 async function edit(action:string){
  command('switch-cancel');const {start,end}=sel.current;
  try{
   if(action==='all'){area.current?.focus();area.current?.select();sel.current={start:0,end:value.current.length};}
   if(action==='copy'||action==='cut'){if(start===end)return;const original=value.current;await clipboardWrite(original.slice(start,end));if(action==='cut'&&value.current===original){sel.current={start,end};replace('');}}
   if(action==='paste'){const original=value.current;const text=await clipboardRead();if(value.current===original){sel.current={start,end};replace(text);}else setError('草稿已变化，请重新粘贴');}
   if(action==='delete'){
    if(start===end&&start>0){const parts=Array.from(new Intl.Segmenter('zh',{granularity:'grapheme'}).segment(value.current.slice(0,start)));sel.current={start:parts.at(-1)?.index??start-1,end};}replace('');
   }
   if(action==='undo'&&history.length){const text=history.at(-1)!;setHistory(h=>h.slice(0,-1));const previous=value.current;setFuture(h=>[...h,previous]);update(text,false);}
   if(action==='redo'&&future.length){const text=future.at(-1)!;setFuture(h=>h.slice(0,-1));const previous=value.current;setHistory(h=>[...h,previous]);update(text,false);}
  }catch(e){setError(e instanceof Error?e.message:'剪贴板操作失败，请重试');}
 }
 async function send(){if(sending||blocked)return;setSending(true);await flush();const t=anchor.current;if(t){const ack=await command('chat-submit',{conversation:id,text:value.current,revision:revision.current},{app:'wechat',targetId:t.id,targetRevision:t.revision});if(ack.ok){value.current='';setDraft('');dirty.current=false;persist();revision.current=currentState().chat.drafts[id].revision;setHistory([]);setFuture([]);setPolish(false);}}setSending(false);}
 const replyLock=useRef(false);
 async function reply(text:string){if(replyLock.current||!context)return;replyLock.current=true;setSending(true);await command('chat-reply',{conversation:id,text,contextEpoch:context.epoch,messageId:context.messageId},{app:'wechat'});setTimeout(()=>{replyLock.current=false;if(mounted.current)setSending(false);},500);}

 const editing=usePhoneEditing(draft,update,area,`${id}:${active?.revision}`,r.connected&&!blocked);
 const actions=recommendations(s);
 return <><section className="glass-context"><h1><ChatAvatar identity={id}/>{chatTitles[id]}</h1>{selected?<><blockquote>{selected}</blockquote><>{showReplies&&<><label>建议回复</label><div className={"reply-options "+(pop?"pop-actions":"")}>{suggestions(selected).map((text,index)=><button style={{animationDelay:`${index*110}ms`}} disabled={sending||!r.connected} key={text} onClick={()=>reply(text)}>{text}<I.ChevronRight size={20}/></button>)}</div></>}</><label className={!ready?"actions-pending":""}>推荐下一步</label><div className={"related-actions "+(ready?"ready ":"pending ")+(pop?"pop-actions":"")}>{(ready?actions:[]).map((a,index)=><button style={{animationDelay:`${(index+2)*110}ms`}} key={a.id} onClick={()=>{command('switch-cancel');setService(a);}}><HoverIcon app={a.app}/>{a.label}</button>)}</div></>:<div className="compose-heading"><I.MessageCircle size={24}/><span>回复 {chatTitles[id]}</span></div>}</section>
 <section className="glass-input">
 {blocked&&<div className="draft-warning">草稿已保留<button onClick={()=>{blockedRef.current=false;setBlocked(false);anchor.current=null;dirty.current=true;const text=value.current;setTimeout(()=>{queued.current=text;void flush();},0);}}>继续编辑当前会话</button></div>}

 <div className="phone-draft-surface"><textarea ref={area} aria-label="手机输入草稿" placeholder="输入回复…" value={draft} onSelect={editing.select} onFocus={()=>{command('switch-cancel');void bind();}} onChange={e=>{editing.selection.current={start:e.target.selectionStart,end:e.target.selectionEnd};editing.change(e.target.value);}} onKeyUp={editing.select}/><div className="polish-slot">{editing.polish&&<PolishControls editing={editing}/>}</div></div>
 <button className="wechat-inline-send" aria-label="发送回复" disabled={!draft.trim()||blocked||editing.speech!=='idle'||sending} onClick={send}><I.ArrowUp size={18}/>发送</button>
 </section><InputDock editing={editing} area={area} disabled={blocked||sending||!r.connected}/>{service&&<ServicePage action={service} onClose={()=>setService(null)}/>}</>;
}
