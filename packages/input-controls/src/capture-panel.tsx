import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  Camera,
  Upload,
  Square,
  Trash2,
  X,
  Play,
  Check,
  RotateCcw,
} from "lucide-react";
import type { CaptureMaterial as DemoCapture } from "./types";
import { createPortal } from "react-dom";
import { useWidgetText, useWidgetEnvironment, useWidgetThemeStyle } from "./environment";

/**
 * Normalized rectangular crop coordinates in [0, 1] space.
 */
export type Crop = { x: number; y: number; w: number; h: number };

/**
 * Computes a normalized bounding box from two pointer coordinates in [0, 1] space.
 * @param a Starting pointer coordinate.
 * @param b Current/ending pointer coordinate.
 * @returns Normalized Crop rectangle.
 */
export function normalizedCrop(
  a: { x: number; y: number },
  b: { x: number; y: number },
): Crop {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

/**
 * Renders the full-size media preview inside a modal or capture tile.
 * @param props.item Captured screenshot, scan, or recording material.
 */
function Preview({ item }: { item: DemoCapture }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(item.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [item.blob]);
  return item.kind === "recording" ? (
    <video controls src={url} aria-label={item.name} />
  ) : (
    <img src={url} alt={item.name} />
  );
}

/**
 * Renders a compact thumbnail for a confirmed capture material in the composer strip.
 * @param props.item Captured screenshot, scan, or recording material.
 */
function CaptureThumbnail({ item }: { item: DemoCapture }) {
  const [url, setUrl] = useState("");
  const [poster, setPoster] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(item.blob);
    setUrl(u);
    setPoster("");
    return () => URL.revokeObjectURL(u);
  }, [item.blob]);
  return (
    <div className="ic-demo-material-thumb">
      {item.kind === "recording" ? (
        <>
          <video
            style={{ display: poster ? "none" : undefined }}
            src={url || undefined}
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => {
              e.currentTarget.currentTime = Math.min(
                0.05,
                e.currentTarget.duration || 0,
              );
            }}
            onSeeked={(e) => {
              const v = e.currentTarget;
              if (!v.videoWidth) return;
              const canvas = document.createElement("canvas");
              canvas.width = 216;
              canvas.height = 114;
              canvas.getContext("2d")!.drawImage(v, 0, 0, 216, 114);
              setPoster(canvas.toDataURL());
            }}
          />
          {poster && <img src={poster} alt="" />}
          <Play aria-hidden="true" size={22} />
        </>
      ) : (
        <img src={url || undefined} alt="" />
      )}
    </div>
  );
}

/**
 * Renders a capture material card in either the compact composer attachment bar or the panel list.
 * @param props.item Captured material metadata and Blob.
 * @param props.onRemove Optional callback to remove this material.
 * @param props.compact Whether to render the compact composer card variant.
 */
