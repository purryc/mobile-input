import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {InlineChip} from '../src/inline-chip';
import '../src/desktop.css';
import {OpticalScene,type Sample} from './optical-scene';
import './optical-review.css';

function LibraryChip({state,kind,label,size,surfaceContext,open,remove}:Sample){
  const semanticState=state==='expanded'?'default-selected':state==='preparing'?'ambiguous-recommendation':state;
  return <span className="input-controls-theme optical-frame-host"><InlineChip size={size} surfaceContext={surfaceContext}
    expanded={state==='expanded'} onOpen={open} onRemove={remove} onRemoveMaterial={remove}
    token={{id:kind+label,kind,label,phrase:'',value:label,role:'',semanticState,
      removable:state==='ambiguous-recommendation',additionalObjectCount:2,preparing:state==='preparing',animate:true}}/></span>;
}
function Review(){
  const [size,setSize]=useState('inline'),[background,setBackground]=useState('composer'),[view,setView]=useState('split');
  const [playing,setPlaying]=useState(true),[stamp,setStamp]=useState(1200);
  const [error,setError]=useState(false);
  const group=useRef<HTMLDivElement>(null), clock=useRef(1200);
  const frames=()=>Array.from(group.current?.querySelectorAll('iframe')??[]);
  function broadcast(data:unknown){frames().forEach(f=>f.contentWindow?.postMessage(data,location.origin));}
  function sync(time:number){
    clock.current=time;
    for(const frame of frames())for(const a of frame.contentDocument?.getAnimations()??[]){
      if(!('animationName' in a))continue;
      a.pause(); a.currentTime=time;
    }
  }
  useEffect(()=>{
    let id=0,last=performance.now(),lastLabel=last;
    function tick(now:number){
      sync(clock.current+(playing?now-last:0));last=now;
      if(now-lastLabel>100){setStamp(clock.current);lastLabel=now;}
      id=requestAnimationFrame(tick);
    }
    id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);
  },[playing]);
  useEffect(()=>{
    function action(e:MessageEvent){if(e.origin===location.origin&&frames().some(f=>f.contentWindow===e.source)&&e.data?.source==='optical-scene')broadcast(e.data);}
    addEventListener('message',action);return()=>removeEventListener('message',action);
  },[]);
  function connected(frame:HTMLIFrameElement){
    const doc=frame.contentDocument;
    if(!doc)return;
    // Mirror hover in the other real component without moving keyboard focus.
    const mirror=(e:PointerEvent)=>{
      const other=frames().find(f=>f!==frame)?.contentDocument;
      if(!other)return;
      const row=(e.target as Element).closest('[data-row]');
      const source=(row?.querySelector('.ic-chip-surface')??row?.lastElementChild)?.getBoundingClientRect();
      const dest=row&&other.querySelector('[data-row="'+row.getAttribute('data-row')+'"]');
      const target=dest?.querySelector<HTMLElement>('.ic-chip-surface')??dest?.lastElementChild;
      const prev=other.querySelector<HTMLElement>('[data-sync-root]');
      const clearMarks=()=>other.querySelectorAll('[data-sync-hover]').forEach(el=>el.removeAttribute('data-sync-hover'));
      if(!source||!target||e.type==='pointerleave'||e.clientX<source.left||e.clientX>source.right||e.clientY<source.top||e.clientY>source.bottom){
        clearMarks();
        if(prev){delete prev.dataset.syncRoot;prev.dispatchEvent(new MouseEvent('mouseout',{bubbles:true}));prev.dispatchEvent(new PointerEvent('pointerleave'));}
        return;
      }
      if(prev&&prev!==target){delete prev.dataset.syncRoot;prev.dispatchEvent(new MouseEvent('mouseout',{bubbles:true}));prev.dispatchEvent(new PointerEvent('pointerleave'));}
      const box=target.getBoundingClientRect(), init={bubbles:true,clientX:box.left+(e.clientX-source.left)*box.width/source.width,clientY:box.top+(e.clientY-source.top)*box.height/source.height};
      clearMarks();
      if(prev!==target)target.dispatchEvent(new MouseEvent('mouseover',init));
      target.setAttribute('data-sync-root','');
      target.setAttribute('data-sync-hover','');
      const button=(e.target as Element).closest('button');
      if(button&&row){
        const index=Array.from(row.querySelectorAll('button')).indexOf(button);
        dest?.querySelectorAll('button')[index]?.setAttribute('data-sync-hover','');
      }
      target.dispatchEvent(new MouseEvent('mousemove',init));
      target.dispatchEvent(new PointerEvent('pointermove',init));
    };
    doc.addEventListener('pointermove',e=>{if(e.isTrusted)mirror(e)});
    doc.documentElement.addEventListener('pointerleave',mirror);
    // Extend the actual hover selectors only inside the local review frames.
    // Keep the reference stylesheet's cascade layers and media conditions intact.
    function supportMirroredHover(rules:CSSRuleList){
      for(const rule of Array.from(rules)){
        if('selectorText' in rule && typeof rule.selectorText==='string' && rule.selectorText.includes(':hover')){
          rule.selectorText=rule.selectorText.replace(/(?<!\\):hover\b/g,':is(:hover,[data-sync-hover])');
        }
        if('cssRules' in rule)supportMirroredHover((rule as CSSGroupingRule).cssRules);
      }
    }
    for(const sheet of Array.from(doc.styleSheets))supportMirroredHover(sheet.cssRules);
  }
  const query='size='+size+(background==='artifact'?'&artifact=1':'');
  return <main className="optical-review"><a href="./compact.html">← Component List</a><h1>Chip 实物对照</h1>
    <div className="optical-controls">
      <label>尺寸<select value={size} onChange={e=>setSize(e.target.value)}><option value="inline">正文 · 32 px</option><option value="specimen">展板 · 38 px</option></select></label>
      <label>背景<select value={background} onChange={e=>setBackground(e.target.value)}><option value="composer">白色正文</option><option value="artifact">彩色画布</option></select></label>
      <label>对照<select value={view} onChange={e=>setView(e.target.value)}><option value="split">并排</option><option value="overlay">叠图 · 50%</option><option value="diff">差异图</option></select></label>
    </div>
    {error&&<p role="alert">原版对照资源尚未载入。请运行 npm run prepare:lumina 并指定原始 ZIP。</p>}
    <div className="optical-pair" data-view={view} ref={group}>
      {['ZIP 原版','控件库'].map((name,i)=><article key={name}><h2>{name}</h2><iframe title={name}
        src={(i?'./optical-review.html?frame=1&':'./tests/lumina-reference/index.html?')+query}
        onLoad={e=>{const f=e.currentTarget;connected(f);if(!i)setError(!f.contentDocument?.querySelector('meta[name=lumina-source]'));}}/></article>)}
    </div>
    <div className="optical-play"><button onClick={()=>setPlaying(!playing)}>{playing?'暂停':'播放'}</button>
      <button onClick={()=>{broadcast({action:'reset'});sync(0);setStamp(0);setPlaying(true)}}>重播</button>
      <button onClick={()=>{broadcast({action:'resolve'});sync(0);setStamp(0);setPlaying(true)}}>准备完成</button>
      <label>动画时间<input aria-label="动画时间" type="range" min="0" max={Math.max(7600, Math.ceil(stamp / 7600) * 7600)} step="10" value={stamp} onChange={e=>{setPlaying(false);sync(+e.target.value);setStamp(+e.target.value)}}/></label>
      <output>{(stamp/1000).toFixed(2)} s</output></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).has('frame')?<OpticalScene Chip={LibraryChip}/>:<Review/>);
