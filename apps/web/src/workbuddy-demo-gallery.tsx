import {ImageWidget, type ImageWidgetProps, useWidgetText} from "@mobile-input/controls";

/** Existing Xiaoyi gallery callers also offer the product's quick-photo action. */
export function DemoGallery({onCapture, ...props}: ImageWidgetProps) {
  const t = useWidgetText();
  return <div className="demo-gallery">
    <ImageWidget {...props}/>
    {onCapture && <button type="button" className="ic-agent-photo-source" disabled={props.busy}
      onClick={onCapture}>{t("拍摄")}</button>}
  </div>;
}
