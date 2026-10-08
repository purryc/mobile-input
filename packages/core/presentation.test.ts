import {test} from 'node:test';import assert from 'node:assert/strict';
import {Store,initialState} from './model';import {migrateChat} from './migrate';import {salesMeeting} from './chat-scene';import {orientationPoint} from './orientation';
const c=(type:string,value?:unknown)=>({id:crypto.randomUUID(),type,value});
function finishRead(s:Store){const a=s.state.chat.activation!;a.startedAt=Date.now()-2500;s.dispatch(c('chat-read-stage',{epoch:a.epoch,phase:'scan'}));s.dispatch(c('chat-read-stage',{epoch:a.epoch,phase:'ready'}));}
test('chat migration backs up before reset, preserves other data and runs only once',()=>{const s=initialState();s.chat.sceneVersion=1;s.chat.messages['wx-boss']=[{id:'old',text:'previous',me:true}];s.chat.drafts['wx-boss'].text='draft';s.products[0].quantity=42;const backups:string[]=[];const next=migrateChat(s,(_,v)=>backups.push(v));assert.equal(backups.length,1);assert.match(backups[0],/draft/);assert.equal(next.chat.messages['wx-boss'].length,5);assert.match(next.chat.messages['wx-boss'].at(-1)!.text,/澄星设计/);assert.equal(next.products[0].quantity,42);assert.equal(next.chat.meeting.date,s.chat.meeting.date);assert.equal(next.chat.drafts['wx-boss'].text,'draft');assert.equal(migrateChat(next,()=>assert.fail()),next);assert.throws(()=>migrateChat(s,()=>{throw Error('full');}));assert.equal(s.chat.messages['wx-boss'][0].id,'old');});
test('sales fixture date is fixed in China time',()=>{assert.equal(salesMeeting(new Date('2026-10-08T19:00:00Z')).date,'2026-10-10');});
test('reply context preserves draft and rejects stale context before read completion',()=>{const s=new Store();s.dispatch(c('open','wechat'));assert.equal(s.state.chat.conversation,'wx-boss');s.state.chat.drafts['wx-boss'].text='草稿';const ctx=s.state.chat.context!;s.dispatch(c('chat-focus',{conversation:'wx-boss'}));assert.equal(s.dispatch(c('chat-reply',{conversation:'wx-boss',text:'old',messageId:ctx.messageId,contextEpoch:ctx.epoch})).ok,false);finishRead(s);const current=s.state.chat.context!;const reply=c('chat-reply',{conversation:'wx-boss',text:'收到',messageId:current.messageId,contextEpoch:current.epoch});assert.equal(s.dispatch(reply).ok,true);s.dispatch(reply);assert.equal(s.state.chat.messages['wx-boss'].length,6);assert.equal(s.state.chat.drafts['wx-boss'].text,'草稿');assert.equal(s.state.target?.kind,'text');});
test('presentation reopens editor page one and pauses clock, Back traverses editor and home',()=>{const s=new Store();s.dispatch(c('open','wps'));s.dispatch(c('present',true));s.dispatch(c('slide',3));s.state.presentation.runningSince=Date.now()-3000;s.dispatch(c('open','wechat'));assert.ok(s.state.presentation.elapsed>=3000);assert.equal(s.state.presentation.runningSince,0);s.dispatch(c('open','wps'));assert.equal(s.state.slide,0);assert.equal(s.state.presenting,false);assert.equal(s.state.presentation.elapsed,0);s.dispatch(c('present',true));s.dispatch(c('back'));assert.equal(s.state.presenting,false);s.dispatch(c('back'));assert.equal(s.state.app,'wps');s.dispatch(c('back'));assert.equal(s.state.app,'desktop');});
test('ink is page scoped; duplicate, reordered and late pointing commands cannot draw',()=>{const s=new Store();s.dispatch(c('open','wps'));s.dispatch(c('present',true));const value=(v:object)=>({session:s.state.presentation.session,slide:s.state.slide,...v});const run=(type:string,v:object)=>s.dispatch(c(type,value(v)));run('present-mode',{mode:'ink'});run('present-start',{gesture:'one'});run('present-draw',{gesture:'one',sequence:1,down:true});const point=c('present-point',value({gesture:'one',sequence:2,x:.3,y:.4}));assert.ok(s.dispatch(point).ok);s.dispatch(point);assert.equal(s.state.presentation.live?.points.length,2);assert.equal(run('present-point',{gesture:'one',sequence:1,x:.5,y:.6}).ok,false);s.dispatch(c('slide',1));assert.equal(s.state.presentation.ink['sample-slides:0'].length,1);assert.equal(s.state.presentation.ink['sample-slides:1'],undefined);assert.equal(s.dispatch({...point,id:'late'}).ok,false);run('present-start',{gesture:'two'});s.dispatch(c('release'));assert.equal(run('present-point',{gesture:'two',sequence:3,x:.2,y:.2}).ok,false);run('present-start',{gesture:'three'});s.dispatch(c('switch-step'));assert.equal(s.state.presentation.pointer.active,false);assert.equal(run('present-start',{gesture:'four'}).ok,false);});
test('calibrated quaternion maps center, opposite movement and rejects invalid sensor data',()=>{const base={x:0,y:0,z:0,w:1};assert.deepEqual(orientationPoint(base,base),{x:.5,y:.5});const q={x:0,y:0,z:Math.sin(.1),w:Math.cos(.1)};assert.ok(orientationPoint(base,q)!.x<.5);assert.deepEqual(orientationPoint(q,q),{x:.5,y:.5});assert.equal(orientationPoint(base,{...q,w:NaN}),null);});
test('duplicate composer focus does not invalidate an editing anchor',()=>{const s=new Store();s.dispatch(c('open','wechat'));s.dispatch(c('chat-focus',{conversation:'wx-boss'}));const t=s.state.target!,epoch=s.state.chat.context!.epoch;s.dispatch(c('chat-focus',{conversation:'wx-boss'}));assert.equal(s.state.target!.revision,t.revision);assert.equal(s.state.chat.context!.epoch,epoch);assert.ok(s.dispatch({...c('chat-edit',{conversation:'wx-boss',text:'可继续输入',revision:0,sequence:1,session:'phone'}),targetId:t.id,targetRevision:t.revision}).ok);});
test('background pauses presentation duration and foreground resumes once',()=>{const s=new Store();s.dispatch(c('open','wps'));s.dispatch(c('present',true));s.state.presentation.runningSince=Date.now()-2000;s.dispatch(c('presentation-active',false));const time=s.state.presentation.elapsed;assert.ok(time>=2000);assert.equal(s.state.presentation.runningSince,0);s.dispatch(c('presentation-active',false));assert.equal(s.state.presentation.elapsed,time);s.dispatch(c('presentation-active',true));assert.ok(s.state.presentation.runningSince>0);});

