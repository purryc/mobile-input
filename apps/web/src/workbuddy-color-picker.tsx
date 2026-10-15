import {useEffect,useRef,useState,type PointerEvent} from 'react';
type HSV={h:number;s:number;v:number};
export function fromHex(hex:string):HSV{
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
 const h=!d?0:max===r?60*((g-b)/d%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4);
 return {h:(h+360)%360,s:max?d/max:0,v:max};
}
export function toHex({h,s,v}:HSV){const c=v*s,x=c*(1-Math.abs(h/60%2-1)),m=v-c;const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+rgb.map(n=>Math.round((n+m)*255).toString(16).padStart(2,'0')).join('').toUpperCase();}
/** In-place picker: no OS dialog, and incoming acknowledgements cannot move a held marker. */
export function WorkBuddyColorPicker({value,onChange,onActive}:{value:string;onChange:(hex:string)=>void;onActive:(active:boolean)=>void}){
 const [hsv,setHsv]=useState(()=>fromHex(value)),current=useRef(hsv),held=useRef(false),last=useRef(0),changed=useRef(false),ack=useRef(value),callback=useRef(onChange);callback.current=onChange;
 useEffect(()=>{if(!held.current&&value!==ack.current){const next=fromHex(value);if(!next.s)next.h=current.current.h;current.current=next;setHsv(next);ack.current=value;}},[value]);
 const publish=(next:HSV,force=false)=>{current.current=next;setHsv(next);changed.current=true;if(force||performance.now()-last.current>80){const hex=toHex(next);ack.current=hex;callback.current(hex);last.current=performance.now();}};
 const finish=()=>{if(!held.current)return;held.current=false;onActive(false);if(changed.current)publish(current.current,true);changed.current=false;};
 const position=(e:PointerEvent<HTMLDivElement>)=>{const rect=e.currentTarget.getBoundingClientRect();publish({...current.current,s:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),v:1-Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))});};
 return <><div className="wb-color-picker" role="slider" aria-label="连续调色" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hsv.s*100)} aria-valuetext={toHex(hsv)} tabIndex={0} style={{backgroundColor:`hsl(${hsv.h} 100% 50%)`}}
  onPointerDown={e=>{e.preventDefault();held.current=true;onActive(true);e.currentTarget.setPointerCapture(e.pointerId);position(e);}}
  onPointerMove={e=>{if(held.current)position(e);}} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
  onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const step=e.shiftKey?.1:.01;publish({...current.current,s:Math.max(0,Math.min(1,current.current.s+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0))),v:Math.max(0,Math.min(1,current.current.v+(e.key==='ArrowUp'?step:e.key==='ArrowDown'?-step:0)))},true);}}>
  <i style={{left:`${hsv.s*100}%`,top:`${(1-hsv.v)*100}%`,background:toHex(hsv)}}/>
 </div><input aria-label="色相" className="wb-hue" type="range" min="0" max="359" value={Math.round(hsv.h)} onPointerDown={()=>{held.current=true;onActive(true);}} onPointerUp={finish} onPointerCancel={finish} onBlur={finish} onChange={e=>publish({...current.current,h:Number(e.target.value)},!held.current)}/></>;
}
