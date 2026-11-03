import {toast} from './runtime';
import {type ReactNode} from 'react';
import {ConnectionButton} from './connection-access';
import {macCommand} from './mac-link';
export function MacAppSwitch({connected}:{connected:boolean}){
 return <button aria-label="切换 Mac 应用" disabled={!connected} onClick={()=>{void macCommand('app-switch',{action:'next'}).then(r=>{if(!r.ok)toast(r.error||'应用切换未完成');});}}><img src="./assets/figma/presentation/app-switch.svg" alt=""/></button>;
}
export function MacAgentHeader({app,device,status,connected}:{app:'codex'|'workbuddy';device:string;status:string;connected:boolean}){
 return <header>{app==='workbuddy'?<img src="./assets/apps/workbuddy.svg" alt=""/>:<img src="./assets/apps/chatgpt.png" alt=""/>}<div><b>{app==='codex'?'Codex':'WorkBuddy'}</b><small>{connected?(status.includes('USB')?'USB 已连接 · ':status.includes('无线')?'无线已连接 · ':'已连接 · ')+device:status}</small></div><MacAppSwitch connected={connected}/><ConnectionButton/></header>;
}
export function MacAgentTasks({title,connected,children,create}:{title:string;connected:boolean;children?:ReactNode;create?:ReactNode}){
 return <nav className="live-wb-tasks"><div className="live-wb-task-list"><div aria-current="page"><b>{title}</b><small>{connected?'正在编辑':'连接已断开'}</small></div>{children}</div>{create}</nav>;
}
export function MacAgentComposer({children,footer,busy=false,className=''}:{children:ReactNode;footer?:ReactNode;busy?:boolean;className?:string}){
 return <section className={'live-wb-composer '+className} inert={busy}><div className="live-wb-scroll">{children}</div>{footer&&<footer>{footer}</footer>}</section>;
}
