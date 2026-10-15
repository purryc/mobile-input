import {test,expect} from '@playwright/test';
test('method-first panel hides QR and manual inputs, preserves choice, and fits phone',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/?role=phone&bridge=5191');
 await expect(page.getByRole('radio')).toHaveCount(2);await expect(page.getByLabel('配对码',{exact:true})).toHaveCount(0);
 await page.getByRole('radio',{name:'鸿蒙分布式',exact:false}).check();await expect(page.getByRole('heading',{name:'附近设备'})).toBeVisible();await expect(page.getByLabel('平板地址')).toHaveCount(0);
 await page.getByRole('button',{name:'刷新附近设备'}).click();await expect(page.getByText('请在手机或平板的 Input Agent 中连接鸿蒙设备',{exact:true})).toBeVisible();
 await page.screenshot({animations:'disabled',path:'artifacts/distributed-connection/browser-distributed.png'});
 await page.getByRole('radio',{name:'扫码网络建联',exact:false}).check();await expect(page.getByLabel('平板地址')).toBeVisible();await expect(page.getByRole('heading',{name:'附近设备'})).toHaveCount(0);
 await page.getByLabel('配对码',{exact:true}).fill('123456');await page.getByRole('button',{name:'关闭连接设置'}).click();await page.getByRole('button',{name:'连接设置',exact:true}).click();await expect(page.getByLabel('配对码',{exact:true})).toHaveValue('123456');
 const box=(await page.getByRole('dialog').boundingBox())!;expect(box.width).toBeLessThanOrEqual(390);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(844);
 await page.screenshot({animations:'disabled',path:'artifacts/distributed-connection/browser-network.png'});
});
test('tablet QR is only visible for selected network mode and disappears on distributed switch',async({page})=>{
 await page.goto('/?bridge=5191');await page.getByRole('button',{name:'连接设置',exact:true}).click();await expect(page.getByAltText('配对二维码')).toHaveCount(0);
 await page.getByRole('radio',{name:'扫码网络建联',exact:false}).check();await expect(page.getByAltText('配对二维码')).toBeVisible();
 await page.getByRole('radio',{name:'鸿蒙分布式',exact:false}).check();await expect(page.getByAltText('配对二维码')).toHaveCount(0);await expect(page.getByRole('heading',{name:'附近设备'})).toBeVisible();
});
