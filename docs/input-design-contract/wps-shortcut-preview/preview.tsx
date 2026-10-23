import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Renderer,createLibrary,defineComponent,defineAction,action,useTriggerAction,createParser} from '@openuidev/react-lang';
import {z} from 'zod';
import catalog from './catalog.json';
import '../../../apps/web/src/input-dock.css';
import './preview.css';

type Doc={text:string;bold:boolean;italic:boolean;underline:boolean;strike:boolean;size:number;color:string;align:'left'|'center'|'right'|'justify';href:string};
const initial:Doc={text:'我们希望把复杂的协作，变成每个人都能轻松完成的日常。通过统一的信息入口，让团队专注于真正重要的事。',bold:false,italic:false,underline:false,strike:false,size:16,color:'#182431',align:'left',href:''};
const mainDefault=catalog.items.slice(0,11).map(x=>x.key);
const keys=catalog.items.map(x=>x.key) as [string,...string[]];
const items=Object.fromEntries(catalog.items.map(x=>[x.key,x]));
const icon=(name:string,kind:'key'|'dock'='key')=>{
 const src=(kind==='key'?catalog.keyIcons:catalog.dockIcons) as Record<string,string>;
 return <span aria-hidden="true" className={'svg-icon '+(kind==='dock'?'input-dock-icon':'')} dangerouslySetInnerHTML={{__html:(src[name]||'').replaceAll('#146C64','currentColor')}}/>;
};
function program(main:string[]){return `root = ShortcutPanel([${main.map((_,i)=>'k'+i).join(', ')}])\n`+main.map((key,i)=>`k${i} = ShortcutKey(${JSON.stringify(key)}, @ActivateKey(${JSON.stringify(key)}))`).join('\n');}
type Context={doc:Doc;activate:(key:string)=>void;arrange:boolean;setArrange:(v:boolean)=>void;move:(a:string,b:string)=>void;selectedKey:string|null;setSelectedKey:(v:string|null)=>void;saved:boolean};
const Ctx=createContext<Context>(null!);
function KeyView({id,fire}:{id:string;fire:()=>void}){
 const c=useContext(Ctx),entry=items[id];const timer=useRef<ReturnType<typeof setTimeout>|null>(null),held=useRef(false),origin=useRef({x:0,y:0});
 const bool=['bold','italic','underline','strike'].includes(id);
 const selected=bool?Boolean(c.doc[id as keyof Doc]):['left','center','right','justify'].includes(id)?c.doc.align===id:false;
 const clear=()=>{if(timer.current)clearTimeout(timer.current);timer.current=null;};
 useEffect(()=>clear,[]);
 return <button className={'action-key '+(c.selectedKey===id?'moving':'')} data-key={id} data-function={entry.functionId} data-component="professional-action-key" aria-label={entry.label} aria-pressed={bool||['left','center','right','justify'].includes(id)?selected:undefined} title={entry.label}
 onPointerDown={e=>{held.current=false;origin.current={x:e.clientX,y:e.clientY};timer.current=setTimeout(()=>{held.current=true;c.setArrange(true);c.setSelectedKey(id)},450)}}
 onPointerMove={e=>{if(Math.hypot(e.clientX-origin.current.x,e.clientY-origin.current.y)>10&&!held.current)clear();}}
 onPointerUp={e=>{clear();if(held.current){const to=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-key]')?.dataset.key;if(to&&to!==id)c.move(id,to);}}}
 onPointerCancel={()=>{clear();c.setSelectedKey(null);held.current=true;}}
 onClick={()=>{if(held.current){held.current=false;return;}if(c.arrange){if(c.selectedKey&&c.selectedKey!==id)c.move(c.selectedKey,id);else c.setSelectedKey(id);return;}fire();}}>
 {icon(entry.icon)}<span>{entry.label}</span>{id==='color'&&<i className="color-mark" style={{background:c.doc.color}}/>}{id==='save'&&c.saved&&<i className="saved-dot"/>}
 </button>;
}
const ActivateKey=defineAction({name:'ActivateKey',description:'Apply a registered key to the isolated preview document only.',params:z.object({key:z.enum(keys)})});
const ShortcutKey=defineComponent({name:'ShortcutKey',description:'Existing professional-action-key design, with local definition-table label/icon resolution.',props:z.object({key:z.enum(keys),activate:action()}),component:({props})=>{const trigger=useTriggerAction();return <KeyView id={props.key} fire={()=>{void trigger(items[props.key].label,undefined,props.activate)}}/>;}});
const ShortcutPanel=defineComponent({name:'ShortcutPanel',description:'Up to eleven action keys; the fixed More entry is host-owned.',props:z.object({children:z.array(ShortcutKey.ref).max(11)}),component:({props,renderNode})=><>{renderNode(props.children)}</>});
const library=createLibrary({id:'mobile-input-wps-preview',root:'ShortcutPanel',components:[ShortcutPanel,ShortcutKey],actions:[ActivateKey]});
const parsed=createParser(library.toJSONSchema(),'ShortcutPanel').parse(program(mainDefault));
if(!parsed.root||parsed.meta.errors.length||parsed.meta.unresolved.length)throw Error('Invalid generated panel: '+JSON.stringify(parsed.meta));

function App(){
 const [doc,setDoc]=useState<Doc>(initial),[history,setHistory]=useState<Doc[]>([]),[future,setFuture]=useState<Doc[]>([]),[saved,setSaved]=useState(false);
 const [order,setOrder]=useState<string[]>(()=>{try{const a=JSON.parse(localStorage.getItem('wps-preview-order')||'null');return Array.isArray(a)&&a.length===keys.length&&new Set(a).size===keys.length&&a.every(x=>keys.includes(x))?a:keys}catch{return keys}});
 const main=order.slice(0,11);
 const [more,setMore]=useState(false),[arrange,setArrange]=useState(false),[selectedKey,setSelectedKey]=useState<string|null>(null);
 const [mode,setMode]=useState<'keyboard'|'trackpad'|null>(null),[aux,setAux]=useState<'color'|'link'|null>(null),[href,setHref]=useState('https://example.com'),[notice,setNotice]=useState(''),[details,setDetails]=useState(false),[small,setSmall]=useState(false),[shift,setShift]=useState(false);
 const [pointer,setPointer]=useState({x:50,y:50});const clipboard=useRef(''),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const overflow=order.slice(11); const visible=small?main.slice(0,7):main;const extra=small?[...main.slice(7),...overflow]:overflow;
 const speak=(s:string)=>{setNotice(s);if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setNotice(''),2400)};
 const update=(patch:Partial<Doc>)=>{setHistory(h=>[...h,doc]);setFuture([]);setDoc({...doc,...patch});setSaved(false)};
 const edit=(key:string)=>{if(key==='undo'){if(history.length){setFuture([doc,...future]);setDoc(history.at(-1)!);setHistory(history.slice(0,-1));setSaved(false)}return;}if(key==='redo'){if(future.length){setHistory([...history,doc]);setDoc(future[0]);setFuture(future.slice(1));setSaved(false)}return;}
 if(key==='select-all'){speak('已选中示例段落');return;}if(key==='copy'||key==='cut'){clipboard.current=doc.text;speak('已复制示例段落');if(key==='cut')update({text:''});return;}if(key==='paste'){if(clipboard.current)update({text:doc.text+clipboard.current});else speak('先复制示例段落');return;}if(key==='delete'){update({text:''});return;}};
 const activate=(key:string)=>{if(arrange)return;if(['bold','italic','underline','strike'].includes(key)){update({[key]:!doc[key as keyof Doc]});return;}if(key==='smaller'||key==='larger'){update({size:Math.max(8,Math.min(48,doc.size+(key==='larger'?1:-1)))});return;}
 if(['left','center','right','justify'].includes(key)){update({align:key as Doc['align']});return;}if(key==='color'||key==='link'){setAux(aux===key?null:key);if(key==='link')setHref(doc.href||'https://example.com');return;}
 if(key==='save'){try{localStorage.setItem('wps-preview-document',JSON.stringify(doc));setSaved(true);speak('示例文档已保存')}catch{speak('浏览器暂时无法保存，请保留当前页面')}return;}};
 const move=(from:string,to:string)=>{const all=[...order];all.splice(all.indexOf(from),1);all.splice(to==='more'?11:all.indexOf(to),0,from);setOrder(all);setSelectedKey(null)};
 useEffect(()=>{localStorage.setItem('wps-preview-order',JSON.stringify(order))},[order]);
 useEffect(()=>{const esc=(e:KeyboardEvent)=>{if(e.key==='Escape'){setMore(false);setAux(null);setArrange(false);setSelectedKey(null)}};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc)},[]);
 const context={doc,activate,arrange,setArrange,move,selectedKey,setSelectedKey,saved};
 const theme={'--accent':catalog.accent,'--on-accent':catalog.theme.onAccent,'--accent-foreground':catalog.theme.accentForeground,'--bg-top':catalog.background[0],'--bg-mid':catalog.background[1],'--bg-bottom':catalog.background[2]} as React.CSSProperties;
 const inputIcon=(name:string)=>icon(name,'dock');
 return <Ctx.Provider value={context}><main className="review" style={theme}>
 <header className="review-header"><a className="brand" href="#"><span className="brand-mark">i</span>Input Agent <span>/</span> Design preview</a><button className="quiet" onClick={()=>setDetails(!details)}>{details?'收起生成依据':'查看生成依据'} <span>↗</span></button></header>
 <section className="intro"><div><p className="eyebrow">WPS · 文档编辑</p><h1>让常用操作，<br/>触手可及。</h1><p className="lead">你的控件库，生成的快捷面板。</p></div><div className="intro-meta"><span className="color-dot"/>图标取色 <b>{catalog.accent}</b><small>本地交互预览 · 不连接真实 WPS</small></div></section>
 <div className="workspace"><div className="phone-column"><div className="preview-caption"><span>手机控制面板</span><button className="quiet" onClick={()=>{setSmall(!small);setMore(false)}}>{small?'390 × 844':'切换紧凑尺寸'}</button></div>
 <section className={'phone '+(mode?'expanded ':'')+(small?'compact':'')} aria-label="WPS 手机快捷面板">
 <header className="app-header"><span className="app-logo" dangerouslySetInnerHTML={{__html:catalog.logo}}/><div><b>WPS 文档</b><small>销售合作方案.docx</small></div><button aria-label="连接状态" className="connection" onClick={()=>speak('本地预览，未连接真实 WPS')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="12" height="15" rx="2"/><rect x="13" y="9" width="8" height="12" rx="2"/></svg></button></header>
 <div className="context-line"><span>文字与段落</span><span>{doc.size} pt <i/> 1 段已选中</span></div>
 <div className="context-workspace"><div className="action-grid" aria-label="常用快捷键">
 <Renderer response={program(visible)} library={library} isStreaming={false} onAction={event=>{if(event.type==='ActivateKey')activate(String(event.params?.key))}}/>
 <button className="action-key more-key" data-key="more" aria-label="更多操作" aria-expanded={more} onClick={()=>{setMore(!more);setAux(null)}}><span className="mini-grid">{extra.slice(0,4).map(k=><span key={k}>{icon(items[k].icon)}</span>)}</span><span>更多</span></button>
 </div>{arrange&&<div className="arrange-bar"><span>{selectedKey?'选择放置位置':'整理快捷键'}</span><button onClick={()=>{setArrange(false);setSelectedKey(null)}}>完成</button></div>}
 </div>
 <section className={'input-dock '+(mode?'expanded mode-'+mode:'')} data-component="input-dock">
 <div className="input-edit-tools">{['select-all','copy','cut','paste','delete','undo','redo','capture'].map((name,i)=><button key={name} aria-label={['全选','复制','剪切','粘贴','删除','撤销','重做','采集方式'][i]} disabled={name==='undo'&&!history.length||name==='redo'&&!future.length||name==='capture'} onClick={()=>edit(name)}>{inputIcon(name)}</button>)}</div>
 {mode==='trackpad'&&<div className="input-trackpad"><div className="input-track-surface" aria-label="触控板预览" onPointerMove={e=>{if(!e.buttons)return;const r=e.currentTarget.getBoundingClientRect();setPointer({x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100})}}><span className="preview-pointer" style={{left:pointer.x+'%',top:pointer.y+'%'}}>↖</span></div></div>}
 {mode==='keyboard'&&<div className="input-keyboard" aria-label="展开键盘"><div className="input-keyboard-top"><button onClick={()=>setShift(!shift)} aria-pressed={shift}>ABC</button><button disabled>123</button><button disabled>表情</button></div>{['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].map((row,i)=><div className="input-key-row" key={i}>{i===2&&<button className="input-key-modifier" onClick={()=>setShift(!shift)} aria-label="大写切换">↑</button>}{[...row].map(k=><button key={k} onClick={()=>update({text:doc.text+(shift?k:k.toLowerCase())})}>{k}</button>)}{i===2&&<button className="input-key-modifier" onClick={()=>update({text:doc.text.slice(0,-1)})} aria-label="退格">⌫</button>}</div>)}</div>}
 <div className="input-bottom-row">{mode?<><div className="input-mode-pair"><button className="input-mode-key" aria-label="键盘" aria-pressed={mode==='keyboard'} onClick={()=>setMode(mode==='keyboard'?null:'keyboard')}>{inputIcon('keyboard')}</button><button className="input-mode-key" aria-label="触控板" aria-pressed={mode==='trackpad'} onClick={()=>setMode(mode==='trackpad'?null:'trackpad')}>{inputIcon('trackpad')}</button></div>{mode==='trackpad'?<div className="input-mouse-pair"><button onClick={()=>speak('已选中示例段落')}>左键</button><button disabled>右键</button></div>:<div className="input-keyboard-actions"><button onClick={()=>update({text:doc.text+' '})}>空格</button><button onClick={()=>update({text:doc.text+'\n'})} aria-label="换行">↵</button></div>}</>:<><button className="input-mode-key" aria-label="键盘" onClick={()=>setMode('keyboard')}>{inputIcon('keyboard')}</button><button className="input-mode-key" aria-label="触控板" onClick={()=>setMode('trackpad')}>{inputIcon('trackpad')}</button></>}
 <button className="input-voice" aria-label="智慧语音" disabled title="此预览未接入语音">{inputIcon('mic')}<span>智慧语音</span></button></div>
 </section>
 {(more||aux)&&<div className="overlay" onClick={()=>{setMore(false);setAux(null)}}>
 {more&&<section className="more-popup" role="dialog" aria-label="更多操作" onClick={e=>e.stopPropagation()}><h3>更多操作</h3><div className="overflow-grid">{extra.map(k=><KeyView key={k} id={k} fire={()=>{activate(k);setMore(false)}}/>)}</div></section>}
 {aux&&<section className="aux-popup" role="dialog" aria-label={aux==='color'?'文字颜色':'插入链接'} onClick={e=>e.stopPropagation()}><header><b>{aux==='color'?'文字颜色':'插入链接'}</b><button aria-label="关闭辅助面板" onClick={()=>setAux(null)}>×</button></header>{aux==='color'?<div className="swatches">{['#182431','#356FE4','#146C64','#C45337','#9D3F80','#8B6200'].map(color=><button key={color} aria-label={'颜色 '+color} aria-pressed={doc.color===color} onClick={()=>update({color})}><i style={{background:color}}/>{doc.color===color?'✓':''}</button>)}</div>:<><input aria-label="链接地址" value={href} onChange={e=>setHref(e.target.value)} placeholder="https://"/><footer><button disabled={!/^https?:\/\//.test(href)} onClick={()=>{update({href});setAux(null)}}>确认</button></footer></>}</section>}
 </div>}
 {notice&&<div className="notice" role="status">{notice}</div>}
 </section></div>
 <section className="document-column"><div className="preview-caption"><span>示例文档</span><button className="quiet" onClick={()=>{setDoc(initial);setHistory([]);setFuture([]);setSaved(false);setAux(null)}}>重置样式 ↺</button></div><div className="document-window"><header><span className="file-glyph">W</span><b>销售合作方案</b><span className="document-state">{saved?'已保存到此浏览器':'本地示例'}</span></header><div className="document-toolbar"><span>正文</span><span>{doc.size} pt</span><b style={{color:doc.bold?catalog.theme.accentForeground:'#8692a5'}}>B</b><i style={{color:doc.italic?catalog.theme.accentForeground:'#8692a5'}}>I</i><span style={{color:doc.color}}>A</span></div><article className="paper"><p className="paper-kicker">2026 / 合作提案</p><h2>让协作更简单</h2><div className="paper-rule"/><p className="paper-intro">从一个清晰的目标开始。</p><div className="selection-frame"><span className="selection-label">当前选区</span><p data-testid="document-text" style={{fontSize:doc.size*1.15,fontWeight:doc.bold?700:400,fontStyle:doc.italic?'italic':'normal',textDecoration:[doc.underline?'underline':'',doc.strike?'line-through':''].join(' '),color:doc.color,textAlign:doc.align}}>{doc.href?<a href={doc.href} onClick={e=>e.preventDefault()} style={{color:'inherit'}}>{doc.text||'　'}</a>:doc.text||'　'}</p><i className="handle top"/><i className="handle bottom"/></div><div className="paper-footnote"><span>澄星设计 · 示例内容</span><span>01</span></div></article><footer><span className="status-dot"/>样式变化即时呈现在示例选区<span>{doc.text.length} 字</span></footer></div><div className="theme-note"><span className="theme-strip"><i/><i/><i/></span><p><b>从应用色，到整套界面</b><span>从 WPS 桌面图标提取主色，再派生整套主题。</span></p></div></section>
 </div>
 {details&&<section className="details"><h2>这份面板从哪里来</h2><div className="detail-grid"><div><h3>图标与主题</h3><p>从项目已有 WPS 桌面图标的实际像素取色，排除白底、低饱和及透明像素。选中态文字按对比度选择深浅色；内容色和 Logo 原色独立保留。</p><h3>设计与控件</h3><p>专业动作键、共享输入底栏、编辑工具、键盘、触控板。按键依据 Figma 1568:38898；底栏直接复用项目 CSS 与 SVG。</p></div><div><h3>规则与能力</h3><p>11动作＋固定 More；复制、撤销等放在共享底栏。字号8–48 pt是示例文档能力范围。加粗、字号、颜色等状态来自本地文档，未连接真实 WPS。</p></div><div><h3>生成方式</h3><p>本次由 Codex 根据 Design MD 和定义表生成以下计划，实际使用 OpenUI Renderer 渲染；没有调用额外在线模型。只有此示例所需控件已封装。</p></div></div><details><summary>OpenUI Lang 计划</summary><pre>{program(visible)}</pre></details></section>}
 <footer className="review-footer"><span>Mobile Input Agent / Design MD → 定义表 → 快捷键面板</span><span>交互预览 · 2026.10.22</span></footer>
 </main></Ctx.Provider>;
}
createRoot(document.getElementById('root')!).render(<App/>);
Object.assign(window,{previewEvidence:{parserErrors:parsed.meta.errors,schema:library.toJSONSchema(),program:program(mainDefault),mainCount:mainDefault.length,theme:catalog.accent}});
