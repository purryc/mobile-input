import {uiText} from './i18n';
import {promptArtifactContext} from '../../../packages/core/workbuddy-prompt';
import {TaskSelectionControls} from './phone-workbuddy-object';
import {colorTitle,WidgetIcon} from './agent-widget-color';
import {SKETCH_WIDTH,SKETCH_HEIGHT} from '../../../packages/core/agent-sketch';
import {AgentComposer,AgentAuxiliary,AgentColorInput,AgentDurationInput,AgentSketchInput,AgentPhotoInput} from './agent-input-view';
import {PhoneControllerFrame} from './phone-controller-frame';
import {PolishControls} from './ai-polish';
import {DeckImage} from './web-deck-image';
import {deckStageKey,useDeckStage,updateDeckStage,flushDeckStage,clearDeckStage,stagedAssets,validateStagedAssets,sendStagedAsset} from './web-deck-staging';
import {useEffect,useRef,useState} from 'react';
import {X,Check,Send,Undo2,Trash2,Plus,Mic,Folder,ShieldCheck,ChevronDown,ArrowUp,Paperclip} from 'lucide-react';
import {command,currentState,queryCommandReceipt,role,useRuntime} from './runtime';
import {useWorkBuddyInput} from './workbuddy-input';
import {usePhoneEditing} from './use-phone-editing';
import {InputDock} from './input-dock';
import {SentenceComposer} from './sentence-composer';
import {initialWbInput} from '../../../packages/core/workbuddy-input';
import {resolveLiveParameters,projectTargetInput,workBuddyInputCapabilities} from '../../../packages/core/live-workbuddy';
import {emptyDeckInput,type DeckAsset} from '../../../packages/core/web-deck';
import {WorkBuddyColorPicker} from './workbuddy-color-picker';
import {pickMacMaterial} from './mac-materials';
import {uploadDeckAsset} from './web-deck-api';
import {deckNative,type DeckNativeStatus} from './web-deck-native';
import {ConnectionButton} from './connection-access';
import {usePhoneInsets} from './phone-insets';
import type {TextInputHandle} from './text-input-handle';
import './phone-live-workbuddy.css';
import './web-deck.css';
const noInput=initialWbInput();
export function WebDeckComposer({taskId,phone=false,openMenu}:{taskId:string;phone?:boolean;openMenu?:(type:string)=>void}){
 const r=useRuntime(),task=r.state.workbuddy.tasks.find(t=>t.id===taskId),draft=r.state.workbuddy.drafts[taskId],input=draft.deckInput||emptyDeckInput();const editor=useWorkBuddyInput('wb:draft:'+taskId,'产品介绍需求','',phone),area=useRef<TextInputHandle>(null),mounted=useRef(true),queue=useRef(Promise.resolve(true));
 const [active,setActive]=useState<string|null>(null),[busy,setBusy]=useState(false),[sending,setSending]=useState(false),[error,setError]=useState(''),[strokes,setStrokes]=useState<number[][][]>([]),[strokeScope,setStrokeScope]=useState(''),[replace,setReplace]=useState(''),[drawing,setDrawing]=useState(false),[number,setNumber]=useState(''),[tabletPendingPhotos,setTabletPendingPhotos]=useState<DeckAsset[]>([]);
 const owner=draft.owner||'',stageKey=deckStageKey(taskId,owner),stage=useDeckStage(stageKey,taskId,owner,phone),assets=phone?stagedAssets(input.assets,stage):input.assets,sketchDrafts=phone?(stage?.sketches||[]):input.sketchDrafts;const pendingPhotos=phone?(stage?.pendingPhotos||[]):tabletPendingPhotos;const sendLock=useRef(false),submittedEpoch=useRef('');
 useEffect(()=>{if(submittedEpoch.current&&task&&task.epoch!==submittedEpoch.current&&['running','complete','paused'].includes(task.status)){setError('');submittedEpoch.current='';}},[task?.epoch,task?.status]);
 const [model,setModel]=useState('Gemini'),[addMenu,setAddMenu]=useState(false);
 useEffect(()=>{let live=true;const listener=(e:Event)=>{const value=(e as CustomEvent<DeckNativeStatus>).detail;if(live&&value.model)setModel(value.model);};window.addEventListener('native-deck-status',listener);if(window.MobileNative)deckNative()?.deckControl?.('status');else void fetch('/api/decks/status').then(r=>r.ok?r.json():null).then(s=>{if(live&&s?.model)setModel(s.model);}).catch(()=>{});return()=>{live=false;window.removeEventListener('native-deck-status',listener);};},[]);
 const editable=(role==='tablet'||r.connected)&&task?.status!=='running'&&!busy&&!sending&&!editor.blocked&&(!phone||!!stage&&!stage.submission);const editing=usePhoneEditing(editor.text,editor.update,area,taskId+':'+owner,editable,false,{target:{app:'workbuddy',kind:'text',id:'wb:draft:'+taskId},stamp:()=>{const s=currentState(),d=s.workbuddy.drafts[taskId];return JSON.stringify([s.demoGeneration,s.app,s.workbuddy.task,d?.owner,d?.revision,s.inputSession?.id]);}});const parameters=resolveLiveParameters(editor.text,input.parameters),parameter=parameters.find(p=>p.id===active);
 const projected=projectTargetInput(editor.text,parameters,phone?[]:input.assets,workBuddyInputCapabilities);
 const visible=parameters.filter(p=>!(p.kind==='sketch'&&assets.some(a=>a.kind==='sketch'&&a.scope===p.scope))).map(p=>p.kind==='document'&&assets.some(a=>a.kind==='document')?{...p,label:assets.find(a=>a.kind==='document')!.name}:p);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 function action(value:Record<string,unknown>){const owner=draft.owner||'';const pending=queue.current.catch(()=>false).then(async()=>{const s=currentState(),d=s.workbuddy.drafts[taskId];if(!d)return false;const ack=await command('wb-deck-input',{task:taskId,owner,revision:d.deckInput?.revision||0,...value});if(mounted.current&&!ack.ok)setError(ack.error||'修改未完成');return ack.ok;});queue.current=pending;return pending;}
 function saveSketch(lines=strokes){if(phone)return updateDeckStage(stageKey,v=>({...v,sketches:[...v.sketches.filter(s=>s.scope!==(strokeScope||'未指定')),...(lines.length?[{scope:strokeScope||'未指定',replace,strokes:lines}]:[])]}));return action({action:'sketch-draft',scope:strokeScope||'未指定',replace,strokes:lines});}
 async function adoptAsset(asset:DeckAsset,replaceId=''){
  if(phone){await updateDeckStage(stageKey,v=>{const next={...v,assets:[...v.assets.filter(a=>a.id!==asset.id&&a.id!==replaceId),asset],removed:replaceId?[...new Set([...v.removed,replaceId])]:v.removed,sketches:asset.kind==='sketch'?v.sketches.filter(s=>s.scope!==asset.scope):v.sketches};validateStagedAssets(stagedAssets(input.assets,next));return next;});}
  else if(!await action({action:'asset',asset,replace:replaceId,owner}))throw Error('材料采用未确认');
 }
 async function removeAsset(asset:DeckAsset){if(phone)await updateDeckStage(stageKey,v=>({...v,assets:v.assets.filter(a=>a.id!==asset.id),removed:[...new Set([...v.removed,asset.id])],sketches:asset.kind==='sketch'?v.sketches.filter(s=>s.scope!==asset.scope):v.sketches}));else await action({action:'remove',assetId:asset.id});}
 async function pick(kind:'document'|'photo',scope='全文',capture=false){
  setBusy(true);setError('');try{const file=await pickMacMaterial(kind,true,!capture);if(file){if(stageKey!==deckStageKey(taskId,owner))throw Error('演示已重置，请重新选择材料');const asset=await uploadDeckAsset(file,kind,scope,phone);if(kind==='photo'){if(phone)await updateDeckStage(stageKey,v=>{const next={...v,pendingPhotos:[...(v.pendingPhotos||[]),asset]};validateStagedAssets([...stagedAssets(input.assets,next),...next.pendingPhotos]);return next;});else setTabletPendingPhotos(v=>[...v,asset]);}else await adoptAsset(asset);}}
  catch(e){if(mounted.current)setError((e as Error).message);}finally{if(mounted.current)setBusy(false);}
 }
 async function confirmPhotos(){setBusy(true);setError('');try{if(phone)await updateDeckStage(stageKey,v=>{const next={...v,assets:[...v.assets,...(v.pendingPhotos||[])],pendingPhotos:[]};validateStagedAssets(stagedAssets(input.assets,next));return next;});else{for(const a of tabletPendingPhotos)await adoptAsset(a);setTabletPendingPhotos([]);}setActive(null);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function removePhoto(asset:DeckAsset){if(pendingPhotos.some(a=>a.id===asset.id)){if(phone)await updateDeckStage(stageKey,v=>({...v,pendingPhotos:(v.pendingPhotos||[]).filter(a=>a.id!==asset.id)}));else setTabletPendingPhotos(v=>v.filter(a=>a.id!==asset.id));}else await removeAsset(asset);setError('');}
 function open(id:string){if(busy||sending)return;if(parameter?.kind==='sketch'||active==='sketch')void saveSketch();const p=parameters.find(p=>p.id===id);if(!p)return;if(p.kind==='document'&&!assets.some(a=>a.kind==='document')){void pick('document',p.scope);return;}setActive(active===id?null:id);setNumber(p.value);if(p.kind==='sketch'){setStrokeScope(p.scope);setReplace('');const pending=sketchDrafts?.find(a=>a.scope===p.scope),saved=assets.find(a=>a.kind==='sketch'&&a.scope===p.scope);setStrokes(pending?.strokes||saved?.strokes||[]);if(pending)setReplace(pending.replace);else if(saved)setReplace(saved.id);}}
 async function adopt(){if(!strokes.some(s=>s.length>1))return;setBusy(true);try{const canvas=document.createElement('canvas');canvas.width=SKETCH_WIDTH*2;canvas.height=SKETCH_HEIGHT*2;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#146c64';ctx.lineWidth=3;ctx.lineCap='round';for(const stroke of strokes){ctx.beginPath();stroke.forEach(([x,y],i)=>i?ctx.lineTo(x*canvas.width,y*canvas.height):ctx.moveTo(x*canvas.width,y*canvas.height));ctx.stroke();}const blob=await new Promise<Blob>(resolve=>canvas.toBlob(b=>resolve(b!),'image/png'));const asset=await uploadDeckAsset(new File([blob],'布局草图.png',{type:'image/png'}),'sketch',strokeScope||'未指定',phone);asset.strokes=strokes;await adoptAsset(asset,replace);setActive(null);setStrokes([]);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 useEffect(()=>{if(!phone||!stage?.submission)return;const accepted=r.state.workbuddy.tasks.some(t=>t.messages.some(m=>m.id===stage.submission));if(accepted)void clearDeckStage(stageKey);},[stage?.submission,r.state.revision,stageKey]);
 // Reconcile persisted unknown sends against the tablet's execution receipt;
 // adoption/reconnection only queries status and never replays the submission.
 useEffect(()=>{
  const id=stage?.submission;if(!phone||!id||id==='storage-error'||sending||!r.connected)return;
  let alive=true,timer:ReturnType<typeof setTimeout>;
  const check=async()=>{const result=await queryCommandReceipt(id);if(!alive)return;
   const accepted=currentState().workbuddy.tasks.some(t=>t.messages.some(m=>m.id===id));
   if(accepted||result.status==='done'&&result.ack?.ok){setError('');await clearDeckStage(stageKey);}
   else if(result.status==='missing'||result.status==='done'&&!result.ack?.ok){setError(result.ack?.error||'平板未接收这次发送，输入已保留，请重新发送');await updateDeckStage(stageKey,v=>v.submission===id?{...v,submission:undefined}:v);}
   else timer=setTimeout(()=>void check(),3000);
  };void check();return()=>{alive=false;clearTimeout(timer);};
 },[phone,stage?.submission,stageKey,sending,r.connected]);
 async function send(){
  if(sendLock.current||!editable||editing.speech!=='idle')return;sendLock.current=true;setSending(true);setError('');
  try{
   await queue.current;await editor.flush();if(!await editor.focus())throw Error('输入目标未确认，请在平板重新点击输入框');
   const s=currentState(),d=s.workbuddy.drafts[taskId],t=s.target,context=promptArtifactContext(s);if(editor.blocked||!d||(!phone&&!t))throw Error('输入目标尚未同步');
   const local=phone?await flushDeckStage(stageKey):undefined;if(local?.submission)throw Error('正在核对上次发送结果，请勿重复发送');
   if((phone?local?.sketches:d.deckInput?.sketchDrafts)?.some(a=>a.strokes.length))throw Error('请先采用或清空未完成的草图');
   if((phone?local?.pendingPhotos:tabletPendingPhotos)?.length)throw Error('请先确认或移除待选图片');
   const frozenAssets=stagedAssets(d.deckInput?.assets||[],local);validateStagedAssets(frozenAssets);
   const text=d.text,revision=d.revision,inputRevision=d.deckInput?.revision||0,session=s.startedAt,client=s.inputSession?.id;
   const valid=()=>{const n=currentState(),x=n.workbuddy.drafts[taskId];return !document.hidden&&n.app==='workbuddy'&&n.startedAt===session&&n.inputSession?.id===client&&(phone?n.workbuddy.task===taskId&&JSON.stringify(promptArtifactContext(n))===JSON.stringify(context):n.target?.id===t!.id&&n.target?.revision===t!.revision)&&x?.text===text&&x.revision===revision&&(x.owner||'')===owner&&(x.deckInput?.revision||0)===inputRevision;};
   const manifest:DeckAsset[]=[];
   for(const a of frozenAssets){if(!valid())throw Error('目标或文字已变化，材料保留在手机');manifest.push(phone&&local?.assets.some(x=>x.id===a.id)?await sendStagedAsset(a,taskId,valid):a);}
   if(!valid())throw Error('目标或文字已变化，材料保留在手机');
   const id=crypto.randomUUID();if(phone)await updateDeckStage(stageKey,v=>({...v,submission:id}));
   submittedEpoch.current=task?.epoch||'';
   const ack=await command('wb-deck-start',{task:taskId,revision,inputRevision,owner,assets:manifest,...(phone?{prompt:true,context}: {})},{id,...(!phone?{targetId:t!.id,targetRevision:t!.revision}:{})});
   const accepted=currentState().workbuddy.tasks.some(t=>t.messages.some(m=>m.id===id));
   if(ack.ok||accepted){if(phone)await clearDeckStage(stageKey);if(mounted.current){setStrokes([]);setActive(null);}}
   else{if(phone&&!/回执|核对平板/.test(ack.error||''))await updateDeckStage(stageKey,v=>({...v,submission:undefined}));throw Error(ack.error||'发送尚未确认，请核对平板');}
  }catch(e){if(mounted.current)setError((e as Error).message);}finally{sendLock.current=false;if(mounted.current)setSending(false);}
 }

 async function setParameter(value:string){if(!parameter)return;const sourceText=editor.text;await editor.flush();await action({action:'parameter',id:parameter.id,value,sourceText});}

 const context=promptArtifactContext(r.state);
 const [pressed,setPressed]=useState(false);const seenSubmission=useRef('');
 useEffect(()=>{const event=r.state.workbuddy.lastSubmission;if(phone||!event||event.task!==taskId||seenSubmission.current===event.id)return;seenSubmission.current=event.id;const age=Date.now()-event.at;if(age<0||age>600)return;const key='input-agent:send-feedback:'+event.id;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');setPressed(true);const timer=setTimeout(()=>setPressed(false),180);return()=>clearTimeout(timer);},[taskId,r.state.workbuddy.lastSubmission?.id]);
 const content=<>
 {phone&&context&&<section className="task-artifact-context"><b>{context.name}</b>{context.path&&<small>{context.path}</small>}{context.selection&&<p>{context.selection}</p>}</section>}
 {phone&&<TaskSelectionControls/>}
 {(parameter?.kind==='photo'||active==='photos')&&<AgentAuxiliary title={uiText("图片选择")} busy={busy} onClose={()=>setActive(null)}><AgentPhotoInput busy={busy} onChoose={()=>void pick('photo',parameter?.scope||'全文')} onCapture={()=>void pick('photo',parameter?.scope||'全文',true)} onDone={()=>void confirmPhotos()}>{[...assets.filter(a=>a.kind==='photo'),...pendingPhotos].map(a=><div className="live-wb-material" key={a.id}><button aria-label={uiText('图片')+' '+a.name}><DeckImage id={a.id} alt={a.name}/></button><button aria-label={uiText('移除图片')+' '+a.name} onClick={()=>void removePhoto(a)}><WidgetIcon name="close"/></button></div>)}</AgentPhotoInput></AgentAuxiliary>}

 {(parameter?.kind==='color'||parameter?.kind==='duration'||parameter?.kind==='sketch'||active==='sketch')&&<AgentAuxiliary title={parameter?.kind==='color'?colorTitle(parameter.role):parameter?.kind==='sketch'?(parameter.scope==='全文'?'布局草图':parameter.scope):parameter?.role||'布局草图'} busy={busy} onClose={()=>{if(parameter?.kind==='sketch'||active==='sketch')saveSketch();setActive(null);}}>{parameter?.kind==='color'?<AgentColorInput key={parameter.id} value={parameter.value} label={parameter.role} onChange={v=>void setParameter(v)} onActive={setDrawing} onDone={()=>setActive(null)}/>:parameter?.kind==='duration'?<AgentDurationInput value={parameter.value} onChange={v=>void setParameter(v)}/>:<AgentSketchInput strokes={strokes} onChange={setStrokes} onEnd={saveSketch} onActive={setDrawing} onAdopt={()=>void adopt()} busy={busy}/>}</AgentAuxiliary>}
<AgentComposer className="deck-composer" label="WorkBuddy 任务输入区" footer={<> {!phone&&<><button aria-label={uiText("添加内容")} disabled={!editable} onClick={()=>setAddMenu(!addMenu)}><Plus size={20}/></button>{addMenu&&<div className="deck-add-menu"><button onClick={()=>{setAddMenu(false);void pick('document');}}>{uiText("添加文件")}</button><button onClick={()=>{setAddMenu(false);setActive('photos');void pick('photo');}}>{uiText("添加图片")}</button></div>}</>}<span>{busy?'正在采用材料':''}</span>{!phone&&<><span className="deck-model" aria-label={uiText("生成模型")}>{model}</span><button aria-label={uiText("手机语音输入")} onClick={()=>void editor.activate()}><Mic size={20}/></button></>}<button data-accepted={pressed} aria-label={task?.status==='running'&&!phone?uiText("停止生成"):uiText("发送生成网页演示")} disabled={!(task?.status==='running'&&!phone)&&(sending||!editable||!editor.text.trim()||editing.speech!=='idle'||drawing||!!sketchDrafts?.some(a=>a.strokes.length))} onClick={()=>task?.status==='running'&&!phone?void command('wb-deck-stop',{task:taskId}):void send()}>{phone?<><Send size={20}/>{uiText("发送")}</>:task?.status==='running'?<span aria-hidden>■</span>:<ArrowUp size={20}/>}</button> </>}>
 {phone&&assets.length>0&&<div className="live-wb-materials">{assets.map(a=><div className="live-wb-material" key={a.id}><button aria-label={'编辑 '+a.name} onClick={()=>{if(a.kind==='sketch'){setStrokes(sketchDrafts?.find(x=>x.scope===a.scope)?.strokes||a.strokes||[]);setStrokeScope(a.scope);setReplace(a.id);setActive('sketch');}else setActive(a.kind==='photo'?'photos':parameters.find(p=>p.kind==='document')?.id||null);}}>{a.kind==='document'?<span>{a.name}</span>:<DeckImage id={a.id} alt={a.name}/>}</button><button aria-label={'删除 '+a.name} disabled={!editable} onClick={()=>void removeAsset(a)}><WidgetIcon name="close"/></button></div>)}</div>}

 {phone?<SentenceComposer ref={area} text={editor.text} parameters={[]} files={[]} input={noInput} active={null} disabled={!editable} placeholder={uiText("描述你要完成的任务…")} onChange={editing.change} onSelect={editing.select} onFocus={()=>void editor.activate()} onOpen={()=>{}} live={{parameters:visible,active,open}}/>:<><div className="deck-target-materials">{input.assets.map(a=><div className="deck-target-material" key={a.id}>{a.kind==='document'?<Paperclip size={18}/>:<DeckImage id={a.id} alt={a.name}/>}<span>{a.name}</span><button aria-label={'删除 '+a.name} disabled={!editable} onClick={()=>void removeAsset(a)}><X size={16}/></button></div>)}</div><textarea ref={area as React.RefObject<HTMLTextAreaElement>} aria-label={uiText("WorkBuddy 任务输入")} value={projected.text} disabled={!editable} placeholder={uiText("今天帮你做些什么？@ 添加上下文，/调用技能与指令")} onFocus={()=>void editor.activate()} onChange={e=>editor.update(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();void send();}}}/></>}
</AgentComposer>{!phone&&<div className="wb-composer-options"><button onClick={()=>openMenu?.('workspace')}><Folder size={16}/>{r.state.workbuddy.settings.workspace||'选择工作空间'}<ChevronDown size={12}/></button><button onClick={()=>openMenu?.('permission')}><ShieldCheck size={16}/>{r.state.workbuddy.settings.permission}<ChevronDown size={12}/></button></div>}{phone&&editing.polish&&<PolishControls editing={editing}/>}
 {parameter?.kind==='document'&&<section className="live-wb-aux"><header><b>{uiText("参考资料")}</b><button aria-label={uiText("关闭辅助输入")} onClick={()=>setActive(null)}><X/></button></header>{assets.filter(a=>a.kind==='document').map(a=><div className="deck-file" key={a.id}><span>{a.name}</span><button aria-label={'删除 '+a.name} onClick={()=>void removeAsset(a)}><X size={16}/></button></div>)}<button onClick={()=>void pick('document',parameter.scope)}>{uiText("添加参考资料")}</button></section>}

 {phone&&stage?.submission&&<p role="status">{stage.submission==='storage-error'?'手机材料存储不可用，请重新打开应用':'正在核对发送结果，输入已保留，请核对平板任务'}</p>}
 {error&&<p role="alert">{error}</p>}{editor.blocked&&<button onClick={()=>void editor.recover()}>{editor.blockReason} {uiText("· 恢复输入")}</button>}</>;
 return phone?<PhoneControllerFrame className="deck-phone" disabled={busy||sending} beforeSwitch={editing.cancel} beforeChange={async()=>{editing.cancel();if(parameter?.kind==='sketch'||active==='sketch')saveSketch();await queue.current;await editor.flush();}} dock={<InputDock area={area} editing={editing} editable={editable} voiceDisabled={!editable} initialMode={null}/>}>{task?.status!=='complete'&&task?.status!=='draft'&&<DeckTaskStatus taskId={taskId} results={false}/>}{content}</PhoneControllerFrame>:<div className="deck-compose-desktop">{content}</div>;
}
export function DeckTaskStatus({taskId,results=true}:{taskId:string;results?:boolean}){const {state}=useRuntime(),t=state.workbuddy.tasks.find(t=>t.id===taskId);if(!t?.deckJob)return null;return <section className="deck-job"><span role="status">{uiText(t.deckJob.stage)}</span>{t.deckJob.error&&<p role="alert">{uiText(t.deckJob.error)}</p>}{t.status==='running'?<button onClick={()=>void command('wb-deck-stop',{task:taskId})}>{uiText("停止生成")}</button>:t.status==='paused'&&<button onClick={()=>void command('wb-deck-retry',{task:taskId})}>{uiText("重新生成")}</button>}{results&&t.files.map(id=><button key={id} onClick={()=>void command('wb-preview',{id})}>{uiText("打开网页演示")}</button>)}</section>;}
