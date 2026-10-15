import {PolishControls} from './ai-polish';
import {InputDock} from './input-dock';
import {BilibiliWordmark} from "./bilibili-wordmark";
import {CapturePanel} from './capture-panel';
import {useEffect,useRef,useState} from 'react';
import * as I from 'lucide-react';
import {biliVideos,currentBili,type DanmakuStyle} from '../../../packages/core/bilibili';
import {command,currentState,uid,useRuntime} from './runtime';
import {ConnectionButton} from './connection-access';
import {SwitchButton} from './phone-wechat';
import {usePhoneInsets} from './phone-insets';
import {usePhoneEditing} from './use-phone-editing';
import './bilibili.css';

export function PhoneBilibili(){const r=useRuntime();return <BiliInput key={r.state.bilibili.epoch+':'+r.connected}/>;}
function BiliInput(){
 const r=useRuntime(),b=r.state.bilibili,video=currentBili(r.state),key=`mobile-input:bilibili:${video.id}`;
 const [saved]=useState(()=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}});
 const [text,setText]=useState<string>(saved?.text??b.drafts[video.id].text),[style,setStyle]=useState<DanmakuStyle>(saved?.style??b.drafts[video.id].style),[blocked,setBlocked]=useState(Boolean(saved?.pending)),[busy,setBusy]=useState(false),[menu,setMenu]=useState<'style'|'color'|null>(null),[mode,setMode]=useState<'keyboard'|'trackpad'|null>(null),[capture,setCapture]=useState(false);
 const [coinRequest,setCoinRequest]=useState<{id:string;video:string}|null>(()=>{try{return JSON.parse(localStorage.getItem('mobile-input:bilibili:coin-request')||'null');}catch{return null;}});
 const baseVersion=useRef(b.drafts[video.id].revision);
 const actionBusy=useRef(false),requestText=useRef<string>(saved?.requestText??saved?.text??'');
 const area=useRef<HTMLTextAreaElement>(null),value=useRef(text),styleRef=useRef(style),pending=useRef(false),sequence=useRef(0),session=useRef(uid()),queued=useRef(false),running=useRef<Promise<void>|null>(null),alive=useRef(true),anchor=useRef<{id:string;revision:number}|null>(null),block=useRef(blocked),request=useRef<string>(saved?.request||''),track=useRef({x:0,at:0});
 value.current=text;styleRef.current=style;
 const persist=()=>localStorage.setItem(key,JSON.stringify({text:value.current,style:styleRef.current,pending:pending.current,request:request.current,requestText:requestText.current}));
 const target=()=>({video:video.id,epoch:b.epoch});
 const send=(type:string,fields:Record<string,unknown>={})=>command(type,{...target(),...fields});
 const focused=r.state.target?.id===`bili:${video.id}`;
 const editing=usePhoneEditing(text,update,area,`${video.id}:${r.state.target?.revision}`,r.connected&&!blocked&&focused);
 function reject(){block.current=true;setBlocked(true);queued.current=false;persist();}
 async function focus(){if(block.current||!alive.current||currentState().target?.id!==`bili:${video.id}`)return false;const state=currentState();if(state.app!=='bilibili'||state.bilibili.epoch!==b.epoch)return false;
  if(!anchor.current){const t=state.target;if(!t)return false;anchor.current={id:t.id,revision:t.revision};}return true;}
 async function flush(){if(running.current){await running.current;if(queued.current)return flush();return;}if(!queued.current||block.current||!alive.current)return;
  queued.current=false;const next=value.current,chosen={...styleRef.current};const run=async()=>{if(!(await focus())){reject();return;}const d=currentState().bilibili.drafts[video.id],t=anchor.current!;
   if(d.revision!==baseVersion.current){reject();return;}
   const ack=await command('bili-edit',{...target(),text:next,style:chosen,revision:d.revision,session:session.current,sequence:++sequence.current},{app:'bilibili',targetId:t.id,targetRevision:t.revision});if(!alive.current)return;if(!ack.ok)reject();else{baseVersion.current=currentState().bilibili.drafts[video.id].revision;pending.current=value.current!==next;persist();}};
  running.current=run();try{await running.current;}finally{running.current=null;}if(queued.current)return flush();
 }
 function update(next:string){value.current=next;setText(next);pending.current=true;persist();queued.current=true;void command('switch-cancel');if(!block.current)void flush();}
 function changeStyle(next:DanmakuStyle){styleRef.current=next;setStyle(next);pending.current=true;persist();queued.current=true;if(!block.current)void flush();}
 async function recover(){if(request.current){const ack=await send('bili-query',{request:request.current});if(!ack.ok)return;const result=currentState().bilibili.receipts[request.current];if(!result)return;if(result.outcome!=='cancelled'&&value.current===requestText.current){value.current='';setText('');pending.current=false;}request.current='';persist();}
  baseVersion.current=currentState().bilibili.drafts[video.id].revision;block.current=false;setBlocked(false);anchor.current=null;if(await focus()){queued.current=true;await flush();}else reject();}
 async function submit(){if(busy||block.current||editing.speech!=='idle')return;setBusy(true);const submitted=value.current;try{await flush();if(block.current||!(await focus()))return;const d=currentState().bilibili.drafts[video.id],t=anchor.current!;
  request.current=uid();requestText.current=submitted;persist();
  const ack=await command('bili-send',{...target(),text:submitted,style:styleRef.current,revision:d.revision},{id:request.current,app:'bilibili',targetId:t.id,targetRevision:t.revision});if(!alive.current)return;
  if(ack.ok){if(value.current===submitted){value.current='';setText('');pending.current=false;}request.current='';persist();}else{if(!ack.error?.includes('回执')&&!ack.error?.includes('中断'))request.current='';reject();}
 }finally{if(alive.current)setBusy(false);}}
 async function action(type:string,fields:Record<string,unknown>={}){
  if(actionBusy.current||busy||!r.connected)return;actionBusy.current=true;editing.cancel();setBusy(true);
  try{
   if(type==='bili-coin'){
    if(coinRequest){
     const ack=await command('bili-query',{video:coinRequest.video,request:coinRequest.id});
     if(ack.ok&&currentState().bilibili.receipts[coinRequest.id]){localStorage.removeItem('mobile-input:bilibili:coin-request');if(alive.current)setCoinRequest(null);}return;
    }
    const next={id:uid(),video:video.id};localStorage.setItem('mobile-input:bilibili:coin-request',JSON.stringify(next));setCoinRequest(next);
    const ack=await command(type,{...target(),...fields},{id:next.id,app:'bilibili'});
    if(!alive.current)return;
    if(ack.ok||!['回执','中断','未连接'].some(x=>ack.error?.includes(x))){localStorage.removeItem('mobile-input:bilibili:coin-request');setCoinRequest(null);}
   }else await send(type,fields);
  }finally{actionBusy.current=false;if(alive.current)setBusy(false);}
 }
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;persist();};},[]);
 useEffect(()=>{if(!r.connected){block.current=true;setBlocked(true);pending.current=!!value.current;persist();}},[r.connected]);
 useEffect(()=>{if(!pending.current&&!running.current&&!queued.current){baseVersion.current=b.drafts[video.id].revision;value.current=b.drafts[video.id].text;setText(value.current);styleRef.current=b.drafts[video.id].style;setStyle(styleRef.current);}},[b.drafts[video.id].revision]);
 const [volume,setVolume]=useState(b.volume??.6),volumeQueue=useRef<number|null>(null),volumeBusy=useRef(false);
 useEffect(()=>{if(!volumeBusy.current)setVolume(b.volume??.6);},[b.volume]);
 async function adjustVolume(next:number){setVolume(next);volumeQueue.current=next;if(volumeBusy.current)return;volumeBusy.current=true;
  try{while(volumeQueue.current!==null&&alive.current){const value=volumeQueue.current;volumeQueue.current=null;const ack=await send('bili-volume',{volume:value});if(!ack.ok){volumeQueue.current=null;break;}}}finally{volumeBusy.current=false;if(alive.current)setVolume(currentState().bilibili.volume??.6);}
 }
 const styleTools=menu&&<div className="bili-style-menu">{menu==='color'?<><b>弹幕颜色</b><div className="bili-color-swatches">{b.capabilities.colors.map(color=><button aria-label={'弹幕颜色 '+color} aria-pressed={style.color===color} key={color} style={{background:color}} onClick={()=>changeStyle({...style,color})}/>)}<input aria-label="弹幕自定义颜色" type="color" value={style.color} onChange={e=>changeStyle({...style,color:e.target.value})}/></div></>:<><b>弹幕样式</b><label>字号<select aria-label="弹幕字号" value={style.size} onChange={e=>changeStyle({...style,size:Number(e.target.value)})}>{b.capabilities.sizes.map(size=><option key={size} value={size}>{size}</option>)}</select></label><div>{b.capabilities.modes.map(m=><button key={m} aria-pressed={style.mode===m} onClick={()=>changeStyle({...style,mode:m})}>{{scroll:'滚动',top:'顶端',bottom:'底端'}[m]}</button>)}</div></>}<button aria-label="关闭弹幕样式" onClick={()=>setMenu(null)}><I.X size={18}/></button></div>;
 return <main className="bili-phone bili-controller" style={usePhoneInsets()}>
  <header className="adaptive-status"><BilibiliWordmark/><div><b>Bilibili</b><small>{r.connected?'已连接':'连接已断开'}</small></div><SwitchButton beforeSwitch={editing.cancel}/><ConnectionButton/></header>
  <h1>{video.title} · 第 {b.index+1} / {biliVideos.length} 条</h1>
  <div className="bili-input-main"><section className="bili-actions">
   <div className="bili-playback-row"><button className="bili-play-toggle" aria-label={r.state.playing?'暂停':'播放'} disabled={busy||!r.connected} onClick={()=>action('bili-play',{playing:!r.state.playing})}>{r.state.playing?<I.Pause size={24}/>:<img src="./assets/bilibili/play.svg" alt=""/>}{r.state.playing?'暂停':'播放'}</button><div className="bili-speed"><span>倍速</span><div>{[1,1.5,2].map(speed=><button key={speed} aria-label={speed+'倍速'} aria-pressed={(b.speed??1)===speed} disabled={busy||!r.connected} onClick={()=>action('bili-speed',{speed})}>{speed}×</button>)}</div></div></div>
   <div className="bili-volume"><button aria-label={b.muted?'取消静音':'静音'} aria-pressed={b.muted??false} disabled={!r.connected} onClick={()=>action('bili-mute',{muted:!b.muted})}>{b.muted?<I.VolumeX size={24}/>:<img src="./assets/bilibili/volume.svg" alt=""/>}</button><label><span>音量<output>{b.muted?'已静音':Math.round(volume*100)+'%'}</output></span><input aria-label="播放音量" type="range" min="0" max="100" step="1" disabled={!r.connected} value={Math.round(volume*100)} style={{'--volume-fill':Math.round(volume*100)+'%'} as React.CSSProperties} onChange={e=>void adjustVolume(Number(e.target.value)/100)}/></label></div>
   <div className="bili-actions-top">{[[I.ThumbsUp,'点赞','bili-like'],[I.Star,'收藏','bili-favorite'],[I.CircleDollarSign,'投币','bili-coin']].map(([C,label,type])=>{const Icon=C as typeof I.Star;return <button key={String(type)} disabled={busy||!r.connected} onClick={()=>action(String(type))}><Icon size={21} strokeWidth={1.65}/>{type==='bili-coin'&&coinRequest?'核对投币':String(label)}</button>;})}</div><div className="bili-actions-list"><button disabled={!r.connected} onClick={()=>action('bili-view',{fullscreen:!b.fullscreen})}>{b.fullscreen?<I.List size={24}/>:<img src="./assets/bilibili/fullscreen.svg" alt=""/>}{b.fullscreen?'列表':'全屏'}</button><span/><button disabled={busy||!r.connected||b.index===0} onClick={()=>action('bili-next',{delta:-1})}><I.SkipBack size={21}/>上一条</button><button disabled={busy||!r.connected||b.index===biliVideos.length-1} onClick={()=>action('bili-next',{delta:1})}><I.SkipForward size={21}/>下一条</button></div></section>
  {(focused||blocked)&&<section className="bili-phone-composer">{blocked&&<div className="bili-target-warning">草稿已保留<button disabled={!r.connected} onClick={recover}>{request.current?'核对当前请求':'输入到当前视频'}</button></div>}
   <textarea ref={area} aria-label="手机弹幕草稿" placeholder="发个友善的弹幕" value={text} onFocus={()=>{if(!block.current)void focus();void command('switch-cancel');}} onSelect={editing.select} onChange={e=>{editing.selection.current={start:e.target.selectionStart,end:e.target.selectionEnd};editing.change(e.target.value);}}/>
   {editing.polish&&<PolishControls editing={editing}/>}
   <footer><button aria-label="弹幕样式" onClick={()=>setMenu(menu==='style'?null:'style')}><I.Type size={21}/></button><button aria-label="弹幕颜色" onClick={()=>setMenu(menu==='color'?null:'color')}><I.Palette size={21}/></button><span/><button className="bili-send" disabled={busy||blocked||!r.connected||!text.trim()||editing.speech!=='idle'} aria-label="发送弹幕" onClick={submit}><I.Send size={23}/>发送</button></footer>{styleTools}
  </section>}
  </div><InputDock editing={editing} area={area} disabled={busy||blocked||!r.connected} editable={focused} voiceDisabled={!focused}/>{capture&&<CapturePanel close={()=>setCapture(false)}/>}
 </main>;
}
