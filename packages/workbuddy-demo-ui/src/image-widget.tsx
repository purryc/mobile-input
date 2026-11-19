import { Children, type ReactNode } from "react";
import { WidgetIcon } from "./widget-icon";
import { useWidgetText } from "./environment";
export function ImageWidget({
  children,
  onChoose,
  onCapture,
  onDone,
  busy = false,
}: {
  children?: ReactNode;
  onChoose: () => void;
  onCapture: () => void;
  onDone: () => void;
  busy?: boolean;
}) {
  const uiText = useWidgetText();
  const hasPhotos = Children.toArray(children).length > 0;
  return (
    <>
      {hasPhotos && <div className="live-wb-photo-body">{children}</div>}
      <footer className="agent-photo-actions" data-has-photos={hasPhotos}>
        <button
          className="agent-photo-source"
          disabled={busy}
          onClick={onChoose}
        >
          {uiText("选择图片")}
        </button>
        <button
          className="agent-photo-source"
          disabled={busy}
          onClick={onCapture}
        >
          {uiText("拍摄")}
        </button>
        {hasPhotos && (
          <button
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
