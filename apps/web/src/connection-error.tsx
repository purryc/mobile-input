import {useEffect,useRef} from 'react';
import {Unplug} from 'lucide-react';
import './connection-error.css';
export function ConnectionError({device,onDismiss,onReconnect,reconnecting=false}:{device:string;onDismiss:()=>void;onReconnect:()=>void;reconnecting?:boolean}){
 const dialog=useRef<HTMLElement>(null);
 useEffect(()=>{const before=document.activeElement as HTMLElement|null;dialog.current?.focus();return()=>{if(before?.isConnected)before.focus();};},[]);
 return <div className="connection-error-backdrop"><section ref={dialog} className="connection-error-dialog" role="alertdialog" aria-modal="true" aria-labelledby="connection-error-title" aria-describedby="connection-error-body" tabIndex={-1} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onDismiss();}if(e.key==='Tab'){const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]);const index=buttons.indexOf(document.activeElement as HTMLButtonElement);e.preventDefault();buttons[(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}}}>
  <span className="connection-error-symbol"><Unplug size={28}/></span>
  <h2 id="connection-error-title">连接已中断</h2>
  <p id="connection-error-body">与{device||'大屏'}的连接已中断。输入已保留，请重新连接。</p>
  <div className="connection-error-actions"><button onClick={onDismiss}>稍后连接</button><button className="primary" disabled={reconnecting} onClick={onReconnect}>{reconnecting?'正在连接…':'重新连接'}</button></div>
 </section></div>;
}
