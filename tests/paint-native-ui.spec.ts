import {test,expect} from '@playwright/test';
test('native GoPaint structure, floating panels, real opacity, color and layered Back',async({page})=>{
 await page.goto('/?bridge=5191');
 await page.evaluate(async()=>{const r=await import(performance.getEntriesByType('resource').find(e=>/\/src\/runtime\.ts(?:\?|$)/.test(e.name))!.name);await r.command('open','paint');});
 await expect(page.locator('.scene-paint .systembar')).toHaveCount(0);await expect(page.locator('.scene-paint .windowbar')).toBeHidden();await expect(page.getByRole('dialog',{name:'图层面板'})).toHaveCount(0);
 const canvas=(await page.getByLabel('绘画画布').boundingBox())!,rail=(await page.getByRole('toolbar',{name:'绘画工具',exact:true}).boundingBox())!;expect(canvas.width).toBeGreaterThan(1300);expect(rail.x).toBeLessThan(25);expect(rail.height).toBeGreaterThan(500);
 const back=(await page.getByRole('button',{name:'返回',exact:true}).boundingBox())!;expect(back.width).toBeGreaterThanOrEqual(48);expect(back.height).toBeGreaterThanOrEqual(48);
 const pair=(await page.locator('.agent-status-area .agent-connection').boundingBox())!,edit=(await page.getByRole('toolbar',{name:'编辑工具'}).boundingBox())!;expect(edit.x+edit.width).toBeLessThan(pair.x);
 await page.screenshot({path:'artifacts/paint-ui/replica-canvas.png'});
 await page.getByRole('button',{name:'笔刷库',exact:true}).click();await expect(page.getByRole('dialog',{name:'笔刷库'})).toBeVisible();await page.getByRole('button',{name:'水彩',exact:true}).first().click();await page.getByRole('button',{name:'水彩',exact:true}).last().click();await page.screenshot({path:'artifacts/paint-ui/replica-brush.png'});
 await page.getByRole('button',{name:'颜色',exact:true}).click();await expect(page.getByRole('dialog',{name:'笔刷库'})).toHaveCount(0);await page.getByLabel('平板颜色 HEX').fill('#F76D95');await page.getByRole('button',{name:'色环',exact:true}).click();await expect(page.locator('.gp-color-ring')).toBeVisible();await page.getByRole('button',{name:'色盘',exact:true}).click();await page.screenshot({path:'artifacts/paint-ui/replica-color.png'});
 await page.getByLabel('平板笔刷不透明度').fill('35');await expect.poll(()=>page.evaluate(async()=>{const r=await import(performance.getEntriesByType('resource').find(e=>/\/src\/runtime\.ts(?:\?|$)/.test(e.name))!.name);return r.currentState().paint.opacity;})).toBe(35);
 await page.getByRole('button',{name:'图层',exact:true}).click();await expect(page.getByRole('dialog',{name:'颜色面板'})).toHaveCount(0);await page.screenshot({path:'artifacts/paint-ui/replica-layers.png'});await expect(page.locator('.gp-layer-thumbnail canvas')).toHaveCount(3);
 await page.getByRole('button',{name:'返回',exact:true}).click();await expect(page.getByRole('dialog',{name:'图层面板'})).toHaveCount(0);await expect(page.getByLabel('绘画画布')).toBeVisible();await page.getByRole('button',{name:'返回',exact:true}).click();await expect(page.locator('.scene-desktop')).toBeVisible();
});
