import {isAgentApp} from '../../../packages/core/agent-controller';
import {uiText} from './i18n';
import {type CSSProperties,type ReactNode,useEffect,useRef,useState} from 'react';
import tokens from '../../../docs/liquid-glass-tokens.json';
import {taskStatusLabels,type ControllerSnapshot,type ControllerActions} from '../../../packages/core/phone-controller';
import {ConnectionButton} from './connection-access';
import {usePhoneInsets} from './phone-insets';
import {toast} from './runtime';
import {usePhoneControl} from './phone-control-adapter';
import './phone-controller-frame.css';
export function controllerTheme(app:string,subapp?:string):CSSProperties{
 const name=app==='wechat'?'WeChat':app==='bilibili'?'Bilibili':app==='workbuddy'?'WorkBuddy':app==='wps'?({writer:'Word',sheet:'Sheet',presentation:'Presentation'} as const)[subapp as 'writer']||'System':'System';
 const c=tokens.resolved[name],seed=['codex','chatgpt'].includes(app)?'13 13 13':app==='gemini'?'66 133 244':[c.r,c.g,c.b].map(x=>Math.round(x*255)).join(' ');
 return {'--controller-seed':seed,'--mac-seed':seed,'--input-accent':`rgb(${seed})`,'--dock-accent':`rgb(${seed})`} as CSSProperties;
}
export function ControllerHeader({snapshot:s,actions,beforeSwitch}:{snapshot:ControllerSnapshot;actions:ControllerActions;beforeSwitch?:()=>void}){
 const icon=s.app==='workbuddy'?'workbuddy.svg':['codex','chatgpt'].includes(s.app)?'chatgpt.png':s.app==='wechat'?'wechat.png':null;
 return <header className="controller-header">{icon?<img src={'./assets/apps/'+icon} alt=""/>:isAgentApp(s.app)?<span className="controller-app-monogram" aria-hidden="true">{s.appName.slice(0,1)}</span>:null}<div><b>{s.appName}</b><small>{s.connected?(s.destination==='mac'?uiText(s.connectionLabel)+' · '+s.device:uiText('已连接')+' · '+s.device):uiText(s.connectionLabel)}</small></div><button aria-label={s.destination==='mac'?uiText("切换 Mac 应用"):uiText("切换应用")} disabled={!s.connected||!s.synced} onClick={()=>{beforeSwitch?.();void actions.switchApp().then(r=>{if(!r.ok)toast(r.error||'切换未完成');});}}><img src="./assets/figma/presentation/app-switch.svg" alt=""/></button><ConnectionButton/></header>;
}
export function ControllerTasks({snapshot:s,actions,beforeChange,disabled=false}:{snapshot:ControllerSnapshot;actions:ControllerActions;beforeChange?:()=>void|Promise<unknown>;disabled?:boolean}){
 const lock=useRef(false),list=useRef<HTMLDivElement>(null),[busy,setBusy]=useState(false);
 useEffect(()=>{const active=list.current?.querySelector<HTMLElement>('[aria-current="page"]');if(active)active.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});},[s.currentTask,s.app,s.destination]);
 async function change(id?:string){if(lock.current||disabled||!s.connected)return;lock.current=true;setBusy(true);try{await beforeChange?.();const r=await(id===undefined?actions.newTask():actions.switchTask(id));if(!r.ok)toast(r.error||'任务切换未确认');}finally{lock.current=false;setBusy(false);}}
 return <nav className="controller-tasks" aria-label={s.appName+' '+uiText('任务')}><div className="controller-task-list" ref={list}>{s.tasks.map(t=><button key={t.id} aria-current={s.currentTask===t.id?'page':undefined} disabled={disabled||busy||!s.connected||!s.synced||t.selectable===false||!s.capabilities.includes('switch-task')} onClick={()=>void change(t.id)}><b>{t.title}</b>{t.status&&t.status!=='unknown'&&<small><i data-status={t.status}/>{uiText(taskStatusLabels[t.status]||t.status)}</small>}</button>)}</div><button aria-label={uiText('新建')+' '+s.appName+' '+uiText('任务')} disabled={disabled||busy||!s.connected||!s.synced||!s.capabilities.includes('new-task')} onClick={()=>void change()}><span>＋</span><small>{uiText("新建")}</small></button></nav>;
}
export function PhoneControllerFrame({children,dock,beforeChange,beforeSwitch,disabled=false,className='',tasks=true}:{children:ReactNode;dock?:ReactNode;beforeChange?:()=>void|Promise<unknown>;beforeSwitch?:()=>void;disabled?:boolean;className?:string;tasks?:boolean}){
 const {snapshot,actions}=usePhoneControl(),insets=usePhoneInsets();return <section className={'phone-controller '+(isAgentApp(snapshot.app)?'live-workbuddy ':'')+className} data-controller-app={snapshot.app} data-controller-source={snapshot.destination} data-theme-source={snapshot.app==='codex'?'manual':'registered-fallback'} style={{...insets,...controllerTheme(snapshot.app,snapshot.subapp)}}><ControllerHeader snapshot={snapshot} actions={actions} beforeSwitch={beforeSwitch}/>{tasks&&isAgentApp(snapshot.app)&&<ControllerTasks snapshot={snapshot} actions={actions} beforeChange={beforeChange} disabled={disabled}/>}<div className="controller-body">{children}</div>{dock}</section>;
}
