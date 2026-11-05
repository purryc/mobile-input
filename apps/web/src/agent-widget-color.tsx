import {uiText} from './i18n';
import {useEffect,useRef,useState,type PointerEvent} from 'react';
import {fromHex,toHex} from './workbuddy-color-picker';

const palettes={primary:['#FFB3B3','#FF6B6B','#E03131','#C92A2A','#A51124'],background:['#F4F4F4','#E7E7E7','#D9D9D9','#BDBDBD','#919191'],text:['#202124','#000000','#4A4A4A','#686868','#FFFFFF']};
export const colorRole=(label:string)=>/背景/.test(label)?'background':/字体|文字|文本/.test(label)?'text':'primary';
export const colorTitle=(label:string)=>({background:'背景颜色',text:'文字颜色',primary:'主题主色'}[colorRole(label)]);
export function WidgetIcon({name}:{name:'close'|'check'|'pen'|'eraser'|'undo'|'clear'}){return <img className="agent-widget-icon" src={((import.meta as ImportMeta & {env?:{BASE_URL?:string}}).env?.BASE_URL??'/')+'reference-assets/workbuddy-widgets/'+name+'.svg'} alt="" draggable={false}/>;}
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const mix=(a:string,b:string,t:number)=>'#'+rgb(a).map((v,i)=>Math.round(v+(rgb(b)[i]-v)*t).toString(16).padStart(2,'0')).join('').toUpperCase();
/** Figma's horizontal tonal ramp, with a separate hue control and editable HEX. */
export function AgentWidgetColor({value,label,onChange,onActive,onDone}:{value:string;label:string;onChange:(v:string)=>void;onActive:(v:boolean)=>void;onDone?:()=>void}){
 const [hex,setHex]=useState(value),[hue,setHue]=useState(()=>fromHex(value).h),[chromatic,setChromatic]=useState(false),[position,setPosition]=useState(.8);const held=useRef<number|null>(null),current=useRef(value),last=useRef(0),kind=colorRole(label);
 useEffect(()=>{if(held.current===null){setHex(value);current.current=value;const next=fromHex(value);if(next.s>.05)setHue(next.h);}},[value]);
 const neutral=kind!=='primary'&&!chromatic,low=neutral?'#FAFAFA':mix('#FFFFFF',toHex({h:hue,s:1,v:1}),.0784),high=neutral?'#141414':toHex({h:hue,s:.796,v:.788});
 const change=(v:string,force=true)=>{current.current=v;setHex(v);if(force||performance.now()-last.current>80){last.current=performance.now();onChange(v);}};
 const finish=()=>{if(held.current===null)return;held.current=null;onActive(false);onChange(current.current);};
 const pick=(e:PointerEvent<HTMLDivElement>)=>{const r=e.currentTarget.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));setPosition(x);change(mix(low,high,x),false);};
 return <div className="agent-color-body">
  <div className="agent-color-presets">{palettes[kind].map((v,i)=><button key={v} aria-label={uiText(label)+' '+v} aria-pressed={hex.toUpperCase()===v} onClick={()=>{setChromatic(false);change(v);}}><img src={((import.meta as ImportMeta & {env?:{BASE_URL?:string}}).env?.BASE_URL??'/')+'reference-assets/workbuddy-widgets/'+kind+'-'+i+'.svg'} alt="" draggable={false}/></button>)}</div>
  <div className="agent-tone-ramp" role="slider" aria-label={uiText("连续调色")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(position*100)} aria-valuetext={hex} tabIndex={0} style={{backgroundImage:`linear-gradient(90deg,${low},${high})`}}
   onPointerDown={e=>{if(!e.isPrimary||held.current!==null)return;e.preventDefault();held.current=e.pointerId;onActive(true);e.currentTarget.setPointerCapture(e.pointerId);pick(e);}}
   onPointerMove={e=>{if(e.pointerId===held.current)pick(e);}} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
   onKeyDown={e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const x=Math.max(0,Math.min(1,position+(e.key==='ArrowRight'?.01:-.01)));setPosition(x);change(mix(low,high,x));}}><i style={{left:`${position*100}%`}}/></div>
  <input aria-label={uiText("色相")} className="agent-hue" type="range" min="0" max="359" value={Math.round(hue)} onPointerDown={e=>{held.current=e.pointerId;onActive(true);}} onPointerUp={finish} onPointerCancel={finish} onBlur={finish} onChange={e=>{const h=+e.target.value;setHue(h);setChromatic(true);change(toHex({h,s:.796,v:.788}),held.current===null);}}/>
  <div className="agent-color-bottom"><label><input aria-label={uiText(label)+' HEX'} value={hex} spellCheck={false} onChange={e=>{setHex(e.target.value);if(/^#[0-9a-f]{6}$/i.test(e.target.value))change(e.target.value.toUpperCase());}} onBlur={()=>setHex(current.current)}/><i style={{background:/^#[0-9a-f]{6}$/i.test(hex)?hex:value}}/></label><button aria-label={uiText("完成颜色选择")} onClick={onDone}><WidgetIcon name="check"/></button></div>
 </div>;
}
