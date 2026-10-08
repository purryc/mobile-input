import {useEffect,useState,type CSSProperties} from 'react';
type Insets={width:number;height:number;top:number;bottom:number;left:number;right:number};
export function usePhoneInsets():CSSProperties {
 const [area,setArea]=useState<Insets|null>(null);
 useEffect(()=>{
  const update=(event:Event)=>setArea((event as CustomEvent<Insets>).detail);
  const request=()=>window.MobileNative?.layoutInsets?.();
  window.addEventListener('native-insets',update);window.addEventListener('resize',request);request();
  return()=>{window.removeEventListener('native-insets',update);window.removeEventListener('resize',request);};
 },[]);
 if(!area||!area.width||!area.height)return {};
 return Object.fromEntries(['top','bottom','left','right'].map(edge=>['--native-'+edge,`${area[edge as 'top']*(edge==='top'||edge==='bottom'?innerHeight/area.height:innerWidth/area.width)}px`])) as CSSProperties;
}
