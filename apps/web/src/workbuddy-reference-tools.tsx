import {useEffect,useRef,useState} from 'react';
import * as I from 'lucide-react';
import {command,useRuntime} from './runtime';

export function WorkBuddyReferenceTools({onSwitch}:{onSwitch:()=>Promise<void>}){
 const {state:s,connected}=useRuntime(),w=s.workbuddy,t=s.target!,d=w.drafts[w.task];
 const body=useRef<HTMLDivElement>(null);
 const [files,setFiles]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!files&&body.current)body.current.scrollTop=0;},[files]);
 async function attach(id:string){
  setBusy(true);
  try{const ack=await command('wb-attach',{id},{app:'workbuddy',targetId:t.id,targetRevision:t.revision});if(ack.ok){setFiles(false);setError('');}else setError(ack.error||'材料未添加');}
  finally{setBusy(false);}
 }
 return <div ref={body} className="wb-receipt-tools wb-reference-tools">
  <section className="wb-reference-request">
   <h2>请补充汇报材料</h2>
   <p>客户资料、报价文件或画面参考</p>
   <button disabled={!connected||busy} onClick={()=>setFiles(!files)} aria-expanded={files}><span>选择文件</span><I.FileText size={24} strokeWidth={1.65}/></button>
   <button disabled={!connected||busy} onClick={onSwitch}><span>切换应用采集</span><I.PanelsTopLeft size={24} strokeWidth={1.65}/></button>
   <small>{d.attachments.length?`已添加 ${d.attachments.length} 份材料`:'待补材料'}</small>
  </section>
  {files&&<section className="wb-reference-files"><header><b>选择文件</b><button aria-label="关闭材料文件选择" onClick={()=>setFiles(false)}><I.X size={24} strokeWidth={1.65}/></button></header><div>{w.files.filter(f=>!['image','video','audio'].includes(f.kind)).map(f=><button key={f.id} disabled={!connected||busy||d.attachments.includes(f.id)} onClick={()=>attach(f.id)}><I.FileText size={24} strokeWidth={1.65}/><span>{f.name}</span>{d.attachments.includes(f.id)&&<I.Check size={24} strokeWidth={1.65}/>}</button>)}</div></section>}
  {error&&<p role="alert">{error}</p>}
 </div>;
}
