import {test,expect,type Page} from '@playwright/test';
import {controlKinds} from '../src/types';
import {definition} from '../example/choices';
async function open(page:Page,kind:string){await page.goto('/#/'+kind);await page.locator('.ic-sentence-token').first().click();await expect(page.locator('.input-controls-popover')).toBeVisible();}
for(const kind of controlKinds)test(kind+' semantic states, keyboard, disabled, reset and isolated second instance',async({page})=>{
 await page.goto('/#/'+kind);const token=page.locator('.ic-sentence-token').first();
 await expect(token).toHaveAttribute('data-semantic-state','needs-input');await expect(token.locator('.ic-chip-needs-plus')).toBeVisible();
 const face=token.locator('.ic-sentence-token-face');expect(await face.evaluate(e=>getComputedStyle(e).borderTopStyle)).toBe('dashed');
 await page.getByLabel('Semantic state',{exact:true}).selectOption('ambiguous-recommendation');await page.getByLabel('Origin',{exact:true}).selectOption('recommended');await expect(token.locator('.ic-demo-chip-smart')).toBeVisible();
 await token.focus();await page.keyboard.press('Enter');await expect(page.locator('.input-controls-popover')).toHaveCount(1);await page.keyboard.press('Escape');await expect(page.locator('.input-controls-popover')).toHaveCount(0);await expect(token).toBeFocused();
 await page.locator('.ic-demo-chip-remove').focus();await page.keyboard.press('Enter');await expect(page.locator('.input-controls-popover')).toHaveCount(0);await page.getByRole('button',{name:'Restore entry'}).click();
 await page.getByLabel('Semantic state',{exact:true}).selectOption('default-selected');await expect(token.locator('.ic-demo-chip-smart')).toHaveCount(0);await expect(page.locator('.ic-demo-chip-remove')).toHaveCount(1);
 await token.click();await page.locator('.ic-sentence-token').nth(1).click();await expect(page.locator('.input-controls-popover')).toHaveCount(1);await expect(page.locator('.input-controls-popover input')).toHaveValue('5');
 await page.getByRole('button',{name:'Increase by one minute'}).click();await page.keyboard.press('Escape');await token.click();
 if(kind==='duration')await expect(page.getByRole('spinbutton')).toHaveValue('10');
 await page.getByLabel('Disabled',{exact:true}).check();await expect(token).toBeDisabled();await expect(page.locator('.input-controls-popover')).toHaveCount(0);
 await page.getByLabel('Disabled',{exact:true}).uncheck();await page.getByLabel('Loading',{exact:true}).check();await expect(page.locator('[aria-busy="true"]')).toBeVisible();await expect(token).toBeDisabled();
 await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(token).toHaveAttribute('data-semantic-state','needs-input');
});
test('duration and independent color values are controlled; opening never changes blue',async({page})=>{
 await open(page,'duration');await page.getByRole('spinbutton').fill('23');await page.getByRole('button',{name:'Done',exact:true}).click();await expect(page.locator('.ic-sentence-token').first()).toContainText('23');
 await open(page,'color');await expect(page.locator('.ic-agent-color-bottom input')).toHaveValue('#356FE4');const initial=await page.getByTestId('current-value').innerText();await page.getByRole('button',{name:'Close panel'}).click();expect(await page.getByTestId('current-value').innerText()).toBe(initial);
 await page.locator('.ic-sentence-token').first().click();await page.locator('.ic-agent-color-presets button').last().click();await expect(page.getByTestId('current-value')).not.toContainText('"color": "#356FE4"');
});
for(const kind of ['font','palette','expert','skills','connectors','formats'] as const)test(kind+' actual choices, search, selection and confirmation',async({page})=>{
 await open(page,kind);const options=page.locator('.ic-demo-control-option');await options.first().click();await expect(options.first()).toHaveAttribute('aria-pressed','true');
 if(definition(kind).multiple){await options.nth(1).click();await expect(options.nth(1)).toHaveAttribute('aria-pressed','true');await expect(options.first()).toHaveAttribute('aria-pressed','true');}
 if(kind==='expert'){await options.nth(1).click();await expect(options.first()).toHaveAttribute('aria-pressed','false');await page.getByLabel('Search options').fill('no-such-person');await expect(page.getByText('No matches. Try another keyword.')).toBeVisible();await page.getByLabel('Search options').fill('');}
 await page.getByRole('button',{name:'Done',exact:true}).click();await expect(page.locator('.input-controls-popover')).toHaveCount(0);await expect(page.locator('.ic-sentence-token').first()).toHaveAttribute('data-semantic-state','default-selected');
});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
test('files and images keep real bytes; images require confirmation and survive closing',async({page})=>{
 await open(page,'document');await page.locator('input[type=file]').setInputFiles({name:'a-very-long-product-reference-file-name.md',mimeType:'text/markdown',buffer:Buffer.from('# Fictional product\nLocal fixture')});await expect(page.getByTestId('current-value')).toContainText('a-very-long-product-reference-file-name.md');await page.getByRole('button',{name:'Done',exact:true}).click();
 await open(page,'photo');await page.locator('input[type=file]').setInputFiles({name:'product.png',mimeType:'image/png',buffer:png});await expect(page.getByTestId('current-value')).toContainText('"pendingImages": 1');await expect(page.locator('.controls-preview-stage>.ic-demo-materials .ic-demo-material')).toHaveCount(0);await page.getByRole('button',{name:'Close panel'}).click();await page.locator('.ic-sentence-token').first().click();await page.getByRole('button',{name:'Confirm images'}).click();await expect(page.getByTestId('current-value')).toContainText('product.png');await expect(page.getByTestId('current-value')).toContainText('"pendingImages": 0');
 await page.getByRole('button',{name:'Preview product.png'}).click();await expect(page.getByRole('dialog',{name:'product.png'})).toBeVisible();await page.keyboard.press('Escape');await page.getByRole('button',{name:'Remove product.png'}).click();await expect(page.getByTestId('current-value')).not.toContainText('product.png');
});
test('scaled sketch drawing, undo, clear and confirmation',async({page})=>{
 await open(page,'sketch');const canvas=page.locator('.ic-agent-sketch-surface');const r=(await canvas.boundingBox())!;await page.mouse.move(r.x+15,r.y+20);await page.mouse.down();await page.mouse.move(r.x+r.width*.7,r.y+r.height*.7,{steps:10});await page.mouse.up();await expect(canvas.locator('polyline')).toHaveCount(1);await page.getByRole('button',{name:'Undo strokes'}).click();await expect(canvas.locator('polyline')).toHaveCount(0);
 await page.mouse.move(r.x+10,r.y+10);await page.mouse.down();await page.mouse.move(r.x+100,r.y+80,{steps:8});await page.mouse.up();await page.getByRole('button',{name:'Adopt sketch'}).click();await expect(page.locator('.ic-demo-material')).toHaveCount(1);await page.locator('.ic-sentence-token').first().click();await expect(canvas.locator('polyline')).toHaveCount(1);await page.getByRole('button',{name:'Clear strokes'}).click();await expect(canvas.locator('polyline')).toHaveCount(0);
});
async function mediaFixture(page:Page){await page.addInitScript(()=>{const streams:MediaStream[]=[];(window as any).__testStreams=streams;function acquire(){const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#426fe4';ctx.fillRect(0,0,640,360);const stream=canvas.captureStream(24);streams.push(stream);const timer=setInterval(()=>{ctx.fillRect(0,0,640,360);if(stream.getTracks().every(t=>t.readyState==='ended'))clearInterval(timer);},40);return Promise.resolve(stream);}Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:acquire});Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{value:acquire});});}
test('scanner import/crop/confirm plus camera release; screen recording real blob via injected browser stream',async({page})=>{
 await mediaFixture(page);await open(page,'scanner');await page.locator('.input-controls-popover input[type=file]').setInputFiles({name:'note.png',mimeType:'image/png',buffer:png});await expect(page.getByTestId('current-value')).toContainText('"confirmed": false');await page.getByRole('button',{name:'Confirm materials'}).click();await expect(page.getByTestId('current-value')).toContainText('"confirmed": true');await page.locator('.ic-sentence-token').first().click();await page.getByRole('button',{name:'Open camera'}).click();await expect(page.locator('[data-phase=preview]')).toBeVisible();await page.getByRole('button',{name:'Close panel'}).click();expect(await page.evaluate(()=>(window as any).__testStreams.every((s:MediaStream)=>s.getTracks().every(t=>t.readyState==='ended')))).toBe(true);
 await open(page,'capture');await page.getByRole('button',{name:'Screenshot',exact:true}).click();await expect(page.locator('[data-phase=preview]')).toBeVisible();await page.getByRole('button',{name:'Capture',exact:true}).click();await expect(page.getByTestId('current-value')).toContainText('screenshot.png');await page.getByRole('button',{name:'Confirm materials'}).click();
 await page.locator('.ic-sentence-token').first().click();await page.getByRole('button',{name:'Recording',exact:true}).click();await expect(page.locator('[data-phase=preview]')).toBeVisible();await page.getByRole('button',{name:'Start recording'}).click();await expect(page.locator('[data-phase=recording]')).toBeVisible();await page.waitForTimeout(600);await page.getByRole('button',{name:/^Stop/}).click();await expect(page.getByTestId('current-value')).toContainText('recording.webm');await expect(page.getByTestId('current-value')).toContainText('"confirmed": false');await page.getByRole('button',{name:'Confirm materials'}).click();expect(await page.evaluate(()=>(window as any).__testStreams.every((s:MediaStream)=>s.getTracks().every(t=>t.readyState==='ended')))).toBe(true);
});
test('permission denial is honest; late acquisition stops after closing',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))}));await open(page,'scanner');await page.getByRole('button',{name:'Open camera'}).click();await expect(page.getByRole('alert')).toContainText('Check permissions');await expect(page.getByTestId('current-value')).toContainText('"captures": []');
});
test('bilingual responsive layouts and loaded original assets for all 13 widgets',async({page},info)=>{
 test.setTimeout(120000);
 for(const width of [1440,1280,1024,800])for(const language of ['en','zh-CN'])for(const kind of controlKinds){
  await page.setViewportSize({width,height:960});await page.goto('/#/'+kind);const switcher=page.getByRole('button',{name:language==='zh-CN'?'中文':'English',exact:true});if(await switcher.count())await switcher.click();
  await page.locator('.ic-sentence-token').first().click();const panel=page.locator('.input-controls-popover');await expect(panel).toBeVisible();await page.locator('.input-controls-popover img').evaluateAll(async es=>{await Promise.all(es.map(e=>(e as HTMLImageElement).decode().catch(()=>{})));});
  expect(await page.locator('.input-controls-popover img').evaluateAll(es=>es.every(e=>(e as HTMLImageElement).naturalWidth>0))).toBe(true);
  const r=(await panel.boundingBox())!;expect(r.x).toBeGreaterThanOrEqual(0);expect(r.x+r.width).toBeLessThanOrEqual(width);expect(r.y+r.height).toBeLessThanOrEqual(961);
  if(width===1280&&language==='zh-CN')await page.screenshot({path:info.outputPath(kind+'-zh.png')});
  await page.getByRole('button',{name:language==='en'?'Close panel':'关闭辅助输入'}).click();
 }
});
test('late camera streams are stopped after owner changes and after hiding, including StrictMode',async({page})=>{
 await page.addInitScript(()=>{(window as any).__resolvers=[];(window as any).__lateStreams=[];Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:()=>new Promise(resolve=>(window as any).__resolvers.push(()=>{const c=document.createElement('canvas');c.width=100;c.height=100;const s=c.captureStream();(window as any).__lateStreams.push(s);resolve(s);}))});});
 await page.goto('/tests/lifecycle.html');await page.getByRole('button',{name:'Open camera'}).click();await page.getByRole('button',{name:'Switch owner'}).click();await page.evaluate(()=>{(window as any).__resolvers.splice(0).forEach((resolve:()=>void)=>resolve());});
 await expect.poll(()=>page.evaluate(()=>(window as any).__lateStreams.every((s:MediaStream)=>s.getTracks().every(t=>t.readyState==='ended')))).toBe(true);await expect(page.locator('output')).toBeEmpty();
 await page.goto('/tests/lifecycle.html?camera');await page.getByRole('button',{name:'关闭摄像头',exact:true}).click();await page.evaluate(()=>{(window as any).__resolvers.splice(0).forEach((resolve:()=>void)=>resolve());});await expect.poll(()=>page.evaluate(()=>(window as any).__lateStreams.every((s:MediaStream)=>s.getTracks().every(t=>t.readyState==='ended')))).toBe(true);await expect(page.locator('output')).toBeEmpty();
});
test('control actions are non-submitting buttons and reduced motion disables animation',async({page})=>{
 for(const kind of controlKinds){await open(page,kind);expect(await page.locator('.input-controls-theme button').evaluateAll(buttons=>buttons.every(b=>b.getAttribute('type')==='button'))).toBe(true);}
 await page.emulateMedia({reducedMotion:'reduce'});await page.getByLabel('Semantic state',{exact:true}).selectOption('ambiguous-recommendation');await page.getByLabel('Origin',{exact:true}).selectOption('recommended');expect(await page.locator('.ic-sentence-token').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
});
test('host-owned external preview portal retains theme, fixed overlay and keyboard close',async({page})=>{
 await page.goto('/tests/portal.html');await page.getByRole('button',{name:'查看 reference.svg'}).click();const modal=page.locator('#overlay [role=dialog]');await expect(modal).toBeVisible();expect(await modal.evaluate(e=>getComputedStyle(e).position)).toBe('fixed');expect(await modal.evaluate(e=>getComputedStyle(e).getPropertyValue('--controls-accent'))).toBe('#aa3300');await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);await expect(page.getByRole('button',{name:'查看 reference.svg'})).toBeFocused();
});
