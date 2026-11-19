import {flushSync} from 'react-dom';
import {uiText,useUILanguage} from './i18n';
import './sentence-composer.css';
import {forwardRef,useEffect,useImperativeHandle,useLayoutEffect,useRef} from 'react';
import type {TextInputHandle} from './text-input-handle';

const sourceText=(node:Node):string=>{
 if(node instanceof HTMLElement&&node.dataset.source!==undefined)return node.dataset.source;
 if(node.nodeType===Node.TEXT_NODE)return node.textContent||'';
 if(node.nodeName==='BR')return node.nextSibling?'\n':'';
 return Array.from(node.childNodes).map((child,i)=>((child.nodeName==='DIV'||child.nodeName==='P')&&i>0?'\n':'')+sourceText(child)).join('');
};
export interface ComposerLiveToken extends Omit<importLiveParameter,'kind'> {kind:string;semanticState?:import('@mobile-input/controls').ChipSemanticState;boundMaterialId?:string;additionalObjectCount?:number;origin?:'explicit'|'recommended'|'manual';sweepKey?:string;animate?:boolean;iconPath?:string;iconSrc?:string;recommendationIconSrc?:string;removable?:boolean;preparing?:boolean;prefix?:string;suffix?:string;}
type importLiveParameter=import('../../../packages/core/live-workbuddy').LiveParameter;
export interface SentenceComposerProps {label?:string;inputMode?:'text'|'none';preserveSourceClipboard?:boolean;preserveCaretAfterInlineChips?:boolean;text:string;disabled:boolean;placeholder:string;loading?:{start:number;end:number};onChange:(text:string)=>void;onSelect:()=>void;onFocus:()=>void;live:{renderChip:(token:ComposerLiveToken,options:{preserveSelection:()=>void;onOpen:()=>void;onRemove?:()=>void;sweepStarts:Map<string,number>})=>HTMLElement;containedRemove?:boolean;controlsId?:string;parameters:ComposerLiveToken[];active:string|null;open:(id:string)=>void;remove?:(id:string)=>void};}
/** The DOM is editable, but the authority remains plain text + task-owned parameter bindings. */
export const SentenceComposer=forwardRef<TextInputHandle,SentenceComposerProps>(function SentenceComposer(p,ref){
 const language=useUILanguage();
 const sweepStarts=useRef(new Map<string,number>());
 const root=useRef<HTMLDivElement>(null),composing=useRef(false),compData=useRef(''),compTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),selection=useRef({start:0,end:0}),latest=useRef(p);latest.current=p;
 function offset(container:Node,at:number):number{
  const el=root.current!;let total=0,found=false;
  function walk(n:Node){if(found)return;if(n===container){if(n.nodeType===Node.TEXT_NODE)total+=at;else total+=Array.from(n.childNodes).slice(0,at).reduce((a,c)=>a+sourceText(c).length,0);found=true;return;}
   if(n instanceof HTMLElement&&n.dataset.source!==undefined){if(n.contains(container)){total+=at?sourceText(n).length:0;found=true;}else total+=sourceText(n).length;return;}
   if(n.nodeType===Node.TEXT_NODE||n.nodeName==='BR'){total+=sourceText(n).length;return;}
   Array.from(n.childNodes).forEach((child,i)=>{if(!found&&(child.nodeName==='DIV'||child.nodeName==='P')&&i>0)total++;walk(child);});
  }walk(el);return total;
 }
 function readSelection(){const s=window.getSelection(),el=root.current;if(s?.anchorNode&&s.focusNode&&el?.contains(s.anchorNode)&&el.contains(s.focusNode)){const a=offset(s.anchorNode,s.anchorOffset),b=offset(s.focusNode,s.focusOffset);selection.current={start:Math.min(a,b),end:Math.max(a,b)};}return selection.current;}
 type ChipAffinity = 'before' | 'after';
 function emptyChipAt(at: number) {
  let offset = 0;
  for (const [index, node] of Array.from(root.current!.childNodes).entries()) {
   if (offset > at) break;
   if (offset === at && node instanceof HTMLElement && node.dataset.source === '') {
    return index;
   }
   offset += sourceText(node).length;
  }
  return undefined;
 }
 function caretAffinity(at: number): ChipAffinity | undefined {
  if (!latest.current.preserveCaretAfterInlineChips) return;
  const current = window.getSelection();
  const chipIndex = emptyChipAt(at);
  if (current?.isCollapsed && current.rangeCount && chipIndex !== undefined) {
   const before = document.createRange();
   before.setStart(root.current!, chipIndex);
   before.collapse(true);
   if (current.getRangeAt(0).compareBoundaryPoints(Range.START_TO_START, before) <= 0) {
    return 'before';
   }
  }
  return 'after';
 }
 function position(at:number, affinity?:ChipAffinity):[Node,number]{
  const el=root.current!;
  if (affinity) {
   const first = emptyChipAt(at);
   if (first !== undefined) {
    let boundary = first;
    if (affinity === 'after') {
     while (el.childNodes[boundary] instanceof HTMLElement &&
            (el.childNodes[boundary] as HTMLElement).dataset.source === '') boundary++;
    }
    return [el, boundary];
   }
  }
  let remaining=Math.max(0,Math.min(at,sourceText(el).length));
  for(let i=0;i<el.childNodes.length;i++){const n=el.childNodes[i],length=sourceText(n).length;
   if(n.nodeType===Node.TEXT_NODE&&remaining<=length)return [n,remaining];
   if(n instanceof HTMLElement&&n.dataset.source!==undefined&&remaining<=length)return [el,remaining===0?i:i+1];
   if(remaining<=length&&n.nodeName==='MARK'&&n.firstChild)return [n.firstChild,remaining];
   remaining-=length;
  }return [el,el.childNodes.length];
 }
 function setSelectionRange(start:number,end:number,affinity?:ChipAffinity){
  selection.current={start,end};
  if(!root.current)return;
  const caretSide = start === end && latest.current.preserveCaretAfterInlineChips
   ? affinity ?? 'after'
   : undefined;
  const a=position(start,caretSide),b=position(end,caretSide),range=document.createRange();
  range.setStart(...a);range.setEnd(...b);
  const s=window.getSelection();s?.removeAllRanges();s?.addRange(range);
 }
 useImperativeHandle(ref,()=>({
  get selectionStart(){return readSelection().start;},get selectionEnd(){return readSelection().end;},
  focus(){root.current?.focus();},blur(){root.current?.blur();},select(){setSelectionRange(0,sourceText(root.current!).length);},setSelectionRange,
  get inputMode(){return root.current?.inputMode||'none';},set inputMode(v){if(root.current)root.current.inputMode=v;},get dataset(){return root.current!.dataset;},
 }));
 function render(){
  const el=root.current;if(!el||composing.current)return;const state=latest.current,focused=document.activeElement===el,saved={...readSelection()},fragment=document.createDocumentFragment();
  const affinity = focused && saved.start === saved.end ? caretAffinity(saved.start) : undefined;
  function plain(start:number,end:number){if(end<=start)return;const l=state.loading;if(l&&l.start>=start&&l.end<=end){fragment.append(document.createTextNode(state.text.slice(start,l.start)));const mark=document.createElement('mark');mark.dataset.recognizing='color';mark.textContent=state.text.slice(l.start,l.end);fragment.append(mark,document.createTextNode(state.text.slice(l.end,end)));}else fragment.append(document.createTextNode(state.text.slice(start,end)));}
  let cursor=0;
  for(const token of state.live.parameters){
   if(token.start<cursor||state.text.slice(token.start,token.end)!==token.phrase)continue;plain(cursor,token.start);cursor=token.end;
   fragment.append(state.live.renderChip(token,{
     preserveSelection:readSelection,
     onOpen:()=>latest.current.live.open(token.id),
     onRemove:state.live.remove?()=>latest.current.live.remove?.(token.id):undefined,
     sweepStarts:sweepStarts.current,
   }));
  }
  plain(cursor,state.text.length);if(state.text.endsWith('\n'))fragment.append(document.createElement('br'));if(!fragment.childNodes.length)fragment.append(document.createTextNode(''));
  el.replaceChildren(fragment);el.dataset.value=state.text;selection.current=saved;if(focused)setSelectionRange(saved.start,saved.end,affinity);
 }
 useLayoutEffect(render,[language,p.text,JSON.stringify(p.live?.parameters),p.live?.active,p.live?.containedRemove,Boolean(p.live?.remove),p.disabled,p.loading?.start,p.loading?.end]);
 useEffect(()=>{const listener=()=>{if(document.activeElement===root.current){readSelection();latest.current.onSelect();}};document.addEventListener('selectionchange',listener);return()=>{clearTimeout(compTimer.current);document.removeEventListener('selectionchange',listener);};},[]);
 function changed(){if(composing.current||!root.current)return;readSelection();const text=sourceText(root.current);latest.current.onSelect();latest.current.onChange(text);}
 /** IME/dictation composition: never rewrite the DOM (the IME owns it), only mirror committed Han text into state for recognition. */
 function syncComposition(){if(!root.current||/[a-zA-Z']/.test(compData.current))return;const text=sourceText(root.current);if(text!==latest.current.text)latest.current.onChange(text);}
 function handleInput(){clearTimeout(compTimer.current);if(!composing.current){changed();return;}compTimer.current=setTimeout(syncComposition,250);}
 function finishComposition(){
  clearTimeout(compTimer.current);
  if(!composing.current)return;
  const editor = root.current;
  if (latest.current.preserveCaretAfterInlineChips && editor) {
   // Keep layout effects from touching the IME DOM until the final text has
   // made it through the controlled input. Render once from the updated props.
   readSelection();
   const text = sourceText(editor);
   flushSync(() => {
    latest.current.onSelect();
    latest.current.onChange(text);
   });
   composing.current=false;
   compData.current='';
   render();
   return;
  }
  composing.current=false;compData.current='';changed();render();
 }
 return <div ref={root} className="wb-sentence-composer ic-wb-sentence-composer" role="textbox" aria-multiline="true" aria-label={p.label||uiText("手机 WorkBuddy 草稿")} contentEditable={!p.disabled} suppressContentEditableWarning inputMode={p.inputMode||"none"} data-placeholder={p.placeholder} onFocus={p.onFocus} onBlur={finishComposition} onInput={handleInput} onCompositionStart={()=>{composing.current=true;compData.current='';clearTimeout(compTimer.current);}} onCompositionUpdate={e=>{compData.current=e.data||'';}} onCompositionEnd={finishComposition} onCopy={e=>{if(!latest.current.preserveSourceClipboard)return;const s=readSelection();e.preventDefault();e.clipboardData.setData('text/plain',latest.current.text.slice(s.start,s.end));}} onCut={e=>{if(!latest.current.preserveSourceClipboard||composing.current)return;const s=readSelection(),text=sourceText(root.current!);e.preventDefault();e.clipboardData.setData('text/plain',text.slice(s.start,s.end));flushSync(()=>latest.current.onChange(text.slice(0,s.start)+text.slice(s.end)));setSelectionRange(s.start,s.start);}} onPaste={e=>{if(composing.current)return;e.preventDefault();const s=readSelection(),value=sourceText(root.current!),insert=e.clipboardData.getData('text/plain');if(latest.current.preserveSourceClipboard){flushSync(()=>latest.current.onChange(value.slice(0,s.start)+insert+value.slice(s.end)));setSelectionRange(s.start+insert.length,s.start+insert.length);}else{latest.current.onChange(value.slice(0,s.start)+insert+value.slice(s.end));requestAnimationFrame(()=>setSelectionRange(s.start+insert.length,s.start+insert.length));}}}/>
});
