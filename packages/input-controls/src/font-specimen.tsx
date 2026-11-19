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
