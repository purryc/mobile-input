import {useEffect, useRef, useState} from "react";
import {Check, RotateCcw, Square} from "lucide-react";
import {createPortal} from "react-dom";
import {CaptureTile, normalizedCrop, useWidgetEnvironment, useWidgetThemeStyle, type Crop, type CapturePanelProps, type CaptureMaterial as DemoCapture} from "@mobile-input/controls";
import {workspaceCapture as workspace} from "./workbuddy-demo-workspace-capture";

/** Selects a region of this workspace or delegates to Xiaoyi's native screen toolbar. */
export function WorkspaceScreenCapture({
  items,
  language,
  onAdd,
  onRemove,
  onConfirm,
  onBusy = () => {},
  adapter,
}: Omit<CapturePanelProps, "mode">) {
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
  const image = useRef<HTMLImageElement>(null),
    media = useRef<MediaStream | null>(null),
    recorder = useRef<MediaRecorder | null>(null),
    cropStream = useRef<MediaStream | null>(null),
    live = useRef(true),
    epoch = useRef(0),
    raf = useRef(0),
    timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined),
    startTime = useRef(0),
    pointer = useRef<{ x: number; y: number } | null>(null);
  const retaking = useRef<DemoCapture | null>(null);
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
   * Releases any active screen stream, MediaRecorder, animation frame, and selection state.
   */
  function release() {
    epoch.current++;
    systemRequest.current?.abort();
    systemRequest.current = null;
    retaking.current = null;
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
    window.addEventListener("pagehide", release);
    return () => {
      live.current = false;
      release();
      window.removeEventListener("pagehide", release);
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
  }

  function draw(canvas: HTMLCanvasElement, targetCrop: Crop = crop) {
    const effectiveCrop =
      targetCrop.w > 0.01 && targetCrop.h > 0.01
        ? targetCrop
        : { x: 0.12, y: 0.12, w: 0.76, h: 0.72 };
    if (!review) {
      return workspace.drawRegion(canvas, effectiveCrop);
    }
    const source = image.current;
    if (!source) return false;
    const {naturalWidth: w, naturalHeight: h} = source;
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
   * Immediately captures a PNG screenshot for the specified region.
   * @param targetCrop Crop region to capture.
   */
  async function capture(targetCrop: Crop = crop, fromOverlayDrag = false) {
    const run = epoch.current;
    if (
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
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/png"),
    );
    if (run !== epoch.current || !live.current) return;
    if (!blob) {
      return;
    }
    const item: DemoCapture = {
      id: crypto.randomUUID(),
      kind: "screenshot",
      name:
        "Screenshot-" + Date.now() + ".png",
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
    i.kind !== "scanner",
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
    !review &&
    (phase === "selecting" || phase === "recording");

  return (
    <div
      className="ic-demo-capture-panel"
      data-mode="capture"
      data-phase={phase}
      data-review={!!review}
      data-top-dock={topDock ? "true" : undefined}
      data-system-bar={systemBarOpen ? "true" : undefined}
      data-capture-cursor={
        selectedKind ? cursorKind : undefined
      }
    >
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
      {review && (
        <>
          <p className="sr-only">
            {t(
              "在预览中拖动框选区域；不框选则保留完整画面。",
              "Drag on the preview to crop; leave unchanged for the full frame.",
            )}
          </p>
          <div
            className="ic-demo-capture-viewport"
            data-capture-cursor={cursorKind}
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
      {        (phase === "selecting" || phase === "recording") &&
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
      {(phase !== "idle" || !!review) && (
        <div className="ic-demo-capture-actions">
          {review && (
            <button type="button"
              onClick={() => setCrop({ x: 0, y: 0, w: 1, h: 1 })}
              disabled={phase === "recording"}
            >
              <RotateCcw size={14} />
              {t("完整画面", "Full frame")}
            </button>
          )}
          {phase === "recording" ? (
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
                    : t("开始截屏", "Capture")}
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
      {error && <p role="alert">{error}</p>}
      {visible.length > 0 && (
        <div className="ic-demo-capture-items">
          {visible.map((item) => (
            <section key={item.id}>
              <CaptureTile item={item} onRemove={() => onRemove(item.id)} />
              {!item.confirmed && item.kind !== "recording" && (
                <div>
                  <button type="button"
                    onClick={() => {
                      release();
                      setReview(item);
                      setCrop({ x: 0, y: 0, w: 1, h: 1 });
                    }}
                  >
                    {t("裁剪", "Crop")}
                  </button>
                  <button type="button"
                    onClick={() => {
                      void begin("screenshot", item);
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
