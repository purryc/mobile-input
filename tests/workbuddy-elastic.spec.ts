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
test('inline parameters preserve prose and replace one auxiliary widget without moving fixed actions',async({browser})=>{
 const {context,phone,tablet}=await setup(browser),draft=phone.getByLabel('手机 WorkBuddy 草稿');
 const text='做一份公司 Roadmap PPT，主色用红色，参考添加照片。布局我画一下。左侧放季度里程碑，右侧放关键成果。';
 await draft.fill(text);await expect(phone.locator('.sentence-token[data-kind=color]')).toBeVisible();
 await expect(draft).toHaveAttribute('data-value',text);await expect(tablet.getByLabel('WorkBuddy 任务输入')).toHaveValue(text);
 await expect(phone.locator('.wb-intent-chips')).toHaveCount(0);await expect(phone.locator('.wb-aux-workspace')).toHaveCount(0);
 const hit=(await phone.locator('.sentence-token[data-kind=color]').boundingBox())!,face=(await phone.locator('.sentence-token[data-kind=color] .sentence-token-face').boundingBox())!;expect(hit.height).toBeGreaterThanOrEqual(48);expect(face.height).toBe(32);
 const voice=(await phone.locator('.input-voice').boundingBox())!;
 await phone.screenshot({path:'artifacts/sentence-parameters/closed.png'});
 await phone.locator('.sentence-token[data-kind=color]').click();await expect(phone.getByLabel('主色 HEX')).toBeVisible();
 await expect(phone.locator('.sentence-token[data-kind=color]')).toHaveAttribute('aria-pressed','true');
 await phone.getByLabel('主色 HEX').fill('#C92A2A');await expect(phone.locator('.sentence-swatch')).toHaveCSS('background-color','rgb(201, 42, 42)');
 await phone.locator('.sentence-token[data-kind=sketch]').click();await expect(phone.getByLabel('主色 HEX')).toHaveCount(0);await expect(phone.getByLabel('任务手绘画板')).toBeVisible();
 await expect(phone.locator('.wb-tool-slot')).toHaveCount(1);await expect(draft).toContainText('左侧放季度里程碑，右侧放关键成果。');
 expect((await phone.locator('.input-voice').boundingBox())!.y).toBe(voice.y);
 await expect.poll(()=>phone.locator('.wb-tool-slot img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0))).toBe(true);
 await phone.screenshot({path:'artifacts/sentence-parameters/canvas.png'});
 const canvas=phone.getByLabel('任务手绘画板'),b=(await canvas.boundingBox())!;
 await phone.mouse.move(b.x+20,b.y+20);await phone.mouse.down();await phone.mouse.move(b.x+100,b.y+60,{steps:6});await phone.mouse.up();
 await phone.locator('.sentence-token[data-kind=color]').click();await expect(canvas).toHaveCount(0);await expect(phone.getByLabel('主色 HEX')).toHaveValue('#C92A2A');
 await phone.locator('.sentence-token[data-kind=sketch]').click();await expect(canvas.locator('polyline')).toHaveCount(1);
 await phone.getByRole('button',{name:'确认草图'}).click();await expect(phone.locator('.sentence-sketch')).toHaveCount(1);await expect(phone.locator('.wb-aux-workspace')).toHaveCount(0);
 await phone.locator('.sentence-token[data-kind=sketch]').click();
 for(const height of [844,700,584]){await phone.setViewportSize({width:390,height});await sendVisible(phone);await expect(phone.locator('.input-voice')).toBeInViewport();await phone.screenshot({path:`artifacts/sentence-parameters/canvas-${height}.png`});}
 await phone.setViewportSize({width:390,height:844});await phone.getByRole('button',{name:'键盘',exact:true}).click();await sendVisible(phone);await expect(canvas).toHaveCount(1);await phone.screenshot({path:'artifacts/sentence-parameters/keyboard.png'});
 await phone.getByRole('button',{name:'键盘',exact:true}).click();await phone.locator('.sentence-token[data-kind=sketch]').click();await expect(canvas).toHaveCount(0);
 await draft.fill('不要红色，不用画布局，整理客户需求。');await expect(phone.locator('.sentence-token')).toHaveCount(0);await expect(phone.getByRole('button',{name:'编辑手绘附件'})).toBeVisible();
 await expect(tablet.locator('.wb-message.user')).toHaveCount(0);await context.close();
});
test('sentence selection, emoji editing, undo and task switching preserve authoritative plain text',async({browser})=>{
 const {context,phone,tablet}=await setup(browser),draft=phone.getByLabel('手机 WorkBuddy 草稿');
 await draft.fill('红色😀，左侧计划，右侧成果。');await expect(phone.locator('.sentence-token[data-kind=color]')).toBeVisible();
 await phone.getByRole('button',{name:'全选',exact:true}).click();await phone.getByRole('button',{name:'键盘',exact:true}).click();await phone.getByRole('button',{name:'123',exact:true}).click();await phone.getByRole('button',{name:'2',exact:true}).click();
 await expect(draft).toHaveAttribute('data-value','2');await expect(tablet.getByLabel('WorkBuddy 任务输入')).toHaveValue('2');
 await phone.getByRole('button',{name:'撤销',exact:true}).click();await expect(draft).toHaveAttribute('data-value','红色😀，左侧计划，右侧成果。');
 await phone.getByRole('button',{name:'键盘',exact:true}).click();await phone.getByRole('button',{name:'新建输入任务'}).click();await expect(draft).toHaveAttribute('data-value','');await expect(phone.locator('.sentence-token')).toHaveCount(0);
 await draft.fill('录屏，选择格式，设置数量。');await phone.locator('.sentence-token[data-kind=recording]').click();await expect(phone.getByRole('button',{name:'开始录屏'})).toBeVisible();await expect(phone.getByRole('button',{name:'停止录屏'})).toHaveCount(0);await phone.getByRole('button',{name:'关闭采集方式'}).click();
 await phone.locator('.sentence-token[data-kind=count]').click();await phone.getByRole('button',{name:'3个',exact:true}).click();await phone.getByRole('button',{name:'确认参数'}).click();await expect(phone.locator('.sentence-token[data-kind=count]')).toHaveText('3个');
 await expect(tablet.locator('.wb-message.user')).toHaveCount(0);await context.close();
});

test('adopted screenshot occupies its original slot, remove preserves prose; composition stays editable',async({browser})=>{
 const {context,phone,tablet}=await setup(browser),draft=phone.getByLabel('手机 WorkBuddy 草稿');
 const text='请参考截图，整理客户要求。';await draft.fill(text);await phone.locator('.sentence-token[data-kind=screenshot]').click();await expect(phone.getByAltText('实际采集预览')).toBeVisible();await phone.getByRole('button',{name:'作为任务参考',exact:true}).click();await phone.getByRole('button',{name:'返回输入',exact:true}).click();
 await expect(phone.locator('.sentence-token[data-kind=screenshot] img.sentence-media')).toBeVisible();await expect(phone.locator('.capture-attachments')).toHaveCount(0);
 await phone.locator('.sentence-token[data-kind=screenshot]').click();await expect(phone.getByAltText('已采用的参考')).toBeVisible();await phone.getByRole('button',{name:'移除当前参考'}).click();await expect(phone.locator('.sentence-media')).toHaveCount(0);await expect(draft).toHaveAttribute('data-value',text);
 await draft.fill('');await draft.evaluate(el=>{el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));el.textContent='红';el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertCompositionText',data:'红',isComposing:true}));});await expect(tablet.getByLabel('WorkBuddy 任务输入')).toHaveValue('');
 await draft.evaluate(el=>{el.textContent='红色😀';el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'红色😀'}));});await expect(draft).toHaveAttribute('data-value','红色😀');await expect(tablet.getByLabel('WorkBuddy 任务输入')).toHaveValue('红色😀');await expect(phone.locator('.sentence-token[data-kind=color]')).toBeVisible();
 await expect(tablet.locator('.wb-message.user')).toHaveCount(0);await context.close();
});
