import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { useWidgetText } from "./environment";
export function CameraCapture({
  onCapture,
  onClose,
  onError,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const translate = useWidgetText();
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null);
  const mounted = useRef(false);
  const [ready, setReady] = useState(false),
    [taking, setTaking] = useState(false);
  useEffect(() => {
    const media = navigator.mediaDevices;
    if (!media?.getUserMedia) {
      onError("当前浏览器无法打开摄像头，请选择本地图片。");
      onClose();
      return;
    }
    let alive = true;
    mounted.current = true;
    void media
      .getUserMedia({ video: true, audio: false })
      .then(async (next) => {
        if (!alive) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = next;
        if (video.current) {
          video.current.srcObject = next;
          try {
            await video.current.play();
            if (alive) setReady(true);
          } catch {
            if (alive) {
              onError("摄像头预览无法播放，请重试或选择本地图片。");
              onClose();
            }
          }
        }
      })
      .catch(() => {
        if (alive) {
          onError("无法打开摄像头，请允许摄像头权限，或选择本地图片。");
          onClose();
        }
      });
    return () => {
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
      onCapture(new File([blob], "拍摄图片.jpg", { type: "image/jpeg" }));
    else onError("图片保存失败，请重新拍摄。");
    onClose();
  }
  return (
    <div
      className="demo-modal"
      role="dialog"
      aria-modal="true"
      aria-label={translate("拍摄图片")}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <section>
        <header>
          <b>{translate("拍摄图片")}</b>
          <button
            autoFocus
            aria-label={translate("关闭摄像头")}
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        <video ref={video} muted playsInline />
        <button
          className="demo-primary"
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
