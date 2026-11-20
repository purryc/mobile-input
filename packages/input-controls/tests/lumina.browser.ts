import {test, expect} from '@playwright/test';
import {controlKinds} from '../src/types';

test('matches the Lumina preparing, recommendation and reduced-motion timelines', async ({page}) => {
  await page.goto('/#/font');
  const surface = page.locator('.controls-preview-stage .ic-chip-surface').first();
  const state = page.getByLabel('Semantic state', {exact:true});
  const loading = page.getByRole('checkbox', {name:/Loading|加载/});
  await loading.check();
  await expect(surface).toHaveCSS('animation-duration','0.32s');
  await expect(surface.locator('.ic-optical-envelope')).toHaveCSS('animation-duration','0.22s');
  await expect(surface.locator('.ic-optical-beam')).toHaveCSS('animation-duration','2s');
  await state.selectOption('ambiguous-recommendation');
  await loading.uncheck();
  await expect(surface).toHaveCSS('animation-duration','0.32s');
  await expect(surface.locator('.ic-optical-drift')).toHaveCSS('animation-duration','7.6s');
  await expect(surface.locator('.ic-optical-well')).toHaveCSS('animation-duration','5.4s');
  await expect(surface.locator('.ic-demo-chip-smart')).toHaveCSS('animation-duration','4.2s');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(surface.locator('.ic-optical-drift')).toBeHidden();
  await loading.check();
  await expect(surface).toHaveAttribute('aria-busy','true');
  await expect(surface.locator('.ic-optical-bar')).toBeVisible();
  await expect(surface).toHaveCSS('animation-name','none');
});

test('multiple inline recommendations open, resolve and dismiss independently', async ({page}) => {
  await page.goto('/compact.html');
  const sentence = page.locator('.lite-sentence-example');
  const chip = sentence.locator('[data-kind=expert]');
  await expect(chip.locator('.ic-demo-chip-smart svg')).toHaveCSS('width', '14px');
  const dismiss = sentence.locator('[data-optical=ambiguous-recommendation] .ic-demo-chip-remove').first();
  await expect(dismiss).toHaveCSS('border-top-style', 'none');
  await expect(dismiss).toHaveCSS('width', '24px');
  await chip.focus();
  await page.keyboard.press('Enter');
  const panel = page.locator('.input-controls-popover');
  await expect(panel).toBeVisible();
  await panel.locator('.ic-demo-control-option').first().click();
  await panel.locator('.ic-footer-confirm').click();
  await expect(chip).toHaveAttribute('data-semantic-state', 'default-selected');
  await expect(chip).not.toHaveText('专家');
  await expect(chip).toBeFocused();
  await dismiss.click();
  await expect(sentence.locator('[data-optical=ambiguous-recommendation] .ic-demo-chip-remove')).toHaveCount(1);
  await expect(sentence.locator('[data-kind=skills]')).toHaveAttribute('data-semantic-state', 'ambiguous-recommendation');
  await expect(panel).toHaveCount(0);
});

for (const width of [1440, 390]) test('each anchored panel fits at ' + width + ' px', async ({page}) => {
  await page.setViewportSize({width, height: 860});
  await page.goto('/compact.html');
  for (const kind of controlKinds) {
    const card = page.locator('[data-widget=' + kind + ']');
    const entry = card.locator('[data-example=needs-input] .ic-sentence-token');
    await entry.click();
    const shell = page.locator('.input-controls-popover .ic-live-wb-aux');
    await expect(shell).toHaveCSS('border-radius', '20px');
    const inline = card.locator('.lite-inline-panel .ic-live-wb-aux');
    for (const property of ['background-image', 'box-shadow', 'backdrop-filter']) {
      await expect(shell).toHaveCSS(property, await inline.evaluate((el, key) => getComputedStyle(el).getPropertyValue(key), property));
    }
    const fits = () => shell.evaluate(el => {
      const b = el.getBoundingClientRect();
      return b.left >= 0 && b.right <= innerWidth + 1 && b.top >= 0 && b.bottom <= innerHeight + 1;
    });
    await expect.poll(fits, {message: kind}).toBe(true);
    await page.keyboard.press('Escape');
    await expect(entry).toBeFocused();
  }
});

