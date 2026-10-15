import {useEffect,useState} from 'react';
import {uid} from './runtime';
import type {usePhoneEditing} from './use-phone-editing';
import './ai-polish.css';
export function requestPolish(text:string,style:string,signal:AbortSignal):Promise<string>{
 return new Promise((resolve,reject)=>{
  if(!window.MobileNative?.polish){reject(new Error('请在手机 Input Agent 中登录 ChatGPT 后使用'));return;}
  const id=uid();let timer:ReturnType<typeof setTimeout>;
  const cleanup=()=>{clearTimeout(timer);window.removeEventListener('native-polish',listener);signal.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();window.MobileNative?.cancelPolish?.(id);reject(new DOMException('已取消','AbortError'));};
  const listener=(event:Event)=>{const d=(event as CustomEvent).detail;if(d.id!==id)return;cleanup();if(d.ok&&typeof d.text==='string'&&d.text.trim())resolve(d.text);else reject(new Error(d.error||'润色未完成，原文已保留'));};
  if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});window.addEventListener('native-polish',listener);
  timer=setTimeout(()=>{cleanup();window.MobileNative?.cancelPolish?.(id);reject(new Error('润色超时，原文已保留，请重试'));},90000);
  if(window.MobileNative.polish(id,text,style)!=='pending'){cleanup();reject(new Error('润色暂不可用，请保持应用在前台'));}
 });
}
export function PolishControls({editing}:{editing:ReturnType<typeof usePhoneEditing>}){
 return <div className="real-polish"><span>{editing.polishing?'正在润色…':'AI润色'}</span>{editing.polishing?<button onClick={editing.cancelPolish}>取消</button>:editing.polishActions.map(k=><button key={k.id} disabled={!editing.canPolish||editing.speech!=='idle'} onPointerDown={e=>e.preventDefault()} onClick={()=>void editing.refine(k.id)}>{k.label}</button>)}{editing.polishError&&<div role="alert" className="polish-error">{editing.polishError}<button onClick={()=>window.dispatchEvent(new Event('chatgpt-open'))}>ChatGPT 账号</button></div>}</div>;
}
interface AiStatus {connected:boolean;pending:boolean;email:string;model:string;error:string;}
export function ChatGptAccount(){
 const [status,setStatus]=useState<AiStatus>({connected:false,pending:false,email:'',model:'',error:''});
 useEffect(()=>{const update=(e:Event)=>setStatus((e as CustomEvent<AiStatus>).detail);window.addEventListener('native-ai-status',update);window.MobileNative?.aiControl?.('status');return()=>window.removeEventListener('native-ai-status',update);},[]);
 return <section className="chatgpt-account"><header><b>AI润色 · ChatGPT</b><span>{status.connected?'已登录':status.pending?'等待授权':'未登录'}</span></header>{status.connected&&<small>{status.email}{status.model?' · '+status.model:''}</small>}{status.error&&<p role="alert">{status.error}</p>}<div>{status.pending?<button onClick={()=>window.MobileNative?.aiControl?.('cancel')}>取消登录</button>:<button disabled={!window.MobileNative?.aiControl} onClick={()=>window.MobileNative?.aiControl?.('login')}>{status.connected?'重新登录':'使用 ChatGPT 继续'}</button>}{status.connected&&<button onClick={()=>window.MobileNative?.aiControl?.('logout')}>退出登录</button>}</div></section>;
}
