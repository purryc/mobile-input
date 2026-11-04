import {useEffect,useRef,useState} from 'react';
import type {Target} from '../../../packages/core/model';
import {command,currentState,uid,useRuntime} from './runtime';

/** Demo adapter: state and guarded actions only. The scene itself knows no transport. */
export function useWeChatInput(id:string){
 const r=useRuntime(),s=r.state,remote=s.chat.drafts[id],cacheKey='mobile-input:phone-draft:'+id;
 const [restored]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem(cacheKey)||'null');return saved?.pending&&typeof saved.text==='string'?saved:{text:remote.text,pending:false};}catch{return {text:remote.text,pending:false};}});
 const [text,setText]=useState<string>(restored.text),[blocked,setBlocked]=useState(Boolean(restored.pending)),[sending,setSending]=useState(false);
 const value=useRef(text),dirty=useRef(Boolean(restored.pending)),blockedRef=useRef(Boolean(restored.pending)),anchor=useRef<Target|null>(null),revision=useRef(remote.revision),sequence=useRef(0),session=useRef(uid()),queue=useRef<string|null>(null),inflight=useRef<Promise<void>|null>(null),binding=useRef<Promise<boolean>|null>(null),mounted=useRef(true),generation=useRef(s.demoGeneration),timer=useRef<ReturnType<typeof setTimeout>|null>(null),sendLock=useRef(false);
 const valid=()=>{const n=currentState();return mounted.current&&n.app==='wechat'&&n.chat.conversation===id&&n.demoGeneration===generation.current;};
 const persist=()=>{if(currentState().demoGeneration===generation.current)localStorage.setItem(cacheKey,JSON.stringify({text:value.current,pending:dirty.current}));};
 const block=()=>{blockedRef.current=true;setBlocked(true);persist();};
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;queue.current=null;if(timer.current)clearTimeout(timer.current);};},[]);
 useEffect(()=>{
  if(anchor.current&&(s.target?.id!==anchor.current.id||s.target?.revision!==anchor.current.revision)){anchor.current=null;if(dirty.current||inflight.current){queue.current=null;block();}}
  if(!dirty.current&&!inflight.current){revision.current=remote.revision;value.current=remote.text;setText(remote.text);if(s.target?.id===`composer:${id}`)anchor.current=s.target;}
 },[s.target?.id,s.target?.revision,remote.revision]);
 async function bind():Promise<boolean>{
  if(!valid()||blockedRef.current||!r.connected||r.syncing)return false;
  if(binding.current)return binding.current;
  const run=async()=>{
   if(currentState().target?.id!==`composer:${id}`){const ack=await command('chat-focus',{conversation:id,preserveRead:true});if(!ack.ok)return false;}
   if(!valid())return false;const n=currentState();if(n.target?.id!==`composer:${id}`)return false;
   anchor.current=n.target;revision.current=n.chat.drafts[id].revision;return true;
  };binding.current=run();try{return await binding.current;}finally{binding.current=null;}
 }
 async function flush():Promise<void>{
  if(inflight.current){await inflight.current;if(queue.current!==null)return flush();return;}
  if(queue.current===null||!valid()||blockedRef.current)return;
  const run=async()=>{
   if(!anchor.current&&!(await bind())){queue.current=null;if(mounted.current)block();return;}
   if(!valid()||blockedRef.current)return;const target=anchor.current!,next=queue.current;queue.current=null;if(next===null)return;
   const ack=await command('chat-edit',{conversation:id,text:next,revision:revision.current,sequence:++sequence.current,session:session.current},{app:'wechat',targetId:target.id,targetRevision:target.revision});
   if(!valid())return;
   if(ack.ok){revision.current=currentState().chat.drafts[id].revision;if(value.current===next)dirty.current=false;persist();}
   else{queue.current=null;block();}
  };inflight.current=run();try{await inflight.current;}finally{inflight.current=null;}if(queue.current!==null)return flush();
 }
 function update(next:string){if(!valid())return;value.current=next;setText(next);dirty.current=true;persist();void command('switch-cancel');if(!blockedRef.current){queue.current=next;if(!timer.current)timer.current=setTimeout(()=>{timer.current=null;void flush();},80);}}
 function recover(){blockedRef.current=false;setBlocked(false);anchor.current=null;queue.current=value.current;void flush();}
 async function send(){
  if(sendLock.current||blockedRef.current||!valid())return;sendLock.current=true;setSending(true);
  try{await flush();if(blockedRef.current||dirty.current||!valid()||!(await bind()))return;const t=anchor.current!;
   const ack=await command('chat-submit',{conversation:id,text:value.current,revision:revision.current},{app:'wechat',targetId:t.id,targetRevision:t.revision});
   if(ack.ok&&valid()){value.current='';setText('');dirty.current=false;queue.current=null;revision.current=currentState().chat.drafts[id].revision;persist();}
  }finally{sendLock.current=false;if(mounted.current)setSending(false);}
 }
 async function adoptReply(reply:string){const ctx=currentState().chat.context;if(sendLock.current||blockedRef.current||dirty.current||!valid()||!ctx)return;sendLock.current=true;setSending(true);
  try{const ack=await command('chat-reply',{conversation:id,text:reply,contextEpoch:ctx.epoch,messageId:ctx.messageId},{app:'wechat'});if(ack.ok&&valid()){const n=currentState();value.current=n.chat.drafts[id].text;setText(value.current);revision.current=n.chat.drafts[id].revision;anchor.current=n.target;dirty.current=false;persist();}}
  finally{sendLock.current=false;if(mounted.current)setSending(false);}
 }
 return {text,blocked,sending,update,bind,flush,send,adoptReply,recover,connected:r.connected&&!r.syncing};
}
