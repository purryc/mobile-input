import {test,expect,type Page} from '@playwright/test';
async function runtime(page:Page,type:string,value?:unknown){return page.evaluate(async({type,value})=>{const r=await import(performance.getEntriesByType('resource').find(e=>/\/src\/runtime\.ts(?:\?|$)/.test(e.name))!.name);return r.command(type,value);},{type,value});}
async function state(page:Page){return page.evaluate(async()=>{const r=await import(performance.getEntriesByType('resource').find(e=>/\/src\/runtime\.ts(?:\?|$)/.test(e.name))!.name);return r.currentState();});}
async function pair(tablet:Page,phone:Page){
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();const pin=(await tablet.locator('.pair-code').innerText()).trim();await tablet.getByRole('button',{name:'关闭连接设置'}).click();
 await phone.goto('/?role=phone&bridge=5191');await phone.getByRole('radio',{name:'扫码网络建联',exact:false}).check();await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);
 await expect.poll(async()=>(await state(tablet)).inputSession?.phase).toBe('idle');
}
test('field entry from standby, phone reset removes both histories, stale replay cannot resurrect them',async({browser})=>{
 const tc=await browser.newContext(),pc=await browser.newContext({viewport:{width:390,height:844}}),tablet=await tc.newPage(),phone=await pc.newPage();await pair(tablet,phone);
 await runtime(tablet,'open','workbuddy');await tablet.getByLabel('WorkBuddy 任务输入',{exact:true}).click();
 await expect.poll(async()=>(await state(phone)).inputSession?.phase).toBe('active');await expect(phone.locator('.input-dock')).toBeVisible();await expect(phone.getByRole('button',{name:'开始使用',exact:true})).toHaveCount(0);
 const mode=phone.locator('.input-mode-key[aria-pressed=true]');if(await mode.count())await mode.click();
 await runtime(tablet,'open','mail');await runtime(tablet,'mail-compose','reply');
 await expect.poll(async()=>(await state(phone)).app).toBe('mail');const t=(await state(tablet)).target!;
 await tablet.evaluate(async(t)=>{const r=await import(performance.getEntriesByType('resource').find(e=>/\/src\/runtime\.ts(?:\?|$)/.test(e.name))!.name);await r.command('input','需要重置的测试邮件',{targetId:t.id,targetRevision:t.revision});},t);await runtime(tablet,'mail-send');
 await runtime(tablet,'open','workbuddy');await tablet.getByLabel('WorkBuddy 任务输入',{exact:true}).click();
 await expect(phone.locator('.input-dock')).toBeVisible();await expect(phone.locator('.input-dock.expanded')).toHaveCount(0);
 const old=await state(tablet);
 await phone.evaluate(()=>{localStorage.setItem('mobile-input:workbuddy-draft:phone:wb:draft:new',JSON.stringify({pending:true,text:'恢复缓存旧内容'}));sessionStorage.setItem('input-agent:pending-camera-v1','{"id":"old"}');});
 await phone.getByRole('button',{name:'连接设置',exact:true}).click();await phone.getByRole('button',{name:'重置演示',exact:true}).click();await phone.getByRole('button',{name:'确认重置',exact:true}).click();
 await expect.poll(async()=>(await state(tablet)).demoGeneration||0).toBeGreaterThan(0);
 await expect.poll(async()=>(await state(phone)).demoGeneration).toBe((await state(tablet)).demoGeneration);
 expect((await state(tablet)).mails.some(m=>m.body.includes('需要重置的测试邮件'))).toBe(false);
 expect((await state(tablet)).app).toBe('desktop');
 await phone.waitForTimeout(500);
 expect(await phone.evaluate(()=>localStorage.getItem('mobile-input:workbuddy-draft:phone:wb:draft:new'))).toBeNull();
 expect(await phone.evaluate(()=>sessionStorage.getItem('input-agent:pending-camera-v1'))).toBeNull();
 expect(await phone.evaluate(()=>localStorage.getItem('input-agent-connection-method'))).toBe('lan');
 await phone.evaluate(old=>window.dispatchEvent(new CustomEvent('native-message',{detail:{kind:'snapshot',state:old}})),old);
 expect((await state(phone)).app).toBe('desktop');
 await runtime(tablet,'open','workbuddy');await tablet.getByLabel('WorkBuddy 任务输入',{exact:true}).click();await expect(phone.locator('.input-dock')).toBeVisible();
 await tc.close();await pc.close();
});
test('a native build clears once, ordinary reload retains data, a new build clears again',async({page})=>{
 await page.addInitScript(()=>{(window as any).__INPUT_AGENT_BUILD__=Number(sessionStorage.getItem('test-build'))||101;});
 await page.goto('/?bridge=5191');await runtime(page,'open','notes');await page.evaluate(()=>{localStorage.setItem('mobile-input:test-history','old');localStorage.setItem('input-agent-connection-method','lan');});await page.waitForTimeout(400);
 await page.reload();expect((await state(page)).app).toBe('notes');expect(await page.evaluate(()=>localStorage.getItem('mobile-input:test-history'))).toBe('old');
 await page.evaluate(()=>sessionStorage.setItem('test-build','102'));await page.reload();expect((await state(page)).app).toBe('desktop');expect((await state(page)).demoGeneration).toBe(102);
 expect(await page.evaluate(()=>localStorage.getItem('mobile-input:test-history'))).toBeNull();expect(await page.evaluate(()=>localStorage.getItem('input-agent-connection-method'))).toBe('lan');
});
