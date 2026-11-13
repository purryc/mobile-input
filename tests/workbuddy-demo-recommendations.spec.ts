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
 await expect(pending).toHaveCount(expected?1:0);
 const loadingWidth=expected?(await pending.first().boundingBox())!.width:0;
 await page.clock.runFor(399);await expect(recommended(page)).toHaveCount(expected?1:0);
 if(expected)await expect.poll(async()=>(await recommended(page).first().boundingBox())?.width).toBe(loadingWidth);
 await page.clock.runFor(Math.max(0,expected-1)*220);
 await expect(pending).toHaveCount(0);await expect(recommended(page)).toHaveCount(expected);
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
 await expect(page.locator('[data-preparing=true]')).toHaveCount(1);
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

test('one continuous utterance keeps explicit chips live and releases recommendations progressively per sentence',async({page})=>{
 await page.addInitScript(()=>{(window as any).__voice=[];(window as any).SpeechRecognition=class{onstart:any;onend:any;onresult:any;constructor(){(window as any).__voice.push(this)}start(){this.onstart?.()}stop(){this.onend?.()}abort(){}}});
 await open(page);await page.locator('.demo-voice').click();
 const firstSentence='准备简短培训，主题色用蓝色';
 await page.evaluate(t=>(window as any).__voice.at(-1).onresult({results:[{0:{transcript:t},isFinal:false}]}),firstSentence);
 await expect(page.locator('.sentence-token[data-kind=color]')).toBeVisible();
 await page.clock.runFor(1000);await expect(page.locator('[data-preparing=true]')).toHaveCount(1);
 const fullText='准备简短培训，主题色用蓝色，整体沉静专业，希望直观看到产品的样子。';
 await page.evaluate(t=>(window as any).__voice.at(-1).onresult({results:[{0:{transcript:t},isFinal:false}]}),fullText);
 await page.clock.runFor(400);await expect(recommended(page)).toHaveCount(1);
 await page.clock.runFor(1000);await expect(recommended(page)).toHaveCount(2);
 await page.clock.runFor(220);await expect(recommended(page)).toHaveCount(3);
 await page.locator('.demo-voice').click();await page.clock.runFor(1800);
 await page.locator('.demo-voice').click();await page.clock.runFor(3000);await expect(recommended(page)).toHaveCount(3);
 await page.locator('.demo-voice').click();await page.clock.runFor(3000);await expect(page.locator('[data-sweep=true]')).toHaveCount(0);
});
test('pasted and IME-composed text recognizes product intro recommendations without ASR',async({page})=>{
 await open(page);
 const box=editor(page);await box.click();
 await box.evaluate((el:any)=>{const data=new DataTransfer();data.setData('text/plain','我想做一个简短的演讲报告，介绍今年要发布的产品。');el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));});
 await page.clock.runFor(3000);
 await expect(page.locator('.sentence-token[data-kind=skills][data-origin=recommended]')).toBeVisible();
 await expect(page.locator('.sentence-token[data-kind=expert][data-origin=recommended]')).toBeVisible();
 await expect(page.locator('.sentence-token[data-kind=duration][data-origin=recommended]')).toBeVisible();
 await page.getByRole('button',{name:'新建演示',exact:true}).click();
 await box.click();
 await box.evaluate((el:any)=>{el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));el.textContent='介绍今年的产品';el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));});
 await page.clock.runFor(300);
 // The IME owns the DOM during composition: text is mirrored but never duplicated.
 await expect(box).toHaveText('介绍今年的产品');
 await box.evaluate((el:any)=>el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'介绍今年的产品'})));
 await page.clock.runFor(3000);
 await expect(box).toHaveAttribute('data-value','介绍今年的产品');
 await expect(page.locator('.sentence-token[data-kind=skills][data-origin=recommended]')).toBeVisible();
 await expect(page.locator('.sentence-token[data-kind=expert][data-origin=recommended]')).toBeVisible();
});
test('desktop color opens the actual blue, including background and text bindings, without changing the draft',async({page})=>{
 await open(page);
 for(const [color,hex]of [['蓝色','#356FE4'],['红色','#C92A2A'],['黑色','#182431'],['白色','#FFFFFF'],['灰色','#D9DEDF']]){
  const text=`主题色用${color}，背景用${color}，文字用${color}。`;await editor(page).fill(text);
  const chips=page.locator('.sentence-token[data-kind=color]');await expect(chips).toHaveCount(3);
  for(let i=0;i<3;i++){
   await chips.nth(i).click();await expect(page.locator('.agent-color-bottom input')).toHaveValue(hex);
   const swatches=await page.locator('.agent-color-swatch').evaluateAll(es=>es.map(e=>getComputedStyle(e).backgroundColor));
   if(color==='蓝色')expect(swatches.every(c=>{const n=c.match(/\d+/g)!.map(Number);return n[2]>n[0]})).toBe(true);
   await page.getByRole('button',{name:'关闭辅助输入',exact:true}).click();await expect(editor(page)).toHaveAttribute('data-value',text);
  }
 }
});

test('successive IME rounds continue after a newly rendered chip and preserve manual edits', async ({ page }) => {
  await open(page);
  const box = editor(page);
  await box.click();
  const ime = await page.context().newCDPSession(page);
  const dictate = async (text: string) => {
    await ime.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
    await ime.send('Input.insertText', { text });
  };
  const first = '我想做一个简短的演讲报告';
  await dictate(first);
  await expect(box).toHaveAttribute('data-value', first);
  await page.clock.runFor(2000);
  const chip = box.locator('.sentence-token[data-kind="duration"]');
  await expect(chip).toHaveText('10分钟');
  const afterChip = () => chip.evaluate((button: HTMLElement) => {
    const range = getSelection()?.getRangeAt(0);
    const chipRange = document.createRange();
    chipRange.setStartAfter(button.closest('.sentence-token-hit')!);
    chipRange.collapse(true);
    return Boolean(range?.collapsed && range.compareBoundaryPoints(Range.START_TO_START, chipRange) >= 0);
  });
  expect(await afterChip()).toBe(true);

  const second = '，介绍今年要发布的产品';
  await dictate(second);
  await expect(box).toHaveAttribute('data-value', first + second);
  await page.clock.runFor(2100);
  await expect(box.locator('.sentence-token[data-kind="skills"]')).toBeVisible();
  await expect(box.locator('.sentence-token[data-kind="expert"]')).toBeVisible();
  const third = '。先讲产品价值。';
  await dictate(third);
  await expect(box).toHaveAttribute('data-value', first + second + third);
  await box.evaluate((el: HTMLElement) => {
    // Pick the start of the document, regardless of line wrapping.
    getSelection()!.collapse(el.firstChild!, 0);
  });
  await dictate('请帮忙。');
  await expect(box).toHaveAttribute('data-value', '请帮忙。' + first + second + third);
});
