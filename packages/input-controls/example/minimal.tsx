import {useRef,useState} from 'react';
import {WidgetProvider,WidgetSurface,InlineChip,AnchoredPanel,AuxiliaryPanel,DurationWidget,useSinglePanel} from '../src';
import {translate} from './widget-preview';
/** Minimal executable controlled composition: no fixture catalog or application state. */
export function Minimal(){
 const [value,setValue]=useState('10');const anchor=useRef<HTMLSpanElement>(null);const panel=useSinglePanel();
 return <main className="example-page"><h1>Minimal React integration</h1><WidgetProvider language="en" translate={translate('en')} assetBase={import.meta.env.BASE_URL} theme={{accent:'#6266df'}}><WidgetSurface><p>Presentation duration: <span ref={anchor}><InlineChip token={{id:'duration',kind:'duration',role:'Duration',phrase:'10 minutes',label:value+' min',value,semanticState:'default-selected'}} expanded={panel.active==='duration'} controlsId="duration-panel" onOpen={()=>panel.toggle('duration')}/></span></p><AnchoredPanel anchor={anchor} open={panel.active==='duration'} id="duration-panel" label="Duration" width={288} onClose={panel.close}><AuxiliaryPanel title="Duration" onClose={panel.close}><DurationWidget value={value} onChange={setValue} onDone={panel.close}/></AuxiliaryPanel></AnchoredPanel></WidgetSurface></WidgetProvider><p>Host value: {value} minutes</p></main>;
}
