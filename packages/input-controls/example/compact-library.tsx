import {useEffect, useState} from 'react';
import {Link2} from 'lucide-react';
import {controlKinds, useSinglePanel, type ChipSemanticState, type WidgetKind} from '../src';
import {WidgetSpecimen} from './widget-preview';
import {catalog} from './compact-catalog';
import {materialKinds} from './material-samples';
import {ComponentSource} from './component-source';
import {PackageDownload, PackageIntegration} from './package-integration';
import '../src/desktop.css';
import './compact-library.css';

export function CompactLibrary({assetBase = ''}: {assetBase?: string}) {
  const [language, setLanguage] = useState('zh-CN');
  const panels = useSinglePanel();
  const en = language === 'en';
  const name = en ? 'Xiaoyi Work Input Controls' : '小艺 Work 输入控件';

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = name;
  }, [language, name]);

  useEffect(() => {
    function showLinkedCard() {
      const id = location.hash.slice(1);
      if (id.startsWith('/')) document.getElementById(id)?.scrollIntoView();
    }
    showLinkedCard();
    window.addEventListener('hashchange', showLinkedCard);
    return () => window.removeEventListener('hashchange', showLinkedCard);
  }, []);

  return (
    <main className="lite-library">
      <header className="lite-header">
        <h1>{name}</h1>
        <div className="lite-header-actions">
          <PackageDownload en={en}/>
          <button type="button" onClick={() => {
            panels.close();
            setLanguage(en ? 'zh-CN' : 'en');
          }}>{en ? '中文' : 'EN'}</button>
        </div>
      </header>
      <PackageIntegration en={en}/>
      <div className="lite-grid">
        {controlKinds.map((kind: WidgetKind) => {
          const title = catalog[kind].title[en ? 1 : 0];
          const isMaterial = materialKinds.includes(kind);
          const states: ChipSemanticState[] = kind === 'document'
            ? ['needs-input', 'ambiguous-recommendation']
            : ['needs-input', isMaterial ? 'object-bound' : 'default-selected', 'ambiguous-recommendation'];
          return (
            <section id={'/' + kind} key={kind} className="lite-card" aria-labelledby={'title-' + kind} data-widget={kind}>
              <header className="lite-card-heading">
                <h2 id={'title-' + kind}>{title}</h2>
                <a href={'#/' + kind} aria-label={en ? 'Link to ' + title : title + '链接'}><Link2 size={16}/></a>
              </header>
              <p className="lite-widget-description">{catalog[kind].description[en ? 1 : 0]}</p>
              <div className="lite-composer-preview">
                <div className="lite-specimens">
                  {kind === 'capture' && (['screenshot', 'recording'] as const).map(screenIntent => (
                    <WidgetSpecimen key={screenIntent} {...{kind, screenIntent, language, assetBase, panels}} initial="default-selected"/>
                  ))}
                  {states.map(initial => (
                    <WidgetSpecimen key={initial} {...{kind, initial, language, assetBase, panels}}/>
                  ))}
                </div>
                <WidgetSpecimen {...{kind, language, assetBase, panels}} initial={isMaterial ? 'needs-input' : 'default-selected'} presentation="inline"/>
              </div>
              <ComponentSource kind={kind} en={en}/>
            </section>
          );
        })}
      </div>
    </main>
  );
}
