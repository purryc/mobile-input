import {uiText} from './i18n';
import {setUILanguage,useUILanguage,type UILanguage} from './i18n';
import {WebDeckSettings} from './web-deck-settings';
import {ConnectionError} from './connection-error';
import {useControlDestination,selectControlDestination} from './control-destination';
import {connectMac,disconnectMac,resumeMac,useMacLink} from './mac-link';
import {GeminiAccount} from './ai-polish';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode,type RefObject} from 'react';
import {Settings,ScanLine,RefreshCw,X,TabletSmartphone,ChevronRight,Check} from 'lucide-react';
import QRCode from 'qrcode';
import {command,connect,pin,role,useRuntime,toast,selectConnectionMethod,discoverDistributed,connectDistributed,type ConnectionMethod} from './runtime';
import {useBack} from './back';
import {usePhoneInsets} from './phone-insets';

type ConnectionControl={opened:boolean;show:()=>void;entry:RefObject<HTMLButtonElement|null>;status:string;connected:boolean};
const ConnectionContext=createContext<ConnectionControl|null>(null);
export function useConnectionPrompt(){return useContext(ConnectionContext)?.show;}
export function ConnectionButton({className=''}:{className?:string}){
 const control=useContext(ConnectionContext);if(!control)return null;
 const {opened,show,entry,status,connected}=control;
 return <button ref={entry} className={'agent-connection '+className} aria-label={uiText("设置")} title={uiText(status)} aria-expanded={opened} aria-haspopup="dialog" data-connected={connected} onPointerDown={e=>{if(e.pointerType==='touch'&&!opened){e.preventDefault();show();}}} onClick={()=>{if(!opened)show();}}><Settings size={22}/><i aria-hidden/></button>;
}

