import {WidgetFooter, type WidgetResetProps} from "./widget-footer";
import { Children, type ReactNode } from "react";
import { useWidgetText } from "./environment";
export function ImageWidget({
  children, onReset, canReset,
  onChoose,
  onDone,
  busy = false,
  canConfirm = true,
}: {
  children?: ReactNode;
  onChoose: () => void;
  /** @deprecated Camera acquisition belongs to ScannerWidget. */
  onCapture?: () => void;
  onDone: () => void;
  busy?: boolean;
  canConfirm?: boolean;
} & WidgetResetProps) {
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
      </footer>
      <WidgetFooter onReset={onReset} canReset={canReset} onConfirm={onDone} disabled={!hasPhotos || !canConfirm || busy} confirmLabel={uiText("确认图片选择")}/>
    </>
  );
}

export type ImageWidgetProps = import("react").ComponentProps<typeof ImageWidget>;
