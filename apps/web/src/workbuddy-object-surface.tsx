import {useEffect,useRef,type ReactNode} from 'react';
import type {State} from '../../../packages/core/model';
import {browserState} from '../../../packages/core/workbuddy-files';
import {command,toast} from './runtime';
export function WorkBuddyObjectSurface({s,view,file,children,readOnly=false}:{s:State;view:string;file:string;children:ReactNode;readOnly?:boolean}){
 const surface=useRef<HTMLDivElement>(null),consumed=useRef(''),pointer=browserState(s).objectPointer;
 function selectRange(){if(readOnly)return;const selected=window.getSelection();if(!selected||selected.isCollapsed||!selected.rangeCount)return;const range=selected.getRangeAt(0),node=range.startContainer.parentElement?.closest<HTMLElement>('[data-wb-object]');if(!node||!surface.current?.contains(node)||!node.contains(range.endContainer))return;const before=range.cloneRange();before.selectNodeContents(node);before.setEnd(range.startContainer,range.startOffset);const start=before.toString().length,end=start+range.toString().length,path=node.dataset.wbObject!;void command('wb-object-select',{view,file,path,start,end,label:'所选文字'});}
 useEffect(()=>{window.addEventListener('input-selection-complete',selectRange);return()=>window.removeEventListener('input-selection-complete',selectRange);},[view,file,readOnly]);
 const visible=pointer?.view===view&&pointer.file===file&&pointer.targetRevision===s.target?.revision&&s.target?.id.startsWith('wb:object:');
 useEffect(()=>{if(!visible||!pointer?.commit||pointer.commit===consumed.current)return;consumed.current=pointer.commit;const canvas=surface.current?.querySelector('.slide-canvas'),rect=canvas?.getBoundingClientRect();if(!rect)return;
  const object=document.elementFromPoint(rect.left+rect.width*pointer.x,rect.top+rect.height*pointer.y)?.closest<HTMLElement>('[data-wb-object]');
  if(!object||!surface.current?.contains(object)){toast('该位置没有可编辑对象');return;}
  const path=object.dataset.wbObject!;void command('wb-object-select',{view,file,path,label:path.endsWith('/title')?'幻灯片标题':'幻灯片正文'});
 },[visible,pointer?.commit]);
 return <div ref={surface} onPointerUp={()=>requestAnimationFrame(selectRange)} className="wbf-object-surface">{children}{visible&&<span className="wbf-object-pointer" aria-hidden style={{left:`${pointer.x*100}%`,top:`${pointer.y*100}%`}}>↖</span>}</div>;
}
