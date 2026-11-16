import {useLayoutEffect, useRef, useState, type ReactNode, type RefObject} from 'react';
import {createPortal} from 'react-dom';
import {useWidgetEnvironment, useWidgetThemeStyle} from './environment';
export interface AnchoredPanelProps {
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  id: string;
  label: string;
  width?: number;
  onClose: () => void;
  children: ReactNode;
}
/** One host-owned active ID keeps sibling popovers mutually exclusive. */
export function useSinglePanel() {
  const [active, setActive] = useState<string|null>(null);
  return {active, open: setActive, close: () => setActive(null), toggle: (id: string) => setActive(value => value === id ? null : id)};
}
export function AnchoredPanel({anchor,open,id,label,width=320,onClose,children}: AnchoredPanelProps) {
  const {portalRoot}=useWidgetEnvironment();const themeStyle=useWidgetThemeStyle();const panel=useRef<HTMLDivElement>(null);
  const [position,setPosition]=useState({left:8,top:8,maxHeight:400});
  const close=useRef(onClose);close.current=onClose;
  useLayoutEffect(()=>{
    if(!open)return;
    const update=()=>{const r=anchor.current?.getBoundingClientRect();if(!r)return;const top=Math.min(r.bottom+8,window.innerHeight-120);setPosition({left:Math.max(8,Math.min(r.left,window.innerWidth-Math.min(width,window.innerWidth-16)-8)),top,maxHeight:Math.max(104,window.innerHeight-top-8)});};
    const outside=(e:PointerEvent)=>{if(!(e.target as Element).closest('.ic-demo-modal')&&!panel.current?.contains(e.target as Node)&&!anchor.current?.contains(e.target as Node))close.current();};
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close.current();(anchor.current?.matches('button')?anchor.current:anchor.current?.querySelector<HTMLButtonElement>('button'))?.focus();}};
    update(); const resize=new ResizeObserver(update);if(anchor.current)resize.observe(anchor.current);
    window.addEventListener('resize',update);document.addEventListener('scroll',update,true);document.addEventListener('pointerdown',outside);panel.current?.addEventListener('keydown',key);
    const current=panel.current;current?.querySelector<HTMLElement>('button,input,select,[tabindex="0"]')?.focus({preventScroll:true});
    return()=>{resize.disconnect();window.removeEventListener('resize',update);document.removeEventListener('scroll',update,true);document.removeEventListener('pointerdown',outside);current?.removeEventListener('keydown',key);};
  },[open,width,anchor]);
  if(!open)return null;
  return createPortal(<div className="input-controls-theme input-controls-popover" ref={panel} id={id} role="dialog" aria-label={label} onBlur={e=>{const next=e.relatedTarget as Node|null;if(next&&!e.currentTarget.contains(next)&&!anchor.current?.contains(next)&&!(next as Element).closest?.('.ic-demo-modal'))close.current();}} style={{...themeStyle,position:'fixed',width:Math.min(width,window.innerWidth-16),...position}}>{children}</div>,portalRoot||document.body);
}
