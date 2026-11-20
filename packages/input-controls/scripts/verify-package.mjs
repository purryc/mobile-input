import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium, expect} from '@playwright/test';
import {build, preview} from 'vite';

const library = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(readFileSync(join(library, 'package.json'), 'utf8'));
const archive = process.argv[2]
  ? resolve(process.argv[2])
  : join(library, 'public/generated/input-controls', 'mobile-input-controls-' + manifest.version + '.tgz');
const host = mkdtempSync(join(realpathSync(tmpdir()), 'xiaoyi-controls-host-'));
const dependencies = ['react', 'react-dom', 'lucide-react', '@types/react', '@types/react-dom', 'typescript', 'vite'];
const env = {cwd: host, stdio: 'inherit'};
function npm(...args) {
  return process.env.npm_execpath
    ? execFileSync(process.execPath, [process.env.npm_execpath, ...args], env)
    : execFileSync('npm', args, env);
}

let server;
let browser;
try {
  writeFileSync(join(host, 'package.json'), JSON.stringify({name: 'widget-consumer', private: true, type: 'module'}));
  npm('install', '--ignore-scripts', '--no-audit', '--no-fund', archive,
    ...dependencies.map(name => name + '@' + manifest.devDependencies[name]));
  npm('exec', '--no', '--', 'input-controls-assets', './public/input-controls');
  cpSync(join(host, 'node_modules/@mobile-input/controls/examples/react-integration.tsx'), join(host, 'App.tsx'));
  cpSync(join(host, 'node_modules/@mobile-input/controls/examples/widgets'), join(host, 'examples'), {recursive: true});
  assert.ok(readFileSync(join(host, 'public/input-controls/assets/figma/presentation/noto-sans-sc-400.woff2')).length > 0);
  const {windowsFonts} = await import(join(host, 'node_modules/@mobile-input/controls/dist/font-widget.js'));
  assert.equal(windowsFonts.length, 10);
  for (const font of windowsFonts) {
    const slug = font.id.toLowerCase().replaceAll(' ', '-');
    const sample = readFileSync(join(host, 'public/input-controls/assets/xiaoyi-work/font-' + slug + '.png'));
    assert.equal(sample.readUint32BE(0), 0x89504e47);
  }
  writeFileSync(join(host, 'index.html'), '<!doctype html><html><head><meta charset="UTF-8"><title>Package smoke test</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>');
  writeFileSync(join(host, 'main.tsx'),
    "import {createRoot} from 'react-dom/client'; import App from './App'; createRoot(document.getElementById('root')!).render(<App/>);");
  writeFileSync(join(host, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx',
      strict: true, skipLibCheck: true, noEmit: true, types: ['vite/client'],
    },
    include: ['main.tsx', 'examples/*.tsx'],
  }));
  const widgets = ['duration', 'color', 'font', 'palette', 'document', 'image', 'scanner',
    'sketch', 'expert', 'skills', 'connectors', 'formats', 'capture'];
  execFileSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    const api = await import('@mobile-input/controls');
    assert.equal(api.controlKinds.length, 13);
    assert.equal(typeof api.InlineChip, 'function');
    for (const name of ${JSON.stringify(widgets)}) {
      const entry = await import('@mobile-input/controls/' + name + '-widget');
      assert.ok(Object.values(entry).some(value => typeof value === 'function'));
    }
  `], env);
  execFileSync(process.execPath, [
    join(host, 'node_modules/typescript/bin/tsc'), '--project', 'tsconfig.json',
  ], env);

  await build({root: host, configFile: false, base: '/consumer/'});
  server = await preview({root: host, configFile: false, base: '/consumer/', preview: {port: 0, host: '127.0.0.1'}});
  const address = server.httpServer.address();
  assert.ok(address && typeof address === 'object');
  browser = await chromium.launch({channel: 'chrome'});
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:' + address.port + '/consumer/');
  const chip = page.getByRole('button', {name: '演讲时长 10分钟'});
  await expect(chip).toBeVisible();
  await expect.poll(() => chip.locator('img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await chip.click();
  const panel = page.getByRole('dialog', {name: '时间'});
  const increment = panel.getByRole('button', {name: '增加一分钟'});
  await expect(increment).toHaveCSS('border-top-style', 'none');
  await increment.click();
  await expect(panel.getByRole('spinbutton')).toHaveValue('11');
  await panel.getByRole('button', {name: '确认', exact: true}).click();
  await expect(page.getByRole('button', {name: '演讲时长 11分钟'})).toBeVisible();
  console.log('Verified npm installation, 13 imports, types, assets and the production React example.');
} finally {
  await browser?.close();
  if (server) await new Promise(resolveClose => server.httpServer.close(resolveClose));
  rmSync(host, {recursive: true, force: true});
}
