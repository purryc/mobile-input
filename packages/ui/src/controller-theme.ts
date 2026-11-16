import type {CSSProperties} from 'react';
import tokens from '../../../docs/liquid-glass-tokens.json';
export function controllerTheme(app:string,subapp?:string):CSSProperties{
 const name=app==='wechat'?'WeChat':app==='bilibili'?'Bilibili':app==='workbuddy'?'WorkBuddy':app==='wps'?({writer:'Word',sheet:'Sheet',presentation:'Presentation'} as const)[subapp as 'writer']||'System':'System';
 const c=tokens.resolved[name],seed=['codex','chatgpt'].includes(app)?'13 13 13':app==='gemini'?'66 133 244':[c.r,c.g,c.b].map(x=>Math.round(x*255)).join(' ');
 return {'--controller-seed':seed,'--mac-seed':seed,'--input-accent':`rgb(${seed})`,'--dock-accent':`rgb(${seed})`} as CSSProperties;
}
