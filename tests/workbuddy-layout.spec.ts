import {test,expect,type Page} from '@playwright/test';

async function inViewport(page:Page,selector:string){
 const box=await page.locator(selector).boundingBox();
 expect(box,selector).not.toBeNull();
 const size=page.viewportSize()!;
 expect(box!.x,selector).toBeGreaterThanOrEqual(0);
 expect(box!.y,selector).toBeGreaterThanOrEqual(0);
 expect(box!.x+box!.width,selector).toBeLessThanOrEqual(size.width+1);
 expect(box!.y+box!.height,selector).toBeLessThanOrEqual(size.height+1);
}

test('compact WorkBuddy keeps its single editor and fixed voice dock usable across input tools',async({browser})=>{
 const context=await browser.newContext(),tablet=await context.newPage(),phone=await context.newPage();
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();
 const pin=(await tablet.locator('.pair-code').innerText()).trim();
 await phone.setViewportSize({width:360,height:640});await phone.goto('/?role=phone&bridge=5191');
 await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);
 await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);
 await tablet.getByRole('button',{name:'关闭连接设置'}).click();await tablet.locator('.demo-apps').getByRole('button',{name:'WorkBuddy',exact:true}).click();
 await tablet.getByLabel('WorkBuddy 任务输入').click();const draft=phone.getByLabel('手机 WorkBuddy 草稿');await expect(draft).toBeVisible();
 await draft.fill('公司 Roadmap PPT，主色用蓝色');await phone.getByRole('button',{name:'调整颜色',exact:true}).click();await expect(phone.getByLabel('主色 HEX')).toHaveValue('#1971C2');
 await inViewport(phone,'.input-dock');await expect(draft).toHaveCount(1);
 const checkMiddle=async()=>{
  const bounds=await phone.locator('.wb-adaptive-middle').boundingBox();
  const composer=await phone.locator('.wb-adaptive-composer').boundingBox();
  expect(composer!.y).toBeGreaterThanOrEqual(bounds!.y);
  expect(composer!.y+composer!.height).toBeLessThanOrEqual(bounds!.y+bounds!.height+1);
 };
 await checkMiddle();
 // Real phone soft-keyboard contraction exposed an overlap below 600 px.
 await phone.setViewportSize({width:404,height:540});
 await checkMiddle();await inViewport(phone,'.input-dock');
 const colorSend=await phone.getByRole('button',{name:'发送任务',exact:true}).boundingBox();
 const colorDock=await phone.locator('.input-dock').boundingBox();
 expect(colorSend!.y+colorSend!.height).toBeLessThanOrEqual(colorDock!.y);
 await phone.screenshot({path:'artifacts/adaptive-input/compact-color-keyboard.png'});
 await phone.setViewportSize({width:360,height:640});
 const originalVoice=(await phone.locator('.input-voice').boundingBox())!;
 await phone.screenshot({path:'artifacts/adaptive-input/compact-color-phone.png'});
 await draft.fill('公司 Roadmap PPT，主色用蓝色，左侧里程碑，右侧关键成果。');
 await phone.getByRole('button',{name:'画个布局',exact:true}).click();await expect(phone.getByLabel('任务手绘画板')).toBeVisible();
 await checkMiddle();
 const confirm=await phone.getByRole('button',{name:'确认草图'}).boundingBox(),middle=await phone.locator('.wb-adaptive-middle').boundingBox();
 expect(confirm!.y).toBeGreaterThanOrEqual(middle!.y);
 await inViewport(phone,'.input-dock');expect((await phone.locator('.input-voice').boundingBox())!.y).toBe(originalVoice.y);
 await phone.screenshot({path:'artifacts/adaptive-input/compact-sketch-phone.png'});
 // Real device insets and multiline text expose flex overflow missed by an empty composer.
 await draft.fill('真机验收：创建公司Roadmap PPT，主色用红色，左侧里程碑，右侧关键成果。 [主色 #1971C2]');
 await phone.addStyleTag({content:'.wb-adaptive-phone{--native-top:45px!important;--native-bottom:34px!important}'});
 for(const height of [846,584]){
  await phone.setViewportSize({width:404,height});await checkMiddle();
  const tools=(await phone.locator('.wb-adaptive-sketch header').boundingBox())!;
  const region=(await phone.locator('.wb-adaptive-middle').boundingBox())!;
  expect(tools.y).toBeGreaterThanOrEqual(region.y);
  const send=(await phone.getByRole('button',{name:'发送任务',exact:true}).boundingBox())!;
  const dock=(await phone.locator('.input-dock').boundingBox())!;
  expect(send.y+send.height).toBeLessThanOrEqual(dock.y);
 }
 await phone.addStyleTag({content:'.wb-adaptive-phone{--native-top:0px!important;--native-bottom:0px!important}'});

 // Browser viewport contraction exercises keyboard-like constraints, not a native keyboard.
 await phone.setViewportSize({width:360,height:460});
 await inViewport(phone,'.input-dock');await inViewport(phone,'.wb-adaptive-middle');
 await phone.getByRole('button',{name:'采集方式',exact:true}).click();
 await inViewport(phone,'.capture-panel');
 const panel=phone.locator('.capture-panel');
 expect(await panel.evaluate(el=>el.clientHeight)).toBeGreaterThan(110);
 await phone.getByRole('button',{name:'截图',exact:true}).click();
 await expect(phone.getByAltText('实际采集预览')).toBeVisible({timeout:15000});
 await phone.getByRole('button',{name:'作为任务参考',exact:true}).click();
 await expect(panel).toContainText('已加入任务参考');
 await phone.getByRole('button',{name:'返回输入',exact:true}).click();
 await expect(draft).toHaveValue(/Roadmap/);await expect(tablet.locator('.wb-message.user')).toHaveCount(0);
 await context.close();
});


