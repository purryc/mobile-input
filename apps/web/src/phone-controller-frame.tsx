import {type CSSProperties,type ReactNode,useRef,useState} from 'react';
import tokens from '../../../docs/liquid-glass-tokens.json';
import {taskStatusLabels,type ControllerSnapshot,type ControllerActions} from '../../../packages/core/phone-controller';
import {ConnectionButton} from './connection-access';
import {usePhoneInsets} from './phone-insets';
import {toast} from './runtime';
import {usePhoneControl} from './phone-control-adapter';
import './phone-controller-frame.css';
export function controllerTheme(app:string,subapp?:string):CSSProperties{
 const name=app==='workbuddy'?'WorkBuddy':app==='wps'?({writer:'Word',sheet:'Sheet',presentation:'Presentation'} as const)[subapp as 'writer']||'System':'System';
 const c=tokens.resolved[name],seed=app==='codex'?'13 13 13':[c.r,c.g,c.b].map(x=>Math.round(x*255)).join(' ');
 return {'--controller-seed':seed,'--mac-seed':seed,'--input-accent':`rgb(${seed})`,'--dock-accent':`rgb(${seed})`} as CSSProperties;
}
export function ControllerHeader({snapshot:s,actions,beforeSwitch}:{snapshot:ControllerSnapshot;actions:ControllerActions;beforeSwitch?:()=>void}){
 const icon=s.app==='workbuddy'?'workbuddy.svg':s.app==='codex'?'chatgpt.png':null;
 return <header className="controller-header">{icon&&<img src={'./assets/apps/'+icon} alt=""/>}<div><b>{s.appName}</b><small>{s.connected?(s.destination==='mac'?s.connectionLabel+' · '+s.device:'已连接 · '+s.device):s.connectionLabel}</small></div><button aria-label={s.destination==='mac'?'切换 Mac 应用':'切换应用'} disabled={!s.connected||!s.synced} onClick={()=>{beforeSwitch?.();void actions.switchApp().then(r=>{if(!r.ok)toast(r.error||'切换未完成');});}}><img src="./assets/figma/presentation/app-switch.svg" alt=""/></button><ConnectionButton/></header>;
}
export function ControllerTasks({snapshot:s,actions,beforeChange,disabled=false}:{snapshot:ControllerSnapshot;actions:ControllerActions;beforeChange?:()=>void|Promise<unknown>;disabled?:boolean}){
 const lock=useRef(false),[busy,setBusy]=useState(false);
 async function change(id?:string){if(lock.current||disabled||!s.connected)return;lock.current=true;setBusy(true);try{await beforeChange?.();const r=await(id===undefined?actions.newTask():actions.switchTask(id));if(!r.ok)toast(r.error||'任务切换未确认');}finally{lock.current=false;setBusy(false);}}
 return <nav className="controller-tasks" aria-label="WorkBuddy 任务"><div className="controller-task-list">{s.tasks.map(t=><button key={t.id} aria-current={s.currentTask===t.id?'page':undefined} disabled={disabled||busy||!s.connected} onClick={()=>void change(t.id)}><b>{t.title}</b>{t.status&&<small><i data-status={t.status}/>{taskStatusLabels[t.status]||t.status}</small>}</button>)}</div><button aria-label="新建 WorkBuddy 任务" disabled={disabled||busy||!s.connected} onClick={()=>void change()}><span>＋</span><small>新建</small></button></nav>;
}
export function PhoneControllerFrame({children,dock,beforeChange,beforeSwitch,disabled=false,className='',tasks=true}:{children:ReactNode;dock?:ReactNode;beforeChange?:()=>void|Promise<unknown>;beforeSwitch?:()=>void;disabled?:boolean;className?:string;tasks?:boolean}){
 const {snapshot,actions}=usePhoneControl(),insets=usePhoneInsets();return <section className={'phone-controller mac-phone '+(['workbuddy','codex'].includes(snapshot.app)?'live-workbuddy ':'')+className} data-controller-app={snapshot.app} data-controller-source={snapshot.destination} data-theme-source={snapshot.app==='codex'?'manual':'registered-fallback'} style={{...insets,...controllerTheme(snapshot.app,snapshot.subapp)}}><ControllerHeader snapshot={snapshot} actions={actions} beforeSwitch={beforeSwitch}/>{tasks&&snapshot.app==='workbuddy'&&<ControllerTasks snapshot={snapshot} actions={actions} beforeChange={beforeChange} disabled={disabled}/>}<div className="controller-body">{children}</div>{dock}</section>;
}
