import {useRef,useState,type ComponentProps} from 'react';
import {InputDockView,MediaControls,MediaActions,PaintColor,BrushConsole,TaskNavigation,SelectionFormat,ColorPicker,PaintColorPicker,RichObjectText,ConnectionError,EditReviews,ReplyOptions,CaptureChoices,AttachmentList,PresentationTools,ReceiptTools,SpeakerNotes,HoldToDraw,GameControls,type SelectionStyle} from './components';
import {t} from './i18n';
import {demoReceiptPack} from '../../../packages/core/workbuddy-materials';

export const controlNames=['InputDockView','MediaControls','PaintColor','BrushConsole','TaskNavigation','SelectionFormat','ColorPicker','PaintColorPicker','RichObjectText','ConnectionError','EditReviews','ReplyOptions','CaptureChoices','AttachmentList','PresentationTools','ReceiptTools','SpeakerNotes','HoldToDraw','GameControls'];
export function ControlSpecimen({name}:{name:string}){
 const [color,setColor]=useState(name==='PresentationTools'?'#c45337':'#A75D46'),[message,setMessage]=useState(''),[size,setSize]=useState(name==='PresentationTools'?3:12),[tool,setTool]=useState<ComponentProps<typeof BrushConsole>['tool']>('pencil');
 const [playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[muted,setMuted]=useState(false),[volume,setVolume]=useState(.6),[mediaIndex,setMediaIndex]=useState(0),[fullscreen,setFullscreen]=useState(false),[open,setOpen]=useState(false),[file,setFile]=useState(true);
 const [selection,setSelection]=useState<SelectionStyle>({color:'#122D39',size:24}),[panel,setPanel]=useState<'color'|'link'|null>(null),[hex,setHex]=useState('#122D39'),[link,setLink]=useState('');
 const [ink,setInk]=useState(true),[captions,setCaptions]=useState(false),[presenting,setPresenting]=useState(true),[task,setTask]=useState('a');
 const emit=(value:string)=>setMessage(value);
 let view;
 switch(name){
 case 'SpeakerNotes':view=<div className="notes-specimen presentation-glass"><SpeakerNotes status={t('本地备注','Local notes')} text={t('开场先介绍目标，然后展示示例。','Introduce the goal, then show an example.')} failed={false}/></div>;break;
 case 'HoldToDraw':view=<div className="hold-specimen presentation-glass"><HoldToDraw holding={playing} disabled={false} onHold={setPlaying}/></div>;break;
 case 'GameControls':view=<div className="game-specimen fc-stage"><div className="fc-glass"/>{(['direction','actions'] as const).map(part=><GameControls key={part} part={part} pressed={playing?[message]:[]} keyProps={key=>({onPointerDown:e=>{e.currentTarget.setPointerCapture(e.pointerId);setMessage(key);setPlaying(true);},onPointerUp:()=>setPlaying(false),onPointerCancel:()=>setPlaying(false),onLostPointerCapture:()=>setPlaying(false)})}/>)}</div>;break;
 case 'InputDockView':return <DockSpecimen/>;
 case 'MediaControls':view=<div className="bili-actions"><MediaControls playing={playing} speed={speed} muted={muted} volume={volume} onPlaying={setPlaying} onSpeed={setSpeed} onMuted={setMuted} onVolume={setVolume}/><MediaActions index={mediaIndex} lastIndex={2} fullscreen={fullscreen} onAction={(type,value)=>{if(type==='bili-next')setMediaIndex(i=>Math.max(0,Math.min(2,i+Number(value?.delta))));if(type==='bili-view')setFullscreen(!!value?.fullscreen);emit(type+' · '+t('本地样例','local fixture'));}}/></div>;break;
 case 'PaintColor':view=<PaintColor value={color} disabled={false} onChange={setColor}/>;break;
 case 'BrushConsole':view=<BrushConsole tool={tool} size={size} color={color} disabled={false} onChange={v=>{if(v.tool)setTool(v.tool);if(v.size)setSize(v.size);if(v.color)setColor(v.color);}}/>;break;
 case 'ColorPicker':view=<section className="wb-selection-format"><ColorPicker value={color} onChange={setColor} onActive={()=>{}}/></section>;break;
 case 'PaintColorPicker':view=<div className="gp-popover gp-color-panel"><PaintColorPicker value={color} onChange={setColor}/></div>;break;
 case 'RichObjectText':view=<><RichObjectText text="Mobile Input\nEditable context" runs={[{start:0,end:6,style:{bold:true,color}}]}/><input aria-label={t('文字颜色','Text color')} type="color" value={color} onChange={e=>setColor(e.target.value)}/></>;break;
 case 'SelectionFormat':view=<SelectionFormat style={selection} tool={panel} setTool={setPanel} hex={hex} setHex={setHex} link={link} setLink={setLink} format={v=>setSelection(s=>({...s,...v}))} setError={emit} markdown={false} pt={Math.round((selection.size||24)*.75)} toggleStyle={key=>setSelection(s=>({...s,[key]:!s[key]}))}/>;break;
 case 'TaskNavigation':{
 const snapshot={app:'workbuddy',appName:'WorkBuddy',connected:true,synced:true,currentTask:task,destination:'demo',tasks:[{id:'a',title:t('产品介绍','Product overview'),status:'running'},{id:'b',title:t('发布笔记','Release notes'),status:'unknown'}],capabilities:['switch-task','new-task']} as ComponentProps<typeof TaskNavigation>['snapshot'];
 view=<TaskNavigation snapshot={snapshot} onError={emit} actions={{switchTask:async id=>{setTask(id);return {ok:true};},newTask:async()=>{emit(t('模拟新任务请求','Simulated new-task request'));return {ok:true};}} as ComponentProps<typeof TaskNavigation>['actions']}/>;break;}
 case 'ConnectionError':view=<><button onClick={()=>setOpen(true)}>{t('演示断连提示','Show connection feedback')}</button>{open&&<ConnectionError device="Demo display" onDismiss={()=>setOpen(false)} onReconnect={()=>{setOpen(false);emit(t('模拟重连请求','Simulated reconnect request'));}}/>}</>;break;
 case 'EditReviews':view=<EditReviews busy={false} unavailable={new Set()} reviews={[{id:'fixture-review',document:'Demo',before:'A long introduction.',after:'A brief introduction.',actions:[{id:'edit',kind:'edit',enabled:true},{id:'reject',kind:'reject',enabled:true},{id:'accept',kind:'accept',enabled:true}]}]} onAction={(_,action)=>emit(action+' · '+t('模拟结果','simulated result'))}/>;break;
 case 'ReplyOptions':view=<div className="glass-context"><ReplyOptions replies={[t('收到，我会核对后回复。','Received. I will check and reply.'),t('明天上午可以。','Tomorrow morning works.')]} onReply={emit}/></div>;break;
 case 'CaptureChoices':view=<CaptureChoices busy={false} onScreenshot={()=>emit(t('模拟截图选择','Simulated screenshot choice'))} onRecording={()=>emit(t('模拟录屏选择','Simulated recording choice'))} onCamera={()=>emit(t('模拟相机选择','Simulated camera choice'))}/>;break;
 case 'AttachmentList':view=<>{file?<AttachmentList files={[{id:'fixture',name:'Example.svg',kind:'image',asset:import.meta.env.BASE_URL+'reference-assets/workbuddy-widgets/pen.svg',content:t('虚构示例附件','Fictional fixture attachment')}]} onRemove={()=>setFile(false)}/>:<button onClick={()=>setFile(true)}>{t('恢复示例附件','Restore fixture')}</button>}</>;break;
 case 'PresentationTools':view=<div className="presentation-specimen presentation-glass"><PresentationTools tracking={false} ink={ink} disabled={false} presenting={presenting} captionsEnabled={captions} onCaptions={()=>setCaptions(v=>!v)} onMode={v=>setInk(v==='ink')} onFullscreen={()=>setPresenting(v=>!v)} selectedColor={color} size={size} canUndo={true} onUndo={()=>emit('undo · local')} onClear={()=>emit('clear · local')} onStyle={(c,s)=>{if(c)setColor(c);if(s)setSize(s);}}/></div>;break;
 case 'ReceiptTools':return <ReceiptSpecimen/>;
 }
 return <>{view}<p className="fixture-status" role="status">{message||(['ColorPicker','PaintColor','PaintColorPicker','BrushConsole'].includes(name)?color:'')}</p></>;
}
function DockSpecimen(){
 const [mode,setMode]=useState<'keyboard'|'trackpad'|null>(null),[keys,setKeys]=useState<ComponentProps<typeof InputDockView>['keys']>('abc'),[shift,setShift]=useState(false),[language,setLanguage]=useState(false),[text,setText]=useState('Demo'),[message,setMessage]=useState(''),[speech,setSpeech]=useState('idle');
 const position=useRef({x:0,y:0});
 return <><textarea className="fixture-draft" aria-label={t('本地草稿','Local draft')} value={text} onChange={e=>setText(e.target.value)}/><p role="status">{message}</p><InputDockView mode={mode} system={false} keys={keys} shift={shift} language={language} setKeys={setKeys} setShift={setShift} setLanguage={setLanguage} toggle={next=>setMode(v=>v===next?null:next)} disabled={false} voiceDisabled={false} speech={speech} voiceProps={{onClick:()=>{setSpeech(v=>v==='idle'?'recording':'idle');setMessage(t('模拟语音状态 · 不采集声音','Simulated voice state · no recording'));}}} editable={true} selectionEditable={false} canUndo={false} canRedo={false} captureDisabled={false} onEdit={action=>setMessage(action+' · '+t('本地事件','local event'))} onCapture={()=>setMessage(t('模拟采集入口','Simulated capture entry'))} onSystemKeyboard={()=>setMessage(t('系统键盘由宿主打开','Host opens the system keyboard'))} insert={value=>setText(v=>v+value)} erase={()=>setText(v=>v.slice(0,-1))} remoteDisabled={false} trackpadProps={{onPointerDown:e=>{e.currentTarget.setPointerCapture(e.pointerId);position.current={x:e.clientX,y:e.clientY};},onPointerMove:e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;setMessage(`Δ ${Math.round(e.clientX-position.current.x)}, ${Math.round(e.clientY-position.current.y)} · local`);position.current={x:e.clientX,y:e.clientY};}}} leftButtonProps={{onClick:()=>setMessage('left · local')}} onRight={()=>setMessage('right · local')} error="" errorToast={null} capturePanel={null}/></>;
}

function ReceiptSpecimen(){
 const [task,setTask]=useState<ComponentProps<typeof ReceiptTools>['task']>({status:'needs-materials',receipts:{revision:0,materials:[],rows:[],request:null}}),[message,setMessage]=useState('');
 return <div><ReceiptTools task={task} onCamera={()=>setMessage(t('模拟相机请求','Simulated camera request'))} onAction={(action,value)=>{
  if(action==='wb-material')setTask(v=>({...v,receipts:{...v.receipts!,materials:value.action==='add'?[demoReceiptPack.id]:[],rows:value.action==='add'?structuredClone(demoReceiptPack.rows):[]}}));
  if(action==='wb-approval'){setMessage(t('模拟批准回执 · 没有文件写入','Simulated decision receipt · no file writes'));setTask(v=>({...v,receipts:{...v.receipts!,request:null}}));}
 }}/><button onClick={()=>setTask(v=>({...v,receipts:{...v.receipts!,request:{id:'fixture-request',version:1,scope:'demo-workspace',file:'fixture-sheet',fileRevision:1,draftRevision:1,rows:structuredClone(demoReceiptPack.rows),status:'pending'}}}))}>{t('查看批准状态样例','Preview approval state')}</button><p role="status">{message}</p></div>;
}
