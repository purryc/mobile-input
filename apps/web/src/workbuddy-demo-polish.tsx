import { useEffect, useRef, useState, type RefObject } from 'react';
import { ContextualPolishActions } from './contextual-polish-actions';
import { uiText } from './i18n';
import { Undo2 } from 'lucide-react';
import type { TextInputHandle } from './text-input-handle';
import type { DemoDraft } from '../../../packages/core/workbuddy-demo-state';
import { editDemoText } from '../../../packages/core/workbuddy-demo-state';
import { applyDemoPolish, demoPolishActions, type DemoPolishInput } from '../../../packages/core/workbuddy-demo-polish';
import './ai-polish.css';

const stamp = (draft: DemoDraft | undefined) => draft ? JSON.stringify([draft.id,draft.text,draft.parameters,draft.controls?.map(({seen,...c})=>c),draft.dismissedControls]) : '';
interface Undo {before: Pick<DemoDraft,'text'|'parameters'|'controls'|'dismissedControls'>; after: string; selection: {start:number;end:number};}
interface Options {
  draft: DemoDraft | undefined;
  phase: string;
  language: string;
  disabled: boolean;
  area: RefObject<TextInputHandle | null>;
  current: () => DemoDraft | undefined;
  update: (id:string,change:(draft:DemoDraft)=>DemoDraft)=>void;
}
export function useDemoPolish(options: Options) {
  const latest=useRef(options); latest.current=options;
  const [selection,setSelection]=useState({start:0,end:0});
  const selected=useRef(selection);
  const [stable,setStable]=useState('');
  const [actions,setActions]=useState<ReturnType<typeof demoPolishActions>>([]);
  const [active,setActive]=useState(''),[failed,setFailed]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [,render]=useState(0);
  const request=useRef<AbortController|null>(null), mounted=useRef(true);
  const history=useRef(new Map<string,Undo>());
  const key=stamp(options.draft), binding=key+JSON.stringify(selection);
  function cancel() { request.current?.abort();request.current=null;setActive(''); }
  function select() {
    const area=latest.current.area.current;
    if(!area)return;
    const next={start:area.selectionStart,end:area.selectionEnd};
    if(next.start===selected.current.start&&next.end===selected.current.end)return;
    selected.current=next;setSelection(next);cancel();setError('');setFailed('');
  }
  useEffect(()=>{
    selected.current={start:0,end:0};setSelection(selected.current);setActions([]);setStable('');
  },[options.draft?.id]);
  useEffect(()=>{
    cancel();setError('');setFailed('');setNotice('');
    const d=latest.current.draft;
    if(d && history.current.get(d.id)?.after!==stamp(d)) history.current.delete(d.id);
  },[key,options.phase,options.language]);
  useEffect(()=>{
    if(options.phase!=='idle') {setActions([]);setStable('');return;}
    const timer=setTimeout(()=>{
      const d=latest.current.draft;
      const range=selected.current;
      const text=d?.text||'';
      setActions(demoPolishActions(range.end>range.start ? text.slice(range.start,range.end) : text));
      setStable(binding);
    },400);
    return()=>clearTimeout(timer);
  },[binding,options.phase]);
  useEffect(()=>{
    mounted.current=true;
    const hidden=()=>{if(document.hidden)cancel();};
    document.addEventListener('visibilitychange',hidden);
    return()=>{mounted.current=false;request.current?.abort();document.removeEventListener('visibilitychange',hidden);};
  },[]);
  function restoreSelection(range:{start:number;end:number},owner:string) {
    selected.current=range;setSelection(range);
    requestAnimationFrame(()=>{
      if(latest.current.current()?.id===owner && selected.current.start===range.start && selected.current.end===range.end){latest.current.area.current?.focus();latest.current.area.current?.setSelectionRange(range.start,range.end);}
    });
  }
  async function run(action:string) {
    const o=latest.current, d=o.current();
    if(!d || o.phase!=='idle' || o.disabled)return;
    if(action==='cancel-polish'){cancel();return;}
    if(action==='undo-polish') {
      const undo=history.current.get(d.id);
      if(undo?.after!==stamp(d))return;
      o.update(d.id,current=>({...current,...structuredClone(undo.before)}));
      history.current.delete(d.id);restoreSelection(undo.selection,d.id);render(v=>v+1);return;
    }
    if(request.current||binding!==stable)return;
    const range={...selected.current};
    const input:DemoPolishInput={id:crypto.randomUUID(),owner:d.id,text:d.text,selection:range,action};
    const before=stamp(d),controller=new AbortController();request.current=controller;
    setActive(action);setFailed('');setError('');setNotice('');
    let timedOut=false;
    const timer=setTimeout(()=>{timedOut=true;controller.abort();},90000);
    try {
      const response=await fetch('/api/workbuddy-demo/polish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input),signal:controller.signal});
      const data=await response.json();
      if(!response.ok||data.error)throw Error(data.error||'润色失败，原文已保留');
      const current=latest.current.current();
      if(controller.signal.aborted||request.current!==controller||!mounted.current||document.hidden||stamp(current)!==before||selected.current.start!==range.start||selected.current.end!==range.end)return;
      if(data.id!==input.id)throw Error('润色结果已过期，原文已保留');
      const result=applyDemoPolish(input,data.text);
      if(result.text===d.text){setNotice('未产生文字修改');return;}
      const next=editDemoText(current!,result.text);
      history.current.set(d.id,{before:{text:d.text,parameters:structuredClone(d.parameters),controls:structuredClone(d.controls),dismissedControls:structuredClone(d.dismissedControls)},after:stamp(next),selection:range});
      latest.current.update(d.id,existing=>({...existing,text:next.text,parameters:next.parameters,controls:next.controls}));
      // Clear the request before focusing the editor, whose selection events cancel stale work.
      request.current=null;setActive('');restoreSelection(result.selection,d.id);
    } catch(e) {
      if(mounted.current && request.current===controller && (!controller.signal.aborted||timedOut)){
        setFailed(action);setError(timedOut?'润色超时，原文已保留，请重试':e instanceof TypeError?'润色连接失败，请检查网络后重试':e instanceof Error?e.message:'润色失败，原文已保留');
      }
    } finally {
      clearTimeout(timer);
      if(request.current===controller){request.current=null;if(mounted.current)setActive('');}
    }
  }
  const undo=options.draft && history.current.get(options.draft.id);
  const visible=!!options.draft?.text.trim() && options.phase==='idle' && (actions.length>0 || undo?.after===key || !!active);
  return {
    pending:!!active,cancel,select,
    row:visible ? <div className="demo-polish-slot">
      <div className="demo-polish-row">
      {undo?.after!==key && <ContextualPolishActions actions={actions} binding={options.draft?.id||''} activeAction={active} failedAction={failed} disabled={options.disabled||binding!==stable} error={error} onAction={id=>void run(id)} onCancel={cancel}/>}
      {undo?.after===key && <button type="button" className="demo-polish-restore" aria-label={uiText('恢复原文')} title={uiText('恢复原文')} disabled={options.disabled||binding!==stable||!!active} onPointerDown={e=>e.preventDefault()} onClick={()=>void run('undo-polish')}><Undo2 size={18} aria-hidden="true"/></button>}
      </div>
      {notice && <span className="demo-polish-notice" role="status">{uiText(notice)}</span>}
    </div> : null,
  };
}
