import {polishActionsForTarget} from '../../../packages/core/polish-actions';
import {wbDraftFor} from '../../../packages/core/workbuddy';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { clipboardRead, clipboardWrite } from './phone-native';
import {requestPolish} from './ai-polish';
import {currentState, uid } from './runtime';

/** Shared native input lifecycle. Transcripts are drafts; no action in this hook submits. */
export function usePhoneEditing(text:string, update:(text:string)=>void, area:RefObject<HTMLTextAreaElement|null>, identity:string, connected:boolean, commandMode=false) {
  const value=useRef(text),apply=useRef(update),identityRef=useRef(identity);value.current=text;apply.current=update;identityRef.current=identity;
  const [polishing,setPolishing]=useState(false),[polishError,setPolishError]=useState('');
  const polishRequest=useRef<AbortController|null>(null),editGeneration=useRef(0),available=useRef(connected);available.current=connected;
  const selection=useRef({start:0,end:0});
  const [completedId,setCompletedId]=useState('');
  const [completion,setCompletion]=useState<{id:string;text:string;identity:string;commandMode:boolean}|null>(null);
  const recognition=useRef(''),speechBinding=useRef({identity,commandMode});
  const [history,setHistory]=useState<string[]>([]),[future,setFuture]=useState<string[]>([]),[speech,setSpeech]=useState('idle'),[error,setError]=useState(''),[online,setOnline]=useState(false),[polish,setPolish]=useState(false);
  const heard=useRef(false),session=useRef(''),before=useRef(''),speechSelection=useRef({start:0,end:0}),timer=useRef<ReturnType<typeof setTimeout>|null>(null),long=useRef(false),down=useRef(false),suppressClick=useRef(false),active=useRef(true);
  function change(next:string,remember=true) {editGeneration.current++;cancelPolish();if(remember&&next!==value.current){const previous=value.current;setHistory(h=>[...h,previous].slice(-50));setFuture([]);}value.current=next;apply.current(next);}
  function select(){if(area.current)selection.current={start:area.current.selectionStart,end:area.current.selectionEnd};}
  function replace(insert:string) {const {start,end}=selection.current;change(value.current.slice(0,start)+insert+value.current.slice(end));const at=start+insert.length;selection.current={start:at,end:at};requestAnimationFrame(()=>{area.current?.focus();area.current?.setSelectionRange(at,at);});}
  async function edit(action:string) {
    const snapshot=value.current,boundIdentity=identityRef.current,{start,end}=selection.current;
    try {
      if(action==='all'){area.current?.focus();area.current?.select();selection.current={start:0,end:snapshot.length};}
      if(action==='copy'||action==='cut'){if(start===end)return;await clipboardWrite(snapshot.slice(start,end));if(action==='cut'&&active.current&&identityRef.current===boundIdentity&&value.current===snapshot){selection.current={start,end};replace('');}}
      if(action==='paste'){const pasted=await clipboardRead();if(!active.current||identityRef.current!==boundIdentity)return;if(value.current!==snapshot){setError('草稿已变化，请重新粘贴');return;}selection.current={start,end};replace(pasted);}
      if(action==='delete'){if(start===end&&start>0){const segments=Array.from(new Intl.Segmenter('zh',{granularity:'grapheme'}).segment(snapshot.slice(0,start)));selection.current={start:segments.at(-1)?.index??start-1,end};}replace('');}
      if(action==='undo'&&history.length){setHistory(h=>h.slice(0,-1));setFuture(f=>[...f,snapshot]);change(history.at(-1)!,false);}
      if(action==='redo'&&future.length){setFuture(f=>f.slice(0,-1));setHistory(h=>[...h,snapshot]);change(future.at(-1)!,false);}
    }catch(e){setError(e instanceof Error?e.message:'剪贴板不可用，内容已保留');}
  }
  function start(){if(session.current||!connected)return;if(!window.MobileNative){setError('语音输入需在手机应用中使用');return;}session.current=uid();speechBinding.current={identity:identityRef.current,commandMode};recognition.current='';before.current=value.current;speechSelection.current=commandMode?{start:0,end:before.current.length}:{...selection.current};heard.current=false;if(commandMode)change('',false);setError('');setPolish(false);setSpeech('starting');window.MobileNative.startRecognition(session.current,online,true);}
  function stop(){if(!session.current)return;setSpeech('finishing');window.MobileNative?.stopRecognition(session.current);}
  function cancel(){if(timer.current)clearTimeout(timer.current);down.current=false;if(!session.current)return;window.MobileNative?.cancelRecognition(session.current);session.current='';setSpeech('idle');change(before.current,false);}
  useEffect(()=>{const listener=(event:Event)=>{const d=(event as CustomEvent).detail;if(!session.current||d.sessionId!==session.current)return;
    if(d.type==='start')setSpeech('recording');
    if(d.type==='partial'||d.type==='final'){if(!/[\p{L}\p{N}]/u.test(String(d.text||'')))return;heard.current=true;recognition.current=String(d.text);const {start,end}=speechSelection.current;change(before.current.slice(0,start)+String(d.text||'')+before.current.slice(end),false);}
    if(d.type==='complete'){const finished=session.current,binding=speechBinding.current;session.current='';setSpeech('idle');if(binding.identity!==identityRef.current)return;const finalText=typeof d.text==='string'&&d.text.length?d.text:recognition.current;if(!/[\p{L}\p{N}]/u.test(finalText)){setError('未识别到文字，请重新说一次');return;}const {start,end}=speechSelection.current;change(before.current.slice(0,start)+finalText+before.current.slice(end),false);setCompletion({id:finished,text:finalText,...binding});setCompletedId(finished);if(value.current!==before.current)setHistory(h=>[...h,before.current].slice(-50));setFuture([]);setPolish(!!value.current.trim());selection.current={start:value.current.length,end:value.current.length};}
    if(d.type==='error'){session.current='';setSpeech('idle');setError(d.message||'识别失败，请重试');}
  };window.addEventListener('native-speech',listener);return()=>window.removeEventListener('native-speech',listener);});
  useEffect(()=>{active.current=true;setCompletion(null);setCompletedId('');setSpeech('idle');setPolish(false);setHistory([]);setFuture([]);const abort=()=>{cancelPolish();if(timer.current)clearTimeout(timer.current);down.current=false;if(session.current)window.MobileNative?.cancelRecognition(session.current);session.current='';setSpeech('idle');};const hide=()=>{if(document.hidden)abort();};window.addEventListener('connection-open',abort);document.addEventListener('visibilitychange',hide);return()=>{cancelPolish();active.current=false;if(timer.current)clearTimeout(timer.current);if(session.current)window.MobileNative?.cancelRecognition(session.current);session.current='';window.removeEventListener('connection-open',abort);document.removeEventListener('visibilitychange',hide);};},[identity]);
  useEffect(()=>{if(!connected){cancelPolish();if(session.current)window.MobileNative?.cancelRecognition(session.current);session.current='';down.current=false;setSpeech('idle');}},[connected]);
  function cancelPolish(){polishRequest.current?.abort();polishRequest.current=null;setPolishing(false);}
  const targetStamp=()=>{const state=currentState(),target=state.target;return JSON.stringify([target?.id,target?.revision,state.editSession?.epoch,state.editSession?.version,target?.id.startsWith('wb:')?wbDraftFor(state,target.id)?.revision:target?.app==='wechat'&&state.chat.conversation?state.chat.drafts[state.chat.conversation]?.revision:undefined]);};
  const polishActions=commandMode?[]:polishActionsForTarget(currentState().target);
  async function refine(kind:string){
    if(polishRequest.current||!connected||speech!=='idle'||commandMode||!polishActionsForTarget(currentState().target).some(a=>a.id===kind))return;
    select();
    const snapshot=value.current,{start,end}=selection.current,selected=end>start,input=selected?snapshot.slice(start,end):snapshot;
    if(!input.trim())return;if(input.length>4000){setPolishError('请选择 4000 字以内的文字');return;}
    const targetKey=targetStamp();
    const bound=identityRef.current,generation=editGeneration.current,controller=new AbortController();polishRequest.current=controller;setPolishing(true);setPolishError('');
    try{const result=await requestPolish(input,kind,controller.signal);
      const key=targetStamp();
      if(controller.signal.aborted||!active.current||!available.current||identityRef.current!==bound||generation!==editGeneration.current||value.current!==snapshot||key!==targetKey){if(active.current&&!controller.signal.aborted)setPolishError('文字或目标已变化，已保留当前内容');return;}
      polishRequest.current=null;change(selected?snapshot.slice(0,start)+result+snapshot.slice(end):result);
      selection.current={start:selected?start:0,end:(selected?start:0)+result.length};requestAnimationFrame(()=>area.current?.setSelectionRange(selection.current.start,selection.current.end));
    }catch(e){if(active.current&&!controller.signal.aborted)setPolishError(e instanceof Error?e.message:'润色失败，原文已保留');}
    finally{if(polishRequest.current===controller){polishRequest.current=null;setPolishing(false);}}
  }
  const voiceProps={
    onContextMenu:(e:React.MouseEvent<HTMLButtonElement>)=>e.preventDefault(),
    onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);if(session.current){stop();down.current=false;suppressClick.current=true;long.current=true;return;}down.current=true;long.current=false;suppressClick.current=false;timer.current=setTimeout(()=>{if(!down.current)return;long.current=true;if(!session.current)start();},300);},
    onPointerUp:()=>{if(!down.current)return;if(timer.current)clearTimeout(timer.current);down.current=false;suppressClick.current=true;if(long.current)stop();else if(session.current)stop();else start();},
    onClick:()=>{if(suppressClick.current){suppressClick.current=false;return;}if(session.current)stop();else start();},
    onPointerCancel:cancel,onLostPointerCapture:()=>{if(down.current)cancel();},
  };
  return {polishActions,canPolish:connected&&!commandMode,polishing,polishError,cancelPolish,completion,completedId,change,select,replace,edit,history,future,speech,error,setError,polish:!commandMode&&polishActions.length>0&&(polish||!!text.trim()),refine,cancel,voiceProps,online,enableOnline:()=>{setOnline(true);setError('已选择系统在线识别');},selection};
}