/** One connection entry survives application changes without unmounting editors. */
export function ConnectionAccess({children}:{children:ReactNode}){
 const destination=useControlDestination(),mac=useMacLink(),language=useUILanguage();
 const r=useRuntime(),phone=role==='phone',insets=usePhoneInsets();
 useEffect(()=>{if(!phone||destination==='demo'&&r.connected)setUILanguage(r.state.uiLanguage||'zh-CN');},[phone,destination,r.connected,r.state.uiLanguage]);
 async function languageChange(value:UILanguage){if(phone&&destination!=='demo'){setUILanguage(value);return;}if(phone&&!r.connected){toast('请先连接平板');return;}const ack=await command('ui-language',value);if(ack.ok)setUILanguage(value);else toast(ack.error||'语言未更新');}
 const [opened,setOpened]=useState(phone&&!r.connected),[address,setAddress]=useState(r.address||''),[code,setCode]=useState(''),[qr,setQr]=useState('');
 const [confirmReset,setConfirmReset]=useState(false),[resetting,setResetting]=useState(false);
 async function reset(){setResetting(true);const ack=await command('demo-reset');if(ack.ok)toast('演示已重置');else setResetting(false);}
 const priorConnected=useRef(r.connected),entry=useRef<HTMLButtonElement>(null),panel=useRef<HTMLElement>(null);
 const real=phone&&destination!=='demo',activeConnected=real?(destination==='mac'&&mac.connected&&mac.synced):r.linked;
 const [failure,setFailure]=useState(false),loss=useRef({connected:activeConnected,destination}),intentional=useRef(false),background=useRef(document.hidden);
 useEffect(()=>{const native=(e:Event)=>{background.current=!(e as CustomEvent).detail;};const visibility=()=>{background.current=document.hidden;};window.addEventListener('native-foreground',native);document.addEventListener('visibilitychange',visibility);return()=>{window.removeEventListener('native-foreground',native);document.removeEventListener('visibilitychange',visibility);};},[]);
 useEffect(()=>{const previous=loss.current;loss.current={connected:activeConnected,destination};if(activeConnected||previous.destination!==destination){setFailure(false);intentional.current=false;return;}if(!phone||!previous.connected||intentional.current||background.current){intentional.current=false;return;}const timer=setTimeout(()=>{if(!background.current){window.dispatchEvent(new Event('connection-open'));setOpened(false);setFailure(true);}},1000);return()=>clearTimeout(timer);},[activeConnected,destination]);
 function reconnectFailure(){if(destination==='mac'&&mac.canResume)resumeMac();else{setFailure(false);show();}}
 const inline=phone||r.state.app==='workbuddy'&&!!r.state.workbuddy.fileBrowser?.visible&&!!r.state.workbuddy.fileBrowser.windows.length;
 function selectMethod(method:ConnectionMethod){selectConnectionMethod(method);if(method==='distributed')discoverDistributed();}
 const host=r.address||location.hostname;
 const status=real?(destination==='mac'?mac.status:'真实鸿蒙应用尚未接通'):r.connected?(phone?'已连接工作台':'手机已连接'):r.status;
 function close(){setOpened(false);entry.current?.focus();}
 function show(){if(!real&&r.connected)void command('switch-cancel');if(!phone&&r.method==='lan')window.MobileNative?.host(pin);window.dispatchEvent(new Event('connection-open'));setOpened(true);}
 useEffect(()=>{const open=()=>show();window.addEventListener('ai-settings-open',open);return()=>window.removeEventListener('ai-settings-open',open);},[]);
 useBack(()=>{if(!opened)return false;close();return true;},200);
 useEffect(()=>{setAddress(real?mac.address:r.address||'');setCode('');},[r.address,destination]);
 useEffect(()=>{if(phone&&activeConnected&&!priorConnected.current)close();priorConnected.current=activeConnected;},[activeConnected]);
 useEffect(()=>{if(phone||r.method!=='lan')return;let current=true;QRCode.toDataURL(JSON.stringify({kind:'mobile-input',address:host,pin}),{width:240,margin:1}).then(value=>{if(current)setQr(value);}).catch(()=>{if(current)setQr('');});return()=>{current=false;};},[host,phone,r.method]);
 useEffect(()=>{if(!opened)return;panel.current?.focus();const key=(event:KeyboardEvent)=>{
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}
  if(event.key==='Tab'){
   const elements=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href],summary')||[]);const first=elements[0],last=elements.at(-1);
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
 };window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[opened]);
 return <ConnectionContext.Provider value={{opened,show,entry,status,connected:activeConnected}}><div className={'agent-shell agent-'+role+(inline?' inline-connection':'')} style={insets}>
  <div className="agent-workspace" inert={opened||failure}>{children}</div>
  {!inline&&<header className="agent-status-area">
   {phone&&<div className="agent-identity"><b>Input Agent</b><span>{uiText(status)}</span></div>}
   <ConnectionButton/>
  </header>}
  {opened&&<div className="scrim agent-connection-scrim" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}>
   <section ref={panel} className="agent-connection-panel" role="dialog" aria-modal="true" aria-labelledby="connection-title" tabIndex={-1} onClick={e=>e.stopPropagation()}>
    <header><h2 id="connection-title">{uiText("设置")}</h2><button aria-label={uiText("关闭连接设置")} onClick={close}><X size={22}/></button></header>
    <fieldset className="settings-language"><legend>{uiText("界面语言")}</legend><label><input type="radio" name="ui-language" checked={language==='zh-CN'} disabled={phone&&destination==='demo'&&!r.connected} onChange={()=>void languageChange('zh-CN')}/>中文</label><label><input type="radio" name="ui-language" checked={language==='en'} disabled={phone&&destination==='demo'&&!r.connected} onChange={()=>void languageChange('en')}/>English</label></fieldset>
    <h3>{uiText("连接")}</h3><div className="agent-link-state" role="status"><i data-connected={activeConnected}/><span>{uiText(status)}</span></div>
    {phone&&<fieldset className="connection-methods connection-destinations"><legend>{uiText("控制目标")}</legend>{([['demo','平板演示','现有九个演示应用'],['mac','Mac 应用','WorkBuddy · Codex · WPS'],['harmony','鸿蒙应用','通过 Mac 桥接 · 尚未接通']] as const).map(([id,label,detail])=><label className="connection-method" data-selected={destination===id} key={id}><input type="radio" name="control-destination" value={id} checked={destination===id} onChange={()=>{if(r.connected&&destination==='demo'){void command('release');void command('input-session-pause');}selectControlDestination(id);setConfirmReset(false);}}/><span className="method-copy"><b>{uiText(label)}</b><small>{uiText(detail)}</small></span><span className="method-radio" aria-hidden>{destination===id&&<i/>}</span></label>)}</fieldset>}
    {real?<section className="connection-detail">
     {destination==='mac'?<><h3>{uiText("连接 Mac")}</h3>{mac.canResume&&!mac.connected&&<button className="connection-retry" onClick={resumeMac}>{uiText("重新连接这台 Mac")}</button>}<p className="connection-mac-note">{uiText("在 Mac 打开“Input Agent 连接”扫码配对。配对后自动重连，USB 优先。")}</p>{window.MobileNative&&<button className="connection-scan primary" onClick={()=>window.MobileNative?.scan()}><ScanLine size={22}/>{uiText("扫描 Mac 二维码")}</button>}<form className="connect-panel" onSubmit={e=>{e.preventDefault();connectMac(address.trim(),code);}}><label>{uiText("Mac 地址")}<input aria-label={uiText("Mac 地址")} value={address} placeholder={mac.address||uiText("同一网络的 Mac 地址")} onChange={e=>setAddress(e.target.value)}/></label><label>{uiText("配对码")}<input aria-label={uiText("Mac 配对码")} inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label><button className="primary" disabled={code.length!==6||!address.trim()}>{uiText("连接 Mac")}</button></form>{mac.connected&&<button className="connection-retry" onClick={()=>{intentional.current=true;disconnectMac();}}>{uiText("断开 Mac")}</button>}</>:<><h3>{uiText("通过 Mac 控制真实平板")}</h3><p className="connection-mac-note">{uiText("入口已准备。真实应用读写适配完成并验证后开放；不会切入演示应用代替真实控制。")}</p></>}
    </section>:<><fieldset className="connection-methods"><legend>{uiText("连接方式")}</legend>
     <label className="connection-method" data-selected={r.method==='distributed'}>
      <input type="radio" name="connection-method" value="distributed" checked={r.method==='distributed'} onChange={()=>selectMethod('distributed')}/>
      <span className="method-icon"><TabletSmartphone size={22}/></span><span className="method-copy"><b>{uiText("鸿蒙分布式")}</b><small>{uiText("连接附近的同账号设备")}</small></span><span className="method-radio" aria-hidden>{r.method==='distributed'&&<i/>}</span>
     </label>
     <label className="connection-method" data-selected={r.method==='lan'}>
      <input type="radio" name="connection-method" value="lan" checked={r.method==='lan'} onChange={()=>selectMethod('lan')}/>
      <span className="method-icon"><ScanLine size={22}/></span><span className="method-copy"><b>{uiText("扫码网络建联")}</b><small>{uiText("同一网络，扫描配对二维码")}</small></span><span className="method-radio" aria-hidden>{r.method==='lan'&&<i/>}</span>
     </label>
    </fieldset>
    {r.method==='distributed'&&<div className="connection-detail distributed-detail">
     <div className="connection-section-heading"><h3>{uiText("附近设备")}</h3><button aria-label={uiText("刷新附近设备")} disabled={r.distributed.phase==='searching'||r.distributed.phase==='connecting'} onClick={discoverDistributed}><RefreshCw size={18} className={r.distributed.phase==='searching'?'searching':''}/><span>{r.distributed.phase==='searching'?uiText("查找中"):uiText("查找设备")}</span></button></div>
     <p role="status">{uiText(r.distributed.message)||uiText("两端选择鸿蒙分布式后，查找并选择设备。")}</p>
     {r.distributed.devices?.map(device=><button className="distributed-device" key={device.id} disabled={r.distributed.phase==='connecting'||r.distributed.phase==='connected'||r.connected} onClick={()=>connectDistributed(device.id)}><span className="device-icon"><TabletSmartphone size={24}/></span><span><b>{device.name}</b><small>{r.connected&&r.distributed.peer===device.name?uiText("已连接"):'Input Agent'}</small></span>{r.connected&&r.distributed.peer===device.name?<Check size={19}/>:<ChevronRight size={19}/>}</button>)}
     {r.distributed.phase==='error'&&<button className="connection-retry" onClick={discoverDistributed}>{uiText("重新查找")}</button>}
    </div>}
    {r.method==='lan'&&<div className="connection-detail">{phone?<>
     {window.MobileNative&&<button className="connection-scan primary" onClick={()=>window.MobileNative?.scan()}><ScanLine size={22}/>{uiText("扫描平板二维码")}</button>}
     <form className="connect-panel" onSubmit={e=>{e.preventDefault();if(/^\d{6}$/.test(code))connect(address.trim()||location.hostname,code);}}>
      <div className="connection-section-heading"><h3>{window.MobileNative?uiText("手动配对"):uiText("网络配对")}</h3>{window.MobileNative&&<button type="button" onClick={()=>window.MobileNative?.discover()} aria-label={uiText("重新发现平板")}><RefreshCw size={18}/></button>}</div>
      <label>{uiText("平板地址")}<input aria-label={uiText("平板地址")} placeholder={window.MobileNative?uiText("自动发现或扫码"):'localhost'} value={address} onChange={e=>setAddress(e.target.value)}/></label>
      <label>{uiText("配对码")}<input aria-label={uiText("配对码")} inputMode="numeric" autoComplete="off" maxLength={6} placeholder={uiText("六位配对码")} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label>
      <button className="primary" type="submit" disabled={code.length!==6}>{uiText("连接")}</button>
     </form>
    </>:<div className="agent-tablet-pair"><h3>{uiText("用手机扫码连接")}</h3>{qr&&<img src={qr} width="200" height="200" alt={uiText("配对二维码")}/>}<span>{uiText("配对码")}</span><div className="pair-code">{pin}</div><small>{host}</small></div>}</div>}
    <section className="connection-reset" aria-label={uiText("重置演示数据")}><h3>{uiText("演示数据")}</h3>
     {confirmReset?<><p>{uiText("清空两端输入历史、消息、任务、材料和文件修改，恢复演示初始内容。连接设置和 API 配置保留。")}</p><div><button disabled={resetting} onClick={()=>setConfirmReset(false)}>{uiText("取消")}</button><button className="reset-confirm" disabled={resetting||phone&&!r.connected} onClick={reset}>{uiText("确认重置")}</button></div></>:<button disabled={phone&&!r.connected} onClick={()=>setConfirmReset(true)}><RefreshCw size={18}/>{uiText("重置演示")}</button>}
     {phone&&!r.connected&&<small>{uiText("连接大屏后可重置两端数据")}</small>}
    </section>
    </>}
    {!phone&&window.MobileNative&&<WebDeckSettings/>}
    {phone&&<details className="connection-account"><summary>{uiText("AI 配置")}</summary><GeminiAccount/></details>}
   </section>
  </div>}
 {failure&&!activeConnected&&<ConnectionError device={destination==='mac'?mac.state?.device||'Mac':r.distributed.peer||'平板'} onDismiss={()=>setFailure(false)} onReconnect={reconnectFailure} reconnecting={destination==='mac'&&mac.status==='正在连接 Mac'}/>}
 </div></ConnectionContext.Provider>;
}
