import {activeFileView} from '../../../packages/core/workbuddy-files';
import {demoApps} from '../../../packages/core/interactions';
import {useEffect,useRef,useState} from 'react';
import {Search,PanelsTopLeft} from 'lucide-react';
import {apps,type AppId} from '../../../packages/core/model';
import {command,useRuntime} from './runtime';
import {ConnectionButton} from './connection-access';
import {SwitchButton} from './phone-wechat';
import {InputDock} from './input-dock';
import {usePhoneEditing} from './use-phone-editing';
import {useEditSession} from './use-edit-session';
import {usePhoneInsets} from './phone-insets';
import {AppIcon} from './desktop';
import './phone-desktop.css';
export function PhoneDesktop({result=false}:{result?:boolean}){
 const r=useRuntime(),edit=useEditSession(),area=useRef<HTMLTextAreaElement>(null),[heard,setHeard]=useState(''),done=useRef('');
 const editing=usePhoneEditing(edit.editable?edit.text:heard,edit.editable?edit.change:setHeard,area,edit.editable?edit.identity:'app:'+r.state.app,r.connected,!edit.editable);
 useEffect(()=>{const c=editing.completion;if(!c||done.current===c.id||!c.commandMode)return;done.current=c.id;const t=c.text.replace(/[。！？，\s]/g,'');const app=apps.filter(a=>demoApps.some(id=>id===a[0])).find(a=>t===`打开${a[1]}`||t===`切换到${a[1]}`);if(app)void command('open',app[0]);else if(t==='返回'||t==='退出')void command('back');else if(t==='搜索'&&r.state.app==='desktop')void command('desktop-action','search');else editing.setError('可说“打开微信”“搜索”或“返回”');setHeard('');},[editing.completedId]);
 return <main className={'generic-phone desktop-phone '+(result?'result-phone':'')} style={usePhoneInsets()}><header className="generic-status"><div><b>{result?'WorkBuddy':(r.method==='distributed'?r.distributed.peer:'')||r.state.tabletName||'已连接的大屏'}</b><small>{result?'任务成果':'桌面'} · {r.connected?'已连接':'连接已断开'}</small></div><SwitchButton/><ConnectionButton/></header>
 {!result&&<><nav className="desktop-phone-actions"><button onClick={()=>command('desktop-action','search')}><Search size={20}/>搜索</button><button onClick={()=>command('desktop-action','tasks')}><PanelsTopLeft size={20}/>多任务</button><button onClick={()=>command('desktop-action','escape')}>Esc</button></nav><nav className="desktop-phone-apps">{(['wechat','mail','workbuddy','wps'] as AppId[]).map(id=><button key={id} onClick={()=>command('open',id)}><AppIcon id={id} size={36}/><span>{apps.find(a=>a[0]===id)?.[1]}</span></button>)}</nav></>}
 {result&&<div className="desktop-file-context">{r.state.workbuddy.files.find(f=>f.id===activeFileView(r.state).active)?.name||'任务成果'}</div>}
 {edit.editable&&r.state.target?.id==='desktop-search'&&<section className="desktop-search-editor"><textarea ref={area} aria-label="搜索应用" value={edit.text} onSelect={editing.select} onChange={e=>editing.change(e.target.value)}/></section>}
 <InputDock editing={editing} area={area} editable={edit.editable} initialMode="trackpad" disabled={!r.connected} /></main>;
}
