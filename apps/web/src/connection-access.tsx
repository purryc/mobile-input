import {createContext,useContext,useEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import {Link2,ScanLine,RefreshCw,X} from 'lucide-react';
import QRCode from 'qrcode';
import {command,connect,pin,role,useRuntime} from './runtime';
import {useBack} from './back';
import {usePhoneInsets} from './phone-insets';

type ConnectionControl={opened:boolean;show:()=>void;entry:RefObject<HTMLButtonElement|null>;status:string;connected:boolean};
const ConnectionContext=createContext<ConnectionControl|null>(null);
export function ConnectionButton({className=''}:{className?:string}){
 const control=useContext(ConnectionContext);if(!control)return null;
 const {opened,show,entry,status,connected}=control;
 return <button ref={entry} className={'agent-connection '+className} aria-label="连接设置" title={status} aria-expanded={opened} aria-haspopup="dialog" data-connected={connected} onPointerDown={e=>{if(e.pointerType==='touch'&&!opened){e.preventDefault();show();}}} onClick={()=>{if(!opened)show();}}><Link2 size={22}/><i aria-hidden/></button>;
}

/** One connection entry survives application changes without unmounting editors. */
export function ConnectionAccess({children}:{children:ReactNode}){
 const r=useRuntime(),phone=role==='phone',insets=usePhoneInsets();
 const [opened,setOpened]=useState(phone&&!r.connected),[address,setAddress]=useState(r.address||''),[code,setCode]=useState(''),[qr,setQr]=useState('');
 const priorConnected=useRef(r.connected),entry=useRef<HTMLButtonElement>(null),panel=useRef<HTMLElement>(null);
 const inline=phone&&(r.state.app==='slides'||r.state.app==='mario'||r.state.app==='workbuddy'&&r.connected&&!!r.state.target?.id.startsWith('wb:')||r.state.app==='wechat'&&r.connected&&r.state.chat.activation?.phase==='ready');
 const host=r.address||location.hostname;
 const status=r.connected?(phone?'已连接工作台':'手机已连接'):r.status;
 function close(){setOpened(false);entry.current?.focus();}
 function show(){if(r.connected)void command('switch-cancel');window.dispatchEvent(new Event('connection-open'));setOpened(true);}
 useBack(()=>{if(!opened)return false;close();return true;},200);
 useEffect(()=>{if(r.address)setAddress(r.address);},[r.address]);
 useEffect(()=>{if(phone&&r.connected&&!priorConnected.current)close();priorConnected.current=r.connected;},[r.connected]);
 useEffect(()=>{if(phone)return;let current=true;QRCode.toDataURL(JSON.stringify({kind:'mobile-input',address:host,pin}),{width:240,margin:1}).then(value=>{if(current)setQr(value);}).catch(()=>{if(current)setQr('');});return()=>{current=false;};},[host,phone]);
 useEffect(()=>{if(!opened)return;panel.current?.focus();const key=(event:KeyboardEvent)=>{
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
  if(event.key==='Tab'){
   const elements=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href]')||[]);const first=elements[0],last=elements.at(-1);
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
 };window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[opened]);
 return <ConnectionContext.Provider value={{opened,show,entry,status,connected:r.connected}}><div className={'agent-shell agent-'+role+(inline?' inline-connection':'')} style={insets}>
  <div className="agent-workspace" inert={opened}>{children}</div>
  {!inline&&<header className="agent-status-area">
   {phone&&<div className="agent-identity"><b>Input Agent</b><span>{status}</span></div>}
   <ConnectionButton/>
  </header>}
  {opened&&<div className="scrim agent-connection-scrim" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}>
   <section ref={panel} className="agent-connection-panel" role="dialog" aria-modal="true" aria-labelledby="connection-title" tabIndex={-1} onClick={e=>e.stopPropagation()}>
    <header><h2 id="connection-title">设备连接</h2><button aria-label="关闭连接设置" onClick={close}><X size={22}/></button></header>
    <div className="agent-link-state" role="status"><i data-connected={r.connected}/><span>{status}</span></div>
    {phone?<form className="connect-panel" onSubmit={e=>{e.preventDefault();if(/^\d{6}$/.test(code))connect(address.trim()||location.hostname,code);}}>
     <label>平板地址<input aria-label="平板地址" placeholder={window.MobileNative?'自动发现或扫码':'localhost'} value={address} onChange={e=>setAddress(e.target.value)}/></label>
     <label>配对码<input aria-label="配对码" inputMode="numeric" autoComplete="off" maxLength={6} placeholder="六位配对码" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label>
     <button className="primary" type="submit" disabled={code.length!==6}>连接</button>
     {window.MobileNative&&<div className="connect-actions"><button type="button" onClick={()=>window.MobileNative?.scan()}><ScanLine size={20}/>扫码连接</button><button type="button" onClick={()=>window.MobileNative?.discover()}><RefreshCw size={18}/>重新发现</button></div>}
    </form>:<div className="agent-tablet-pair">{qr&&<img src={qr} width="220" height="220" alt="配对二维码"/>}<span>配对码</span><div className="pair-code">{pin}</div><small>{host}</small></div>}
   </section>
  </div>}
 </div></ConnectionContext.Provider>;
}
