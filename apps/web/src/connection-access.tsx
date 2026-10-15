import {GeminiAccount} from './ai-polish';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import {Link2,ScanLine,RefreshCw,X,TabletSmartphone,ChevronRight,Check} from 'lucide-react';
import QRCode from 'qrcode';
import {command,connect,pin,role,useRuntime,selectConnectionMethod,discoverDistributed,connectDistributed,type ConnectionMethod} from './runtime';
import {useBack} from './back';
import {usePhoneInsets} from './phone-insets';

type ConnectionControl={opened:boolean;show:()=>void;entry:RefObject<HTMLButtonElement|null>;status:string;connected:boolean};
const ConnectionContext=createContext<ConnectionControl|null>(null);
export function useConnectionPrompt(){return useContext(ConnectionContext)?.show;}
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
 const inline=(!phone&&r.state.app==='workbuddy'&&!!r.state.workbuddy.fileBrowser?.visible&&!!r.state.workbuddy.fileBrowser.windows.length)||phone&&(r.state.app==='paint'||!['desktop','wechat','slides','mario','bilibili'].includes(r.state.app)&&(r.connected||!!r.state.editSession?.key)||r.state.app==='bilibili'||r.state.app==='slides'||r.state.app==='mario'||r.state.app==='workbuddy'&&r.connected&&!!r.state.target?.id.startsWith('wb:')||r.state.app==='wechat'&&r.connected&&r.state.chat.activation?.phase==='ready');
 function selectMethod(method:ConnectionMethod){selectConnectionMethod(method);if(method==='distributed')discoverDistributed();}
 const host=r.address||location.hostname;
 const status=r.connected?(phone?'已连接工作台':'手机已连接'):r.status;
 function close(){setOpened(false);entry.current?.focus();}
 function show(){if(r.connected)void command('switch-cancel');if(!phone&&r.method==='lan')window.MobileNative?.host(pin);window.dispatchEvent(new Event('connection-open'));setOpened(true);}
 useEffect(()=>{const open=()=>show();window.addEventListener('ai-settings-open',open);return()=>window.removeEventListener('ai-settings-open',open);},[]);
 useBack(()=>{if(!opened)return false;close();return true;},200);
 useEffect(()=>{if(r.address)setAddress(r.address);},[r.address]);
 useEffect(()=>{if(phone&&r.connected&&!priorConnected.current)close();priorConnected.current=r.connected;},[r.connected]);
 useEffect(()=>{if(phone||r.method!=='lan')return;let current=true;QRCode.toDataURL(JSON.stringify({kind:'mobile-input',address:host,pin}),{width:240,margin:1}).then(value=>{if(current)setQr(value);}).catch(()=>{if(current)setQr('');});return()=>{current=false;};},[host,phone,r.method]);
 useEffect(()=>{if(!opened)return;panel.current?.focus();const key=(event:KeyboardEvent)=>{
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
  if(event.key==='Tab'){
   const elements=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href],summary')||[]);const first=elements[0],last=elements.at(-1);
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
    <fieldset className="connection-methods"><legend>连接方式</legend>
     <label className="connection-method" data-selected={r.method==='distributed'}>
      <input type="radio" name="connection-method" value="distributed" checked={r.method==='distributed'} onChange={()=>selectMethod('distributed')}/>
      <span className="method-icon"><TabletSmartphone size={22}/></span><span className="method-copy"><b>鸿蒙分布式</b><small>连接附近的同账号设备</small></span><span className="method-radio" aria-hidden>{r.method==='distributed'&&<i/>}</span>
     </label>
     <label className="connection-method" data-selected={r.method==='lan'}>
      <input type="radio" name="connection-method" value="lan" checked={r.method==='lan'} onChange={()=>selectMethod('lan')}/>
      <span className="method-icon"><ScanLine size={22}/></span><span className="method-copy"><b>扫码网络建联</b><small>同一网络，扫描配对二维码</small></span><span className="method-radio" aria-hidden>{r.method==='lan'&&<i/>}</span>
     </label>
    </fieldset>
    {r.method==='distributed'&&<div className="connection-detail distributed-detail">
     <div className="connection-section-heading"><h3>附近设备</h3><button aria-label="刷新附近设备" disabled={r.distributed.phase==='searching'||r.distributed.phase==='connecting'} onClick={discoverDistributed}><RefreshCw size={18} className={r.distributed.phase==='searching'?'searching':''}/><span>{r.distributed.phase==='searching'?'查找中':'查找设备'}</span></button></div>
     <p role="status">{r.distributed.message||'两端选择鸿蒙分布式后，查找并选择设备。'}</p>
     {r.distributed.devices?.map(device=><button className="distributed-device" key={device.id} disabled={r.distributed.phase==='connecting'||r.distributed.phase==='connected'||r.connected} onClick={()=>connectDistributed(device.id)}><span className="device-icon"><TabletSmartphone size={24}/></span><span><b>{device.name}</b><small>{r.connected&&r.distributed.peer===device.name?'已连接':'Input Agent'}</small></span>{r.connected&&r.distributed.peer===device.name?<Check size={19}/>:<ChevronRight size={19}/>}</button>)}
     {r.distributed.phase==='error'&&<button className="connection-retry" onClick={discoverDistributed}>重新查找</button>}
    </div>}
    {r.method==='lan'&&<div className="connection-detail">{phone?<>
     {window.MobileNative&&<button className="connection-scan primary" onClick={()=>window.MobileNative?.scan()}><ScanLine size={22}/>扫描平板二维码</button>}
     <form className="connect-panel" onSubmit={e=>{e.preventDefault();if(/^\d{6}$/.test(code))connect(address.trim()||location.hostname,code);}}>
      <div className="connection-section-heading"><h3>{window.MobileNative?'手动配对':'网络配对'}</h3>{window.MobileNative&&<button type="button" onClick={()=>window.MobileNative?.discover()} aria-label="重新发现平板"><RefreshCw size={18}/></button>}</div>
      <label>平板地址<input aria-label="平板地址" placeholder={window.MobileNative?'自动发现或扫码':'localhost'} value={address} onChange={e=>setAddress(e.target.value)}/></label>
      <label>配对码<input aria-label="配对码" inputMode="numeric" autoComplete="off" maxLength={6} placeholder="六位配对码" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label>
      <button className="primary" type="submit" disabled={code.length!==6}>连接</button>
     </form>
    </>:<div className="agent-tablet-pair"><h3>用手机扫码连接</h3>{qr&&<img src={qr} width="200" height="200" alt="配对二维码"/>}<span>配对码</span><div className="pair-code">{pin}</div><small>{host}</small></div>}</div>}
    {phone&&<details className="connection-account"><summary>Gemini API</summary><GeminiAccount/></details>}
   </section>
  </div>}
 </div></ConnectionContext.Provider>;
}
