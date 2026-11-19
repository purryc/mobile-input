import {readFile} from 'node:fs/promises';
import {test, expect} from '@playwright/test';
import manifest from '../../../packages/input-controls/package.json' with {type: 'json'};

const site = process.env.DESIGN_SYSTEM_URL || 'http://127.0.0.1:5297/mobile-input/';

test('compact website offers the npm archive and copyable React code', async ({page, context}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto(site + 'xiaoyi-controls.html#/duration');
  await expect(page.locator('.lite-card')).toHaveCount(13);
  await expect(page.locator('.site-header')).toHaveCount(0);
  await expect(page.locator('.lite-widget-preview[open]')).toHaveCount(13);

  const filename = 'mobile-input-controls-' + manifest.version + '.tgz';
  const download = page.waitForEvent('download');
  await page.getByRole('link', {name: /下载完整 npm 包/}).click();
  const archive = await download;
  expect(archive.suggestedFilename()).toBe(filename);
  const bytes = await readFile((await archive.path())!);
  expect(bytes.subarray(0, 2)).toEqual(Buffer.from([0x1f, 0x8b]));

  const guide = page.locator('.lite-package-guide');
  await guide.locator('summary').click();
  await guide.getByRole('button', {name: '复制安装命令'}).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(filename);
  await guide.getByRole('button', {name: '复制 React 接入示例'}).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('@mobile-input/controls/desktop.css');
  await guide.locator('summary').click();

  const chip = page.locator('[data-widget=duration] [data-example=default-selected] .ic-sentence-token');
  await chip.click();
  await page.locator('.input-controls-popover').getByRole('button', {name: '增加一分钟', exact: true}).click();
  await expect(chip).toContainText('11分钟');
  expect(requests.filter(url => /@a2ui|\/registry\.json|\/src\/main\.tsx/.test(url))).toEqual([]);

  await page.goto(site + '#/components/input-duration');
  await expect(page.locator('.site-header')).toBeVisible();
  await expect(page.getByLabel('Semantic state', {exact: true})).toBeVisible();
  await expect(page.getByRole('link', {name: '下载完整 npm 包', exact: true})).toHaveAttribute('href', new RegExp(filename + '$'));
  await page.getByText('查看调用代码', {exact: true}).click();
  await page.getByRole('button', {name: '复制代码', exact: true}).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('@mobile-input/controls/duration-widget');
});
