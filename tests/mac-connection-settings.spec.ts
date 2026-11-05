import {test,expect} from '@playwright/test';
for(const height of [844,700])test(`settings language first, staged Bluetooth and QR flows at 390x${height}`,async({page})=>{
 await page.setViewportSize({width:390,height});
 await page.addInitScript(()=>{localStorage.setItem('input-agent-control-destination','mac');const w=window as any;w.discoveryCalls=0;w.MobileNative={role:()=> 'phone',discover:()=>'',transportMode:()=> 'lan',layoutInsets:()=>'',macClose:()=>'',macBluetoothDiscover:()=>{w.discoveryCalls++;setTimeout(()=>window.dispatchEvent(new CustomEvent('native-mac-bluetooth',{detail:{phase:'idle',message:'',devices:[{id:'bt-AABBCCDDEEFF',name:'Test Mac',paired:true}]}})),20);return 'searching';},scan:()=>{w.scans=(w.scans||0)+1;return 'scanning';}};});
 await page.goto('/?role=phone&bridge=5191');const dialog=page.locator('.agent-connection-panel');await expect(dialog).toBeVisible();
 expect((await dialog.getByText('界面语言',{exact:true}).boundingBox())!.y).toBeLessThan((await dialog.locator('.connection-target-row').boundingBox())!.y);
 await expect(page.getByRole('button',{name:'扫描 Mac 二维码',exact:true})).toHaveCount(0);
 await page.getByRole('radio',{name:'蓝牙 不需要同一 Wi-Fi'}).check();await expect(page.locator('.mac-connection-settings .connection-method[data-selected=true]')).toHaveCSS('border-top-color','rgb(71, 136, 238)');await dialog.evaluate(e=>e.scrollTop=0);await page.screenshot({path:`artifacts/bluetooth/settings-zh-${height}.png`});await expect.poll(()=>page.evaluate(()=>(window as any).discoveryCalls)).toBe(0);await page.getByRole('button',{name:'继续',exact:true}).click();await expect(page.getByRole('button',{name:'Test Mac 已配对'})).toBeVisible();
 await page.getByRole('button',{name:'连接方式',exact:true}).click();await page.getByRole('radio',{name:'Wi-Fi 扫描电脑二维码'}).check();await page.getByRole('button',{name:'继续',exact:true}).click();await expect(page.getByRole('button',{name:'扫描 Mac 二维码',exact:true})).toBeVisible();
 await page.getByRole('radio',{name:'English',exact:true}).check();await expect(page.getByRole('button',{name:'Scan Mac QR code',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Connection method',exact:true}).click();await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeVisible();
 await dialog.evaluate(e=>e.scrollTop=0);await page.screenshot({path:`artifacts/bluetooth/settings-en-${height}.png`});
});
