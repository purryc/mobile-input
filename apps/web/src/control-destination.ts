import {useSyncExternalStore} from 'react';
export type ControlDestination='demo'|'mac'|'harmony';
let selected:ControlDestination=localStorage.getItem('input-agent-control-destination') as ControlDestination||'demo';
if(!['demo','mac','harmony'].includes(selected))selected='demo';
const listeners=new Set<()=>void>();
export const controlDestination=()=>selected;
export function selectControlDestination(value:ControlDestination){if(value===selected)return;window.dispatchEvent(new Event('control-destination-leave'));selected=value;localStorage.setItem('input-agent-control-destination',value);listeners.forEach(f=>f());window.dispatchEvent(new Event('control-destination-change'));}
export function useControlDestination(){return useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f);},controlDestination);}
