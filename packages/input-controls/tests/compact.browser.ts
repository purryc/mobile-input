import {readFile} from 'node:fs/promises';
import {test, expect, type Page} from '@playwright/test';
import {controlKinds, type WidgetKind} from '../src/types';
import manifest from '../package.json' with {type: 'json'};

const route = '/compact.html#/';
const materials: WidgetKind[] = ['document', 'photo', 'scanner', 'sketch', 'capture'];
const card = (page: Page, kind: WidgetKind) => page.locator(`[data-widget="${kind}"]`);
const example = (page: Page, kind: WidgetKind, state = 'needs-input') =>
  card(page, kind).locator(`[data-example="${state}"]`);
const chip = (page: Page, kind: WidgetKind, state?: string) =>
  example(page, kind, state).locator('.ic-sentence-token');
const panel = (page: Page) => page.locator('.input-controls-popover');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');

test('all 13 live cards share one page and expose each typed component source', async ({page, context}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(route + 'duration');
  await expect(page.locator('.lite-card')).toHaveCount(13);
  await expect(card(page, 'duration')).toBeInViewport();
  await expect(page.getByRole('heading', {level: 1})).toHaveText('小艺 Work 输入控件');
  await expect(page.locator('.lite-sidebar, .lite-examples, .controls-preview-values')).toHaveCount(0);

  const packageFilename = 'mobile-input-controls-' + manifest.version + '.tgz';
  const archiveDownload = page.waitForEvent('download');
  await page.getByRole('link', {name: /下载完整 npm 包/}).click();
  const archive = await archiveDownload;
  expect(archive.suggestedFilename()).toBe(packageFilename);
  const bytes = await readFile((await archive.path())!);
  expect(bytes.subarray(0, 2)).toEqual(Buffer.from([0x1f, 0x8b]));
  const guide = page.locator('.lite-package-guide');
  await guide.locator('summary').click();
  await guide.getByRole('button', {name: '复制安装命令'}).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(packageFilename);
  await guide.getByRole('button', {name: '复制 React 接入示例'}).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('@mobile-input/controls/desktop.css');
  await guide.locator('summary').click();

  for (const kind of controlKinds) {
    const widgetCard = card(page, kind);
    await expect(widgetCard.locator('[data-example]')).toHaveCount(kind === 'capture' ? 5 : 3);
    const selected = materials.includes(kind) ? 'object-bound' : 'default-selected';
    if (kind === 'document') await expect(chip(page, kind)).toHaveAccessibleDescription('待补充');
    await expect(chip(page, kind, selected)).toHaveAccessibleDescription('已选');
    await expect(widgetCard.locator('.lite-widget-preview[open] .lite-widget-body')).toBeVisible();
    await expect(widgetCard.locator('.lite-composer-preview .lite-preview-prose')).toHaveAttribute('aria-hidden', 'true');
    await expect(chip(page, kind, 'ambiguous-recommendation').locator('.ic-demo-chip-smart')).toBeVisible();
    await chip(page, kind).click();
    await expect(panel(page)).toHaveCount(1);
    await expect(panel(page)).toHaveCSS('box-shadow', 'none');
    await expect(chip(page, kind)).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(chip(page, kind)).toBeFocused();

    const source = widgetCard.locator('.lite-source');
    await source.locator('summary').click();
    const usage = source.getByLabel('React 接入示例');
    const snippet = await usage.innerText();
    expect(snippet).toContain('@mobile-input/controls/');
    expect(snippet).toContain('WidgetProps');
    expect(snippet).toContain("import '@mobile-input/controls/desktop.css'");
    expect(snippet).toContain('<WidgetSurface>');
    if (kind === 'photo') {
      const download = page.waitForEvent('download');
      await source.getByRole('button', {name: '下载 image-widget.tsx'}).click();
      const file = await download;
      expect(file.suggestedFilename()).toBe('image-widget.tsx');
      expect(await readFile((await file.path())!)).toEqual(await readFile(new URL('../src/image-widget.tsx', import.meta.url)));
    }
    await source.getByRole('button', {name: '查看组件源码'}).click();
    await expect(source.getByLabel('组件源码', {exact: true})).toContainText('export function');
    if (kind === 'duration') {
      await source.getByRole('button', {name: '复制示例'}).click();
      await expect(source.getByRole('status')).toHaveText('已复制');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(snippet);
    }
    await source.locator('summary').click();
  }
  await page.getByRole('button', {name: 'EN', exact: true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', {name: 'Time', exact: true})).toBeVisible();
  await expect(chip(page, 'duration')).toHaveAccessibleName('Time');
  await expect(chip(page, 'duration')).toHaveAccessibleDescription('Needs input');
  await expect(chip(page, 'photo', 'object-bound')).toHaveAccessibleName('Media Gallery 产品图片.svg');
  await expect(chip(page, 'photo', 'object-bound')).toHaveAccessibleDescription('Selected');
  await expect(chip(page, 'photo', 'ambiguous-recommendation')).toHaveAccessibleDescription('Recommendation');
  await expect(page.locator('.lite-card')).toHaveCount(13);
  expect(errors).toEqual([]);
});

test('keyboard recommendation removal and singleton panel preserve isolated component state', async ({page}) => {
  await page.goto(route + 'duration');
  const selectedTime = chip(page, 'duration', 'default-selected');
  await selectedTime.click();
  await panel(page).getByRole('button', {name: '增加一分钟'}).click();
  await expect(selectedTime).toContainText('11分钟');
  await page.keyboard.press('Escape');

  const standalone = card(page, 'duration').locator('.lite-widget-preview');
  await standalone.getByRole('button', {name: '增加一秒'}).click();
  await expect(standalone.getByRole('spinbutton')).toHaveValue('16');
  await standalone.getByRole('button', {name: '增加一秒'}).click();
  await expect(standalone.getByRole('spinbutton')).toHaveValue('17');
  await standalone.getByRole('button', {name: '确认'}).click();
  await expect(standalone).not.toHaveAttribute('open', '');
  await expect(selectedTime).toContainText('11分钟');
  await standalone.locator('summary').click();
  await expect(standalone.getByRole('spinbutton')).toHaveValue('17');
  await standalone.getByRole('button', {name: '关闭辅助输入'}).click();
  await expect(standalone).not.toHaveAttribute('open', '');
  await selectedTime.click();

  const color = chip(page, 'color');
  await color.click();
  await expect(panel(page)).toHaveCount(1);
  await expect(panel(page)).toHaveAccessibleName('颜色');
  await expect(selectedTime).toHaveAttribute('aria-expanded', 'false');

  const recommendation = example(page, 'duration', 'ambiguous-recommendation');
  await recommendation.getByRole('button', {name: /^移除/}).focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toHaveCount(0);
  await expect(recommendation.getByRole('button', {name: '恢复推荐'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(chip(page, 'duration', 'ambiguous-recommendation')).toHaveAttribute('data-semantic-state', 'ambiguous-recommendation');
  await selectedTime.click();
  await expect(panel(page).getByRole('spinbutton')).toHaveValue('11');
  await page.keyboard.press('Escape');
  await chip(page, 'duration').click();
  await expect(panel(page).getByRole('spinbutton')).toHaveValue('10');
});

test('local documents bind to the same chip, keep bytes and reset when the last file is removed', async ({page}) => {
  await page.goto(route + 'document');
  const pending = example(page, 'document');
  const pendingMaterials = panel(page).getByRole('list', {name:'已选文件'});
  const entry = chip(page, 'document');
  const filename = 'a-very-long-product-reference-attachment-name-that-does-not-fit-the-chip.txt';
  await entry.click();
  await expect(panel(page).getByRole('listitem')).toHaveCount(0);
  await expect(panel(page).getByRole('button', {name: /^移除 /})).toHaveCount(0);
  await expect(panel(page)).not.toContainText('产品介绍.pdf');
  const search = panel(page).getByLabel('搜索候选');
  await expect(search).toHaveCount(0);
  const localFiles = pending.locator('input[type=file]');
  await localFiles.setInputFiles([]);
  await expect(entry).toHaveAttribute('data-semantic-state', 'needs-input');
  await localFiles.setInputFiles([
    {name: filename, mimeType: 'text/plain', buffer: Buffer.from('Reference file contents')},
    {name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from('# Notes')},
  ]);
  await expect(entry).toHaveAttribute('data-semantic-state', 'object-bound');
  await expect(entry).toHaveAccessibleName(new RegExp(filename));
  await expect(entry).toHaveAttribute('title', new RegExp(filename));
  await expect(entry.locator('.ic-chip-object-count')).toHaveText('+1');
  await expect(pending.locator('.ic-demo-chip-remove')).toHaveAccessibleName('移除 ' + filename);
  const label = entry.locator('.ic-demo-chip-label');
  await expect(label).toHaveText('a-very...');

  await search.fill('notes.md');
  await expect(panel(page).getByRole('button', {name:'查看 notes.md'})).toBeVisible();
  await expect(panel(page)).not.toContainText('没有匹配项');
  await search.fill('');
  await pendingMaterials.getByRole('button', {name: '查看 ' + filename}).click();
  await expect(page.getByRole('dialog', {name: filename})).toContainText('Reference file contents');
  await page.keyboard.press('Escape');
  await pendingMaterials.getByRole('button', {name: '移除 ' + filename}).click();
  await expect(entry).toContainText('notes....');
  await pendingMaterials.getByRole('button', {name: '移除 notes.md'}).click();
  await expect(entry).toHaveAttribute('data-semantic-state', 'needs-input');
  await expect(pending.getByRole('listitem')).toHaveCount(0);
  await expect(example(page,'document','object-bound').getByRole('listitem')).toHaveCount(0);
});

test('gallery, scan, sketch and screen materials bind only on confirmation', async ({page}) => {
  await page.addInitScript(() => {
    const acquire = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const context = canvas.getContext('2d')!;
      context.fillRect(0, 0, 320, 180);
      const stream = canvas.captureStream(10);
      const timer = setInterval(() => {
        if (stream.getTracks().every(track => track.readyState === 'ended')) clearInterval(timer);
        else context.fillRect(0, 0, 320, 180);
      }, 100);
      return stream;
    };
    Object.defineProperty(navigator.mediaDevices, 'getDisplayMedia', {value: acquire});
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {value: acquire});
  });
  await page.goto(route + 'photo');
  const pendingImage = {name: 'image.png', mimeType: 'image/png', buffer: png};
  await chip(page, 'photo').click();
  await example(page, 'photo').locator('input[type=file]').setInputFiles(pendingImage);
  await expect(chip(page, 'photo')).toHaveAttribute('data-semantic-state', 'needs-input');
  await page.keyboard.press('Escape');
  await chip(page, 'photo').click();
  await panel(page).getByRole('button', {name: '确认图片选择'}).click();
  await expect(chip(page, 'photo')).toContainText('image....');
  await expect(chip(page, 'photo')).toHaveAttribute('data-semantic-state', 'object-bound');
  await chip(page, 'photo').click();
  await expect(panel(page).getByRole('button', {name: '确认图片选择'})).toBeDisabled();
  await example(page, 'photo').locator('input[type=file]').setInputFiles({...pendingImage, name: 'new-preview.png'});
  await expect(chip(page, 'photo')).toHaveText('image....');
  await panel(page).getByRole('button', {name: '移除 new-preview.png'}).click();
  await expect(chip(page, 'photo')).toHaveText('image....');
  await panel(page).getByRole('button', {name: '关闭辅助输入'}).click();

  await chip(page, 'scanner').click();
  await panel(page).getByRole('button', {name: '文档扫描', exact: true}).click();
  await panel(page).getByRole('button', {name: '拍摄', exact: true}).click();
  await expect(chip(page, 'scanner')).toHaveAttribute('data-semantic-state', 'needs-input');
  await panel(page).getByRole('button', {name: '确认材料'}).click();
  await expect(chip(page, 'scanner')).toHaveAttribute('data-semantic-state', 'object-bound');

  await chip(page, 'sketch').click();
  const canvas = panel(page).locator('.ic-agent-sketch-surface');
  await canvas.scrollIntoViewIfNeeded();
  // Near the viewport bottom the panel scrolls. Draw inside the visible canvas.
  const point = await canvas.evaluate(el => {
    const box = el.getBoundingClientRect();
    const clip = el.closest('.ic-live-wb-aux')!.getBoundingClientRect();
    return {x:box.left+box.width/2, y:(Math.max(0,box.top,clip.top)+Math.min(innerHeight,box.bottom,clip.bottom))/2};
  });
  await page.mouse.move(point.x-20, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x+20, point.y+4, {steps:6});
  await page.mouse.up();
  await expect(chip(page, 'sketch')).toHaveAttribute('data-semantic-state', 'needs-input');
  await panel(page).getByRole('button', {name: '确认'}).click();
  await expect(chip(page, 'sketch')).toHaveAttribute('data-semantic-state', 'object-bound');

  await chip(page, 'capture').click();
  await panel(page).getByRole('button', {name: '截图', exact: true}).click();
  await expect(page.getByRole('toolbar', {name:'屏幕捕获'})).toBeVisible();
  await panel(page).getByRole('button', {name: '开始截屏', exact: true}).click();
  await expect(chip(page, 'capture')).toHaveAttribute('data-semantic-state', 'needs-input');
  await panel(page).getByRole('button', {name: '确认材料'}).click();
  await expect(chip(page, 'capture')).toHaveAttribute('data-semantic-state', 'object-bound');
  await expect(chip(page, 'capture')).toContainText('screen...');

  // Confirmed scans are removed from the host attachment strip after the viewfinder closes.
  const scans = example(page, 'scanner').locator('.lite-document-materials');
  await scans.getByRole('button', {name: /^移除/}).click();
  await expect(chip(page, 'scanner')).toHaveAttribute('data-semantic-state', 'needs-input');

  for (const kind of ['photo', 'sketch', 'capture'] as const) {
    await chip(page, kind).click();
    await panel(page).getByRole('button', {name: /^移除/}).click();
    await expect(chip(page, kind)).toHaveAttribute('data-semantic-state', 'needs-input');
    if (kind === 'sketch') {
      await expect(canvas.locator('polyline')).toHaveCount(1);
      await panel(page).getByRole('button', {name: '清空笔迹'}).click();
      await expect(canvas.locator('polyline')).toHaveCount(0);
    }
  }
});

test('responsive cards keep the native time panel geometry and original playground', async ({page}, info) => {
  for (const width of [1440, 1280, 1024, 800, 390]) {
    await page.setViewportSize({width, height: 960});
    await page.goto('/compact.html?qaWidth=' + width + '#/duration');
    await chip(page, 'duration', 'default-selected').click();
    const anchor = (await example(page, 'duration', 'default-selected').locator('.controls-chip-anchor').boundingBox())!;
    const box = (await panel(page).boundingBox())!;
    const left = Math.max(8, Math.min(anchor.x, width - box.width - 8));
    expect(box.x).toBeCloseTo(left, 0);
    expect(box.y).toBeCloseTo(anchor.y + anchor.height + 8, 0);
    expect(box.width).toBe(Math.min(width-16,432));
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await expect(panel(page).locator('.ic-time-stepper button').first()).toHaveCSS('border-top-style', 'none');
    if (width === 1280) await page.screenshot({path: info.outputPath('duration-open.png')});
    await page.keyboard.press('Escape');

    await page.getByRole('button', {name: 'EN', exact: true}).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) expect(await page.locator('.lite-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1);
    if (width === 1280) await page.screenshot({path: info.outputPath('component-gallery.png'), fullPage: true});
  }
  await page.goto('/#/duration');
  await expect(page.getByRole('button', {name: 'Second instance'})).toBeVisible();
});

test('the live panel stays over its draft parameter when the gallery reflows', async ({page}) => {
  await page.goto(route + 'photo');
  for (const width of [1440, 900, 390]) {
    await page.setViewportSize({width, height: 960});
    await page.evaluate(() => document.fonts.ready);
    const gallery = card(page, 'photo');
    const backdrop = gallery.locator('.lite-preview-prose');
    await expect(backdrop).toHaveAttribute('inert', '');
    await expect.poll(() => gallery.evaluate(el => {
      const anchor = el.querySelector('.lite-reference-composer [data-kind="photo"]')!.getBoundingClientRect();
      const panel = el.querySelector('.lite-widget-body .ic-live-wb-aux')!.getBoundingClientRect();
      return Math.max(Math.abs(anchor.left - panel.left), Math.abs(anchor.bottom + 8 - panel.top));
    })).toBeLessThan(1);
  }
  await chip(page, 'photo').click();
  await expect(panel(page)).toBeVisible();
  await expect(card(page, 'photo').locator('.lite-inline-panel')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(card(page, 'photo').locator('.lite-inline-panel')).toBeVisible();
});

test('widget descriptions stay outside every live preview and draft text stays inside the glass', async ({page}) => {
  await page.goto(route + 'skills');
  for (const language of ['zh-CN', 'en']) {
    if (language === 'en') await page.getByRole('button', {name: 'EN', exact: true}).click();
    for (const width of [1440, 900, 390]) {
      await page.setViewportSize({width, height: 960});
      const issues = await page.locator('.lite-card').evaluateAll(cards => cards.flatMap(card => {
        const description = card.querySelector('.lite-widget-description')!;
        const summary = card.querySelector('.lite-widget-preview > summary')!.getBoundingClientRect();
        const glass = card.querySelector('.lite-widget-body .ic-live-wb-aux')!;
        const draft = card.querySelector('.lite-preview-prose')!;
        const panel = glass.getBoundingClientRect();
        const clip = draft.getBoundingClientRect();
        const aligned = (['top', 'left', 'bottom', 'right'] as const).every(edge => Math.abs(clip[edge] - panel[edge]) <= 1);
        const readable = description.textContent?.trim() && description.getBoundingClientRect().bottom < summary.top
          && summary.bottom + 12 <= panel.top;
        return aligned && readable && getComputedStyle(draft).overflow === 'clip'
          && getComputedStyle(draft).borderRadius === getComputedStyle(glass).borderRadius ? [] : [card.id];
      }));
      expect(issues, language + ' at ' + width).toEqual([]);
    }
  }
});

for (const width of [1440, 390]) {
  test('camera waiting message and shutter are centered at ' + width, async ({page}, info) => {
    await page.setViewportSize({width, height: 960});
    await page.addInitScript(() => Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: () => new Promise<MediaStream>(() => {}),
    }));
    await page.goto(route + 'scanner');
    const standalone = page.locator('[data-widget=scanner] .lite-inline-panel');
    for (const surface of ['standalone', 'chip']) {
      const host = surface === 'standalone' ? standalone : panel(page);
      if (surface === 'chip') await chip(page, 'scanner', 'object-bound').click();
      for (const mode of ['拍照', '文档扫描']) {
        await host.getByRole('button', {name: mode, exact: true}).click();
        const frame = host.locator('.ic-demo-capture-viewport');
        const status = frame.getByRole('status');
        const shutter = host.getByRole('button', {name: '拍摄', exact: true});
        await expect(status).toHaveText('正在等待画面…');
        await expect(shutter).toBeDisabled();
        const bounds = (await frame.boundingBox())!;
        const button = (await shutter.boundingBox())!;
        const message = await status.evaluate(node => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return range.getBoundingClientRect().toJSON();
        });
        const center = bounds.x + bounds.width / 2;
        expect(Math.abs(message.x + message.width / 2 - center)).toBeLessThan(1);
        expect(Math.abs(message.y + message.height / 2 - bounds.y - bounds.height / 2)).toBeLessThan(2);
        expect(Math.abs(button.x + button.width / 2 - center)).toBeLessThan(1);
        expect(button.y).toBeGreaterThanOrEqual(bounds.y + bounds.height);
        expect(await frame.evaluate(node => getComputedStyle(node, '::before').content)).toBe('none');
      }
      await host.locator('.ic-demo-capture-panel').screenshot({path: info.outputPath(surface + '-camera-waiting.png')});
    }
  });
}

test('passive catalog waits for a mode; scan intent opens directly and permits retry', async ({page}) => {
  await page.addInitScript(() => {
    (window as any).__cameraRequests = 0;
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {value: async () => {
      (window as any).__cameraRequests++;
      throw new DOMException('Permission denied', 'NotAllowedError');
    }});
  });
  const count = () => page.evaluate(() => (window as any).__cameraRequests);
  await page.goto(route + 'scanner');
  const standalone = page.locator('[data-widget=scanner] .lite-inline-panel');
  await expect(standalone.getByRole('button', {name:'文档扫描', exact:true})).toHaveAttribute('aria-pressed','false');
  expect(await count()).toBe(0);
  await standalone.getByRole('button', {name:'文档扫描', exact:true}).click();
  await expect(standalone.getByRole('alert')).toBeVisible();
  expect(await count()).toBe(1);
  await standalone.getByRole('button', {name:'重试'}).click();
  await expect.poll(count).toBe(2);
  await chip(page, 'scanner', 'object-bound').click();
  await expect(panel(page).getByRole('button', {name:'文档扫描', exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(panel(page).getByRole('alert')).toBeVisible();
  expect(await count()).toBe(3);
  await expect(panel(page).locator('input[type=file]')).toHaveCount(0);
});

for (const presentation of ['chip', 'inline']) {
  test('remove adopted documents inside the ' + presentation + ' picker by attachment identity', async ({page}, info) => {
    await page.goto(route + 'document');
    const document = card(page, 'document');
    const inline = document.locator('.lite-widget-preview');
    const selected = example(page, 'document');
    const host = presentation === 'inline' ? inline : selected;
    const view = presentation === 'inline' ? inline.locator('.lite-inline-panel') : panel(page);
    if (presentation === 'chip') await selected.locator('.ic-sentence-token').click();
    const attachments = view.locator('.ic-document-file-list');
    const search = view.getByLabel('搜索候选');
    const remove = (name: string) => view.getByRole('button', {name: '移除 ' + name, exact:true});
    await expect(view.getByRole('listitem')).toHaveCount(0);
    await expect(view.getByRole('button', {name:/^移除 /})).toHaveCount(0);
    await expect(view.getByRole('button', {name:'选择本地文件'})).toBeVisible();
    await view.screenshot({path:info.outputPath('document-' + presentation + '-empty.png')});
    const local = host.locator('input[type=file]');
    const first = {name:'same.txt', mimeType:'text/plain', buffer:Buffer.from('first attachment')};
    const second = {...first, buffer:Buffer.from('second attachment')};
    await local.setInputFiles([first, second]);
    await expect(view.getByRole('listitem')).toHaveCount(2);
    await expect(remove('same.txt').first()).toBeVisible();
    await view.screenshot({path:info.outputPath('document-' + presentation + '-selected.png')});
    await search.fill('same');
    await expect(remove('same.txt')).toHaveCount(2);
    await remove('same.txt').first().click();
    await expect(remove('same.txt')).toHaveCount(1);
    await expect(search).toHaveValue('same');
    await attachments.getByRole('button', {name:'查看 same.txt'}).click();
    await expect(page.getByRole('dialog', {name:'same.txt'})).toContainText('second attachment');
    await page.keyboard.press('Escape');
    if (presentation === 'chip' && !await view.isVisible()) await selected.locator('.ic-sentence-token').click();
    await search.fill('same');
    await remove('same.txt').focus();
    await page.keyboard.press('Enter');
    await expect(view.getByRole('button', {name:'选择本地文件'})).toBeFocused();
    await expect(view.getByRole('listitem')).toHaveCount(0);
    await local.setInputFiles(first);
    await expect(search).toHaveValue('');
    await expect(remove('same.txt')).toBeVisible();
    await remove('same.txt').click();
    await expect(attachments.getByRole('button')).toHaveCount(0);
    if (presentation === 'chip') await expect(selected.locator('.ic-sentence-token')).toHaveAttribute('data-semantic-state', 'needs-input');
  });
}

test('confirmed materials expose remove without opening any picker', async ({page}, info) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto(route + 'photo');
  for (const kind of materials) {
    const item = example(page, kind, kind === 'document' ? 'needs-input' : 'object-bound');
    if (kind === 'document') {
      await item.locator('.ic-sentence-token').click();
      await item.locator('input[type=file]').setInputFiles({name:'manual.txt',mimeType:'text/plain',buffer:Buffer.from('Manual')});
      await panel(page).getByRole('button', {name:'确认'}).click();
    }
    const opener = item.locator('.ic-sentence-token');
    const remove = item.locator('.ic-demo-chip-remove');
    await expect(remove).toBeVisible();
    if (kind === 'document') await expect(item.getByRole('listitem')).toHaveCount(0);
    else await expect(item.locator('.lite-document-materials').getByRole('button', {name:/^移除 /})).toBeVisible();
    await expect(opener).toHaveAttribute('aria-expanded','false');
    if (kind === 'photo') {
      await page.mouse.move(0,0);
      await item.screenshot({path: info.outputPath('gallery-selected.png')});
      await item.getByRole('button',{name:'查看 产品图片.svg'}).click();
      await expect(page.getByRole('dialog',{name:'产品图片.svg'})).toBeVisible();
      await page.keyboard.press('Escape');
    }
    await remove.focus();
    await page.keyboard.press('Enter');
    await expect(opener).toHaveAttribute('data-semantic-state','needs-input');
    await expect(opener).toBeFocused();
    await expect(panel(page)).toHaveCount(0);
    await expect(item.locator('.ic-demo-material')).toHaveCount(0);
  }
});

test('standalone document keeps files inside the picker across collapse and reopen', async ({page}) => {
  await page.goto(route + 'document');
  const stage = card(page,'document').locator('.lite-composer-preview');
  const example = stage.locator('details.lite-widget-preview');
  await example.locator('input[type=file]').setInputFiles({name:'manual.txt', mimeType:'text/plain',buffer:Buffer.from('Manual')});
  await example.locator('summary').click();
  const cardOutside = stage.locator('details.lite-widget-preview + .lite-document-materials');
  await expect(example).not.toHaveAttribute('open','');
  await expect(cardOutside).toHaveCount(0);
  await example.locator('summary').click();
  const row = example.getByRole('listitem');
  const preview = row.getByRole('button',{name:'查看 manual.txt'});
  const remove = row.getByRole('button',{name:'移除 manual.txt'});
  const bounds = (await row.boundingBox())!;
  const hit = (await preview.boundingBox())!;
  expect(bounds.width - hit.width).toBeLessThanOrEqual(2);
  expect(bounds.height - hit.height).toBeLessThanOrEqual(2);
  await preview.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'manual.txt'})).toContainText('Manual');
  await page.keyboard.press('Escape');
  await expect(preview).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(remove).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(row).toHaveCount(0);
});

