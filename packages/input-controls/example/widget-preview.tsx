import {useEffect, useId, useRef, useState, type ReactNode} from 'react';
import * as C from '../src';
import {definition} from './choices';
import {catalog} from './compact-catalog';
import {boundSample, materialKinds} from './material-samples';
import {createSketchFile} from '../src/sketch-geometry';
import {ComposerStage} from './composer-stage';
import './preview.css';
const choices={font:C.FontWidget,palette:C.PaletteWidget,expert:C.ExpertWidget,skills:C.SkillsWidget,connectors:C.ConnectorsWidget,formats:C.FormatsWidget};
const paths:Record<string,string>={duration:'M9 2h6M12 6a8 8 0 1 0 0 16 8 8 0 0 0 0-16M12 10v4l3-2',font:'M4 4h16M12 4v16M8 20h8',palette:'M12 3a9 9 0 1 0 0 18c3 0 1-4 4-4h2a4 4 0 0 0 4-4c0-6-5-10-10-10',expert:'M7 7a5 5 0 1 0 10 0 5 5 0 0 0-10 0M3 22a9 9 0 0 1 18 0',skills:'M3 20l9-9M14 3a5 5 0 0 0 7 7L18 7l2-4-4 2z',connectors:'M10 14l4-4M8 16l-2 2a4 4 0 0 1-6-6l5-5M16 8l2-2a4 4 0 0 1 6 6l-5 5',formats:'M5 2h10l4 4v16H5zM14 2v5h5',scanner:'M2 8V2h6M16 2h6v6M22 16v6h-6M8 22H2v-6M7 12h10',capture:'M3 3h18v14H3zM12 17v5M8 22h8'};
const translations:Record<string,string>={'关闭辅助输入':'Close panel','减少一分钟':'Decrease by one minute','增加一分钟':'Increase by one minute','演讲时长（分钟）':'Duration (minutes)','分钟':'min','选择图片':'Choose image','拍摄':'Capture','确认图片选择':'Confirm images','添加参考资料':'Add reference files','PDF、TXT、Markdown · 单份最多 8 MB':'PDF, TXT, Markdown · Max 8 MB each','布局画板':'Sketch canvas','画笔':'Pen','橡皮':'Eraser','撤销':'Undo','清空':'Clear','撤销笔迹':'Undo strokes','清空笔迹':'Clear strokes','采用布局草图':'Adopt sketch','色相':'Hue','色调':'Tone','确认布局草图':'Confirm sketch','拍摄图片':'Camera photo','关闭摄像头':'Close camera','材料预览':'Material preview','关闭预览':'Close preview','摄像头预览无法播放，请重试或选择本地图片。':'Camera preview cannot play. Retry or choose a local image.','无法打开摄像头，请允许摄像头权限，或选择本地图片。':'Unable to open camera. Allow camera permission or choose a local image.','图片保存失败，请重新拍摄。':'Image could not be saved. Please retake.','请输入六位HEX颜色值':'Enter a six-digit HEX color','查看 ':'Preview ','移除 ':'Remove '};
export const translate=(language:string)=>(s:string)=>language==='en'?(translations[s]||s):s;

export interface WidgetPreviewProps {
  kind: C.WidgetKind;
  language?: string;
  assetBase?: string;
}

type SpecimenOptions = {
  screenIntent?: C.ScreenCaptureWidgetProps["screenIntent"];
  initial: C.ChipSemanticState;
  panels: ReturnType<typeof C.useSinglePanel>;
  presentation?: "chip" | "inline";
};

export const chipStateLabels = {
  'needs-input': ['待补充', 'Needs input'],
  'default-selected': ['已选', 'Selected'],
  'ambiguous-recommendation': ['推荐', 'Recommendation'],
  'object-bound': ['已选', 'Selected'],
} as const satisfies Record<C.ChipSemanticState, readonly [string, string]>;

