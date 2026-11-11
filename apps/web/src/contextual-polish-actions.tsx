import {uiText} from './i18n';
import {useLayoutEffect,useRef} from 'react';
import {Pencil,Sparkles,Square} from 'lucide-react';
import {ApplicationActionChip} from './application-action-chip';
import type {PolishAction} from '../../../packages/core/polish-actions';
/** Presentation only. Requests, target validation and replacement belong to usePhoneEditing. */
export function ContextualPolishActions({actions,binding,activeAction='',failedAction='',disabled=false,error='',onAction,onCancel}:{actions:Pick<PolishAction,'id'|'label'>[];binding:string;activeAction?:string;failedAction?:string;disabled?:boolean;error?:string;onAction:(id:string)=>void;onCancel?:()=>void}){
 const root=useRef<HTMLDivElement>(null);
 useLayoutEffect(()=>{const el=root.current;if(!el)return;let parent:HTMLElement|null=el.parentElement;while(parent&&!parent.querySelector('.input-dock'))parent=parent.parentElement;const dock=parent?.querySelector('.input-dock');if(dock){const tokens=getComputedStyle(dock);for(const key of ['--input-ink','--input-accent','--input-soft','--input-control','--input-edge','--input-shadow'])el.style.setProperty(key,tokens.getPropertyValue(key));}});
 useLayoutEffect(()=>{const parent=root.current?.parentElement;if(!parent)return;parent.classList.add('polish-stack');return()=>parent.classList.remove('polish-stack');},[actions.length]);
 if(!actions.length)return null;
 return <div ref={root} className="contextual-polish" data-target={binding}>
  <div className="contextual-polish-row" role="group" aria-label={uiText("AI润色")}>
   <span className="contextual-polish-title"><span className="polish-smart-pencil" aria-hidden><Pencil size={17}/><Sparkles size={9}/></span>{uiText("AI润色")}</span>
   <div className="contextual-polish-options">{actions.slice(0,3).map(a=>{
    const active=activeAction===a.id, stoppable=active&&!!onCancel;
    return <ApplicationActionChip key={a.id} aria-label={stoppable?uiText('停止润色'):failedAction===a.id?uiText('重试')+' '+uiText(a.label):uiText(a.label)} loading={active} disabled={!stoppable&&(disabled||!!activeAction)} onPointerDown={e=>e.preventDefault()} onClick={()=>stoppable?onCancel?.():onAction(a.id)}>
     {active?uiText('处理中'):failedAction===a.id?uiText('重试')+' '+uiText(a.label):uiText(a.label)}
     {stoppable&&<span className="polish-chip-stop"><Square size={12} fill="currentColor" aria-hidden="true"/>{uiText('停止')}</span>}
    </ApplicationActionChip>;
   })}</div>
  </div>
  {error&&<p className="polish-error" role="alert">{uiText(error)}</p>}
 </div>;
}
