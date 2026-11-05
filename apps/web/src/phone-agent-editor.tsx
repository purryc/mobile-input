import {useAttachmentSync} from './use-attachment-sync';
import {AgentEditReviews} from './agent-edit-review';
import {ApplicationActionChip} from './application-action-chip';
import {mapProjectedSelection,clampSelection} from '../../../packages/core/text-selection';
import {isAgentApp,agentCapabilities,agentDraftOwner} from '../../../packages/core/agent-controller';
import {adoptAgentMaterials} from './mac-attachment-adoption';
import {AgentInputScene} from './agent-input-scene';
import {uiText} from './i18n';
import {colorTitle,WidgetIcon} from './agent-widget-color';
import {SKETCH_WIDTH,SKETCH_HEIGHT} from '../../../packages/core/agent-sketch';
import {PhoneControllerFrame} from './phone-controller-frame';
import {preserveMacText} from './mac-text-recovery';
import {toast} from './runtime';
import {AgentParameterWidget} from './agent-input-view';
import {useEffect,useRef,useState} from 'react';
import {Send,X,Check,Undo2,Trash2} from 'lucide-react';
import {initialWbInput} from '../../../packages/core/workbuddy-input';
import {resolveLiveParameters,projectTargetInput,reconcileTargetInput,type LiveParameter,type LiveMaterial} from '../../../packages/core/live-workbuddy';
import {SentenceComposer} from './sentence-composer';
import type {TextInputHandle} from './text-input-handle';
import {usePhoneEditing} from './use-phone-editing';
import {InputDock} from './input-dock';
import {WorkBuddyColorPicker} from './workbuddy-color-picker';
import {macCommand,macSnapshot,useMacLink} from './mac-link';
import {pickMacMaterial,uploadMacMaterial,loadRealDraft,saveRealDraft} from './mac-materials';
import './phone-live-workbuddy.css';

