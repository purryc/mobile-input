import {test,expect} from '@playwright/test';
test('selected slide instruction stays separate, speech adapter is editable, explicit direct submit and direct field coexist',async({browser})=>{
 const context=await browser.newContext(),tablet=await context.newPage(),phone=await context.newPage();const errors:string[]=[];for(const p of [tablet,phone])p.on('pageerror',e=>errors.push(e.message));
 await phone.addInitScript(()=>{const Native=window.WebSocket;window.WebSocket=class extends Native{constructor(url:string,protocols?:string|string[]){super(url,protocols);(window as any).__testSocket=this;}};});
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();const pin=(await tablet.locator('.pair-code').innerText()).trim();await phone.setViewportSize({width:390,height:844});await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);await tablet.getByRole('button',{name:'关闭连接设置'}).click();await tablet.locator('.demo-apps').getByRole('button',{name:'WorkBuddy',exact:true}).click();
 await tablet.locator('.wb-sidebar nav').getByRole('button',{name:/更多/}).click();await tablet.getByRole('button',{name:'文件浏览器',exact:true}).click();await tablet.getByRole('button',{name:'打开文件',exact:true}).click();await tablet.getByRole('dialog').getByRole('button',{name:'销售汇报.pptx',exact:true}).click();await tablet.locator('.wbf-slides aside button').nth(2).click();
 const heading=tablet.locator('.slide-canvas h1'),before=await heading.innerText();await heading.click();const draft=phone.getByLabel('对象修改要求');await expect(draft).toHaveValue('');await expect(phone.locator('.wb-object-context')).toContainText(before);await expect(heading).toHaveAttribute('data-wb-active','true');const keyboard=phone.getByRole('button',{name:'键盘',exact:true});await keyboard.click();await expect(phone.getByLabel('展开键盘')).toBeVisible();await keyboard.click();await expect(draft).not.toBeFocused();await expect(keyboard).toHaveAttribute('aria-pressed','false');
 await phone.getByRole('button',{name:'触控板',exact:true}).click();const pad=(await phone.locator('.input-track-surface').boundingBox())!,canvas=(await tablet.locator('.slide-canvas').boundingBox())!,body=(await tablet.locator('[data-wb-object="slide/2/body"]').boundingBox())!;
 const view=tablet.viewportSize()!;const nx=(body.x+body.width/2)/view.width,ny=(body.y+body.height/2)/view.height;
 const sx=pad.x+pad.width/2,sy=pad.y+pad.height/2,ex=sx+(nx-.5)*500,ey=sy+(ny-.5)*500;
 await phone.mouse.move(sx,sy);await phone.mouse.down();await phone.mouse.move(ex,ey,{steps:8});await phone.mouse.up();await expect(tablet.locator('.shared-input-pointer')).toBeVisible();await phone.getByRole('button',{name:'左键',exact:true}).click();await expect(phone.locator('.wb-object-context')).toContainText('正文');await expect(tablet.locator('[data-wb-object="slide/2/body"]')).toHaveAttribute('data-wb-active','true');await heading.click();await expect(phone.locator('.wb-object-context')).toContainText('标题');

 // Native transports may deliver a small ack before its larger state snapshot.
 // Exercise progressive transcripts with that ordering, rather than final-only ASR.
 await phone.evaluate(()=>{const socket=(window as any).__testSocket,receive=socket.onmessage;socket.onmessage=(event:MessageEvent)=>{if(JSON.parse(event.data).kind==='snapshot')setTimeout(()=>receive.call(socket,event),180);else receive.call(socket,event);};});
 await draft.fill('把标题');await phone.waitForTimeout(60);
 await draft.fill('把标题改为季度');await phone.waitForTimeout(60);
 await draft.fill('把标题改为季度增长路线图');
 await expect(phone.getByRole('button',{name:'恢复到当前对象'})).toHaveCount(0);
 await phone.waitForTimeout(700);
 await expect(phone.getByRole('button',{name:'发送修改要求'})).toBeEnabled();
 await draft.fill('');await phone.waitForTimeout(700);
 // Restore an interrupted local draft on returning to the same object.
 await tablet.locator('[data-wb-object="slide/2/body"]').click();
 await expect(phone.locator('.wb-object-context')).toContainText('正文');
 await phone.evaluate(()=>{const key=Object.keys(localStorage).find(k=>k.startsWith('mobile-input:workbuddy-draft:phone:wb:object:')&&k.endsWith('slide/2/title'));if(!key)throw new Error('missing title draft');localStorage.setItem(key,JSON.stringify({text:'把标题改为确认目标后的标题',pending:true}));});
 await heading.click();
 await expect(phone.getByRole('button',{name:'恢复到当前对象'})).toBeVisible();
 const guardedSend=phone.getByRole('button',{name:'发送修改要求'});
 await expect(guardedSend).toBeEnabled();await expect(guardedSend).toHaveText('确认目标');
 await guardedSend.click();await expect(guardedSend).toHaveText('发送');
 await expect(phone.locator('.wb-object-after')).toHaveCount(0);await expect(heading).toHaveText(before);
 await draft.fill('');await phone.waitForTimeout(700);
 // Synthetic speech-adapter events test lifecycle only; they are not native ASR evidence.
 await phone.evaluate(()=>{const w=window as any;w.__starts=0;w.__stops=0;w.MobileNative={send:(raw:string)=>{w.__testSocket.send(raw);return 'sent';},startRecognition:(id:string)=>{w.__speechId=id;w.__starts++;window.dispatchEvent(new CustomEvent('native-speech',{detail:{sessionId:id,type:'start'}}));},stopRecognition:(id:string)=>{w.__stops++;for(const [type,text]of [['final','把标题改为“季度增长路线图”，简洁一点'],['complete','']])window.dispatchEvent(new CustomEvent('native-speech',{detail:{sessionId:id,type,text}}));},cancelRecognition:()=>{}};});
 const voice=phone.locator('.input-voice'),y=(await voice.boundingBox())!.y;await voice.click();await expect(voice).toHaveClass(/recording/);await voice.click();await expect(draft).toHaveValue(/季度增长路线图/);expect(await phone.evaluate(()=>(window as any).__starts)).toBe(1);expect(await phone.evaluate(()=>(window as any).__stops)).toBe(1);expect((await voice.boundingBox())!.y).toBe(y);await expect(heading).toHaveText(before);await phone.screenshot({path:'artifacts/adaptive-input/workbuddy-object-phone.png'});
 await phone.getByRole('button',{name:'字号',exact:true}).click();await phone.getByLabel('对象字号').fill('32');await phone.getByRole('button',{name:'对齐',exact:true}).click();await phone.getByRole('button',{name:'居中',exact:true}).click();await phone.getByRole('button',{name:'发送修改要求'}).click();await expect(phone.locator('.wb-object-after')).toHaveCount(0);await expect(heading).toHaveText('季度增长路线图');
 await phone.addStyleTag({content:'.wb-adaptive-phone{--native-top:45px!important;--native-bottom:34px!important}'});
 for(const height of [846,584]){
  await phone.setViewportSize({width:404,height});
  const editorBox=(await phone.locator('.wb-adaptive-composer').boundingBox())!,dock=(await phone.locator('.input-dock').boundingBox())!;
  const sendBox=(await phone.getByRole('button',{name:'发送修改要求'}).boundingBox())!;
  expect(editorBox.y+editorBox.height).toBeLessThanOrEqual(dock.y);
  expect(sendBox.y+sendBox.height).toBeLessThanOrEqual(dock.y);
 }
 await phone.setViewportSize({width:390,height:844});await phone.addStyleTag({content:'.wb-adaptive-phone{--native-top:0px!important;--native-bottom:0px!important}'});
 await expect(heading).toHaveText('季度增长路线图');await expect(heading).toHaveCSS('text-align','center');await expect(draft).toHaveValue('');await expect(tablet.locator('.wbf-file-meta')).toContainText('已保存');
 // Direct field remains a direct editor; a new edit invalidates an already-prepared instruction.
 await draft.fill('把标题改为“旧预览不能覆盖”');await tablet.locator('.wbf-slide-fields input').fill('平板刚刚手改的标题');await expect(heading).toHaveText('平板刚刚手改的标题');await expect(phone.locator('.wb-object-phone')).toHaveCount(0);await heading.click();await expect(phone.locator('.wb-object-context')).toContainText('平板刚刚手改的标题');await expect(phone.getByRole('button',{name:'应用修改',exact:true})).toHaveCount(0);await expect(phone.getByLabel('对象修改要求')).toHaveValue('把标题改为“旧预览不能覆盖”');await tablet.screenshot({path:'artifacts/adaptive-input/workbuddy-object-tablet.png'});
 expect(errors).toEqual([]);await context.close();
});
