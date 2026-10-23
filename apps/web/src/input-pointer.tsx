import {useEffect,useRef} from 'react';
import {MousePointer2} from 'lucide-react';
import {useRuntime} from './runtime';
function caret(x:number,y:number):{node:Node;offset:number}|null{const d=document as Document&{caretPositionFromPoint?:(x:number,y:number)=>{offsetNode:Node;offset:number};caretRangeFromPoint?:(x:number,y:number)=>Range};const c=d.caretPositionFromPoint?.(x,y);if(c)return {node:c.offsetNode,offset:c.offset};const r=d.caretRangeFromPoint?.(x,y);return r?{node:r.startContainer,offset:r.startOffset}:null;}
function selectWord(el:HTMLElement,x:number,y:number){
 const point=caret(x,y);if(!point||point.node.nodeType!==Node.TEXT_NODE)return;
 const owner=point.node.parentElement;
 if(!owner?.closest('[data-wb-object],[contenteditable=true],.doc-page'))return;
 const text=point.node.textContent||'',offset=Math.min(point.offset,Math.max(0,text.length-1));
 const segment=Array.from(new Intl.Segmenter('zh',{granularity:'word'}).segment(text)).find(s=>offset>=s.index&&offset<s.index+s.segment.length);
 if(!segment)return;
 window.getSelection()?.setBaseAndExtent(point.node,segment.index,point.node,segment.index+segment.segment.length);
 window.dispatchEvent(new Event('input-selection-complete'));
}
export function InputPointer(){
 const r=useRuntime(),p=r.state.inputPointer,last=useRef(p?.event),press=useRef<{el:HTMLElement;x:number;y:number;anchor:ReturnType<typeof caret>;moved:boolean}|null>(null);
 useEffect(()=>{if(!p){press.current=null;return;}if(last.current===p.event)return;last.current=p.event;if(p.app!==r.state.app){press.current=null;return;}const x=p.x*innerWidth,y=p.y*innerHeight,el=document.elementFromPoint(x,y) as HTMLElement|null;if(!el)return;
 if(p.action==='down'){press.current={el,x,y,anchor:el.closest('[data-wb-object]')?caret(x,y):null,moved:false};return;}
 if(p.action==='move'){const a=press.current;if(!p.held){press.current=null;return;}if(a){a.moved ||=Math.hypot(x-a.x,y-a.y)>4;const c=caret(x,y);if(a.anchor&&c&&el.closest('[data-wb-object]')===a.el.closest('[data-wb-object]')){window.getSelection()?.setBaseAndExtent(a.anchor.node,a.anchor.offset,c.node,c.offset);}}return;}
 if(p.action==='up'){const a=press.current;press.current=null;if(!a)return;if(a.moved)window.dispatchEvent(new Event('input-selection-complete'));else{window.getSelection()?.removeAllRanges();a.el.click();}return;}
 if(p.action==='scroll'){let parent:HTMLElement|null=el;while(parent&&parent.scrollHeight<=parent.clientHeight)parent=parent.parentElement;parent?.scrollBy({top:p.dy||0});return;}
 if(p.action==='right')el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:x,clientY:y}));else{
  window.getSelection()?.removeAllRanges();el.focus();
  el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:x,clientY:y,detail:p.action==='double'?2:1}));
  if(p.action==='double'){el.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true,clientX:x,clientY:y,detail:2}));selectWord(el,x,y);}
 }
 },[p?.event,r.state.app]);
 return p&&p.app===r.state.app?<MousePointer2 className="shared-input-pointer" fill="white" size={26} style={{left:p.x*100+'vw',top:p.y*100+'vh'}}/>:null;
}
