import {test,expect} from '@playwright/test';

test('persistent connection access preserves drafts, cancels cycling and releases held controls',async({browser})=>{
 const context=await browser.newContext({hasTouch:true}),tablet=await context.newPage(),phone=await context.newPage();
 await phone.setViewportSize({width:390,height:844});
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).tap();
 const pin=await tablet.locator('.pair-code').innerText();await tablet.getByRole('button',{name:'关闭连接设置'}).click();
 await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();
 await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);
 for(const page of [tablet,phone]){
  const button=page.getByRole('button',{name:'连接设置',exact:true});await expect(button).toHaveAttribute('data-connected','true');
  const box=(await button.boundingBox())!,view=page.viewportSize()!;expect(view.width-box.x-box.width).toBeLessThanOrEqual(16);expect(box.y).toBe(0);expect(box.width).toBe(48);
 }
 await tablet.getByRole('button',{name:'微信',exact:true}).click();await expect(phone.getByLabel('手机待机桌面')).toBeVisible();
 await phone.getByRole('button',{name:'连接设置',exact:true}).tap();await expect(phone.getByRole('dialog')).toContainText('已连接工作台');await phone.keyboard.press('Escape');await expect(phone.getByLabel('手机待机桌面')).toBeVisible();
 await tablet.getByLabel('微信回复输入框',{exact:true}).click();await expect(phone.locator('.wechat-phone')).toBeVisible();
 const draft=phone.locator('.wechat-phone textarea');await draft.fill('保留草稿🙂');await expect(tablet.getByLabel('微信回复输入框',{exact:true})).toHaveValue('保留草稿🙂');
 await phone.getByRole('button',{name:'连接设置',exact:true}).tap();await phone.getByRole('button',{name:'关闭连接设置'}).click();await expect(draft).toHaveValue('保留草稿🙂');
 await phone.getByRole('button',{name:'切换应用',exact:true}).click();await expect(tablet.getByRole('dialog',{name:'切换应用'})).toBeVisible();await phone.getByRole('button',{name:'连接设置',exact:true}).tap();await expect(tablet.getByRole('dialog',{name:'切换应用'})).toHaveCount(0);await phone.getByRole('button',{name:'关闭连接设置'}).click();
 await tablet.getByRole('button',{name:'返回',exact:true}).click();await tablet.getByRole('button',{name:'WPS',exact:true}).click();await phone.getByRole('button',{name:'开始放映',exact:true}).click();
 for(const page of [tablet,phone]){await page.getByRole('button',{name:'连接设置',exact:true}).tap();await expect(page.getByRole('dialog',{name:'设备连接'})).toBeVisible();await page.getByRole('button',{name:'关闭连接设置'}).click();}
 await expect(tablet.locator('.presentation')).toBeVisible();await expect(phone.getByRole('button',{name:'切换应用',exact:true})).toBeVisible();
 for(let i=0;i<3;i++)await tablet.getByRole('button',{name:'返回',exact:true}).click();await tablet.getByRole('button',{name:'Super Mario',exact:true}).click();await phone.setViewportSize({width:844,height:390});await expect(tablet.locator('.game')).toHaveAttribute('data-ready','true');
 const frame=tablet.frames().find(f=>f.url().includes('mario-classic'))!,cdp=await context.newCDPSession(phone);
 const point=async(name:string,id:number)=>{const b=(await phone.getByRole('button',{name,exact:true}).boundingBox())!;return {x:b.x+b.width/2,y:b.y+b.height/2,id};};
 const right=await point('向右',1),connection=await point('连接设置',2);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right]});await expect.poll(()=>frame.evaluate(()=>(window as any).__marioState?.keys)).toContain('39');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right,connection]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[right]});
 await expect(phone.getByRole('dialog',{name:'设备连接'})).toBeVisible();await expect.poll(()=>frame.evaluate(()=>(window as any).__marioState?.keys||[])).toHaveLength(0);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await phone.getByRole('button',{name:'关闭连接设置'}).click();await phone.screenshot({path:'artifacts/input-agent-v1.1.0/phone-fc.png'});
 await tablet.getByRole('button',{name:'连接设置',exact:true}).tap();await expect(tablet.locator('.pair-code')).toHaveText(pin);await tablet.screenshot({path:'artifacts/input-agent-v1.1.0/tablet-game-pair.png'});
 await phone.setViewportSize({width:390,height:844});await phone.evaluate(()=>window.dispatchEvent(new CustomEvent('native-insets',{detail:{width:390,height:844,top:44,bottom:24,left:0,right:0}})));
 await expect.poll(async()=>(await phone.getByRole('button',{name:'连接设置',exact:true}).boundingBox())?.y).toBe(44);
 await context.close();
});
