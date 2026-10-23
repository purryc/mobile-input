import {test,expect} from '@playwright/test';
test('new tasks, follow-ups and material tasks all expose usable color and layout inputs',async({browser})=>{
 const c=await browser.newContext(),tablet=await c.newPage(),phone=await c.newPage();await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();const pin=(await tablet.locator('.pair-code').innerText()).trim();
 await phone.setViewportSize({width:390,height:844});await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);await tablet.getByRole('button',{name:'关闭连接设置'}).click();await tablet.locator('.demo-apps').getByRole('button',{name:'WorkBuddy',exact:true}).click();await tablet.getByLabel('WorkBuddy 任务输入').click();
 const draft=phone.getByLabel('手机 WorkBuddy 草稿');
 for(let i=0;i<2;i++){
  const previous=await draft.elementHandle();await phone.getByRole('button',{name:'新建输入任务'}).click();await previous!.waitForElementState('hidden');await expect(draft).toHaveAttribute('data-value','');
  await draft.fill(`任务${i+1}：做一个深红色的ppt，布局我画一下`);await phone.locator('.sentence-token[data-kind=color]').click();await expect(phone.getByLabel('主色 HEX')).toHaveValue('#A51127');await phone.getByRole('button',{name:'关闭调色'}).click();
  await phone.getByRole('button',{name:'画一下',exact:true}).click();await expect(phone.getByLabel('任务手绘画板')).toBeVisible();await phone.getByRole('button',{name:'关闭画板'}).click();
 }
 await phone.getByRole('button',{name:'发送任务',exact:true}).click();await expect(draft).toHaveAttribute('data-value','');await draft.fill('补充：背景换成浅蓝色，画一下页面布局');await phone.locator('.sentence-token[data-kind=color]').click();await expect(phone.getByLabel('主色 HEX')).toHaveValue('#A5D8FF');await phone.getByRole('button',{name:'关闭调色'}).click();
 const previous=await draft.elementHandle();await phone.getByRole('button',{name:'整理演示票据 待补材料',exact:true}).click();await previous!.waitForElementState('hidden');await expect(draft).toHaveAttribute('data-value','');await draft.fill('主色用红色，画个布局');await phone.locator('.sentence-token[data-kind=color]').click();await expect(phone.getByLabel('主色 HEX')).toBeVisible();await phone.getByRole('button',{name:'关闭调色'}).click();await phone.getByRole('button',{name:'画一下',exact:true}).click();await expect(phone.getByLabel('任务手绘画板')).toBeVisible();await phone.getByRole('button',{name:'关闭画板'}).click();await expect(phone.locator('.adaptive-error')).toHaveCount(0);
 await c.close();
});
