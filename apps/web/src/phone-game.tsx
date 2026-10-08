import {usePhoneInsets} from './phone-insets';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {command,retryConnection,useRuntime} from './runtime';
import {SwitchButton} from './phone-wechat';
import './phone-game.css';

const asset=(name:string)=>`./assets/figma/fc/${name}.svg`;
const gameKeys=new Set(['ArrowLeft','ArrowRight','Space','Shift']);

export function FcController(){
 const r=useRuntime(),s=r.state,insets=usePhoneInsets();
 const held=useRef(new Map<number,string>()),reset=useRef<ReturnType<typeof setTimeout>|null>(null);
 const surface=useRef<HTMLDivElement>(null),latest=useRef(r);latest.current=r;
 const [pressed,setPressed]=useState<string[]>([]),[layout,setLayout]=useState({scale:1,portrait:false});
 const clearReset=()=>{if(reset.current)clearTimeout(reset.current);reset.current=null;};
 const clearLocal=()=>{held.current.clear();setPressed([]);clearReset();};
 const release=()=>{clearLocal();if(latest.current.connected)void command('release');};
 const publish=()=>{
  const state=latest.current;
  if(!state.connected||state.state.gamePaused||state.state.switcher)return;
  const keys=[...new Set(held.current.values())];setPressed(keys);
  void command('game-keys',keys.filter(key=>gameKeys.has(key)));
 };
 useEffect(()=>{
  window.MobileNative?.gameLayout?.(true);
  const resize=()=>{
   if(held.current.size||reset.current)release();
   const box=surface.current?.getBoundingClientRect();if(!box)return;
   const portrait=box.height>box.width;
   setLayout({portrait,scale:Math.min(box.width/(portrait?390:844),box.height/(portrait?844:390))});
  };
  const observer=new ResizeObserver(resize);if(surface.current)observer.observe(surface.current);resize();
  const tick=setInterval(()=>{if(held.current.size)publish();},150);
  const hide=()=>{if(document.hidden)release();};
  window.addEventListener('connection-open',release);window.addEventListener('blur',release);document.addEventListener('visibilitychange',hide);
  return()=>{
   observer.disconnect();clearInterval(tick);clearReset();held.current.clear();
   window.removeEventListener('connection-open',release);window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',hide);
   if(latest.current.connected)void command('release');
   window.MobileNative?.gameLayout?.(false);
  };
 },[]);
 useEffect(()=>{if(s.gamePaused||s.switcher||!r.connected)clearLocal();},[s.gamePaused,s.switcher?.epoch,r.connected]);
 const controlsDisabled=!r.connected||s.gamePaused||!!s.switcher;
 const keyProps=(key:string)=>({
  disabled:controlsDisabled,className:pressed.includes(key)?'held':'',
  onPointerDown:(e:PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);held.current.set(e.pointerId,key);publish();},
  onPointerUp:(e:PointerEvent<HTMLButtonElement>)=>{if(held.current.delete(e.pointerId))publish();},
  onPointerCancel:(e:PointerEvent<HTMLButtonElement>)=>{if(held.current.delete(e.pointerId))publish();},
  onLostPointerCapture:(e:PointerEvent<HTMLButtonElement>)=>{if(held.current.delete(e.pointerId))publish();},
 });
 return <main style={insets} className="fc-phone" aria-label="FC 游戏手柄">
  <div className="fc-viewport" ref={surface}>
   <section className="fc-stage" data-layout={layout.portrait?'rotated-landscape':'landscape'} style={{transform:`translate(-50%,-50%) scale(${layout.scale}) rotate(${layout.portrait?90:0}deg)`}}>
    <div className="fc-glass" aria-hidden="true"/>
    <header className="fc-status">
     <span className={'fc-connection '+(!r.connected?'offline':'')}><img src={asset(r.connected?'connected-dot':'disconnected-dot')} alt=""/>{r.connected?'已连接':'连接已断开'}</span>
     <span className="fc-app-title">超级玛丽</span>
    </header>
    <SwitchButton className="fc-app-switch" disabled={!r.connected} beforeSwitch={clearLocal} icon={<img src={asset('app-switch')} alt=""/>}/>
    {(s.gamePaused||!r.connected)&&<span className="fc-state">{r.connected?'已暂停':'连接已断开'}</span>}
    <div className="fc-dpad">
     <img className="fc-dpad-base" src={asset('dpad-base')} alt=""/>
     <button aria-label="方向上" {...keyProps('ArrowUp')} className={'up '+(pressed.includes('ArrowUp')?'held':'')}><img src={asset('arrow-up')} alt=""/></button>
     <button aria-label="向左" {...keyProps('ArrowLeft')} className={'left '+(pressed.includes('ArrowLeft')?'held':'')}><img src={asset('arrow-left')} alt=""/></button>
     <span className="fc-dpad-center" aria-hidden="true"/>
     <button aria-label="向右" {...keyProps('ArrowRight')} className={'right '+(pressed.includes('ArrowRight')?'held':'')}><img src={asset('arrow-right')} alt=""/></button>
     <button aria-label="方向下" {...keyProps('ArrowDown')} className={'down '+(pressed.includes('ArrowDown')?'held':'')}><img src={asset('arrow-down')} alt=""/></button>
    </div>
    {r.connected?<div className="fc-slats" aria-hidden="true"><i/><i/><i/></div>:<div className="fc-reconnect"><p>连接中断 · 按键已释放</p><button onClick={retryConnection}><img src={asset('reconnect')} alt=""/>重新连接</button></div>}
    <div className="fc-system-keys">
     <button aria-label="长按重新开始" disabled={!r.connected||!!s.switcher}
      onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);release();reset.current=setTimeout(()=>{reset.current=null;void command('game-reset');},1000);}}
      onPointerUp={clearReset} onPointerCancel={clearReset} onLostPointerCapture={clearReset}>重开</button>
     <button aria-label={s.gamePaused?'继续游戏':'暂停游戏'} disabled={!r.connected} onClick={()=>{release();void command('game-pause',!s.gamePaused);}}>{s.gamePaused?'开始':'暂停'}</button>
    </div>
    <button aria-label="加速 B" {...keyProps('Shift')} className={'fc-action fc-b '+(pressed.includes('Shift')?'held':'')}><img src={asset('button-light')} alt=""/><span>B</span></button>
    <button aria-label="跳跃 A" {...keyProps('Space')} className={'fc-action fc-a '+(pressed.includes('Space')?'held':'')}><img src={asset('button-light')} alt=""/><span>A</span></button>
   </section>
  </div>
  {r.toast&&<div role="status" className="toast">{r.toast}</div>}
 </main>;
}
