import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { browserCaptureAdapter, stopMedia, waitForFrame, type CaptureAdapter } from "./capture-adapter";
import { useWidgetText, useWidgetThemeStyle } from "./environment";
export function CameraCapture(props: CameraCaptureProps) { return <CameraSession key={props.ownerId} {...props}/>; }
function CameraSession({
  onCapture,
  onClose,
  onError,
  adapter = browserCaptureAdapter,
}: {
  ownerId?: string;
  adapter?: CaptureAdapter;
  onCapture: (file: File) => void;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const translate = useWidgetText();
  const themeStyle = useWidgetThemeStyle();
  const callbacks = useRef({onCapture,onClose,onError}); callbacks.current={onCapture,onClose,onError};
  const acquisition = useRef<AbortController|null>(null);
  const stop = () => {mounted.current=false;acquisition.current?.abort();stopMedia(stream.current);stream.current=null;};
  const close = () => {stop();callbacks.current.onClose();};
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null);
  const mounted = useRef(false);
  const [ready, setReady] = useState(false),
    [taking, setTaking] = useState(false);
  useEffect(() => {
    const abort = new AbortController();acquisition.current=abort;
    let alive = true;
    mounted.current = true;
    const hide = () => {if(document.hidden){alive=false;abort.abort();close();}};document.addEventListener("visibilitychange",hide);
    void adapter.openCamera()
      .then(async (next) => {
        if (!alive || !mounted.current) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = next;
        if (video.current) {
          video.current.srcObject = next;
          try {
            await video.current.play();
            await waitForFrame(video.current, abort.signal);
            if (alive && mounted.current) setReady(true);
          } catch {
            if (alive && mounted.current) {
              callbacks.current.onError(translate("摄像头预览无法播放，请重试或选择本地图片。"));
              close();
            }
          }
        }
      })
      .catch(() => {
        if (alive && mounted.current) {
          callbacks.current.onError(translate("无法打开摄像头，请允许摄像头权限，或选择本地图片。"));
          close();
        }
      });
    return () => {
      document.removeEventListener("visibilitychange",hide);
      abort.abort();
      alive = false;
      mounted.current = false;
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
    };
  }, []);
  async function capture() {
    const element = video.current;
    if (!element?.videoWidth || taking) return;
    setTaking(true);
    const canvas = document.createElement("canvas");
    canvas.width = element.videoWidth;
    canvas.height = element.videoHeight;
    canvas.getContext("2d")!.drawImage(element, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!mounted.current) return;
    if (blob)
      callbacks.current.onCapture(new File([blob], "camera-photo.jpg", { type: "image/jpeg" }));
    else callbacks.current.onError(translate("图片保存失败，请重新拍摄。"));
    close();
  }
  return (
    <div
      className="input-controls-theme ic-demo-modal"
      style={themeStyle}
      role="dialog"
      aria-modal="true"
      aria-label={translate("拍摄图片")}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <section>
        <header>
          <b>{translate("拍摄图片")}</b>
          <button type="button"
            autoFocus
            aria-label={translate("关闭摄像头")}
            onClick={close}
          >
            <X />
          </button>
        </header>
        <video ref={video} muted playsInline />
        <button type="button"
          className="ic-demo-primary"
          disabled={!ready || taking}
          onClick={() => void capture()}
        >
          <Camera size={18} />
          {translate("拍摄")}
        </button>
      </section>
    </div>
  );
}

export type CameraCaptureProps = import("react").ComponentProps<typeof CameraSession>;
