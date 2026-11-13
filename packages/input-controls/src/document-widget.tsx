import type { ComponentProps, ReactNode } from "react";
import { Check, Plus } from "lucide-react";
import { ChoiceWidget } from "./choice-widget";
import { useWidgetEnvironment, useWidgetText } from "./environment";
export type DocumentWidgetProps = {
  choices?: ComponentProps<typeof ChoiceWidget>;
  children?: ReactNode;
  onChoose: () => void;
  onDone?: () => void;
};
export function DocumentWidget({
  choices,
  children,
  onChoose,
  onDone,
}: DocumentWidgetProps) {
  const t = useWidgetText();
  const doneLabel = useWidgetEnvironment().language.startsWith("en")
    ? "Done"
    : "完成选择";
  return choices ? (
    <ChoiceWidget
      {...choices}
      binding={{ ...choices.binding, kind: "document" }}
      onChooseFile={onChoose}
    />
  ) : (
    <>
      <div className="demo-documents">
        {children}
        <button type="button" onClick={onChoose}>
          <Plus size={18} />
          {t("添加参考资料")}
        </button>
      </div>
      <div className="demo-choice-footer">
        <span>{t("PDF、TXT、Markdown · 单份最多 8 MB")}</span>
        {onDone && (
          <button type="button" aria-label={doneLabel} title={doneLabel} onClick={onDone}>
            <Check size={24} />
          </button>
        )}
      </div>
    </>
  );
}
