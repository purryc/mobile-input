import React, {useEffect, useState, type ComponentType} from 'react';
import './optical-scene.css';

export type SampleState = 'needs-input'|'default-selected'|'object-bound'|'ambiguous-recommendation'|'expanded'|'preparing';
export interface Sample {
  state: SampleState; label: string; kind: 'document'|'font'; size: 'inline'|'specimen';
  surfaceContext: 'composer'|'artifact'; open: () => void; remove: () => void;
}
const rows: [SampleState,string,string][] = [
  ['needs-input','待补充','字体'], ['default-selected','已选','微软雅黑'],
  ['object-bound','已绑定','产品资料.pdf'], ['ambiguous-recommendation','推荐','适合阅读的字体'],
  ['expanded','展开','微软雅黑'], ['preparing','准备中','适合阅读的字体'],
];
export function OpticalScene({Chip}:{Chip:ComponentType<Sample>}) {
  const query = new URLSearchParams(location.search);
  const size = query.get('size') === 'specimen' ? 'specimen' : 'inline';
  const surfaceContext = query.has('artifact') ? 'artifact' : 'composer';
  const [active,setActive] = useState<number|null>(null);
  const [removed,setRemoved] = useState<number[]>([]);
  const [ready,setReady] = useState(false);
  useEffect(() => {
    function update(e:MessageEvent) {
      if(e.source !== parent || e.origin !== location.origin) return;
      const {action,index}=e.data??{};
      if(action==='open')setActive(previous=>previous===index?null:index);
      if(action==='remove')setRemoved(previous=>[...previous,index]);
      if(action==='resolve')setReady(true);
      if(action==='reset'){setActive(null);setRemoved([]);setReady(false);}
    }
    addEventListener('message',update);
    return ()=>removeEventListener('message',update);
  },[]);
  return <main className="optical-scene" data-background={surfaceContext}>{rows.map(([initial,name,label],index)=>{
    const state = active===index?'expanded':initial==='preparing'&&ready?'ambiguous-recommendation':initial;
    const send=(action:string)=>parent.postMessage({source:'optical-scene',action,index},location.origin);
    return <section key={initial} data-row={initial}><small>{name}</small>
      {removed.includes(index)?<span>已移除</span>:<Chip {...{state,label,size,surfaceContext}} kind={index===2?'document':'font'} open={()=>send('open')} remove={()=>send('remove')}/>}
    </section>;
  })}</main>;
}
