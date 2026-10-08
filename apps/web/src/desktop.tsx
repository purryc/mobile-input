import {useState,type CSSProperties} from 'react';
import {X,CloudSun} from 'lucide-react';
import {apps,type AppId} from '../../../packages/core/model';
import {command} from './runtime';

const asset=(name:string)=>`./reference-assets/${name}.png`;
const appAssets:Partial<Record<AppId,string>>={mail:'mail',wechat:'wechat',notes:'notes',paint:'paint',workbuddy:'workbuddy',doubao:'doubao',xiaoyi:'xiaoyi',bilibili:'bilibili',douyin:'douyin',red:'red',read:'read'};
export function AppIcon({id,size=48}:{id:AppId;size?:number}){if(id==='wps')return <span className="wps-folder-icon" style={{width:size,height:size}}>{(['sheet','word','slides'] as AppId[]).map(a=><AppIcon key={a} id={a} size={size*.36}/>)}</span>;if(id==='mario')return <svg className="original-icon mario-game-icon" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#5c94fc"/><svg x="10" y="8" width="44" height="48" viewBox="354 44 16 16" overflow="hidden"><image href="./mario/img/characters.gif" width="513" height="401" style={{imageRendering:'pixelated'}}/></svg></svg>;const clean:Partial<Record<AppId,string>>={mail:'mail',wechat:'wechat',notes:'huawei-handwriting',paint:'gopaint',doubao:'doubao'};if(clean[id])return <img className='original-icon clean-icon' width={size} height={size} src={'./assets/apps/'+clean[id]+'.png'} alt=''/>;const file=appAssets[id];return file?<img className="original-icon" width={size} height={size} src={asset(file)} alt=""/>:<span aria-hidden="true" className={'document-app-icon '+id} style={{width:size,height:size,fontSize:Math.min(30,size*.6)}}>{id==='sheet'?'S':id==='word'?'W':'P'}</span>;}
const place=(x:number,y:number,w:number,h:number):CSSProperties=>({left:`${x/14}%`,top:`${y/9.2}%`,width:`${w/14}%`,height:`${h/9.2}%`});
const desktopEntries=['mail','wps','wechat','doubao','notes','paint','mario'] as const;
export function Desktop(){
 const [wps,setWps]=useState(false);
 const launch=(id:AppId)=>{setWps(false);command('open',id);};
 const widget=(name:string,label:string,x:number,y:number,w:number,h:number,id?:AppId)=>{
  const content=<><img src={asset(name)} alt=""/><span>{label}</span></>;
  return id?<button className="source-widget" style={place(x,y,w,h)} onClick={()=>launch(id)} aria-label={label}>{content}</button>:<div className="source-widget" style={place(x,y,w,h)}>{content}</div>;
 };
 return <div className="replica-desktop">
  <svg className="wallpaper-filter" aria-hidden="true"><filter id="woven-tone" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0.48322 0.51536 -0.11713 0 0.03766 0.29721 0.29055 0.29570 0 0.02480 0.05577 0.03673 0.80303 0 -0.00042 0 0 0 1 0"/></filter></svg>
  <img className="woven-wallpaper" src="./reference-assets/woven-wallpaper.jpg" alt=""/>
  <div className="desktop-page">
   {widget('gallery-widget','应用市场',124,69,184,183)}
   <div className="source-clock" style={place(535,89,335,140)}><strong>07:14</strong><span>10月7日周三　八月廿七 <CloudSun/> -°</span></div>
   {widget('xiaoyi-widget','小艺建议 | 出境游',124,426,426,189)}
   {widget('memo-widget','备忘录',1094,426,184,189,'notes')}
   {widget('calendar-widget','日历',606,432,432,186)}
   <div className="desktop-apps source-apps demo-apps">{desktopEntries.map((id,index)=>{
    const label=id==='wps'?'WPS':apps.find(a=>a[0]===id)![1];
    return <button key={id} aria-label={label} style={place(184+154*index,674,107,91)} onClick={()=>launch(id)}>
     {id==='wps'?<span className="wps-folder-icon" aria-hidden="true">{(['sheet','word','slides'] as AppId[]).map(a=><AppIcon key={a} id={a} size={24}/>)}</span>:<AppIcon id={id} size={63}/>}
     <span>{label}</span>
    </button>;
   })}</div>
  </div>
  {wps&&<div className="launcher-scrim" onClick={()=>setWps(false)}><section className="app-launcher wps-chooser" role="dialog" aria-modal="true" aria-label="WPS" onKeyDown={e=>{if(e.key==='Escape')setWps(false);}} onClick={e=>e.stopPropagation()}><header><h2>WPS</h2><button autoFocus aria-label="关闭 WPS" onClick={()=>setWps(false)}><X/></button></header><div className="desktop-apps launcher-grid">{apps.filter(a=>['sheet','word','slides'].includes(a[0])).map(a=><button key={a[0]} aria-label={a[1]} onClick={()=>launch(a[0])}><AppIcon id={a[0]} size={64}/><span>{a[1]}</span></button>)}</div></section></div>}
 </div>;
}