test('editor rebuilds use the original sweep clock and honor distinct recommendation keys', async ({page}) => {
  await page.goto('/compact.html');
  const result = await page.evaluate(async (moduleUrl) => {
    const {renderInlineChip} = await import(moduleUrl);
    const sweepStarts = new Map<string,number>();
    const editor = document.createElement('div');
    editor.contentEditable = 'true';
    editor.className = 'input-controls-theme';
    document.body.append(editor);
    let key = 'first';
    function render() {
      const chip = renderInlineChip({
        token: {semanticState:'ambiguous-recommendation', kind:'font', id:'font', phrase:'', label:'字体', value:'', role:'字体', animate:true, sweepKey:key},
        language:'zh-CN', assetBase:'', uiText:(s:string)=>s, expanded:false, sweepStarts, onOpen:()=>{},
      });
      editor.replaceChildren(document.createTextNode(editor.textContent || '草稿'), chip);
      return chip.querySelector('.ic-chip-surface') as HTMLElement;
    }
    const first = render();
    // Simulate an already-started editor transaction without sleeping or changing the system clock.
    sweepStarts.set(key, performance.now() - 400);
    const middle = render();
    sweepStarts.set(key, performance.now() - 1000);
    editor.textContent = '修改后的正文';
    const afterEdit = render();
    key = 'next';
    const next = render();
    editor.remove();
    return {first:first.style.getPropertyValue('--ic-phase'), middleDelay:parseFloat(middle.style.getPropertyValue('--ic-phase')),
      afterEdit:parseFloat(afterEdit.style.getPropertyValue('--ic-phase')), next:next.style.getPropertyValue('--ic-phase')};
  }, '/src/inline-chip.tsx');
  expect(result).toMatchObject({first:'0ms', next:'0ms'});
  expect(result.afterEdit).toBeLessThanOrEqual(-1000);
  expect(result.middleDelay).toBeLessThanOrEqual(-400);
});