export function CaptureTile({
  item,
  onRemove,
  compact = false,
}: {
  item: DemoCapture;
  onRemove?: () => void;
  compact?: boolean;
}) {
  const uiText = useWidgetText();
  const { portalRoot } = useWidgetEnvironment();
  const themeStyle = useWidgetThemeStyle();
  const [preview, setPreview] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const closePreview = () => {
    setPreview(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  if (compact)
    return (
      <>
        <div className="ic-demo-material" data-capture-kind={item.kind}>
          <button type="button"
            ref={trigger}
            title={item.name}
            aria-label={uiText("查看 ") + item.name}
            onClick={() => setPreview(true)}
          >
            <CaptureThumbnail item={item} />
            <span>{item.name}</span>
          </button>
          {onRemove && (
            <button type="button"
              className="ic-demo-remove"
              aria-label={uiText("移除 ") + item.name}
              onClick={onRemove}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {preview &&
          createPortal(
            <div
              className="input-controls-theme ic-demo-modal"
              style={themeStyle}
              role="dialog"
              aria-modal="true"
              aria-label={uiText("材料预览")}
              onKeyDown={(e) => {
                if (e.key === "Escape") closePreview();
              }}
            >
              <section>
                <header>
                  <b>{item.name}</b>
                  <button type="button"
                    autoFocus
                    aria-label={uiText("关闭预览")}
                    onClick={closePreview}
                  >
                    <X />
                  </button>
                </header>
                <Preview item={item} />
              </section>
            </div>,
            portalRoot ||
              trigger.current?.closest(".input-controls-theme") ||
              document.body,
          )}
      </>
    );
  return (
    <div className="ic-demo-capture-tile">
      <Preview item={item} />
      <span>
        {item.name}
        {item.duration ? ` · ${Math.round(item.duration)}s` : ""}
      </span>
      {onRemove && (
        <button type="button" aria-label={uiText("移除 ") + item.name} onClick={onRemove}>
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}


import { browserCaptureAdapter, stopMedia, waitForFrame, type CaptureAdapter } from './capture-adapter';
import { WorkspaceCaptureSession } from "./workspace-capture-session";
import type { WorkspaceCaptureAdapter } from "./capture-adapter";
export interface CapturePanelProps {
  workspace?: WorkspaceCaptureAdapter;
  ownerId?: string;
  mode: 'scanner' | 'capture';
  items: DemoCapture[];
  language: string;
  adapter?: CaptureAdapter;
  onAdd: (item: DemoCapture) => void;
  onRemove: (id: string) => void;
  onConfirm: () => void;
  onBusy?: (busy: boolean) => void;
}
/** Acquisition state is local. Pending and confirmed bytes remain controlled by the host. */
export function CapturePanel(props: CapturePanelProps) { const key = (props.ownerId ?? '') + ':' + props.mode;
  return props.workspace
    ? <WorkspaceCaptureSession key={key} {...props} workspace={props.workspace}/>
    : <CaptureSession key={key} {...props}/>; }
function CaptureSession({mode, items, language, adapter = browserCaptureAdapter, onAdd, onRemove, onConfirm, onBusy}: CapturePanelProps) {
  const t = (zh: string, en: string) => language === 'en' ? en : zh;
  const [phase, setPhase] = useState<'idle'|'loading'|'preview'|'recording'>('idle');
  const [kind, setKind] = useState<'screenshot'|'recording'>('screenshot');
  const [crop, setCrop] = useState<Crop>({x:0,y:0,w:1,h:1});
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [review, setReview] = useState<DemoCapture|null>(null);
  const [reviewUrl, setReviewUrl] = useState('');
  const video = useRef<HTMLVideoElement>(null), image = useRef<HTMLImageElement>(null);
  const stream = useRef<MediaStream|null>(null), output = useRef<MediaStream|null>(null);
  const recorder = useRef<MediaRecorder|null>(null), abort = useRef<AbortController|null>(null);
  const epoch = useRef(0), live = useRef(true), raf = useRef(0), clock = useRef<ReturnType<typeof setInterval>|undefined>(undefined);
  const replacement = useRef<string|null>(null);
  const pointer = useRef<{x:number;y:number}|null>(null), fileInput = useRef<HTMLInputElement>(null);
  const callbacks = useRef({onAdd,onRemove,onBusy}); callbacks.current = {onAdd,onRemove,onBusy};
  function release(update = true) {
    epoch.current++; abort.current?.abort(); cancelAnimationFrame(raf.current); clearInterval(clock.current);
    const current = recorder.current; recorder.current = null;
    if (current && current.state !== 'inactive') {current.onstop = null; current.stop();}
    stopMedia(output.current); output.current = null; stopMedia(stream.current); stream.current = null;
    if (update && live.current) {setPhase('idle'); callbacks.current.onBusy?.(false);}
  }
  useEffect(() => {
    live.current = true;
    const hide = () => { if (document.hidden && mode === 'scanner') release(); };
    const leave = () => release();window.addEventListener('pagehide',leave);
    document.addEventListener('visibilitychange', hide);
    return () => {live.current = false; release(false); callbacks.current.onBusy?.(false); document.removeEventListener('visibilitychange', hide);window.removeEventListener('pagehide',leave);};
  }, []);
  useEffect(() => {
    if (!review) {setReviewUrl('');return;}
    const url = URL.createObjectURL(review.blob);setReviewUrl(url);return () => URL.revokeObjectURL(url);
  }, [review]);
  async function begin(next = kind, replacing?: string) {
    release();replacement.current=replacing||null;setReview(null);setKind(next);setError('');setCrop({x:0,y:0,w:1,h:1});setPhase('loading');onBusy?.(true);
    const current = epoch.current;const controller = new AbortController();abort.current = controller;
    try {
      const acquired = await (mode === 'scanner' ? adapter.openCamera() : adapter.openScreen());
      if (!live.current || current !== epoch.current) {stopMedia(acquired);return;}
      stream.current = acquired;
      // Let React commit the video element; acquisition may resolve synchronously in a host adapter.
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (current !== epoch.current || !video.current) {stopMedia(acquired);return;}
      video.current.srcObject = acquired;await video.current.play();await waitForFrame(video.current, controller.signal);
      if (current !== epoch.current) return;
      acquired.getVideoTracks().forEach(track => track.addEventListener('ended', () => {if(current===epoch.current) {const rec=recorder.current;if(rec?.state==='recording')rec.stop();else release();}}, {once:true}));
      setPhase('preview');
    } catch (cause) {
      if (current !== epoch.current || !live.current) return;
      release();setError(mode==='scanner'?t('无法获取画面。请检查权限后重试，或导入本地扫描图片。','Unable to acquire video. Check permissions and retry, or import a scanned image.'):t('无法获取屏幕画面。请检查权限后重试。','Unable to acquire the screen. Check permissions and retry.'));
    }
  }
  function point(e: PointerEvent<HTMLDivElement>) {const r=e.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))};}
  function draw(canvas: HTMLCanvasElement) {
    const source = review ? image.current : video.current;
    if (!source) throw new Error('No frame');
    const width = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
    const height = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
    if (!width || !height) throw new Error('No frame');
    canvas.width=Math.max(1,Math.round(width*crop.w));canvas.height=Math.max(1,Math.round(height*crop.h));
    canvas.getContext('2d')!.drawImage(source,width*crop.x,height*crop.y,width*crop.w,height*crop.h,0,0,canvas.width,canvas.height);
  }
  async function capture() {
    const current=epoch.current;
    try {
      const canvas=document.createElement('canvas');draw(canvas);
      const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob || !live.current || current!==epoch.current)return;
      const old=review;const oldId=old?.id||replacement.current; const type=mode==='scanner'?'scanner':'screenshot';
      callbacks.current.onAdd({id:crypto.randomUUID(),kind:type,name:`${type}.png`,blob,size:blob.size,confirmed:false});
      if(oldId)callbacks.current.onRemove(oldId);replacement.current=null;
      setReview(null);release();
    }catch{setError(t('没有可用画面，请重试。','No usable frame. Please retry.'));}
  }
  function record() {
    const current=epoch.current;
    try {
      if(typeof MediaRecorder==='undefined')throw new Error('Recording unsupported');
      const canvas=document.createElement('canvas');draw(canvas);const frames=canvas.captureStream(24);output.current=frames;
      const chunks:Blob[]=[];const instance=new MediaRecorder(frames);recorder.current=instance;const started=performance.now();
      instance.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      instance.onerror=()=>{if(current===epoch.current){release();setError(t('录屏失败，请重试。','Recording failed. Please retry.'));}};
      instance.onstop=()=>{if(!live.current||current!==epoch.current)return;const blob=new Blob(chunks,{type:instance.mimeType||'video/webm'});if(blob.size)callbacks.current.onAdd({id:crypto.randomUUID(),kind:'recording',name:'recording.webm',blob,size:blob.size,duration:(performance.now()-started)/1000,confirmed:false});release();};
      const paint=()=>{if(current!==epoch.current)return;try{draw(canvas);}catch{release();return;}raf.current=requestAnimationFrame(paint);};
      instance.start(250);setPhase('recording');setElapsed(0);paint();clock.current=setInterval(()=>{setElapsed(Math.floor((performance.now()-started)/1000));if(performance.now()-started>=60000&&instance.state==='recording')instance.stop();},250);
    }catch{release();setError(t('当前浏览器无法录屏，请重试或使用支持录屏的浏览器。','Recording unavailable. Retry with a supported browser.'));}
  }
  const visible=items.filter(item=>mode==='scanner'?item.kind==='scanner':item.kind!=='scanner');
  return <div className="ic-demo-capture-panel" data-mode={mode} data-phase={phase}>
    {mode==='capture'&&phase==='idle'&&!review&&<div className="ic-demo-capture-modes"><button type="button" onClick={()=>void begin('screenshot')}>{t('截图','Screenshot')}</button><button type="button" onClick={()=>void begin('recording')}>{t('录屏','Recording')}</button></div>}
    {(phase!=='idle'||review)&&<><p className="sr-only">{t('拖动框选区域，不框选保留完整画面。','Drag to crop, or keep the full frame.')}</p><div className="ic-demo-capture-viewport" onPointerDown={e=>{if(phase==='recording')return;pointer.current=point(e);e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(!pointer.current)return;const box=normalizedCrop(pointer.current,point(e));if(box.w>.02&&box.h>.02)setCrop(box);}} onPointerUp={()=>{pointer.current=null;}} onPointerCancel={()=>{pointer.current=null;}}>
      {review&&<img ref={image} src={reviewUrl||undefined} alt={t('裁剪预览','Crop preview')}/>}
      <video ref={video} muted playsInline style={{display:review?'none':'block'}}/>
      <div className="ic-demo-crop-box" style={{left:crop.x*100+'%',top:crop.y*100+'%',width:crop.w*100+'%',height:crop.h*100+'%'}}><span>+</span></div>
    </div></>}
    <div className="ic-demo-capture-actions">
      {mode==='scanner'&&phase==='idle'&&!review&&<><button type="button" onClick={()=>void begin()}><Camera size={18}/>{t('打开摄像头','Open camera')}</button><button type="button" onClick={()=>fileInput.current?.click()}><Upload size={16}/>{t('导入扫描图片','Import scanned image')}</button><input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(file)onAdd({id:crypto.randomUUID(),kind:'scanner',name:file.name,blob:file,size:file.size,confirmed:false});}}/></>}
      {(phase!=='idle'||review)&&<>
        {phase==='recording'?<button type="button" onClick={()=>recorder.current?.stop()}><Square size={16}/>{t('停止','Stop')} · {elapsed}s / 60s</button>:<><button type="button" disabled={phase==='loading'} onClick={()=>kind==='recording'&&mode==='capture'&&!review?record():void capture()}>{review?t('保存裁剪','Save crop'):kind==='recording'&&mode==='capture'?t('开始录屏','Start recording'):t('拍摄','Capture')}</button><button type="button" onClick={()=>setCrop({x:0,y:0,w:1,h:1})}>{t('完整画面','Full frame')}</button></>}
        <button type="button" onClick={()=>{release();setReview(null);}}>{t('取消','Cancel')}</button>
      </>}
    </div>
    {phase==='loading'&&<p role="status">{t('正在等待画面…','Waiting for video…')}</p>}
    {error&&<p role="alert">{error}</p>}
    {!!visible.length&&<div className="ic-demo-capture-items">{visible.map(item=><section key={item.id}><CaptureTile item={item} onRemove={()=>onRemove(item.id)}/>{!item.confirmed&&item.kind!=='recording'&&<div><button type="button" disabled={phase!=='idle'} onClick={()=>{release();setReview(item);setCrop({x:0,y:0,w:1,h:1});}}>{t('裁剪','Crop')}</button><button type="button" disabled={phase!=='idle'} onClick={()=>void begin('screenshot',item.id)}>{t('重拍','Retake')}</button></div>}<small>{item.confirmed?t('已确认','Confirmed'):t('待确认','Awaiting confirmation')}</small></section>)}</div>}
    {visible.some(item=>!item.confirmed)&&phase==='idle'&&!review&&<button type="button" className="ic-demo-capture-confirm" onClick={onConfirm}><Check size={18}/>{t('确认材料','Confirm materials')}</button>}
  </div>;
}
