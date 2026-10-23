import {clipboardRead,clipboardWrite} from './phone-native';
import {PolishControls} from './ai-polish';
import {InputDock} from './input-dock';
import {useEffect,useRef,useState} from 'react';
import * as I from 'lucide-react';
import {objectContext} from '../../../packages/core/workbuddy-object';
import {command,currentState,useRuntime} from './runtime';
import {useWorkBuddyInput} from './workbuddy-input';
import {usePhoneEditing} from './use-phone-editing';
import {usePhoneInsets} from './phone-insets';
import {SwitchButton} from './phone-wechat';
import {ConnectionButton,useConnectionPrompt} from './connection-access';
import {WorkBuddyColorPicker} from './workbuddy-color-picker';
import './phone-workbuddy-adaptive.css';
import './phone-object-format.css';
export function PhoneWorkBuddyObject(){
 const openConnection=useConnectionPrompt(),r=useRuntime(),s=r.state,t=s.target!,o=objectContext(s)!,file=s.workbuddy.files.find(f=>f.id===o.file)!,editor=useWorkBuddyInput(t.id,t.label),area=useRef<HTMLTextAreaElement>(null),editing=usePhoneEditing(editor.text,editor.update,area,t.id+':'+t.revision,r.connected&&!editor.blocked);
 const [tool,setTool]=useState<'color'|'link'|null>(null),[instruction,setInstruction]=useState(!!editor.text),[error,setError]=useState(''),[busy,setBusy]=useState(false),[link,setLink]=useState(o.style.href||''),[hex,setHex]=useState(o.style.color||'#122D39');
 const operations=useRef(Promise.resolve()),anchor={app:'workbuddy' as const,targetId:t.id,targetRevision:t.revision};
 useEffect(()=>{setHex(o.style.color||'#122D39');},[o.style.color]);
 useEffect(()=>{setTool(null);setInstruction(!!editor.text);},[t.revision]);
 function format(style:Record<string,unknown>){operations.current=operations.current.then(async()=>{const state=currentState(),context=objectContext(state);if(!context||state.target?.id!==t.id||state.target.revision!==t.revision)return;const ack=await command('wb-object-style',{style,revision:context.revision},anchor);setError(ack.ok?'':ack.error||'格式未更新');});}
 async function selectionEdit(action:string){const original=objectContext(currentState());if(!original)return;const revision=original.revision;try{if(action==='all'){await command('wb-object-select',{view:o.view,file:o.file,path:o.path,label:t.label});return;}if(action==='copy'||action==='cut')await clipboardWrite(original.source);if(action==='copy')return;const text=action==='paste'?await clipboardRead():'';if(!['cut','paste','delete'].includes(action))return;const ack=await command('wb-object-replace',{revision,text},anchor);if(!ack.ok)setError(ack.error||'选区已变化，原内容已保留');}catch(e){setError(e instanceof Error?e.message:'剪贴板不可用，原内容已保留');}}
 async function send(){setBusy(true);editing.cancel();try{await operations.current;await editor.flush();const state=currentState();if(state.target?.id!==t.id||state.target.revision!==t.revision)return;const d=state.workbuddy.entityDrafts[t.id],ack=await command('wb-submit',{revision:d.revision,text:editor.text},anchor);setError(ack.ok?'':ack.error||'修改未完成');if(ack.ok)setInstruction(false);}finally{setBusy(false);}}
 const field=o.path.endsWith('/title')?'标题':'正文',pt=Math.round((o.style.size||(field==='标题'?36:24))*.75*100)/100;
 const toggleStyle=(key:'bold'|'italic'|'underline'|'strike')=>format({[key]:o.mixed?.includes(key)?true:!o.style[key]});
 return <main className="bili-phone wb-adaptive-phone wb-object-phone" style={usePhoneInsets()}>
 <header className="adaptive-status"><img src="./assets/apps/workbuddy.svg" alt=""/><div><b>WorkBuddy</b><small>{r.connected?'已连接':'连接已断开'}</small></div><SwitchButton beforeSwitch={editing.cancel}/><ConnectionButton/></header>
 <nav className="wb-adaptive-tasks"><div className="wb-task-strip"><button className="current"><span>{s.workbuddy.tasks.find(x=>x.files.includes(file.id))?.title||file.name}</span><small>编辑中</small></button><button onClick={()=>command('wb-material-task')}><span>票据汇总</span><small>材料与批准</small></button></div><button aria-label="新建输入任务" onClick={()=>command('wb-input-task',{action:'new'})}><I.Plus/><small>新建</small></button></nav>
 <div className="wb-adaptive-middle"><section className="wb-selection-context"><small>{file.name} · 第 {Number(o.path.split('/')[1])+1} 页 · {field}</small><p>{o.source}</p></section>
 <section className="wb-selection-format" aria-label="选区格式">
 {tool==='color'?<><header><b>文字颜色</b><button aria-label="关闭颜色面板" onClick={()=>setTool(null)}><I.X/></button></header><div className="wb-selection-presets">{['#122D39','#E72A2F','#0754FF','#0A8C6A','#FFFFFF'].map(color=><button key={color} aria-label={'文字颜色 '+color} onClick={()=>format({color})}><i style={{background:color}}/></button>)}</div><WorkBuddyColorPicker value={o.style.color||'#122D39'} onChange={color=>format({color})} onActive={()=>{}}/><input className="wb-selection-hex" aria-label="文字颜色 HEX" value={hex} onChange={e=>{setHex(e.target.value);if(/^#[0-9a-f]{6}$/i.test(e.target.value))format({color:e.target.value});}}/></>:tool==='link'?<><header><b>链接</b><button aria-label="关闭链接面板" onClick={()=>setTool(null)}><I.X/></button></header><input aria-label="链接地址" type="url" placeholder="https://" value={link} onChange={e=>setLink(e.target.value)}/><footer><button onClick={()=>{if(link&&!/^(https?:\/\/|mailto:)/i.test(link)){setError('请输入完整的网页或邮件链接');return;}format({href:link});setTool(null);}}>确认</button></footer></>:<>
 <div className="wb-style-buttons">{([[I.Bold,'bold','加粗'],[I.Italic,'italic','斜体'],[I.Underline,'underline','下划线'],[I.Strikethrough,'strike','删除线']] as const).map(([Icon,key,label])=><button key={key} aria-label={label} aria-pressed={o.mixed?.includes(key)?'mixed':!!o.style[key]} onClick={()=>toggleStyle(key)}><Icon size={21}/></button>)}<button aria-label="链接" aria-pressed={!!o.style.href} onClick={()=>{setLink(o.style.href||'');setTool('link');}}><I.Link size={21}/></button></div>
 <div className="wb-color-size"><button aria-label="文字颜色" onClick={()=>setTool('color')}><span style={{background:o.style.color||'#122D39'}}/>{o.mixed?.includes('color')?'混合':o.style.color||'#122D39'}<I.ChevronDown size={16}/></button><div><button aria-label="减小字号" onClick={()=>format({size:Math.max(1,pt-1)/.75})}>−</button><output aria-label="当前字号">{o.mixed?.includes('size')?'—':pt} pt</output><button aria-label="增大字号" onClick={()=>format({size:Math.min(200,pt+1)/.75})}>＋</button></div></div>
 <div className="wb-align-buttons">{([[I.AlignLeft,'left','左对齐'],[I.AlignCenter,'center','居中'],[I.AlignRight,'right','右对齐']] as const).map(([Icon,key,label])=><button key={key} aria-label={label} aria-pressed={o.mixed?.includes('align')?'mixed':(o.style.align||'left')===key} onClick={()=>format({align:key})}><Icon size={21}/></button>)}</div></>}
 </section>
 {instruction&&<section className="bili-phone-composer wb-adaptive-composer wb-object-instruction">{editor.blocked&&<div role="alert">{editor.blockReason}<button onClick={editor.recover}>恢复当前目标</button></div>}<textarea ref={area} aria-label="对象修改要求" placeholder="描述要怎样修改所选文字…" value={editor.text} onSelect={editing.select} onChange={e=>{editing.selection.current={start:e.target.selectionStart,end:e.target.selectionEnd};editing.change(e.target.value);}}/>{editing.polish&&<PolishControls editing={editing}/>}<footer><button aria-label="收起修改要求" onClick={()=>{editing.cancel();setInstruction(false);}}><I.X size={20}/></button><button aria-label="发送修改要求" className="bili-send" disabled={busy||!r.connected||editor.blocked||!editor.text.trim()||editing.speech!=='idle'} onClick={send}><I.Send size={20}/>发送</button></footer></section>}
 </div>
 <InputDock editing={editing} area={area} editable={instruction} onSelectionEdit={selectionEdit} initialMode="trackpad" disabled={busy} undo={()=>command('wb-fb-undo',{view:o.view,file:o.file})} redo={()=>command('wb-fb-redo',{view:o.view,file:o.file})} onVoiceStart={()=>setInstruction(true)} voiceDisabled={editor.blocked||!r.connected} onVoiceUnavailable={()=>{if(!r.connected)openConnection?.();else editing.setError('请先恢复当前目标后再使用语音');}}/>{error&&<div role="alert" className="adaptive-error">{error}</div>}
 </main>;
}
