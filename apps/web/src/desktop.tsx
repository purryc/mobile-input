import {useEffect,useRef,useState} from 'react';
import {X,CloudSun,Sun,Wifi,Volume2,BatteryFull,Keyboard,Delete,ArrowUp,CornerDownLeft,NotebookPen} from 'lucide-react';
import {apps,type AppId} from '../../../packages/core/model';
import {demoApps} from '../../../packages/core/interactions';
import {command,useRuntime,input} from './runtime';
import {DesktopWallpaper} from './desktop-wallpaper';
import './desktop.css';

const asset=(name:string)=>`./reference-assets/${name}.png`;
const appAssets:Partial<Record<AppId,string>>={mail:'mail',wechat:'wechat',notes:'notes',paint:'paint',workbuddy:'workbuddy',doubao:'doubao',xiaoyi:'xiaoyi',bilibili:'bilibili',douyin:'douyin',red:'red',read:'read'};
export function AppIcon({id,size=48}:{id:AppId;size?:number}){if(id==='workbuddy')return <img className='original-icon clean-icon' width={size} height={size} src='./assets/apps/workbuddy.svg' alt=''/>;if(id==='wps')return <img className="original-icon" width={size} height={size} src="./assets/apps/wps.svg" alt=""/>;if(id==='mario')return <svg className="original-icon mario-game-icon" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#5c94fc"/><svg x="10" y="8" width="44" height="48" viewBox="354 44 16 16" overflow="hidden"><image href="./mario/img/characters.gif" width="513" height="401" style={{imageRendering:'pixelated'}}/></svg></svg>;const clean:Partial<Record<AppId,string>>={mail:'mail',wechat:'wechat',notes:'huawei-handwriting',paint:'gopaint',doubao:'doubao'};if(clean[id])return <img className='original-icon clean-icon' width={size} height={size} src={'./assets/apps/'+clean[id]+'.png'} alt=''/>;const file=appAssets[id];return file?<img className="original-icon" width={size} height={size} src={asset(file)} alt=""/>:<span aria-hidden="true" className={'document-app-icon '+id} style={{width:size,height:size,fontSize:Math.min(30,size*.6)}}>{id==='sheet'?'S':id==='word'?'W':'P'}</span>;}

export function Desktop(){
 const r=useRuntime(),s=r.state;const [entry,setEntry]=useState(false);const hold=useRef<ReturnType<typeof setTimeout>|null>(null),held=useRef(false);
 const [keyboard,setKeyboard]=useState(false),[numbers,setNumbers]=useState(false),[shift,setShift]=useState(false);
 useEffect(()=>{if(s.texts['desktop-escape']){setEntry(false);setKeyboard(false);}},[s.texts['desktop-escape']]);
 useEffect(()=>()=>{if(hold.current)clearTimeout(hold.current);},[]);
 const toggle=useRef<HTMLButtonElement>(null);
 const [date,setDate]=useState(()=>new Date());
 useEffect(()=>{const timer=setInterval(()=>setDate(new Date()),60000);return()=>clearInterval(timer);},[]);
 function close(){setKeyboard(false);toggle.current?.focus();}
 const requestPhone=(source:'taskbar'|'keyboard')=>{void command('input-session-request',{source});};
 useEffect(()=>{
  if(!keyboard&&!entry&&!s.desktopOverlay)return;
  const back=(e:Event)=>{if(!e.defaultPrevented){e.preventDefault();if(s.desktopOverlay)void command('desktop-action','escape');else{setEntry(false);close();}}};
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();if(s.desktopOverlay)void command('desktop-action','escape');else{setEntry(false);close();}}};
  window.addEventListener('app-back',back);window.addEventListener('keydown',escape);
  return()=>{window.removeEventListener('app-back',back);window.removeEventListener('keydown',escape);};
 },[keyboard,entry,s.desktopOverlay]);
 const launch=(id:AppId)=>{setKeyboard(false);void command('open',id);};
 const rows=numbers?['1234567890','@#￥%&*()-','.,?!/:;']:['qwertyuiop','asdfghjkl','zxcvbnm'];
 const monthStart=(new Date(date.getFullYear(),date.getMonth(),1).getDay()+6)%7;
 const days=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
 return <main className="hpc-desktop" aria-label="鸿蒙 PC 桌面">
  <DesktopWallpaper/>
  <nav className="hpc-apps demo-apps" aria-label="桌面应用">{demoApps.map(id=><button className="hpc-app" key={id} aria-label={apps.find(a=>a[0]===id)?.[1]} onClick={()=>launch(id)}><AppIcon id={id} size={58}/><span>{apps.find(a=>a[0]===id)?.[1]}</span></button>)}</nav>
  <aside className="hpc-widgets" aria-label="桌面组件">
   <section className="hpc-weather"><div><span>上海</span><CloudSun size={27}/></div><strong>28<span>°</span></strong><p>晴间多云　　最高 30° / 最低 22°</p><div className="hpc-forecast">{['现在','14时','15时','16时','17时'].map((t,i)=><div key={t}><small>{t}</small><Sun size={16}/><span>{28+i%2}°</span></div>)}</div></section>
   <section className="hpc-calendar"><header><div><small>{date.getMonth()+1}月 · {date.toLocaleDateString('zh-CN',{weekday:'long'})}</small><strong>{date.getDate()}</strong></div><span>{date.getFullYear()}</span></header><div className="hpc-month">{['一','二','三','四','五','六','日'].map(d=><b key={d}>{d}</b>)}{Array.from({length:monthStart},(_,i)=><i key={'blank'+i}/>)}{Array.from({length:days},(_,i)=><span className={date.getDate()===i+1?'today':''} key={i}>{i+1}</span>)}</div></section>
   <button className="hpc-note" onClick={()=>launch('notes')}><header><NotebookPen size={18}/><span>项目备忘</span></header><strong>澄星设计 · 新办公室</strong><p>30 套办公设备采购<br/>准备报价与项目介绍</p></button>
  </aside>
  <footer className="hpc-taskbar"><div className="hpc-status-tray" aria-label="桌面状态区域"><button ref={toggle} className="hpc-keyboard-toggle" aria-label="虚拟键盘" aria-expanded={keyboard} aria-controls="desktop-keyboard" onPointerDown={()=>{held.current=false;hold.current=setTimeout(()=>{held.current=true;setEntry(true);},500);}} onPointerUp={()=>{if(hold.current)clearTimeout(hold.current);}} onPointerCancel={()=>{if(hold.current)clearTimeout(hold.current);}} onClick={()=>{if(held.current){held.current=false;return;}requestPhone('taskbar');keyboard?close():setKeyboard(true);}}><Keyboard size={19}/></button><div className="hpc-status-glyphs" aria-label="系统状态外观示意"><Wifi size={16}/><Volume2 size={16}/><BatteryFull size={20}/></div><time className="hpc-clock" dateTime={date.toISOString()}><strong>{date.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false})}</strong><span>{date.getFullYear()}/{String(date.getMonth()+1).padStart(2,'0')}/{String(date.getDate()).padStart(2,'0')}</span></time></div></footer>
  {entry&&<div className="desktop-input-menu"><button onClick={()=>{setEntry(false);void command('input-session-request',{source:'taskbar'});}}>使用手机输入</button><button onClick={()=>setEntry(false)}>取消</button></div>}
  {s.desktopOverlay&&<section className="desktop-overlay" role="dialog" aria-label={s.desktopOverlay==='search'?'应用搜索':'多任务'}><header><b>{s.desktopOverlay==='search'?'搜索应用':'应用'}</b><button aria-label="关闭桌面面板" onClick={()=>command('desktop-action','escape')}><X/></button></header>{s.desktopOverlay==='search'&&<input aria-label="大屏搜索应用" value={s.texts['desktop-search']||''} onChange={e=>input(e.target.value)}/>}<div>{demoApps.filter(id=>s.desktopOverlay!=='search'||(apps.find(a=>a[0]===id)?.[1]+' '+id).toLowerCase().includes((s.texts['desktop-search']||'').toLowerCase())).map(id=><button key={id} onClick={()=>launch(id)}><AppIcon id={id}/><span>{apps.find(a=>a[0]===id)?.[1]}</span></button>)}</div></section>}
  {keyboard&&<section id="desktop-keyboard" className="hpc-keyboard" role="dialog" aria-label="桌面小键盘" onClick={e=>{if(!(e.target as HTMLElement).closest('[data-keyboard-dismiss],.desktop-mobile-entry'))requestPhone('keyboard');}}>
   <header><span><Keyboard size={18}/>虚拟键盘</span><button className="desktop-mobile-entry" onClick={()=>requestPhone('keyboard')}>手机输入</button><button data-keyboard-dismiss aria-label="收起虚拟键盘" onClick={close}><X size={20}/></button></header>

   <div className="hpc-keys">{rows.map((row,i)=><div className="hpc-key-row" key={i}>{i===2&&!numbers&&<button aria-label="大写切换" aria-pressed={shift} onPointerDown={e=>e.preventDefault()} onClick={()=>setShift(!shift)}><ArrowUp size={18}/></button>}{Array.from(row).map(c=><button key={c} onPointerDown={e=>e.preventDefault()}>{shift&&!numbers?c.toUpperCase():c}</button>)}{i===2&&<button aria-label="退格" onPointerDown={e=>e.preventDefault()}><Delete size={19}/></button>}</div>)}<div className="hpc-key-row hpc-key-bottom"><button aria-label="切换字母数字" onPointerDown={e=>e.preventDefault()} onClick={()=>setNumbers(!numbers)}>{numbers?'ABC':'123'}</button><button className="hpc-space" aria-label="空格" onPointerDown={e=>e.preventDefault()}>空格</button><button aria-label="回车"><CornerDownLeft size={18}/>回车</button></div></div>
  </section>}
 </main>;
}
