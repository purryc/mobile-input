import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Store,initialState,type Command} from './model';
import {biliVideos,currentBili,restoreBilibili} from './bilibili';
function fixture(){const store=new Store(initialState());let id=0;const send=(type:string,value:unknown={},extra:Partial<Command>={})=>store.dispatch({id:String(++id),type,value,app:store.state.app,...extra});send('open','bilibili');const payload=()=>({video:currentBili(store.state).id,epoch:store.state.bilibili.epoch});return {store,send,payload};}
test('Bilibili list preserves boundaries and rejects stale video actions',()=>{const {store,send,payload}=fixture();const old=payload();assert.equal(send('bili-next',{...old,delta:-1}).ok,false);assert.equal(store.state.bilibili.index,0);assert.equal(send('bili-next',{...old,delta:1}).ok,true);assert.equal(send('bili-coin',old).ok,false);while(store.state.bilibili.index<biliVideos.length-1)assert.equal(send('bili-next',{...payload(),delta:1}).ok,true);assert.equal(send('bili-next',{...payload(),delta:1}).ok,false);assert.equal(store.state.bilibili.index,biliVideos.length-1);});
test('Bilibili coins deduplicate after restart and enforce local balance/limit',()=>{const {store,send,payload}=fixture();const cmd:Command={id:'coin-1',type:'bili-coin',app:'bilibili',value:payload()};assert.equal(store.dispatch(cmd).ok,true);assert.equal(store.dispatch(cmd).ok,true);assert.equal(store.state.bilibili.balance,5);const restored=new Store(structuredClone(store.state));assert.equal(restored.dispatch(cmd).ok,true);assert.equal(restored.state.bilibili.balance,5);assert.equal(send('bili-coin',payload()).ok,true);assert.equal(send('bili-coin',payload()).ok,false);assert.equal(store.state.bilibili.balance,4);});
test('Bilibili atomic danmaku keeps content color independent, order and target protection',()=>{const {store,send,payload}=fixture();send('bili-focus',payload());const t=store.state.target!,anchor={targetId:t.id,targetRevision:t.revision};const video=currentBili(store.state).id;const style={color:'#FFFFFF',size:24,mode:'top'};assert.equal(send('bili-edit',{...payload(),text:'清楚👨‍👩‍👧',style,revision:0,session:'phone',sequence:2},anchor).ok,true);assert.equal(send('bili-edit',{...payload(),text:'旧草稿',revision:1,session:'phone',sequence:1},anchor).ok,false);assert.equal(send('bili-send',{...payload(),text:'完整的新文本',style,revision:1},anchor).ok,true);assert.equal(store.state.bilibili.danmaku[0].text,'完整的新文本');assert.equal(store.state.bilibili.danmaku[0].style.color,'#FFFFFF');assert.equal(store.state.bilibili.drafts[video].text,'');assert.equal(send('bili-send',{...payload(),text:'重复',style,revision:1},anchor).ok,false);});
test('Bilibili denied sending retains draft and switching retains per-video drafts',()=>{const {store,send,payload}=fixture();send('bili-focus',payload());const t=store.state.target!,anchor={targetId:t.id,targetRevision:t.revision};const video=currentBili(store.state).id;send('bili-edit',{...payload(),text:'保留',revision:0,session:'phone',sequence:1},anchor);store.state.bilibili.capabilities.canSend=false;assert.equal(send('bili-send',{...payload(),text:'保留',revision:1},anchor).ok,false);assert.equal(store.state.bilibili.drafts[video].text,'保留');send('bili-next',{...payload(),delta:1});assert.equal(store.state.bilibili.drafts[video].text,'保留');assert.equal(store.state.target,null);});

test('Bilibili reconciliation seals absent requests against late delivery and survives restart',()=>{
 const {store,send,payload}=fixture();const original=payload();
 assert.equal(send('bili-query',{...original,request:'lost-coin'}).ok,true);
 assert.equal(store.state.bilibili.receipts['lost-coin'].outcome,'cancelled');
 const restored=new Store(structuredClone(store.state));
 assert.equal(restored.dispatch({id:'lost-coin',type:'bili-coin',app:'bilibili',value:original}).ok,true);
 assert.equal(restored.state.bilibili.balance,6);
 assert.equal(store.dispatch({id:'accepted-coin',type:'bili-coin',app:'bilibili',value:original}).ok,true);
 send('bili-next',{...original,delta:1});
 assert.equal(send('bili-query',{video:original.video,request:'accepted-coin'}).ok,true);
 assert.equal(store.state.bilibili.receipts['accepted-coin'].outcome,'applied');
 assert.equal(store.state.bilibili.balance,5);
 assert.equal(send('bili-query',{video:payload().video,request:'accepted-coin'}).ok,false);
});

