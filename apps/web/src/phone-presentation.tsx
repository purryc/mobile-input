import {useEffect,useRef,useState} from 'react';
import type {CSSProperties} from 'react';
import {usePhoneInsets} from './phone-insets';
import {usePresentationCaptions} from './presentation-captions';
import {command,currentState,useRuntime,uid} from './runtime';
import {orientationPoint,type Quaternion} from '../../../packages/core/orientation';
import {inkKey} from '../../../packages/core/presentation';
import './phone-presentation.css';
const nativeDevice=Boolean(window.MobileNative);
const Icon=({name}:{name:string})=><span className="present-icon"><img src={`./assets/figma/presentation/${name}.svg`} alt=""/></span>;
export function PresentationPhone(){
 const r=useRuntime(),s=r.state,p=s.presentation;
 const [clock,setClock]=useState(Date.now()),[holding,setHolding]=useState(false),[error,setError]=useState(''),[tracking,setTracking]=useState(false),[scale,setScale]=useState(1);
 const insets=usePhoneInsets(),captions=usePresentationCaptions(s,r.connected);
 const root=useRef<HTMLDivElement>(null),notes=useRef<HTMLDivElement>(null),gesture=useRef(''),base=useRef<Quaternion|null>(null),lastPoint=useRef({x:.5,y:.5}),sequence=useRef(0),accepted=useRef(false),starting=useRef(false),busy=useRef(false),pending=useRef<{x:number;y:number}|null>(null),anchor=useRef({session:p.session,slide:s.slide}),lastSend=useRef(0),drawSequence=useRef(0),drawDown=useRef(false);
 const payload=(extra:Record<string,unknown>={})=>({session:p.session,slide:s.slide,...extra});
 function stop(notifyTablet=true){const id=gesture.current;gesture.current='';accepted.current=false;pending.current=null;starting.current=false;base.current=null;drawDown.current=false;setHolding(false);setTracking(false);window.MobileNative?.presentationMotion?.(id,'stop');if(notifyTablet&&id&&currentState().presenting&&currentState().presentation.session===anchor.current.session&&currentState().slide===anchor.current.slide)void command('present-stop',{...anchor.current,gesture:id},{app:'slides'});}
 function start(){void command('switch-cancel');if(gesture.current||!r.connected||!currentState().presenting)return;if(!window.MobileNative?.presentationMotion){setError('姿态指向需要在手机应用中使用');return;}setError('');const id=uid();gesture.current=id;const state=currentState();anchor.current={session:state.presentation.session,slide:state.slide};sequence.current=0;drawSequence.current=0;base.current=null;lastPoint.current={x:.5,y:.5};setTracking(true);const result=window.MobileNative.presentationMotion(id,'start');if(result==='unavailable'){stop();setError('姿态传感器不可用，请重试');}}
 function draw(down:boolean,force=false){
  if(drawDown.current===down&&!force)return;
  drawDown.current=down;setHolding(down);
  if(down&&!gesture.current)start();
  if(accepted.current&&gesture.current){const id=gesture.current;void command('present-draw',{...anchor.current,gesture:id,sequence:++drawSequence.current,down},{app:'slides'}).then(ack=>{if(!ack.ok&&gesture.current===id)stop(false);});}
 }
 async function pump(){if(busy.current||!pending.current||!gesture.current||!accepted.current||Date.now()-lastSend.current<34)return;const point=pending.current;pending.current=null;busy.current=true;lastSend.current=Date.now();const id=gesture.current;try{const ack=await command('present-point',{...anchor.current,...point,sequence:++sequence.current,gesture:id},{app:'slides'});if(!ack.ok&&gesture.current===id)stop(false);}finally{busy.current=false;}}
 useEffect(()=>{
  const fn=async(e:Event)=>{const d=(e as CustomEvent).detail;if(!gesture.current||d.id!==gesture.current)return;
   if(d.type==='error'){stop();setError(d.message||'姿态传感器不可用');return;}if(d.type==='calibrate'){base.current=null;lastPoint.current={x:.5,y:.5};return;}if(d.type!=='sample')return;
   const q={x:d.x,y:d.y,z:d.z,w:d.w};if(!Object.values(q).every(Number.isFinite))return;if(!base.current)base.current=q;
   const point=orientationPoint(base.current,q);if(!point)return;const smooth={x:lastPoint.current.x+(point.x-lastPoint.current.x)*.35,y:lastPoint.current.y+(point.y-lastPoint.current.y)*.35};lastPoint.current=smooth;pending.current=smooth;
   if(!accepted.current&&!starting.current){starting.current=true;const id=gesture.current;const ack=await command('present-start',{...anchor.current,gesture:id},{app:'slides'});if(gesture.current!==id)return;starting.current=false;accepted.current=ack.ok;if(ack.ok&&drawDown.current)draw(true,true);if(!ack.ok){stop(false);setError(ack.error||'无法开始指向');}}
   void pump();
  };window.addEventListener('native-motion',fn);const timer=setInterval(()=>void pump(),34);return()=>{window.removeEventListener('native-motion',fn);clearInterval(timer);};
 },[]);
 useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),500);return()=>clearInterval(timer);},[]);
 useEffect(()=>{const resize=()=>{if(root.current)setScale(Math.min(root.current.clientWidth/390,root.current.clientHeight/844));};resize();const obs=new ResizeObserver(resize);if(root.current)obs.observe(root.current);return()=>obs.disconnect();},[]);
 useEffect(()=>{stop();if(notes.current)notes.current.scrollTop=0;if(p.mode==='ink'&&s.presenting&&r.connected&&!s.switcher)start();},[p.session,s.slide,s.presenting,p.mode]);
 useEffect(()=>{if(!r.connected||s.switcher)stop();},[r.connected,!!s.switcher]);
 useEffect(()=>{const connecting=()=>{stop();};window.addEventListener('connection-open',connecting);const hidden=()=>{if(document.hidden){stop();}};const foreground=(e:Event)=>{if(!(e as CustomEvent).detail){stop();}};document.addEventListener('visibilitychange',hidden);window.addEventListener('native-foreground',foreground);return()=>{stop();window.removeEventListener('connection-open',connecting);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('native-foreground',foreground);};},[]);
 const elapsed=p.elapsed+(p.runningSince?Math.max(0,clock-p.runningSince):0),seconds=Math.floor(elapsed/1000),time=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
 const mode=async(value:'laser'|'ink')=>{const wasActive=!!gesture.current&&p.mode===value;stop();setError('');captions.clearError();if(value==='ink'&&p.mode==='ink'){void command('present-mode',payload({mode:'laser'}));return;}const ack=await command('present-mode',payload({mode:value}));if(value==='laser'&&!wasActive&&ack.ok)start();};
 const turn=(page:number)=>{stop();void command('slide',page);};
 const style=(color?:string,size?:number)=>{draw(false);void command('present-style',payload({color,size}));};
 const ink=p.mode==='ink'&&s.presenting;
 const status=error||captions.error||p.volume.error||p.captions.error||(!r.connected?'连接已断开':!s.presenting?'编辑模式':p.captions.enabled?'字幕已开启':tracking?(ink?(holding?'正在绘制':'画笔已就绪'):'激光笔已开启'):ink?`${({'#c45337':'橙红','#c74529':'橙红','#277ee6':'蓝色','#12303b':'墨黑','#e3a93b':'金色','#19995b':'绿色'} as Record<string,string>)[p.color]||'画笔'} · ${p.size} px`:'');
 const fullscreen=()=>{stop();captions.stop();void command('present',!s.presenting);};
 const colors=[['#c74529','橙红','red'],['#277ee6','蓝色','blue'],['#12303b','墨黑','black'],['#e3a93b','金色','gold'],['#19995b','绿色','green']];
 return <main className={'presentation-phone-shell'+(nativeDevice?' native-device':'')} style={insets}><div className="presentation-viewport" ref={root}><div className={'presentation-glass'+(ink?' ink-mode':'')} style={{transform:`translate(-50%,-50%) scale(${scale})`}}>
 <header className="present-status"><span><img src="./assets/figma/presentation/status.svg" alt="" style={{opacity:r.connected?1:.35}}/>{r.connected?'已连接':'未连接'}</span><span className="present-app-name">WPS 演示</span></header>
 <button className="present-switch glass-button" aria-label="切换应用" onClick={()=>{stop();captions.stop();command('switch-step');}}><Icon name="app-switch"/></button>
 <h1>{(s.officeFiles.find(f=>f.id===s.officeFile)?.name||'销售进展汇报').replace(/\.pptx$/i,'')}</h1>
 <div className="present-meta"><span>{String(s.slide+1).padStart(2,'0')} / {String(s.slides.length).padStart(2,'0')}</span><time>{time}</time></div>
 <section className="present-notes"><small>演讲备注</small><span className={'present-state'+((error||captions.error||p.captions.error||p.volume.error)?' error':'')} role="status">{status}</span><div ref={notes}><p>{s.slides[s.slide]?.notes}</p></div></section>
 <nav className="present-navigation"><button className="glass-button" disabled={s.slide===0||!r.connected} onClick={()=>turn(s.slide-1)}><Icon name="left"/>上一页</button><button className="glass-button" disabled={s.slide===s.slides.length-1||!r.connected} onClick={()=>turn(s.slide+1)}><Icon name="right"/>下一页</button></nav>
 {ink&&<div className="present-hold"><button className={'glass-button'+(holding?' held':'')} aria-pressed={holding} disabled={!r.connected} onContextMenu={e=>e.preventDefault()} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);draw(true);}} onPointerMove={e=>{const b=e.currentTarget.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)draw(false);}} onPointerUp={()=>draw(false)} onPointerCancel={()=>draw(false)} onLostPointerCapture={()=>draw(false)}><Icon name={holding?'pencil-pressed':'pencil'}/>按住绘制</button></div>}
 <nav className="present-tools" aria-label="演示工具">
 <button className="glass-button" aria-label="激光笔" aria-pressed={tracking&&!ink} disabled={!r.connected||!s.presenting} onClick={()=>mode('laser')}><Icon name="crosshair"/></button>
 <button className="glass-button" aria-label="画笔" aria-pressed={ink} disabled={!r.connected||!s.presenting} onClick={()=>mode('ink')}><Icon name="pencil"/></button>
 <button className="glass-button" aria-label={s.presenting?'退出全屏':'开始放映'} disabled={!r.connected} onClick={fullscreen}><Icon name={s.presenting?'minimize':'maximize'}/></button>
 <button className="glass-button" aria-label="实时字幕" aria-pressed={p.captions.enabled} disabled={!r.connected||!s.presenting} onClick={captions.toggle}><Icon name="captions"/></button>
 </nav>
 {ink&&<section className="present-palette" aria-label="画笔设置"><div className="present-colors">{colors.map(([color,name,asset])=>{const selected=color===p.color||(asset==='red'&&p.color==='#c45337');const nativeRing=asset==='red'&&selected;return <button key={color} aria-label={'画笔颜色 '+name} aria-pressed={selected} className={nativeRing?'native-focus-ring':''} style={{'--swatch':color} as CSSProperties} onClick={()=>style(color)}><img src={`./assets/figma/presentation/color-${asset}${nativeRing?'-selected':''}.svg`} alt=""/></button>;})}</div><label htmlFor="presentation-brush">笔刷大小</label><output>{p.size} px</output><input id="presentation-brush" aria-label="笔刷大小" type="range" min="1" max="12" value={p.size} style={{'--fill':`${(p.size-1)/11*100}%`} as CSSProperties} onChange={e=>style(undefined,Number(e.target.value))}/><div className="present-pen-edit"><button className="glass-button" aria-label="撤销本页笔迹" disabled={!p.live&&!p.ink[inkKey(s)]?.length} onClick={()=>{draw(false);command('present-undo',payload());}}><Icon name="undo"/></button><button className="glass-button" aria-label="清空本页笔迹" onClick={()=>{draw(false);command('present-clear',payload());}}><Icon name="eraser"/></button></div></section>}
 </div></div>{r.toast&&<div className="toast">{r.toast}</div>}</main>;
}
