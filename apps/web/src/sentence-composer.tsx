import type {WbFile} from '../../../packages/core/workbuddy';
import {forwardRef,useEffect,useImperativeHandle,useLayoutEffect,useRef} from 'react';
import type {TextInputHandle} from './text-input-handle';
import type {SentenceKind,SentenceParameter} from '../../../packages/core/workbuddy-sentence';
import type {WorkBuddyInput} from '../../../packages/core/workbuddy-input';
import {intentColors} from '../../../packages/core/workbuddy-intents';

const sourceText=(node:Node):string=>{
 if(node instanceof HTMLElement&&node.dataset.source!==undefined)return node.dataset.source;
 if(node.nodeType===Node.TEXT_NODE)return node.textContent||'';
 if(node.nodeName==='BR')return node.nextSibling?'\n':'';
 return Array.from(node.childNodes).map((child,i)=>((child.nodeName==='DIV'||child.nodeName==='P')&&i>0?'\n':'')+sourceText(child)).join('');
};
const iconNames:Partial<Record<SentenceKind,string>>={camera:'photo',sketch:'canvas',document:'file'};
export interface SentenceComposerProps {text:string;files:WbFile[];parameters:SentenceParameter[];input:WorkBuddyInput;active:SentenceKind|null;disabled:boolean;placeholder:string;loading?:{start:number;end:number};onChange:(text:string)=>void;onSelect:()=>void;onFocus:()=>void;onOpen:(kind:SentenceKind)=>void;}
/** The DOM is editable, but the authority remains plain text + task-owned parameter bindings. */
export const SentenceComposer=forwardRef<TextInputHandle,SentenceComposerProps>(function SentenceComposer(p,ref){
 const root=useRef<HTMLDivElement>(null),composing=useRef(false),selection=useRef({start:0,end:0}),latest=useRef(p);latest.current=p;
 function offset(container:Node,at:number):number{
  const el=root.current!;let total=0,found=false;
  function walk(n:Node){if(found)return;if(n===container){if(n.nodeType===Node.TEXT_NODE)total+=at;else total+=Array.from(n.childNodes).slice(0,at).reduce((a,c)=>a+sourceText(c).length,0);found=true;return;}
   if(n instanceof HTMLElement&&n.dataset.source!==undefined){if(n.contains(container)){total+=at?sourceText(n).length:0;found=true;}else total+=sourceText(n).length;return;}
   if(n.nodeType===Node.TEXT_NODE||n.nodeName==='BR'){total+=sourceText(n).length;return;}
   Array.from(n.childNodes).forEach((child,i)=>{if(!found&&(child.nodeName==='DIV'||child.nodeName==='P')&&i>0)total++;walk(child);});
  }walk(el);return total;
 }
 function readSelection(){const s=window.getSelection(),el=root.current;if(s?.anchorNode&&s.focusNode&&el?.contains(s.anchorNode)&&el.contains(s.focusNode)){const a=offset(s.anchorNode,s.anchorOffset),b=offset(s.focusNode,s.focusOffset);selection.current={start:Math.min(a,b),end:Math.max(a,b)};}return selection.current;}
 function position(at:number):[Node,number]{
  const el=root.current!;let remaining=Math.max(0,Math.min(at,sourceText(el).length));
  for(let i=0;i<el.childNodes.length;i++){const n=el.childNodes[i],length=sourceText(n).length;
   if(n.nodeType===Node.TEXT_NODE&&remaining<=length)return [n,remaining];
   if(n instanceof HTMLElement&&n.dataset.source!==undefined&&remaining<=length)return [el,remaining===0?i:i+1];
   if(remaining<=length&&n.nodeName==='MARK'&&n.firstChild)return [n.firstChild,remaining];
   remaining-=length;
  }return [el,el.childNodes.length];
 }
 function setSelectionRange(start:number,end:number){selection.current={start,end};if(!root.current)return;const a=position(start),b=position(end),range=document.createRange();range.setStart(...a);range.setEnd(...b);const s=window.getSelection();s?.removeAllRanges();s?.addRange(range);}
 useImperativeHandle(ref,()=>({
  get selectionStart(){return readSelection().start;},get selectionEnd(){return readSelection().end;},
  focus(){root.current?.focus();},blur(){root.current?.blur();},select(){setSelectionRange(0,sourceText(root.current!).length);},setSelectionRange,
  get inputMode(){return root.current?.inputMode||'none';},set inputMode(v){if(root.current)root.current.inputMode=v;},get dataset(){return root.current!.dataset;},
 }));
 function render(){
  const el=root.current;if(!el||composing.current)return;const state=latest.current,focused=document.activeElement===el,saved={...readSelection()},fragment=document.createDocumentFragment();
  function plain(start:number,end:number){if(end<=start)return;const l=state.loading;if(l&&l.start>=start&&l.end<=end){fragment.append(document.createTextNode(state.text.slice(start,l.start)));const mark=document.createElement('mark');mark.dataset.recognizing='color';mark.textContent=state.text.slice(l.start,l.end);fragment.append(mark,document.createTextNode(state.text.slice(l.end,end)));}else fragment.append(document.createTextNode(state.text.slice(start,end)));}
  let cursor=0;
  for(const token of state.parameters){if(token.start<cursor)continue;plain(cursor,token.start);cursor=token.end;
   const hit=document.createElement('span');hit.className='sentence-token-hit';hit.dataset.source=state.text.slice(token.start,token.end);hit.dataset.kind=token.kind;hit.contentEditable='false';
   const button=document.createElement('button');button.type='button';button.className='sentence-token';button.dataset.kind=token.kind;button.dataset.state=token.suggested?'suggested':'default';button.setAttribute('aria-pressed',String(state.active===token.kind));button.disabled=state.disabled;const face=document.createElement('span');face.className='sentence-token-face';button.append(face);
   let label=token.label;const slot=state.input.materialSlots?.[token.kind as keyof NonNullable<WorkBuddyInput['materialSlots']>],file=slot?.phrase===token.phrase?state.files.find(f=>f.id===slot.file):undefined;
   const value=state.input.inlineValues?.[token.kind as keyof NonNullable<WorkBuddyInput['inlineValues']>];if(value?.phrase===token.phrase){label=value.value;button.dataset.state='default';}
   if(file){label=file.name;button.dataset.state='default';if(file.kind==='image'&&file.asset){const image=document.createElement('img');image.src=file.asset;image.alt='';image.className='sentence-media';face.append(image);}else{const icon=document.createElement('img');icon.src=`./assets/figma/sentence-parameters/${file.kind==='video'?'recording':'file'}.svg`;icon.alt='';icon.className='sentence-icon';face.append(icon);}}else if(token.kind==='color'){
    const hex=state.input.color?.hex||intentColors[token.value]||token.value;
    const rgb=(value:string)=>value.slice(1).match(/../g)!.map(x=>parseInt(x,16));const actual=rgb(hex);
    label=Object.entries(intentColors).sort(([,a],[,b])=>rgb(a).reduce((n,c,i)=>n+(c-actual[i])**2,0)-rgb(b).reduce((n,c,i)=>n+(c-actual[i])**2,0))[0]?.[0]||token.label;
    const swatch=document.createElement('i');swatch.className='sentence-swatch';swatch.style.background=hex;face.append(swatch);
   }else if(token.kind==='sketch'&&state.input.sketch.confirmed){
    label='布局草图';button.dataset.state='default';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 60');svg.classList.add('sentence-sketch');
    for(const points of state.input.sketch.strokes){const line=document.createElementNS(svg.namespaceURI,'polyline');line.setAttribute('points',points.map(([x,y])=>`${x*100},${y*60}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','#157b74');line.setAttribute('stroke-width','2');svg.append(line);}face.append(svg);
   }else{const icon=document.createElement('img');icon.src=`./assets/figma/sentence-parameters/${iconNames[token.kind]||token.kind}.svg`;icon.alt='';icon.className='sentence-icon '+token.kind;face.append(icon);}
   const text=document.createElement('span');text.textContent=label;face.append(text);if(token.kind==='color'||value){const chevron=document.createElement('img');chevron.src='./assets/figma/sentence-parameters/chevron.svg';chevron.className='sentence-chevron';chevron.alt='';face.append(chevron);}
   button.setAttribute('aria-label',token.kind==='color'?`主色 ${label}`:label);button.title=token.phrase||'布局';button.onpointerdown=e=>{e.preventDefault();readSelection();};button.onclick=()=>latest.current.onOpen(token.kind);hit.append(button);fragment.append(hit);
  }
  plain(cursor,state.text.length);if(state.text.endsWith('\n'))fragment.append(document.createElement('br'));if(!fragment.childNodes.length)fragment.append(document.createTextNode(''));
  el.replaceChildren(fragment);el.dataset.value=state.text;if(focused)setSelectionRange(saved.start,saved.end);
 }
 useLayoutEffect(render,[p.text,JSON.stringify(p.parameters),p.input.revision,p.active,p.disabled,p.loading?.start,p.loading?.end,p.files.map(f=>f.id+f.name).join('|')]);
 useEffect(()=>{const listener=()=>{if(document.activeElement===root.current){readSelection();latest.current.onSelect();}};document.addEventListener('selectionchange',listener);return()=>document.removeEventListener('selectionchange',listener);},[]);
 function changed(){if(composing.current)return;readSelection();const text=sourceText(root.current!);latest.current.onSelect();latest.current.onChange(text);}
 return <div ref={root} className="wb-sentence-composer" role="textbox" aria-multiline="true" aria-label="手机 WorkBuddy 草稿" contentEditable suppressContentEditableWarning inputMode="none" data-placeholder={p.placeholder} onFocus={p.onFocus} onInput={changed} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;changed();}} onPaste={e=>{e.preventDefault();const s=readSelection(),value=latest.current.text,insert=e.clipboardData.getData('text/plain');latest.current.onChange(value.slice(0,s.start)+insert+value.slice(s.end));requestAnimationFrame(()=>setSelectionRange(s.start+insert.length,s.start+insert.length));}}/>
});
