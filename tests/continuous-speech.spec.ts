import {test,expect,type Page} from '@playwright/test';
async function command(page:Page,type:string,value:unknown={}){return page.evaluate(async({type,value})=>{const r=await import(performance.getEntriesByType('resource').find(e=>/\/src\/runtime\.ts(?:\?|$)/.test(e.name))!.name);return r.command(type,value);},{type,value});}
test('shared dictation gestures retain capture across results and echoes, stop once, reject stale results and use transient toast',async({browser})=>{
 const c=await browser.newContext(),tablet=await c.newPage(),phone=await c.newPage();
 await phone.addInitScript(()=>{const WS=window.WebSocket;window.WebSocket=class extends WS{constructor(url:string,protocols?:string|string[]){super(url,protocols);(window as any).__socket=this;}};});
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();const pin=(await tablet.locator('.pair-code').innerText()).trim();await tablet.getByRole('button',{name:'关闭连接设置'}).click();
 await phone.setViewportSize({width:390,height:844});await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);
 await command(tablet,'open','workbuddy');await tablet.getByLabel('WorkBuddy 任务输入',{exact:true}).click();
 await phone.evaluate(()=>{const w=window as any;w.calls=[];w.MobileNative={send:(data:string)=>{w.__socket.send(data);return 'sent';},startRecognition:(id:string,_online:boolean,manual:boolean)=>{w.voiceId=id;w.calls.push(['start',id,manual]);window.dispatchEvent(new CustomEvent('native-speech',{detail:{sessionId:id,type:'start'}}));return 'starting';},stopRecognition:(id:string)=>{w.calls.push(['stop',id]);return 'stopping';},cancelRecognition:(id:string)=>{w.calls.push(['cancel',id]);return 'cancelled';}};});
 const voice=phone.getByRole('button',{name:'智慧语音',exact:true}),draft=phone.getByLabel('手机 WorkBuddy 草稿');
 const emit=async(type:string,text='',sequence?:number)=>phone.evaluate(({type,text,sequence})=>{window.dispatchEvent(new CustomEvent('native-speech',{detail:{sessionId:(window as any).voiceId,type,text,message:type==='error'?'语音识别暂时不可用，请重试':'',sequence}}));},{type,text,sequence});
 // Hold begins after 300 ms, recognizer segment results and authoritative echoes don't stop it.
 const box=(await voice.boundingBox())!;await phone.mouse.move(box.x+box.width/2,box.y+box.height/2);await phone.mouse.down();await phone.waitForTimeout(360);await expect(voice).toHaveAttribute('aria-pressed','true');
 await emit('final','第一句。',1);await emit('segment-complete','第一句。',2);await emit('partial','第一句。第二句',3);await expect(draft).toHaveAttribute('data-value','第一句。第二句');await expect(tablet.getByLabel('WorkBuddy 任务输入',{exact:true})).toHaveValue('第一句。第二句');
 await emit('partial','乱序',2);await expect(draft).toHaveAttribute('data-value','第一句。第二句');await expect(voice).toHaveAttribute('aria-pressed','true');
 expect(await phone.evaluate(()=>(window as any).calls.filter((x:any)=>x[0]==='stop').length)).toBe(0);
 await phone.mouse.up();await emit('complete','第一句。第二句。',4);await expect(voice).toHaveAttribute('aria-pressed','false');
 expect(await phone.evaluate(()=>(window as any).calls.filter((x:any)=>x[0]==='start').length)).toBe(1);
 expect(await phone.evaluate(()=>(window as any).calls.filter((x:any)=>x[0]==='stop').length)).toBe(1);
 // Toggle is independent of sentence completion; a second press consumes its click.
 await voice.click();await emit('final','接着说。',1);await emit('segment-complete','接着说。',2);await expect(voice).toHaveAttribute('aria-pressed','true');await voice.click();await emit('complete','接着说。',3);
 expect(await phone.evaluate(()=>(window as any).calls.filter((x:any)=>x[0]==='start').length)).toBe(2);
 await voice.click();await emit('error');const y=(await voice.boundingBox())!.y;await expect(phone.locator('.input-toast')).toBeVisible();await expect(phone.locator('.input-error')).toHaveCount(0);await expect(phone.getByRole('button',{name:'重试识别'})).toHaveCount(0);expect((await voice.boundingBox())!.y).toBe(y);await expect(phone.locator('.input-toast')).toHaveCount(0,{timeout:4000});
 // A task change cancels; late recognition cannot enter the new owner.
 await voice.click();const previous=await phone.evaluate(()=>(window as any).voiceId);await command(tablet,'wb-input-task',{action:'new'});await phone.evaluate(id=>window.dispatchEvent(new CustomEvent('native-speech',{detail:{sessionId:id,type:'complete',text:'旧任务语音'}})),previous);await expect(draft).not.toHaveAttribute('data-value',/旧任务语音/);
 await expect(tablet.locator('.wb-message.user')).toHaveCount(0);await c.close();
});
