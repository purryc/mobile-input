import {useSyncExternalStore} from 'react';

export type DockMode='keyboard'|'trackpad'|null;
// A manual choice belongs to the phone process, not a task/component instance.
// undefined means no manual choice yet; null is an explicit collapse.
let manualMode:DockMode|undefined;
const listeners=new Set<()=>void>();
export function useInputDockMode(initialMode:DockMode){
 const preference=useSyncExternalStore(
  listener=>{listeners.add(listener);return()=>listeners.delete(listener);},
  ()=>manualMode
 );
 return [preference===undefined?initialMode:preference,(mode:DockMode)=>{
  manualMode=mode;for(const listener of listeners)listener();
 }] as const;
}
