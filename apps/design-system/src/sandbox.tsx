import {useLayoutEffect,useRef,useState,useId} from 'react';
import {A2uiSurface} from '@a2ui/react/v0_9';
import {MessageProcessor,type ProcessableMessagePayload} from '@a2ui/web_core/v0_9';
import {RotateCcw,Copy} from 'lucide-react';
import {catalog,SandboxHost} from './catalog';
import {apis,example,validateMessages,type CatalogName} from './catalog-api';
import {DemoEditor} from './demo-controller';
import {PreviewHost} from './specimens';
import {t} from './i18n';

type Session={processor:MessageProcessor<any>;editor:DemoEditor;epoch:number};
/** A session belongs to one validated description; changing it retires every old callback. */
export function Sandbox({initial='ImageInput',initialMessages,editorText}:{initial?:CatalogName;initialMessages?:unknown[];editorText?:string}){
 const id=useId();
 const [name,setName]=useState<CatalogName>(initial);
 const [code,setCode]=useState(()=>JSON.stringify(initialMessages||example(initial),null,2));
 const [session,setSession]=useState<Session|null>(null),[events,setEvents]=useState<unknown[]>([]),[error,setError]=useState(''),[data,setData]=useState<unknown>({}),[copy,setCopy]=useState(false),[resetVersion,setResetVersion]=useState(0);
 const epoch=useRef(0);
 useLayoutEffect(()=>{
  const generation=++epoch.current;let processor:MessageProcessor<any>|undefined;let editor:DemoEditor|undefined;
  setSession(null);setEvents([]);setData({});setError('');
  try{
   const messages=validateMessages(JSON.parse(code));
   editor=new DemoEditor('demo-editor');if(editorText!==undefined)editor.change(editorText,false);
   processor=new MessageProcessor([catalog],event=>{
    if(epoch.current!==generation)return;
    setEvents(v=>[...v,event].slice(-40));
    setData(structuredClone(processor?.model.surfacesMap.get('preview')?.dataModel.get('/')||{}));
   },{version:'v0.9.1'});
   processor.processMessages(messages as ProcessableMessagePayload);
   setSession({processor,editor,epoch:generation});
   setData(structuredClone(processor.model.surfacesMap.get('preview')?.dataModel.get('/')||{}));
  }catch(e){processor?.dispose();editor?.dispose();setError(e instanceof Error?e.message:String(e));}
  return()=>{epoch.current++;processor?.dispose();editor?.dispose();};
 },[code,editorText,resetVersion]);
 const reset=(next:CatalogName=name)=>{setName(next);setCode(JSON.stringify(initialMessages||example(next),null,2));setResetVersion(v=>v+1);};
 return <div className="sandbox sandbox-live">
  <div className="sandbox-tools">{!initialMessages&&<label>{t('示例','Example')}<select aria-label={t('A2UI 示例','A2UI example')} value={name} onChange={e=>reset(e.target.value as CatalogName)}>{Object.keys(apis).filter(x=>!['Column','Text'].includes(x)).map(n=><option key={n}>{n}</option>)}</select></label>}
   <button onClick={()=>reset()}><RotateCcw size={15}/>{initialMessages?t('恢复任务计划','Restore task plan'):t('重置','Reset')}</button>
  </div>
  <p className="quiet">{t('直接操作下方控件。所有变化仅保留在本示例中；图片、润色和设备操作使用本地样例。','Try the controls below. Changes stay in this example; images, polish and device actions use local fixtures.')}</p>
  {initialMessages&&code!==JSON.stringify(initialMessages,null,2)&&<p role="status">{t('已手动编辑：当前描述仅受 Catalog 与沙盒规则校验，可恢复任务计划。','Manually edited: Catalog and sandbox validation apply. Restore the task plan to start over.')}</p>}
  <section className="sandbox-live-preview" aria-label={t('预览','Preview')}>
   <PreviewHost name={name}>{session?<SandboxHost.Provider key={session.epoch} value={{editor:session.editor,emit:e=>{if(epoch.current===session.epoch)setEvents(v=>[...v,e].slice(-40));}}}>{[...session.processor.model.surfacesMap.values()].map(surface=><A2uiSurface key={surface.id} surface={surface}/>)}</SandboxHost.Provider>:<p role="status">{t('描述需要修正；有效后预览会自动恢复。','Correct the description below; the preview resumes automatically when valid.')}</p>}</PreviewHost>
  </section>
  <details className="sandbox-code"><summary>{t('查看或修改 A2UI 描述','View or edit the A2UI description')}</summary>
   <p className="quiet">{t('修改后自动校验并更新预览。无效描述不会执行。','Edits are validated and previewed automatically. Invalid descriptions are never executed.')}</p>
   <button onClick={()=>{navigator.clipboard.writeText(code).then(()=>setCopy(true)).catch(()=>setCopy(false));}}><Copy size={15}/>{copy?t('已复制','Copied'):t('复制','Copy')}</button>
   <label htmlFor={id}>{t('A2UI 消息','A2UI messages')} · JSON v0.9.1</label>
   <textarea id={id} className="code-editor" spellCheck={false} value={code} onChange={e=>{setCopy(false);setCode(e.target.value);}}/>
  </details>
  {error&&<p className="sandbox-validation" role="alert">{t('请修正描述：','Correct the description: ')}{error}</p>}
  <details className="inspector"><summary>{t('检查数据与事件','Inspect data and events')}</summary><h3>{t('数据','Data')}</h3><pre tabIndex={0}>{JSON.stringify(data,null,2)}</pre><h3>{t('事件','Events')}</h3><pre tabIndex={0}>{JSON.stringify(events,null,2)}</pre></details>
 </div>;
}
