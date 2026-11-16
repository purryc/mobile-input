import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
export interface WidgetTheme {accent?:string;tint?:string;ink?:string;glass?:string;}
export interface WidgetEnvironment {
  language: string;
  translate: (text:string)=>string;
  assetBase: string;
  portalRoot?: HTMLElement|null;
  theme?: WidgetTheme;
}
const Environment=createContext<WidgetEnvironment>({language:'zh-CN',translate:text=>text,assetBase:''});
export function WidgetProvider({children,...value}:WidgetEnvironment&{children:ReactNode}) {return <Environment.Provider value={value}>{children}</Environment.Provider>;}
export const useWidgetEnvironment=()=>useContext(Environment);
export const useWidgetText=()=>useWidgetEnvironment().translate;
export function assetUrl(base:string,path:string){return `${base.replace(/\/$/,'')}/${path.replace(/^(?:\.\/|\/)/,'')}`;}
export function useWidgetThemeStyle():CSSProperties {
  const {theme}=useWidgetEnvironment();
  return Object.fromEntries(Object.entries(theme||{}).map(([key,value])=>['--controls-'+key,value])) as CSSProperties;
}
export function WidgetSurface({children,className=''}:{children:ReactNode;className?:string}){
  const style=useWidgetThemeStyle();return <div className={'input-controls-theme '+className} style={style}>{children}</div>;
}