export function WidgetPreview({kind, language = 'zh-CN', assetBase = ''}: WidgetPreviewProps) {
  const [revision, setRevision] = useState(0);
  const en = language === 'en';
  return (
    <section className="controls-preview">
      <div className="controls-preview-heading">
        <h3>{en ? definition(kind).en : definition(kind).zh}</h3>
        <button type="button" onClick={() => setRevision(value => value + 1)}>{en ? 'Reset' : '重置'}</button>
      </div>
      <InteractiveWidget key={kind + revision + language} kind={kind} language={language} assetBase={assetBase}/>
    </section>
  );
}

export function WidgetSpecimen({initial, panels, presentation, screenIntent, ...props}: WidgetPreviewProps & SpecimenOptions) {
  return <InteractiveWidget {...props} specimen={{initial, panels, presentation, screenIntent}}/>;
}

function InteractiveWidget({
  kind, language = 'zh-CN', assetBase = '', specimen,
}: WidgetPreviewProps & {specimen?: SpecimenOptions}) {
  const en = language === 'en';
  const t = (zh: string, english: string) => en ? english : zh;
  const def = definition(kind);
  const isMaterial = materialKinds.includes(kind);
  const inline = specimen?.presentation === "inline";
  const title = specimen ? catalog[kind].title[en ? 1 : 0] : t(def.zh, def.en);
  const owner = useId();
  const panelId = useId();
  const stateLabelId = useId();
  const localPanels = C.useSinglePanel();
  const panels = specimen?.panels ?? localPanels;
  const [inlineOpen, setInlineOpen] = useState(true);
  const inlineSummary = useRef<HTMLElement>(null);
  const open = inline ? inlineOpen : panels.active === owner;
  const initial = specimen?.initial ?? 'needs-input';

  const [sampleDocument] = useState(() => specimen && kind === 'document'
    ? boundSample(kind).files?.[0]
    : undefined);
  const [sample] = useState(() => {
    if (initial !== 'object-bound') return {};
    return sampleDocument ? {files: [sampleDocument]} : boundSample(kind);
  });
  const [semantic, setSemantic] = useState<C.ChipSemanticState>(initial === 'object-bound' ? 'needs-input' : initial);
  const [origin, setOrigin] = useState<C.ControlOrigin>(initial === 'ambiguous-recommendation' ? 'recommended' : 'explicit');
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [duration, setDuration] = useState('10');
  const [color, setColor] = useState('#356FE4');
  const [values, setValues] = useState<string[]>(() => {
    if (initial !== 'default-selected' || isMaterial) return [];
    if (specimen && kind === 'palette') return ['calm'];
    if (specimen && kind === 'connectors') return ['ima'];
    if (specimen && kind === 'formats') return ['pptx', 'pdf'];
    return def.options.slice(0, 1).map(option => option.id);
  });
  const [files, setFiles] = useState<File[]>(sample.files ?? []);
  const [pending, setPending] = useState<File[]>([]);
  const [captures, setCaptures] = useState<C.CaptureMaterial[]>(sample.captures ?? []);
  const [strokes, setStrokes] = useState<number[][][]>([]);
  const [sketch, setSketch] = useState<File | null>(sample.sketch ?? null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<File | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const secondAnchor = useRef<HTMLSpanElement>(null);
  const previewTrigger = useRef<HTMLElement | null>(null);

  const screenIntent = specimen?.screenIntent;
  const confirmedCaptures = captures.filter(item => item.confirmed);
  const names = [...files.map(file => file.name), ...(sketch ? [sketch.name] : []), ...confirmedCaptures.map(item => item.name)];
  const state = screenIntent ? 'default-selected' : specimen && names.length ? 'object-bound' : semantic;
  const emit = (event: string, value: unknown = '') => {
    if (!specimen) setEvents(previous => [JSON.stringify({event, owner, value}), ...previous].slice(0, 8));
  };
  const compact = Boolean(specimen);
  useEffect(() => {
    if (compact && !open) {
      if (kind !== 'document') setPreview(null);
    }
  }, [compact, kind, open]);

  function closePanel() {
    if (inline) {
      setInlineOpen(false);
      inlineSummary.current?.focus({preventScroll: true});
      return;
    }
    panels.close();
    requestAnimationFrame(() => anchor.current?.querySelector('button')?.focus({preventScroll: true}));
  }
  function changed(value: unknown) {
    setSemantic(Array.isArray(value) && value.length === 0 && specimen ? 'needs-input' : 'default-selected');
    setOrigin('manual');
    emit('change', value);
  }
  function adoptMaterial(value: unknown) {
    if (specimen) {
      setSemantic('needs-input');
      setOrigin('manual');
    } else changed(value);
  }
  function confirm() {
    if (!specimen) {
      const unresolved = Boolean(choices[kind as keyof typeof choices]) && !values.length ||
        (kind === 'document' || kind === 'photo') && !files.length && !pending.length ||
        (kind === 'scanner' || kind === 'capture') && !captures.length;
      if (!unresolved) setSemantic('default-selected');
      emit(unresolved ? 'close' : 'confirm', values);
    } else if (kind === 'duration' || kind === 'color') {
      setSemantic('default-selected');
      setOrigin('manual');
    }
    closePanel();
  }

  const selected = values.map(value => {
    const option = def.options.find(candidate => candidate.id === value);
    return option ? t(option.zh, option.en) : value;
  }).join(' / ');
  const needsLabel = specimen && kind === 'document' ? t('参考文件', 'Reference file') : title;
  const resolvedLabel = kind === 'duration' ? duration + t('分钟', ' min')
    : kind === 'color' ? color
    : selected || names[0] || title;
  const label = screenIntent === 'screenshot' ? t('截图', 'Screenshot')
    : screenIntent === 'recording' ? t('录屏', 'Recording')
    : state === 'object-bound' ? names[0]
    : state === 'needs-input' ? needsLabel
    : state === 'ambiguous-recommendation' && specimen ? catalog[kind].suggestion[en ? 1 : 0]
    : resolvedLabel;
  const artwork = values[0] ? C.controlOptionArtwork(kind, values[0]) : undefined;
  const standardIcon = specimen && (kind !== 'color' || state !== 'default-selected')
    ? 'assets/xiaoyi-work/design-inline-' + (kind === 'color' ? 'palette' : kind) + '.svg'
    : undefined;
  const icon = artwork ?? standardIcon;
  const token: C.InlineChipToken = {
    id: owner, kind, role: title, phrase: '', label,
    value: screenIntent ?? (state === 'needs-input' ? '' : kind === 'color' && (!specimen || state === 'default-selected') ? color : label),
    origin, semanticState: state,
    additionalObjectCount: state === 'object-bound' ? names.length - 1 : undefined,
    removable: origin === 'recommended' && (!specimen || state === 'ambiguous-recommendation'),
    preparing: loading,
    iconPath: specimen ? undefined : paths[kind] || (kind === 'color' ? paths.palette : undefined),
    iconSrc: icon ? C.assetUrl(assetBase, icon) : undefined,
    recommendationIconSrc: specimen ? C.assetUrl(assetBase, 'assets/xiaoyi-work/design-inline-sparkles.svg') : undefined,
    animate: state === 'ambiguous-recommendation', sweepKey: owner + state,
  };
  const Choice = choices[kind as keyof typeof choices];
  const Capture = kind === 'scanner' ? C.ScannerWidget : C.ScreenCaptureWidget;
  const chooseLocal = () => fileInput.current?.click();

  function pick(list: File[]) {
    if (!list.length) return;
    if (kind === 'document') {
      setFiles(previous => [...previous, ...list]);
      adoptMaterial(list.map(file => file.name));
    } else setPending(previous => [...previous, ...list]);
    emit('select-local-files', list.map(file => file.name));
  }
  function cards(list: File[], remove: (index: number) => void) {
    return list.map((file, index) => (
      <C.AttachmentCard key={index} file={file}
        onPreview={() => {
          previewTrigger.current = document.activeElement as HTMLElement | null;
          setPreview(file);
        }}
        onRemove={() => {remove(index); emit('remove-file', file.name);}}/>
    ));
  }
  const selectedFiles = cards(files, index => setFiles(previous => previous.filter((_, position) => index !== position)));
  const adoptedSketch = sketch && cards([sketch], () => {
    setSketch(null);
    if (specimen) setStrokes([]);
  });

  function widget(): ReactNode {
    if (Choice) return (
      <Choice binding={{id: owner, kind, origin, value: values}} definition={def} owner={owner} language={language}
        onEvent={event => {
          if (event.owner !== owner || event.id !== owner) return;
          if (event.type === 'close') confirm();
          else if (event.value) {setValues(event.value); changed(event.value);}
        }}/>
    );
    switch (kind) {
      case 'duration':
        return <C.DurationWidget value={duration} onChange={value => {setDuration(value); changed(value);}} onDone={confirm}/>;
      case 'color':
        return <C.ColorWidget value={color} label={title} onChange={value => {setColor(value); changed(value);}} onActive={() => {}} onDone={confirm}/>;
      case 'document': {
        if (!sampleDocument) {
          return <C.DocumentWidget onChoose={chooseLocal} onDone={confirm}>{selectedFiles}</C.DocumentWidget>;
        }
        const sampleId = 'product-brief';
        const hasSample = files.includes(sampleDocument);
        return <C.DocumentWidget onChoose={chooseLocal} choices={{
          binding: {id: owner, kind, origin, value: hasSample ? [sampleId] : []},
          definition: {...def, options: [{id: sampleId, zh: sampleDocument.name, en: sampleDocument.name}]},
          owner,
          language,
          materials: files.filter(file => file !== sampleDocument).map((file, index) => ({
            id: 'local-file-' + index,
            name: file.name,
          })),
          onEvent: event => {
            if (event.owner !== owner || event.id !== owner) return;
            if (event.type === 'close') confirm();
            if (event.type === 'change' && event.value?.includes(sampleId) && !hasSample) pick([sampleDocument]);
          },
        }}/>;
      }
      case 'photo':
        return (
          <C.ImageWidget canConfirm={!specimen || pending.length > 0} onChoose={chooseLocal} onDone={() => {
            if (pending.length) {
              setFiles(previous => [...previous, ...pending]);
              setPending([]);
              if (specimen) adoptMaterial(pending.map(file => file.name));
            }
            confirm();
          }}>
            {specimen && selectedFiles}
            {cards(pending, index => setPending(previous => previous.filter((_, position) => index !== position)))}
          </C.ImageWidget>
        );
      case 'sketch':
        return (
          <>
            {specimen && sketch && <div className="lite-adopted-sketch">{adoptedSketch}</div>}
            <C.SketchWidget strokes={strokes} onChange={setStrokes} onActive={() => {}} onAdopt={() => {
              const adopted = createSketchFile(strokes, specimen ? '布局草图.svg' : undefined);
              setSketch(adopted);
              if (specimen) adoptMaterial(adopted.name);
              confirm();
            }}/>
          </>
        );
      default:
        return (
          <Capture key={inline && kind === 'scanner' && panels.active ? 'background' : 'foreground'}
            items={captures} language={language}
            {...(screenIntent ? {screenIntent} : {})}
            {...(inline && kind === 'scanner' ? {deferCameraUntilSelection: true} : {})}
            {...(kind === 'scanner' && initial === 'object-bound' ? {initialCameraMode: captures[0]?.cameraMode ?? 'scan'} : {})}
            onAdd={item => {setCaptures(previous => [...previous, item]); emit('capture', item.name);}}
            onRemove={id => {setCaptures(previous => previous.filter(item => item.id !== id)); emit('remove-capture', id);}}
            onConfirm={() => {
              setCaptures(previous => previous.map(item => ({...item, confirmed: true})));
              if (specimen) adoptMaterial(captures.map(item => item.name));
              confirm();
            }}
            onBusy={setBusy} onCancel={kind === 'scanner' || !inline ? closePanel : undefined}/>
        );
    }
  }

  const chip = (
    <span ref={anchor} className="controls-chip-anchor">
      {removed ? (
        <button type="button" className="controls-restore" onClick={() => {
          setRemoved(false);
          requestAnimationFrame(() => anchor.current?.querySelector('button')?.focus());
        }}>{specimen ? t('恢复推荐', 'Restore recommendation') : t('恢复入口', 'Restore entry')}</button>
      ) : (
        <C.InlineChip token={token} expanded={open} controlsId={panelId} describedBy={specimen ? stateLabelId : undefined} disabled={disabled}
          onOpen={() => {panels.toggle(owner); emit('open', kind);}} onRemove={() => {
            setRemoved(true);
            if (!specimen || open) panels.close();
            emit('remove-recommendation');
            if (specimen) requestAnimationFrame(() => anchor.current?.querySelector('button')?.focus());
          }}/>
      )}
    </span>
  );
  const panelContent = (
    <C.AuxiliaryPanel title={title} onClose={closePanel}>
      {widget()}
    </C.AuxiliaryPanel>
  );
  const overlays = (
    <>
      {!inline && <C.AnchoredPanel anchor={anchor} open={open} id={panelId} label={title} width={C.widgetWidths[kind]} onClose={panels.close}>
        {specimen ? <ComposerStage kind={kind} popover>{panelContent}</ComposerStage> : panelContent}
      </C.AnchoredPanel>}
      {(kind === 'document' || kind === 'photo') && (
        <input ref={fileInput} type="file" multiple hidden accept={kind === 'document' ? '.pdf,.txt,.md' : 'image/*'}
          onChange={event => {pick(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = '';}}/>
      )}
      {preview && (!specimen || open || kind === 'document') && (
        <FilePreview file={preview} language={language} onClose={() => {
          setPreview(null);
          if (specimen) requestAnimationFrame(() => previewTrigger.current?.focus());
        }}/>
      )}
    </>
  );

  if (inline) return (
    <details className="lite-widget-preview" open={inlineOpen} onToggle={event => setInlineOpen(event.currentTarget.open)}>
      <summary ref={inlineSummary}>{t('独立 Widget', 'Standalone widget')}</summary>
      {inlineOpen && (
        <C.WidgetProvider language={language} translate={translate(language)} assetBase={assetBase}>
          {sampleDocument && <div className="lite-document-materials input-controls-theme">{selectedFiles}</div>}
          <ComposerStage kind={kind}>
            <C.WidgetSurface>
              <div className="lite-inline-panel" style={{width: C.widgetWidths[kind], maxWidth: '100%'}}>{panelContent}</div>
              {overlays}
            </C.WidgetSurface>
          </ComposerStage>
        </C.WidgetProvider>
      )}
    </details>
  );

  if (specimen) return (
    <div className="lite-specimen input-controls-theme" data-example={screenIntent ?? initial}>
      <span id={stateLabelId} className="lite-state-label">{screenIntent ? t('明确意图', 'Explicit intent') : chipStateLabels[state][en ? 1 : 0]}</span>
      <C.WidgetProvider language={language} translate={translate(language)} assetBase={assetBase}>
        {chip}
        {screenIntent && confirmedCaptures.length > 0 && <div className="lite-document-materials ic-demo-materials">
          {confirmedCaptures.map(item => <C.CaptureTile key={item.id} item={item} compact
            onRemove={() => setCaptures(previous => previous.filter(other => other.id !== item.id))}/>)}
        </div>}
        {sampleDocument && <div className="lite-document-materials">{selectedFiles}</div>}
        {overlays}
      </C.WidgetProvider>
    </div>
  );

  return (
    <>
      <div className="controls-preview-options">
        <label>{t('语义状态', 'Semantic state')}
          <select aria-label="Semantic state" value={semantic} onChange={event => {
            const next = event.target.value as C.ChipSemanticState;
            panels.close();
            setRemoved(false);
            setSemantic(next);
            if (next !== 'needs-input' && !values.length && def.options.length) setValues([def.options[0].id]);
          }}>
            <option value="needs-input">{t('待补充', 'Needs input')}</option>
            <option value="default-selected">{t('默认已选', 'Default selected')}</option>
            <option value="ambiguous-recommendation">{t('模糊推荐', 'Ambiguous recommendation')}</option>
          </select>
        </label>
        <label>{t('来源', 'Origin')}
          <select aria-label="Origin" value={origin} onChange={event => setOrigin(event.target.value as C.ControlOrigin)}>
            <option value="explicit">{t('用户指定', 'Explicit')}</option>
            <option value="recommended">{t('AI推荐', 'Recommended')}</option>
            <option value="manual">{t('手动修改', 'Manual')}</option>
          </select>
        </label>
        <label><input type="checkbox" checked={disabled} onChange={event => {setDisabled(event.target.checked); panels.close();}}/>{t('禁用', 'Disabled')}</label>
        <label><input type="checkbox" checked={loading} onChange={event => {setLoading(event.target.checked); panels.close();}}/>{t('加载', 'Loading')}</label>
      </div>
      <div className="controls-preview-stage input-controls-theme">
        <C.WidgetProvider language={language} translate={translate(language)} assetBase={assetBase}>
          <div className="ic-demo-materials">
            {selectedFiles}
            {adoptedSketch}
            {confirmedCaptures.map(item => <C.CaptureTile key={item.id} item={item} compact onRemove={() => setCaptures(previous => previous.filter(entry => entry.id !== item.id))}/>)}
          </div>
          <div className="ic-live-wb-composer ic-demo-composer">
            <div className="ic-wb-sentence-composer">
              {t('准备产品介绍，使用', 'Prepare a product introduction using ')}{chip}{t('作为输入。', ' as input.')}{' '}
              <span ref={secondAnchor}>
                <C.InlineChip token={{id: owner + 'second', kind: 'duration', role: t('独立实例', 'Second instance'), label: t('独立实例', 'Second instance'), value: '5', phrase: '', semanticState: 'default-selected', iconPath: paths.duration}} expanded={panels.active === 'second'} onOpen={() => panels.toggle('second')}/>
              </span>
            </div>
          </div>
          {overlays}
          <C.AnchoredPanel anchor={secondAnchor} open={panels.active === 'second'} id={panelId + 'second'} label={t('独立实例', 'Second instance')} width={288} onClose={panels.close}>
            <SecondInstance onClose={panels.close}/>
          </C.AnchoredPanel>
        </C.WidgetProvider>
      </div>
      <details className="controls-preview-values" open>
        <summary>{t('当前值与事件', 'Current value & events')}</summary>
        <pre data-testid="current-value">{JSON.stringify({
          kind, semanticState: semantic, origin,
          value: kind === 'duration' ? duration : kind === 'color' ? color : values,
          files: files.map(file => file.name), pendingImages: pending.length, strokes: strokes.length,
          captures: captures.map(({name, confirmed}) => ({name, confirmed})), busy,
        }, null, 2)}</pre>
        <ol aria-label="Events">{events.map((event, index) => <li key={index}>{event}</li>)}</ol>
      </details>
    </>
  );
}


function SecondInstance({onClose}: {onClose: () => void}) {
  const [value, setValue] = useState('5');
  return (
    <C.AuxiliaryPanel title="Independent instance" onClose={onClose}>
      <C.DurationWidget value={value} onChange={setValue} onDone={onClose}/>
    </C.AuxiliaryPanel>
  );
}

function FilePreview({file, onClose, language}: {file: File; onClose: () => void; language: string}) {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const isText = file.type.startsWith('text/') || /\.(md|txt)$/i.test(file.name);
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    let active = true;
    if (isText) void file.text().then(value => {if (active) setContent(value);}).catch(() => {});
    return () => {active = false; URL.revokeObjectURL(next);};
  }, [file, isText]);
  return (
    <div className="ic-demo-modal" role="dialog" aria-label={file.name} aria-modal="true"
      onKeyDown={event => {if (event.key === 'Escape') {event.stopPropagation(); onClose();}}}>
      <section>
        <header><b>{file.name}</b><button type="button" autoFocus onClick={onClose}>{language === 'en' ? 'Close' : '关闭'}</button></header>
        {file.type.startsWith('image/') ? <img src={url} alt={file.name}/>
          : isText ? <pre className="controls-file-text">{content}</pre>
          : file.type === 'application/pdf' && url ? <object className="controls-file-pdf" data={url} type={file.type} aria-label={file.name}/> : null}
        {url && !file.type.startsWith('image/') && <a href={url} download={file.name}>{language === 'en' ? 'Download file' : '下载文件'}</a>}
      </section>
    </div>
  );
}