test('the library matches all six reference states across both sizes and backdrops', async ({page, request}) => {
  const reference = await request.get('/tests/lumina-reference/index.html');
  test.skip(!(await reference.text()).includes('name="lumina-source"'), 'Build the independent ZIP iframe with npm run prepare:lumina.');
  await page.setViewportSize({width:1160, height:850});
  await page.goto('/optical-review.html');
  await page.getByRole('button', {name:'暂停', exact:true}).click();
  for (const size of ['inline','specimen']) for (const bg of ['composer','artifact']) {
    await page.getByLabel('尺寸').selectOption(size);
    await page.getByLabel('背景').selectOption(bg);
    const query = 'size='+size+(bg==='artifact'?'&artifact=1':'');
    const frames = await Promise.all(['ZIP 原版','控件库'].map(async title => {
      const frame = page.frameLocator('iframe[title="'+title+'"]');
      await expect(frame.locator('main')).toHaveAttribute('data-background', bg);
      await expect(page.locator('iframe[title="'+title+'"]')).toHaveAttribute('src',new RegExp(query.replace(/[?]/g,'\\?')+'$'));
      await frame.locator('[data-row]').first().evaluate(async el => {await el.ownerDocument.fonts.ready;});
      return frame;
    }));
    await page.mouse.move(0,0);
    const capture = async (side: typeof frames[number]) => {
      const rows = await frames[1].locator('[data-row] .ic-chip-surface').count();
      expect(rows).toBe(6);
      const bounds = await side.locator('[data-row]').evaluateAll(list => list.map(row => {
        const el = (row.querySelector('.ic-chip-surface') ?? row.lastElementChild)! as HTMLElement;
        return [el.offsetWidth,el.offsetHeight];
      }));
      return {bounds, image:(await side.locator('main').screenshot()).toString('base64')};
    };
    const [a,b] = await Promise.all(frames.map(capture));
    // Bound labels are abbreviated and the preparing skeleton now reserves the resolved width.
    // Only the optional 38 px specimen preserves the ZIP's typography and width.
    if (size === 'specimen') for (const row of [0,1,3,4]) expect(b.bounds[row]).toEqual(a.bounds[row]);
    for (const row of [0,1,3,4]) expect(b.bounds[row][1]).toEqual(a.bounds[row][1]);
    await expect(frames[1].locator('[data-row=object-bound] .ic-demo-chip-label')).toHaveText('产品资料.p...');
    if (size === 'specimen') expect(b.bounds[2][0]).toBeLessThan(a.bounds[2][0]);
    expect(b.bounds[2][1]).toBe(a.bounds[2][1]);
    expect(b.bounds[5][1]).toBe(a.bounds[5][1]);
    const edge = frames[1].locator('[data-optical=ambiguous-recommendation]');
    await expect(edge).toHaveCSS('background-image',/rgba\(86, 199, 249,/);
    if (size === 'inline') continue;
    const errors = await page.evaluate(async ({a,b}) => {
      const read = async (base64:string) => {
        const img = new Image();
        img.src = 'data:image/png;base64,'+base64;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width=img.width; canvas.height=img.height;
        const ctx=canvas.getContext('2d')!;
        ctx.drawImage(img,0,0);
        // Include the glass and its shadow. Exclude the unrelated row labels.
        return ctx.getImageData(58,0,232,432).data;
      };
      const [left,right] = await Promise.all([read(a),read(b)]);
      const sums=Array<number>(6).fill(0);
      for(let i=0;i<left.length;i+=4){
        const row=Math.floor(i/(4*232*72));
        for(let channel=0;channel<3;channel++)sums[row]+=Math.abs(left[i+channel]-right[i+channel]);
      }
      return sums.map(sum=>sum/(3*232*72));
    },{a:a.image,b:b.image});
    for(const i of [0,1,3,4]) {
      const error = errors[i];
      // The product attenuates the original recommendation pigments, then applies the shared 90% intensity.
      expect(error, size+' '+bg+' row '+i+' mean RGB difference (0–255)').toBeLessThan(i===3 ? 4 : 1);
    }

  }
});

for (const width of [1440,390]) test('card and prose chips have identical intrinsic metrics at '+width, async ({page}) => {
  await page.setViewportSize({width,height:960});
  await page.goto('/compact.html');
  const scene=page.locator('.lite-sentence-example p');
  await expect(scene).toHaveCSS('line-height','32px');
  await expect(scene).toHaveAttribute('aria-busy','false');
  await expect(page.getByRole('link',{name:/Lumina/})).toHaveCount(0);
  const result=await page.evaluate(async () => {
    await document.fonts.ready;
    const paragraph=document.querySelector('.lite-sentence-example p')!;
    const metrics=(host:Element) => {
      const surface=host.querySelector('.ic-chip-surface')!;
      const rect=surface.getBoundingClientRect();
      const button=getComputedStyle(surface.querySelector('button')!);
      const icon=surface.querySelector('.ic-optical-entity,.ic-optical-swatch')!;
      const remove=surface.querySelector('.ic-demo-chip-remove');
      return [rect.width,rect.height,button.fontSize,button.gap,button.paddingInline,icon.getBoundingClientRect().width,remove?.getBoundingClientRect().width];
    };
    const differences:string[]=[];
    const cards=document.querySelectorAll('.lite-card');
    for(const card of cards) {
      for(const host of card.querySelectorAll('.lite-specimen .controls-chip-anchor')){
        const copy=host.cloneNode(true) as Element;
        paragraph.append(copy);
        const inside=metrics(copy), outside=metrics(host);
        const label=host.querySelector('.ic-demo-chip-label')!;
        const icon=host.querySelector('.ic-optical-entity,.ic-optical-swatch')!;
        const rect=icon.getBoundingClientRect(), text=label.getBoundingClientRect();
        const buttonStyle=getComputedStyle(host.querySelector('.ic-sentence-token')!);
        const badge=host.querySelector('.ic-chip-needs-plus,.ic-chip-object-count');
        const gap=badge ? badge.getBoundingClientRect().left-text.right : text.left-rect.right;
        const spacing=buttonStyle.paddingInlineStart==='8px' && Math.abs(gap-6)<0.6;
        const centered=Math.abs(rect.y+rect.height/2-text.y-text.height/2)<0.6;
        if(!spacing || !centered || outside[5]!==18 || outside[2]!=='15px' || outside[3]!=='6px' || getComputedStyle(label).lineHeight!=='22px' || outside[1]!==32 || inside.some((v,i)=>v!==outside[i])) differences.push(card.id+': '+JSON.stringify({inside,outside}));
        copy.remove();
      }
    }
    return {count:cards.length,differences};
  });
  expect(result).toEqual({count:13,differences:[]});
  const bounds=await scene.locator('.ic-chip-surface').evaluateAll(nodes=>nodes.map(el=>el.getBoundingClientRect().toJSON()));
  for(const [i,a] of bounds.entries()){
    expect(a.height).toBe(32);
    expect(a.right).toBeLessThanOrEqual(width);
    for(const b of bounds.slice(i+1)) {
      expect(a.right<=b.left || b.right<=a.left || a.bottom<=b.top+.1 || b.bottom<=a.top+.1).toBeTruthy();
    }
  }
});

test('material names count grapheme clusters and stay abbreviated while open',async({page})=>{
  await page.goto('/compact.html#/document');
  const host=page.locator('[data-widget=document] [data-example=needs-input]');
  const chip=host.locator('.ic-sentence-token');
  await chip.click();
  for(const [name,label] of [['资料.txt','资料.txt'],['2026-D20-淘天 AI 设计专题.pdf','2026-D...'],['👩🏽‍💻🇨🇦e\u0301甲乙丙稿.md','👩🏽‍💻🇨🇦e\u0301甲乙丙...']]){
    await host.locator('input[type=file]').setInputFiles({name,mimeType:'text/plain',buffer:Buffer.from('Draft')});
    await expect(chip.locator('.ic-demo-chip-label')).toHaveText(label);
    await expect(chip).toHaveAttribute('title',new RegExp(name));
    const panel=page.locator('.input-controls-popover');
    await expect(panel.getByRole('button',{name:'查看 '+name,exact:true})).toBeVisible();
    await panel.getByRole('button',{name:'移除 '+name,exact:true}).click();
  }
});

test('generation reserves each resolved width and fades in place',async({page})=>{
  await page.goto('/compact.html');
  const scene=page.locator('.lite-sentence-example');
  await scene.getByRole('button',{name:'重播生成'}).click();
  const loading=scene.locator('[data-optical=preparing]').first();
  const phases=await loading.evaluate(el=>{
    const shell=el.getAnimations()[0];
    const skeleton=el.querySelector('.ic-optical-skeleton')!;
    const mark=skeleton.getAnimations()[0];
    shell.pause(); mark.pause();
    return [150,320,430,540].map(t=>{
      shell.currentTime=t; mark.currentTime=t;
      return [Number(getComputedStyle(el).opacity),Number(getComputedStyle(skeleton).opacity)];
    });
  });
  expect(phases[0][0]).toBeGreaterThan(0);
  expect(phases[0][1]).toBe(0);
  expect(phases[1]).toEqual([1,0]);
  expect(phases[2][1]).toBeGreaterThan(0);
  expect(phases[3]).toEqual([1,1]);
  const pending=await scene.locator('[data-optical=preparing]').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().width));
  expect(pending).toHaveLength(3);
  const ready=scene.locator('[data-optical=ambiguous-recommendation]');
  await expect(ready).toHaveCount(3);
  const widths=await ready.evaluateAll(els=>els.map(el=>el.getBoundingClientRect().width));
  expect(widths).toEqual(pending);
  const frames=await ready.first().evaluate(el=>{
    const label=el.querySelector('.ic-sentence-token')!;
    const loading=el.querySelector('.ic-optical-loading')!;
    const animations=[label,loading].map(node=>node.getAnimations()[0]);
    return [0,130,260].map(t=>{
      for(const a of animations){a.pause();a.currentTime=t;}
      return [el,label,loading].map(node=>Number(getComputedStyle(node).opacity));
    });
  });
  expect(frames[0]).toEqual([1,0,1]);
  expect(frames[1][0]).toBe(1);
  expect(frames[1][1]+frames[1][2]).toBeCloseTo(1);
  expect(frames[2]).toEqual([1,1,0]);
});

