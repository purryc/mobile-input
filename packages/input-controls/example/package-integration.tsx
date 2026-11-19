import {useState} from 'react';
import {Download} from 'lucide-react';
import manifest from '../package.json';
import reactExample from './react-integration.tsx?raw';

export const packageFilename = manifest.name.replace('@', '').replace('/', '-') + '-' + manifest.version + '.tgz';
export const packageDownloadPath = 'generated/input-controls/' + packageFilename;
export const packageReleaseUrl = 'https://github.com/purryc/mobile-input/releases/tag/input-controls-v' + manifest.version;

const install = [
  'npm install ./' + packageFilename,
  'npx --no-install input-controls-assets ./public/input-controls',
].join('\n');

export function PackageDownload({en}: {en: boolean}) {
  return (
    <a className="lite-package-download" href={import.meta.env.BASE_URL + packageDownloadPath}
      download={packageFilename}>
      <Download size={16} aria-hidden="true"/>
      {en ? 'Download npm package' : '下载完整 npm 包'}
      <span>{manifest.version}</span>
    </a>
  );
}

export function PackageIntegration({en}: {en: boolean}) {
  const [feedback, setFeedback] = useState<'install' | 'react' | 'failed' | null>(null);
  async function copy(part: 'install' | 'react') {
    try {
      await navigator.clipboard.writeText(part === 'install' ? install : reactExample);
      setFeedback(part);
    } catch {
      setFeedback('failed');
    }
  }

  return (
    <details className="lite-source lite-package-guide">
      <summary>{en ? 'Integrate with React' : '接入 React'}</summary>
      <p>{en
        ? 'In your React 19 project, put the downloaded .tgz in the project root and run these commands. The second command makes the bundled icons and media available to your app.'
        : '把下载的 .tgz 放到 React 19 项目根目录，执行下面两行。第二行会把包内的图标和素材复制到项目的静态目录。'}</p>
      <div className="lite-source-actions">
        <button type="button" onClick={() => void copy('install')}>{en ? 'Copy install commands' : '复制安装命令'}</button>
        <button type="button" onClick={() => void copy('react')}>{en ? 'Copy React integration' : '复制 React 接入示例'}</button>
      </div>
      {feedback && <p role="status">{feedback === 'failed'
        ? (en ? 'Select the code below to copy it.' : '请选中下方代码复制。')
        : (en ? 'Copied' : '已复制')}</p>}
      <pre aria-label={en ? 'Install commands' : '安装命令'}><code>{install}</code></pre>
      <p>{en
        ? 'This example is a Vite App.tsx. The host owns values and their callbacks. Each widget card has its own typed usage example.'
        : '以下可以直接作为 Vite 项目的 App.tsx。参数值和回调由你的应用控制，每张卡片还有对应 Widget 的接入示例。'}</p>
      <a href={packageReleaseUrl}>{en ? 'GitHub Release and source ZIP' : 'GitHub Release 与源码 ZIP'}</a>
      <pre aria-label={en ? 'React integration example' : 'React 完整接入示例'}><code>{reactExample}</code></pre>
    </details>
  );
}
