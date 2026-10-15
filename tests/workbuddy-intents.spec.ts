import {test,expect} from '@playwright/test';
test('intent chips are explicit, dismissible, task-scoped and preserve unfinished input',async({browser})=>{
 const c=await browser.newContext(),tablet=await c.newPage(),phone=await c.newPage();await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();const pin=(await tablet.locator('.pair-code').innerText()).trim();
 await phone.setViewportSize({width:390,height:844});await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);await tablet.getByRole('button',{name:'关闭连接设置'}).click();await tablet.locator('.demo-apps').getByRole('button',{name:'WorkBuddy',exact:true}).click();await tablet.getByLabel('WorkBuddy 任务输入').click();
 const draft=phone.getByLabel('手机 WorkBuddy 草稿');await expect(draft).toHaveAttribute('inputmode','none');await draft.click();await expect(draft).toBeFocused();
 await draft.fill('做公司 Roadmap，主色用红色，画个布局，拍照补充，添加文档');
 await expect(phone.locator('[data-recognizing=color]')).toHaveText('主色用红色');await expect(phone.getByRole('button',{name:'调整颜色',exact:true})).toHaveCount(0);await phone.screenshot({path:'artifacts/color-recognition/word-loading.png'});
 for(const label of ['调整颜色','画个布局','拍照补充','添加文档'])await expect(phone.getByRole('button',{name:label,exact:true})).toBeVisible();
 await expect(draft).not.toHaveValue(/#[0-9A-F]{6}/);await expect(phone.getByRole('button',{name:'撤销主色参数'})).toHaveCount(0);await expect(phone.locator('[data-recognizing=color]')).toHaveCount(0);
 await expect(phone.getByLabel('任务手绘画板')).toHaveCount(0);await expect(phone.getByLabel('主色 HEX')).toHaveCount(0);
 await phone.screenshot({path:'artifacts/input-design-update/intent-chips.png'});
 const before=(await phone.locator('.wb-adaptive-composer').boundingBox())!.height;
 await phone.getByRole('button',{name:'调整颜色',exact:true}).click();await phone.getByLabel('主色 HEX').fill('#C92A2A');await expect(draft).not.toHaveValue(/#[0-9A-F]{6}/);await expect(phone.getByRole('button',{name:'调整颜色',exact:true}).locator('i')).toHaveCSS('background-color','rgb(201, 42, 42)');await phone.getByRole('button',{name:'关闭调色'}).click();expect((await phone.locator('.wb-adaptive-composer').boundingBox())!.height).toBe(before);
 await draft.fill((await draft.inputValue())+'，请保留任务说明。');await phone.waitForTimeout(600);await expect(phone.getByLabel('主色 HEX')).toHaveCount(0);
 await phone.getByRole('button',{name:'画个布局',exact:true}).click();const canvas=phone.getByLabel('任务手绘画板'),box=(await canvas.boundingBox())!;await phone.mouse.move(box.x+15,box.y+15);await phone.mouse.down();await phone.mouse.move(box.x+90,box.y+50,{steps:5});await phone.mouse.up();
 const close=(await phone.getByRole('button',{name:'关闭画板'}).boundingBox())!,confirm=(await phone.getByRole('button',{name:'确认草图'}).boundingBox())!;expect(close.height).toBeGreaterThanOrEqual(48);expect(confirm.height).toBeGreaterThanOrEqual(48);expect(confirm.y).toBeGreaterThan(box.y+box.height-1);
 await phone.screenshot({path:'artifacts/input-design-update/sketch-open.png'});await phone.getByRole('button',{name:'关闭画板'}).click();await expect(phone.getByRole('button',{name:'编辑手绘附件'})).toHaveCount(0);
 await phone.getByRole('button',{name:'新建输入任务'}).click();await expect(draft).toHaveValue('');await expect(phone.locator('.wb-intent-chip')).toHaveCount(0);await phone.locator('.wb-task-strip').getByRole('button',{name:'公司 Roadmap PPT 草稿',exact:true}).click();await expect(canvas).toHaveCount(0);await phone.getByRole('button',{name:'画个布局',exact:true}).click();await expect(canvas.locator('polyline')).toHaveCount(1);await phone.getByRole('button',{name:'确认草图'}).click();await expect(phone.getByRole('button',{name:'编辑手绘附件'})).toBeVisible();
 await phone.getByRole('button',{name:'添加文档',exact:true}).click();await phone.locator('.wb-document-picker .wb-aux-body button').first().click();await phone.getByRole('button',{name:'确认添加文档'}).click();await expect(phone.locator('.wb-document-picker')).toHaveCount(0);
 await draft.fill('不要拍照，不用画个布局，无需添加文档。整理需求摘要');await expect(phone.locator('.wb-intent-chip')).toHaveCount(0);await expect(phone.getByRole('button',{name:'编辑手绘附件'})).toBeVisible();await expect(tablet.locator('.wb-message.user')).toHaveCount(0);
 await c.close();
});

test('new tasks, follow-ups and material tasks all expose usable color and layout inputs',async({browser})=>{
 const c=await browser.newContext(),tablet=await c.newPage(),phone=await c.newPage();await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();const pin=(await tablet.locator('.pair-code').innerText()).trim();
 await phone.setViewportSize({width:390,height:844});await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);await tablet.getByRole('button',{name:'关闭连接设置'}).click();await tablet.locator('.demo-apps').getByRole('button',{name:'WorkBuddy',exact:true}).click();await tablet.getByLabel('WorkBuddy 任务输入').click();
 const draft=phone.getByLabel('手机 WorkBuddy 草稿');
 for(let i=0;i<2;i++){
  const previous=await draft.elementHandle();await phone.getByRole('button',{name:'新建输入任务'}).click();await previous!.waitForElementState('hidden');await expect(draft).toHaveValue('');
  await draft.fill(`任务${i+1}：做一个深红色的ppt，布局我画一下`);await phone.getByRole('button',{name:'调整颜色',exact:true}).click();await expect(phone.getByLabel('主色 HEX')).toHaveValue('#A51127');await phone.getByRole('button',{name:'关闭调色'}).click();
  await phone.getByRole('button',{name:'画个布局',exact:true}).click();await expect(phone.getByLabel('任务手绘画板')).toBeVisible();await phone.getByRole('button',{name:'关闭画板'}).click();
 }
 await phone.getByRole('button',{name:'发送任务',exact:true}).click();await expect(draft).toHaveValue('');await draft.fill('补充：背景换成浅蓝色，画一下页面布局');await phone.getByRole('button',{name:'调整颜色',exact:true}).click();await expect(phone.getByLabel('主色 HEX')).toHaveValue('#A5D8FF');await phone.getByRole('button',{name:'关闭调色'}).click();
 const previous=await draft.elementHandle();await phone.getByRole('button',{name:'整理演示票据 待补材料',exact:true}).click();await previous!.waitForElementState('hidden');await expect(draft).toHaveValue('');await draft.fill('主色用红色，画个布局');await phone.getByRole('button',{name:'调整颜色',exact:true}).click();await expect(phone.getByLabel('主色 HEX')).toBeVisible();await phone.getByRole('button',{name:'关闭调色'}).click();await phone.getByRole('button',{name:'画个布局',exact:true}).click();await expect(phone.getByLabel('任务手绘画板')).toBeVisible();await phone.getByRole('button',{name:'关闭画板'}).click();await expect(phone.locator('.adaptive-error')).toHaveCount(0);
 await c.close();
});