test('sketch tools precede the canvas visually and in keyboard order',async({page})=>{
  await page.goto('/compact.html#/sketch');
  const entry=page.locator('[data-widget=sketch] [data-example=needs-input] .ic-sentence-token');
  await entry.click();
  const panel=page.locator('.input-controls-popover');
  const tools=panel.getByRole('group',{name:'绘画工具'});
  const canvas=panel.locator('.ic-agent-sketch-surface');
  const footer=panel.locator('.ic-widget-footer');
  const [toolbarBox,canvasBox,footerBox]=await Promise.all([tools,canvas,footer].map(el=>el.boundingBox()));
  expect(toolbarBox!.y+toolbarBox!.height).toBeLessThanOrEqual(canvasBox!.y);
  expect(canvasBox!.y+canvasBox!.height).toBeLessThanOrEqual(footerBox!.y);
  await panel.getByRole('button',{name:'关闭辅助输入'}).focus();
  for (const item of [tools.getByRole('button',{name:'画笔'}),tools.getByRole('button',{name:'橡皮'}),canvas]){
    await page.keyboard.press('Tab');
    await expect(item).toBeFocused();
  }
});

test('recommendation hover lights the stationary edge and keeps dismissal independent', async ({page}) => {
  await page.goto('/compact.html');
  const chip = page.locator('.lite-sentence-example [data-optical="ambiguous-recommendation"]').first();
  await chip.waitFor();
  await chip.scrollIntoViewIfNeeded();
  const button = chip.locator('.ic-sentence-token');
  const close = chip.locator('.ic-demo-chip-remove');
  const start = await chip.boundingBox();
  const entrance = () => chip.evaluate(el => el.getAnimations()
    .find(a => (a as CSSAnimation).animationName === 'ic-preparing-fade-in')?.startTime);
  await expect.poll(entrance).toEqual(expect.any(Number));
  const entered = await entrance();
  await expect(chip).toHaveCSS('background-image', /rgba\(86, 199, 249, 0\.42/);
  await button.hover();
  await expect(chip).toHaveCSS('outline-color', 'rgba(102, 192, 237, 0.72)');
  await expect(chip).toHaveCSS('background-image', /rgba\(86, 199, 249, 0\.53/);
  expect(await chip.boundingBox()).toEqual(start);
  expect(await entrance()).toBe(entered);
  const core=chip.locator('.ic-optical-core');
  const reflection=()=>core.evaluate(el=>getComputedStyle(el,'::before').opacity);
  await expect.poll(reflection).toBe('0.78');
  const x=()=>core.evaluate(el=>el.style.getPropertyValue('--ic-light-x'));
  const center=await x();
  await button.hover({position:{x:6,y:10}});
  expect(await x()).not.toBe(center);
  await close.hover();
  await expect.poll(reflection).toBe('0');
  await expect(close).toHaveCSS('outline-color', 'rgba(102, 192, 237, 0.72)');
  await expect(chip).toHaveCSS('outline-color', 'rgba(0, 0, 0, 0)');
  await close.click();
  await expect(page.locator('.lite-sentence-example [data-optical="ambiguous-recommendation"]')).toHaveCount(2);
});

test('fast recommendations keep the shell clock and never flash a late skeleton', async ({page}) => {
  await page.goto('/compact.html');
  const samples = await page.evaluate(async moduleUrl => {
    const {renderInlineChip} = await import(moduleUrl);
    const host = document.createElement('div');
    host.className = 'input-controls-theme';
    document.body.append(host);
    return [80, 420, 650].map(elapsed => {
      const sweepStarts = new Map([['preparing:sample', performance.now() - elapsed]]);
      host.replaceChildren(renderInlineChip({
        token:{id:'sample',kind:'font',semanticState:'ambiguous-recommendation',label:'字体',role:'',phrase:'',value:''},
        expanded:false,language:'zh',uiText:(s:string)=>s,assetBase:'',sweepStarts,onOpen:()=>{},
      }));
      const skeleton = host.querySelector('.ic-optical-skeleton')!;
      return Number(getComputedStyle(skeleton).opacity);
    });
  }, '/src/inline-chip.tsx');
  expect(samples[0]).toBe(0);
  expect(samples[1]).toBeGreaterThan(0);
  expect(samples[1]).toBeLessThan(1);
  expect(samples[2]).toBe(1);
});

test('drag surfaces and editable fields stay quiet on hover, with a distinct keyboard focus', async ({page}, info) => {
  await page.goto('/compact.html#/color');
  const card = page.locator('[data-widget=color]');
  for (const mode of ['inline', 'popover']) {
    if (mode === 'popover') await card.locator('[data-example=default-selected] .ic-sentence-token').click();
    const panel = mode === 'inline' ? card.locator('.lite-inline-panel') : page.locator('.input-controls-popover');
    const tone = panel.getByRole('slider', {name:'连续调色'});
    const hue = panel.getByRole('slider', {name:'色相'});
    const fields = [tone, hue, panel.getByRole('textbox')];
    if (mode === 'inline') {
      for (const selector of ['.ic-time-range','.ic-time-stepper input','.ic-agent-sketch-surface']) {
        fields.push(page.locator('.lite-inline-panel').locator(selector).first());
      }
      fields.push(page.locator('[data-widget=skills] .lite-inline-panel input').first());
    }
    for (const field of fields) {
      await field.scrollIntoViewIfNeeded();
      await page.mouse.move(0,0);
      const decoration = () => field.evaluate(el => {
        const style = getComputedStyle(el);
        return [style.outline,style.boxShadow];
      });
      const idle = await decoration();
      await field.hover();
      // Sample the settled hover, including transitions that start on the next frame.
      await field.evaluate(async el => {
        await new Promise(requestAnimationFrame);
        await Promise.all(el.getAnimations().map(a => a.finished));
      });
      expect(await decoration()).toEqual(idle);
    }
    await hue.hover();
    await panel.locator('.ic-live-wb-aux').screenshot({path:info.outputPath('color-hover-'+mode+'.png')});
    await tone.focus();
    await page.keyboard.press('Tab');
    await expect(hue).toBeFocused();
    await expect(hue).toHaveCSS('outline-style','solid');
    const initial = Number(await hue.inputValue());
    await hue.press('ArrowRight');
    expect(Number(await hue.inputValue())).toBe(initial + 1);
  }
});
