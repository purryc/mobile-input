import { Children, type ReactNode } from "react";
import { WidgetIcon } from "./widget-icon";
import { useWidgetText } from "./environment";
export function ImageWidget({
  children,
  onChoose,
  onCapture,
  onDone,
  busy = false,
  canConfirm = true,
}: {
  children?: ReactNode;
  onChoose: () => void;
  onCapture: () => void;
  onDone: () => void;
  busy?: boolean;
  canConfirm?: boolean;
}) {
  const uiText = useWidgetText();
  const hasPhotos = Children.toArray(children).length > 0;
  return (
    <>
      {hasPhotos && <div className="ic-live-wb-photo-body">{children}</div>}
      <footer className="ic-agent-photo-actions" data-has-photos={hasPhotos}>
        <button type="button"
          className="ic-agent-photo-source"
          disabled={busy}
          onClick={onChoose}
        >
          {uiText("选择图片")}
        </button>
        <button type="button"
          className="ic-agent-photo-source"
          disabled={busy}
          onClick={onCapture}
        >
          {uiText("拍摄")}
        </button>
        {hasPhotos && canConfirm && (
          <button type="button"
            aria-label={uiText("确认图片选择")}
            disabled={busy}
            onClick={onDone}
          >
            <WidgetIcon name="check" />
          </button>
        )}
      </footer>
    </>
  );
}

export type ImageWidgetProps = import("react").ComponentProps<typeof ImageWidget>;
