import {useSyncExternalStore} from 'react';
import labels from './ui-labels.json';
export type UILanguage='zh-CN'|'en';
let current:UILanguage=localStorage.getItem('input-agent:ui-language')==='en'?'en':'zh-CN';
const listeners=new Set<()=>void>();
export const uiLanguage=()=>current;
export function setUILanguage(next:UILanguage){if(next===current)return;current=next;localStorage.setItem('input-agent:ui-language',next);document.documentElement.lang=next;listeners.forEach(f=>f());}
export function useUILanguage(){return useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f);},uiLanguage);}
/** Explicit UI-only lookup. Never call on task titles, authored text or file names. */
export function uiText(text:string){return current==='en'?(labels as Record<string,string>)[text]||text:text;}
