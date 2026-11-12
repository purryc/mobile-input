import { useId, useRef, type ReactNode } from "react";
import {
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  FileText,
  Folder,
  ImagePlus,
  LayoutTemplate,
  Mic,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  ComposerFrame as AgentComposer,
  CaptureTile,
  renderInlineChip,
} from "../../../packages/input-controls/src";
import {
  demoNativeParameters,
  demoControlAnchor,
  type DemoMaterial,
} from "../../../packages/core/workbuddy-demo-state";
import {
  controlDefinitions,
  controlLabel,
  valueLabel,
} from "../../../packages/core/workbuddy-demo-controls";
import { initialWbInput } from "../../../packages/core/workbuddy-input";
import { SentenceComposer } from "./sentence-composer";
import { uiText } from "./i18n";
import {
  ControlsIndex,
  ControlIcon,
  controlOptionArtwork,
} from "./workbuddy-demo-controls";
import { MaterialImage } from "./workbuddy-demo-material-views";
import { WorkbuddyWidgetHost } from "./workbuddy-demo-widget-host";
import type { ReadyDemoController } from "./workbuddy-demo-controller";
const noInput = initialWbInput();
export function WorkbuddyDemoComposer({
  model,
}: {
  model: ReadyDemoController;
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
    removeCapture,
    changeParameter,
    setCamera,
    changeSketch,
    adoptSketch,
    polish,
    addMenu,
    setAddMenu,
    afterSpeech,
    openPanel,
    invokeControl,
    drawing,
    phase,
    toggleVoice,
    sent,
    send,
    stopForTyping,
    area,
    recommendations,
    removeControl,
    openParameter,
    showDebugControls,
    createExample,
    setPreview,
    removeMaterial,
    report,
    editText,
  } = model;
  const anchorRoot = useRef<HTMLDivElement>(null);
  const controlsId = useId();
  const pendingSketch = Object.entries(draft.sketches).find(
    ([, lines]) => lines.length,
  );
  function materialTile(material: DemoMaterial, photoPanel = false): ReactNode {
    return (
      <div
        className="demo-material"
        key={material.id}
        data-pending={draft!.pendingPhotos.some((p) => p.id === material.id)}
      >
        <button
          title={material.name}
          aria-label={uiText("查看 ") + material.name}
          onClick={() => {
            if (material.kind === "sketch")
              openPanel({ kind: "sketch", scope: material.scope || "全文" });
            else if (material.kind === "photo" && !photoPanel)
              openPanel({ kind: "photo", scope: material.scope || "全文" });
            else setPreview(material);
          }}
        >
          {material.kind === "document" ? (
            <FileText size={25} />
          ) : (
            <MaterialImage material={material} />
          )}
          <span>{material.name}</span>
        </button>
        <button
          className="demo-remove"
          aria-label={uiText("移除 ") + material.name}
          onClick={() => removeMaterial(material.id)}
        >
          <X size={14} />
        </button>
      </div>
    );
  }
  return (
    <div ref={anchorRoot} className="demo-input-stack deck-compose-desktop">
      {showDebugControls && (
        <ControlsIndex
          language={language}
          onOpen={invokeControl}
          onExample={createExample}
        />
      )}
      <WorkbuddyWidgetHost
        model={model}
        anchorRoot={anchorRoot}
        controlsId={controlsId}
        materialTile={materialTile}
      />
      <AgentComposer
        className="deck-composer demo-composer"
        label={uiText("小艺Work 任务输入区")}
        afterContent={polish.row}
        footer={
          <>
            <div className="demo-add">
              <button
                aria-label={uiText("添加内容")}
                aria-expanded={addMenu}
                onClick={() => setAddMenu(!addMenu)}
                disabled={busy || drawing}
              >
                <Plus size={20} />
              </button>
              {addMenu && (
                <div className="demo-add-menu">
                  <button
                    onClick={() => {
                      setAddMenu(false);
                      pick("document");
                    }}
                  >
                    <FileText size={17} />
                    {uiText("参考文件")}
                  </button>
                  <button
                    onClick={() => openPanel({ kind: "photo", scope: "全文" })}
                  >
                    <ImagePlus size={17} />
                    {uiText("图片")}
                  </button>
                  <button
                    onClick={() => openPanel({ kind: "sketch", scope: "全文" })}
                  >
                    <LayoutTemplate size={17} />
                    {uiText("布局草图")}
                  </button>
                  {controlDefinitions
                    .filter(
                      (c) => !["document", "photo", "sketch"].includes(c.kind),
                    )
                    .map((c) => (
                      <button
                        key={c.kind}
                        onClick={() => invokeControl(c.kind)}
                      >
                        <ControlIcon kind={c.kind} />
                        {controlLabel(c.kind, language)}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <span className="demo-footer-space" />
            <button
              className="demo-voice"
              aria-label={uiText(
                phase === "idle" ? "开始语音输入" : "停止语音输入",
              )}
              aria-pressed={phase !== "idle"}
              data-phase={phase}
              disabled={busy || drawing || phase === "stopping"}
              onClick={toggleVoice}
            >
              <Mic size={20} />
            </button>
            <button
              className="demo-send"
              aria-label={uiText("发送请求")}
              data-accepted={sent}
              disabled={
                busy ||
                polish.pending ||
                draft.requests.some((r) => r.status === "running") ||
                drawing ||
                !draft.text.trim() ||
                phase !== "idle"
              }
              onClick={send}
            >
              <ArrowUp size={20} />
            </button>
          </>
        }
      >
        {(draft.materials.length > 0 ||
          draft.captures?.some((c) => c.confirmed)) && (
          <div className="demo-attachments" aria-label={uiText("已确认的材料")}>
            {draft.materials.map((m) => materialTile(m))}
            {draft.captures
              ?.filter((c) => c.confirmed)
              .map((c) => (
                <CaptureTile
                  key={draft.id + c.id}
                  compact
                  item={c}
                  onRemove={() => removeCapture(draft.id, c.id)}
                />
              ))}
          </div>
        )}
        <div
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              if (!busy && !drawing && phase === "idle") send();
            }
          }}
        >
          <SentenceComposer
            ref={area}
            label={uiText("小艺Work 任务输入")}
            preserveSourceClipboard
            inputMode="text"
            text={draft.text}
            parameters={[]}
            input={noInput}
            files={[]}
            active={null}
            disabled={busy}
            placeholder={uiText("今天帮你做些什么？")}
            onFocus={stopForTyping}
            onSelect={polish.select}
            onChange={(text) => {
              editText(draft.id, text);
            }}
            onOpen={() => {}}
            live={{
              controlsId,
              containedRemove: true,
              renderChip: (token, events) =>
                renderInlineChip({
                  ...events,
                  token,
                  expanded: panel?.id === token.id,
                  controlsId,
                  disabled: busy,
                  language,
                  uiText,
                  assetBase: ".",
                }),
              parameters: [
                ...demoNativeParameters(draft).map((parameter) => {
                  const file =
                    parameter.kind === "document"
                      ? draft.materials.find(
                          (material) =>
                            material.kind === "document" &&
                            material.scope === parameter.scope,
                        )
                      : undefined;
                  return {
                    ...(file ? { ...parameter, label: file.name } : parameter),
                    origin: "explicit" as const,
                    iconSrc:
                      parameter.kind === "color"
                        ? undefined
                        : "./assets/xiaoyi-work/design-inline-" +
                          parameter.kind +
                          ".svg",
                  };
                }),
                ...[
                  ...(draft.controls || []).filter(
                    (c) =>
                      !(
                        c.detached &&
                        (c.kind === "capture" || c.kind === "scanner")
                      ),
                  ),
                  ...recommendations.loading,
                ].map(
                  (c) => ({
                    preparing: recommendations.loading.includes(c),
                    id: c.id,
                    kind: c.kind,
                    role: c.role || controlLabel(c.kind, language),
                    scope: c.scope || "全文",
                    start: c.detached
                      ? draft.text.length
                      : c.presentation === "append"
                        ? demoControlAnchor(c, draft)
                        : c.start,
                    end: c.detached
                      ? draft.text.length
                      : c.presentation === "append"
                        ? demoControlAnchor(c, draft)
                        : c.end,
                    phrase:
                      c.detached || c.presentation === "append" ? "" : c.phrase,
                    label: c.value.length
                      ? valueLabel(c, language) +
                        (c.kind === "duration" && c.presentation === "append"
                          ? language === "en"
                            ? " minutes"
                            : "分钟"
                          : "")
                      : c.origin === "explicit"
                        ? c.phrase
                        : controlLabel(c.kind, language),
                    value: c.value[0] || "",
                    manual: c.origin === "manual",
                    origin: c.origin,
                    removable: c.reason === "related-intent",
                    animate: c.origin === "recommended" && !c.seen,
                    sweepKey: draft.id + ":" + c.id + ":" + c.revision,
                    iconSrc:
                      c.kind === "color" || c.kind === "polish"
                        ? undefined
                        : ((c.kind === "expert" || c.kind === "skills") &&
                          c.value.length === 1
                            ? controlOptionArtwork(c.kind, c.value[0])
                            : undefined) ||
                          "./assets/xiaoyi-work/design-inline-" +
                            c.kind +
                            ".svg",
                    recommendationIconSrc:
                      "./assets/xiaoyi-work/design-inline-sparkles.svg",
                  }),
                ),
              ].sort((a, b) => a.start - b.start),
              remove: removeControl,
              active: panel?.id || null,
              open: openParameter,
            }}
          />
        </div>
      </AgentComposer>
      <div className="wb-composer-options">
        <button onClick={() => pick("document")}>
          <Folder size={16} />
          {uiText("选择工作空间")}
          <ChevronDown size={12} />
        </button>
        <button
          aria-disabled="true"
          onClick={() =>
            report("发送后使用 Gemini 生成成果，材料仅用于当前任务。")
          }
        >
          <ShieldCheck size={16} />
          {uiText("默认权限")}
          <ChevronDown size={12} />
        </button>
      </div>
      {
        <div className="demo-pending">
          {draft.captures?.some((c) => !c.confirmed) && (
            <button
              onClick={() =>
                invokeControl(
                  draft.captures!.find((c) => !c.confirmed)!.kind === "scanner"
                    ? "scanner"
                    : "capture",
                )
              }
            >
              {language === "en"
                ? "Capture awaiting confirmation"
                : "扫描或屏幕材料待确认"}
            </button>
          )}
          {draft.pendingPhotos.length > 0 && (
            <button onClick={() => openPanel({ kind: "photo", scope: "全文" })}>
              {draft.pendingPhotos.length} {uiText("张图片待确认")}
              <ChevronLeft size={13} style={{ transform: "rotate(180deg)" }} />
            </button>
          )}
          {pendingSketch && (
            <button
              onClick={() =>
                openPanel({ kind: "sketch", scope: pendingSketch[0] })
              }
            >
              {uiText("布局草图待确认")}
              <ChevronLeft size={13} style={{ transform: "rotate(180deg)" }} />
            </button>
          )}
        </div>
      }
    </div>
  );
}
