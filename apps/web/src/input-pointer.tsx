import {useEffect,useRef} from 'react';
import {MousePointer2} from 'lucide-react';
import {useRuntime} from './runtime';
export function InputPointer(){const r=useRuntime(),p=r.state.inputPointer,last=useRef(p?.event);useEffect(()=>{if(!p||last.current===p.event)return;last.current=p.event;if(p.app!==r.state.app||p.action==='move')return;const el=document.elementFromPoint(p.x*innerWidth,p.y*innerHeight) as HTMLElement|null;if(!el)return;if(p.action==='right'){el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:p.x*innerWidth,clientY:p.y*innerHeight}));}else{el.focus();el.click();}},[p?.event]);return p&&p.app===r.state.app?<MousePointer2 className="shared-input-pointer" fill="white" size={26} style={{left:p.x*100+'vw',top:p.y*100+'vh'}}/>:null;}
