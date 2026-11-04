import {uiText} from './i18n';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import * as I from 'lucide-react';
import {objectContext} from '../../../packages/core/workbuddy-object';
import {command,currentState,useRuntime} from './runtime';
import {useWorkBuddyInput} from './workbuddy-input';
import './workbuddy-direct-editor.css';
export function WorkBuddySelectionTools({view,file,surface}:{view:string;file:string;surface:React.RefObject<HTMLElement|null>}){
 const {state}=useRuntime(),o=objectContext(state),t=state.target;
 if(!t||!o||o.file!==file||o.view!==view)return null;
 return <SelectionTools key={t.id+':'+t.revision} surface={surface}/>;
}
function SelectionTools({surface}:{surface:React.RefObject<HTMLElement|null>}){
 const {state}=useRuntime(),o=objectContext(state)!,t=state.target!,editor=useWorkBuddyInput(t.id,t.label);
 const [ai,setAI]=useState(!!o.pending),[link,setLink]=useState(false),[href,setHref]=useState(o.style.href||''),[error,setError]=useState(''),[position,setPosition]=useState({left:12,top:12});
 const tools=useRef<HTMLDivElement>(null),markdown=o.path==='text';
 useLayoutEffect(()=>{const update=()=>{const root=surface.current;if(!root)return;const element=Array.from(root.querySelectorAll<HTMLElement>('[data-wb-object]')).find(n=>n.dataset.wbObject===o.path&&(!markdown||(Number(n.dataset.sourceStart)<= (o.start??0)&&Number(n.dataset.sourceEnd)>=(o.end??0))));if(!element)return;
 const box=element.getBoundingClientRect(),parent=root.getBoundingClientRect(),range=window.getSelection();const rect=range&&!range.isCollapsed&&range.rangeCount&&element.contains(range.anchorNode)?range.getRangeAt(0).getBoundingClientRect():box;
 setPosition({left:Math.max(8,Math.min(rect.left-parent.left+root.scrollLeft,root.clientWidth-(tools.current?.offsetWidth||340)-8)),top:Math.max(4,rect.top-parent.top+root.scrollTop-(tools.current?.offsetHeight||48)-8)});};update();const root=surface.current;root?.addEventListener('scroll',update,true);window.addEventListener('resize',update);return()=>{root?.removeEventListener('scroll',update,true);window.removeEventListener('resize',update);};},[o.path,o.start,o.end,ai,link,surface]);
 const anchor={targetId:t.id,targetRevision:t.revision};
 async function format(mark:string,value?:string){const latest=objectContext(currentState());if(!latest||currentState().target?.id!==t.id)return;const ack=await command(markdown?'wb-object-mark':'wb-object-style',markdown?{mark,href:value,revision:latest.revision}:{revision:latest.revision,style:mark==='link'?{href:value}:mark==='color'?{color:value}:mark==='size'?{size:Number(value)}:mark==='align'?{align:value}:{[mark]:!latest.style[mark as 'bold']}},anchor);setError(ack.ok?'':ack.error||'格式未更新');}
 async function send(){await editor.flush();const d=currentState().workbuddy.entityDrafts[t.id];if(!d)return;const ack=await command('wb-submit',{text:d.text,revision:d.revision},anchor);if(!ack.ok)setError(ack.error||'修改未开始');}
 useEffect(()=>{if(!o.pending&&!editor.text&&!o.error)setAI(false);},[o.pending,editor.text,o.error]);
 return <div ref={tools} className="wb-selection-tools" style={position} onPointerDown={e=>{if((e.target as HTMLElement).closest('button'))e.preventDefault();}}>
 {ai?<div className="wb-selection-ai"><input aria-label={uiText("局部修改要求")} placeholder={uiText("说说你想怎么修改")} value={editor.text} disabled={!!o.pending} onChange={e=>editor.update(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing&&(e.metaKey||e.ctrlKey)){e.preventDefault();void send();}if(e.key==='Escape')setAI(false);}}/>{o.pending?<button aria-label={uiText("取消局部修改")} onClick={()=>void command('wb-object-ai-cancel',{owner:t.id,request:o.pending!.id})}><I.Square size={16}/></button>:<button aria-label={uiText("发送局部修改")} disabled={!editor.text.trim()||editor.blocked} onClick={()=>void send()}><I.Check size={20}/></button>}<button aria-label={uiText("关闭局部修改")} onClick={()=>setAI(false)}><I.X size={16}/></button></div>:<div role="toolbar" aria-label={uiText("选区编辑工具")}><button onClick={()=>setAI(true)}><I.Sparkles size={18}/>{uiText("AI 编辑")}</button>{([[I.Bold,'bold','加粗'],[I.Italic,'italic','斜体'],[I.Underline,'underline','下划线'],[I.Strikethrough,'strike','删除线']] as const).map(([Icon,mark,label])=><button key={mark} aria-label={label} aria-pressed={o.mixed?.includes(mark)?'mixed':!!o.style[mark]} onClick={()=>void format(mark)}><Icon size={18}/></button>)}<button aria-label={uiText("链接")} onClick={()=>setLink(!link)}><I.Link size={18}/></button>{markdown?<button aria-label={uiText("行内代码")} onClick={()=>void format('code')}><I.Code size={18}/></button>:<><label title={uiText("文字颜色")}><input aria-label={uiText("对象文字颜色")} type="color" value={o.style.color||'#182431'} onChange={e=>void format('color',e.target.value)}/></label><button aria-label={uiText("减小字号")} onClick={()=>void format('size',String(Math.max(4/3,(o.style.size||24)-4/3)))}>A−</button><button aria-label={uiText("增大字号")} onClick={()=>void format('size',String(Math.min(800/3,(o.style.size||24)+4/3)))}>A＋</button><select aria-label={uiText("段落对齐")} value={o.style.align||'left'} onChange={e=>void format('align',e.target.value)}><option value="left">{uiText("左对齐")}</option><option value="center">{uiText("居中")}</option><option value="right">{uiText("右对齐")}</option></select></>}</div>}
 {link&&<div className="wb-selection-link"><input aria-label={uiText("链接地址")} value={href} onChange={e=>setHref(e.target.value)} placeholder="https://"/><button onClick={()=>{void format('link',href);setLink(false);}}>{uiText("确定")}</button></div>}
 {(error||o.error)&&<div role="alert">{error||o.error}</div>}{o.pending&&<span role="status">{uiText("正在修改…")}</span>}
 </div>;
}
