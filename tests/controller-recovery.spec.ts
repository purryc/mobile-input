import {test,expect,type Page} from '@playwright/test';
async function pair(tablet:Page,phone:Page){
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:/扫码网络建联/}).check();const pin=(await tablet.locator('.pair-code').innerText()).trim();await phone.goto('/?role=phone&bridge=5191');await phone.getByRole('radio',{name:/扫码网络建联/}).check();await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await tablet.getByRole('button',{name:'关闭连接设置'}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);
}
async function cmd(page:Page,type:string,value?:unknown){return page.evaluate(async({type,value})=>{const {command}=await import('/src/runtime.ts' as string);return command(type,value);},{type,value});}
test('WeChat always has context; read completion gates recommendations, not the whole controller',async({browser})=>{
 const tc=await browser.newContext(),pc=await browser.newContext({viewport:{width:390,height:844}}),tablet=await tc.newPage(),phone=await pc.newPage();const errors:string[]=[];phone.on('pageerror',e=>errors.push(e.message));await pair(tablet,phone);
 await cmd(tablet,'open','wechat');await expect(phone.locator('.wechat-phone')).toBeVisible();await expect(phone.locator('.glass-context h1')).toContainText('陈总');await expect(phone.locator('.related-actions button')).toHaveCount(0);await expect(phone.getByRole('button',{name:'输入回复',exact:true})).toBeVisible();
 await phone.getByRole('button',{name:'输入回复',exact:true}).click();await expect(phone.getByLabel('手机输入草稿')).toBeVisible();await expect(phone.locator('.related-actions button')).toHaveCount(3);await phone.getByLabel('手机输入草稿').fill('明天见，材料会提前准备。');await expect(tablet.getByLabel('微信回复输入框')).toHaveValue('明天见，材料会提前准备。');
 await phone.screenshot({path:'artifacts/controller-recovery/wechat-ready.png'});await cmd(tablet,'open','workbuddy');await cmd(tablet,'open','wechat');await expect(phone.locator('.glass-context h1')).toContainText('陈总');expect(errors).toEqual([]);await pc.close();await tc.close();
});
test('Codex textarea fills Composer and remains scrollable with the dock open or closed',async({page})=>{
 const base={device:'测试 Mac',permission:true,app:'codex',windowTitle:'独立测试输入',window:'test-window',target:'test-field',text:'虚构内容\n'.repeat(30),editable:true,textKnown:true,selection:[0,0],capabilities:['replace-text','insert-text','pointer']};
 await page.routeWebSocket('ws://127.0.0.1:39872/control',socket=>socket.onMessage(raw=>{const m=JSON.parse(String(raw));if(m.kind==='pair'){socket.send(JSON.stringify({kind:'connected',session:'test-session'}));socket.send(JSON.stringify({kind:'state',session:'test-session',state:base}));}if(m.kind==='command')socket.send(JSON.stringify({kind:'ack',id:m.id,session:'test-session',ok:true,outcome:'verified',state:{...base,text:m.text||base.text}}));}));
 await page.setViewportSize({width:390,height:844});await page.goto('/?role=phone&bridge=5191');await page.getByRole('radio',{name:'Mac 应用'}).check();await page.getByLabel('Mac 地址',{exact:true}).fill('127.0.0.1');await page.getByLabel('Mac 配对码',{exact:true}).fill('123456');await page.getByRole('button',{name:'连接 Mac',exact:true}).click();
 for(const height of [844,700]){await page.setViewportSize({width:390,height});for(const mode of ['触控板','键盘','收起输入面板']){
  if(mode==='收起输入面板'){const selected=page.locator('.input-mode-key[aria-pressed=true]');if(await selected.count())await selected.click();}else{const button=page.getByRole('button',{name:mode,exact:true});if(await button.getAttribute('aria-pressed')!=='true')await button.click();}await expect(page.locator(mode==='键盘'?'.input-keyboard':'.input-trackpad')).toHaveCount(mode==='收起输入面板'?0:1);
  const area=page.getByLabel('Mac 输入',{exact:true}),bounds=await area.boundingBox(),scroll=await page.locator('.mac-composer>.live-wb-scroll').boundingBox();expect(bounds!.height).toBeGreaterThan(80);expect(Math.abs(bounds!.height-scroll!.height)).toBeLessThan(2);
  await area.evaluate(el=>{el.scrollTop=el.scrollHeight;});expect(await area.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);const voice=(await page.getByRole('button',{name:'智慧语音',exact:true}).boundingBox())!;expect(voice.y+voice.height).toBeLessThanOrEqual(height+1);
  await page.screenshot({path:`artifacts/controller-recovery/codex-${height}-${mode}.png`});
 }}
});
test('foreground restores the input session and unknown submission reconciliation never resends',async({browser})=>{
 const tc=await browser.newContext(),pc=await browser.newContext({viewport:{width:390,height:700}}),tablet=await tc.newPage(),phone=await pc.newPage();await pair(tablet,phone);await cmd(tablet,'open','workbuddy');await tablet.locator('.deck-composer textarea').click();const field=phone.getByLabel('手机 WorkBuddy 草稿');await field.fill('灰色背景，红色主题，介绍虚构产品。');
 await expect(tablet.locator('.deck-composer textarea')).toHaveValue(/虚构产品/);
 await phone.evaluate(()=>window.dispatchEvent(new CustomEvent('native-foreground',{detail:false})));await expect(phone.locator('.session-paused')).toBeVisible();
 await phone.evaluate(()=>window.dispatchEvent(new CustomEvent('native-foreground',{detail:true})));await expect(phone.locator('.session-paused')).toHaveCount(0);await expect(field).toHaveAttribute('data-value',/虚构产品/);await expect(phone.getByRole('button',{name:/^发送(?:任务|生成网页演示)$/})).toBeEnabled();
 await phone.evaluate(async()=>{const {currentState}=await import('/src/runtime.ts' as string);const {deckStageKey,updateDeckStage}=await import('/src/web-deck-staging.ts' as string);const s=currentState(),id=s.workbuddy.task;await updateDeckStage(deckStageKey(id,s.workbuddy.drafts[id].owner||''),(v:any)=>({...v,submission:'never-arrived-test'}));});
 await expect(phone.getByRole('alert')).toContainText('平板未接收');await expect(phone.getByRole('button',{name:/^发送(?:任务|生成网页演示)$/})).toBeEnabled();
 expect(await tablet.evaluate(async()=>{const {currentState}=await import('/src/runtime.ts' as string);return currentState().workbuddy.tasks.some((t:any)=>t.deckJob?.request);})).toBe(false);
 await pc.close();await tc.close();
});

