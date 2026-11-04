import {uiText} from './i18n';
import {PhoneControllerFrame} from './phone-controller-frame';
import {preserveMacText} from './mac-text-recovery';
import {toast} from './runtime';
import {PolishControls} from './ai-polish';
import {AgentComposer} from './agent-input-view';
import {Send} from 'lucide-react';
import {LiveWorkBuddyEditor} from './phone-live-workbuddy';
import tokens from '../../../docs/liquid-glass-tokens.json';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ConnectionButton,useConnectionPrompt} from './connection-access';
import {InputDock} from './input-dock';
import {usePhoneEditing} from './use-phone-editing';
import {macCommand,macSnapshot,resumeMac,useMacLink,type MacState} from './mac-link';
import {useControlDestination} from './control-destination';
import './phone-mac.css';
const labels:Record<string,string>={bold:'切换加粗',italic:'切换斜体',underline:'切换下划线','align-left':'左对齐','align-center':'居中','align-right':'右对齐',save:'保存',escape:'退出当前操作'};
// Separate recovery records: a demo reset cannot erase unsynchronized real-app input.
const drafts=new Map<string,string>();
try{Object.entries(JSON.parse(localStorage.getItem('input-agent-mac-protected-input')||'{}')).forEach(([k,v])=>{if(typeof v==='string')drafts.set(k,v);});}catch{}
function remember(key:string,text:string){drafts.set(key,text);try{localStorage.setItem('input-agent-mac-protected-input',JSON.stringify(Object.fromEntries([...drafts].slice(-30))));}catch{}}
export function PhoneMac(){const link=useMacLink(),destination=useControlDestination(),show=useConnectionPrompt();
 if(destination==='harmony')return <PhoneControllerFrame tasks={false}><div className="mac-empty"><h2>{uiText("鸿蒙应用尚未接通")}</h2><button onClick={show}>{uiText("连接设置")}</button></div></PhoneControllerFrame>;
 if(link.state?.app==='workbuddy'&&!link.state.locked)return <LiveWorkBuddyEditor/>;
 return <MacEditor agent={link.state?.app==='codex'}/>;
}
function MacEditor({agent=false}:{agent?:boolean}){const link=useMacLink(),s=link.state,area=useRef<HTMLTextAreaElement>(null),show=useConnectionPrompt();
 const [text,setText]=useState(''),[error,setError]=useState(''),[awaiting,setAwaiting]=useState(false),[busy,setBusy]=useState(false);
 const binding=useRef<MacState|null>(null),value=useRef(''),base=useRef(''),dirty=useRef(false),inflight=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null),generation=useRef(0),waiting=useRef(false);
 const target=s?`${s.window}/${s.target}`:'disconnected';
 const recoveryKey=s?`${s.app}/${s.windowTitle}/${s.target}`:'';
 const known=s?.app==='codex'||s?.app==='wps';const editable=!!s?.capabilities.includes('insert-text');
 const adopt=(remote:MacState)=>{if(remote.target!==binding.current?.target||remote.window!==binding.current?.window||!remote.textKnown)return;preserveMacText(recoveryKey,value.current,remote.text);if(dirty.current&&value.current!==remote.text)toast('已同步 Mac 最新内容，手机输入已保留副本');dirty.current=false;waiting.current=false;setAwaiting(false);base.current=remote.text;value.current=remote.text;setText(remote.text);remember(recoveryKey,remote.text);setError('');};
 const flush=async()=>{const current=binding.current;if(!current?.editable||!dirty.current||inflight.current||(!macSnapshot().connected||!macSnapshot().synced)||awaiting)return;const snapshot=value.current,expected=base.current,epoch=generation.current;dirty.current=false;inflight.current=true;setBusy(true);const result=await macCommand('replace-text',{text:snapshot,base:expected,selection:[area.current?.selectionStart??snapshot.length,0]},current);inflight.current=false;setBusy(false);if(epoch!==generation.current)return;if(result.ok&&result.outcome==='verified'){base.current=snapshot;setError('');if(dirty.current)void flushRef.current();}else{dirty.current=true;waiting.current=true;setAwaiting(true);if(result.state)adopt(result.state);else setError(result.error||'正在核对 Mac 内容');}};
 const flushRef=useRef(flush);flushRef.current=flush;
 const change=(next:string)=>{value.current=next;setText(next);dirty.current=true;remember(recoveryKey,next);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void flushRef.current(),160);};
 const editing=usePhoneEditing(text,change,area,target,link.connected&&link.synced&&editable,false,{target:{app:agent?'workbuddy':s?.subapp==='writer'?'word':s?.subapp==='sheet'?'sheet':'slides',id:target,kind:s?.subapp==='sheet'?'number':'text'},stamp:()=>JSON.stringify([macSnapshot().session,macSnapshot().state?.window,macSnapshot().state?.target,macSnapshot().state?.text])});
 useEffect(()=>{const prior=binding.current;if(prior&&dirty.current)remember(`${prior.app}/${prior.windowTitle}/${prior.target}`,value.current);generation.current++;if(timer.current)clearTimeout(timer.current);binding.current=s;dirty.current=false;setAwaiting(false);setError('');base.current=s?.text||'';const saved=drafts.get(recoveryKey);value.current=s?.textKnown?s.text:(saved||'');setText(value.current);const range=s?.selection||[0,0];editing.selection.current={start:Math.min(range[0],value.current.length),end:Math.min(range[0]+range[1],value.current.length)};requestAnimationFrame(()=>area.current?.setSelectionRange(editing.selection.current.start,editing.selection.current.end));if(saved!==undefined&&s?.textKnown)preserveMacText(recoveryKey,saved,s.text);waiting.current=false;},[target]);
 useEffect(()=>{if(!s||binding.current?.target!==s.target||binding.current?.window!==s.window)return;binding.current=s;if(!link.connected||!link.synced||!s.textKnown||inflight.current)return;if(waiting.current||s.text!==base.current)adopt(s);},[s,link.connected,link.synced]);
 useEffect(()=>{if(!link.connected){generation.current++;if(timer.current)clearTimeout(timer.current);waiting.current=true;setAwaiting(true);if(dirty.current)remember(recoveryKey,value.current);}},[link.connected]);
 useEffect(()=>()=>{generation.current++;if(timer.current)clearTimeout(timer.current);},[]);
 async function action(name:string){if(busy||awaiting)return;setBusy(true);const r=await macCommand('shortcut',{action:name,base:base.current},s);setBusy(false);setError(r.ok?'':r.error||'操作未确认');}
 async function insert(){if(busy||!text)return;setBusy(true);const r=await macCommand('insert-text',{text},s);setBusy(false);if(r.ok){dirty.current=false;value.current='';setText('');remember(recoveryKey,'');}setError(r.ok?'已发送输入，请在 Mac 核对':r.error||'输入未确认');}
 const sub=s?.subapp;const mode=sub==='writer'?'Word':sub==='sheet'?'Sheet':sub==='presentation'?'Presentation':'System';
 return <PhoneControllerFrame className={agent?'mac-agent-codex':''} tasks={false} dock={<InputDock area={area} editing={editing} undo={!text&&s?.capabilities.includes('undo')?()=>void action('undo'):undefined} redo={!text&&s?.capabilities.includes('redo')?()=>void action('redo'):undefined} editable={editable} voiceDisabled={!link.connected||!editable} onVoiceUnavailable={show} initialMode="trackpad" onSelectionEdit={a=>void action(a==='all'?'select-all':a)} remote={{connected:link.connected&&!!s?.capabilities.includes('pointer'),scope:`mac/${link.session}/${s?.window}`,target,position:s?.pointer,sendPointer:v=>macCommand('pointer',v as Record<string,unknown>,s)}}/>}><main data-theme={mode} className={agent?'live-wb-main':undefined}>
  {!agent&&<nav className="mac-apps"><button disabled={!link.connected} onClick={()=>void macCommand('activate',{app:'workbuddy'})}>WorkBuddy</button><button disabled={!link.connected} onClick={()=>void macCommand('activate',{app:'codex'})}>Codex</button><button disabled={!link.connected} onClick={()=>void macCommand('activate',{app:'wps'})}>WPS</button></nav>}
  {!link.connected?<div className="mac-empty"><h2>{uiText("连接你的 Mac")}</h2><p>{link.status}</p>{link.canResume&&<button onClick={resumeMac}>{uiText("重新连接")}</button>}<button onClick={show}>{uiText("打开连接设置")}</button></div>:s?.locked?<div className="mac-empty"><h2>{uiText("请解锁 Mac")}</h2><p>{uiText("解锁后回到 WorkBuddy 的输入框。")}</p></div>:!s?.permission?<div className="mac-empty"><h2>{uiText("允许辅助功能")}</h2><p>{uiText("在 Mac 系统设置中允许 Input Agent Bridge，然后重新连接。")}</p></div>:<>
   <p className="mac-target">{s.windowTitle||'选择输入位置'}</p>
   {editable?<AgentComposer className="mac-composer" footer={<>{!s.editable&&<button disabled={busy||!text||awaiting} onClick={()=>void insert()}>{uiText("输入到 Mac")}</button>}{s.capabilities.includes('submit')&&<button aria-label={uiText("发送到 Codex")} disabled={busy||dirty.current||!text||awaiting} onClick={()=>void action('submit')}><Send size={22}/>{uiText("发送")}</button>}</>}><textarea ref={area} inputMode="none" aria-label={uiText("Mac 输入")} value={text} onChange={e=>{editing.change(e.target.value);editing.select();}} onSelect={editing.select}/></AgentComposer>:known&&<p className="mac-empty">{uiText("在电脑上点击可编辑位置，手机会显示相应输入。")}</p>}
   {!agent&&<div className="mac-actions">{s.capabilities.filter(c=>labels[c]).map(c=><button key={c} disabled={busy||awaiting} onClick={()=>void action(c)}>{labels[c]}</button>)}</div>}
  </>}
  {editable&&editing.polish&&<PolishControls editing={editing}/>}
  {error&&<p className="mac-error" role="status">{error}</p>}

 </main></PhoneControllerFrame>;
}
