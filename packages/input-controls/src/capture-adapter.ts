/** Host-injected acquisition. A stream is owned by the requesting widget until closed. */
export interface CaptureAdapter {
  openCamera: () => Promise<MediaStream>;
  openScreen: () => Promise<MediaStream>;
}
/** Call only from an explicit user action on HTTPS or localhost. No network/API fallback. */
export const browserCaptureAdapter: CaptureAdapter = {
  async openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable');
    return navigator.mediaDevices.getUserMedia({video: true, audio: false});
  },
  async openScreen() {
    if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('Screen capture unavailable');
    return navigator.mediaDevices.getDisplayMedia({video: true, audio: false});
  },
};
export function stopMedia(stream: MediaStream | null) { stream?.getTracks().forEach(track => track.stop()); }
export function waitForFrame(video: HTMLVideoElement, signal: AbortSignal, timeout = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    let timer: ReturnType<typeof setTimeout>;
    const finish = (error?: Error) => { clearTimeout(timer); signal.removeEventListener('abort', cancel); error ? reject(error) : resolve(); };
    const cancel = () => finish(new DOMException('Cancelled', 'AbortError'));
    const check = () => {
      if (signal.aborted) return cancel();
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) return finish();
      if (performance.now() - started > timeout) return finish(new Error('No camera frame'));
      timer = setTimeout(check, 50);
    };
    signal.addEventListener('abort', cancel, {once: true}); check();
  });
}

/** Optional host-rendered workspace with its own system toolbar and canvas source. */
export interface WorkspaceCaptureAdapter {
  readonly useSystemToolbar: boolean;
  drawRegion(canvas: HTMLCanvasElement, region: import('./capture-panel').Crop, elapsedSeconds?: number): boolean;
  requestSystemCapture(options?: {mode: 'screenshot' | 'recording'; language: 'en' | 'zh'}, signal?: AbortSignal): Promise<
    {kind: 'screenshot'; blob: Blob} | {kind: 'cancelled' | 'record' | 'unavailable'}
  >;
}
