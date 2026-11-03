import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePhoneInsets} from './phone-insets';
import './input-toast.css';

/** Transient input feedback stays out of dock layout and never captures touches. */
export function InputToast({message,onDismiss}:{message:string;onDismiss:()=>void}){
 const insets=usePhoneInsets();
 const [nativeMessage,setNativeMessage]=useState<string|null>(null);
 const dismiss=useRef(onDismiss);dismiss.current=onDismiss;
 useEffect(()=>{let shown=false;try{shown=window.MobileNative?.inputToast?.(message)==='shown';}catch{}setNativeMessage(shown?message:null);const timer=setTimeout(()=>dismiss.current(),3000);return()=>clearTimeout(timer);},[message]);
 if(nativeMessage===message)return null;
 return createPortal(<div className="input-toast" style={insets} role="alert" aria-atomic="true">{message}</div>,document.body);
}
