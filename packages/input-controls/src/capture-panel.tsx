import { useEffect, useRef, useState } from "react";
import {
  Camera,
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

/**
 * Synthesizes a faithful visual snapshot of the selected viewport region onto a target canvas.
 * Captures visible DOM containers, backgrounds, borders, images, and text within the crop rectangle.
 * @param canvas Target HTMLCanvasElement to draw into.
 * @param region Normalized viewport crop region `{ x, y, w, h }`.
 * @param elapsedSec Optional elapsed recording time for subtle frame animation.
 */
function renderWorkspaceRegionToCanvas(
  canvas: HTMLCanvasElement,
  region: Crop,
  elapsedSec = 0,
): boolean {
  const vw = Math.max(320, window.innerWidth || 1280);
  const vh = Math.max(240, window.innerHeight || 800);
  const sx = Math.round(region.x * vw);
  const sy = Math.round(region.y * vh);
  const sw = Math.max(24, Math.round(region.w * vw));
  const sh = Math.max(24, Math.round(region.h * vh));

  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const bgGrad = ctx.createLinearGradient(0, 0, sw, sh);
  bgGrad.addColorStop(0, "#f8f9fe");
  bgGrad.addColorStop(0.5, "#ffffff");
  bgGrad.addColorStop(1, "#f3f4fc");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, sw, sh);

  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".wb-sidebar, .wb-main, .demo-composer, .live-wb-composer, .sentence-token-capsule, .sentence-token, .wb-scenes button, .widget-example, .live-wb-aux, .demo-control-option, h1, h2, b, p, span, img",
    ),
  );

  for (const el of elements) {
    if (el.closest(".demo-screen-selector-overlay")) continue;
    const rect = el.getBoundingClientRect();
    if (
      rect.width < 2 ||
      rect.height < 2 ||
      rect.right < sx ||
      rect.left > sx + sw ||
      rect.bottom < sy ||
      rect.top > sy + sh
    ) {
      continue;
    }
    const style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0
    ) {
      continue;
    }

    const dx = rect.left - sx;
    const dy = rect.top - sy;
    const dw = rect.width;
    const dh = rect.height;
    const radius = Math.min(
      dw / 2,
      dh / 2,
      parseFloat(style.borderTopLeftRadius) || 0,
    );

    const bg = style.backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      ctx.save();
      ctx.beginPath();
      if (radius > 0 && "roundRect" in ctx) {
        ctx.roundRect(dx, dy, dw, dh, radius);
      } else {
        ctx.rect(dx, dy, dw, dh);
      }
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.restore();
    }

    const borderW = parseFloat(style.borderTopWidth) || 0;
    const borderColor = style.borderTopColor;
    if (
      borderW > 0 &&
      borderColor &&
      borderColor !== "rgba(0, 0, 0, 0)" &&
      borderColor !== "transparent"
    ) {
      ctx.save();
      ctx.beginPath();
      if (radius > 0 && "roundRect" in ctx) {
        ctx.roundRect(dx, dy, dw, dh, radius);
      } else {
        ctx.rect(dx, dy, dw, dh);
      }
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = Math.min(2, borderW);
      ctx.stroke();
      ctx.restore();
    }

    if (el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0) {
      try {
        ctx.drawImage(el, dx, dy, dw, dh);
      } catch {
        // Ignore cross-origin image draw errors
      }
    }

    if (
      el.childNodes.length === 1 &&
      el.firstChild?.nodeType === Node.TEXT_NODE &&
      el.textContent?.trim()
    ) {
      const text = el.textContent.trim();
      const fontSize = parseFloat(style.fontSize) || 14;
      ctx.save();
      ctx.font = `${style.fontWeight || 400} ${fontSize}px ${style.fontFamily || "sans-serif"}`;
      ctx.fillStyle = style.color || "#182431";
      ctx.textBaseline = "middle";
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      ctx.fillText(
        text.slice(0, 48),
        dx + paddingLeft,
        dy + dh / 2,
        Math.max(16, dw - paddingLeft * 2),
      );
      ctx.restore();
    }
  }

  ctx.save();
  ctx.strokeStyle =
    elapsedSec > 0 ? "rgba(98, 102, 223, 0.45)" : "rgba(98, 102, 223, 0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, sw - 2, sh - 2);
  if (elapsedSec > 0) {
    const pulseX = 16 + ((elapsedSec * 48) % Math.max(24, sw - 32));
    ctx.fillStyle = "rgba(98, 102, 223, 0.18)";
    ctx.beginPath();
    ctx.arc(pulseX, sh - 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  return true;
}

/**
 * Browser capture panel supporting camera document scanning (`mode === "scanner"`)
 * and direct workspace region screenshot/recording (`mode === "capture"`).
 * In `capture` mode, neither Screenshot nor Recording is pre-selected initially;
 * clicking either button immediately switches the cursor to the corresponding capture icon
 * and allows dragging anywhere on the screen to capture or record.
 */
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
  const [selectedKind, setSelectedKind] = useState<
      "screenshot" | "recording" | null
    >(null),
    [phase, setPhase] = useState<
      "idle" | "loading" | "preview" | "selecting" | "recording"
    >("idle"),
    [error, setError] = useState(""),
    [elapsed, setElapsed] = useState(0);
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, w: 1, h: 1 });
  const [draggingSelection, setDraggingSelection] = useState(false);
  const [systemBarOpen, setSystemBarOpen] = useState(false);
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
  const recordMode = selectedKind === "recording";

  useEffect(() => {
    if (!review) {
      setReviewUrl("");
      return;
    }
    const u = URL.createObjectURL(review.blob);
    setReviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [review]);

  /**
   * Releases any active camera stream, MediaRecorder, animation frame, and selection state.
   */
  function release() {
    epoch.current++;
    cancelAnimationFrame(raf.current);
    clearInterval(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    media.current?.getTracks().forEach((x) => x.stop());
    cropStream.current?.getTracks().forEach((x) => x.stop());
    media.current = null;
    cropStream.current = null;
    pointer.current = null;
    setDraggingSelection(false);
    setSystemBarOpen(false);
    callbacks.current.onBusy(false);
    if (live.current) {
      setPhase("idle");
      setSelectedKind(null);
    }
  }

  useEffect(() => {
    live.current = true;
    const hide = () => {
      if (document.hidden && mode === "scanner") release();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      live.current = false;
      release();
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  useEffect(() => {
    if (phase !== "selecting" && phase !== "recording") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        release();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [phase]);

  /**
   * Starts either the camera preview (`mode === "scanner"`) or direct workspace region selection (`mode === "capture"`).
   * @param nextKind Optional capture kind ("screenshot" | "recording").
   */
  async function begin(nextKind?: "screenshot" | "recording") {
    if (nextKind) setSelectedKind(nextKind);
    setError("");
    setReview(null);

    if (mode === "capture") {
      const targetKind = nextKind || "screenshot";
      setSelectedKind(targetKind);
      setCrop({ x: 0, y: 0, w: 0, h: 0 });
      setDraggingSelection(false);
      onBusy(true);
      setPhase("selecting");
      if (typeof navigator !== "undefined" && !navigator.webdriver) {
        const run = ++epoch.current;
        setSystemBarOpen(true);
        void (async () => {
          try {
            const res = await fetch("/api/workbuddy-demo/system-capture", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mode: targetKind,
                lang: en ? "en" : "zh",
                showTopBar: true,
              }),
            });
            if (!res.ok) {
              if (live.current && run === epoch.current) setSystemBarOpen(false);
              return;
            }
            const json: {
              ok?: boolean;
              cancelled?: boolean;
              action?: string;
              data?: string;
            } = await res.json();
            if (!live.current || run !== epoch.current) return;
            setSystemBarOpen(false);
            if (json.cancelled) {
              release();
              return;
            }
            if (json.action === "record") {
              setSelectedKind("recording");
              void record(crop, false);
              return;
            }
            if (json.ok && json.data) {
              const binary = atob(json.data);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++)
                bytes[i] = binary.charCodeAt(i);
              const sysBlob = new Blob([bytes], { type: "image/png" });
              callbacks.current.onAdd({
                id: crypto.randomUUID(),
                kind: "screenshot",
                name: "Screenshot-" + Date.now() + ".png",
                blob: sysBlob,
                size: sysBlob.size,
                confirmed: true,
              });
              setReview(null);
              release();
            }
          } catch {
            if (live.current && run === epoch.current) setSystemBarOpen(false);
          }
        })();
      }
      return;
    }

    setCrop({ x: 0, y: 0, w: 1, h: 1 });
    setPhase("loading");
    onBusy(true);
    const run = ++epoch.current;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw Error();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
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

  /**
   * Draws the active camera video or review image onto a canvas using the current crop.
   */
  function draw(canvas: HTMLCanvasElement, targetCrop: Crop = crop) {
    const effectiveCrop =
      targetCrop.w > 0.01 && targetCrop.h > 0.01
        ? targetCrop
        : { x: 0.12, y: 0.12, w: 0.76, h: 0.72 };
    if (mode === "capture" && !review) {
      return renderWorkspaceRegionToCanvas(canvas, effectiveCrop);
    }
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
    canvas.width = Math.max(1, Math.round(w * effectiveCrop.w));
    canvas.height = Math.max(1, Math.round(h * effectiveCrop.h));
    canvas
      .getContext("2d")!
      .drawImage(
        source,
        w * effectiveCrop.x,
        h * effectiveCrop.y,
        w * effectiveCrop.w,
        h * effectiveCrop.h,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    return true;
  }

  /**
   * Immediately captures a PNG screenshot (or scanner frame) for the specified region.
   * @param targetCrop Crop region to capture.
   */
  async function capture(targetCrop: Crop = crop, fromOverlayDrag = false) {
    const run = epoch.current;
    if (
      mode === "capture" &&
      !review &&
      !fromOverlayDrag &&
      typeof navigator !== "undefined" &&
      !navigator.webdriver
    ) {
      try {
        const res = await fetch("/api/workbuddy-demo/system-capture", {
          method: "POST",
        });
        if (res.ok) {
          const json: { ok?: boolean; cancelled?: boolean; data?: string } =
            await res.json();
          if (json.cancelled) return;
          if (json.ok && json.data && run === epoch.current && live.current) {
            const binary = atob(json.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++)
              bytes[i] = binary.charCodeAt(i);
            const sysBlob = new Blob([bytes], { type: "image/png" });
            callbacks.current.onAdd({
              id: crypto.randomUUID(),
              kind: "screenshot",
              name: "Screenshot-" + Date.now() + ".png",
              blob: sysBlob,
              size: sysBlob.size,
              confirmed: true,
            });
            setReview(null);
            release();
            return;
          }
        }
      } catch {
        // Fall back to in-page region capture if local system endpoint is unavailable
      }
    }
    const canvas = document.createElement("canvas");
    if (!draw(canvas, targetCrop)) {
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

  /**
   * Starts recording either a cross-window system stream (in interactive sessions) or the selected workspace region.
   * @param targetCrop Selected region to record.
   * @param fromOverlayDrag True when triggered directly by dragging on the overlay.
   */
  async function record(targetCrop: Crop = crop, fromOverlayDrag = false) {
    let output: MediaStream | null = null;
    if (
      !fromOverlayDrag &&
      typeof navigator !== "undefined" &&
      !navigator.webdriver &&
      navigator.mediaDevices?.getDisplayMedia
    ) {
      try {
        output = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        media.current = output;
        output
          .getVideoTracks()[0]
          ?.addEventListener("ended", release, { once: true });
      } catch {
        return;
      }
    }
    const effectiveCrop =
      targetCrop.w > 0.01 && targetCrop.h > 0.01
        ? targetCrop
        : { x: 0.12, y: 0.12, w: 0.76, h: 0.72 };
    setCrop(effectiveCrop);
    const canvas = document.createElement("canvas");
    if (!output) {
      if (!renderWorkspaceRegionToCanvas(canvas, effectiveCrop, 0)) return;
      output = canvas.captureStream(24);
      cropStream.current = output;
    }
    let chunks: Blob[] = [],
      bytes = 0;
    const mime = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ].find(
      (x) =>
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(x),
    );
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
          confirmed: Boolean(media.current),
        });
    };
    const frame = () => {
      if (r.state !== "recording") return;
      if (!media.current) {
        const sec = (performance.now() - started) / 1000;
        renderWorkspaceRegionToCanvas(canvas, effectiveCrop, sec);
        raf.current = requestAnimationFrame(frame);
      }
    };
    r.start(250);
    setPhase("recording");
    setElapsed(0);
    if (!media.current) frame();
    timer.current = setInterval(() => {
      const seconds = (performance.now() - started) / 1000;
      if (live.current) setElapsed(Math.floor(seconds));
      if (seconds >= 60) release();
    }, 250);
  }

  const visible = items.filter((i) =>
    mode === "scanner" ? i.kind === "scanner" : i.kind !== "scanner",
  );
  const cursorKind = recordMode ? "recording" : "screenshot";
  const pixelWidth = Math.max(
    1,
    Math.round(
      crop.w * (typeof window !== "undefined" ? window.innerWidth : 1280),
    ),
  );
  const pixelHeight = Math.max(
    1,
    Math.round(
      crop.h * (typeof window !== "undefined" ? window.innerHeight : 800),
    ),
  );

  const topDock =
    mode === "capture" &&
    !review &&
    (phase === "selecting" || phase === "recording");

  return (
    <div
      className="demo-capture-panel"
      data-mode={mode}
      data-phase={phase}
      data-review={!!review}
      data-top-dock={topDock ? "true" : undefined}
      data-system-bar={systemBarOpen ? "true" : undefined}
      data-capture-cursor={
        mode === "capture" && selectedKind ? cursorKind : undefined
      }
    >
      {mode === "capture" && (
        <div className="demo-capture-modes">
          <button
            type="button"
            disabled={phase === "recording" || !!review}
            aria-pressed={selectedKind === "screenshot" && phase !== "idle"}
            onClick={() => void begin("screenshot")}
          >
            {t("截图", "Screenshot")}
          </button>
          <button
            type="button"
            disabled={phase === "recording" || !!review}
            aria-pressed={selectedKind === "recording" && phase !== "idle"}
            onClick={() => void begin("recording")}
          >
            {t("录屏", "Recording")}
          </button>
        </div>
      )}
      {((mode === "scanner" && phase !== "idle") || review) && (
        <>
          <p className="sr-only">
            {t(
              "在预览中拖动框选区域；不框选则保留完整画面。",
              "Drag on the preview to crop; leave unchanged for the full frame.",
            )}
          </p>
          <div
            className="demo-capture-viewport"
            data-capture-cursor={mode === "capture" ? cursorKind : undefined}
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
      {mode === "capture" &&
        (phase === "selecting" || phase === "recording") &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="demo-screen-selector-overlay input-controls-theme"
            data-capture-cursor={cursorKind}
            data-phase={phase}
            data-interactive={
              typeof navigator !== "undefined" && navigator.webdriver
                ? "true"
                : "false"
            }
            role="region"
            aria-label={t(
              recordMode ? "屏幕录制选区" : "屏幕截图选区",
              recordMode
                ? "Screen recording region selector"
                : "Screenshot region selector",
            )}
            onPointerDown={(e) => {
              if (phase !== "selecting") return;
              const vw = Math.max(1, window.innerWidth);
              const vh = Math.max(1, window.innerHeight);
              const startPt = {
                x: Math.max(0, Math.min(1, e.clientX / vw)),
                y: Math.max(0, Math.min(1, e.clientY / vh)),
              };
              pointer.current = startPt;
              setDraggingSelection(true);
              setCrop({ x: startPt.x, y: startPt.y, w: 0.01, h: 0.01 });
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (phase !== "selecting" || !pointer.current) return;
              const vw = Math.max(1, window.innerWidth);
              const vh = Math.max(1, window.innerHeight);
              const next = normalizedCrop(pointer.current, {
                x: Math.max(0, Math.min(1, e.clientX / vw)),
                y: Math.max(0, Math.min(1, e.clientY / vh)),
              });
              setCrop(next);
            }}
            onPointerUp={(e) => {
              if (phase !== "selecting" || !pointer.current) return;
              const vw = Math.max(1, window.innerWidth);
              const vh = Math.max(1, window.innerHeight);
              const next = normalizedCrop(pointer.current, {
                x: Math.max(0, Math.min(1, e.clientX / vw)),
                y: Math.max(0, Math.min(1, e.clientY / vh)),
              });
              pointer.current = null;
              setDraggingSelection(false);
              const finalCrop =
                next.w > 0.02 && next.h > 0.02
                  ? next
                  : { x: 0.12, y: 0.12, w: 0.76, h: 0.72 };
              setCrop(finalCrop);
              if (recordMode) {
                void record(finalCrop, true);
              } else {
                void capture(finalCrop, true);
              }
            }}
            onPointerCancel={() => {
              pointer.current = null;
              setDraggingSelection(false);
            }}
          >
            {(draggingSelection || phase === "recording") && (
              <div
                className="demo-selector-box"
                data-recording={phase === "recording"}
                style={{
                  left: crop.x * 100 + "%",
                  top: crop.y * 100 + "%",
                  width: crop.w * 100 + "%",
                  height: crop.h * 100 + "%",
                }}
              >
                <span className="demo-selector-badge">
                  {phase === "recording" ? (
                    <>
                      <i className="demo-recording-dot" />
                      {elapsed}s / 60s
                    </>
                  ) : (
                    <>
                      {pixelWidth} × {pixelHeight}
                    </>
                  )}
                </span>
              </div>
            )}
          </div>,
          document.body,
        )}
      {(mode === "scanner" || phase !== "idle" || !!review) && (
        <div className="demo-capture-actions">
          {((mode === "scanner" && phase !== "idle") || review) && (
            <button
              onClick={() => setCrop({ x: 0, y: 0, w: 1, h: 1 })}
              disabled={phase === "recording"}
            >
              <RotateCcw size={14} />
              {t("完整画面", "Full frame")}
            </button>
          )}
          {phase === "idle" && !review ? (
            mode === "scanner" ? (
              <button onClick={() => void begin()}>
                <Camera size={18} /> {t("打开摄像头", "Open camera")}
              </button>
            ) : null
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
                  if (recordMode && !review) void record(crop, false);
                  else void capture(crop, false);
                }}
              >
                {review
                  ? t("保存裁剪", "Save crop")
                  : recordMode
                    ? t("开始录屏", "Start recording")
                    : mode === "capture"
                      ? t("开始截屏", "Capture")
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
      )}
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
                      void begin(
                        item.kind === "screenshot" ? "screenshot" : undefined,
                      );
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
