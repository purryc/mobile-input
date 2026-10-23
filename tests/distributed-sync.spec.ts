import {test,expect} from '@playwright/test';
import {initialState,type State} from '../packages/core/model';
const stamp=(s:State)=>JSON.stringify([s.startedAt,s.revision,s.app,s.target?.id||'',s.target?.revision||0]);
async function setup(page:any){
 await page.addInitScript(()=>{const w=window as any;w.__out=[];w.MobileNative={role:()=> 'phone',transportMode:()=> 'distributed',distributedStatus:()=>JSON.stringify({phase:'connected',devices:[]}),send:(text:string)=>{const packet=JSON.parse(text);w.__out.push(packet);if(packet.kind==='command'&&packet.command.type.startsWith('input-session-'))queueMicrotask(()=>window.dispatchEvent(new CustomEvent('native-message',{detail:{kind:'ack',ack:{id:packet.command.id,ok:true,revision:0}}})));return 'sent';},layoutInsets:()=> 'requested'};});
 await page.setViewportSize({width:390,height:844});await page.goto('/?role=phone');await page.getByRole('button',{name:'关闭连接设置'}).click();
}
async function emit(page:any,type:string,detail:any){await page.evaluate(({type,detail}:any)=>window.dispatchEvent(new CustomEvent(type,{detail})),{type,detail});}
async function last(page:any,kind:string){return page.evaluate((k:string)=>(window as any).__out.filter((v:any)=>v.kind===k).at(-1),kind);}
test('distributed authority probe repairs lost mail-to-WorkBuddy update, ignores stale sync replies, and blocks old controls',async({page})=>{
 await setup(page);await emit(page,'native-status',{type:'connected',transport:'distributed'});
 await expect(page.getByLabel('正在同步大屏',{exact:true})).toBeVisible();
 const mail=initialState();mail.app='mail';mail.startedAt=77;mail.revision=9;
 const first=await last(page,'sync');await emit(page,'native-message',{kind:'snapshot',state:mail,syncId:first.syncId});
 await expect(page.getByLabel('正在同步大屏',{exact:true})).toHaveCount(0);
 // Drop the final app-change delta entirely; no further user input should be needed.
 const wb=structuredClone(mail);wb.app='workbuddy';wb.revision=10;
 await expect.poll(async()=>!!await last(page,'state-probe')).toBeTruthy();const probe=await last(page,'state-probe');
 await emit(page,'native-message',{kind:'state-stamp',probeId:probe.probeId,session:77,base:10,stamp:stamp(wb)});
 await expect(page.getByLabel('正在同步大屏',{exact:true})).toBeVisible();const repair=await last(page,'sync');expect(repair.syncId).not.toBe(first.syncId);
 await emit(page,'native-message',{kind:'snapshot',state:mail,syncId:first.syncId});await expect(page.getByLabel('正在同步大屏',{exact:true})).toBeVisible();
 await emit(page,'native-message',{kind:'snapshot',state:wb,syncId:repair.syncId});await expect(page.getByLabel('正在同步大屏',{exact:true})).toHaveCount(0);expect(await page.evaluate(async()=>{const r=await import(performance.getEntriesByType('resource').find(e=>/\/src\/runtime\.ts(?:\?|$)/.test(e.name))!.name);return r.currentState().app;})).toBe('workbuddy');await expect(page.getByLabel('手机待机桌面')).toBeVisible();
 const out=await page.evaluate(()=>(window as any).__out);expect(out.filter((v:any)=>v.kind==='command'&&!v.command.type.startsWith('input-session-'))).toHaveLength(0);
});
test('foreground rechecks authority, old probes cannot roll back a newer state and duplicate deltas do not flood resync',async({page})=>{
 await setup(page);await emit(page,'native-status',{type:'connected',transport:'distributed'});const state=initialState();state.app='workbuddy';state.startedAt=88;state.revision=20;
 await emit(page,'native-message',{kind:'snapshot',syncId:(await last(page,'sync')).syncId,state});
 await expect.poll(async()=>!!await last(page,'state-probe')).toBeTruthy();const probe=await last(page,'state-probe');
 const old={...state,revision:19,app:'mail'} as State;await emit(page,'native-message',{kind:'state-stamp',probeId:probe.probeId,session:88,base:19,stamp:stamp(old)});await expect(page.getByLabel('正在同步大屏',{exact:true})).toHaveCount(0);
 await emit(page,'native-foreground',true);await expect(page.getByLabel('正在同步大屏',{exact:true})).toBeVisible();const sync=await last(page,'sync');
 for(let i=0;i<3;i++)await emit(page,'native-message',{kind:'snapshot-delta',base:0,session:88,delta:[]});expect((await last(page,'sync')).syncId).toBe(sync.syncId);
 // A newly requested authority can restore a lower revision after a tablet restart.
 await emit(page,'native-message',{kind:'snapshot',syncId:sync.syncId,state:{...state,revision:2}});await expect(page.getByLabel('正在同步大屏',{exact:true})).toHaveCount(0);
 await emit(page,'native-status',{type:'disconnected',transport:'distributed'});await emit(page,'native-message',{kind:'snapshot',state:old,syncId:sync.syncId});await expect(page.locator('main')).not.toContainText('邮件');
});
test('in-flight capture retains its panel while image transfer exceeds normal probe timeout',async({page})=>{
 await page.clock.install();await setup(page);await emit(page,'native-status',{type:'connected',transport:'distributed'});
 const state=initialState();state.app='bilibili';state.startedAt=99;state.revision=30;state.capture={id:'slow-capture',kind:'screenshot',app:'bilibili',source:'平板 · 哔哩哔哩应用窗口',task:'new',target:'',targetRevision:0,phase:'requested',at:Date.now()};
 const sync=await last(page,'sync');await emit(page,'native-message',{kind:'snapshot',state,syncId:sync.syncId});
 await page.clock.fastForward(8500);expect((await last(page,'sync')).syncId).toBe(sync.syncId);await expect(page.getByLabel('正在同步大屏',{exact:true})).toHaveCount(0);
 const ready=structuredClone(state);ready.revision++;ready.capture!.phase='preview';ready.capture!.data='data:image/jpeg;base64,AAAA';ready.capture!.width=960;ready.capture!.height=596;
 await emit(page,'native-message',{kind:'snapshot',state:ready});await page.clock.fastForward(1000);expect((await last(page,'sync')).syncId).toBe(sync.syncId);
 await emit(page,'native-status',{type:'disconnected',transport:'distributed'});await page.getByRole('button',{name:'连接设置',exact:true}).click();await expect(page.getByRole('dialog',{name:'设备连接'})).toContainText(/连接已断开/);
});
