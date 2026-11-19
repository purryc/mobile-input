import {useState} from 'react';
import type {WidgetKind} from '../src/types';

const sourceFiles = {
  duration: ['duration-widget', 'DurationWidget'],
  color: ['color-widget', 'ColorWidget'],
  font: ['font-widget', 'FontWidget'],
  palette: ['palette-widget', 'PaletteWidget'],
  document: ['document-widget', 'DocumentWidget'],
  photo: ['image-widget', 'ImageWidget'],
  scanner: ['scanner-widget', 'ScannerWidget'],
  sketch: ['sketch-widget', 'SketchWidget'],
  expert: ['expert-widget', 'ExpertWidget'],
  skills: ['skills-widget', 'SkillsWidget'],
  connectors: ['connectors-widget', 'ConnectorsWidget'],
  formats: ['formats-widget', 'FormatsWidget'],
  capture: ['capture-widget', 'ScreenCaptureWidget'],
} as const satisfies Record<WidgetKind, readonly [string, string]>;

const examples = import.meta.glob<string>('./integration/*.tsx', {query: '?raw', import: 'default', eager: true});
const source = import.meta.glob<string>('../src/*-widget.tsx', {query: '?raw', import: 'default'});

export function ComponentSource({kind, en}: {kind: WidgetKind; en: boolean}) {
  const t = (zh: string, english: string) => en ? english : zh;
  const [file, component] = sourceFiles[kind];
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'copied' | 'copy-error' | 'source-error' | ''>('');
  const example = examples['./integration/' + kind + '.tsx'];
  const filename = file + '.tsx';
  const loadSource = () => source['../src/' + filename]();

  async function downloadSource() {
    try {
      const blob = new Blob([code || await loadSource()], {type: 'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('');
    } catch {
      setStatus('source-error');
    }
  }

  return (
    <details className="lite-source">
      <summary>{t('源码与用法', 'Source & usage')}</summary>
      <div className="lite-source-content">
        <dl>
          <div><dt>{t('源码', 'Source')}</dt><dd><code>src/{filename}</code></dd></div>
          <div><dt>Props</dt><dd><code>{component}Props</code></dd></div>
          <div><dt>{t('样式', 'Styles')}</dt><dd><code>@mobile-input/controls/desktop.css</code></dd></div>
          <div><dt>{t('素材', 'Assets')}</dt><dd><code>public/assets/</code> · <code>public/reference-assets/</code></dd></div>
        </dl>
        <p>{t('向示例传入 environment。assetBase 指向素材目录，language 和 translate 用于本地化。', 'Pass your environment to the example. Set assetBase to the public assets folder and provide language and translate for localization.')}</p>
        {(kind === 'scanner' || kind === 'capture') && <p>{t('adapter 可替换采集实现，items 和确认回调由宿主管理。', 'Supply an adapter to replace browser acquisition. The host owns items and confirmation.')}</p>}
        <p>{t('下载的是这个组件的 TSX 入口。接入时还需要控件库的共享代码、样式和素材。', 'The download is the component TSX entry. Integration also uses the library’s shared code, styles, and assets.')}</p>
        <div className="lite-source-actions">
          <button type="button" onClick={() => void downloadSource()}>{t('下载 ' + filename, 'Download ' + filename)}</button>
          <button type="button" onClick={async () => {
            try {
              await navigator.clipboard.writeText(example);
              setStatus('copied');
            } catch {
              setStatus('copy-error');
            }
          }}>{t('复制示例', 'Copy example')}</button>
          <button type="button" aria-expanded={Boolean(code)} onClick={async () => {
            if (code) {setCode(''); return;}
            try {
              setCode(await loadSource());
              setStatus('');
            } catch {
              setStatus('source-error');
            }
          }}>{code ? t('收起组件源码', 'Hide component source') : t('查看组件源码', 'View component source')}</button>
        </div>
        {status && <p role="status">{status === 'copied' ? t('已复制', 'Copied')
          : status === 'copy-error' ? t('请选中下方代码复制。', 'Select and copy the code below.')
          : t('源码加载失败，请重试。', 'Source could not load. Try again.')}</p>}
        <pre aria-label={t('React 接入示例', 'React integration example')}><code>{example}</code></pre>
        {code && <pre aria-label={t('组件源码', 'Component source')}><code>{code}</code></pre>}
      </div>
    </details>
  );
}
