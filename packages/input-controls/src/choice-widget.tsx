import { useId, useState } from "react";
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
  polish: WandSparkles,
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
  materials = [],
  definition,
}: {
  definition: ChoiceDefinition;
  binding: DemoControlBinding;
  owner: string;
  language: string;
  onEvent: (e: ControlEvent) => void;
  onChooseFile?: () => void;
  materials?: { id: string; name: string }[];
}) {
  const { assetBase } = useWidgetEnvironment();
  const badgeId = useId();
  const [query, setQuery] = useState("");
  const en = language === "en",
    d = definition,
    t = (zh: string, enText: string) => (en ? enText : zh);
  const options = d.options.filter((o) =>
    (o.zh + " " + o.en).toLowerCase().includes(query.toLowerCase()),
  );
  const selected = options.filter((o) => binding.value.includes(o.id)),
    rest = options.filter((o) => !binding.value.includes(o.id));
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
        "demo-control-options " +
        (capability
          ? "demo-control-grid"
          : binding.kind === "formats"
            ? "demo-format-options"
            : "")
      }
    >
      {items.map((o) => (
        <button
          type="button"
          key={o.id}
          className="demo-control-option"
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
            <span className="demo-choice-identity">
              {optionArtwork[binding.kind + ":" + o.id] ? (
                <img
                  className="demo-choice-art"
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
                    className="demo-recommendation-badge"
                    id={`recommendation-${badgeId}-${o.id}`}
                    title={t("推荐", "Recommended")}
                  >
                    <Sparkles />
                    <span className={en ? "sr-only" : undefined}>
                      {t("推荐", "Recommended")}
                    </span>
                  </span>
                )}
              <span className="demo-choice-marker">
                {binding.value.includes(o.id) ? (
                  <Check size={16} />
                ) : (
                  <Plus size={14} />
                )}
              </span>
            </span>
          ) : binding.kind === "formats" ? (
            <img
              className="demo-format-icon"
              src={assetUrl(
                assetBase,
                "assets/xiaoyi-work/design-format-" + o.id + ".png",
              )}
              alt=""
            />
          ) : binding.kind === "palette" ? (
            <span className="demo-palette-swatches">
              {o.swatches?.map((color) => (
                <i key={color} style={{ background: color }} />
              ))}
            </span>
          ) : binding.kind !== "font" ? (
            <ControlIcon kind={binding.kind} />
          ) : null}
          <span
            className="demo-choice-label"
            style={binding.kind === "font" ? { fontFamily: o.id } : undefined}
          >
            {en ? o.en : o.zh}
            {binding.kind === "font" && (
              <span className="demo-font-example">
                {t("让想法清晰可见", "Make your ideas clear")}
              </span>
            )}
            {binding.kind === "formats" && <small>.{o.id}</small>}
          </span>
          {!capability && binding.value.includes(o.id) && (
            <Check className="demo-choice-marker" size={16} />
          )}
        </button>
      ))}
    </div>
  );
  return (
    <div className="demo-control-choices" data-kind={binding.kind}>
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
            "输出偏好；本演示仍使用已有网页演示、文档和图片生成，不提供全部格式下载。",
            "Output preferences only; this demo retains its existing slide, document and image generation, not every export format.",
          )}
        </small>
      )}
      {binding.kind === "document" && (
        <small className="sr-only">
          {t(
            "演示参考文件和已添加材料；不搜索未授权的电脑文件。",
            "Example reference and added materials; no search of unapproved computer files.",
          )}
        </small>
      )}
      {binding.kind !== "formats" && (
        <label className="demo-control-search">
          <Search aria-hidden="true" />
          <span className="sr-only">{t("搜索候选", "Search options")}</span>
          <input
            aria-label={t("搜索候选", "Search options")}
            placeholder={t("搜索", "Search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      )}
      {binding.kind === "document" &&
        materials
          .filter(
            (m) =>
              !m.id.startsWith("reference-example-") &&
              m.name.toLowerCase().includes(query.toLowerCase()),
          )
          .map((m) => (
            <div className="demo-control-option" key={m.id}>
              <FileText size={18} />
              <span>{m.name}</span>
              <Check size={15} />
            </div>
          ))}
      {(capability || ["formats", "font", "palette"].includes(binding.kind)) &&
        cards(options)}
      {!capability &&
        !["formats", "font", "palette"].includes(binding.kind) &&
        !!selected.length && (
          <section>
            <strong>
              {binding.origin === "recommended" ? (
                <>
                  <Sparkles size={14} />
                  {t("推荐采用", "Recommended · in use")}
                </>
              ) : (
                t("当前采用", "In use")
              )}
            </strong>
            {cards(selected)}
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
      {!options.length && (
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
      <div className="demo-choice-footer">
        {capability && (
          <button
            type="button"
            className="demo-choice-all"
            onClick={() => setQuery("")}
          >
            {t("全部", "All")}
          </button>
        )}
        {capability && (
          <span
            className="demo-choice-note"
            title={t(
              "演示选项，不会执行或连接服务",
              "Demo choices; no service is executed or connected",
            )}
          >
            {t("演示", "Demo")}
          </span>
        )}
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
        {binding.kind === "document" && (
          <button
            type="button"
            className="demo-local-file"
            onClick={onChooseFile}
          >
            <Plus size={16} />
            {t("选择本地文件", "Choose a local file")}
          </button>
        )}
        <button
          type="button"
          aria-label={t("完成选择", "Done")}
          title={t("完成选择", "Done")}
          onClick={() => onEvent({ type: "close", owner, id: binding.id })}
        >
          <Check size={24} />
        </button>
      </div>
    </div>
  );
}
