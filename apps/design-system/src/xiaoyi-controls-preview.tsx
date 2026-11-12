import { useEffect, useId, useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import {
  definition,
  sampleReference,
} from "../../../packages/core/workbuddy-demo-controls";
import { demoPolishActions } from "../../../packages/core/workbuddy-demo-polish";
import {
  xiaoyiControls,
  WidgetProvider,
  AuxiliaryPanel,
  InlineChip,
  DurationWidget,
  ColorWidget,
  FontWidget,
  PaletteWidget,
  DocumentWidget,
  ImageWidget,
  ScannerWidget,
  SketchWidget,
  ExpertWidget,
  SkillsWidget,
  ConnectorsWidget,
  FormatsWidget,
  PolishWidget,
  ScreenCaptureWidget,
  CaptureTile,
  CameraCapture,
  type CaptureMaterial,
  type ChoiceEvent,
  type WidgetKind,
} from "./xiaoyi-controls";

type PreviewEnvironment = {
  language: string;
  translate: (text: string) => string;
};
type Scenario = "default" | "recommended" | "preparing" | "disabled";
const choiceWidgets = {
  font: FontWidget,
  palette: PaletteWidget,
  expert: ExpertWidget,
  skills: SkillsWidget,
  connectors: ConnectorsWidget,
  formats: FormatsWidget,
};
const choiceSeeds: Partial<Record<WidgetKind, string>> = {
  font: "sans-serif",
  palette: "calm",
  document: "product-brief",
  expert: "ppt",
  skills: "ppt-implement",
  connectors: "ima",
  formats: "ppt",
};
const sampleImage = new Blob(
  [
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#e8ecfc"/><rect x="40" y="40" width="560" height="280" rx="18" fill="white"/><path d="M85 124H555M85 180H480M85 236H395" stroke="#6266df" stroke-width="9"/></svg>`,
  ],
  { type: "image/svg+xml" },
);

function LocalImage({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return <img src={url || undefined} alt={file.name} />;
}

function WidgetExample({
  kind,
  scenario,
  language,
  translate,
}: { kind: WidgetKind; scenario: Scenario } & PreviewEnvironment) {
  const owner = useId();
  const panelId = useId();
  const en = language === "en";
  const t = (zh: string, english: string) => (en ? english : zh);
  const def = definition(kind);
  const title = t(def.zh, def.en);
  const preparing = scenario === "preparing";
  const disabled = scenario === "disabled";
  const [open, setOpen] = useState(!preparing && !disabled);
  const [status, setStatus] = useState("");
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState("10");
  const [color, setColor] = useState("#356FE4");
  const [choices, setChoices] = useState<string[]>(() => {
    const seed = choiceSeeds[kind];
    return scenario === "recommended" && def.options.length
      ? [def.options.find((o) => o.id === seed)?.id || def.options[0].id]
      : [];
  });
  const [manual, setManual] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [confirmedPhotos, setConfirmedPhotos] = useState<File[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [strokes, setStrokes] = useState<number[][][]>([]);
  const [confirmedSketch, setConfirmedSketch] = useState<number[][][]>([]);
  const [captures, setCaptures] = useState<CaptureMaterial[]>([]);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [polish, setPolish] = useState({
    active: "",
    applied: false,
    failed: "",
  });
  const polishTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const picker = useRef<HTMLInputElement>(null);
  useEffect(() => () => clearTimeout(polishTimer.current), []);

  const origin = manual
    ? "manual"
    : scenario === "recommended" || preparing
      ? "recommended"
      : "explicit";
  const binding = { id: owner, kind, origin, value: choices } as const;
  const confirm = (message = t("已确认", "Confirmed")) => {
    setStatus(message);
    setOpen(false);
  };
  function onChoice(event: ChoiceEvent) {
    if (event.owner !== owner || event.id !== owner) return;
    if (event.type === "close") {
      confirm();
      return;
    }
    if (event.value) {
      setChoices(event.value);
      setManual(true);
    }
  }
  const pick = () => picker.current?.click();
  const choiceProps = {
    binding,
    definition: def,
    owner,
    language,
    onEvent: onChoice,
  };
  const choiceKind = kind as keyof typeof choiceWidgets;
  const Choices = choiceWidgets[choiceKind];
  const Capture = kind === "scanner" ? ScannerWidget : ScreenCaptureWidget;
  const isCapture = kind === "scanner" || kind === "capture";
  const selectedText = choices
    .map((value) => {
      const option = def.options.find((o) => o.id === value);
      return option ? t(option.zh, option.en) : value;
    })
    .join(" / ");
  const chipLabel =
    kind === "duration"
      ? `${duration} ${t("分钟", "min")}`
      : kind === "color"
        ? color
        : selectedText || title;
  const prompt = t(
    "帮我整理产品发布计划。介绍受众和优势，然后然后说明下一步安排。",
    "Plan the product launch. Explain the audience and benefits, then then outline the next steps.",
  );
  const revised = t(
    "整理产品发布计划，涵盖目标受众、产品优势和下一步安排。",
    "Outline the launch plan, including the target audience, product benefits, and next steps.",
  );
  const previewFiles =
    kind === "document" && choices.includes("product-brief")
      ? [
          new File([sampleReference], "Product introduction.md", {
            type: "text/markdown",
          }),
          ...files,
        ]
      : files;

  return (
    <div
      className="widget-example input-controls-theme"
      ref={setPortalRoot}
      data-widget={kind}
    >
      <WidgetProvider
        language={language}
        translate={translate}
        assetBase="."
        portalRoot={portalRoot}
      >
        {kind === "polish" ? (
          <div className="widget-polish-preview">
            <p>{polish.applied ? revised : prompt}</p>
            <PolishWidget
              actions={polish.applied ? [] : demoPolishActions(prompt)}
              binding={owner}
              activeAction={polish.active}
              failedAction={polish.failed}
              disabled={disabled || preparing}
              error={
                polish.failed
                  ? t(
                      "示例润色失败，原文已保留。",
                      "The sample failed. The original is preserved.",
                    )
                  : ""
              }
              onCancel={() => {
                clearTimeout(polishTimer.current);
                setPolish({ active: "", applied: false, failed: "" });
                setStatus(t("已停止", "Stopped"));
              }}
              onAction={(id) => {
                setPolish({ active: id, applied: false, failed: "" });
                polishTimer.current = setTimeout(
                  () => setPolish({ active: "", applied: true, failed: "" }),
                  1200,
                );
              }}
              restore={
                polish.applied
                  ? () => setPolish({ active: "", applied: false, failed: "" })
                  : undefined
              }
            />
            <small>{t("使用本地示例文字", "Uses local sample text")}</small>
          </div>
        ) : (
          <>
            <div className="widget-example-anchor wb-sentence-composer">
              {dismissed ? (
                <button onClick={() => setDismissed(false)}>
                  {t("恢复示例建议", "Restore sample suggestion")}
                </button>
              ) : (
                <InlineChip
                  token={{
                    id: owner,
                    kind,
                    role: title,
                    label: chipLabel,
                    value: kind === "color" ? color : "",
                    phrase: "",
                    origin,
                    preparing,
                    animate: origin === "recommended" && !preparing,
                    sweepKey: owner,
                    removable: origin === "recommended",
                    iconSrc:
                      kind === "color"
                        ? undefined
                        : `./assets/xiaoyi-work/design-inline-${kind}.svg`,
                    recommendationIconSrc:
                      "./assets/xiaoyi-work/design-inline-sparkles.svg",
                  }}
                  expanded={open}
                  controlsId={panelId}
                  disabled={disabled}
                  onOpen={() => setOpen((v) => !v)}
                  onRemove={() => {
                    setDismissed(true);
                    setChoices([]);
                    setOpen(false);
                    setStatus(t("已移除建议", "Suggestion removed"));
                  }}
                />
              )}
            </div>
            {open && !dismissed && (
              <div
                className="demo-widget-wrap widget-example-panel"
                id={panelId}
                style={{
                  width: Math.min(
                    432,
                    xiaoyiControls.find((c) => c.kind === kind)!.width,
                  ),
                }}
              >
                <AuxiliaryPanel title={title} onClose={() => setOpen(false)}>
                  {kind === "duration" && (
                    <DurationWidget
                      value={duration}
                      onChange={(v) => {
                        setDuration(v);
                        setManual(true);
                      }}
                      onDone={() => confirm()}
                    />
                  )}
                  {kind === "color" && (
                    <ColorWidget
                      value={color}
                      label={title}
                      onActive={() => {}}
                      onChange={(v) => {
                        setColor(v);
                        setManual(true);
                      }}
                      onDone={() => confirm()}
                    />
                  )}
                  {Choices && <Choices {...choiceProps} />}
                  {kind === "document" && (
                    <DocumentWidget
                      choices={{
                        ...choiceProps,
                        materials: files.map((f) => ({
                          id: f.name,
                          name: f.name,
                        })),
                      }}
                      onChoose={pick}
                    />
                  )}
                  {kind === "photo" && (
                    <ImageWidget
                      onChoose={pick}
                      onCapture={() => setCameraOpen(true)}
                      onDone={() => {
                        setConfirmedPhotos((old) => [...old, ...files]);
                        setFiles([]);
                        confirm();
                      }}
                    >
                      {[...confirmedPhotos, ...files].map((file, i) => (
                        <div
                          className="demo-material"
                          key={`${file.name}-${i}`}
                        >
                          <div>
                            <LocalImage file={file} />
                            <span>{file.name}</span>
                          </div>
                          <button
                            className="demo-remove"
                            aria-label={`${t("移除", "Remove")} ${file.name}`}
                            onClick={() => {
                              if (i < confirmedPhotos.length)
                                setConfirmedPhotos((old) =>
                                  old.filter((_, j) => i !== j),
                                );
                              else
                                setFiles((old) =>
                                  old.filter(
                                    (_, j) => j !== i - confirmedPhotos.length,
                                  ),
                                );
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </ImageWidget>
                  )}
                  {kind === "sketch" && (
                    <SketchWidget
                      strokes={strokes}
                      onChange={setStrokes}
                      onActive={() => {}}
                      onAdopt={() => {
                        setConfirmedSketch(strokes);
                        confirm();
                      }}
                    />
                  )}
                  {isCapture && (
                    <>
                      <Capture
                        items={captures}
                        language={language}
                        onBusy={setCaptureBusy}
                        onAdd={(item) => setCaptures((old) => [...old, item])}
                        onRemove={(id) =>
                          setCaptures((old) =>
                            old.filter((item) => item.id !== id),
                          )
                        }
                        onConfirm={() => {
                          setCaptures((old) =>
                            old.map((item) => ({ ...item, confirmed: true })),
                          );
                          confirm();
                        }}
                      />
                      {!captureBusy && !captures.length && (
                        <button
                          type="button"
                          className="widget-sample"
                          onClick={() =>
                            setCaptures([
                              {
                                id: crypto.randomUUID(),
                                kind:
                                  kind === "scanner" ? "scanner" : "screenshot",
                                name: "Sample reference.svg",
                                size: sampleImage.size,
                                blob: sampleImage,
                                confirmed: false,
                              },
                            ])
                          }
                        >
                          {t("使用示例图片", "Use a sample image")}
                        </button>
                      )}
                    </>
                  )}
                </AuxiliaryPanel>
              </div>
            )}
            {(kind === "photo" || kind === "document") && (
              <input
                type="file"
                hidden
                multiple
                ref={picker}
                accept={
                  kind === "photo"
                    ? "image/png,image/jpeg,image/webp"
                    : ".pdf,.txt,.md"
                }
                onChange={(e) => {
                  const incoming = Array.from(e.target.files || []);
                  setFiles((old) => [...old, ...incoming]);
                  e.target.value = "";
                  if (kind === "document" && incoming.length) {
                    setChoices([]);
                    setManual(true);
                    setStatus(t("文件已添加", "Files added"));
                  }
                }}
              />
            )}
            {cameraOpen && (
              <CameraCapture
                onClose={() => setCameraOpen(false)}
                onError={(message) => setStatus(translate(message))}
                onCapture={(file) => setFiles((old) => [...old, file])}
              />
            )}
            {status && (
              <p className="widget-example-status" role="status">
                {status}
              </p>
            )}
            {kind === "document" && previewFiles.length > 0 && (
              <ul className="widget-example-files">
                {previewFiles.map((f, i) => (
                  <li key={i}>
                    {f.name}
                    <button
                      aria-label={`${t("移除", "Remove")} ${f.name}`}
                      onClick={() => {
                        if (choices.includes("product-brief") && i === 0)
                          setChoices([]);
                        else
                          setFiles((old) => old.filter((item) => item !== f));
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {kind === "photo" && confirmedPhotos.length > 0 && (
              <p className="widget-example-files">
                {confirmedPhotos.map((f) => f.name).join(" · ")}
              </p>
            )}
            {kind === "sketch" && confirmedSketch.length > 0 && (
              <svg
                className="widget-sketch-result"
                viewBox="0 0 320 180"
                aria-label={t("已确认的草图", "Confirmed sketch")}
              >
                {confirmedSketch.map((line, i) => (
                  <polyline
                    key={i}
                    points={line
                      .map(([x, y]) => `${x * 320},${y * 180}`)
                      .join(" ")}
                    fill="none"
                    stroke="#6266df"
                    strokeWidth="2"
                  />
                ))}
              </svg>
            )}
            {isCapture && (
              <div className="demo-attachments">
                {captures
                  .filter((item) => item.confirmed)
                  .map((item) => (
                    <CaptureTile
                      key={item.id}
                      compact
                      item={item}
                      onRemove={() =>
                        setCaptures((old) =>
                          old.filter((c) => c.id !== item.id),
                        )
                      }
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </WidgetProvider>
    </div>
  );
}

export function XiaoyiControlsPreview({
  initialWidget,
  ...env
}: { initialWidget: string | null } & PreviewEnvironment) {
  const en = env.language === "en";
  const t = (zh: string, english: string) => (en ? english : zh);
  const [kind, setKind] = useState<WidgetKind>(
    () =>
      xiaoyiControls.find((c) => c.kind === initialWidget)?.kind || "duration",
  );
  const [scenario, setScenario] = useState<Scenario>("default");
  const [reset, setReset] = useState(0);
  const [compare, setCompare] = useState(false);
  const selected = xiaoyiControls.find((c) => c.kind === kind)!;
  function choose(next: WidgetKind) {
    setKind(next);
    setScenario("default");
    const url = new URL(location.href);
    url.searchParams.set("widget", next);
    history.replaceState(null, "", url);
  }
  return (
    <main className="widget-library">
      <header className="widget-library-header">
        <div>
          <h1>{t("小艺Work控件库", "Xiaoyi Work control library")}</h1>
          <p>
            {t(
              "选择一个控件，直接试用它的桌面交互。",
              "Choose a control to try its desktop interactions.",
            )}
          </p>
        </div>
        <a href={`?widget=${kind}&language=${en ? "zh" : "en"}`}>
          {en ? "中文" : "English"}
        </a>
        <a href="./workbuddy-demo.html">
          {t("打开完整演示", "Open the full demo")}
        </a>
      </header>
      <div className="widget-library-body">
        <nav aria-label={t("输入控件", "Input controls")}>
          {xiaoyiControls.map((c) => (
            <button
              key={c.kind}
              aria-current={kind === c.kind ? "page" : undefined}
              onClick={() => choose(c.kind)}
            >
              {t(c.zh, c.en)}
            </button>
          ))}
        </nav>
        <section className="widget-library-content">
          <header className="widget-library-tools">
            <h2>{t(selected.zh, selected.en)}</h2>
            <label>
              {t("状态", "State")}{" "}
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as Scenario)}
              >
                <option value="default">{t("默认", "Default")}</option>
                {kind !== "polish" && (
                  <>
                    <option value="recommended">
                      {t("推荐", "Recommended")}
                    </option>
                    <option value="preparing">
                      {t("建议加载中", "Preparing suggestion")}
                    </option>
                  </>
                )}
                <option value="disabled">{t("禁用", "Disabled")}</option>
              </select>
            </label>
            <button onClick={() => setReset((n) => n + 1)}>
              {t("重置", "Reset")}
            </button>
            <button
              aria-pressed={compare}
              onClick={() => setCompare((v) => !v)}
            >
              {t("并排试用两个实例", "Try two instances")}
            </button>
          </header>
          <div className="widget-library-examples">
            <WidgetExample
              key={`${kind}:${scenario}:${reset}:a`}
              kind={kind}
              scenario={scenario}
              {...env}
            />
            {compare && (
              <WidgetExample
                key={`${kind}:${scenario}:${reset}:b`}
                kind={kind}
                scenario={scenario}
                {...env}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