type Material={removed?:boolean;adopted?:boolean;adoptionAttempted?:boolean;pending?:boolean;localId:string;file:File;kind:LiveMaterial['kind'];remote?:LiveMaterial;remoteSession?:string;remoteOwner?:string;preview?:string;scope?:string};
type Draft={submission?:{text:string;at:number};text:string;parameters:LiveParameter[];materials:Material[];strokes:number[][][];sketchConfirmed:boolean};
const blank=():Draft=>({text:'',parameters:[],materials:[],strokes:[],sketchConfirmed:false});
const emptyInput=initialWbInput();
/** One real target owns prose, parameter values, original material bytes and recovery. */
export function PhoneAgentEditor(){
 const link=useMacLink(),state=link.state!,area=useRef<TextInputHandle>(null),scope=agentDraftOwner(link.bridgeId||'',link.session,state),bindingKey=`${link.session}/${state.app}/${state.window}/${state.target}`,caps=agentCapabilities(state.app,state.capabilities);
 const [draft,setDraft]=useState<Draft>(()=>({...blank(),text:state.text})),[hydrated,setHydrated]=useState(false),[error,setError]=useState(''),[active,setActive]=useState<string|null>(null),[busy,setBusy]=useState(false),[awaiting,setAwaiting]=useState(false),[unknown,setUnknown]=useState(false),[hex,setHex]=useState(''),[duration,setDuration]=useState('');
 const mounted=useRef(true),current=useRef(draft),bound=useRef(state),base=useRef(state.text),dirty=useRef(false),revision=useRef(0),epoch=useRef(0),syncing=useRef(false),transaction=useRef(false),sending=useRef(false),actionPending=useRef(false),uncertainActions=useRef(new Set<string>()),picking=useRef(false),ready=useRef(false),gesture=useRef(false),latestScope=useRef(scope),waiting=useRef(false),materialLock=useRef(false);current.current=draft;bound.current=state;latestScope.current=scope;
 function projection(d:Draft,withMaterials=false){return projectTargetInput(d.text,bound.current.editorContext?.startsWith('review-document/')?[]:d.parameters,(withMaterials?d.materials.filter(m=>!m.pending&&!m.removed):[]).map(m=>({id:m.localId,name:m.file.name,kind:m.kind,scope:m.scope})),{text:bound.current.capabilities.includes('replace-text'),attachments:agentCapabilities(bound.current.app,bound.current.capabilities).includes('agent-attach')?['document','photo','sketch']:[]});}
 const directDocument=!!state.editorContext?.startsWith('review-document/');
 function resolveParameters(text:string,previous:LiveParameter[]=[]){return bound.current.editorContext?.startsWith('review-document/')?[]:resolveLiveParameters(text,previous);}
 const canEdit=hydrated&&state.editable&&!state.editReviews?.some(r=>r.blocksEditing)&&!state.selectionActions?.length&&state.capabilities.includes('replace-text'),connected=link.connected&&link.synced&&isAgentApp(state.app);
 const persist=(next:Draft,internal=false)=>{if(sending.current&&!internal)return;current.current=next;setDraft(next);if(ready.current)void saveRealDraft(scope,next).catch(()=>setError('手机存储不足，请保留当前输入并重试'));};
 function archiveSubmission(d:Draft,owner=scope){if(d.submission)void saveRealDraft(`${owner}/dispatched/${d.submission.at}`,d).catch(()=>setError('手机存储不足，请保留当前输入并重试'));}
 function nextInput(d:Draft,text:string):Draft{archiveSubmission(d);setUnknown(false);return {...blank(),text,parameters:resolveParameters(text,d.parameters)};}
 function change(text:string){if(transaction.current)return;revision.current++;dirty.current=true;const d=current.current;persist(d.submission&&text!==d.text?nextInput(d,text):{...d,text,parameters:resolveParameters(text,d.parameters)});}
 const editing=usePhoneEditing(draft.text,change,area,bindingKey,connected&&canEdit&&!busy,false,{target:{app:state.app,id:bindingKey,kind:'text'},stamp:()=>JSON.stringify([macSnapshot().session,macSnapshot().state?.target,macSnapshot().state?.text])});
 const adopt=(remote:typeof state)=>{if(remote.app!==bound.current.app||remote.target!==bound.current.target||remote.window!==bound.current.window||!remote.textKnown)return;
  const projected=projection(current.current).text;
  if(current.current.submission&&remote.text!==current.current.submission.text){const next=nextInput(current.current,remote.text);dirty.current=false;waiting.current=false;setAwaiting(false);base.current=remote.text;revision.current++;persist(next);setError('');return;}
  if(remote.text===base.current||remote.text===projected){base.current=remote.text;dirty.current=projected!==remote.text;waiting.current=false;setAwaiting(false);if(dirty.current)queueMicrotask(()=>void flushRef.current());return;}
  preserveMacText(scope,current.current.text,remote.text);if(dirty.current)toast('已同步 Mac 最新内容，手机输入已保留副本');dirty.current=false;waiting.current=false;setAwaiting(false);base.current=remote.text;revision.current++;persist({...current.current,...reconcileTargetInput(current.current.text,current.current.parameters,remote.text,projected)});setError('');};
 const flush=async():Promise<boolean>=>{if(!ready.current||syncing.current||transaction.current||materialLock.current||!dirty.current||!connected||!canEdit||awaiting)return !dirty.current;const target=bound.current,version=epoch.current,text=projection(current.current).text;syncing.current=true;
  const range=mapProjectedSelection(editing.selection.current,projection(current.current).spans);const r=await macCommand('replace-text',{text,base:base.current,selection:[range.start,range.end-range.start]},target);syncing.current=false;if(epoch.current!==version)return false;
  if(r.ok&&r.outcome==='verified'){base.current=text;dirty.current=projection(current.current).text!==text;if(dirty.current)queueMicrotask(()=>void flushRef.current());return true;}
  waiting.current=true;setAwaiting(true);if(r.state)adopt(r.state);else setError(r.error||'正在核对 Mac 内容');return false;};
 const flushRef=useRef(flush);flushRef.current=flush;
 const remoteCaret=useRef('');
 useEffect(()=>{
  const key=JSON.stringify([bindingKey,state.text,state.selection]);
  if(!hydrated||!connected||dirty.current||syncing.current||transaction.current||editing.speech!=='idle'||remoteCaret.current===key)return;
  const projected=projection(current.current);if(!state.textKnown||state.text!==projected.text)return;
  remoteCaret.current=key;const [start,length]=state.selection;
  editing.restoreSelection(clampSelection(mapProjectedSelection({start,end:start+length},projected.spans,true),current.current.text.length));
 },[hydrated,connected,bindingKey,state.text,state.selection[0],state.selection[1],editing.speech]);

 useEffect(()=>{let cancelled=false;++epoch.current;revision.current++;ready.current=false;setHydrated(false);setBusy(false);transaction.current=false;sending.current=false;picking.current=false;dirty.current=false;base.current=state.text;current.current={...blank(),text:state.text};setDraft(current.current);setActive(null);setAwaiting(false);setUnknown(false);setError('');
  void loadRealDraft<Draft>(scope).then(async saved=>saved||(state.app==='workbuddy'?await loadRealDraft<Draft>(`${state.window}/${state.target}`):undefined)).then(saved=>{if(cancelled)return;setUnknown(!!saved?.submission);if(saved){preserveMacText(scope,saved.text,state.text);current.current={...saved,text:dirty.current?current.current.text:bound.current.textKnown?(projection(saved).text===bound.current.text?saved.text:bound.current.text):saved.text,parameters:resolveParameters(dirty.current?current.current.text:bound.current.textKnown?(projection(saved).text===bound.current.text?saved.text:bound.current.text):saved.text,dirty.current?current.current.parameters:saved.parameters),materials:saved.materials.map(m=>({...m,preview:m.kind==='photo'?URL.createObjectURL(m.file):m.preview}))};if(saved.submission&&bound.current.textKnown&&bound.current.text!==saved.submission.text){current.current=nextInput(saved,bound.current.text);void saveRealDraft(scope,current.current);}setDraft(current.current);}else if(!dirty.current){current.current={...blank(),text:bound.current.text,parameters:resolveParameters(bound.current.text)};setDraft(current.current);}waiting.current=false;ready.current=true;setHydrated(true);if(dirty.current)queueMicrotask(()=>void flushRef.current());}).catch(()=>{if(!cancelled){ready.current=true;setHydrated(true);}});
  return()=>{cancelled=true;epoch.current++;};
 },[scope,bindingKey]);
 useEffect(()=>{if(!ready.current||syncing.current||transaction.current||materialLock.current||!connected||!state.textKnown)return;if(waiting.current||state.text!==base.current)adopt(state);},[state,scope,connected]);
 useEffect(()=>{if(!connected){epoch.current++;setActive(null);waiting.current=true;setAwaiting(true);}},[connected]);
 useEffect(()=>{const t=setTimeout(()=>void flushRef.current(),180);return()=>clearTimeout(t);},[draft.text,draft.parameters,draft.materials,connected,awaiting]);
 useEffect(()=>{if(editing.speech!=='idle'||gesture.current)return;
  persist({...current.current,parameters:resolveParameters(current.current.text,current.current.parameters)});
 },[draft.text,scope,editing.speech]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;for(const m of current.current.materials)if(m.preview?.startsWith('blob:'))URL.revokeObjectURL(m.preview);};},[]);
 const parameter=draft.parameters.find(p=>p.id===active);
 function updateParameter(value:string){if(busy||transaction.current||!parameter)return;if(parameter.kind==='duration')setDuration(value);revision.current++;dirty.current=true;persist({...current.current,parameters:current.current.parameters.map(p=>p.id===parameter.id?{...p,value,manual:true,label:p.kind==='duration'?value:p.kind==='color'?Object.entries({'#C92A2A':'红色','#356FE4':'蓝色','#182431':'黑色','#D9DEDF':'灰色'}).find(([c])=>c===value)?.[1]||'自选色':p.label}:p)});}
 async function choose(kind:'document'|'photo',materialScope='全文',capture=false){if(sending.current||picking.current||busy)return;const identity=scope,original=current.current,pickEpoch=epoch.current;picking.current=true;setBusy(true);try{const file=await pickMacMaterial(kind,false,!capture);if(!file)return;const material:Material={pending:kind==='photo',scope:materialScope,localId:crypto.randomUUID(),file,kind,preview:kind==='photo'?URL.createObjectURL(file):undefined};if(!mounted.current||latestScope.current!==identity){const saved=await loadRealDraft<Draft>(identity)||original;await saveRealDraft(identity,{...saved,materials:[...saved.materials,material]});return;}persist({...current.current,materials:[...current.current.materials,material]});if(kind!=='photo')setActive(null);}catch(e){if(mounted.current&&latestScope.current===identity)setError((e as Error).message);}finally{if(mounted.current&&latestScope.current===identity&&epoch.current===pickEpoch){picking.current=false;setBusy(false);}}}
 function open(id:string){if(busy||sending.current)return;const p=current.current.parameters.find(p=>p.id===id);if(!p)return;area.current?.blur();if(active===id){setActive(null);return;}if(p.kind==='document'){void choose(p.kind,p.scope);return;}setActive(id);setHex(p.value);setDuration(p.value);}
 async function adoptSketch(){const identity=scope;if(!draft.strokes.some(s=>s.length>1))return;const canvas=document.createElement('canvas');canvas.width=SKETCH_WIDTH*4;canvas.height=SKETCH_HEIGHT*4;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#146c64';ctx.lineWidth=6;ctx.lineCap='round';for(const stroke of draft.strokes){ctx.beginPath();stroke.forEach(([x,y],i)=>i?ctx.lineTo(x*canvas.width,y*canvas.height):ctx.moveTo(x*canvas.width,y*canvas.height));ctx.stroke();}const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob||latestScope.current!==identity)return;const file=new File([blob],'布局草图.png',{type:'image/png'});dirty.current=true;persist({...current.current,sketchConfirmed:true,materials:[...current.current.materials.map(m=>m.kind==='sketch'?{...m,removed:true}:m),{localId:crypto.randomUUID(),file,kind:'sketch',scope:parameter?.scope||'未指定',preview:canvas.toDataURL()}]});setActive(null);}
 function point(e:React.PointerEvent<SVGSVGElement>){const rect=e.currentTarget.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height))];}
 async function synchronizeMaterials(){
  if(materialLock.current)return;const target=bound.current,identity=scope,session=macSnapshot().session,requestEpoch=epoch.current;
  const remoteOwner=`${session}/${target.window}/${target.target}`;
  const valid=()=>mounted.current&&!document.hidden&&epoch.current===requestEpoch&&latestScope.current===identity&&macSnapshot().connected&&macSnapshot().synced&&macSnapshot().session===session&&macSnapshot().state?.app===target.app&&macSnapshot().state?.target===target.target&&macSnapshot().state?.window===target.window;
  if(!current.current.materials.length||current.current.submission)return;
  if(syncing.current)await new Promise<void>(resolve=>{const wait=()=>syncing.current&&valid()?setTimeout(wait,50):resolve();wait();});
  if(!valid())throw Error('连接或目标已变化，附件保留在原任务');
  if(dirty.current&&!await flushRef.current())throw Error('文字尚未同步，附件保留待重试');
  materialLock.current=true;
  try{
   for(const item of current.current.materials.filter(m=>m.removed)){
    if(!valid())throw Error('目标已变化，附件删除待同步');
    if(item.remote&&item.adoptionAttempted!==false){
     if(item.remoteOwner!==remoteOwner)throw Error('附件属于之前的连接，请在电脑核对后再删除');
     const reply=await macCommand('agent-detach',{files:[item.remote.id],base:base.current},target);
     if(!reply.ok||reply.outcome!=='verified')throw Error(reply.error||'附件删除未同步，请重试');
    }
    if(!valid())throw Error('目标已变化，删除结果待核对');
    persist({...current.current,materials:current.current.materials.filter(m=>m.localId!==item.localId)},true);
   }
   const desired=current.current.materials.filter(m=>!m.pending&&!m.removed),remoteFiles:LiveMaterial[]=[];
   for(const material of desired){
    if(!valid())throw Error('目标已变化，材料保留在原任务');
    if(material.remote&&material.remoteOwner!==remoteOwner)throw Error('附件归属需重新核对，已保留手机材料；不会重复上传');
    const remote=material.remote||await uploadMacMaterial(material.file,material.kind,target);
    if(!valid())throw Error('目标已变化，材料保留在原任务');
    persist({...current.current,materials:current.current.materials.map(m=>m.localId===material.localId?{...m,remote,remoteSession:session,remoteOwner,adoptionAttempted:m.adoptionAttempted??!!material.remote}:m)},true);
    if(current.current.materials.some(m=>m.localId===material.localId&&!m.removed))remoteFiles.push(remote);
   }
   if(remoteFiles.length){
    persist({...current.current,materials:current.current.materials.map(m=>remoteFiles.some(f=>f.id===m.remote?.id)?{...m,adoptionAttempted:true}:m)},true);
    const result=await adoptAgentMaterials(remoteFiles.map(m=>m.id),base.current,target);
    if(!result.ok||result.outcome!=='verified')throw Error(result.error||'附件采用未确认，请重试');
    if(!valid())throw Error('目标已变化，附件结果待核对');
    persist({...current.current,materials:current.current.materials.map(m=>remoteFiles.some(f=>f.id===m.remote?.id)?{...m,adopted:true}:m)},true);
   }
  }finally{materialLock.current=false;if(valid()&&dirty.current)queueMicrotask(()=>void flushRef.current());}
 }
 const materialSync=useAttachmentSync(bindingKey,JSON.stringify(draft.materials.map(m=>[m.localId,!!m.pending,!!m.removed])),hydrated&&connected&&!draft.submission&&editing.speech==='idle',synchronizeMaterials);
 async function send(){if(sending.current||picking.current||busy||awaiting||unknown||!connected||!caps.includes('agent-submit')||state.submitAction?.enabled===false||editing.speech!=='idle')return;sending.current=true;setBusy(true);setActive(null);setError('');const identity=scope,target=state,session=link.session,requestEpoch=epoch.current;const valid=()=>epoch.current===requestEpoch&&latestScope.current===identity&&macSnapshot().session===session&&macSnapshot().state?.app===target.app&&macSnapshot().state?.window===target.window&&macSnapshot().state?.target===target.target;
  try{if(!await materialSync.run())throw Error('附件尚未同步，请先重试');if(current.current.materials.some(m=>m.pending&&!m.removed))throw Error('请先确认或移除待选图片');if(projection(current.current,true).unavailable.length)throw Error(projection(current.current,true).unavailable.map(x=>x.reason).join('；'));if(current.current.strokes.length&&!current.current.sketchConfirmed)throw Error('请先采用或清空未完成的草图');if(syncing.current)throw Error('文字正在同步，请稍后发送');if(dirty.current&&!await flushRef.current())return;transaction.current=true;const frozen=structuredClone(current.current),materials:LiveMaterial[]=[];
   for(const material of frozen.materials.filter(m=>!m.removed&&!m.pending)){if(!valid())throw Error('目标已变化，输入已保留');const remote=material.remoteOwner===`${session}/${target.window}/${target.target}`&&material.remote?material.remote:await uploadMacMaterial(material.file,material.kind,target);if(!valid())throw Error('目标已变化，材料已保留');materials.push({...remote,scope:material.scope});persist({...current.current,materials:current.current.materials.map(m=>m.localId===material.localId?{...m,remote,remoteSession:session,remoteOwner:`${session}/${target.window}/${target.target}`}:m)},true);}
   if(!valid())throw Error('目标已变化，输入已保留');const text=projection(frozen,true).text;if(text!==base.current){const range=mapProjectedSelection(editing.selection.current,projection(current.current).spans);const r=await macCommand('replace-text',{text,base:base.current,selection:[range.start,range.end-range.start]},target);if(!r.ok||r.outcome!=='verified')throw Error(r.error||'文本核对失败');base.current=text;}
   if(!valid())throw Error('目标已变化，输入已保留');if(materials.length){const r=await adoptAgentMaterials(materials.map(m=>m.id),text,target);if(!r.ok||r.outcome!=='verified')throw Error(r.error||'附件核对失败');}
   if(!valid())throw Error('目标已变化，输入已保留');const pendingDraft={...current.current,submission:{text,at:Date.now()}};await saveRealDraft(identity,pendingDraft);if(!valid()){const stored=await loadRealDraft<Draft>(identity);if(stored?.submission?.at===pendingDraft.submission.at)await saveRealDraft(identity,{...stored,submission:undefined});throw Error('目标已变化，尚未发送，输入已保留');}persist(pendingDraft,true);const r=await macCommand('agent-submit',{base:text,files:materials.map(m=>m.id),...(target.submitAction?{actionId:target.submitAction.id}:{})},target);
   if(r.ok&&r.outcome==='verified'){await saveRealDraft(identity,blank());if(!valid()||!mounted.current)return;dirty.current=false;base.current=r.state?.text||'';persist({...blank(),text:base.current},true);setUnknown(false);setActive(null);}else{if(r.outcome==='rejected'){const retained={...pendingDraft,submission:undefined};await saveRealDraft(identity,retained);if(valid())persist(retained,true);}else {if(valid()){setUnknown(true);setError('');}return;}if(!valid()||!mounted.current)return;throw Error(r.error||'发送被拒绝，输入已保留');}
  }catch(e){if(valid()&&mounted.current)setError((e as Error).message);}finally{if(epoch.current===requestEpoch&&mounted.current){transaction.current=false;sending.current=false;setBusy(false);const remote=macSnapshot().state;if(current.current.submission&&remote)adopt(remote);}}}
 async function invokeComposerAction(actionId:string){
  if(actionPending.current||sending.current||busy||!connected||editing.speech!=='idle')return;
  const action=state.composerActions?.find(a=>a.id===actionId);if(!action?.enabled||uncertainActions.current.has(actionId))return;
  const requestEpoch=epoch.current;actionPending.current=true;setBusy(true);setError('');
  try{const r=await macCommand('agent-action',{actionId},state);if(!r.ok&&r.outcome!=='rejected')uncertainActions.current.add(actionId);if(epoch.current===requestEpoch&&!r.ok)setError(r.error||'操作未确认，请在电脑核对；不会重复执行');}
  finally{actionPending.current=false;if(mounted.current&&epoch.current===requestEpoch)setBusy(false);}
 }
 async function invokeSelectionAction(actionId:string){
  if(actionPending.current||busy||!connected||uncertainActions.current.has(actionId))return;
  editing.cancel();const target=state;actionPending.current=true;setBusy(true);
  try{const r=await macCommand('agent-selection',{actionId},target);if(!r.ok){if(r.outcome!=='rejected')uncertainActions.current.add(actionId);toast(r.error||'选区操作暂不可用');}}
  finally{actionPending.current=false;if(mounted.current)setBusy(false);}
 }
 async function invokeReviewAction(reviewId:string,actionId:string){
  if(actionPending.current||busy||!connected||uncertainActions.current.has(actionId))return;
  const review=state.editReviews?.find(r=>r.id===reviewId),action=review?.actions.find(a=>a.id===actionId);if(!action?.enabled)return;
  editing.cancel();const target=state,requestEpoch=epoch.current;actionPending.current=true;setBusy(true);
  try{const r=await macCommand('agent-review',{reviewId,actionId},target);if(!r.ok){if(r.outcome!=='rejected')uncertainActions.current.add(actionId);if(epoch.current===requestEpoch)toast(r.error||'修改操作暂不可用');}}
  finally{actionPending.current=false;if(mounted.current&&epoch.current===requestEpoch)setBusy(false);}
 }
 const visible=draft.parameters.filter(p=>draft.text.slice(p.start,p.end)===p.phrase).filter(p=>!(p.kind==='sketch'&&draft.sketchConfirmed)).map(p=>p.kind==='document'&&draft.materials.some(m=>m.kind==='document')?{...p,label:draft.materials.find(m=>m.kind==='document')!.file.name}:p);
 return <PhoneControllerFrame disabled={busy} beforeSwitch={editing.cancel} beforeChange={async()=>{editing.cancel();await flushRef.current();}} dock={<InputDock area={area} editing={editing} editable={canEdit&&!busy} voiceDisabled={!connected||!canEdit||busy} initialMode={null} remote={{pointerWindow:link.pointerWindow,relative:state.capabilities.includes('pointer-relative'),connected:connected&&state.capabilities.includes('pointer'),scope:`mac/${link.session}/${state.window}`,target:scope,position:state.pointer,sendPointer:v=>macCommand('pointer',v as Record<string,unknown>,state)}}/>}>
  <AgentInputScene context={<>{!!state.editReviews?.length&&<AgentEditReviews reviews={state.editReviews} busy={busy||!connected} unavailable={uncertainActions.current} onAction={(review,action)=>void invokeReviewAction(review,action)}/>}  {state.editorLabel&&<p className="mac-editor-context">{state.editorLabel}</p>}
  {!!state.selectionActions?.length&&<div className="mac-selection-actions" role="toolbar" aria-label="选区操作">{state.selectionActions.map(action=><ApplicationActionChip key={action.id} disabled={busy||!connected||!action.enabled||uncertainActions.current.has(action.id)} onPointerDown={e=>e.preventDefault()} onClick={()=>void invokeSelectionAction(action.id)}>{action.label}</ApplicationActionChip>)}</div>}</>} editing={editing} auxiliary={<>  <AgentParameterWidget parameter={parameter} active={active} busy={busy} onClose={()=>setActive(null)} onValue={updateParameter} onActive={v=>{gesture.current=v;}} strokes={draft.strokes} onStrokes={strokes=>persist({...current.current,strokes,sketchConfirmed:false})} onAdoptSketch={()=>void adoptSketch()} onChoosePhoto={()=>void choose('photo',parameter?.scope||'全文')} onCapture={()=>void choose('photo',parameter?.scope||'全文',true)} onConfirmPhotos={()=>{setError('');persist({...current.current,materials:current.current.materials.map(m=>m.kind==='photo'?{...m,pending:false}:m)});setActive(null);}} photos={draft.materials.filter(m=>m.kind==='photo'&&!m.removed).map(m=><div className="live-wb-material" key={m.localId}><button aria-label={uiText('图片')+' '+m.file.name}><img src={m.preview} alt={m.file.name}/></button><button aria-label={uiText('移除图片')+' '+m.file.name} onClick={()=>persist({...current.current,materials:current.current.materials.map(x=>x.localId===m.localId?{...x,removed:true}:x)})}><WidgetIcon name="close"/></button></div>)}/>
</>} feedback={<>

  {draft.materials.find(m=>m.localId===active)?.preview&&<section className="live-wb-preview"><button aria-label={uiText("关闭照片预览")} onClick={()=>setActive(null)}><X/></button><img src={draft.materials.find(m=>m.localId===active)!.preview} alt={uiText("所选照片")}/></section>}


  {state.composerActions?.map(action=><button key={action.id} disabled={busy||!connected||editing.speech!=='idle'||uncertainActions.current.has(action.id)||!action.enabled||!caps.includes('agent-action')} onClick={()=>void invokeComposerAction(action.id)}>{action.label}</button>)}
  {caps.includes('agent-stop')&&<button onClick={()=>void macCommand('agent-stop',{},state).then(r=>{if(!r.ok)setError(r.error||'停止未确认');})}>{uiText('停止生成')}</button>}

  {error&&<p role="status" className="mac-error">{error}</p>}
 {materialSync.error&&<p role="status" className="mac-error">{materialSync.error}<button onClick={()=>void materialSync.run()}>{uiText('重试')}</button>{draft.materials.some(m=>m.removed)&&<button onClick={()=>persist({...current.current,materials:current.current.materials.map(m=>({...m,removed:false}))})}>{uiText('撤销')}</button>}</p>}
 {materialSync.busy&&<p role="status">{uiText('正在同步附件')}</p>}
</>} busy={busy} footer={!directDocument&&!state.editReviews?.some(r=>r.blocksEditing)&&<button className="mac-submit-action" aria-label={state.submitAction?.label||(state.app==='workbuddy'?uiText('发送'):uiText('发送到')+' '+state.appName)} disabled={busy||unknown||awaiting||!connected||!canEdit||!caps.includes('agent-submit')||state.submitAction?.enabled===false||editing.speech!=='idle'||!draft.text.trim()} onClick={()=>void send()}><Send size={22}/>{busy?uiText('处理中'):state.submitAction?.label==='Submit edit instruction'?uiText('提交修改'):state.submitAction?.label||uiText('发送')}</button>}>
   {!!draft.materials.filter(m=>!m.pending&&!m.removed).length&&<div className="live-wb-materials">{draft.materials.filter(m=>!m.pending&&!m.removed).map(m=><div key={m.localId} className="live-wb-material"><button aria-label={'查看 '+m.file.name} onClick={()=>{if(m.kind==='sketch')setActive(draft.parameters.find(p=>p.kind==='sketch')?.id||'sketch');else if(m.kind==='photo')setActive('photos');else void choose('document');}}>{m.preview?<img src={m.preview} alt={m.file.name}/>:<span>{m.file.name}</span>}</button><button aria-label={'删除 '+m.file.name} onClick={()=>{dirty.current=true;persist({...current.current,materials:current.current.materials.map(x=>x.localId===m.localId?{...x,removed:true}:x),...(m.kind==='sketch'?{sketchConfirmed:false,strokes:[]}: {})});}}><X size={20}/></button></div>)}</div>}
   {canEdit||draft.text?<SentenceComposer ariaLabel={state.app==='workbuddy'?undefined:state.appName+' '+uiText('草稿')} ref={area} text={draft.text} files={[]} parameters={[]} input={emptyInput} active={null} disabled={!canEdit||busy} placeholder={uiText("输入你的任务要求")} onChange={editing.change} onSelect={editing.select} onFocus={()=>{}} onOpen={()=>{}} live={{parameters:visible,active,open}}/>:<p className="mac-empty">{uiText('请在电脑打开任务输入框')}</p>}
  </AgentInputScene>
 </PhoneControllerFrame>;
}
