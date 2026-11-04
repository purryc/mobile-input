import {uiText} from './i18n';
import {useEffect,useState,type ReactNode} from 'react';
import {command,currentState,uid,useRuntime} from './runtime';
import {ConnectionButton} from './connection-access';
import './input-session-ui.css';
const client=uid();
export function PhoneConnectionState(){const r=useRuntime();return <main className="session-activation" aria-label={uiText("输入连接状态")}><ConnectionButton/><section><h1>{r.connected?uiText("正在同步大屏"):'连接大屏'}</h1><p>{r.status}</p></section></main>;}
export function InputSessionGate({children}:{children:ReactNode}){
 const r=useRuntime(),a=r.state.inputSession;const [prepared,setPrepared]=useState(false),[foreground,setForeground]=useState(!document.hidden);
 useEffect(()=>{if(!foreground||!r.connected||r.syncing)return;let alive=true,timer:ReturnType<typeof setTimeout>;const register=async()=>{if(currentState().inputSession?.client===client){if(currentState().inputSession?.phase==='paused'&&!document.hidden)await command('input-session-resume',{client});if(alive)setPrepared(true);return;}const ack=await command('input-session-client',{client});if(!alive)return;if(ack.ok&&currentState().inputSession?.client===client)setPrepared(true);else timer=setTimeout(()=>void register(),1500);};void register();return()=>{alive=false;clearTimeout(timer);};},[r.connected,r.syncing,r.state.demoGeneration,a?.client,a?.phase,foreground]);
 useEffect(()=>{const visibility=()=>setForeground(!document.hidden);const native=(e:Event)=>setForeground(Boolean((e as CustomEvent).detail));document.addEventListener('visibilitychange',visibility);window.addEventListener('native-foreground',native);return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('native-foreground',native);};},[]);
 // Only the known visible WorkBuddy composer can be bound without a screen tap.
 const w=r.state.workbuddy;
 useEffect(()=>{if(!prepared||!r.connected||r.syncing||a?.phase!=='active'||r.state.app!=='workbuddy'||r.state.target||w.fileBrowser?.visible||w.previewActive||w.deckPlayback||!['home','task'].includes(w.page)||!w.drafts[w.task])return;void command('wb-focus',{id:'wb:draft:'+w.task,label:'任务输入',automatic:true});},[prepared,r.connected,r.syncing,a?.phase,r.state.app,r.state.target,w.page,w.task,w.previewActive,w.fileBrowser?.visible,w.deckPlayback]);
 if(r.syncing&&!r.refreshing)return null;
 if(!r.linked||!prepared||a?.client!==client)return <PhoneConnectionState/>;
 return <><div style={{display:'contents'}} inert={r.syncing||!foreground} data-controller-syncing={r.syncing}>{children}</div>{!r.syncing&&a.phase==='paused'&&<div className="session-paused" role="status"><span>{uiText("输入已暂停")}</span><button onClick={()=>command('input-session-resume',{client})}>{uiText("继续使用")}</button><ConnectionButton/></div>}</>;
}