test('closed multi-file picker removes only the labelled attachment even with repeated names', async ({page}) => {
  await page.goto(route + 'document');
  const host = example(page, 'document');
  const opener = chip(page, 'document');
  await opener.click();
  await host.locator('input[type=file]').setInputFiles(['first bytes', 'second bytes'].map(value => ({
    name:'same.txt', mimeType:'text/plain', buffer:Buffer.from(value),
  })));
  await panel(page).getByRole('button',{name:'确认'}).click();
  await expect(opener.locator('.ic-chip-object-count')).toHaveText('+1');
  await host.locator('.ic-demo-chip-remove').click();
  await expect(panel(page)).toHaveCount(0);
  await expect(opener.locator('.ic-chip-object-count')).toHaveCount(0);
  await expect(host.getByRole('listitem')).toHaveCount(0);
  await opener.click();
  await panel(page).getByRole('button',{name:'查看 same.txt'}).click();
  await expect(page.getByRole('dialog',{name:'same.txt'})).toContainText('second bytes');
  await page.keyboard.press('Escape');
  await panel(page).getByRole('listitem').getByRole('button',{name:'移除 same.txt'}).click();
  await expect(opener).toHaveAttribute('data-semantic-state','needs-input');
});

test('Windows font picker shows ten real specimens and retains the selected family', async ({page}) => {
  await page.goto(route + 'font');
  const entry = chip(page, 'font');
  await entry.click();
  const picker = panel(page);
  const options = picker.locator('.ic-demo-control-option');
  await expect(options).toHaveCount(10);
  await expect.poll(() => options.locator('img').evaluateAll(images => images.filter(
    img => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0
  ).length)).toBe(10);
  const sources = await options.locator('img').evaluateAll(images => images.map(img => img.getAttribute('src')));
  expect(new Set(sources).size).toBe(10);
  const search = picker.getByRole('textbox');
  await search.fill('KaiTi');
  await expect(options).toHaveCount(1);
  await options.click();
  await expect(picker.locator('.ic-demo-choice-footer')).toHaveText('');
  await expect(options).toHaveAccessibleName('楷体');
  await expect(options).toHaveAttribute('aria-pressed', 'true');
  await picker.getByRole('button', {name:'确认'}).click();
  await expect(entry).toContainText('楷体');
  await entry.click();
  await expect(picker.getByRole('button', {name:'楷体', exact:true})).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await page.getByRole('button', {name:'EN', exact:true}).click();
  await chip(page, 'font').click();
  await picker.getByRole('textbox').fill('仿宋');
  await expect(picker.getByRole('button', {name:'FangSong', exact:true})).toBeVisible();
});