test('only composer starts reading; phases reject early, stale and disconnected completions',()=>{
 const s=new Store();s.dispatch(c('open','wechat'));assert.equal(s.state.chat.activation,null);
 s.dispatch(c('chat-focus',{conversation:'wx-boss',messageId:'boss-smalltalk-1'}));assert.equal(s.state.chat.activation,null);
 s.dispatch(c('chat-focus',{conversation:'wx-boss'}));const a=s.state.chat.activation!;assert.equal(a.messageId,'boss-sales-meeting-v2');
 assert.equal(s.dispatch(c('chat-read-stage',{epoch:a.epoch,phase:'ready'})).ok,false);
 s.state.chat.activation!.startedAt=Date.now()-500;
 assert.ok(s.dispatch(c('chat-read-stage',{epoch:a.epoch,phase:'scan'})).ok);
 assert.equal(s.dispatch(c('chat-read-stage',{epoch:a.epoch,phase:'ready'})).ok,false);
 s.state.chat.activation!.startedAt=Date.now()-2000;
 assert.equal(s.dispatch(c('chat-read-stage',{epoch:a.epoch,phase:'ready'})).ok,false);
 s.state.chat.activation!.startedAt=Date.now()-2500;
 const done=c('chat-read-stage',{epoch:a.epoch,phase:'ready'});assert.ok(s.dispatch(done).ok);s.dispatch(done);assert.equal(s.state.chat.activation!.phase,'ready');
 s.dispatch(c('release'));assert.equal(s.state.chat.activation,null);assert.equal(s.dispatch({...done,id:'late'}).ok,false);
 s.dispatch(c('chat-focus',{conversation:'wx-boss'}));assert.notEqual(s.state.chat.activation!.epoch,a.epoch);
 s.dispatch(c('chat-open','wx-daily'));assert.equal(s.state.chat.activation,null);
});


