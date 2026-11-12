import type { ReactNode, RefObject } from "react";
import {
  AuxiliaryPanel,
  ColorWidget,
  DurationWidget,
  ImageWidget,
  SketchWidget,
  DocumentWidget,
  ScannerWidget,
  ScreenCaptureWidget,
  widgetWidths,
} from "../../../packages/input-controls/src";
import {
  controlLabel,
  definition,
} from "../../../packages/core/workbuddy-demo-controls";
import type { DemoMaterial } from "../../../packages/core/workbuddy-demo-state";
import { choiceViews } from "./workbuddy-demo-controls";
import { colorTitle } from "./agent-widget-color";
import { uiText } from "./i18n";
import { WorkBuddyDemoPopover } from "./workbuddy-demo-popover";
import type { ReadyDemoController } from "./workbuddy-demo-controller";

export function WorkbuddyWidgetHost({
  model,
  anchorRoot,
  controlsId,
  materialTile,
}: {
  model: ReadyDemoController;
  anchorRoot: RefObject<HTMLDivElement | null>;
  controlsId: string;
  materialTile: (material: DemoMaterial, photoPanel?: boolean) => ReactNode;
}) {
  const {
    draft,
    panel,
    setPanel,
    setDrawing,
    busy,
    setBusy,
    language,
    controlEvent,
    pick,
    addCapture,
    removeCapture,
    confirmCapture,
    confirmPhotos,
    changeParameter,
    setCamera,
    changeSketch,
    adoptSketch,
  } = model;
  if (!panel) return null;
  const extended = draft.controls?.find((c) => c.id === panel?.id);
  const parameter = draft.parameters.find((p) => p.id === panel?.id);
  const sketches =
    draft.sketches[panel?.scope || "全文"] ??
    draft.materials.find((m) => m.kind === "sketch" && m.scope === panel?.scope)
      ?.strokes ??
    [];
  const photos = [
    ...draft.materials.filter((m) => m.kind === "photo"),
    ...draft.pendingPhotos,
  ];

  const Choice = extended && choiceViews[extended.kind];
  const Capture =
    panel.kind === "scanner" ? ScannerWidget : ScreenCaptureWidget;
  return (
    <WorkBuddyDemoPopover
      key={`${draft.id}:${panel.id || panel.kind + panel.scope}`}
      anchorId={panel.id}
      anchorRoot={anchorRoot}
      id={controlsId}
      preferredWidth={widgetWidths[panel.kind]}
      onClose={() => {
        setPanel(null);
        setDrawing(false);
      }}
    >
      <AuxiliaryPanel
        title={uiText(
          extended?.kind === "color"
            ? colorTitle(extended.role || "主题色")
            : extended
              ? controlLabel(extended.kind, language)
              : panel.kind === "scanner" || panel.kind === "capture"
                ? controlLabel(panel.kind, language)
                : panel.kind === "photo"
                  ? "图片选择"
                  : panel.kind === "color"
                    ? panel.role === "颜色"
                      ? "颜色选择"
                      : colorTitle(panel.role || "主题色")
                    : panel.kind === "duration"
                      ? "演讲时长"
                      : panel.kind === "document"
                        ? "参考资料"
                        : panel.scope === "全文"
                          ? "布局草图"
                          : `${panel.scope} · ${uiText("布局草图")}`,
        )}
        busy={busy && panel.kind !== "scanner" && panel.kind !== "capture"}
        onClose={() => {
          setPanel(null);
          setDrawing(false);
        }}
      >
        {extended && Choice && (
          <Choice
            binding={extended}
            owner={draft.id}
            language={language}
            onEvent={controlEvent}
            definition={definition(extended.kind)}
            onChooseFile={() => pick("document", panel.scope)}
            materials={draft.materials.filter((m) => m.kind === "document")}
          />
        )}
        {(panel.kind === "scanner" || panel.kind === "capture") && (
          <Capture
            key={draft.id + panel.kind + language}
            items={draft.captures || []}
            language={language}
            onBusy={setBusy}
            onAdd={(item) => addCapture(draft.id, item)}
            onRemove={(id) => removeCapture(draft.id, id)}
            onConfirm={() =>
              confirmCapture(
                draft.id,
                panel.kind === "scanner" ? "scanner" : "capture",
              )
            }
          />
        )}
        {panel.kind === "color" && (
          <ColorWidget
            key={panel.id}
            label={panel.role || "主题色"}
            value={parameter?.value || extended?.value[0] || "#5267B2"}
            onChange={changeParameter}
            onActive={setDrawing}
            onDone={() => setPanel(null)}
          />
        )}
        {panel.kind === "duration" && (
          <DurationWidget
            value={parameter?.value || extended?.value[0] || ""}
            onChange={changeParameter}
            onDone={() => setPanel(null)}
          />
        )}
        {panel.kind === "photo" && (
          <ImageWidget
            onChoose={() => pick("photo", panel.scope)}
            onCapture={() => setCamera({ owner: draft.id, scope: panel.scope })}
            onDone={() => confirmPhotos(draft.id)}
          >
            {photos.map((m) => materialTile(m, true))}
          </ImageWidget>
        )}
        {panel.kind === "sketch" && (
          <SketchWidget
            key={draft.id + panel.scope}
            strokes={sketches}
            onChange={changeSketch}
            onActive={setDrawing}
            onAdopt={() => void adoptSketch()}
            busy={busy}
          />
        )}
        {panel.kind === "document" && !extended && (
          <DocumentWidget onChoose={() => pick("document", panel.scope)}>
            {draft.materials
              .filter((m) => m.kind === "document")
              .map((m) => materialTile(m))}
          </DocumentWidget>
        )}
      </AuxiliaryPanel>
    </WorkBuddyDemoPopover>
  );
}
