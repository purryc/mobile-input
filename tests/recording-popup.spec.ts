import {test,expect} from '@playwright/test';
for(const height of [844,700])test(`voice key has fixed label, toggle and hold without a status popup at 390x${height}`,async({browser})=>{
 const context=await browser.newContext(),tablet=await context.newPage(),phone=await context.newPage();
 await phone.setViewportSize({width:390,height});
 await phone.addInitScript(()=>{const Original=window.WebSocket;window.WebSocket=class extends Original{constructor(url:string,protocols?:string|string[]){super(url,protocols);(window as any).__voiceSocket=this;}};});
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();const pin=await tablet.locator('.pair-code').innerText();await tablet.getByRole('button',{name:'关闭连接设置'}).click();
 await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);
 await tablet.locator('.demo-apps').getByRole('button',{name:'WorkBuddy',exact:true}).click();await tablet.getByLabel('WorkBuddy 任务输入').click();await phone.getByRole('button',{name:'开始使用',exact:true}).click();
 const draft=phone.getByLabel('手机 WorkBuddy 草稿'),voice=phone.locator('.input-voice'),popup=phone.getByRole('dialog',{name:'语音录制'});
 await draft.fill('保留原草稿😀');await expect(tablet.getByLabel('WorkBuddy 任务输入')).toHaveValue('保留原草稿😀');
 // Native adapter events only: this verifies UI/lifecycle, not actual ASR.
 await phone.evaluate(()=>{const w=window as any;w.voiceCalls=[];w.MobileNative={
  send:(raw:string)=>{w.__voiceSocket.send(raw);return 'sent';},
  startRecognition:(id:string)=>{w.voiceSession=id;w.voiceCalls.push('start');},
  stopRecognition:()=>w.voiceCalls.push('stop'),
  cancelRecognition:(id:string)=>{w.voiceCalls.push('cancel');window.dispatchEvent(new CustomEvent('native-speech',{detail:{sessionId:id,type:'complete',text:'不得进入的晚到结果'}}));}
 };});
 for(const mode of ['minimized','键盘','触控板']){
  if(mode!=='minimized')await phone.getByRole('button',{name:mode,exact:true}).click();
  const before=(await voice.boundingBox())!;
  await voice.click();await expect(voice).toHaveAttribute('aria-pressed','true');
  await phone.evaluate(()=>{const id=(window as any).voiceSession;window.dispatchEvent(new CustomEvent('native-speech',{detail:{sessionId:id,type:'start'}}));});
  await expect(voice).toHaveText('智慧语音');await expect(popup).toHaveCount(0);
  await expect(phone.getByRole('button',{name:'取消录音'})).toHaveCount(0);
  await expect(phone.getByText(/正在聆听|正在识别|正在启动录音/)).toHaveCount(0);
  expect(await voice.boundingBox()).toEqual(before);
  const stops=await phone.evaluate(()=>(window as any).voiceCalls.filter((x:string)=>x==='stop').length);
  await voice.click();await expect(voice).toHaveAttribute('aria-pressed','false');await expect(voice).toHaveText('智慧语音');
  expect(await phone.evaluate(()=>(window as any).voiceCalls.filter((x:string)=>x==='stop').length)).toBe(stops+1);
  await phone.evaluate(()=>window.dispatchEvent(new CustomEvent('native-speech',{detail:{sessionId:(window as any).voiceSession,type:'complete',text:'测试转写'}})));
  await expect(voice).toBeEnabled();
 }
 // Hold begins once at the threshold; release stops once and never toggles back on.
 const starts=await phone.evaluate(()=>(window as any).voiceCalls.filter((x:string)=>x==='start').length);
 await voice.hover();await phone.mouse.down();await expect(voice).toHaveAttribute('aria-pressed','true');await phone.mouse.up();
 await expect(voice).toHaveAttribute('aria-pressed','false');
 expect(await phone.evaluate(()=>(window as any).voiceCalls.filter((x:string)=>x==='start').length)).toBe(starts+1);
 await phone.evaluate(()=>window.dispatchEvent(new CustomEvent('native-speech',{detail:{sessionId:(window as any).voiceSession,type:'complete',text:'长按转写'}})));
 await expect(voice).toBeEnabled();
 // Gesture cancellation still invalidates late ASR even though no cancel button is exposed.
 const saved=await draft.getAttribute('data-value');
 await voice.hover();await phone.mouse.down();await expect(voice).toHaveAttribute('aria-pressed','true');
 await voice.dispatchEvent('pointercancel');await phone.mouse.up();await expect(voice).toHaveAttribute('aria-pressed','false');
 await expect(draft).toHaveAttribute('data-value',saved!);
 await expect(tablet.locator('.wb-message.user')).toHaveCount(0);await context.close();
});
