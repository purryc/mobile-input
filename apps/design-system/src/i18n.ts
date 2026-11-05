import labels from '../../web/src/ui-labels.json';
export type Language='zh-CN'|'en';
let language:Language='zh-CN';
export function setLanguage(value:Language){language=value;document.documentElement.lang=value;}
export function getLanguage(){return language;}
export function uiText(value:string){return language==='en'?(({主题色:'Primary color',文字:'Text',背景:'Background'} as Record<string,string>)[value]||(labels as Record<string,string>)[value]||value):value;}
export const t=(zh:string,en:string)=>language==='en'?en:zh;
