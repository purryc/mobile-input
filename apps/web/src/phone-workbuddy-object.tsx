import {PolishControls} from './ai-polish';
import {InputDock} from './input-dock';
import {CapturePanel,CaptureAttachments} from './capture-panel';
import {useEffect,useRef,useState} from 'react';
import * as I from 'lucide-react';
import {objectContext} from '../../../packages/core/workbuddy-object';
import {command,currentState,uid,useRuntime} from './runtime';
import {useWorkBuddyInput} from './workbuddy-input';
import {usePhoneEditing} from './use-phone-editing';
import {usePhoneInsets} from './phone-insets';
import {SwitchButton} from './phone-wechat';
import {ConnectionButton,useConnectionPrompt} from './connection-access';
import {WorkBuddyColorPicker} from './workbuddy-color-picker';
import './phone-workbuddy-adaptive.css';
export function PhoneWorkBuddyObject(){
 const openConnection=useConnectionPrompt();
 const r=useRuntime(),s=r.state,t=s.target!,o=objectContext(s)!,file=s.workbuddy.files.find(f=>f.id===o.file)!,task=s.workbuddy.tasks.find(x=>x.files.includes(file.id)),editor=useWorkBuddyInput(t.id,t.label),area=useRef<HTMLTextAreaElement>(null),editing=usePhoneEditing(editor.text,editor.update,area,t.id,r.connected&&!editor.blocked);
 const [tool,setTool]=useState<'color'|'size'|'align'|null>(null),[mode,setMode]=useState<'keyboard'|'trackpad'|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[capture,setCapture]=useState(false),[hex,setHex]=useState(o.style.color||'#122D39');
 const operations=useRef(Promise.resolve()),pointer=useRef({x:0,y:0,originX:0,originY:0,startX:.5,startY:.5,gesture:'',sequence:0,last:0,stopped:false}),legacyPreview=o.preview;
 const anchor={app:'workbuddy' as const,targetId:t.id,targetRevision:t.revision};
 async function run(type:string,fields:Record<string,unknown>={}){editing.cancel();setBusy(true);try{await editor.flush();if(currentState().target?.id!==t.id||editor.blocked)return;const d=currentState().workbuddy.entityDrafts[t.id];const ack=await command(type,{revision:d.revision,text:editor.text,...fields},anchor);setError(ack.ok?'':ack.error||'操作未完成');}finally{setBusy(false);}}
 useEffect(()=>{if(o.style.color)setHex(o.style.color);},[o.style.color]);
 function format(style:Record<string,unknown>){operations.current=operations.current.then(async()=>{const context=objectContext(currentState());if(!context||currentState().target?.id!==t.id)return;const ack=await command('wb-object-style',{style,revision:context.revision},anchor);setError(ack.ok?'':ack.error||'格式未更新');});}
 async function switchTask(id:string){editing.cancel();await editor.flush();await command(id==='receipt-demo'?'wb-material-task':'wb-input-task',id==='receipt-demo'?{}:{id});}
 function movePointer(x:number,y:number,width:number,height:number,phase:string){const p=pointer.current;if(p.stopped||!p.gesture||phase==='move'&&performance.now()-p.last<33)return;p.last=performance.now();const gesture=p.gesture;void command('wb-object-pointer',{x:Math.max(.01,Math.min(.99,p.startX+(x-p.originX)/width)),y:Math.max(.01,Math.min(.99,p.startY+(y-p.originY)/height)),gesture,sequence:++p.sequence,phase},anchor).then(ack=>{if(!ack.ok&&pointer.current.gesture===gesture&&!pointer.current.stopped){pointer.current.stopped=true;setError(ack.error||'指向已停止');}});}
 const page=Number(o.path.split('/')[1])+1,field=o.path.endsWith('/title')?'标题':'正文';
 return <main className="bili-phone wb-adaptive-phone wb-object-phone" style={usePhoneInsets()}>
 <header className="adaptive-status"><img src="./assets/apps/workbuddy.svg" alt=""/><div><b>WorkBuddy</b><small>{r.connected?'已连接':'连接已断开'}</small></div><SwitchButton beforeSwitch={editing.cancel}/><ConnectionButton/></header>
 <nav className="wb-adaptive-tasks"><div className="wb-task-strip"><button className="current" onClick={()=>task&&switchTask(task.id)}><span>{task?.title||file.name}</span><small><i data-status={task?.status||'complete'}/>{task?.status==='running'?'执行中':'编辑对象'}</small></button><button onClick={()=>switchTask(s.workbuddy.tasks.find(x=>x.receipts)?.id||'receipt-demo')}><span>整理演示票据</span><small><i data-status="needs-materials"/>材料与批准</small></button></div><button aria-label="新建输入任务" onClick={async()=>{editing.cancel();await editor.flush();await command('wb-input-task',{action:'new'});}}><I.Plus size={21}/><small>新建</small></button></nav>
 <div className="wb-adaptive-middle"><div className="wb-object-tool-region">
 <section className="wb-object-context"><small>{file.name} · 第 {page} 页 · {field}</small><p>{o.source}</p></section>
 <div className="wb-object-tools">{[[I.SlidersHorizontal,'color','颜色'],[I.Type,'size','字号'],[I.AlignLeft,'align','对齐']].map(([Icon,key,label])=>{const C=Icon as typeof I.Type;return <button key={String(key)} aria-pressed={tool===key} onClick={()=>setTool(tool===key?null:key as typeof tool)}><C size={22}/>{String(label)}</button>;})}</div>
 {tool==='color'&&<section className="wb-adaptive-color"><WorkBuddyColorPicker value={o.style.color||'#122D39'} onChange={color=>format({color})} onActive={()=>{}}/><input aria-label="对象颜色 HEX" value={hex} onChange={e=>{setHex(e.target.value);if(/^#[0-9a-f]{6}$/i.test(e.target.value)){setError('');format({color:e.target.value});}else setError('请输入六位 HEX 色值，已保留原颜色');}}/></section>}
 {tool==='size'&&<section className="wb-object-size"><label>字号 <output>{o.style.size||(field==='标题'?36:24)} px</output></label><input aria-label="对象字号" type="range" min="12" max="72" value={o.style.size||(field==='标题'?36:24)} onChange={e=>format({size:Number(e.target.value)})}/></section>}
 {tool==='align'&&<div className="wb-object-tools">{(['left','center','right'] as const).map((align,i)=><button key={align} aria-pressed={(o.style.align||'left')===align} onClick={()=>format({align})}>{['左对齐','居中','右对齐'][i]}</button>)}</div>}
 </div><section className="bili-phone-composer wb-adaptive-composer">{editor.blocked&&<div className="bili-target-warning">{editor.blockReason}<button disabled={busy||!r.connected} onClick={editor.recover}>恢复到当前对象</button></div>}<textarea ref={area} aria-label="对象修改要求" placeholder="描述要怎样修改这个对象…" value={editor.text} onSelect={editing.select} onChange={e=>{editing.selection.current={start:e.target.selectionStart,end:e.target.selectionEnd};editing.change(e.target.value);}}/>
 <CaptureAttachments/>{editing.polish&&<PolishControls editing={editing}/>}
 <footer><button aria-label="采集方式" onClick={()=>setCapture(!capture)}><I.Paperclip/></button><span/><button aria-label="发送修改要求" className="bili-send" disabled={busy||!r.connected||!editor.text.trim()||editing.speech!=='idle'} onClick={async()=>{if(editor.blocked){setBusy(true);try{await editor.recover();}finally{setBusy(false);}return;}await operations.current;await run('wb-submit');}}><I.Send size={23}/>{editor.blocked?'确认目标':'发送'}</button></footer></section>
 </div>
 <InputDock editing={editing} area={area} disabled={busy} voiceDisabled={editor.blocked||!r.connected} onVoiceUnavailable={()=>{if(!r.connected)openConnection?.();else editing.setError("请先恢复当前目标后再使用语音");}}/>{error&&<div role="alert" className="adaptive-error">{error}</div>}{capture&&<CapturePanel close={()=>setCapture(false)}/>}
 </main>;
}
