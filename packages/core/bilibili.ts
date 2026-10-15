import type { Command, State } from './model';

export const biliVideos = [
  { id: 'hover-drama', title: '甄嬛传 · 华妃经典片段', author: '吃瓜抠脚', src: './assets/bilibili/drama.mp4', poster: './assets/bilibili/drama.jpg' },
  { id: 'bunny-30s', title: '大雄兔 · 林间片段', author: 'Blender Foundation', src: './assets/bilibili/bunny-5s.mp4', poster: './assets/bilibili/bunny-30s.jpg' },
  { id: 'yuyan-foretold', title: '喻言 · 蔷薇之巅（30秒）', author: '喻言官方频道', src: './assets/bilibili/yuyan-30s.mp4', poster: './assets/bilibili/yuyan-30s.jpg' },
] as const;
export interface DanmakuStyle { color: string; size: number; mode: 'scroll' | 'top' | 'bottom' }
export interface BiliDraft { text: string; revision: number; session: string; sequence: number; style: DanmakuStyle }
export interface BilibiliState {
  version: 1; catalogRevision?: number; volume: number; muted: boolean; speed: number; fullscreen: boolean; index: number; epoch: number; list: boolean; balance: number;
  drafts: Record<string, BiliDraft>;
  reactions: Record<string, { liked: boolean; favorite: boolean; coins: number }>;
  danmaku: { id: string; video: string; text: string; style: DanmakuStyle; position: number; at: number }[];
  receipts: Record<string, { video: string; action: string; message: string; outcome?: 'applied' | 'cancelled' }>;
  feedback: { id: string; message: string } | null;
  seek: { sequence: number; position: number }; position: number; duration: number;
  capabilities: { canSend: boolean; canCoin: boolean; reason: string; sizes: number[]; colors: string[]; modes: DanmakuStyle['mode'][] };
}
export function initialBilibili(): BilibiliState {
  return { version: 1, catalogRevision: 3, volume: .6, muted: false, speed: 1, fullscreen: false, index: 0, epoch: 0, list: false, balance: 6,
    drafts: Object.fromEntries(biliVideos.map(v => [v.id, { text: '', revision: 0, session: '', sequence: 0, style: { color: '#FFFFFF', size: 24, mode: 'scroll' } }])),
    reactions: Object.fromEntries(biliVideos.map(v => [v.id, { liked: false, favorite: false, coins: 0 }])),
    danmaku: [], receipts: {}, feedback: null, seek: { sequence: 0, position: 0 }, position: 0, duration: 0,
    capabilities: { canSend: true, canCoin: true, reason: '', sizes: [18,24,30], colors: ['#FFFFFF','#FF6699','#FFD166','#66CCFF','#8CE99A'], modes: ['scroll','top','bottom'] },
  };
}
export function currentBili(s: State) { return biliVideos[s.bilibili.index]; }
// A catalog addition must not replace existing drafts, reactions or receipts.
export function restoreBilibili(saved?:Partial<BilibiliState>):BilibiliState {
  const base=initialBilibili();
  const oldOrder=saved?.catalogRevision===2?['hover-drama','bunny-30s','hover-concert']:['hover-drama','hover-concert','bunny-30s'];
  const oldIndex=saved?.index??0;
  const index=saved?.catalogRevision===3?oldIndex:biliVideos.findIndex(v=>v.id===(oldOrder[oldIndex]==='hover-concert'?'yuyan-foretold':oldOrder[oldIndex]));
  return {...base,...saved,catalogRevision:3,index:Math.max(0,Math.min(biliVideos.length-1,index)),drafts:{...base.drafts,...saved?.drafts},reactions:{...base.reactions,...saved?.reactions}};
}
export function biliInteraction(s: State, c: Command): string | null | undefined {
  if (!c.type.startsWith('bili-')) return undefined;
  if(s.app !== 'bilibili') return '视频应用已切换';
  const b=s.bilibili, v=(c.value||{}) as Record<string,unknown>, video=currentBili(s);
  if(c.type==='bili-query') {
    const request=String(v.request||'');
    if(!request||request.length>128||!biliVideos.some(x=>x.id===v.video))return '请求标识无效';
    const result=b.receipts[request];
    if(result&&result.video!==v.video)return '请求与视频不匹配';
    // Seal absence on the authority before acknowledging reconciliation. Any delayed
    // copy of the old command now hits this receipt instead of applying a side effect.
    if(!result)b.receipts[request]={video:String(v.video),action:'bili-cancelled',message:'上次请求未执行',outcome:'cancelled'};
    b.feedback={id:c.id,message:b.receipts[request].message};return null;
  }
  // Persisted receipts prevent reapplying a logical request even after Store recreation.
  if(b.receipts[c.id]) return null;
  if(v.video!==video.id||v.epoch!==b.epoch) return '视频已变化，请重新选择目标';
  const d=b.drafts[video.id], reaction=b.reactions[video.id];
  const receipt=(message:string)=>{b.receipts[c.id]={video:video.id,action:c.type,message,outcome:'applied'};b.feedback={id:c.id,message};};
  switch(c.type) {
    case 'bili-focus': s.target={id:`bili:${video.id}`,app:'bilibili',kind:'text',label:video.title,revision:s.revision+1,value:d.text};return null;
    case 'bili-list': b.list=!b.list;return null;
    case 'bili-select': case 'bili-next': {
      const index=c.type==='bili-select'?Number(v.index):b.index+Number(v.delta);
      if(!Number.isInteger(index)||index<0||index>=biliVideos.length) return '已经到播放列表边界';
      if(c.type==='bili-next'&&v.delta!==1&&v.delta!==-1)return '切换方向无效';
      if(index===b.index){b.list=false;return null;}
      b.index=index;b.epoch++;b.list=false;b.position=0;b.duration=0;b.seek={sequence:b.seek.sequence+1,position:0};b.feedback=null;s.target=null;s.playing=false;return null;
    }
    case 'bili-reset-reactions':
      b.balance+=reaction.coins;reaction.liked=false;reaction.favorite=false;reaction.coins=0;receipt('当前视频互动已重置');return null;
    case 'bili-like': reaction.liked=!reaction.liked;receipt(reaction.liked?'已点赞':'已取消点赞');return null;
    case 'bili-favorite':reaction.favorite=!reaction.favorite;receipt(reaction.favorite?'已收藏':'已取消收藏');return null;
    case 'bili-coin':
      if(!b.capabilities.canCoin)return b.capabilities.reason||'当前视频暂不支持投币';
      if(b.balance<1)return '演示硬币余额不足';
      if(reaction.coins>=2)return '当前视频已达到演示投币上限';
      b.balance--;reaction.coins++;receipt('已为当前视频投 1 枚硬币');return null;
    case 'bili-play':
      s.playing=Boolean(v.playing);
      if(s.playing&&b.duration>0&&b.position>=b.duration){b.position=0;b.seek={sequence:b.seek.sequence+1,position:0};}
      return null;
    case 'bili-speed':
      if(![1,1.5,2].includes(Number(v.speed)))return '倍速不可用';
      b.speed=Number(v.speed);return null;
    case 'bili-volume':
      if(typeof v.volume!=='number'||!Number.isFinite(v.volume)||v.volume<0||v.volume>1)return '音量无效';
      b.volume=v.volume;b.muted=false;return null;
    case 'bili-mute':b.muted=Boolean(v.muted);return null;
    case 'bili-view':b.fullscreen=Boolean(v.fullscreen);b.list=false;return null;
    case 'bili-seek': {
      const position=Number(v.position);if(!Number.isFinite(position)||position<0||position>b.duration)return '播放位置无效';
      b.seek={sequence:b.seek.sequence+1,position};b.position=position;return null;
    }
    case 'bili-time': {
      const position=Number(v.position),duration=Number(v.duration);if(!Number.isFinite(position)||!Number.isFinite(duration)||duration<=0||position<0||position>duration+.1)return '播放时间无效';
      b.position=position;b.duration=duration;if(v.ended)s.playing=false;return null;
    }
    case 'bili-edit':case 'bili-send': {
      if(s.target?.id!==`bili:${video.id}`||c.targetId!==s.target.id||c.targetRevision!==s.target.revision)return '输入目标已变化，草稿已保留';
      if(v.revision!==d.revision)return '弹幕草稿已变化';
      const text=String(v.text??'');if(text.length>1000)return '弹幕内容过长';
      const style=(v.style||d.style) as DanmakuStyle;
      if(!/^#[0-9a-f]{6}$/i.test(style.color)||!b.capabilities.sizes.includes(style.size)||!b.capabilities.modes.includes(style.mode))return '弹幕样式不可用';
      if(c.type==='bili-edit') {
        const session=String(v.session||''),sequence=Number(v.sequence);
        if(!session||!Number.isInteger(sequence)||sequence<1||session===d.session&&sequence<=d.sequence)return '编辑顺序已过期';
        d.text=text;d.style={...style};d.revision++;d.session=session;d.sequence=sequence;s.target.value=text;s.switcher=null;return null;
      }
      if(!b.capabilities.canSend)return b.capabilities.reason||'当前视频暂不支持弹幕';
      if(!text.trim())return '请填写弹幕';
      b.danmaku.push({id:c.id,video:video.id,text,style:{...style},position:b.position,at:Date.now()});
      d.text='';d.style={...style};d.revision++;d.session='';d.sequence=0;s.target.value='';receipt('弹幕已发送');return null;
    }
    default:return '不支持的视频操作';
  }
}
