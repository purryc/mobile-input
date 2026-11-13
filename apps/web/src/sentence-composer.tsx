import {flushSync} from 'react-dom';
import {uiText,useUILanguage} from './i18n';
import './sentence-composer.css';
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
export interface ComposerLiveToken extends Omit<importLiveParameter,'kind'> {kind:string;origin?:'explicit'|'recommended'|'manual';sweepKey?:string;animate?:boolean;iconPath?:string;iconSrc?:string;recommendationIconSrc?:string;removable?:boolean;preparing?:boolean;prefix?:string;suffix?:string;}
type importLiveParameter=import('../../../packages/core/live-workbuddy').LiveParameter;
export interface SentenceComposerProps {label?:string;inputMode?:'text'|'none';preserveSourceClipboard?:boolean;preserveCaretAfterInlineChips?:boolean;text:string;files:WbFile[];parameters:SentenceParameter[];input:WorkBuddyInput;active:SentenceKind|null;disabled:boolean;placeholder:string;loading?:{start:number;end:number};onChange:(text:string)=>void;onSelect:()=>void;onFocus:()=>void;onOpen:(kind:SentenceKind)=>void;live?:{renderChip?:(token:ComposerLiveToken,options:{preserveSelection:()=>void;onOpen:()=>void;onRemove?:()=>void;sweepStarts:Map<string,number>})=>HTMLElement;containedRemove?:boolean;controlsId?:string;parameters:ComposerLiveToken[];active:string|null;open:(id:string)=>void;remove?:(id:string)=>void};}
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
  if(state.live)for(const token of state.live.parameters){
   if(token.start<cursor||state.text.slice(token.start,token.end)!==token.phrase)continue;plain(cursor,token.start);cursor=token.end;
   if(state.live.renderChip){
    fragment.append(state.live.renderChip(token,{preserveSelection:readSelection,onOpen:()=>latest.current.live?.open(token.id),onRemove:state.live.remove?()=>latest.current.live?.remove?.(token.id):undefined,sweepStarts:sweepStarts.current}));
    continue;
   }
   const hit=document.createElement('span');hit.className='sentence-token-hit';hit.dataset.source=token.phrase;hit.contentEditable='false';
   const button=document.createElement('button');button.type='button';button.className='sentence-token';button.disabled=state.disabled;button.dataset.kind=token.kind;button.dataset.parameterId=token.id;button.setAttribute('aria-expanded',String(state.live.active===token.id));if(state.live.active===token.id&&state.live.controlsId)button.setAttribute('aria-controls',state.live.controlsId);button.dataset.state=token.manual?'default':'suggested';if(token.origin)button.dataset.origin=token.origin;button.setAttribute('aria-label',`${uiText(token.kind==='photo'?'图片':token.role)} ${token.label}`);button.setAttribute('aria-pressed',String(state.live.active===token.id));
   const face=document.createElement('span');face.className='sentence-token-face';if(token.kind==='color'&&/^#[0-9A-Fa-f]{6}$/.test(token.value)){const swatch=document.createElement('i');swatch.className='sentence-swatch';swatch.style.background=token.value;face.append(swatch);}else if(!token.iconSrc&&['document','photo','sketch'].includes(token.kind)){const icon=document.createElement('img');icon.src=`./assets/figma/sentence-parameters/${token.kind==='document'?'file':token.kind==='photo'?'photo':'canvas'}.svg`;icon.alt='';icon.className='sentence-icon';face.append(icon);}
   if(token.iconSrc){const icon=document.createElement('img');icon.src=token.iconSrc;icon.alt='';icon.className='sentence-icon';face.prepend(icon);}else if(token.iconPath){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.7');svg.classList.add('demo-chip-icon');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',token.iconPath);svg.append(path);face.prepend(svg);}
   const label=document.createElement('span');label.className='demo-chip-label';label.textContent=token.label;face.append(label);
   if(token.origin==='recommended'){const star=document.createElement('span');star.className='demo-chip-smart';if(token.recommendationIconSrc){const icon=document.createElement('img');icon.src=token.recommendationIconSrc;icon.alt='';star.append(icon);}else star.textContent='✧';star.setAttribute('aria-hidden','true');face.append(star);}
   button.append(face);button.title=state.live.containedRemove?`${uiText(token.role)} ${token.label}`:token.label;
   if(!token.preparing&&token.animate&&token.sweepKey){const key=token.sweepKey;let started=sweepStarts.current.get(key);if(started===undefined){started=performance.now();sweepStarts.current.set(key,started);}const elapsed=performance.now()-started;if(elapsed<1400){button.dataset.sweep='true';button.style.setProperty('--sweep-delay',`-${elapsed}ms`);}}
   button.onpointerdown=e=>{e.preventDefault();readSelection();};
   button.onclick=()=>latest.current.live?.open(token.id);
   if(token.prefix)hit.append(document.createTextNode(token.prefix));
   const contained = state.live.containedRemove && (token.removable || token.preparing);
   const capsule = contained ? document.createElement('span') : hit;
   if(contained){capsule.className='sentence-token-capsule';if(token.origin)capsule.dataset.origin=token.origin;capsule.dataset.expanded=String(state.live.active===token.id);if(button.dataset.sweep){capsule.dataset.sweep='true';capsule.style.setProperty('--sweep-delay',button.style.getPropertyValue('--sweep-delay'));}hit.append(capsule);}
   capsule.append(button);
   if(token.removable&&state.live.remove){
     const remove=document.createElement('button');remove.type='button';remove.className='demo-chip-remove';
     if(contained){const icon=document.createElement('img');icon.src='./reference-assets/workbuddy-widgets/close.svg';icon.alt='';remove.append(icon);}else remove.textContent='×';
     remove.setAttribute('aria-label',(language==='en'?'Remove recommendation ':'移除推荐 ')+token.label);
     if(contained)remove.disabled=state.disabled;remove.onpointerdown=e=>e.preventDefault();remove.onclick=()=>latest.current.live?.remove?.(token.id);capsule.append(remove);
   }
   if(token.preparing){
     capsule.dataset.preparing='true';capsule.setAttribute('role','img');capsule.setAttribute('aria-label',language==='en'?'Preparing suggestion':'正在整理建议');capsule.setAttribute('aria-busy','true');
     capsule.querySelectorAll('button').forEach(b=>{b.disabled=true;b.tabIndex=-1;b.setAttribute('aria-hidden','true');});
   }
   if(token.suffix)hit.append(document.createTextNode(token.suffix));fragment.append(hit);
  }
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
   const text=document.createElement('span');text.textContent=label;face.append(text);
   button.setAttribute('aria-label',token.kind==='color'?`主色 ${label}`:label);button.title=token.phrase||'布局';button.onpointerdown=e=>{e.preventDefault();readSelection();};button.onclick=()=>latest.current.onOpen(token.kind);hit.append(button);fragment.append(hit);
  }
  plain(cursor,state.text.length);if(state.text.endsWith('\n'))fragment.append(document.createElement('br'));if(!fragment.childNodes.length)fragment.append(document.createTextNode(''));
  el.replaceChildren(fragment);el.dataset.value=state.text;selection.current=saved;if(focused)setSelectionRange(saved.start,saved.end,affinity);
 }
 useLayoutEffect(render,[language,p.text,JSON.stringify(p.parameters),JSON.stringify(p.live?.parameters),p.live?.active,p.live?.containedRemove,Boolean(p.live?.remove),p.input.revision,p.active,p.disabled,p.loading?.start,p.loading?.end,p.files.map(f=>f.id+f.name).join('|')]);
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
 return <div ref={root} className="wb-sentence-composer" role="textbox" aria-multiline="true" aria-label={p.label||uiText("手机 WorkBuddy 草稿")} contentEditable={!p.disabled} suppressContentEditableWarning inputMode={p.inputMode||"none"} data-placeholder={p.placeholder} onFocus={p.onFocus} onBlur={finishComposition} onInput={handleInput} onCompositionStart={()=>{composing.current=true;compData.current='';clearTimeout(compTimer.current);}} onCompositionUpdate={e=>{compData.current=e.data||'';}} onCompositionEnd={finishComposition} onCopy={e=>{if(!latest.current.preserveSourceClipboard)return;const s=readSelection();e.preventDefault();e.clipboardData.setData('text/plain',latest.current.text.slice(s.start,s.end));}} onCut={e=>{if(!latest.current.preserveSourceClipboard||composing.current)return;const s=readSelection(),text=sourceText(root.current!);e.preventDefault();e.clipboardData.setData('text/plain',text.slice(s.start,s.end));flushSync(()=>latest.current.onChange(text.slice(0,s.start)+text.slice(s.end)));setSelectionRange(s.start,s.start);}} onPaste={e=>{if(composing.current)return;e.preventDefault();const s=readSelection(),value=sourceText(root.current!),insert=e.clipboardData.getData('text/plain');if(latest.current.preserveSourceClipboard){flushSync(()=>latest.current.onChange(value.slice(0,s.start)+insert+value.slice(s.end)));setSelectionRange(s.start+insert.length,s.start+insert.length);}else{latest.current.onChange(value.slice(0,s.start)+insert+value.slice(s.end));requestAnimationFrame(()=>setSelectionRange(s.start+insert.length,s.start+insert.length));}}}/>
});
