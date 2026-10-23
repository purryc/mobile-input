import {test,expect} from '@playwright/test';
async function setup(browser:any){const context=await browser.newContext(),tablet=await context.newPage(),phone=await context.newPage();await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();const pin=(await tablet.locator('.pair-code').innerText()).trim();await phone.setViewportSize({width:390,height:844});await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);await tablet.getByRole('button',{name:'关闭连接设置'}).click();await tablet.locator('.demo-apps').getByRole('button',{name:'WorkBuddy',exact:true}).click();await tablet.getByLabel('WorkBuddy 任务输入').click();await phone.getByRole('button',{name:'开始使用',exact:true}).click();return {context,tablet,phone};}

test('accepted sketch clears next input, material task selects files and returns from cross-app capture',async({browser})=>{
 test.setTimeout(60000);const {context,tablet,phone}=await setup(browser);const draft=phone.getByLabel('手机 WorkBuddy 草稿');
 await draft.fill('制作红色的销售汇报，布局我画一下');await phone.getByRole('button',{name:'画一下',exact:true}).click();
 const canvas=phone.getByLabel('任务手绘画板'),box=(await canvas.boundingBox())!;await phone.mouse.move(box.x+20,box.y+20);await phone.mouse.down();await phone.mouse.move(box.x+150,box.y+90,{steps:5});await phone.mouse.up();
 await phone.getByRole('button',{name:'确认草图'}).click();await expect(phone.getByRole('button',{name:'布局草图',exact:true})).toBeVisible();await phone.getByRole('button',{name:'发送任务',exact:true}).click();
 await expect(draft).toHaveAttribute('data-value','');await expect(phone.locator('.sentence-token')).toHaveCount(0);await expect(phone.getByLabel('任务手绘画板')).toHaveCount(0);await expect(phone.getByLabel('编辑手绘附件')).toHaveCount(0);
 await draft.fill('布局我画一下');await phone.getByRole('button',{name:'画一下',exact:true}).click();await expect(phone.locator('.wb-adaptive-sketch polyline')).toHaveCount(0);await phone.getByRole('button',{name:'关闭画板'}).click();
 await phone.getByRole('button',{name:'补充汇报材料 待补材料',exact:true}).click();await expect(draft).toHaveAttribute('data-value','');await expect(phone.getByRole('heading',{name:'请补充汇报材料'})).toBeVisible();
 await phone.getByRole('button',{name:'选择文件',exact:true}).click();await phone.locator('.wb-reference-files>div>button').first().click();await expect(phone.locator('.wb-reference-request')).toContainText('已添加 1 份材料');await expect(phone.getByRole('button',{name:'发送任务',exact:true})).toBeEnabled();
 await draft.fill('保留这条材料说明');await phone.screenshot({path:'artifacts/sentence-parameters/material-request.png'});
 await phone.getByRole('button',{name:'切换应用采集',exact:true}).click();await expect(tablet.locator('.bili-tablet')).toBeVisible({timeout:6000});
 await phone.getByRole('button',{name:'采集方式',exact:true}).click();await phone.getByRole('button',{name:'截图',exact:true}).click();await expect(phone.getByAltText('实际采集预览')).toBeVisible({timeout:15000});
 await expect(phone.getByLabel('采集目标任务')).toContainText('补充汇报材料');const target=await phone.getByLabel('采集目标任务').inputValue();expect(target).not.toBe('new');await phone.getByRole('button',{name:'作为任务参考',exact:true}).click();
 await expect(phone.locator('.capture-panel')).toContainText('已加入任务参考');await phone.getByRole('button',{name:'返回材料任务',exact:true}).click();
 await expect(draft).toHaveAttribute('data-value','保留这条材料说明');await expect(phone.locator('.wb-reference-request')).toContainText('已添加 2 份材料');await expect(tablet.locator('.wb-message.user')).toHaveCount(0);
 await phone.getByRole('button',{name:'发送任务',exact:true}).click();await expect(draft).toHaveAttribute('data-value','');await expect(phone.locator('.capture-attachments details')).toHaveCount(0);await expect(tablet.locator('.wb-message.user')).toContainText('附件：');
 await context.close();
});
