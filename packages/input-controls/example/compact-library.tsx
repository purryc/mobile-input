import {useEffect, useState} from 'react';
import {Link2, RotateCcw} from 'lucide-react';
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

  const [generation, setGeneration] = useState(0);
  const [generating, setGenerating] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setGenerating(false), 1650);
    return () => window.clearTimeout(timer);
  }, [generation]);
  const sceneChip = (kind: WidgetKind, initial: ChipSemanticState, sceneLabel?: string, initialColor?: string) =>
    <WidgetSpecimen {...{kind,initial,sceneLabel,initialColor,generating,panels,language,assetBase}} presentation="sentence"/>;
  const selected = 'default-selected', missing = 'needs-input', suggested = 'ambiguous-recommendation';
  return (
    <main className="lite-library ic-glass-tokens">
      <header className="lite-header">
        <h1>{name}</h1>
        <div className="lite-header-actions">
          <PackageDownload en={en}/>
          <button className="ic-glass-action" type="button" onClick={() => {
            panels.close();
            setLanguage(en ? 'zh-CN' : 'en');
          }}>{en ? '中文' : 'EN'}</button>
        </div>
      </header>
      <section className="lite-sentence-example" aria-labelledby="sentence-heading">
        <header><h2 id="sentence-heading">{en ? 'Product introduction · Mixed inputs' : '产品介绍 · 句内混排'}</h2>
          <button className="ic-glass-action" type="button" disabled={generating} onClick={() => {setGenerating(true);setGeneration(n=>n+1);}}>
            <RotateCcw aria-hidden size={14}/>{generating ? (en ? 'Generating…' : '生成中…') : (en ? 'Replay generation' : '重播生成')}</button></header>
        <p className="input-controls-theme" aria-busy={generating}>
          {en?'Prepare a product presentation lasting ':'做一份产品介绍 PPT，讲'}{sceneChip('duration',selected)}
          {en?'. Refer to ':'。参考'}{sceneChip('document','object-bound')}
          {en?', include ':'，放入'}{sceneChip('photo',missing,en?'Photos':'实拍照片')}
          {en?' and add ':'，补充'}{sceneChip('scanner',missing,en?'Scan a document':'扫描文档')}
          {en?'. Use ':'。背景用'}{sceneChip('color',selected,en?'Gray':'灰色','#CBD5E1')}
          {en?' for the background, ':'，主色用'}{sceneChip('color',selected,en?'Red':'红色','#DC3538')}
          {en?' as the accent and ':'，文字用'}{sceneChip('color',selected,en?'Black':'黑色','#1E293B')}
          {en?' for text. Choose ':'。整体'}{sceneChip('palette',suggested,en?'Warm and natural':'温暖自然')}
          {en?' and set the ':'，使用'}{sceneChip('font',missing,en?'Font':'字体')}
          {en?'. Sketch the product page ':'。产品展示页'}{sceneChip('sketch',missing,en?'Sketch':'画一下')}
          {en?'. Work with an ':'。请'}{sceneChip('expert',suggested,en?'Expert':'专家')}
          {en?', use a ':'协助，用'}{sceneChip('skills',suggested,en?'Skill':'技能')}
          {en?', connect ':'，连接'}{sceneChip('connectors',selected)}
          {en?' and deliver ':'，输出'}{sceneChip('formats',selected)}{en?'.':'。'}
        </p>
      </section>
      <PackageIntegration en={en}/>
      <div className="lite-grid">
        {controlKinds.map((kind: WidgetKind) => {
          const title = catalog[kind].title[en ? 1 : 0];
          const isMaterial = materialKinds.includes(kind);
          const states: ChipSemanticState[] = ['needs-input', isMaterial ? 'object-bound' : 'default-selected', 'ambiguous-recommendation'];
          return (
            <section id={'/' + kind} key={kind} className="lite-card" aria-labelledby={'title-' + kind} data-widget={kind}>
              <header className="lite-card-heading">
                <h2 id={'title-' + kind}>{title}</h2>
                <a className="ic-glass-action" href={'#/' + kind} aria-label={en ? 'Link to ' + title : title + '链接'}><Link2 size={16}/></a>
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
