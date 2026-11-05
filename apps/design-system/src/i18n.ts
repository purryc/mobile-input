import labels from '../../web/src/ui-labels.json';
import {useSyncExternalStore} from 'react';
export type Language='zh-CN'|'en';
let language:Language='zh-CN';
const listeners=new Set<()=>void>();
export function setLanguage(value:Language){language=value;document.documentElement.lang=value;listeners.forEach(f=>f());}
export function useSiteLanguage(){return useSyncExternalStore(f=>{listeners.add(f);return()=>{listeners.delete(f);};},getLanguage);}
export function getLanguage(){return language;}
export function uiText(value:string){return language==='en'?(({主题色:'Primary color',文字:'Text',背景:'Background',演讲时长:'Presentation duration',布局草图:'Layout sketch',字体:'Text color',背景颜色:'Background color',文字颜色:'Text color',标题:'Title',强调色:'Accent color'} as Record<string,string>)[value]||(labels as Record<string,string>)[value]||value):value;}
export const t=(zh:string,en:string)=>language==='en'?en:zh;