test('captions persist across slides but reject reordered, stopped and former-session speech',()=>{
 const store=new Store();store.dispatch(c('open','wps'));store.dispatch(c('present',true));const session=store.state.presentation.session;
 const run=(type:string,value:object)=>store.dispatch(c(type,{session,...value}));
 assert.ok(run('present-captions',{enabled:true,id:'capture'}).ok);
 const update={id:'capture',sequence:2,status:'partial',text:'真实事件测试'};
 assert.ok(run('present-caption-update',update).ok);assert.equal(run('present-caption-update',{...update,sequence:1}).ok,false);
 store.dispatch(c('slide',1));assert.equal(store.state.presentation.captions.text,update.text);
 run('present-captions',{enabled:false,id:'capture'});assert.equal(run('present-caption-update',{...update,sequence:3}).ok,false);
 run('present-captions',{enabled:true,id:'new'});store.dispatch(c('switch-step'));assert.equal(store.state.presentation.captions.enabled,false);
 store.dispatch(c('switch-cancel'));store.dispatch(c('present',false));store.dispatch(c('present',true));assert.equal(run('present-captions',{enabled:true,id:'late'}).ok,false);
});
test('volume mute preserves level and brush accepts only integers from one to twelve',()=>{
 const store=new Store();store.dispatch(c('open','wps'));store.dispatch(c('present',true));const run=(type:string,value:object)=>store.dispatch(c(type,{session:store.state.presentation.session,slide:store.state.slide,...value}));
 assert.ok(run('present-volume',{level:25,muted:true}).ok);assert.equal(store.state.presentation.volume.level,25);assert.equal(run('present-volume',{level:101,muted:false}).ok,false);
 for(const size of [1,6,12])assert.ok(run('present-style',{size,color:'#19995b'}).ok);
 for(const size of [0,13,2.5])assert.equal(run('present-style',{size,color:'#19995b'}).ok,false);
});

 test('screen-up ray maps clockwise right, nose-up upward at 130 percent gain and ignores roll',()=>{
 const base={x:0,y:0,z:0,w:1},angle=.12;
 const right=orientationPoint(base,{x:0,y:0,z:-Math.sin(angle/2),w:Math.cos(angle/2)})!;
 const up=orientationPoint(base,{x:Math.sin(angle/2),y:0,z:0,w:Math.cos(angle/2)})!;
 assert.ok(right.x>.5);assert.ok(up.y<.5);assert.ok(Math.abs((right.x-.5)/(angle/(Math.PI/3))-1.3)<1e-10);
 assert.deepEqual(orientationPoint(base,{x:0,y:Math.sin(.2),z:0,w:Math.cos(.2)}),{x:.5,y:.5});
 const neutral={x:0,y:0,z:Math.sin(.4),w:Math.cos(.4)};
 assert.deepEqual(orientationPoint(neutral,neutral),{x:.5,y:.5});
 });
 test('hover never draws; ordered press/release creates separate strokes without recentering',()=>{
 const s=new Store();s.dispatch(c('open','wps'));s.dispatch(c('present',true));const run=(type:string,v:object)=>s.dispatch(c(type,{session:s.state.presentation.session,slide:s.state.slide,...v}));
 run('present-mode',{mode:'ink'});run('present-start',{gesture:'hover'});run('present-point',{gesture:'hover',sequence:1,x:.8,y:.2});assert.equal(Boolean(s.state.presentation.live),false);
 run('present-draw',{gesture:'hover',sequence:1,down:true});assert.deepEqual(s.state.presentation.live?.points,[[.8,.2]]);
 run('present-point',{gesture:'hover',sequence:2,x:.7,y:.3});run('present-draw',{gesture:'hover',sequence:2,down:false});assert.equal(s.state.presentation.pointer.active,true);assert.equal(Boolean(s.state.presentation.live),false);
 assert.equal(run('present-draw',{gesture:'hover',sequence:1,down:true}).ok,false);
 run('present-point',{gesture:'hover',sequence:3,x:.6,y:.4});run('present-draw',{gesture:'hover',sequence:3,down:true});assert.deepEqual(s.state.presentation.live?.points,[[.6,.4]]);run('present-draw',{gesture:'hover',sequence:4,down:false});assert.equal(s.state.presentation.ink['sample-slides:0'].length,2);
 s.dispatch(c('slide',1));assert.equal(run('present-draw',{gesture:'hover',sequence:5,down:true}).ok,false);
 });
