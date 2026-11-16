import type { ReactNode } from "react";
import { WidgetIcon } from "./widget-icon";
import { useWidgetText } from "./environment";
export function AuxiliaryPanel({
  title,
  onClose,
  children,
  busy = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
}) {
  const uiText = useWidgetText();
  return (
    <div className="ic-demo-widget-wrap controls-panel-shell"><section className="ic-live-wb-aux" aria-busy={busy}>
      <header>
        <b>{title}</b>
        <button type="button" aria-label={uiText("关闭辅助输入")} onClick={onClose}>
          <WidgetIcon name="close" />
        </button>
      </header>
      {children}
    </section></div>
  );
}

export type AuxiliaryPanelProps = import("react").ComponentProps<typeof AuxiliaryPanel>;
