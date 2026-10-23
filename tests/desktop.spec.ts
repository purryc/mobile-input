import {test,expect} from '@playwright/test';

test('desktop keyboard has no search field and never filters or launches applications',async({page})=>{
 await page.goto('/?bridge=5191');
 const apps=page.getByRole('navigation',{name:'桌面应用'});
 await expect(apps.getByRole('button')).toHaveCount(9);
 await expect(page.locator('.hpc-clock')).toContainText(/\d{2}:\d{2}/);
 await page.screenshot({path:'artifacts/desktop-tray-2026-10-19.png'});
 await page.getByRole('button',{name:'虚拟键盘',exact:true}).click();
 const keyboard=page.getByRole('dialog',{name:'桌面小键盘'});
 await expect(keyboard).toBeVisible();
 await expect(keyboard.locator('input,textarea,[contenteditable=true]')).toHaveCount(0);
 for(const key of ['w','p','s','回车'])await keyboard.getByRole('button',{name:key,exact:true}).click();
 await expect(apps.getByRole('button')).toHaveCount(9);
 await keyboard.getByRole('button',{name:'大写切换'}).click();
 await expect(keyboard.getByRole('button',{name:'Q',exact:true})).toBeVisible();
 await keyboard.getByRole('button',{name:'切换字母数字'}).click();
 await expect(keyboard.getByRole('button',{name:'1',exact:true})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(keyboard).toHaveCount(0);
 await apps.getByRole('button',{name:'WPS',exact:true}).click();
 await expect(page.locator('.slides-editor')).toBeVisible();
});

test('compact keyboard and status tray fit the desktop',async({page})=>{
 await page.setViewportSize({width:1024,height:600});
 await page.goto('/?bridge=5191');
 await page.getByRole('button',{name:'虚拟键盘',exact:true}).click();
 const keyboard=page.getByRole('dialog',{name:'桌面小键盘'});
 const box=await keyboard.boundingBox(),tray=await page.locator('.hpc-status-tray').boundingBox();
 expect(box!.y).toBeGreaterThanOrEqual(0);
 expect(box!.y+box!.height).toBeLessThan(tray!.y);
 await keyboard.evaluate(async element=>{await Promise.all(element.getAnimations().map(a=>a.finished));});
 await page.screenshot({path:'artifacts/desktop-keys-only-2026-10-19.png'});
 await page.getByRole('button',{name:'收起虚拟键盘'}).click();
 await expect(keyboard).toHaveCount(0);
 await expect(page.getByRole('button',{name:'虚拟键盘',exact:true})).toBeFocused();
});
