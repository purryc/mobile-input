import { useWidgetText } from "./environment";
import { useLayoutEffect, useRef } from "react";
import { Pencil, Sparkles, Square, Undo2 } from "lucide-react";
import { ApplicationActionChip } from "./application-action-chip";
type PolishAction = { id: string; label: string };
/** Presentation only. Requests, target validation and replacement belong to usePhoneEditing. */
function PolishActions({
  actions,
  binding,
  activeAction = "",
  failedAction = "",
  disabled = false,
  error = "",
  onAction,
  onCancel,
}: {
  actions: Pick<PolishAction, "id" | "label">[];
  binding: string;
  activeAction?: string;
  failedAction?: string;
  disabled?: boolean;
  error?: string;
  onAction: (id: string) => void;
  onCancel?: () => void;
}) {
  const uiText = useWidgetText();
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const parent = root.current?.parentElement;
    if (!parent) return;
    parent.classList.add("polish-stack");
    return () => parent.classList.remove("polish-stack");
  }, [actions.length]);
  if (!actions.length) return null;
  return (
    <div ref={root} className="contextual-polish" data-target={binding}>
      <div
        className="contextual-polish-row"
        role="group"
        aria-label={uiText("AI润色")}
      >
        <span className="contextual-polish-title">
          <span className="polish-smart-pencil" aria-hidden>
            <Pencil size={17} />
            <Sparkles size={9} />
          </span>
          {uiText("AI润色")}
        </span>
        <div className="contextual-polish-options">
          {actions.slice(0, 3).map((a) => {
            const active = activeAction === a.id,
              stoppable = active && !!onCancel;
            return (
              <ApplicationActionChip
                key={a.id}
                aria-label={
                  stoppable
                    ? uiText("停止润色")
                    : failedAction === a.id
                      ? uiText("重试") + " " + uiText(a.label)
                      : uiText(a.label)
                }
                loading={active}
                disabled={!stoppable && (disabled || !!activeAction)}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => (stoppable ? onCancel?.() : onAction(a.id))}
              >
                {active
                  ? uiText("处理中")
                  : failedAction === a.id
                    ? uiText("重试") + " " + uiText(a.label)
                    : uiText(a.label)}
                {stoppable && (
                  <span className="polish-chip-stop">
                    <Square size={12} fill="currentColor" aria-hidden="true" />
                    {uiText("停止")}
                  </span>
                )}
              </ApplicationActionChip>
            );
          })}
        </div>
      </div>
      {error && (
        <p className="polish-error" role="alert">
          {uiText(error)}
        </p>
      )}
    </div>
  );
}

export type PolishWidgetProps = Parameters<typeof PolishActions>[0] & {
  restore?: () => void;
  notice?: string;
};
export function PolishWidget({ restore, notice, ...props }: PolishWidgetProps) {
  const t = useWidgetText();
  return (
    <div className="demo-polish-slot">
      <div className="demo-polish-row">
        {restore ? (
          <button
            type="button"
            className="demo-polish-restore"
            aria-label={t("恢复原文")}
            title={t("恢复原文")}
            disabled={props.disabled}
            onPointerDown={(e) => e.preventDefault()}
            onClick={restore}
          >
            <Undo2 size={18} aria-hidden="true" />
          </button>
        ) : (
          <PolishActions {...props} />
        )}
      </div>
      {notice && (
        <span className="demo-polish-notice" role="status">
          {t(notice)}
        </span>
      )}
    </div>
  );
}
