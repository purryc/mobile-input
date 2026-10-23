import {useEffect,useState,type ReactNode} from 'react';
import {apps} from '../../../packages/core/model';
import {command,currentState,uid,useRuntime} from './runtime';
import {PhoneHome} from './phone-home';
import {ConnectionButton} from './connection-access';
import './input-session-ui.css';
const client=uid();
export function InputSessionGate({children}:{children:ReactNode}){
 const r=useRuntime(),a=r.state.inputSession;const [prepared,setPrepared]=useState(false);
 useEffect(()=>{
  if(!r.connected)return;
  let alive=true,timer:ReturnType<typeof setTimeout>;
  const register=async()=>{
   if(currentState().inputSession?.client===client){if(alive)setPrepared(true);return;}
   const ack=await command('input-session-client',{client});
   if(!alive)return;
   if(ack.ok&&currentState().inputSession?.client===client)setPrepared(true);
   else timer=setTimeout(()=>void register(),1500);
  };
  void register();return()=>{alive=false;clearTimeout(timer);};
 },[r.connected,r.state.demoGeneration]);
 useEffect(()=>{const pause=()=>{if(document.hidden)void command('input-session-pause');else if(currentState().inputSession?.client===client)void command('input-session-resume',{client});};const native=(e:Event)=>{void command((e as CustomEvent).detail?'input-session-resume':'input-session-pause',{client});};document.addEventListener('visibilitychange',pause);window.addEventListener('native-foreground',native);return()=>{document.removeEventListener('visibilitychange',pause);window.removeEventListener('native-foreground',native);};},[]);
 const enabled=prepared&&a?.client===client&&(a.phase==='active'||a.phase==='paused');
 if(enabled)return <>{children}{a.phase==='paused'&&r.connected&&<div className="session-paused" role="status"><span>输入已暂停</span><button onClick={()=>command('input-session-resume',{client})}>继续使用</button><ConnectionButton/></div>}</>;
 if(!prepared||a?.phase!=='pending')return <PhoneHome/>;
 const name=(r.method==='distributed'?r.distributed.peer:'')||r.state.tabletName||'已连接的大屏';
 return <main className="session-activation"><section role="dialog" aria-label="启用手机输入"><small>Agent手机键盘</small><h1>使用手机输入，智能操控电脑</h1><p>{name} · {apps.find(x=>x[0]===r.state.app)?.[1]||'桌面'}</p><img src="./assets/figma/session/activation.png" alt="手机与大屏输入联动示意"/><p className="session-benefit">根据当前场景，提供您最便捷的输入方式。</p><footer><button onClick={()=>command('input-session-dismiss',{id:a.id})}>暂不</button><button disabled={!r.connected} onClick={()=>command('input-session-confirm',{id:a.id})}>开始使用</button></footer></section></main>;
}
