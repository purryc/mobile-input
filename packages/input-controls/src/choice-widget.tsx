import { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  FileText,
  Sparkles,
  UserRound,
  Wrench,
  Link,
  Palette,
  Type,
  Timer,
  ScanLine,
  Monitor,
  Image,
  Pencil,
  WandSparkles,
  Shapes,
  Search,
  Plus,
} from "lucide-react";
import type {
  WidgetKind as DemoControlKind,
  ChoiceBinding as DemoControlBinding,
  ChoiceDefinition,
  ChoiceEvent as ControlEvent,
} from "./types";
import { useWidgetEnvironment, assetUrl } from "./environment";
import { DocumentFileList } from "./document-file-list";
const icons = {
  duration: Timer,
  color: Palette,
  font: Type,
  palette: Palette,
  document: FileText,
  photo: Image,
  scanner: ScanLine,
  sketch: Pencil,
  expert: UserRound,
  skills: Wrench,
  connectors: Link,
  formats: Shapes,
  capture: Monitor,
};
// Resolve by stable demo kind:id; unmapped choices retain their category icon.
// Artwork decorates the existing demo roles; it does not identify a connected expert.
const optionArtwork: Record<string, string> = {
  "expert:ppt": "expert-design",
  "expert:writer": "expert-document",
  "expert:sales": "expert-workspace",
  "expert:finance": "expert-research",
  "expert:procurement": "expert-senior",
  "expert:delivery": "expert-fullstack",
  "skills:data": "skill-excel",
  "skills:deep-research": "skill-web",
  "skills:ppt-implement": "skill-ppt",
  "skills:document-skills": "skill-word",
  "skills:product-management": "skill-word",
  "skills:demand-mining": "skill-web",
  "skills:seo-ops": "skill-excel",
  "skills:wechat-miniapp": "skill-ppt",
  "skills:ecom-copywriter": "skill-word",
  "skills:ecomseer-tiktok": "skill-excel",
  "skills:cn-ecom-search": "skill-web",
  "skills:x-longform-post": "skill-word",
  "skills:content-factory": "skill-ppt",
  "skills:content-dist": "skill-web",
  "skills:startup-val": "skill-excel",
  "skills:market-research": "skill-web",
  "skills:startup-learn": "skill-word",
  "skills:wechat-publisher": "skill-ppt",
  "skills:wechat-article": "skill-word",
  "skills:find-skills": "skill-web",
  "connectors:tencent-docs": "connector-tencent",
  "connectors:feishu": "connector-feishu",
  "connectors:wecom": "connector-wecom",
  "connectors:ima": "connector-ima",
};
export function controlOptionArtwork(
  kind: DemoControlKind,
  id: string,
): string | undefined {
  const artwork = optionArtwork[kind + ":" + id];
  return artwork
    ? "./assets/xiaoyi-work/design-" + artwork + ".png"
    : undefined;
}
export function ControlIcon({
  kind,
  size = 18,
}: {
  kind: DemoControlKind;
  size?: number;
}) {
  const Icon = icons[kind];
  return <Icon size={size} />;
}
/** Same choice component used by the composer and the all-controls showcase. */
export function ChoiceWidget({
  binding,
  owner,
  language,
  onEvent,
  onChooseFile,
  showDone = true,
  onRemoveMaterial,
  onPreviewMaterial,
  materials = [],
  definition,
}: {
  definition: ChoiceDefinition;
  binding: DemoControlBinding;
  owner: string;
  language: string;
  onEvent: (e: ControlEvent) => void;
  showDone?: boolean;
  onChooseFile?: () => void;
  onRemoveMaterial?: (id: string) => void;
  onPreviewMaterial?: (id: string) => void;
  materials?: { id: string; name: string }[];
}) {
  const { assetBase } = useWidgetEnvironment();
  const searchInput = useRef<HTMLInputElement>(null);
  const chooseButton = useRef<HTMLButtonElement>(null);
  const badgeId = useId();
  const [query, setQuery] = useState("");
  const en = language.startsWith("en"),
    d = definition,
    t = (zh: string, enText: string) => (en ? enText : zh);
  const emptyDocument = binding.kind === "document" && !d.options.length && !materials.length;
  useEffect(() => { if (emptyDocument) setQuery(""); }, [emptyDocument]);
  const options = d.options.filter((o) =>
    (o.zh + " " + o.en).toLowerCase().includes(query.toLowerCase()),
  );
  const matchingMaterials = binding.kind === "document"
    ? materials.filter((material) => material.name.toLowerCase().includes(query.toLowerCase()))
    : [];
  const selected = options.filter((o) => binding.value.includes(o.id)),
    rest = options.filter((o) => !binding.value.includes(o.id));
  const adoptedDocuments = binding.kind === "document" && onRemoveMaterial
    ? [...selected.map(o => ({id: o.id, name: en ? o.en : o.zh})), ...matchingMaterials]
    : [];
  const capability = ["expert", "skills", "connectors"].includes(binding.kind);
  const change = (id: string) =>
    onEvent({
      type: "change",
      owner,
      id: binding.id,
      value: d.multiple
        ? binding.value.includes(id)
          ? binding.value.filter((x) => x !== id)
          : [...binding.value, id]
        : [id],
    });
  const cards = (items: typeof options) => (
    <div
      className={
        "ic-demo-control-options " +
        (capability
          ? "ic-demo-control-grid"
          : binding.kind === "formats"
            ? "ic-demo-format-options"
            : "")
      }
    >
      {items.map((o) => (
        <button
          type="button"
          key={o.id}
          className="ic-demo-control-option"
          aria-label={en ? o.en : o.zh}
          aria-describedby={
            capability &&
            binding.origin === "recommended" &&
            binding.value.includes(o.id)
              ? `recommendation-${badgeId}-${o.id}`
              : undefined
          }
          aria-pressed={binding.value.includes(o.id)}
          onClick={() => change(o.id)}
        >
          {capability ? (
            <span className="ic-demo-choice-identity">
              {optionArtwork[binding.kind + ":" + o.id] ? (
                <img
                  className="ic-demo-choice-art"
                  src={assetUrl(
                    assetBase,
                    controlOptionArtwork(binding.kind, o.id)!,
                  )}
                  alt=""
                />
              ) : (
                <ControlIcon kind={binding.kind} size={24} />
              )}
              {binding.origin === "recommended" &&
                binding.value.includes(o.id) && (
                  <span
                    className="ic-demo-recommendation-badge"
                    id={`recommendation-${badgeId}-${o.id}`}
                    title={t("推荐", "Recommended")}
                  >
                    <Sparkles />
                    <span className={en ? "sr-only" : undefined}>
                      {t("推荐", "Recommended")}
                    </span>
                  </span>
                )}
              <span className="ic-demo-choice-marker">
                {binding.value.includes(o.id) ? (
                  <Check size={16} />
                ) : (
                  <Plus size={14} />
                )}
              </span>
            </span>
          ) : binding.kind === "formats" ? (
            <img
              className="ic-demo-format-icon"
              src={assetUrl(
                assetBase,
                "assets/xiaoyi-work/design-format-" + o.id + ".png",
              )}
              alt=""
            />
          ) : binding.kind === "palette" ? (
            <span className="ic-demo-palette-swatches">
              {o.swatches?.map((color) => (
                <i key={color} style={{ background: color }} />
              ))}
            </span>
          ) : binding.kind !== "font" ? (
            <ControlIcon kind={binding.kind} />
          ) : null}
          <span
            className="ic-demo-choice-label"
            style={binding.kind === "font" ? { fontFamily: o.id } : undefined}
          >
            <span className="ic-demo-choice-title">{en ? o.en : o.zh}</span>
            {capability && (o.detail || o.detailEn) && (
              <small className="ic-demo-choice-desc">
                {en ? o.detailEn || o.detail : o.detail}
              </small>
            )}
            {binding.kind === "font" && (
              <span className="ic-demo-font-example">
                {t("让想法清晰可见", "Make your ideas clear")}
              </span>
            )}
            {binding.kind === "formats" && <small>.{o.id}</small>}
          </span>
          {!capability && binding.value.includes(o.id) && (
            <Check className="ic-demo-choice-marker" size={16} />
          )}
        </button>
      ))}
    </div>
  );
  return (
    <div className="ic-demo-control-choices" data-kind={binding.kind}>
      {d.demo && (
        <small className="sr-only">
          {t(
            "演示选项 · 不会执行或连接服务",
            "Demo choices · no service is executed or connected",
          )}
        </small>
      )}
      {binding.kind === "formats" && (
        <small className="sr-only">
          {t(
            "选择输出偏好，实际导出由宿主应用提供。",
            "Select output preferences; actual export is provided by the host application.",
          )}
        </small>
      )}
      {binding.kind === "document" && (
        <small className="sr-only">
          {t(
            "已关联的参考资料；仅搜索宿主提供的候选。",
            "Bound reference material; searches only host-provided candidates.",
          )}
        </small>
      )}
      {binding.kind !== "formats" && !emptyDocument && (
        <label className="ic-demo-control-search">
          <Search aria-hidden="true" />
          <span className="sr-only">{t("搜索候选", "Search options")}</span>
          <input
            ref={searchInput}
            aria-label={t("搜索候选", "Search options")}
            placeholder={t("搜索", "Search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      )}
      {!onRemoveMaterial && <DocumentFileList files={matchingMaterials} onPreview={onPreviewMaterial}/>}
      {(capability || ["formats", "font", "palette"].includes(binding.kind)) &&
        cards(options)}
      {!capability &&
        !["formats", "font", "palette"].includes(binding.kind) &&
        (selected.length > 0 || adoptedDocuments.length > 0) && (
          <section>
            <strong>
              {binding.origin === "recommended" && !adoptedDocuments.length ? (
                <>
                  <Sparkles size={14} />
                  {t("推荐采用", "Recommended · in use")}
                </>
              ) : (
                t("当前采用", "In use")
              )}
            </strong>
            {adoptedDocuments.length > 0 && onRemoveMaterial ? (
              <DocumentFileList files={adoptedDocuments} onPreview={onPreviewMaterial} onRemove={id => {
                const last = d.options.length === 0 && materials.length === 1;
                (last ? chooseButton.current : searchInput.current)?.focus({preventScroll: true});
                onRemoveMaterial(id);
              }}/>
            ) : cards(selected)}
          </section>
        )}
      {!capability &&
        !["formats", "font", "palette"].includes(binding.kind) &&
        !!rest.length && (
          <section>
            <strong>{t("其他选项", "Other options")}</strong>
            {cards(rest)}
          </section>
        )}
      {!options.length && !matchingMaterials.length && (binding.kind !== "document" || query.trim()) && (
        <p>
          {t(
            "没有匹配项，试试其他关键词。",
            "No matches. Try another keyword.",
          )}
        </p>
      )}
      {binding.kind === "font" && (
        <p style={{ fontFamily: binding.value[0] || "sans-serif" }}>
          {t(
            "字体预览：让想法清晰呈现。",
            "Font preview: Make your ideas clear.",
          )}
        </p>
      )}
      <div className="ic-demo-choice-footer">
        {binding.kind === "formats" && (
          <span
            title={t(
              "输出偏好，不提供全部格式下载",
              "Output preferences; not all formats can be downloaded",
            )}
          >
            {t(
              `输出偏好 · 已选${binding.value.length}种`,
              `Preferences · ${binding.value.length} selected`,
            )}
          </span>
        )}
        {binding.kind === "document" && onChooseFile && (
          <button
            type="button"
            ref={chooseButton}
            className="ic-demo-local-file"
            onClick={onChooseFile}
          >
            <Plus size={16} />
            {t("选择本地文件", "Choose a local file")}
          </button>
        )}
        {showDone && !emptyDocument && <button
          type="button"
          aria-label={t("完成选择", "Done")}
          title={t("完成选择", "Done")}
          onClick={() => onEvent({ type: "close", owner, id: binding.id })}
        >
          <Check size={24} />
        </button>}
      </div>
    </div>
  );
}

export type ChoiceWidgetProps = import("react").ComponentProps<typeof ChoiceWidget>;
