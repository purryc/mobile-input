import type {ReactNode} from 'react';
import {controllerTheme,InputDockView} from './components';
/** Invisible native slots preserve the product's layout; only the surrounding viewport is cropped. */
function DockSlot(){return <div data-layout-slot="dock" aria-hidden="true" inert style={{visibility:'hidden',flex:'none'}}><InputDockView mode={null} system={false} keys="abc" shift={false} language={false} setKeys={()=>{}} setShift={()=>{}} setLanguage={()=>{}} toggle={()=>{}} disabled voiceDisabled speech="idle" voiceProps={{}} editable={false} selectionEditable={false} canUndo={false} canRedo={false} captureDisabled onEdit={()=>{}} onCapture={()=>{}} onSystemKeyboard={()=>{}} insert={()=>{}} erase={()=>{}} remoteDisabled trackpadProps={{}} leftButtonProps={{}} onRight={()=>{}} error="" errorToast={null} capturePanel={null}/></div>;}
export function ProductContext({name,theme,children}:{name?:string;theme:string;children:ReactNode}){
 if(name==='MediaControls')return <div className="bili-phone bili-controller" style={controllerTheme('bilibili')}><header className="adaptive-status" data-layout-slot="header"/><h1 data-layout-slot="title" style={{visibility:'hidden'}}>媒体标题</h1><div className="bili-input-main">{children}</div><DockSlot/></div>;
 if(name==='BrushConsole'||name==='PaintColor')return <div className="paint-phone"><header className="paint-phone-status" data-layout-slot="header"/><div className="paint-phone-title" data-layout-slot="title"/><div className="paint-phone-main">{children}</div><DockSlot/></div>;
 if(name==='PaintColorPicker')return <div className="paint-tablet gp-native">{children}</div>;
 if(name==='GameControls')return <div className="fc-phone">{children}</div>;
 if(['PresentationTools','SpeakerNotes','HoldToDraw'].includes(name||''))return <div className="presentation-phone-shell">{children}</div>;
 const app=name==='ReplyOptions'?'wechat':theme==='neutral'?'codex':'workbuddy';
 const objectFormat=['SelectionFormat','ColorPicker'].includes(name||'');
 const direct=['InputDockView','TaskNavigation'].includes(name||'');
 return <section className={'phone-controller '+(app==='wechat'?'wechat-phone':'live-workbuddy')+(objectFormat?' wb-adaptive-phone wb-object-phone':'')} data-controller-app={app} style={controllerTheme(app)}><header className="controller-header" data-layout-slot="header"/>{direct?children:<div className="controller-body">{children}</div>}{name!=='InputDockView'&&<DockSlot/>}</section>;
}
