import {test, expect} from '@playwright/test';
import {demoScenarios} from '../packages/core/workbuddy-demo-scenarios';
const editor=(page:any)=>page.locator('.wb-sentence-composer');
const recommended=(page:any)=>page.locator('.sentence-token-capsule[data-origin="recommended"]:not([data-preparing])');
async function open(page:any){await page.goto('/?controls=all&debug=1&language=zh');await expect(editor(page)).toBeVisible();await page.clock.install();}
for(const scenario of demoScenarios)test('pause and source-only copy '+scenario.id,async({page})=>{
 await open(page);await editor(page).fill(scenario.text);
 await page.clock.runFor(999);await expect(recommended(page)).toHaveCount(0);
 await page.clock.runFor(2);
 const pending=page.locator('[data-preparing="true"]');
 const expected=scenario.id==='explicit'?0:scenario.id==='mixed'?3:15;
 await expect(pending).toHaveCount(expected);
 const widths=await pending.evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().width));
 await page.clock.runFor(399);await expect(pending).toHaveCount(0);await expect(recommended(page)).toHaveCount(expected);
 expect(await recommended(page).evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().width))).toEqual(widths);
 expect(await editor(page).textContent()).not.toContain('（推荐');
 expect(await page.locator('.sentence-token-hit > .demo-chip-remove').count()).toBe(0);
 const copied=await editor(page).evaluate((el:any)=>{const r=document.createRange();r.selectNodeContents(el);getSelection()!.removeAllRanges();getSelection()!.addRange(r);const data=new DataTransfer();el.dispatchEvent(new ClipboardEvent('copy',{clipboardData:data,bubbles:true,cancelable:true}));return data.getData('text/plain')});
 expect(copied).toBe(scenario.text);
 await page.clock.runFor(1500);await page.reload();await expect(editor(page)).toBeVisible();await expect(recommended(page)).toHaveCount(expected);
 await expect(page.locator('[data-preparing="true"], [data-sweep="true"]')).toHaveCount(0);
});
test('continued input cancels loading and switching drafts never adopts late candidates',async({page})=>{
 await open(page);await editor(page).fill('请准备简短的演讲报告。');await page.clock.runFor(1100);await expect(page.locator('[data-preparing=true]')).toHaveCount(1);
 await editor(page).fill('请准备10分钟的演讲报告。');await page.clock.runFor(1600);
 await expect(recommended(page)).toHaveCount(0);await expect(page.locator('.sentence-token[data-kind=duration]')).toBeVisible();
 await editor(page).fill('请准备简短的演讲报告，内容需要可靠的产品资料支撑。');await page.clock.runFor(1100);
 await page.getByRole('button',{name:'新建演示',exact:true}).click();await page.clock.runFor(1500);
 await expect(recommended(page)).toHaveCount(0);await expect(page.locator('.demo-materials')).toHaveCount(0);await expect(editor(page)).toHaveAttribute('data-value','');
});
test('send during loading excludes hidden suggestions and real sample bytes',async({page})=>{
 await open(page);let body:any;
 await page.route('**/api/workbuddy-demo/generate',async route=>{body=route.request().postDataJSON();await route.fulfill({contentType:'application/x-ndjson',body:'{"done":true}\n'});});
 await editor(page).fill('请准备简短的演讲报告，内容需要可靠的产品资料支撑。');await page.clock.runFor(1100);
 await expect(page.locator('[data-preparing=true]')).toHaveCount(2);
 await page.locator('.demo-send').click();await expect.poll(()=>body).toBeTruthy();
 expect(body.sources).toHaveLength(0);expect(body.parameters).toHaveLength(0);expect(JSON.stringify(body)).not.toContain('product-brief');expect(body.text).not.toMatch(/10分钟|duration:|演讲时长:/);
 await page.clock.runFor(3000);await expect(recommended(page)).toHaveCount(0);await expect(page.locator('[data-preparing=true]')).toHaveCount(0);
});
test('internal remove is independently keyboard operable and does not open a panel',async({page})=>{
 await open(page);await editor(page).fill('请准备简短的演讲报告。');await page.clock.runFor(1400);
 const capsule=recommended(page).first();expect(await capsule.locator('button').count()).toBe(2);
 await capsule.locator('.sentence-token').focus();await page.keyboard.press('Tab');await expect(capsule.locator('.demo-chip-remove')).toBeFocused();await page.keyboard.press('Enter');
 await expect(recommended(page)).toHaveCount(0);await expect(page.locator('.demo-widget-wrap')).toHaveCount(0);await expect(editor(page)).toHaveAttribute('data-value','请准备简短的演讲报告。');
 await page.clock.runFor(3000);await expect(recommended(page)).toHaveCount(0);
});
test('reduced motion suppresses loading and perimeter animations',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await open(page);await editor(page).fill('请准备简短的演讲报告。');await page.clock.runFor(1000);
 expect(await page.locator('[data-preparing=true]').evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('none');await page.clock.runFor(400);
 expect(await recommended(page).evaluate(el=>getComputedStyle(el,'::after').animationName)).toBe('none');
});

test('visibility resumes pending suggestions and rephrasing retains visible values without replay',async({page})=>{
 await open(page);await editor(page).fill('请准备简短的演讲报告。');await page.clock.runFor(1100);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.clock.runFor(2000);await expect(recommended(page)).toHaveCount(0);await expect(page.locator('[data-preparing=true]')).toHaveCount(0);
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
 await page.clock.runFor(1400);await expect(recommended(page)).toHaveCount(1);await page.clock.runFor(1500);
 await editor(page).fill('请准备精炼的口头汇报。');await expect(recommended(page)).toHaveCount(1);await expect(page.locator('[data-sweep=true]')).toHaveCount(0);
 await page.clock.runFor(3000);await expect(page.locator('[data-preparing=true]')).toHaveCount(0);
});
test('blocked send resumes suggestions while pending materials stay owned',async({page})=>{
 await open(page);await editor(page).fill('添加产品图片。');await page.locator('.sentence-token[data-kind=photo]').click();
 const choose=page.waitForEvent('filechooser');await page.getByRole('button',{name:'选择图片',exact:true}).click();
 await (await choose).setFiles({name:'pending.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8i8AAAAASUVORK5CYII=','base64')});
 await page.getByRole('button',{name:'关闭辅助输入',exact:true}).click();
 await editor(page).fill('添加产品图片，准备简短的演讲报告。');await page.clock.runFor(1100);await page.locator('.demo-send').click();
 await page.clock.runFor(1400);await expect(recommended(page)).toHaveCount(1);await expect(page.getByRole('button',{name:'确认图片选择',exact:true})).toBeVisible();
});
