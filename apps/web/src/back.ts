import {useLayoutEffect,useRef} from 'react';
const handlers=new Map<symbol,{priority:number;run:()=>boolean}>();
window.addEventListener('app-back',event=>{
 if(event.defaultPrevented)return;
 for(const handler of [...handlers.values()].sort((a,b)=>b.priority-a.priority)){
  if(handler.run()){event.preventDefault();return;}
 }
});
export function useBack(handler:()=>boolean,priority:number){
 const latest=useRef(handler);latest.current=handler;
 useLayoutEffect(()=>{const key=Symbol();handlers.set(key,{priority,run:()=>latest.current()});return()=>{handlers.delete(key);};},[priority]);
}
