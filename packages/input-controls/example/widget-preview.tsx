import {useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import * as C from '../src';
import {definition} from './choices';
import {catalog} from './compact-catalog';
import {boundSample, materialKinds} from './material-samples';
import {createSketchFile} from '../src/sketch-geometry';
import {ComposerStage} from './composer-stage';
import './preview.css';
const choices={font:C.FontWidget,palette:C.PaletteWidget,expert:C.ExpertWidget,skills:C.SkillsWidget,connectors:C.ConnectorsWidget,formats:C.FormatsWidget};
const translations:Record<string,string>={'关闭辅助输入':'Close panel','减少一分钟':'Decrease by one minute','增加一分钟':'Increase by one minute','演讲时长（分钟）':'Duration (minutes)','分钟':'min','选择图片':'Choose image','拍摄':'Capture','确认图片选择':'Confirm images','添加参考资料':'Add reference files','PDF、TXT、Markdown · 单份最多 8 MB':'PDF, TXT, Markdown · Max 8 MB each','布局画板':'Sketch canvas','绘画工具':'Drawing tools','画笔':'Pen','橡皮':'Eraser','撤销':'Undo','清空':'Clear','撤销笔迹':'Undo strokes','清空笔迹':'Clear strokes','采用布局草图':'Adopt sketch','色相':'Hue','色调':'Tone','确认布局草图':'Confirm sketch','拍摄图片':'Camera photo','关闭摄像头':'Close camera','材料预览':'Material preview','关闭预览':'Close preview','摄像头预览无法播放，请重试或选择本地图片。':'Camera preview cannot play. Retry or choose a local image.','无法打开摄像头，请允许摄像头权限，或选择本地图片。':'Unable to open camera. Allow camera permission or choose a local image.','图片保存失败，请重新拍摄。':'Image could not be saved. Please retake.','请输入六位HEX颜色值':'Enter a six-digit HEX color','查看 ':'Preview ','移除 ':'Remove '};
export const translate=(language:string)=>(s:string)=>language==='en'?(translations[s]||s):s;

type FileAttachment = {id: string; file: File};

export interface WidgetPreviewProps {
  kind: C.WidgetKind;
  language?: string;
  assetBase?: string;
}

type SpecimenOptions = {
  generating?: boolean;
  sceneLabel?: string;
  initialColor?: string;
  screenIntent?: C.ScreenCaptureWidgetProps["screenIntent"];
  initial: C.ChipSemanticState;
  panels: ReturnType<typeof C.useSinglePanel>;
  presentation?: "chip" | "inline" | "sentence";
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

export function WidgetSpecimen({initial, panels, presentation, screenIntent, generating, sceneLabel, initialColor, ...props}: WidgetPreviewProps & SpecimenOptions) {
  return <InteractiveWidget {...props} specimen={{initial, panels, presentation, screenIntent, generating, sceneLabel, initialColor}}/>;
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

  const [sample] = useState(() => {
    if(initial !== 'object-bound') return {};
    const sample = boundSample(kind);
    if(kind === 'document' && specimen?.presentation === 'sentence') {
      sample.files = [...(sample.files ?? []), new File(['面向新用户介绍产品。'],'演讲提纲.txt',{type:'text/plain'}), new File(['# 产品亮点'],'功能说明.md',{type:'text/markdown'})];
    }
    return sample;
  });
  const [semantic, setSemantic] = useState<C.ChipSemanticState>(initial === 'object-bound' ? 'needs-input' : initial);
  const [origin, setOrigin] = useState<C.ControlOrigin>(initial === 'ambiguous-recommendation' ? 'recommended' : 'explicit');
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [duration, setDuration] = useState(inline && kind==='duration' ? '15' : '10');
  const [unit,setUnit] = useState<C.DurationUnit>(inline && kind==='duration' ? 's' : 'm');
  const [color, setColor] = useState(specimen?.initialColor ?? '#356FE4');
  const [values, setValues] = useState<string[]>(() => {
    if (initial !== 'default-selected' || isMaterial) return [];
    if (specimen && kind === 'palette') return ['calm'];
    if (specimen && kind === 'connectors') return [specimen.presentation==='sentence' ? 'tencent-docs' : 'ima'];
    if (specimen && kind === 'formats') return ['pptx', 'pdf'];
    return def.options.slice(0, 1).map(option => option.id);
  });
  const nextFileId = useRef(0);
  const [files, setFiles] = useState<FileAttachment[]>(() => (sample.files ?? []).map((file, index) => ({
    id: 'sample-' + index, file,
  })));
  const [pending, setPending] = useState<FileAttachment[]>([]);
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

  const current = {duration,unit,color,values,files,pending,captures,strokes,sketch,semantic,origin};
  const [before,setBefore] = useState(current);
  // Each opening takes its own snapshot, including the actual attachment IDs and bytes.
  useLayoutEffect(() => {if(open) setBefore(current);}, [open]);
  const reset = {
    canReset: duration!==before.duration || unit!==before.unit || color!==before.color ||
      values.join()!==before.values.join() || files!==before.files || pending!==before.pending ||
      captures!==before.captures || strokes!==before.strokes || sketch!==before.sketch || semantic!==before.semantic || origin!==before.origin,
    onReset: () => {
      setDuration(before.duration);setUnit(before.unit);setColor(before.color);setValues(before.values);
      setFiles(before.files);setPending(before.pending);setCaptures(before.captures);setStrokes(before.strokes);
      setSketch(before.sketch);setOrigin(before.origin);setSemantic(before.semantic);setPreview(null);
    },
  };
  const screenIntent = specimen?.screenIntent;
  const confirmedCaptures = captures.filter(item => item.confirmed);
  function removeSketch() {
    setSketch(null);
    emit('remove-file', sketch?.name);
  }
  function removeCapture(id: string) {
    setCaptures(previous => previous.filter(item => item.id !== id));
    emit('remove-capture', id);
  }
  const adopted = [
    ...files.map(({id, file}) => ({id, name: file.name, remove: () => removeFile(id), file})),
    ...(sketch ? [{id: 'sketch', name: sketch.name, remove: removeSketch, file: sketch}] : []),
    ...confirmedCaptures.map(item => ({id: item.id, name: item.name, remove: () => removeCapture(item.id), capture: item})),
  ];
  const names = adopted.map(item => item.name);
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
  const resolvedLabel = kind === 'duration' ? duration + ({s:t('秒',' sec'),m:t('分钟',' min'),h:t('小时',' hr')})[unit]
    : kind === 'color' ? color
    : selected || names[0] || title;
  const sceneLabel = specimen?.sceneLabel && state===initial && origin!=='manual' ? specimen.sceneLabel : undefined;
  const label = sceneLabel ?? (screenIntent === 'screenshot' ? t('截图', 'Screenshot')
    : screenIntent === 'recording' ? t('录屏', 'Recording')
    : state === 'object-bound' ? names[0]
    : state === 'needs-input' ? needsLabel
    : state === 'ambiguous-recommendation' ? catalog[kind].suggestion[en ? 1 : 0]
    : resolvedLabel);
  const artwork = values[0] ? C.controlOptionArtwork(kind, values[0]) : undefined;
  const token: C.InlineChipToken = {
    id: owner, kind, role: title, phrase: '', label,
    value: screenIntent ?? (state === 'needs-input' ? '' : kind === 'color' && (!specimen || state === 'default-selected') ? color : label),
    origin, semanticState: state,
    additionalObjectCount: state === 'object-bound' ? names.length - 1 : undefined,
    removable: origin === 'recommended' && (!specimen || state === 'ambiguous-recommendation'),
    preparing: loading || (specimen?.generating && state==='ambiguous-recommendation'),
    iconSrc: artwork ? C.assetUrl(assetBase, artwork) : undefined,
    animate: true, sweepKey: owner + state,
  };
  const Choice = choices[kind as keyof typeof choices];
  const Capture = kind === 'scanner' ? C.ScannerWidget : C.ScreenCaptureWidget;
  const chooseLocal = () => fileInput.current?.click();

  function pick(list: File[]) {
    if (!list.length) return;
    const attachments = list.map(file => ({
      id: 'local-' + nextFileId.current++, file,
    }));
    if (kind === 'document') {
      setFiles(previous => [...previous, ...attachments]);
      adoptMaterial(list.map(file => file.name));
    } else setPending(previous => [...previous, ...attachments]);
    emit('select-local-files', list.map(file => file.name));
  }
  function removeFile(id: string) {
    if (kind === 'document' && files.length === 1 && files[0].id === id) setSemantic('needs-input');
    setFiles(previous => previous.filter(item => item.id !== id));
    emit('remove-file', files.find(item => item.id === id)?.file.name);
  }
  function previewFile(file: File) {
    previewTrigger.current = document.activeElement as HTMLElement | null;
    setPreview(file);
  }
  function fileCard(id: string, file: File, remove: () => void) {
    return <C.AttachmentCard key={id} file={file} onRemove={remove} onPreview={() => previewFile(file)}/>;
  }
  const documentFiles = files.map(({id, file}) => ({id, name: file.name}));
  function previewDocument(id: string) {
    const attachment = files.find(item => item.id === id);
    if (attachment) previewFile(attachment.file);
  }
  const selectedPhotos = kind === 'photo' && files.map(({id, file}) => fileCard(id, file, () => removeFile(id)));
  const adoptedSketch = sketch && fileCard('sketch', sketch, removeSketch);
  const materialStrip = kind !== 'document' && adopted.length > 0 && <div className="lite-document-materials input-controls-theme">
    {adopted.map(item => 'capture' in item
      ? <C.CaptureTile key={item.id} compact item={item.capture} onRemove={item.remove}/>
      : fileCard(item.id, item.file, item.remove))}
  </div>;

  function widget(): ReactNode {
    if (Choice) return (
      <Choice {...reset} binding={{id: owner, kind, origin, value: values}} definition={def} owner={owner} language={language}
        onEvent={event => {
          if (event.owner !== owner || event.id !== owner) return;
          if (event.type === 'close') confirm();
          else if (event.value) {setValues(event.value); changed(event.value);}
        }}/>
    );
    switch (kind) {
      case 'duration':
        return <C.DurationWidget {...reset} unit={unit} onUnitChange={setUnit} value={duration} onChange={value => {setDuration(value); changed(value);}} onDone={confirm}/>;
      case 'color':
        return <C.ColorWidget {...reset} value={color} label={title} onChange={value => {setColor(value); changed(value);}} onActive={() => {}} onDone={confirm}/>;
      case 'document':
        return <C.DocumentWidget {...reset} materials={documentFiles} onChoose={chooseLocal} onDone={confirm}
          onRemoveMaterial={removeFile} onPreviewMaterial={previewDocument}/>;
      case 'photo':
        return (
          <C.ImageWidget {...reset} canConfirm={!specimen || pending.length > 0} onChoose={chooseLocal} onDone={() => {
            if (pending.length) {
              setFiles(previous => [...previous, ...pending]);
              setPending([]);
              if (specimen) adoptMaterial(pending.map(({file}) => file.name));
            }
            confirm();
          }}>
            {specimen && selectedPhotos}
            {pending.map(({id, file}) => fileCard(id, file, () => {
              setPending(previous => previous.filter(item => item.id !== id));
              emit('remove-file', file.name);
            }))}
          </C.ImageWidget>
        );
      case 'sketch':
        return (
          <>
            {specimen && sketch && <div className="lite-adopted-sketch">{adoptedSketch}</div>}
            <C.SketchWidget {...reset} strokes={strokes} onChange={setStrokes} onActive={() => {}} onAdopt={() => {
              const adopted = createSketchFile(strokes, specimen ? '布局草图.svg' : undefined);
              setSketch(adopted);
              if (specimen) adoptMaterial(adopted.name);
              confirm();
            }}/>
          </>
        );
      default:
        return (
          <Capture {...reset} key={inline && kind === 'scanner' && panels.active ? 'background' : 'foreground'}
            items={captures} language={language}
            {...(screenIntent ? {screenIntent} : {})}
            {...(inline && kind === 'scanner' ? {deferCameraUntilSelection: true} : {})}
            {...(kind === 'scanner' && initial === 'object-bound' ? {initialCameraMode: captures[0]?.cameraMode ?? 'scan'} : {})}
            onAdd={item => {setCaptures(previous => [...previous, item]); emit('capture', item.name);}}
            onRemove={removeCapture}
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
        <C.InlineChip token={token} expanded={open} controlsId={panelId} describedBy={specimen && specimen.presentation !== "sentence" ? stateLabelId : undefined} disabled={disabled}
          onRemoveMaterial={state === 'object-bound' ? adopted[0]?.remove : undefined}
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
  const filePreview = preview && <FilePreview file={preview} language={language} onClose={() => {
    setPreview(null);
    if (specimen) requestAnimationFrame(() => {
      if (document.activeElement === document.body) previewTrigger.current?.focus({preventScroll:true});
    });
  }}/>;
  const overlays = (
    <>
      {!inline && <C.AnchoredPanel anchor={anchor} open={open} id={panelId} label={title} width={C.widgetWidths[kind]} onClose={panels.close}>
        {specimen ? <ComposerStage kind={kind} popover>{panelContent}</ComposerStage> : panelContent}
      </C.AnchoredPanel>}
      {(kind === 'document' || kind === 'photo') && (
        <input ref={fileInput} type="file" multiple hidden accept={kind === 'document' ? '.pdf,.txt,.md' : 'image/*'}
          onChange={event => {pick(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = '';}}/>
      )}
    </>
  );

  if (inline) return (
    <C.WidgetProvider language={language} translate={translate(language)} assetBase={assetBase}>
      <details className="lite-widget-preview" open={inlineOpen} onToggle={event => setInlineOpen(event.currentTarget.open)}>
        <summary className="ic-glass-action" ref={inlineSummary}>{t('独立 Widget', 'Standalone widget')}</summary>
        {inlineOpen && (
          <ComposerStage kind={kind}>
            <C.WidgetSurface>
              <div className="lite-inline-panel" style={{width: C.widgetWidths[kind], maxWidth: '100%'}}>{panelContent}</div>
              {overlays}
            </C.WidgetSurface>
          </ComposerStage>
        )}
      </details>
      {!inlineOpen && materialStrip}
      {preview && <div className="input-controls-theme">{filePreview}</div>}
    </C.WidgetProvider>
  );

  if (specimen?.presentation === "sentence") return (
    <C.WidgetProvider language={language} translate={translate(language)} assetBase={assetBase}>
      {chip}
      {overlays}
      {filePreview && createPortal(<div className="input-controls-theme">{filePreview}</div>,document.body)}
    </C.WidgetProvider>
  );

  if (specimen) return (
    <div className="lite-specimen input-controls-theme" data-example={screenIntent ?? initial}>
      <span id={stateLabelId} className="lite-state-label">{screenIntent ? t('明确意图', 'Explicit intent') : chipStateLabels[state][en ? 1 : 0]}</span>
      <C.WidgetProvider language={language} translate={translate(language)} assetBase={assetBase}>
        {chip}
        {materialStrip}
        {overlays}
        {filePreview}
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
            {selectedPhotos}
            {adoptedSketch}
            {confirmedCaptures.map(item => <C.CaptureTile key={item.id} item={item} compact onRemove={() => setCaptures(previous => previous.filter(entry => entry.id !== item.id))}/>)}
          </div>
          <div className="ic-live-wb-composer ic-demo-composer">
            <div className="ic-wb-sentence-composer">
              {t('准备产品介绍，使用', 'Prepare a product introduction using ')}{chip}{t('作为输入。', ' as input.')}{' '}
              <span ref={secondAnchor}>
                <C.InlineChip token={{id: owner + 'second', kind: 'duration', role: t('独立实例', 'Second instance'), label: t('独立实例', 'Second instance'), value: '5', phrase: '', semanticState: 'default-selected'}} expanded={panels.active === 'second'} onOpen={() => panels.toggle('second')}/>
              </span>
            </div>
          </div>
          {overlays}
          {filePreview}
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
          files: files.map(({file}) => file.name), pendingImages: pending.length, strokes: strokes.length,
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
