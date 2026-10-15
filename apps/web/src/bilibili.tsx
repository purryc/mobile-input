import {currentState} from './runtime';
import {BilibiliWordmark} from "./bilibili-wordmark";
import {useEffect,useRef,useState} from 'react';
import * as I from 'lucide-react';
import {biliVideos,currentBili} from '../../../packages/core/bilibili';
import {type State} from '../../../packages/core/model';
import {command} from './runtime';
import './bilibili.css';
export function Bilibili({s}:{s:State}) {
 const b=s.bilibili,video=currentBili(s),ref=useRef<HTMLVideoElement>(null),last=useRef(0),[error,setError]=useState('');
 const seenReactions=useRef(new Set(Object.keys(b.receipts))),effectVideo=useRef(video.id);
 const [reactionEffect,setReactionEffect]=useState<{id:string;action:string;label:string}|null>(null);
 useEffect(()=>{
  const switched=effectVideo.current!==video.id;effectVideo.current=video.id;
  const fresh=Object.entries(b.receipts).filter(([id])=>!seenReactions.current.has(id));
  for(const [id] of fresh)seenReactions.current.add(id);
  if(switched){setReactionEffect(null);return;}
  const applied=fresh.filter(([,r])=>r.video===video.id&&r.outcome==='applied'&&['bili-like','bili-favorite','bili-coin'].includes(r.action)&&!r.message.includes('取消')).at(-1);
  if(applied)setReactionEffect({id:applied[0],action:applied[1].action,label:applied[1].message});
 },[b.receipts,video.id]);
 useEffect(()=>{if(!reactionEffect)return;const timer=setTimeout(()=>setReactionEffect(null),1600);return()=>clearTimeout(timer);},[reactionEffect]);
 const send=(type:string,value:Record<string,unknown>={})=>command(type,{video:video.id,epoch:b.epoch,...value});
 useEffect(()=>{setError('');last.current=0;},[video.id]);
 useEffect(()=>{const v=ref.current;if(!v)return;if(s.playing)void v.play().catch(()=>{setError('播放被阻止，请点击播放重试');void send('bili-play',{playing:false});});else v.pause();},[s.playing,video.id]);
 useEffect(()=>{if(ref.current&&Math.abs(ref.current.currentTime-b.seek.position)>.1)ref.current.currentTime=b.seek.position;},[b.seek.sequence]);
 useEffect(()=>{if(ref.current){ref.current.playbackRate=b.speed??1;ref.current.volume=b.volume??.6;ref.current.muted=b.muted??false;}},[video.id,b.speed,b.volume,b.muted]);
 const time=(force=false)=>{const v=ref.current;if(!v||!Number.isFinite(v.duration))return;if(force||performance.now()-last.current>300){last.current=performance.now();void send('bili-time',{position:v.currentTime,duration:v.duration,ended:v.ended});}};
 const r=b.reactions[video.id],comments=b.danmaku.filter(x=>x.video===video.id);
 return <main className={'bili-tablet'+(b.fullscreen?' bili-fullscreen':'')}>
  <header><BilibiliWordmark/><span>首页</span><span>动态</span><span>我的收藏</span><span className="bili-search"><I.Search size={18}/>搜索视频、UP主</span></header>
  <div className="bili-layout"><section className="bili-main"><h1>{video.title}</h1><p className="bili-meta">{video.author} · 视频片段</p>
   <div className="bili-video"><video key={video.id} ref={ref} src={video.src} poster={video.poster} playsInline loop preload="auto" onLoadedMetadata={()=>time(true)} onTimeUpdate={()=>time()} onEnded={()=>time(true)} onError={()=>setError('视频暂时无法播放')} onClick={()=>send('bili-play',{playing:!s.playing})}/>
    <div className="bili-danmaku" aria-label="弹幕显示">{comments.filter(x=>b.position>=x.position-.1&&b.position-x.position<5).slice(-8).map((x,i)=><span key={x.id} className={x.style.mode} style={{color:x.style.color,fontSize:x.style.size,top:x.style.mode==='bottom'?'auto':`${5+i*8}%`,bottom:x.style.mode==='bottom'?`${8+i*8}%`:undefined}}>{x.text}</span>)}</div>
    {reactionEffect&&<div key={reactionEffect.id} className={'bili-reaction-effect '+reactionEffect.action} aria-label={reactionEffect.label}>
     <div className="bili-reaction-halo"/>{Array.from({length:8},(_,i)=><i key={i} style={{'--ray':`${i*45}deg`} as React.CSSProperties}/>)}
     <div className="bili-reaction-symbol">{reactionEffect.action==='bili-like'?<I.ThumbsUp/>:reactionEffect.action==='bili-favorite'?<I.Star/>:<I.CircleDollarSign/>}</div><strong>{reactionEffect.label}</strong>
    </div>}
    <div className="bili-playbar"><button aria-label={s.playing?'暂停':'播放'} onClick={()=>send('bili-play',{playing:!s.playing})}>{s.playing?<I.Pause/>:<I.Play/>}</button><time>{b.position.toFixed(1)} / {b.duration.toFixed(1)}</time><input aria-label="视频进度" type="range" min="0" max={b.duration||1} step=".1" value={b.position} onChange={e=>send('bili-seek',{position:Number(e.target.value)})}/><button aria-label="播放列表" onClick={()=>send('bili-list')}><I.ListVideo/></button></div>
   </div>
   <div className={'bili-compose '+(s.target?.id===`bili:${video.id}`?'active':'')}><span>弹幕</span><input aria-label="平板弹幕输入" placeholder="发个友善的弹幕见证当下" value={b.drafts[video.id].text} onFocus={()=>send('bili-focus')} onChange={e=>{const state=currentState(),t=state.target,d=state.bilibili.drafts[video.id];if(t)void command('bili-edit',{video:video.id,epoch:b.epoch,text:e.target.value,style:d.style,revision:d.revision,session:'tablet',sequence:d.sequence+1},{targetId:t.id,targetRevision:t.revision});}}/><I.Send size={18}/></div>
   <div className="bili-reactions">{[['bili-like','点赞',I.ThumbsUp,r.liked],['bili-coin','投币',I.CircleDollarSign,r.coins],['bili-favorite','收藏',I.Star,r.favorite]].map(([type,label,C,active])=>{const Icon=C as typeof I.Star;return <button key={String(type)} className={active?'active':''} onClick={()=>send(String(type))}><Icon/>{String(label)}{type==='bili-coin'?` ${r.coins}`:''}</button>;})}</div>
   {video.id==='bunny-30s'&&<p className="bili-meta">大雄兔 · 原片 01:00–01:05 片段 · © 2008 Blender Foundation / www.bigbuckbunny.org · CC BY 3.0</p>}
   <div className="bili-feedback" role="status">{error||b.feedback?.message}</div>
   <h2>弹幕记录 <small>{comments.length}</small></h2><div className="bili-comment-history">{comments.map(x=><p key={x.id}><b>我</b><span>{x.text}</span><small>{x.position.toFixed(1)} 秒</small></p>)}</div>
  </section><aside><div className="bili-up"><span>UP</span><div><b>{video.author}</b><small>本地视频合集</small></div></div><h2>播放列表 <small>{b.index+1} / {biliVideos.length}</small></h2>{biliVideos.map((x,i)=><button className={'bili-list-item '+(b.index===i?'current':'')} key={x.id} onClick={()=>send('bili-select',{index:i})}><img src={x.poster} alt=""/><span>{x.title}<small>{x.author}</small></span></button>)}<small>演示硬币余额 {b.balance}</small></aside></div>
  {b.list&&<div className="bili-list-overlay" onClick={()=>send('bili-list')}><section role="dialog" aria-label="播放列表" onClick={e=>e.stopPropagation()}><header><h2>播放列表</h2><button className="bili-reset-reactions" aria-label="重置当前视频互动" onClick={()=>send('bili-reset-reactions')}><I.RotateCcw size={18}/>重置互动</button><button aria-label="关闭播放列表" onClick={()=>send('bili-list')}><I.X/></button></header>{biliVideos.map((x,i)=><button className={'bili-list-item '+(b.index===i?'current':'')} key={x.id} onClick={()=>send('bili-select',{index:i})}><img src={x.poster} alt=""/><span>{x.title}</span></button>)}</section></div>}
 </main>;
}
