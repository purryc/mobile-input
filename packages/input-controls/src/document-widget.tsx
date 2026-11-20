import {WidgetFooter, type WidgetResetProps} from "./widget-footer";
import { useId, type ComponentProps, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { ChoiceWidget } from "./choice-widget";
import { useWidgetEnvironment, useWidgetText } from "./environment";
import type { DocumentFile } from "./document-file-list";

export type DocumentWidgetProps = WidgetResetProps & {
  choices?: Omit<ComponentProps<typeof ChoiceWidget>, "onRemoveMaterial">;
  /** Receives the adopted option or local material ID in the host-owned draft. */
  onRemoveMaterial?: (id: string) => void;
  materials?: DocumentFile[];
  onPreviewMaterial?: (id: string) => void;
  children?: ReactNode;
  onChoose: () => void;
  onDone?: () => void;
};
export function DocumentWidget({
  choices, onReset, canReset,
  materials,
  onPreviewMaterial,
  children,
  onChoose,
  onRemoveMaterial,
  onDone,
}: DocumentWidgetProps) {
  const t = useWidgetText();
  const {language} = useWidgetEnvironment();
  const doneLabel = language.startsWith("en")
    ? "Done"
    : "完成选择";
  const owner = useId();
  if (!choices && (materials || children == null)) {
    return <ChoiceWidget
      onReset={onReset} canReset={canReset} definition={{kind: "document", zh: "文件选择", en: "File picker", options: []}}
      binding={{id: owner, kind: "document", origin: "manual", value: []}}
      owner={owner} language={language}
      materials={materials} onChooseFile={onChoose} showDone={Boolean(onDone)}
      onPreviewMaterial={onPreviewMaterial} onRemoveMaterial={onRemoveMaterial}
      onEvent={event => { if (event.type === "close") onDone?.(); }}
    />;
  }
  return choices ? (
    <ChoiceWidget
      {...choices} onReset={onReset ?? choices.onReset} canReset={canReset ?? choices.canReset}
      binding={{ ...choices.binding, kind: "document" }}
      onChooseFile={onChoose}
      onRemoveMaterial={onRemoveMaterial}
    />
  ) : (
    <>
      <div className="ic-demo-documents">
        {children}
        <button type="button" onClick={onChoose}>
          <Plus size={18} />
          {t("添加参考资料")}
        </button>
      </div>
      <WidgetFooter onReset={onReset} canReset={canReset} onConfirm={onDone} confirmLabel={doneLabel}/>
    </>
  );
}
