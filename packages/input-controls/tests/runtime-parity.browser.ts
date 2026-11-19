import {test,expect} from '@playwright/test';
const sourceUrl=process.env.XIAOYI_DEMO_URL;
test('duration descendants match the real Xiaoyi composer, not the extracted showcase',async({page,context})=>{
 test.skip(!sourceUrl,'Set XIAOYI_DEMO_URL to the running original demo for runtime comparison.');
 const source=await context.newPage();await source.goto(sourceUrl+'?language=zh');await source.locator('[contenteditable=true]').first().fill('演讲时长10分钟。');await source.locator('.sentence-token').first().click();
 await page.goto('/compact.html#/duration');const chip=page.locator('[data-widget=duration] [data-example=default-selected] .ic-sentence-token');await chip.click();
 const panel=page.locator('.input-controls-popover');
 await Promise.all([page.evaluate(()=>document.fonts.ready),source.evaluate(()=>document.fonts.ready)]);
 const props=['fontSize','fontWeight','lineHeight','color','display','alignItems','justifyContent','border','borderRadius','backgroundColor','backgroundImage','boxShadow','width','height','minHeight','padding','gap'];
 const read=(el:Element,keys:string[])=>Object.fromEntries(keys.map(k=>[k,(getComputedStyle(el) as any)[k]]));
 for(const selector of ['.live-wb-duration','.live-wb-duration button:first-child','.live-wb-duration button:last-child','.live-wb-duration input','.live-wb-duration label span','.demo-duration-done']){
  expect(await panel.locator(selector.replaceAll('.', '.ic-')).first().evaluate(read,props),selector).toEqual(await source.locator(selector).first().evaluate(read,props));
 }
 await expect(panel.locator('.ic-live-wb-duration button').first()).toHaveCSS('border-top-style','none');
 await panel.getByRole('button',{name:'增加一分钟',exact:true}).click();await expect(chip).toContainText('11分钟');await panel.getByRole('button',{name:'减少一分钟',exact:true}).click();await panel.getByRole('button',{name:'完成选择',exact:true}).click();await expect(page.locator('.input-controls-popover')).toHaveCount(0);await source.close();
});
