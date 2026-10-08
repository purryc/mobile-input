import {useEffect,useRef,useState} from 'react';
import {command,currentState,uid} from './runtime';
import type {State} from '../../../packages/core/model';

/** Recognition segments share a caption epoch across slide changes, never a draft. */
export function usePresentationCaptions(s:State,connected:boolean){
 const capture=useRef(''),recognition=useRef(''),sequence=useRef(0),session=useRef(''),restart=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [error,setError]=useState('');
 function cancel(){if(restart.current)clearTimeout(restart.current);restart.current=null;const id=recognition.current;recognition.current='';capture.current='';if(id)window.MobileNative?.cancelRecognition(id);}
 function stop(){const id=capture.current,anchor=session.current;cancel();if(id&&currentState().presentation.session===anchor)void command('present-captions',{session:anchor,id,enabled:false},{app:'slides'});}
 async function update(status:'listening'|'partial'|'final'|'error',text='',message=''){
  const id=capture.current;if(!id)return;
  await command('present-caption-update',{session:session.current,id,sequence:++sequence.current,status,text:text.slice(-120),error:message},{app:'slides'});
 }
 function recognize(){if(!capture.current)return;const id=uid();recognition.current=id;const result=window.MobileNative?.startRecognition(id,false);if(result==='unavailable'){void update('error','','麦克风不可用，请检查权限后重试');cancel();}}
 async function toggle(){
  if(capture.current||s.presentation.captions.enabled){stop();return;}
  setError('');if(!window.MobileNative?.startRecognition){setError('实时字幕需在手机应用中开启');return;}
  if(!connected||!s.presenting)return;
  const id=uid();capture.current=id;session.current=s.presentation.session;sequence.current=0;
  const ack=await command('present-captions',{session:session.current,id,enabled:true},{app:'slides'});
  if(capture.current!==id)return;if(!ack.ok){cancel();return;}recognize();
 }
 useEffect(()=>{
  const receive=(event:Event)=>{const d=(event as CustomEvent).detail;if(!recognition.current||d.sessionId!==recognition.current)return;
   if(d.type==='partial'||d.type==='final')void update(d.type,String(d.text||''));
   if(d.type==='error'){void update('error','',d.message||'麦克风不可用，请重试');cancel();}
   if(d.type==='complete'){recognition.current='';restart.current=setTimeout(recognize,180);}
  };
  const hidden=()=>{if(document.hidden)stop();};const foreground=(event:Event)=>{if(!(event as CustomEvent).detail)stop();};
  window.addEventListener('connection-open',stop);window.addEventListener('native-speech',receive);document.addEventListener('visibilitychange',hidden);window.addEventListener('native-foreground',foreground);
  return()=>{stop();window.removeEventListener('connection-open',stop);window.removeEventListener('native-speech',receive);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('native-foreground',foreground);};
 },[]);
 useEffect(()=>{if(!connected||!s.presenting||s.switcher||session.current&&s.presentation.session!==session.current)stop();},[connected,s.presenting,!!s.switcher,s.presentation.session]);
 // The tablet can invalidate capture before the phone receives a lifecycle event.
 useEffect(()=>{if(capture.current&&s.presentation.captions.id!==capture.current&&s.presentation.captions.status==='off')cancel();},[s.presentation.captions.id]);
 return {toggle,stop,error,clearError:()=>setError('')};
}
