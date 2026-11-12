import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Monitor,
  Square,
  Trash2,
  X,
  Play,
  Check,
  RotateCcw,
} from "lucide-react";
import type { CaptureMaterial as DemoCapture } from "./types";
import { createPortal } from "react-dom";
import { useWidgetText, useWidgetEnvironment } from "./environment";
export type Crop = { x: number; y: number; w: number; h: number };
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
    <div className="demo-material-thumb">
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
  const [preview, setPreview] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const closePreview = () => {
    setPreview(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  if (compact)
    return (
      <>
        <div className="demo-material" data-capture-kind={item.kind}>
          <button
            ref={trigger}
            title={item.name}
            aria-label={uiText("查看 ") + item.name}
            onClick={() => setPreview(true)}
          >
            <CaptureThumbnail item={item} />
            <span>{item.name}</span>
          </button>
          {onRemove && (
            <button
              className="demo-remove"
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
              className="demo-modal"
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
                  <button
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
    <div className="demo-capture-tile">
      <Preview item={item} />
      <span>
        {item.name}
        {item.duration ? ` · ${Math.round(item.duration)}s` : ""}
      </span>
      {onRemove && (
        <button aria-label={"Remove " + item.name} onClick={onRemove}>
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
/** Browser capture belongs to its mounted owner. Closing stops streams, never adopts bytes. */
export function CapturePanel({
  mode,
  items,
  language,
  onAdd,
  onRemove,
  onConfirm,
  onBusy,
}: {
  mode: "scanner" | "capture";
  items: DemoCapture[];
  language: string;
  onAdd: (c: DemoCapture) => void;
  onRemove: (id: string) => void;
  onConfirm: () => void;
  onBusy: (busy: boolean) => void;
}) {
  const en = language === "en",
    t = (zh: string, e: string) => (en ? e : zh);
  const [recordMode, setRecordMode] = useState(false),
    [phase, setPhase] = useState<"idle" | "loading" | "preview" | "recording">(
      "idle",
    ),
    [error, setError] = useState(""),
    [elapsed, setElapsed] = useState(0);
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, w: 1, h: 1 });
  const [review, setReview] = useState<DemoCapture | null>(null);
  const video = useRef<HTMLVideoElement>(null),
    image = useRef<HTMLImageElement>(null),
    media = useRef<MediaStream | null>(null),
    recorder = useRef<MediaRecorder | null>(null),
    cropStream = useRef<MediaStream | null>(null),
    live = useRef(true),
    epoch = useRef(0),
    raf = useRef(0),
    timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined),
    startTime = useRef(0),
    pointer = useRef<{ x: number; y: number } | null>(null);
  const callbacks = useRef({ onAdd, onBusy });
  callbacks.current = { onAdd, onBusy };
  const [reviewUrl, setReviewUrl] = useState("");
  useEffect(() => {
    if (!review) {
      setReviewUrl("");
      return;
    }
    const u = URL.createObjectURL(review.blob);
    setReviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [review]);
  function release() {
    epoch.current++;
    cancelAnimationFrame(raf.current);
    clearInterval(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    media.current?.getTracks().forEach((x) => x.stop());
    cropStream.current?.getTracks().forEach((x) => x.stop());
    media.current = null;
    cropStream.current = null;
    callbacks.current.onBusy(false);
    if (live.current) setPhase("idle");
  }
  useEffect(() => {
    live.current = true;
    const hide = () => {
      if (document.hidden) release();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      live.current = false;
      release();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  async function begin() {
    setError("");
    setReview(null);
    setCrop({ x: 0, y: 0, w: 1, h: 1 });
    setPhase("loading");
    onBusy(true);
    const run = ++epoch.current;
    try {
      if (!navigator.mediaDevices) throw Error();
      const Controller = (
        window as unknown as {
          CaptureController?: new () => {
            setFocusBehavior: (behavior: string) => void;
          };
        }
      ).CaptureController;
      const controller =
        mode === "capture" && Controller ? new Controller() : undefined;
      controller?.setFocusBehavior("no-focus-change");
      const displayOptions = {
        video: true,
        audio: false,
        ...(controller ? { controller } : {}),
      };
      const stream =
        mode === "scanner"
          ? await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            })
          : await navigator.mediaDevices.getDisplayMedia(displayOptions);
      if (!live.current || run !== epoch.current) {
        stream.getTracks().forEach((x) => x.stop());
        return;
      }
      media.current = stream;
      stream
        .getVideoTracks()[0]
        .addEventListener("ended", release, { once: true });
      if (video.current) {
        video.current.srcObject = stream;
        await video.current.play();
      }
      if (live.current && run === epoch.current) setPhase("preview");
    } catch {
      if (live.current && run === epoch.current) {
        release();
        setError(
          t(
            "未能开始采集。请允许权限后重试，取消不会改变材料。",
            "Capture could not start. Allow permission and retry; cancellation keeps your materials.",
          ),
        );
      }
    }
  }
  function draw(canvas: HTMLCanvasElement) {
    const source = review ? image.current : video.current;
    if (!source) return false;
    const w =
        source instanceof HTMLVideoElement
          ? source.videoWidth
          : source.naturalWidth,
      h =
        source instanceof HTMLVideoElement
          ? source.videoHeight
          : source.naturalHeight;
    if (!w || !h) return false;
    canvas.width = Math.max(1, Math.round(w * crop.w));
    canvas.height = Math.max(1, Math.round(h * crop.h));
    canvas
      .getContext("2d")!
      .drawImage(
        source,
        w * crop.x,
        h * crop.y,
        w * crop.w,
        h * crop.h,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    return true;
  }
  async function capture() {
    const run = epoch.current;
    const canvas = document.createElement("canvas");
    if (!draw(canvas)) {
      setError(
        t(
          "画面尚未就绪，请稍后重试。",
          "The preview is not ready. Try again shortly.",
        ),
      );
      return;
    }
    const replacing = review;
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/png"),
    );
    if (!blob || run !== epoch.current || !live.current) return;
    const item: DemoCapture = {
      id: crypto.randomUUID(),
      kind: mode === "scanner" ? "scanner" : "screenshot",
      name:
        (mode === "scanner" ? "Scan-" : "Screenshot-") + Date.now() + ".png",
      blob,
      size: blob.size,
      confirmed: false,
    };
    if (replacing) onRemove(replacing.id);
    callbacks.current.onAdd(item);
    if (live.current) {
      setReview(null);
      release();
    }
  }
  function record() {
    if (!media.current || phase !== "preview") return;
    const canvas = document.createElement("canvas");
    if (!draw(canvas)) return;
    let chunks: Blob[] = [],
      bytes = 0;
    const output = canvas.captureStream(24);
    cropStream.current = output;
    const mime = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ].find((x) => MediaRecorder.isTypeSupported(x));
    if (!mime) {
      setError(
        t(
          "当前浏览器不支持录屏保存。",
          "Recording is unavailable in this browser.",
        ),
      );
      release();
      return;
    }
    let r: MediaRecorder;
    try {
      r = new MediaRecorder(output, {
        mimeType: mime,
        videoBitsPerSecond: 2000000,
      });
    } catch {
      setError(
        t("无法开始录像，请重试。", "Could not start recording. Please retry."),
      );
      release();
      return;
    }
    recorder.current = r;
    const started = performance.now();
    startTime.current = started;
    const save = callbacks.current.onAdd;
    r.ondataavailable = (e) => {
      if (bytes + e.data.size > 64 * 1024 * 1024) {
        release();
        return;
      }
      if (e.data.size) {
        chunks.push(e.data);
        bytes += e.data.size;
      }
      if (bytes >= 64 * 1024 * 1024) release();
    };
    r.onerror = () => {
      if (live.current)
        setError(
          t(
            "录像中断，已保留可用片段。",
            "Recording interrupted; available footage was retained.",
          ),
        );
      release();
    };
    r.onstop = () => {
      cancelAnimationFrame(raf.current);
      clearInterval(timer.current);
      const blob = new Blob(chunks, { type: r.mimeType });
      chunks = [];
      if (blob.size)
        save({
          id: crypto.randomUUID(),
          kind: "recording",
          name: "Recording-" + Date.now() + ".webm",
          blob,
          size: blob.size,
          duration: Math.min(60, (performance.now() - started) / 1000),
          confirmed: false,
        });
    };
    const frame = () => {
      if (r.state !== "recording") return;
      draw(canvas);
      raf.current = requestAnimationFrame(frame);
    };
    r.start(250);
    setPhase("recording");
    setElapsed(0);
    frame();
    timer.current = setInterval(() => {
      const seconds = (performance.now() - started) / 1000;
      if (live.current) setElapsed(Math.floor(seconds));
      if (seconds >= 60) release();
    }, 250);
  }
  const visible = items.filter((i) =>
    mode === "scanner" ? i.kind === "scanner" : i.kind !== "scanner",
  );
  return (
    <div
      className="demo-capture-panel"
      data-mode={mode}
      data-phase={phase}
      data-review={!!review}
    >
      {mode === "capture" && (
        <p>
          {t(
            "添加参考素材：截图用于参考视觉效果，录屏用于参考操作流程与交互动画。确认后加入当前草稿。",
            "Add prompt references: screenshots for visual style, recordings for interaction flows and transitions. Confirm to attach them to this draft.",
          )}
        </p>
      )}
      {mode === "capture" && (
        <div className="demo-capture-modes">
          <button
            disabled={phase !== "idle" || !!review}
            aria-pressed={!recordMode}
            onClick={() => setRecordMode(false)}
          >
            {t("截图", "Screenshot")}
          </button>
          <button
            disabled={phase !== "idle" || !!review}
            aria-pressed={recordMode}
            onClick={() => setRecordMode(true)}
          >
            {t("录屏", "Recording")}
          </button>
        </div>
      )}
      {(phase !== "idle" || review) && (
        <>
          <p className="sr-only">
            {t(
              "在预览中拖动框选区域；不框选则保留完整画面。",
              "Drag on the preview to crop; leave unchanged for the full frame.",
            )}
          </p>
          <div
            className="demo-capture-viewport"
            onPointerDown={(e) => {
              if (phase === "recording") return;
              const r = e.currentTarget.getBoundingClientRect();
              pointer.current = {
                x: (e.clientX - r.left) / r.width,
                y: (e.clientY - r.top) / r.height,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!pointer.current) return;
              const r = e.currentTarget.getBoundingClientRect();
              const next = normalizedCrop(pointer.current, {
                x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
                y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
              });
              if (next.w > 0.02 && next.h > 0.02) setCrop(next);
            }}
            onPointerUp={() => {
              pointer.current = null;
            }}
            onPointerCancel={() => {
              pointer.current = null;
            }}
          >
            {review ? (
              <img
                ref={image}
                src={reviewUrl}
                alt={t("裁剪预览", "Crop preview")}
              />
            ) : null}
            <video
              ref={video}
              muted
              playsInline
              style={{ display: review ? "none" : "block" }}
            />
            <div
              className="demo-crop-box"
              style={{
                left: crop.x * 100 + "%",
                top: crop.y * 100 + "%",
                width: crop.w * 100 + "%",
                height: crop.h * 100 + "%",
              }}
            >
              <span>+</span>
            </div>
          </div>
        </>
      )}
      <div className="demo-capture-actions">
        {(phase !== "idle" || review) && (
          <button
            onClick={() => setCrop({ x: 0, y: 0, w: 1, h: 1 })}
            disabled={phase === "recording"}
          >
            <RotateCcw size={14} />
            {t("完整画面", "Full frame")}
          </button>
        )}
        {phase === "idle" && !review ? (
          <button onClick={() => void begin()}>
            {mode === "scanner" ? <Camera size={18} /> : <Monitor size={18} />}{" "}
            {t(
              mode === "scanner" ? "打开摄像头" : "选择共享屏幕",
              mode === "scanner" ? "Open camera" : "Choose shared screen",
            )}
          </button>
        ) : phase === "recording" ? (
          <button onClick={release}>
            <Square size={16} />
            {t("停止", "Stop")} · {elapsed}s / 60s
          </button>
        ) : (
          <>
            <button
              disabled={phase === "loading"}
              onClick={() => {
                if (recordMode && !review) record();
                else void capture();
              }}
            >
              {review
                ? t("保存裁剪", "Save crop")
                : recordMode
                  ? t("开始录屏", "Start recording")
                  : t("拍摄", "Capture")}
            </button>
            <button
              onClick={() => {
                release();
                setReview(null);
              }}
            >
              {t("取消", "Cancel")}
            </button>
          </>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {visible.length > 0 && (
        <div className="demo-capture-items">
          {visible.map((item) => (
            <section key={item.id}>
              <CaptureTile item={item} onRemove={() => onRemove(item.id)} />
              {!item.confirmed && item.kind !== "recording" && (
                <div>
                  <button
                    onClick={() => {
                      release();
                      setReview(item);
                      setCrop({ x: 0, y: 0, w: 1, h: 1 });
                    }}
                  >
                    {t("裁剪", "Crop")}
                  </button>
                  <button
                    onClick={() => {
                      onRemove(item.id);
                      void begin();
                    }}
                  >
                    {t("重拍", "Retake")}
                  </button>
                </div>
              )}
              <small>
                {item.confirmed
                  ? t("已确认", "Confirmed")
                  : t("待确认", "Awaiting confirmation")}
              </small>
            </section>
          ))}
        </div>
      )}
      {visible.some((i) => !i.confirmed) && phase === "idle" && !review && (
        <button className="demo-capture-confirm" onClick={onConfirm}>
          <Check size={18} />
          {t("确认材料", "Confirm materials")}
        </button>
      )}
    </div>
  );
}
