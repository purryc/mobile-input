import type { ComponentProps, ReactNode } from "react";
import { Plus } from "lucide-react";
import { ChoiceWidget } from "./choice-widget";
import { useWidgetText } from "./environment";
export type DocumentWidgetProps = {
  choices?: ComponentProps<typeof ChoiceWidget>;
  children?: ReactNode;
  onChoose: () => void;
};
export function DocumentWidget({
  choices,
  children,
  onChoose,
}: DocumentWidgetProps) {
  const t = useWidgetText();
  return choices ? (
    <ChoiceWidget
      {...choices}
      binding={{ ...choices.binding, kind: "document" }}
      onChooseFile={onChoose}
    />
  ) : (
    <div className="demo-documents">
      {children}
      <button onClick={onChoose}>
        <Plus size={18} />
        {t("添加参考资料")}
      </button>
      <small>{t("PDF、TXT、Markdown · 单份最多 8 MB")}</small>
    </div>
  );
}