test('native transport refusal returns immediately and retains the draft instead of waiting for a receipt',async({browser})=>{
 const tc=await browser.newContext(),pc=await browser.newContext({viewport:{width:390,height:700}}),tablet=await tc.newPage(),phone=await pc.newPage();await pair(tablet,phone);await cmd(tablet,'open','workbuddy');await tablet.locator('.deck-composer textarea').click();await phone.getByLabel('手机 WorkBuddy 草稿').fill('这条虚构需求必须保留');await expect(tablet.locator('.deck-composer textarea')).toHaveValue('这条虚构需求必须保留');
 const result=await phone.evaluate(async()=>{const {command}=await import('/src/runtime.ts' as string);(window as any).MobileNative={send:()=> 'disconnected',connect:()=> 'unavailable'};const start=performance.now(),ack=await command('wb-deck-start',{});return {ack,ms:performance.now()-start};});
 expect(result.ack.ok).toBe(false);expect(result.ack.error).toContain('发送通道不可用');expect(result.ms).toBeLessThan(1000);await expect(tablet.locator('.deck-composer textarea')).toHaveValue('这条虚构需求必须保留');await pc.close();await tc.close();
});

test('distributed camera return retains the mounted controller while authority refreshes, without a false disconnect',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{(window as any).MobileNative={role:()=> 'phone',transportMode:()=> 'distributed',distributedStatus:()=>JSON.stringify({phase:'connected',message:'已连接',devices:[],peer:'测试平板'}),send:(raw:string)=>{(window as any).wire(raw);return 'sent';},cancelRecognition:()=> 'cancelled',layoutInsets:()=> '',aiControl:()=> '',inputTheme:()=> '',deckControl:()=> '',discover:()=> ''};});
 await page.goto('/?role=phone&bridge=5191');
 await page.evaluate(async()=>{
  const {Store,initialState}=await import('/@fs/Users/hmi/Documents/mobile input agent/packages/core/model.ts' as string);const authority=new Store(initialState());authority.dispatch({id:'open-test',type:'open',value:'workbuddy'});
  const w=window as any;w.holdSync=false;w.sent=[];const emit=(detail:any)=>window.dispatchEvent(new CustomEvent('native-message',{detail}));
  w.releaseSync=()=>{const id=w.syncId;w.syncId='';emit({kind:'snapshot',state:structuredClone(authority.state),syncId:id});};
  w.wire=(raw:string)=>{const m=JSON.parse(raw);w.sent.push(m);if(m.kind==='sync'){w.syncId=m.syncId;if(!w.holdSync)queueMicrotask(w.releaseSync);}else if(m.kind==='command'){const ack=authority.dispatch(m.command);queueMicrotask(()=>{emit({kind:'snapshot',state:structuredClone(authority.state)});emit({kind:'ack',ack});});}};
  window.dispatchEvent(new CustomEvent('native-status',{detail:{type:'connected',transport:'distributed'}}));
 });
 const field=page.getByLabel('手机 WorkBuddy 草稿');await expect(field).toBeVisible();await field.fill('拍照返回后保留原任务和灰色背景');
 await expect.poll(()=>page.evaluate(()=> (window as any).sent.filter((m:any)=>m.kind==='command'&&m.command.type==='wb-edit').length)).toBeGreaterThan(0);
 await field.evaluate(el=>(el as any).__mountMarker='same-editor');
 await page.evaluate(()=>{(window as any).holdSync=true;window.dispatchEvent(new CustomEvent('native-foreground',{detail:false}));});
 await expect(page.locator('.session-paused')).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('native-foreground',{detail:true})));
 await expect(page.locator('.phone-state-refresh')).toBeVisible();await expect(field).toBeVisible();await expect(page.locator('[data-controller-syncing=true]')).toHaveAttribute('inert','');
 await page.waitForTimeout(1400); // Longer than the connection error grace period.
 await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('alertdialog')).toHaveCount(0);expect(await field.evaluate(el=>(el as any).__mountMarker)).toBe('same-editor');
 const guarded=await page.evaluate(async()=>{const {command}=await import('/src/runtime.ts' as string);return command('wb-deck-start',{});});expect(guarded.ok).toBe(false);
 await page.screenshot({path:'artifacts/controller-recovery/camera-authority-refresh.png'});
 await page.evaluate(()=>{(window as any).holdSync=false;(window as any).releaseSync();});
 await expect(page.locator('.phone-state-refresh')).toHaveCount(0);await expect(page.locator('.session-paused')).toHaveCount(0);await expect(field).toHaveAttribute('data-value','拍照返回后保留原任务和灰色背景');expect(await field.evaluate(el=>(el as any).__mountMarker)).toBe('same-editor');
 expect(await page.evaluate(()=> (window as any).sent.some((m:any)=>m.kind==='command'&&m.command.type==='wb-deck-start'))).toBe(false);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('native-status',{detail:{type:'disconnected',transport:'distributed'}})));
 await expect(page.getByRole('alertdialog',{name:'连接已中断'})).toBeVisible();expect(errors).toEqual([]);
});
