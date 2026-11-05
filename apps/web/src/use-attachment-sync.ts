import {useCallback,useEffect,useRef,useState} from 'react';
/** One serial reconciliation lane. Adoption/removal never calls task submission. */
export function useAttachmentSync(owner:string,signature:string,enabled:boolean,reconcile:()=>Promise<void>){
 const latest=useRef({owner,signature,enabled,reconcile});latest.current={owner,signature,enabled,reconcile};
 const active=useRef<Promise<boolean>|null>(null),attempted=useRef(''),mounted=useRef(true);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{setError('');},[owner]);
 const run=useCallback(async():Promise<boolean>=>{
  if(active.current){await active.current;return run();}
  const snapshot=latest.current;if(!snapshot.enabled)return false;
  attempted.current=JSON.stringify([snapshot.owner,snapshot.signature]);if(mounted.current){setBusy(true);setError('');}
  const pending=(async()=>{try{await snapshot.reconcile();return latest.current.owner===snapshot.owner;}catch(e){if(mounted.current&&latest.current.owner===snapshot.owner)setError((e as Error).message);return false;}finally{active.current=null;if(mounted.current)setBusy(false);}})();active.current=pending;return pending;
 },[]);
 useEffect(()=>{if(!enabled){attempted.current='';return;}const key=JSON.stringify([owner,signature]);if(busy||attempted.current===key)return;const timer=setTimeout(()=>void run(),200);return()=>clearTimeout(timer);},[owner,signature,enabled,busy,run]);
 return {busy,error,run};
}
