import {createContext,useContext,useState,type ReactNode} from 'react';
import {createComponentImplementation} from '@a2ui/react/v0_9';
import {Catalog} from '@a2ui/web_core/v0_9';
import {apis,catalogId} from './catalog-api';
import {ActionChip,ColorInput,DurationInput,AuxiliaryPanel} from './components';
import {ImageDemo,PolishDemo,Specimen} from './specimens';
import {DemoEditor,type DemoEvent} from './demo-controller';
import {t} from './i18n';
export const SandboxHost=createContext<{editor:DemoEditor;emit:(e:DemoEvent)=>void}|null>(null);
function ClosedPanel({title,children}:{title:string;children:ReactNode|((close:()=>void)=>ReactNode)}){const [open,setOpen]=useState(true);return open?<AuxiliaryPanel title={title} onClose={()=>setOpen(false)}>{typeof children==='function'?children(()=>setOpen(false)):children}</AuxiliaryPanel>:<button onClick={()=>setOpen(true)}>{t('重新打开','Reopen')}</button>;}
const implementations=[
 createComponentImplementation(apis.Column,({props,buildChild})=><div className="catalog-column">{props.children?.map((c,i)=><div key={i}>{buildChild(c)}</div>)}</div>),
 createComponentImplementation(apis.Text,({props})=><p>{props.text}</p>),
 createComponentImplementation(apis.ActionChip,({props,context})=><ActionChip onClick={()=>void context.dispatchAction({event:{name:'action.activate',context:{actionId:props.actionId}}})}>{props.label}</ActionChip>),
 createComponentImplementation(apis.ColorInput,({props,context})=><ClosedPanel title={t('颜色输入','Color input')}>{close=><ColorInput value={props.value||'#E03131'} label={{primary:'主题色',background:'背景',text:'文字'}[props.role]} onChange={v=>{props.setValue?.(v);void context.dispatchAction({event:{name:'value.change',context:{value:v}}});}} onActive={()=>{}} onDone={()=>{close();void context.dispatchAction({event:{name:'color.done',context:{}}});}}/>}</ClosedPanel>),
 createComponentImplementation(apis.DurationInput,({props,context})=><DurationInput value={props.value||'10'} onChange={v=>{props.setValue?.(v);void context.dispatchAction({event:{name:'value.change',context:{value:v}}});}}/>),
 createComponentImplementation(apis.ImageInput,()=>{const host=useContext(SandboxHost)!;return <ImageDemo onEvent={host.emit}/>;}),
 createComponentImplementation(apis.SketchInput,()=>{const host=useContext(SandboxHost)!;return <Specimen name="SketchInput" onEvent={host.emit}/>;}),
 createComponentImplementation(apis.AuxiliaryPanel,({props,buildChild})=><ClosedPanel title={props.title||''}>{buildChild(props.child)}</ClosedPanel>),
 createComponentImplementation(apis.ContextualPolishActions,({props})=>{const host=useContext(SandboxHost)!;return props.contextId===host.editor.id?<PolishDemo editor={host.editor} onEvent={host.emit}/>:<p role="alert">Unknown editor context</p>;})
];
export const catalog=new Catalog(catalogId,'v0.9.1',implementations,[]);