test('capture preview touch swipe reaches adoption controls; crop mode owns the gesture',async({browser})=>{
 const context=await browser.newContext({hasTouch:true}),tablet=await context.newPage(),phone=await context.newPage();
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();
 const pin=(await tablet.locator('.pair-code').innerText()).trim();
 await phone.setViewportSize({width:404,height:800});await phone.goto('/?role=phone&bridge=5191');
 await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();
 await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);await tablet.getByRole('button',{name:'关闭连接设置'}).click();
 await tablet.locator('.demo-apps').getByRole('button',{name:'WorkBuddy',exact:true}).click();await tablet.getByLabel('WorkBuddy 任务输入').click();
 await phone.getByRole('button',{name:'采集方式',exact:true}).click();await phone.getByRole('button',{name:'截图',exact:true}).click();
 await expect(phone.getByAltText('实际采集预览')).toBeVisible({timeout:15000});
 const scroller=phone.locator('.capture-panel-scroll'),preview=phone.locator('.capture-preview'),cdp=await context.newCDPSession(phone);
 const gesture=async()=>{
  const a=(await preview.boundingBox())!,b=(await scroller.boundingBox())!;
  const x=a.x+a.width/2,y=Math.min(a.y+a.height,b.y+b.height)-12;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*8}]});await phone.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 };
 await gesture();await expect.poll(()=>scroller.evaluate(el=>el.scrollTop)).toBeGreaterThan(40);
 const use=phone.getByRole('button',{name:'作为任务参考',exact:true});await use.scrollIntoViewIfNeeded();
 await phone.getByRole('button',{name:'圈选参考范围',exact:true}).click();await expect(preview).toHaveClass(/cropping/);
 await expect(preview).toHaveCSS('touch-action','none');
 await phone.getByRole('button',{name:'圈选参考范围',exact:true}).click();await expect(preview).toHaveCSS('touch-action','pan-y');
 await use.click();await expect(phone.getByRole('dialog',{name:'采集参考'})).toContainText('已加入任务参考');
 await expect(tablet.locator('.wb-message.user')).toHaveCount(0);await context.close();
});
