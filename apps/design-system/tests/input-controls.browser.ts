import {test,expect} from '@playwright/test';
import {controlKinds} from '../../../packages/input-controls/src/types';
const site=process.env.DESIGN_SYSTEM_URL||'http://127.0.0.1:5297/mobile-input/';
test('all independent widget pages use original local resources and remain isolated from old specimens',async({page,context})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const isolated=await context.newPage();await page.setViewportSize({width:1280,height:1600});await isolated.setViewportSize({width:1280,height:1600});
 for(const kind of controlKinds){
  await page.goto(site+'#/components/input-'+kind);await expect(page.locator('.controls-preview')).toBeVisible();await expect(page.getByText('A2UI 未接入',{exact:true}).first()).toBeVisible();
  await page.locator('.ic-sentence-token').first().click();await expect(page.locator('.input-controls-popover')).toBeVisible();
  await expect.poll(()=>page.locator('.input-controls-popover img').evaluateAll(es=>es.every(e=>(e as HTMLImageElement).complete&&(e as HTMLImageElement).naturalWidth>0))).toBe(true);
  await isolated.goto('http://127.0.0.1:5199/#/'+kind);if(await isolated.getByRole('button',{name:'中文',exact:true}).count())await isolated.getByRole('button',{name:'中文',exact:true}).click();await isolated.locator('.ic-sentence-token').first().click();
  await page.mouse.move(0,0);await isolated.mouse.move(0,0);await page.waitForTimeout(200);
  const props=['fontSize','lineHeight','height','borderTopStyle','borderRadius','padding','backgroundColor','backgroundImage','gap','boxShadow'];
  for(const selector of ['.ic-sentence-token-face','.ic-live-wb-aux','.ic-live-wb-aux>header']){
    const get=(node:Element,keys:string[])=>Object.fromEntries(keys.map(k=>[k,(getComputedStyle(node) as any)[k]]));
    expect(await page.locator(selector).first().evaluate(get,props),kind+' '+selector).toEqual(await isolated.locator(selector).first().evaluate(get,props));
  }
 }
 expect(errors).toEqual([]);await isolated.close();
});
