import {useEffect, useState} from 'react';
import {assetUrl, useWidgetEnvironment} from './environment';
import {windowsFontSpecimen} from './windows-fonts';

export function FontSample({family, fallback}: {family: string; fallback: string}) {
  const {assetBase} = useWidgetEnvironment();
  const preset = windowsFontSpecimen(family);
  if (!preset) return <span className="ic-demo-font-example" style={{fontFamily:family}}>{fallback}</span>;
  const slug = preset.id.toLowerCase().replaceAll(' ', '-');
  return <img className="ic-windows-font-sample" alt={preset.sample}
    src={assetUrl(assetBase, 'assets/xiaoyi-work/font-' + slug + '.png')}/>;
}

export function SelectedFontPreview({family, en}: {family: string; en: boolean}) {
  const preset = windowsFontSpecimen(family);
  const [status, setStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  useEffect(() => {
    if (!preset) return;
    let active = true;
    async function check() {
      try {
        await new FontFace('InputControlsLocalProbe', 'local(' + JSON.stringify(family) + ')').load();
        if (active) setStatus('available');
      } catch {
        if (active) setStatus('unavailable');
      }
    }
    void check();
    return () => { active = false; };
  }, [family, preset]);
  if (!preset) return <span style={{fontFamily: family}}>{family}</span>;
  const name = en ? preset.id : preset.zh;
  return <span role="status">{name}{status === 'available'
    ? (en ? ' · Available in this browser' : ' · 当前浏览器可用')
    : status === 'unavailable' ? (en ? ' · Specimen only in this browser' : ' · 此浏览器仅预览字样') : ''}</span>;
}
