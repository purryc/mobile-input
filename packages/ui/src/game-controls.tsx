import {useUI} from './ui-context';
import {type ComponentProps} from 'react';
import './phone-game.css';
const asset=(name:string)=>`./assets/figma/fc/${name}.svg`;
export function GameControls({part,pressed,keyProps}:{part:'direction'|'actions';pressed:string[];keyProps:(key:string)=>ComponentProps<'button'>}){const uiText=useUI();return part==='direction'?<>    <div className="fc-dpad">
     <img className="fc-dpad-base" src={asset('dpad-base')} alt=""/>
     <button aria-label={uiText("方向上")} {...keyProps('ArrowUp')} className={'up '+(pressed.includes('ArrowUp')?'held':'')}><img src={asset('arrow-up')} alt=""/></button>
     <button aria-label={uiText("向左")} {...keyProps('ArrowLeft')} className={'left '+(pressed.includes('ArrowLeft')?'held':'')}><img src={asset('arrow-left')} alt=""/></button>
     <span className="fc-dpad-center" aria-hidden="true"/>
     <button aria-label={uiText("向右")} {...keyProps('ArrowRight')} className={'right '+(pressed.includes('ArrowRight')?'held':'')}><img src={asset('arrow-right')} alt=""/></button>
     <button aria-label={uiText("方向下")} {...keyProps('ArrowDown')} className={'down '+(pressed.includes('ArrowDown')?'held':'')}><img src={asset('arrow-down')} alt=""/></button>
    </div>
</>:<>    <button aria-label={uiText("加速 B")} {...keyProps('Shift')} className={'fc-action fc-b '+(pressed.includes('Shift')?'held':'')}><img src={asset('button-light')} alt=""/><span>B</span></button>
    <button aria-label={uiText("跳跃 A")} {...keyProps('Space')} className={'fc-action fc-a '+(pressed.includes('Space')?'held':'')}><img src={asset('button-light')} alt=""/><span>A</span></button>
</>;}
