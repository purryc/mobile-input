import {useEffect,useRef} from 'react';
import type {State} from '../../../packages/core/model';
import {command,currentState,role} from './runtime';
import {deckStream} from './web-deck-api';
export function useDeckGeneration(s:State){const running=useRef(new Map<string,{epoch:string;controller:AbortController}>());
 useEffect(()=>{if(role!=='tablet')return;
 for(const [id,job] of running.current){const t=s.workbuddy.tasks.find(t=>t.id===id);if(!t||t.status!=='running'||t.epoch!==job.epoch){job.controller.abort();running.current.delete(id);}}
 for(const task of s.workbuddy.tasks){if(!task.deckJob?.request||task.status!=='running'||running.current.has(task.id))continue;const controller=new AbortController(),epoch=task.epoch;running.current.set(task.id,{epoch,controller});const valid=()=>{const t=currentState().workbuddy.tasks.find(t=>t.id===task.id);return !controller.signal.aborted&&t?.status==='running'&&t.epoch===epoch;};
 void deckStream('generate',task.deckJob.request,controller.signal,event=>{if(!valid())return;if(event.stage)void command('wb-deck-stage',{task:task.id,epoch,stage:event.stage});if(event.deck)void command('wb-deck-complete',{task:task.id,epoch,deck:event.deck}).then(ack=>{if(!ack.ok&&valid())void command('wb-deck-failed',{task:task.id,epoch,error:ack.error||'生成结果未通过校验'});});}).catch(e=>{if(valid())void command('wb-deck-failed',{task:task.id,epoch,error:e.message});}).finally(()=>{if(running.current.get(task.id)?.epoch===epoch)running.current.delete(task.id);});
 }
 },[s]);
 useEffect(()=>()=>{for(const j of running.current.values())j.controller.abort();running.current.clear();},[]);
}
