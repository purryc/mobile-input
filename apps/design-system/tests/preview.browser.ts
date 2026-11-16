import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const bindings=JSON.parse(readFileSync(new URL('../content/component-bindings.json',import.meta.url),'utf8'));
const url=process.env.DESIGN_SYSTEM_URL||'http://127.0.0.1:5281/mobile-input/';
test('live playground selects and edits atomically without execution controls',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'#/a2ui/sandbox');
 await expect(page.getByRole('button',{name:'运行',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:/逐步/})).toHaveCount(0);
 await page.getByLabel('A2UI 示例').selectOption('DurationInput');
 await expect(page.getByLabel('演讲时长（分钟）')).toHaveValue('10');
 await page.getByLabel('增加一分钟').click();await expect(page.getByLabel('演讲时长（分钟）')).toHaveValue('11');
 await page.getByLabel('A2UI 示例').selectOption('ActionChip');
 await expect(page.getByLabel('演讲时长（分钟）')).toHaveCount(0);
 await expect(page.locator('.sandbox-live-preview').getByRole('button',{name:'添加材料 / Add material',exact:true})).toHaveCount(1);
 await page.getByText('查看或修改 A2UI 描述',{exact:true}).click();
 const editor=page.getByLabel('A2UI 消息',{exact:false});const original=await editor.inputValue();
 await editor.fill('{');await expect(page.locator('.sandbox-validation')).toBeVisible();await expect(page.locator('.sandbox-live-preview').getByRole('button',{name:'添加材料 / Add material',exact:true})).toHaveCount(0);
 await editor.fill(original);await expect(page.locator('.sandbox-live-preview').getByRole('button',{name:'添加材料 / Add material',exact:true})).toHaveCount(1);
 await page.getByLabel('A2UI 示例').selectOption('ImageInput');await page.getByRole('button',{name:'选择图片',exact:true}).click();await expect(page.getByRole('button',{name:'确认图片选择'})).toBeVisible();
 await page.getByRole('button',{name:'确认图片选择'}).click();await page.getByLabel('A2UI 示例').selectOption('DurationInput');
 await page.waitForTimeout(800);await expect(page.getByLabel('演讲时长（分钟）')).toHaveValue('10');
 await page.getByText('检查数据与事件',{exact:true}).click();await expect(page.locator('.inspector')).not.toContainText('attachment.sync');
 expect(errors).toEqual([]);
 expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);
});
test('all extracted specimens render without exceptions or missing local assets',async({page})=>{
 test.setTimeout(180000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const bad:string[]=[];
 page.on('response',r=>{if(r.status()>=400)bad.push(r.url());});
 for(const width of [1280,390])for(const id of Object.keys(bindings).filter(id=>bindings[id].source.startsWith("packages/ui/"))){
  await page.setViewportSize({width,height:900});
  await page.goto(url+'#/components/'+id);await expect(page.getByRole('heading',{name:bindings[id].zh,exact:true,level:1})).toBeVisible();await expect(page.locator('.specimen .preview-host')).toBeVisible();
  await expect(page.locator('.specimen .preview-host')).not.toBeEmpty();
  await expect.poll(()=>page.locator('.specimen .preview-host img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).complete&&(image as HTMLImageElement).naturalWidth>0)),{message:id+' assets'}).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth),id).toBeLessThanOrEqual(width);
  expect(await page.evaluate(()=>Object.keys(localStorage)),id).toEqual([]);
 }
 expect(errors).toEqual([]);expect(bad).toEqual([]);
});
test('reusable dock, media and selection fixtures are interactive and isolated',async({page})=>{
 await page.goto(url+'#/components/input-dock');await page.getByRole('button',{name:'键盘',exact:true}).click();
 await page.getByRole('button',{name:'Q',exact:true}).click();await expect(page.getByLabel('本地草稿')).toHaveValue('Demoq');
 await page.getByRole('button',{name:'触控板',exact:true}).click();await expect(page.getByLabel('触控区域',{exact:true})).toBeVisible();
 await page.goto(url+'#/components/media-controls');await page.getByRole('button',{name:'播放',exact:true}).click();await expect(page.getByRole('button',{name:'暂停',exact:true})).toBeVisible();
 await page.goto(url+'#/components/text-selection-toolbar');await page.getByRole('button',{name:'加粗',exact:true}).click();await expect(page.getByRole('button',{name:'加粗',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.goto(url+'#/components/input-dock');await expect(page.getByLabel('本地草稿')).toHaveValue('Demo');
});
test('mobile preview starts visible and fits the viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(url+'#/a2ui/sandbox/DurationInput');
 await expect(page.getByLabel('演讲时长（分钟）')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.getByRole('button',{name:'切换到英文'}).click();await expect(page.getByLabel('Presentation duration (minutes)')).toBeVisible();
 await page.screenshot({path:'artifacts/design-system/live-mobile.png',fullPage:true});
});

test('brush selection has one active tool and eraser disables color edits',async({page})=>{
 await page.goto(url+'#/components/painting-visual-brush-console');
 const tools=page.locator('.paint-brushes');
 await expect(tools.locator('[aria-pressed=true]')).toHaveCount(1);
 await expect(tools.getByRole('button',{name:'铅笔',exact:true})).toHaveAttribute('aria-pressed','true');
 await tools.getByRole('button',{name:'水彩',exact:true}).click();await expect(tools.locator('[aria-pressed=true]')).toHaveCount(1);
 await expect(tools.getByRole('button',{name:'水彩',exact:true})).toHaveAttribute('aria-pressed','true');
 await tools.getByRole('button',{name:'橡皮',exact:true}).click();await expect(page.getByLabel('颜色 HEX',{exact:true})).toBeDisabled();
});
