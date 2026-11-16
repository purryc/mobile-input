import {type ComponentProps,type ReactNode} from 'react';
import {useUI} from './ui-context';
import './input-dock.css';
type ButtonProps=ComponentProps<'button'>;
type TrackProps=ComponentProps<'div'>;
export interface InputDockViewProps {
 mode:'keyboard'|'trackpad'|null;system:boolean;keys:'abc'|'symbol'|'more'|'emoji';shift:boolean;language:boolean;
 setKeys:(value:InputDockViewProps['keys'])=>void;setShift:(value:boolean)=>void;setLanguage:(value:boolean)=>void;toggle:(mode:'keyboard'|'trackpad')=>void;
 disabled:boolean;voiceDisabled:boolean;onVoiceUnavailable?:()=>void;onVoiceStart?:()=>void;speech:string;voiceProps:ButtonProps;
 editable:boolean;selectionEditable:boolean;canUndo:boolean;canRedo:boolean;captureDisabled:boolean;
 onEdit:(action:string)=>void;onCapture:()=>void;onSystemKeyboard:()=>void;insert:(text:string)=>void;erase:()=>void;
 remoteDisabled:boolean;trackpadProps:TrackProps;leftButtonProps:ButtonProps;onRight:()=>void;error:string;errorToast:ReactNode;capturePanel:ReactNode;
}
const icon=(name:string)=><img className="input-dock-icon" src={`./assets/figma/input-dock/${name}.svg`} alt=""/>;
const editTools=[['select-all','all','全选'],['copy','copy','复制'],['cut','cut','剪切'],['paste','paste','粘贴'],['delete','delete','删除'],['undo','undo','撤销'],['redo','redo','重做']];
export function InputDockView({mode,system,keys,shift,language,setKeys,setShift,setLanguage,toggle,disabled,voiceDisabled,onVoiceUnavailable,onVoiceStart,speech,voiceProps,editable,selectionEditable,canUndo,canRedo,captureDisabled,onEdit,onCapture,onSystemKeyboard,insert,erase,remoteDisabled,trackpadProps,leftButtonProps,onRight,error,errorToast,capturePanel}:InputDockViewProps){
 const uiText=useUI();
 const rows=keys==='abc'?['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']:keys==='symbol'?['1234567890','!@#$%&*()','，。？！；：']:keys==='more'?['[]{}<>+=/','_\\|~`^°€£','…—·「」【】']:['😀😄😁🥰😍😊','👍👏🙏🎉❤️🌈','🐱🌊🎨✨🌿🚀'];
 const modes=<><button className="input-mode-key" aria-label={uiText("键盘")} aria-pressed={mode==='keyboard'||system} onClick={()=>toggle('keyboard')}>{icon('keyboard')}</button><button className="input-mode-key" aria-label={uiText("触控板")} aria-pressed={mode==='trackpad'} onClick={()=>toggle('trackpad')}>{icon('trackpad')}</button></>;
 const microphoneOn=speech==='starting'||speech==='recording';
 const voice=<button aria-label={uiText("智慧语音")} aria-pressed={microphoneOn} className={'input-voice '+(microphoneOn?'recording':'')} disabled={disabled||voiceDisabled&&!onVoiceUnavailable||speech==='finishing'} onPointerDownCapture={onVoiceStart} onClickCapture={onVoiceStart} {...(voiceDisabled&&onVoiceUnavailable?{onClick:onVoiceUnavailable}:voiceProps)}><i className="input-dock-icon input-voice-symbol" aria-hidden="true"/><span>{uiText("智慧语音")}</span></button>;
 return <><section className={'input-dock '+(mode?'expanded mode-'+mode:'')}>
  <div className="input-edit-tools">{editTools.map(([name,action,label])=><button key={action} aria-label={uiText(label)} disabled={disabled||(!editable&&!selectionEditable&&!(action==='undo'&&canUndo)&&!(action==='redo'&&canRedo))} onPointerDown={e=>e.preventDefault()} onClick={()=>onEdit(action)}>{icon(name)}</button>)}<button aria-label={uiText("采集方式")} disabled={captureDisabled} onClick={onCapture}>{icon('capture')}</button></div>
  {mode==='keyboard'&&<div className="input-keyboard" aria-label={uiText("展开键盘")}>
   <div className="input-keyboard-top"><button aria-label={uiText("字母与输入法")} aria-pressed={keys==='abc'} onClick={()=>{if(keys==='abc')setLanguage(!language);else{setKeys('abc');setLanguage(false);}}}>ABC</button><button aria-pressed={keys==='symbol'||keys==='more'} onClick={()=>{setKeys('symbol');setLanguage(false);}}>123</button><button aria-pressed={keys==='emoji'} onClick={()=>{setKeys('emoji');setLanguage(false);}}>{uiText("表情")}</button></div>
   {language&&<div className="input-language-menu" role="menu" aria-label={uiText("输入法")}><button role="menuitem" onClick={()=>setLanguage(false)}>{uiText("字母键盘")}</button><button role="menuitem" disabled={!editable||disabled} onClick={onSystemKeyboard}>{uiText("系统中文输入")}</button></div>}
   {rows.map((row,i)=><div className="input-key-row" key={i}>{i===2&&<button className="input-key-modifier" aria-label={keys==='abc'?uiText("大写切换"):'更多符号'} aria-pressed={keys==='abc'?shift:keys==='more'} onPointerDown={e=>e.preventDefault()} onClick={()=>keys==='abc'?setShift(!shift):setKeys(keys==='more'?'symbol':'more')}>{keys==='abc'?'↑':keys==='more'?'123':'#+='}</button>}{Array.from(new Intl.Segmenter('zh',{granularity:'grapheme'}).segment(row)).map((c,j)=><button disabled={!editable||disabled} key={j} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(keys==='abc'&&!shift?c.segment.toLowerCase():c.segment)}>{c.segment}</button>)}{i===2&&<button className="input-key-modifier" aria-label={uiText("退格")} disabled={!editable||disabled} onPointerDown={e=>e.preventDefault()} onClick={erase}>⌫</button>}</div>)}
  </div>}
  {mode==='trackpad'&&<div className="input-trackpad" aria-label={uiText("展开触控板")}><div className="input-track-surface" aria-label={uiText("触控区域")} {...trackpadProps}><i/></div></div>}
  <div className="input-bottom-row"><div className="input-mode-pair">{modes}</div>{mode==='keyboard'?<div className="input-keyboard-actions"><button className="input-space" disabled={!editable||disabled} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(' ')}>{uiText("空格")}</button><button aria-label={uiText("回车")} disabled={!editable||disabled} onPointerDown={e=>e.preventDefault()} onClick={()=>insert('\n')}>{icon('return')}</button></div>:mode==='trackpad'?<div className="input-mouse-pair"><button aria-label={uiText("左键")} disabled={remoteDisabled} {...leftButtonProps}/><button aria-label={uiText("右键")} disabled={remoteDisabled} onClick={onRight}/></div>:null}{voice}</div>
  {error&&(/语音|识别|转写|采音|麦克风|Asr/i.test(error)?errorToast:<div role="alert" className="input-error">{error}</div>)}
 </section>{capturePanel}</>;
}
