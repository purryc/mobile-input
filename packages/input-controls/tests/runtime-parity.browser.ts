import {test,expect,type Locator} from '@playwright/test';
import {controlKinds,type WidgetKind} from '../src/types';
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

const explicitPrompt = '请为客户成功团队准备一份桌面协作助手的新品上手培训演示。先说明产品价值和适用客户，再介绍创建工作空间、邀请成员和协作整理资料的流程，最后总结常见问题与使用建议。演讲时长设为10分钟，主题色用蓝色，背景用白色，文字用黑色，字体用微软雅黑。配色方案选择沉静专业，页面颜色以我明确指定的值为准。参考文件选择内置产品介绍，上下文来源选择ima知识库中的产品资料。我会上传产品图片，并提供纸质培训提纲的扫描件作为内容参考。第二页的布局以我接下来绘制的手绘草图为参考。我会提供一张工作空间页面的参考截图，供你参考视觉样式；再提供一段邀请成员流程的参考录屏，供你参考操作顺序和过渡效果。使用演示设计专家，选择演示文稿制作技能。输出格式选择PPT和PDF。';
const detailSelectors: Record<WidgetKind, string[]> = {
  duration: ['.live-wb-duration'],
  color: ['.agent-color-presets button:not([aria-pressed=true])', '.agent-color-bottom label'],
  font: ['.demo-control-option[aria-pressed=false]', '.demo-control-option[aria-pressed=true]'],
  palette: ['.demo-control-option[aria-pressed=false]', '.demo-control-option[aria-pressed=true]'],
  document: ['.demo-local-file'],
  photo: ['.agent-photo-actions button'],
  scanner: ['header button'],
  sketch: ['.agent-sketch-surface'],
  expert: ['.demo-control-option[aria-pressed=false]', '.demo-control-option[aria-pressed=true]'],
  skills: ['.demo-control-option[aria-pressed=false]', '.demo-control-option[aria-pressed=true]'],
  connectors: ['.demo-control-option[aria-pressed=false]', '.demo-control-option[aria-pressed=true]'],
  formats: ['.demo-control-option[aria-pressed=false]', '.demo-control-option[aria-pressed=true]'],
  capture: ['.demo-capture-panel button'],
};

function surface(element: Locator) {
  return element.evaluate(node => {
    const style = getComputedStyle(node);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    const rgba = (color: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    return {
      fill: rgba(style.backgroundColor),
      gradient: style.backgroundImage,
      blur: style.backdropFilter,
      edge: rgba(style.borderTopColor),
      border: style.borderTopWidth,
      radius: style.borderRadius,
      shadow: style.boxShadow,
      padding: style.padding,
    };
  }, undefined, {timeout: 5000});
}

test('all 13 widget surfaces and list states match the running Xiaoyi desktop', async ({page, context}, info) => {
  test.skip(!sourceUrl, 'Set XIAOYI_DEMO_URL to the running original demo for runtime comparison.');
  test.setTimeout(90_000);
  const source = await context.newPage();
  const viewport = {width: 1440, height: 960};
  await Promise.all([page.setViewportSize(viewport), source.setViewportSize(viewport)]);
  const original = new URL(sourceUrl!);
  original.searchParams.set('language', 'zh');
  original.searchParams.set('controls', 'all');
  await Promise.all([source.goto(original.href), page.goto('/compact.html')]);
  await source.locator('[contenteditable=true]').first().fill(explicitPrompt);
  await Promise.all([page.evaluate(() => document.fonts.ready), source.evaluate(() => document.fonts.ready)]);
  try {
    for (const kind of controlKinds) await test.step(kind, async () => {
      const originalChip = source.locator(`.sentence-token[data-kind="${kind}"]`).first();
      await originalChip.click();
      const originalPanel = source.locator('.demo-widget-wrap:visible').first();
      const originalSurface = originalPanel.locator('.live-wb-aux');
      // An explicitly typed font can be valid without belonging to the three demo presets.
      if (kind === 'font') await originalSurface.getByRole('button', {name: '系统无衬线', exact: true}).click();
      const card = page.locator(`[data-widget="${kind}"]`);
      const inline = card.locator('.lite-widget-body .ic-live-wb-aux');
      await inline.scrollIntoViewIfNeeded();
      await Promise.all([source.mouse.move(0, 0), page.mouse.move(0, 0)]);
      const panelStyle = await surface(originalSurface);
      expect.soft(await surface(inline), kind + ' inline glass').toEqual(panelStyle);
      await expect(inline).toHaveCSS('width', await originalSurface.evaluate(el => getComputedStyle(el).width));
      if (kind === 'duration') {
        await expect(inline).toHaveCSS('height', await originalSurface.evaluate(el => getComputedStyle(el).height));
      }
      for (const selector of detailSelectors[kind]) {
        const originalPart = originalSurface.locator(selector).first();
        const inlinePart = inline.locator(selector.replace(/\./g, '.ic-')).first();
        expect.soft(await surface(inlinePart), kind + ' ' + selector).toEqual(await surface(originalPart));
      }
      await originalPanel.screenshot({path: info.outputPath(kind + '-xiaoyi.png')});
      await card.screenshot({path: info.outputPath(kind + '-inline.png')});

      const selectedChip = card.locator(kind === 'document' ? '[data-example=needs-input]' : '[data-example="default-selected"], [data-example="object-bound"]').locator('.ic-sentence-token');
      await selectedChip.click();
      const popover = page.locator('.input-controls-popover');
      await expect(popover).toHaveCSS('box-shadow', 'none');
      expect.soft(await surface(popover.locator('.ic-live-wb-aux')), kind + ' anchored glass').toEqual(panelStyle);
      await popover.screenshot({path: info.outputPath(kind + '-anchored.png')});
      await page.keyboard.press('Escape');
      await originalPanel.getByRole('button', {name: '关闭辅助输入', exact: true}).click();
    });
  } finally {
    await source.close();
  }
});