test('playback parameters are validated, survive video switches and reject stale targets',()=>{
 const {store,send,payload}=fixture();const original=payload();
 assert.equal(send('bili-speed',{...payload(),speed:1.5}).ok,true);
 assert.equal(send('bili-volume',{...payload(),volume:.37}).ok,true);
 assert.equal(send('bili-mute',{...payload(),muted:true}).ok,true);
 assert.equal(store.state.bilibili.volume,.37);assert.equal(store.state.bilibili.muted,true);
 assert.equal(send('bili-volume',{...payload(),volume:2}).ok,false);
 assert.equal(send('bili-speed',{...payload(),speed:99}).ok,false);
 assert.equal(send('bili-next',{...payload(),delta:1}).ok,true);
 assert.equal(store.state.bilibili.speed,1.5);assert.equal(store.state.bilibili.volume,.37);
 assert.equal(send('bili-volume',{...original,volume:.1}).ok,false);
 assert.equal(send('bili-volume',{...payload(),volume:.63}).ok,true);assert.equal(store.state.bilibili.muted,false);
 send('bili-view',{...payload(),fullscreen:true});assert.equal(store.state.bilibili.fullscreen,true);
 send('back');assert.equal(store.state.app,'bilibili');assert.equal(store.state.bilibili.fullscreen,false);
 send('bili-time',{...payload(),position:5,duration:5,ended:true});send('bili-play',{...payload(),playing:true});
 assert.equal(store.state.bilibili.position,0);assert.equal(store.state.playing,true);
});

test('adding the longer video preserves old catalog drafts and receipts',()=>{
 const before=fixture().store.state.bilibili;
 before.drafts['hover-drama'].text='原视频尚未发送的弹幕';
 before.reactions['hover-drama'].coins=1;before.balance=5;
 before.receipts['existing-coin']={video:'hover-drama',action:'bili-coin',message:'已投币',outcome:'applied'};
 delete before.drafts['bunny-30s'];delete before.reactions['bunny-30s'];
 const restored=restoreBilibili(before);
 assert.equal(restored.drafts['hover-drama'].text,'原视频尚未发送的弹幕');
 assert.equal(restored.reactions['hover-drama'].coins,1);assert.equal(restored.balance,5);
 assert.deepEqual(restored.receipts,before.receipts);
 assert.equal(restored.drafts['bunny-30s'].text,'');assert.equal(restored.reactions['bunny-30s'].coins,0);
 assert.equal(before.drafts['bunny-30s'],undefined);
});


test('reordered catalog keeps the active video identity and each original draft',()=>{
 for(const [oldIndex,newIndex] of [[0,0],[1,2],[2,1]]){
  const saved=fixture().store.state.bilibili;delete saved.catalogRevision;saved.index=oldIndex;
  saved.drafts['hover-concert']={...saved.drafts['yuyan-foretold'],text:'保留喻言弹幕'};saved.reactions['hover-concert']={liked:false,favorite:true,coins:1};
  const restored=restoreBilibili(saved);
  assert.equal(restored.catalogRevision,3);assert.equal(restored.index,newIndex);assert.equal(restored.drafts['hover-concert'].text,'保留喻言弹幕');assert.equal(restored.reactions['hover-concert'].favorite,true);
  assert.equal(restoreBilibili(restored).index,newIndex);assert.equal(restored.drafts['yuyan-foretold'].text,'');assert.equal(restored.reactions['yuyan-foretold'].coins,0);
 }
});


test('selecting the current video preserves metadata and draft target',()=>{
 const {store,send,payload}=fixture();send('bili-time',{...payload(),position:2,duration:5});
 const epoch=store.state.bilibili.epoch;send('bili-select',{...payload(),index:0});
 assert.equal(store.state.bilibili.duration,5);assert.equal(store.state.bilibili.position,2);assert.equal(store.state.bilibili.epoch,epoch);
});


test('reset current interactions refunds only local coins and keeps accepted receipts sealed',()=>{
 const {store,send,payload}=fixture();const c:Command={id:'coin-demo',type:'bili-coin',app:'bilibili',value:payload()};store.dispatch(c);
 store.state.bilibili.drafts['hover-drama'].text='保留草稿';send('bili-like',payload());send('bili-favorite',payload());send('bili-reset-reactions',payload());
 assert.equal(store.state.bilibili.balance,6);assert.deepEqual(store.state.bilibili.reactions['hover-drama'],{liked:false,favorite:false,coins:0});
 assert.equal(store.state.bilibili.drafts['hover-drama'].text,'保留草稿');assert.equal(store.dispatch(c).ok,true);assert.equal(store.state.bilibili.balance,6);
});
