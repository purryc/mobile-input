import {useEffect, useRef, useState} from "react";
import {Camera, Check, RotateCcw, Square, Upload} from "lucide-react";
import {createPortal} from "react-dom";
import {CaptureTile, normalizedCrop, type Crop, type CapturePanelProps} from "./capture-panel";
import type {CaptureMaterial as DemoCapture} from "./types";
import {useWidgetEnvironment, useWidgetThemeStyle} from "./environment";
import type {WorkspaceCaptureAdapter} from "./capture-adapter";

const SCANNER_PREVIEW_TIMEOUT_MS = 5000;

function cameraHasFrame(video: HTMLVideoElement) {
  return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 && video.videoHeight > 0;
}

/**
 * Browser capture panel supporting camera document scanning (`mode === "scanner"`)
 * and direct workspace region screenshot/recording (`mode === "capture"`).
 * In `capture` mode, neither Screenshot nor Recording is pre-selected initially;
 * clicking either button immediately switches the cursor to the corresponding capture icon
 * and allows dragging anywhere on the screen to capture or record.
 */
export function WorkspaceCaptureSession({
  mode,
  items,
  language,
  onAdd,
  onRemove,
  onConfirm,
  onBusy = () => {},
  workspace,
  adapter,
}: CapturePanelProps & {workspace: WorkspaceCaptureAdapter}) {
  const {portalRoot} = useWidgetEnvironment();
  const themeStyle = useWidgetThemeStyle();
  const systemRequest = useRef<AbortController | null>(null);
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
  const scannerFile = useRef<HTMLInputElement>(null);
  const retaking = useRef<DemoCapture | null>(null);
  const previewWait = useRef<AbortController | null>(null);
  const savingScan = useRef(false);
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
    systemRequest.current?.abort();
    systemRequest.current = null;
    previewWait.current?.abort();
    previewWait.current = null;
    retaking.current = null;
    savingScan.current = false;
    if (mode === "scanner" && video.current) video.current.srcObject = null;
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
    window.addEventListener("pagehide", release);
    document.addEventListener("visibilitychange", hide);
    return () => {
      live.current = false;
      release();
      window.removeEventListener("pagehide", release);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  useEffect(() => {
    if (phase !== "selecting" && phase !== "recording") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (recorder.current) recorder.current.onstop = null;
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
  function adoptSystemScreenshot(blob: Blob) {
    const replacing = retaking.current;
    callbacks.current.onAdd({
      id: crypto.randomUUID(), kind: "screenshot", name: "Screenshot-" + Date.now() + ".png",
      blob, size: blob.size, confirmed: true,
    });
    if (replacing) onRemove(replacing.id);
    setReview(null);
    release();
  }

  async function begin(nextKind?: "screenshot" | "recording", replacement?: DemoCapture) {
    retaking.current = replacement ?? null;
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
      if (workspace.useSystemToolbar) {
        const run = ++epoch.current;
        const request = new AbortController();
        systemRequest.current?.abort();
        systemRequest.current = request;
        setSystemBarOpen(true);
        void (async () => {
          try {
            const result = await workspace.requestSystemCapture({mode: targetKind, language: en ? "en" : "zh"}, request.signal);
            if (!live.current || run !== epoch.current) return;
            setSystemBarOpen(false);
            if (result.kind === "cancelled") release();
            if (result.kind === "record") {
              setSelectedKind("recording");
              void record({x:0,y:0,w:1,h:1}, false);
            }
            if (result.kind === "screenshot") adoptSystemScreenshot(result.blob);
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
    const current = () => live.current && run === epoch.current;
    try {
      if (!adapter && !navigator.mediaDevices?.getUserMedia) {
        throw new DOMException("", "NotSupportedError");
      }
      const stream = adapter ? await adapter.openCamera() : await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (!current()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      media.current = stream;
      const track = stream.getVideoTracks()[0];
      if (!track || track.readyState !== "live") throw new DOMException("", "NotReadableError");
      track.addEventListener("ended", () => {
        if (!current()) return;
        release();
        setError(t("摄像头已断开，请重试或导入扫描图片。", "Camera disconnected. Retry or import a scanned image."));
      }, { once: true });

      if (!video.current) throw new DOMException("", "NotReadableError");
      const element = video.current;
      const wait = new AbortController();
      previewWait.current = wait;
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        function finish(error?: unknown) {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          element.removeEventListener("loadeddata", check);
          element.removeEventListener("playing", check);
          element.removeEventListener("resize", check);
          element.removeEventListener("error", mediaError);
          wait.signal.removeEventListener("abort", cancel);
          if (error) reject(error);
          else resolve();
        }
        function check() {
          if (cameraHasFrame(element)) finish();
        }
        function cancel() { finish(new DOMException("", "AbortError")); }
        function mediaError() { finish(new DOMException("", "NotReadableError")); }
        const timeout = setTimeout(() => finish(new DOMException("", "TimeoutError")), SCANNER_PREVIEW_TIMEOUT_MS);
        element.addEventListener("loadeddata", check);
        element.addEventListener("playing", check);
        element.addEventListener("resize", check);
        element.addEventListener("error", mediaError);
        wait.signal.addEventListener("abort", cancel, { once: true });
        element.srcObject = stream;
        void element.play().then(check, finish);
      });
      if (current()) {
        previewWait.current = null;
        setPhase("preview");
      }
    } catch (failure) {
      if (!current()) return;
      release();
      const name = failure instanceof DOMException ? failure.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(t("请在浏览器地址栏允许摄像头权限后重试，或导入扫描图片。", "Allow camera access in the browser’s site settings and retry, or import a scanned image."));
      } else if (name === "NotSupportedError" || name === "NotFoundError") {
        setError(t("当前浏览器未找到可用摄像头。请使用 Chrome 或导入扫描图片。", "No camera is available here. Try Chrome or import a scanned image."));
      } else if (name === "TimeoutError") {
        setError(t("摄像头已连接，但未收到画面。请关闭其他使用摄像头的应用后重试，或导入扫描图片。", "The camera connected but sent no frames. Close other apps using it and retry, or import a scanned image."));
      } else {
        setError(t("无法启动摄像头。请检查设备连接和系统权限后重试，或导入扫描图片。", "Could not start the camera. Check the device and system permissions, or import a scanned image."));
      }
    }
  }

  function importScan(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        !file.size || file.size > 8 * 1024 * 1024) {
      setError(t("请选择不超过 8 MB 的 PNG、JPEG 或 WebP 图片。", "Choose a PNG, JPEG or WebP image up to 8 MB."));
      return;
    }
    setError("");
    onAdd({
      id: crypto.randomUUID(), kind: "scanner", name: file.name,
      blob: file, size: file.size, confirmed: false,
    });
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
      return workspace.drawRegion(canvas, effectiveCrop);
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
    if (mode === "scanner" && (savingScan.current || (!review && phase !== "preview"))) return;
    if (
      mode === "capture" &&
      !review &&
      !fromOverlayDrag &&
      workspace.useSystemToolbar
    ) {
      try {
        if (systemBarOpen) return;
        const request = new AbortController();
        systemRequest.current?.abort();
        systemRequest.current = request;
        const result = await workspace.requestSystemCapture(undefined, request.signal);
        if (request.signal.aborted) return;
        if (!live.current || run !== epoch.current || result.kind === "cancelled") return;
        if (result.kind === "screenshot") {
          adoptSystemScreenshot(result.blob);
          return;
        }
      } catch {
        if (run !== epoch.current || !live.current) return;
        // The host can still supply the workspace frame.
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
    const replacing = review ?? retaking.current;
    if (mode === "scanner") savingScan.current = true;
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/png"),
    );
    if (run !== epoch.current || !live.current) return;
    savingScan.current = false;
    if (!blob) {
      if (mode === "scanner") setError(t("未能保存扫描图片，请重试。", "Could not save the scanned image. Try again."));
      return;
    }
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
    const run = epoch.current;
    let output: MediaStream | null = null;
    if (
      !fromOverlayDrag &&
      workspace.useSystemToolbar &&
      navigator.mediaDevices?.getDisplayMedia
    ) {
      try {
        output = adapter ? await adapter.openScreen() : await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        if (!live.current || run !== epoch.current) {
          output.getTracks().forEach(track => track.stop());
          return;
        }
        media.current = output;
        output
          .getVideoTracks()[0]
          ?.addEventListener("ended", release, { once: true });
      } catch {
        if (live.current && run === epoch.current) setError(t(
          "点击开始录屏，再在浏览器中选择要共享的屏幕。", "Click Start recording and select a screen in the browser."
        ));
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
      if (!workspace.drawRegion(canvas, effectiveCrop, 0)) return;
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
    const systemRecording = output === media.current;
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
      if (live.current && blob.size)
        save({
          id: crypto.randomUUID(),
          kind: "recording",
          name: "Recording-" + Date.now() + ".webm",
          blob,
          size: blob.size,
          duration: Math.min(60, (performance.now() - started) / 1000),
          confirmed: systemRecording,
        });
    };
    const frame = () => {
      if (r.state !== "recording") return;
      if (!media.current) {
        const sec = (performance.now() - started) / 1000;
        workspace.drawRegion(canvas, effectiveCrop, sec);
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
      className="ic-demo-capture-panel"
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
        <div className="ic-demo-capture-modes">
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
            className="ic-demo-capture-viewport"
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
                src={reviewUrl || undefined}
                alt={t("裁剪预览", "Crop preview")}
              />
            ) : null}
            <video
              ref={video}
              autoPlay={mode === "scanner"}
              muted
              playsInline
              style={{ display: review ? "none" : "block" }}
            />
            <div
              className="ic-demo-crop-box"
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
            className="ic-demo-screen-selector-overlay input-controls-theme"
            style={themeStyle}
            data-capture-cursor={cursorKind}
            data-phase={phase}
            data-interactive={
              String(!systemBarOpen)
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
                className="ic-demo-selector-box"
                data-recording={phase === "recording"}
                style={{
                  left: crop.x * 100 + "%",
                  top: crop.y * 100 + "%",
                  width: crop.w * 100 + "%",
                  height: crop.h * 100 + "%",
                }}
              >
                <span className="ic-demo-selector-badge">
                  {phase === "recording" ? (
                    <>
                      <i className="ic-demo-recording-dot" />
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
          portalRoot ?? document.body,
        )}
      {(mode === "scanner" || phase !== "idle" || !!review) && (
        <div className="ic-demo-capture-actions">
          {((mode === "scanner" && phase !== "idle") || review) && (
            <button type="button"
              onClick={() => setCrop({ x: 0, y: 0, w: 1, h: 1 })}
              disabled={phase === "recording"}
            >
              <RotateCcw size={14} />
              {t("完整画面", "Full frame")}
            </button>
          )}
          {phase === "idle" && !review ? (
            mode === "scanner" ? (
              <>
                <button type="button" onClick={() => void begin()}>
                  <Camera size={18} /> {t("打开摄像头", "Open camera")}
                </button>
                <button type="button" onClick={() => scannerFile.current?.click()}>
                  <Upload size={16} /> {t("导入扫描图片", "Import scanned image")}
                </button>
                <input
                  ref={scannerFile}
                  type="file"
                  hidden
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = "";
                    if (file) importScan(file);
                  }}
                />
              </>
            ) : null
          ) : phase === "recording" ? (
            <button type="button" onClick={release}>
              <Square size={16} />
              {t("停止", "Stop")} · {elapsed}s / 60s
            </button>
          ) : (
            <>
              <button type="button"
                disabled={phase === "loading" || systemBarOpen}
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
              <button type="button"
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
      {mode === "scanner" && phase === "loading" && (
        <p role="status">{t("正在等待摄像头画面…", "Waiting for the camera preview…")}</p>
      )}
      {error && <p role="alert">{error}</p>}
      {visible.length > 0 && (
        <div className="ic-demo-capture-items">
          {visible.map((item) => (
            <section key={item.id}>
              <CaptureTile item={item} onRemove={() => onRemove(item.id)} />
              {!item.confirmed && item.kind !== "recording" && (
                <div>
                  <button type="button"
                    disabled={mode === "scanner" && (phase !== "idle" || !!review)}
                    onClick={() => {
                      release();
                      setReview(item);
                      setCrop({ x: 0, y: 0, w: 1, h: 1 });
                    }}
                  >
                    {t("裁剪", "Crop")}
                  </button>
                  <button type="button"
                    disabled={mode === "scanner" && (phase !== "idle" || !!review)}
                    onClick={() => {
                      if (item.kind === "scanner") {
                        void begin(undefined, item);
                      } else {
                        void begin("screenshot", item);
                      }
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
        <button type="button" className="ic-demo-capture-confirm" onClick={onConfirm}>
          <Check size={18} />
          {t("确认材料", "Confirm materials")}
        </button>
      )}
    </div>
  );
}
