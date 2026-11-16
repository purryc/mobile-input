import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
const bindings=JSON.parse(readFileSync(new URL('../content/component-bindings.json',import.meta.url),'utf8')) as Record<string,{export:string;source:string}>;
const site=process.env.DESIGN_SYSTEM_URL||'http://127.0.0.1:5281/mobile-input/';
const reference=process.env.DESIGN_SYSTEM_REFERENCE_URL||'http://127.0.0.1:5283/mobile-input/tests/reference.html';
const properties=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','backgroundColor','backgroundImage','borderTopWidth','borderTopColor','borderRadius','padding','margin','gap','display','alignItems','justifyContent','boxShadow','opacity','width','height','transform'];
async function styles(page:Page){return page.locator('.preview-host').evaluate((root,properties)=>{
 // CSS minification omits a midpoint stop when its position is exactly implied.
 const canonical=(value:unknown)=>{
  if(typeof value!=='string'||!value.startsWith('linear-gradient('))return value;
  const stops=value.match(/rgba?\([^)]+\)(?: [-\d.]+%)?/g);
  if(stops?.length!==3)return value;
  const position=stops.map(stop=>stop.match(/([-\d.]+)%$/)?.[1]);
  if(position.some(item=>item===undefined)||Math.abs((Number(position[0])+Number(position[2]))/2-Number(position[1]))>1e-8)return value;
  return value.replace(stops[1],stops[1].replace(/ [-\d.]+%$/,''));
 };
 return Array.from(root.querySelectorAll('*')).filter(node=>!node.closest('[data-layout-slot]')&&node.getBoundingClientRect().width>0).map(node=>{const css=getComputedStyle(node);return {tag:node.tagName,class:node.getAttribute('class'),style:Object.fromEntries(properties.map(key=>[key,canonical(css[key as keyof CSSStyleDeclaration])]))};});},properties);}
test('all specimens retain the original product stylesheet cascade',async({page,context})=>{
 test.setTimeout(180_000);
 const original=await context.newPage();
 // Product CSS intentionally uses root asset URLs. Resolve those unchanged URLs
 // against this QA server's Pages base; a missing font must fail the comparison.
 await original.route(/\/(assets|reference-assets)\//,async route=>{
  const url=new URL(route.request().url());
  if(!/^\/(assets|reference-assets)\//.test(url.pathname))return route.continue();
  url.pathname='/mobile-input'+url.pathname;
  const response=await original.request.get(url.href);expect(response.ok(),url.href).toBe(true);
  await route.fulfill({response});
 });
 await page.setViewportSize({width:1280,height:844});await original.setViewportSize({width:1280,height:844});
 for(const [id,{export:name}] of Object.entries(bindings).filter(([,b])=>b.source.startsWith("packages/ui/"))){
  await page.goto(site+'#/components/'+id);await original.goto(reference+'?component='+name);
  await page.locator('.preview-host').waitFor();await original.locator('.preview-host').waitFor();
  await page.evaluate(()=>document.fonts.ready);await original.evaluate(()=>document.fonts.ready);
  for(const target of [page,original]){await target.mouse.move(0,0);expect(await target.evaluate(()=>Array.from(document.fonts).filter(face=>face.status==='error').map(face=>face.family))).toEqual([]);}
  expect(await page.evaluate(()=>Array.from(document.fonts).some(face=>face.family.includes('HarmonyOS Sans SC')))).toBe(true);
  if(id==='paint-color-picker')expect(await page.evaluate(()=>Array.from(document.fonts).some(face=>face.family.includes('HarmonyOS Sans SC')&&face.status==='loaded'))).toBe(true);
  // Initial pop-in animations finish before comparing the settled state.
  await page.waitForTimeout(650);
  for(const target of [page,original])await target.evaluate(()=>{for(const animation of document.getAnimations())if(animation.effect?.getComputedTiming().iterations===Infinity){animation.pause();animation.currentTime=0;}});
  expect.soft(await styles(page),id+' must match original application CSS').toEqual(await styles(original));
  const action=({'image-input':'选择图片','connection-error':'演示断连提示','text-selection-toolbar':'文字颜色','input-dock':'键盘','media-controls':'播放','paint-color-picker':'色环'} as Record<string,string>)[id];
  if(action){
   for(const target of [page,original])await target.getByRole('button',{name:action,exact:true}).click();
   for(const target of [page,original])await target.mouse.move(0,0);
   await page.waitForTimeout(180);
   expect.soft(await styles(page),id+' interactive state must match original application CSS').toEqual(await styles(original));
   if(id==='connection-error')await expect(page.getByRole('alertdialog')).toBeInViewport();
  }
 }
 await original.close();
});
