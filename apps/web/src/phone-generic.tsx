import {PolishControls} from './ai-polish';
import {useRef} from 'react';
import * as I from 'lucide-react';
import {apps} from '../../../packages/core/model';
import {useRuntime,command} from './runtime';
import {useEditSession} from './use-edit-session';
import {usePhoneEditing} from './use-phone-editing';
import {InputDock} from './input-dock';
import {ConnectionButton} from './connection-access';
import {SwitchButton} from './phone-wechat';
import {AppIcon} from './desktop';
import {usePhoneInsets} from './phone-insets';
import './phone-generic.css';
export function PhoneGeneric(){const r=useRuntime(),s=r.state,edit=useEditSession(),area=useRef<HTMLTextAreaElement>(null),editing=usePhoneEditing(edit.text,edit.change,area,edit.identity+':'+edit.epoch,r.connected&&edit.editable&&!edit.conflict),active=apps.find(a=>a[0]===s.app);
 return <main className="generic-phone" style={usePhoneInsets()}><header className="generic-status"><AppIcon id={s.app} size={32}/><div><b>{active?.[1]||'工作台'}</b><small>{r.connected?'已连接':'连接已断开'}</small></div><SwitchButton/><ConnectionButton/></header><div className="generic-main">
 {edit.editable||edit.conflict||s.editSession?.focus==='unknown'&&!!s.editSession.key?<section className="generic-editor"><header>{s.target?.label||'原编辑位置'}</header>{edit.conflict&&<div className="edit-conflict">输入已保留<button disabled={!r.connected} onClick={()=>edit.recover(false)}>采用平板内容</button><button disabled={!r.connected} onClick={()=>edit.recover(true)}>恢复手机内容</button></div>}<textarea ref={area} aria-label="手机输入草稿" inputMode={s.target?.kind==='number'?'decimal':'text'} value={edit.text} onSelect={editing.select} onChange={e=>{editing.selection.current={start:e.target.selectionStart,end:e.target.selectionEnd};editing.change(e.target.value);}}/>{editing.polish&&<PolishControls editing={editing}/>}
 {s.app==='mail'&&s.texts.composing==='1'&&<button disabled={edit.busy||edit.blocked||!s.draft.trim()||!s.recipient.includes('@')} onClick={()=>command('mail-send')}><I.Send/>发送邮件</button>}{['doubao','xiaoyi'].includes(s.app)&&<button disabled={edit.busy||edit.blocked||!edit.text.trim()} onClick={()=>command('chat-send',s.target?.id)}><I.Send/>发送</button>}</section>:<section className="generic-shortcuts"><h2>{active?.[1]||'工作台'}</h2>{s.app==='mail'&&<><button onClick={()=>command('mail-compose','new')}>撰写邮件</button><button onClick={()=>command('mail-compose','reply')}>回复当前邮件</button></>}{s.app==='workbuddy'&&<><button onClick={()=>command('wb-input-task',{action:'new'})}>新建任务</button>{s.workbuddy.tasks.map(t=><button key={t.id} onClick={()=>command('wb-input-task',{id:t.id})}>{t.title}</button>)}</>}{s.app==='word'&&s.paragraphs.map((text,i)=><button key={i} onClick={()=>command('select',{id:`paragraph:${i}`,kind:'text',label:`第 ${i+1} 段`,value:text})}>{text.slice(0,45)}</button>)}{s.app==='desktop'&&<p>已连接工作台</p>}</section>}
 {s.app==='notes'&&<section className="generic-note-tools"><label>画笔大小 {s.brush} px<input aria-label="笔记笔刷大小" type="range" min="1" max="40" value={s.brush} onChange={e=>command('brush',Number(e.target.value))}/></label><input aria-label="笔记颜色" type="color" value={s.color} onChange={e=>command('color',e.target.value)}/><button onClick={()=>command('eraser',!s.eraser)}>{s.eraser?'画笔':'橡皮'}</button><button onClick={()=>command('undo-stroke')}>撤销笔迹</button></section>}{s.app==='sheet'&&<button className="generic-refresh" onClick={()=>command('report-refresh')}>更新汇报数据</button>}
 </div><InputDock editing={editing} area={area} editable={edit.editable} disabled={!r.connected||edit.conflict} voiceDisabled={!edit.editable}/></main>;
}
