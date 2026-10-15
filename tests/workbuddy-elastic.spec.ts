import {test,expect,type Page} from '@playwright/test';
async function setup(browser:any){
 const context=await browser.newContext(),tablet:Page=await context.newPage(),phone:Page=await context.newPage();
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:/扫码网络建联/}).check();
 const pin=(await tablet.locator('.pair-code').innerText()).trim();await phone.setViewportSize({width:390,height:844});await phone.goto('/?role=phone&bridge=5191');
 await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();
 await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);await tablet.getByRole('button',{name:'关闭连接设置'}).click();
 await tablet.locator('.demo-apps').getByRole('button',{name:'WorkBuddy',exact:true}).click();await tablet.getByLabel('WorkBuddy 任务输入').click();
 return {context,tablet,phone};
}
async function sendVisible(phone:Page){
 const send=(await phone.getByRole('button',{name:'发送任务',exact:true}).boundingBox())!,dock=(await phone.locator('.input-dock').boundingBox())!;
 expect(send.height).toBeGreaterThanOrEqual(48);expect(send.y).toBeGreaterThan(0);expect(send.y+send.height).toBeLessThanOrEqual(dock.y+1);
}
test('intent-only composer chips disappear while open, restore on close, and multiple panels share height',async({browser})=>{
 const {context,phone,tablet}=await setup(browser),draft=phone.getByLabel('手机 WorkBuddy 草稿'),chips=phone.locator('.wb-adaptive-composer .wb-intent-chips');
 await expect(chips.locator('button')).toHaveCount(0);
 await draft.fill('整理一下客户要求。');await phone.waitForTimeout(550);await expect(chips.locator('button')).toHaveCount(0);
 await draft.fill('主题用红色。');await expect(chips.getByRole('button',{name:'调整颜色'})).toBeVisible();await expect(chips.locator('button')).toHaveCount(1);
 await draft.fill('主题用红色。左侧里程碑，右侧成果。');await expect(chips.locator('button')).toHaveCount(2);
 const voice=(await phone.locator('.input-voice').boundingBox())!;
 await chips.getByRole('button',{name:'调整颜色'}).click();await expect(chips.getByRole('button',{name:'调整颜色'})).toHaveCount(0);await expect(phone.getByLabel('主色 HEX')).toBeVisible();
 const colorBefore=(await phone.locator('.wb-adaptive-color').boundingBox())!.height;
 await chips.getByRole('button',{name:'画个布局'}).click();await expect(chips.locator('button')).toHaveCount(0);await expect(phone.locator('.wb-adaptive-color')).toBeVisible();await expect(phone.getByLabel('任务手绘画板')).toBeVisible();
 expect((await phone.locator('.wb-adaptive-color').boundingBox())!.height).toBeLessThan(colorBefore);await expect(phone.locator('.wb-tool-summaries')).toHaveCount(0);
 expect((await phone.locator('.input-voice').boundingBox())!.y).toBe(voice.y);
 for(const height of [844,700,584]){await phone.setViewportSize({width:390,height});await sendVisible(phone);await expect(phone.locator('.input-voice')).toBeInViewport();await phone.screenshot({path:`artifacts/intent-panel-lifecycle/together-${height}.png`});}
 await phone.setViewportSize({width:390,height:844});
 await draft.click();await expect(phone.getByLabel('任务手绘画板')).toHaveCount(1);await expect(phone.locator('.wb-adaptive-color')).toHaveCount(1);
 await phone.getByRole('button',{name:'键盘',exact:true}).click();await expect(phone.getByLabel('展开键盘')).toBeVisible();await expect(phone.getByLabel('任务手绘画板')).toHaveCount(1);await sendVisible(phone);await phone.screenshot({path:'artifacts/intent-panel-lifecycle/together-keyboard.png'});
 await phone.getByRole('button',{name:'键盘',exact:true}).click();
 await phone.getByRole('button',{name:'关闭调色'}).click();await expect(phone.locator('.wb-adaptive-color')).toHaveCount(0);await expect(chips.getByRole('button',{name:'调整颜色'})).toBeVisible();await expect(phone.getByLabel('任务手绘画板')).toHaveCount(1);
 await phone.getByRole('button',{name:'关闭画板'}).click();await expect(phone.locator('.wb-aux-workspace')).toHaveCount(0);await expect(chips.locator('button')).toHaveCount(2);await expect(phone.locator('.wb-tool-summaries')).toHaveCount(0);
 await phone.screenshot({path:'artifacts/intent-panel-lifecycle/closed.png'});
 await draft.fill('不要红色，不用画布局，整理客户需求。');await expect(chips.locator('button')).toHaveCount(0);await expect(tablet.locator('.wb-message.user')).toHaveCount(0);
 await context.close();
});
test('closing preserves pending strokes as a material without inventing new recommendations',async({browser})=>{
 const {context,phone}=await setup(browser),draft=phone.getByLabel('手机 WorkBuddy 草稿');
 await draft.fill('画个布局');await phone.getByRole('button',{name:'画个布局',exact:true}).click();
 const canvas=phone.getByLabel('任务手绘画板'),b=(await canvas.boundingBox())!;
 await phone.mouse.move(b.x+20,b.y+20);await phone.mouse.down();await phone.mouse.move(b.x+100,b.y+60,{steps:6});await phone.mouse.up();
 await phone.getByRole('button',{name:'关闭画板'}).click();await expect(phone.getByRole('button',{name:'发送任务',exact:true})).toBeDisabled();
 await draft.fill('整理客户需求');await expect(phone.locator('.wb-intent-chip')).toHaveCount(0);await expect(phone.getByRole('button',{name:'编辑手绘附件'})).toBeVisible();await expect(phone.locator('.wb-aux-workspace')).toHaveCount(0);
 await phone.getByRole('button',{name:'编辑手绘附件'}).click();await expect(canvas.locator('polyline')).toHaveCount(1);await phone.getByRole('button',{name:'确认草图'}).click();await expect(phone.getByRole('button',{name:'发送任务',exact:true})).toBeEnabled();
 await phone.getByRole('button',{name:'新建输入任务'}).click();await expect(draft).toHaveValue('');await expect(phone.locator('.wb-intent-chip')).toHaveCount(0);await expect(phone.getByRole('button',{name:'编辑手绘附件'})).toHaveCount(0);
 await context.close();
});
