import {createContext,useContext,type ReactNode} from 'react';
export type UITranslator=(label:string)=>string;
const UIContext=createContext<UITranslator>(label=>label);
/** Host-owned labels only. No global state, persistence or product initialization. */
export function UIProvider({translate,children}:{translate:UITranslator;children:ReactNode}){
 return <UIContext.Provider value={translate}>{children}</UIContext.Provider>;
}
export const useUI=()=>useContext(UIContext);
