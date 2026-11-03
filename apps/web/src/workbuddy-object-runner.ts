import {useEffect,useRef} from 'react';
import type {State} from '../../../packages/core/model';
import {browserState,findFileView,working} from '../../../packages/core/workbuddy-files';
import {command,currentState,role} from './runtime';
import {deckStream} from './web-deck-api';
/** Only the authority executes AI. Phone commands carry intent, never a model result. */
export function useObjectRevision(s:State){
 const running=useRef(new Map<string,AbortController>());
 useEffect(()=>{if(role!=='tablet')return;
  const jobs=Object.entries(browserState(s).objectInputs||{}).filter(([,o])=>o.pending);
  const valid=(owner:string,id:string)=>{const state=currentState(),o=browserState(state).objectInputs?.[owner],j=o?.pending,v=o&&findFileView(state,o.view),a=v&&o&&working(state,v,o.file);return !!(j&&j.id===id&&state.app==='workbuddy'&&state.target?.id===owner&&state.target.revision===j.targetRevision&&v?.active===o?.file&&a?.version===j.target.version&&a.base===j.target.base&&state.workbuddy.entityDrafts[owner]?.revision===j.draftRevision);};
  for(const [id,controller] of running.current){const found=jobs.find(([,o])=>o.pending!.id===id);if(!found||!valid(found[0],id)){controller.abort();running.current.delete(id);if(found)void command('wb-object-ai-fail',{owner:found[0],request:id,error:'目标或内容已变化，修改要求已保留'});}}
  for(const [owner,o] of jobs){const job=o.pending!;if(running.current.has(job.id))continue;if(!valid(owner,job.id)){void command('wb-object-ai-fail',{owner,request:job.id,error:'目标已变化，修改要求已保留'});continue;}
   const controller=new AbortController();running.current.set(job.id,controller);
   void deckStream('revise-selection',{target:job.target,instruction:job.instruction},controller.signal,event=>{if(event.patch&&valid(owner,job.id))void command('wb-object-ai-finish',{owner,request:job.id,text:event.patch.text});}).catch(e=>{if(!controller.signal.aborted)void command('wb-object-ai-fail',{owner,request:job.id,error:e.message});}).finally(()=>running.current.delete(job.id));
  }
 },[s]);
 useEffect(()=>()=>{for(const [id,c] of running.current){c.abort();const owner=Object.entries(browserState(currentState()).objectInputs||{}).find(([,o])=>o.pending?.id===id)?.[0];if(owner)void command('wb-object-ai-fail',{owner,request:id,error:'修改已暂停，要求已保留'});}running.current.clear();},[]);
}
