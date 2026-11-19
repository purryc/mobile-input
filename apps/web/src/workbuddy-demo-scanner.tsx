import {useEffect, useRef, useState} from "react";
import {
  ScannerWidget, browserCaptureAdapter, stopMedia, waitForFrame,
  type ScannerWidgetProps,
} from "@mobile-input/controls";

/** Keep the product's file fallback and no-frame recovery around the published widget. */
export function DemoScanner(props: ScannerWidgetProps) {
  const [failure, setFailure] = useState("");
  const pending = useRef<AbortController | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const en = props.language === "en";

  useEffect(() => () => pending.current?.abort(), []);
  async function openCamera() {
    pending.current?.abort();
    const request = new AbortController();
    pending.current = request;
    setFailure("");
    let stream: MediaStream | null = null;
    const probe = document.createElement("video");
    probe.muted = true;
    probe.playsInline = true;
    try {
      stream = await browserCaptureAdapter.openCamera();
      request.signal.throwIfAborted();
      // A connected camera can leave play() pending indefinitely without a frame.
      probe.srcObject = stream;
      await Promise.all([probe.play(), waitForFrame(probe, request.signal, 5000)]);
      request.signal.throwIfAborted();
      return stream;
    } catch (error) {
      stopMedia(stream);
      if (!request.signal.aborted) {
        const stalled = error instanceof Error && error.message === "No camera frame";
        setFailure(stalled
          ? (en ? "The camera connected but sent no frames." : "摄像头已连接，但未收到画面。")
          : (en ? "Could not start the camera." : "无法启动摄像头。"));
      }
      throw error;
    } finally {
      probe.srcObject = null;
      if (pending.current === request) pending.current = null;
      request.abort();
    }
  }
  return <>
    <ScannerWidget {...props} adapter={{...browserCaptureAdapter, openCamera}} onBusy={busy => {
      if (!busy) pending.current?.abort();
      props.onBusy?.(busy);
    }}/>
    {failure && <div className="ic-demo-capture-actions">
      <small role="status">{failure}</small>
      <button type="button" onClick={() => picker.current?.click()}>{en ? "Import scanned image" : "导入扫描图片"}</button>
      <input ref={picker} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={event => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = "";
        if (!file) return;
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || !file.size || file.size > 8 * 1024 * 1024) {
          setFailure(en ? "Choose a PNG, JPEG or WebP image up to 8 MB." : "请选择不超过 8 MB 的 PNG、JPEG 或 WebP 图片。");
          return;
        }
        props.onAdd({id: crypto.randomUUID(), kind: "scanner", cameraMode: "scan", name: file.name,
          blob: file, size: file.size, confirmed: false});
      }}/>
    </div>}
  </>;
}
