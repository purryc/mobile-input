import {useEffect,useState} from 'react';
import {uid} from './runtime';
import type {usePhoneEditing} from './use-phone-editing';
import './ai-polish.css';
import {GEMINI_POLISH_MODEL} from '../../../packages/core/gemini-polish';
export function requestPolish(text:string,style:string,signal:AbortSignal):Promise<string>{
 return new Promise((resolve,reject)=>{
  if(!window.MobileNative?.polish){reject(new Error('请在手机 Input Agent 中配置 Gemini API 后使用'));return;}
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
 return <div className="real-polish"><span>{editing.polishing?'正在润色…':'AI润色'}</span>{editing.polishing?<button onClick={editing.cancelPolish}>取消</button>:editing.polishActions.map(k=><button key={k.id} disabled={!editing.canPolish||editing.speech!=='idle'} onPointerDown={e=>e.preventDefault()} onClick={()=>void editing.refine(k.id)}>{k.label}</button>)}{editing.polishError&&<div role="alert" className="polish-error">{editing.polishError}<button onClick={()=>window.dispatchEvent(new Event('ai-settings-open'))}>Gemini 设置</button></div>}</div>;
}
interface AiStatus {connected:boolean;pending:boolean;model:string;error:string;verified?:boolean;}
export function GeminiAccount(){
 const [status,setStatus]=useState<AiStatus>({connected:false,pending:false,model:GEMINI_POLISH_MODEL,error:''});
 const [key,setKey]=useState(''),[model,setModel]=useState(GEMINI_POLISH_MODEL),[message,setMessage]=useState('');
 useEffect(()=>{const update=(e:Event)=>{const next=(e as CustomEvent<AiStatus>).detail;setStatus(next);setModel(next.model||GEMINI_POLISH_MODEL);};window.addEventListener('native-ai-status',update);window.MobileNative?.aiControl?.('status');return()=>window.removeEventListener('native-ai-status',update);},[]);
 const save=()=>{const result=window.MobileNative?.aiConfigure?.(key,model);if(result==='saved'){setKey('');setMessage('已安全保存');}else setMessage('配置未保存，请检查输入并保持手机解锁');};
 return <section className="gemini-account"><header><b>AI润色 · Gemini</b><span>{status.pending?'正在验证…':status.connected?(status.verified?'已验证':'已配置'):'未配置'}</span></header><label>API 密钥<input aria-label="Gemini API 密钥" type="password" autoComplete="off" spellCheck={false} value={key} placeholder={status.connected?'更换密钥':'输入 API 密钥'} onChange={e=>setKey(e.target.value)}/></label><label>模型<input aria-label="Gemini 模型" value={model} onChange={e=>setModel(e.target.value)}/></label>{(status.error||message)&&<p role="status">{status.error||message}</p>}<div><button disabled={!key.trim()||!window.MobileNative?.aiConfigure} onClick={save}>保存密钥</button>{status.connected&&<button disabled={status.pending} onClick={()=>{setMessage('');window.MobileNative?.aiControl?.('verify');}}>测试润色</button>}{status.connected&&<button onClick={()=>{window.MobileNative?.aiControl?.('logout');setKey('');setMessage('');}}>移除密钥</button>}</div></section>;
}