test('mixed sentence generates recommendations without replacing resolved values or files', async ({page}) => {
  await page.goto('/compact.html');
  const scene = page.locator('.lite-sentence-example');
  await expect(scene.locator('[data-optical=preparing]')).toHaveCount(3);
  const file = scene.locator('[data-kind=document]');
  await expect(file).toContainText('+2');
  await expect(scene.locator('[data-optical=ambiguous-recommendation]')).toHaveCount(3);
  await scene.getByRole('button',{name:'重播生成'}).click();
  await expect(scene.locator('[data-optical=preparing]')).toHaveCount(3);
  await expect(file).toContainText('产品资料.p...');
  await expect(scene.locator('[data-optical=preparing]')).toHaveCount(0);
  await file.click();
  await expect(panel(page).getByRole('listitem')).toHaveCount(3);
  await panel(page).getByRole('button',{name:'移除 演讲提纲.txt'}).click();
  await expect(file).toContainText('+1');
  await panel(page).getByRole('button',{name:'重置'}).click();
  await expect(file).toContainText('+2');
});

test('each standalone footer is labelled and format reset restores the opening selection', async ({page}) => {
  await page.goto('/compact.html#/formats');
  for (const kind of controlKinds) {
    const footer=card(page, kind).locator('.lite-inline-panel .ic-widget-footer');
    await expect(footer.getByRole('button').first()).toHaveText('重置');
    await expect(footer.getByRole('button').last()).toHaveText('确认');
  }
  const view=card(page,'formats').locator('.lite-inline-panel');
  const word=view.getByRole('button',{name:'Word',exact:true});
  await word.click();
  await expect(word).toHaveAttribute('aria-pressed','true');
  await view.getByRole('button',{name:'重置'}).click();
  await expect(word).toHaveAttribute('aria-pressed','false');
  await expect(view.getByRole('button',{name:'PDF',exact:true})).toHaveAttribute('aria-pressed','true');
});
