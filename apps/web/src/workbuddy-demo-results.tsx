import {controlLabel,valueLabel} from "../../../packages/core/workbuddy-demo-controls";
import {CaptureTile} from "./workbuddy-demo-capture";
import {uiText, uiLanguage} from "./i18n";
import {
  createElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as I from "lucide-react";
import type {
  DemoDraft,
  DemoMaterial,
  DemoRequest,
} from "../../../packages/core/workbuddy-demo-state";
import type {
  DemoArtifact,
  DemoOutput,
} from "../../../packages/core/workbuddy-demo-generation";
import { deckLayouts, type DeckPage } from "../../../packages/core/web-deck";
import {
  markdownUnits,
  markdownLeaves,
} from "../../../packages/core/markdown-selection";
import { WebDeckPageFrame } from "./web-deck-page-frame";
import "./workbuddy-file-browser.css";
import "./workbuddy-direct-editor.css";
import "./workbuddy-demo-results.css";

const labels = { slides: "网页演示", document: "文档", image: "图片" };
const layoutNames = [
  "封面",
  "左图右文",
  "左文右图",
  "上下排列",
  "内容卡片",
  "大图",
];
function FileIcon({ kind }: { kind: DemoArtifact["kind"] }) {
  const Icon =
    kind === "slides"
      ? I.Presentation
      : kind === "image"
        ? I.Image
        : I.FileText;
  return <Icon size={21} />;
}
function LocalImage({
  blob,
  ...props
}: { blob: Blob } & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const value = URL.createObjectURL(blob);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [blob]);
  return <img {...props} src={url} />;
}
function AttachmentDownload({ material }: { material: DemoMaterial }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const value = URL.createObjectURL(material.blob);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [material.blob]);
  return (
    <a href={url} download={material.name}>
      <I.Paperclip size={13} />
      {material.name}
    </a>
  );
}
function EditableText({
  text,
  label,
  tag = "div",
  change,
}: {
  text: string;
  label: string;
  tag?: "div" | "h1";
  change: (text: string) => void;
}) {
  const ref = useRef<HTMLElement>(null),
    composing = useRef(false);
  useLayoutEffect(() => {
    if (ref.current && !composing.current && ref.current.innerText !== text)
      ref.current.textContent = text;
  }, [text]);
  const commit = () => {
    if (!composing.current && ref.current) {
      const next = ref.current.innerText;
      if (next !== text) change(next);
    }
  };
  return createElement(tag, {
    ref,
    role: "textbox",
    "aria-label": label,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onInput: commit,
    onCompositionStart: () => {
      composing.current = true;
    },
    onCompositionEnd: () => {
      composing.current = false;
      commit();
    },
    onBlur: commit,
  });
}
function Slide({
  page,
  materials,
  change,
}: {
  page: DeckPage;
  materials: DemoMaterial[];
  change?: (patch: Partial<DeckPage>) => void;
}) {
  return (
    <WebDeckPageFrame
      page={page}
      title={
        change ? (
          <EditableText
            tag="h1"
            text={page.title}
            label={uiText("网页幻灯片标题")}
            change={(title) => change({ title })}
          />
        ) : (
          <h1>{page.title}</h1>
        )
      }
      body={
        change ? (
          <EditableText
            text={page.body}
            label={uiText("网页幻灯片正文")}
            change={(body) => change({ body })}
          />
        ) : (
          <div>{page.body}</div>
        )
      }
      photos={page.photoIds.map((id) => {
        const material = materials.find((m) => m.id === id);
        return (
          material && (
            <div className="deck-photo-object" key={id}>
              <LocalImage
                blob={material.blob}
                alt={material.name}
                style={{ objectFit: page.photoFits?.[id] || page.imageFit }}
              />
            </div>
          )
        );
      })}
    />
  );
}
function artifactBody(artifact: DemoArtifact): DemoOutput {
  if (artifact.kind === "slides")
    return { kind: "slides", deck: artifact.deck };
  if (artifact.kind === "document")
    return { kind: "document", markdown: artifact.markdown };
  return { kind: "image", mime: artifact.mime, data: artifact.data };
}
export function editDemoArtifact(
  artifact: DemoArtifact,
  next: DemoOutput,
): DemoArtifact {
  return {
    id: artifact.id,
    title: artifact.title,
    model: artifact.model,
    ...next,
    history: [...(artifact.history || []).slice(-29), artifactBody(artifact)],
    future: [],
  };
}
function saveDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/[\\/:*?"<>|]/g, "_");
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
async function imageData(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
async function download(artifact: DemoArtifact, materials: DemoMaterial[]) {
  if (artifact.kind === "document") {
    saveDownload(
      new Blob([artifact.markdown], { type: "text/markdown;charset=utf-8" }),
      artifact.title + ".md",
    );
    return;
  }
  if (artifact.kind === "image") {
    const bytes = Uint8Array.from(atob(artifact.data), (c) => c.charCodeAt(0));
    saveDownload(
      new Blob([bytes], { type: artifact.mime }),
      artifact.title +
        (artifact.mime === "image/jpeg"
          ? ".jpg"
          : artifact.mime === "image/webp"
            ? ".webp"
            : ".png"),
    );
    return;
  }
  const photos = new Map(
    await Promise.all(
      materials
        .filter((m) => m.kind === "photo")
        .map(async (m) => [m.id, await imageData(m.blob)] as const),
    ),
  );
  const slides = artifact.deck.pages
    .map(
      (p) =>
        `<section class="${p.layout}" style="background:${p.background};color:${p.textColor};--primary:${p.primary}"><header><small>PRODUCT PRESENTATION</small><h1>${escape(p.title)}</h1></header><main>${p.photoIds.length ? `<div class="photos">${p.photoIds.map((id) => `<img src="${photos.get(id) || ""}" style="object-fit:${p.photoFits?.[id] || p.imageFit}" alt="${uiText("用户提供的图片")}">`).join("")}</div>` : ""}<div class="copy">${escape(p.body)}</div></main><details><summary>${uiText("讲稿")}</summary>${escape(p.notes)}</details></section>`,
    )
    .join("");
  saveDownload(
    new Blob(
      [
        `<!doctype html><html lang="${uiLanguage()}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(artifact.title)}</title><style>*{box-sizing:border-box}html{scroll-snap-type:y mandatory}body{margin:0;font:2vw/1.55 system-ui;background:#222}section{padding:5vh 7vw;width:100%;height:100vh;overflow:auto;display:flex;flex-direction:column;scroll-snap-align:start}h1{font-size:4vw;margin:1vh 0 4vh;white-space:pre-wrap}small{color:var(--primary);font-size:1vw;letter-spacing:.2em}main{display:flex;gap:5%;flex:1;min-height:0}.photos,.copy{flex:1;min-width:0;white-space:pre-wrap}.photos{display:flex;gap:1vw}.photos img{width:100%;min-width:0;flex:1;object-fit:contain}.image-right .photos{order:2}.stack main{flex-direction:column}.stack .photos{max-height:50%}.cover{justify-content:center}.full-image .photos{flex:2}details{font-size:14px;white-space:pre-wrap}summary{cursor:pointer}@media print{section{height:100vh;break-after:page}details{display:none}}</style>${slides}<script>addEventListener('keydown',e=>{if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();scrollBy(0,innerHeight)}if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();scrollBy(0,-innerHeight)}})</script></html>`,
      ],
      { type: "text/html;charset=utf-8" },
    ),
    artifact.title + ".html",
  );
}
function Markdown({
  text,
  change,
}: {
  text: string;
  change: (text: string) => void;
}) {
  const units = markdownUnits(text);
  return (
    <div className="wbf-visual-editor wb-markdown-direct">
      {units.map((unit, i) => (
        <div
          key={i}
          className={
            "wbf-block md-unit" + (unit.heading ? " md-h" + unit.heading : "")
          }
          role="textbox"
          aria-label={uiText("Markdown 正文")}
          contentEditable
          suppressContentEditableWarning
          onFocus={(e) => {
            e.currentTarget.textContent = unit.text;
          }}
          onBlur={(e) => {
            const value = e.currentTarget.innerText;
            if (value !== unit.text)
              change(text.slice(0, unit.start) + value + text.slice(unit.end));
          }}
        >
          {markdownLeaves(unit.text).map((leaf, j) => (
            <span
              key={j}
              style={{
                fontWeight: leaf.marks.includes("bold") ? 700 : undefined,
                fontStyle: leaf.marks.includes("italic") ? "italic" : undefined,
                textDecoration: leaf.marks.includes("strike")
                  ? "line-through"
                  : leaf.marks.includes("underline")
                    ? "underline"
                    : undefined,
              }}
            >
              {leaf.text}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
function ArtifactEditor({
  artifact,
  materials,
  onChange,
}: {
  artifact: DemoArtifact;
  materials: DemoMaterial[];
  onChange: (a: DemoArtifact) => void;
}) {
  const [pageIndex, setPageIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [settings, setSettings] = useState(false),
    [source, setSource] = useState(false),
    [zoom, setZoom] = useState(100),
    [error, setError] = useState("");
  const deck = artifact.kind === "slides" ? artifact.deck : null;
  const index = Math.min(pageIndex, (deck?.pages.length || 1) - 1),
    page = deck?.pages[index];
  const change = (body: DemoOutput) =>
    onChange(editDemoArtifact(artifact, body));
  const patch = (patch: Partial<DeckPage>) =>
    deck &&
    page &&
    change({
      kind: "slides",
      deck: {
        ...deck,
        pages: deck.pages.map((p) =>
          p.id === page.id ? { ...p, ...patch } : p,
        ),
      },
    });
  const history = (redo: boolean) => {
    const from = redo ? artifact.future : artifact.history,
      target = from?.at(-1);
    if (target)
      onChange({
        id: artifact.id,
        title: artifact.title,
        model: artifact.model,
        ...target,
        history: redo
          ? [...(artifact.history || []), artifactBody(artifact)]
          : from!.slice(0, -1),
        future: redo
          ? from!.slice(0, -1)
          : [...(artifact.future || []), artifactBody(artifact)],
      });
  };
  useEffect(() => {
    if (!playing) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlaying(false);
      if (["ArrowRight", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
        setPageIndex((i) => Math.min(i + 1, (deck?.pages.length || 1) - 1));
      }
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        setPageIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [playing, deck?.pages.length]);
  return (
    <div className="wbf-document">
      <div className="wbf-file-meta">
        <span>
          <FileIcon kind={artifact.kind} />
          <b>{artifact.title}</b>
        </span>
        <span />
        <button
          aria-label={uiText("下载成果")}
          onClick={() =>
            void download(artifact, materials).catch(() =>
              setError("下载失败，请重试"),
            )
          }
        >
          <I.Download size={16} />{uiText("下载")}</button>
      </div>
      {artifact.kind !== "image" && (
        <nav className="deck-editor-toolbar">
          <button
            aria-label={uiText("撤销成果编辑")}
            disabled={!artifact.history?.length}
            onClick={() => history(false)}
          >
            <I.Undo2 size={17} />
          </button>
          <button
            aria-label={uiText("重做成果编辑")}
            disabled={!artifact.future?.length}
            onClick={() => history(true)}
          >
            <I.Redo2 size={17} />
          </button>
          {deck ? (
            <>
              <button onClick={() => setSettings(!settings)}>{uiText("页面设置")}<I.ChevronDown size={14} />
              </button>
              <button onClick={() => setPlaying(true)}>
                <I.PlayCircle size={17} />{uiText("放映")}</button>
            </>
          ) : (
            <button aria-pressed={source} onClick={() => setSource(!source)}>
              {uiText(source ? "返回文档" : "编辑 Markdown")}
            </button>
          )}
        </nav>
      )}
      {deck && page ? (
        <section className="web-deck-editor">
          {settings && (
            <div className="demo-page-settings">
              <select
                aria-label={uiText("页面布局")}
                value={page.layout}
                onChange={(e) =>
                  patch({ layout: e.target.value as DeckPage["layout"] })
                }
              >
                {deckLayouts.map((l, i) => (
                  <option key={l} value={l}>
                    {uiText(layoutNames[i])}
                  </option>
                ))}
              </select>
              {(["background", "primary", "textColor"] as const).map(
                (key, i) => (
                  <label key={key}>
                    {uiText(["背景", "主色", "文字"][i])}
                    <input
                      type="color"
                      aria-label={uiText(["页面背景色", "页面主色", "页面文字色"][i])}
                      value={page[key]}
                      onChange={(e) => patch({ [key]: e.target.value })}
                    />
                  </label>
                ),
              )}
            </div>
          )}
          <div className="deck-editor-body">
            <aside>
              <button
                disabled={deck.pages.length >= 20}
                onClick={() => {
                  const next = {
                    ...page,
                    id: crypto.randomUUID(),
                    title: uiText("新页面"),
                    body: "",
                    notes: "",
                    photoIds: [],
                  };
                  change({
                    kind: "slides",
                    deck: { ...deck, pages: [...deck.pages, next] },
                  });
                  setPageIndex(deck.pages.length);
                }}
              >{uiText("添加页面")}</button>
              {deck.pages.map((p, i) => (
                <button
                  key={p.id}
                  aria-label={`第 ${i + 1} 页 ${p.title}`}
                  className={i === index ? "active" : ""}
                  onClick={() => setPageIndex(i)}
                >
                  <small>{i + 1}</small>
                  <Slide page={p} materials={materials} />
                </button>
              ))}
              <div className="deck-page-actions">
                {[-1, 1].map((offset) => (
                  <button
                    key={offset}
                    aria-label={uiText(offset < 0 ? "页面上移" : "页面下移")}
                    disabled={
                      index + offset < 0 || index + offset >= deck.pages.length
                    }
                    onClick={() => {
                      const pages = [...deck.pages];
                      [pages[index], pages[index + offset]] = [
                        pages[index + offset],
                        pages[index],
                      ];
                      change({ kind: "slides", deck: { ...deck, pages } });
                      setPageIndex(index + offset);
                    }}
                  >
                    {offset < 0 ? (
                      <I.ChevronUp size={16} />
                    ) : (
                      <I.ChevronDown size={16} />
                    )}
                  </button>
                ))}
                <button
                  aria-label={uiText("删除页面")}
                  disabled={deck.pages.length < 2}
                  onClick={() =>
                    change({
                      kind: "slides",
                      deck: {
                        ...deck,
                        pages: deck.pages.filter((p) => p.id !== page.id),
                      },
                    })
                  }
                >
                  <I.Trash2 size={16} />
                </button>
              </div>
            </aside>
            <main>
              <div className="deck-canvas-scroll">
                <div
                  className="deck-canvas-scale"
                  style={{ width: zoom + "%" }}
                >
                  <Slide
                    key={page.id}
                    page={page}
                    materials={materials}
                    change={patch}
                  />
                </div>
              </div>
              <textarea
                className="deck-notes"
                aria-label={uiText("本页讲稿")}
                value={page.notes}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </main>
          </div>
          <footer className="deck-editor-bottom">
            <span>{uiLanguage() === "en" ? `Page ${index + 1} / ${deck.pages.length}` : `第 ${index + 1} 页 / 共 ${deck.pages.length} 页`}</span>
            <button aria-label={uiText("播放")} onClick={() => setPlaying(true)}>
              <I.PlayCircle size={20} />
            </button>
            <button
              aria-label={uiText("缩小画布")}
              disabled={zoom <= 50}
              onClick={() => setZoom(zoom - 10)}
            >
              −
            </button>
            <output>{zoom}%</output>
            <button
              aria-label={uiText("放大画布")}
              disabled={zoom >= 160}
              onClick={() => setZoom(zoom + 10)}
            >
              ＋
            </button>
          </footer>
        </section>
      ) : artifact.kind === "document" ? (
        <div className="wbf-scroll">
          <div className="wbf-content">
            <div className="wbf-text-page">
              {source ? (
                <textarea
                  aria-label={uiText("Markdown 源文档")}
                  value={artifact.markdown}
                  onChange={(e) =>
                    change({ kind: "document", markdown: e.target.value })
                  }
                />
              ) : (
                <Markdown
                  text={artifact.markdown}
                  change={(markdown) => change({ kind: "document", markdown })}
                />
              )}
            </div>
          </div>
        </div>
      ) : artifact.kind === "image" ? (
        <div className="wbf-image-preview demo-generated-image">
          <img
            src={`data:${artifact.mime};base64,${artifact.data}`}
            alt={artifact.title}
          />
        </div>
      ) : null}
      {error && <p role="alert">{uiText(error)}</p>}
      {playing && page && deck && (
        <div className="deck-playback" role="dialog" aria-label={uiText("演示文稿放映")}>
          <Slide page={page} materials={materials} />
          <header>
            <b>{artifact.title}</b>
            <span>
              {index + 1} / {deck.pages.length}
            </span>
          </header>
          <footer>
            <button
              disabled={index === 0}
              onClick={() => setPageIndex(index - 1)}
            >{uiText("上一页")}</button>
            <button onClick={() => setPlaying(false)}>{uiText("退出放映")}</button>
            <button
              disabled={index === deck.pages.length - 1}
              onClick={() => setPageIndex(index + 1)}
            >{uiText("下一页")}</button>
          </footer>
        </div>
      )}
    </div>
  );
}
export function DemoTaskView({
  draft,
  composer,
  onStop,
  onRetry,
  onArtifact,
}: {
  draft: DemoDraft;
  composer: ReactNode;
  onStop: (id: string) => void;
  onRetry: (request: DemoRequest) => void;
  onArtifact: (request: string, artifact: DemoArtifact) => void;
}) {
  const messages = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = messages.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [draft.requests[0]?.id]);
  const [selected, setSelected] = useState(""),
    [closed, setClosed] = useState(false);
  const files = draft.requests.flatMap((request) =>
    (request.artifacts || []).map((artifact) => ({ request, artifact })),
  );
  const chosen = files.find((f) => f.artifact.id === selected) || files[0];
  const newest = files[0]?.artifact.id;
  useEffect(() => {
    if (newest) {
      setSelected(newest);
      setClosed(false);
    }
  }, [newest]);
  return (
    <>
      <header className="demo-task-heading">
        <span>{draft.requests.at(-1)?.text.slice(0, 42) || uiText("新任务")}</span>
        {files.length > 0 && closed && (
          <button onClick={() => setClosed(false)}>
            <I.PanelRightOpen size={17} />{uiText("查看成果")}</button>
        )}
      </header>
      <div className="wb-task-layout">
        <section className="wb-task-chat">
          <div
            className="wb-messages"
            ref={messages}
            role="region"
            aria-label={uiText("发送的请求")}
          >
            {[...draft.requests].reverse().map((request) => (
              <article key={request.id} className="demo-task-turn">
                <div className="wb-message user">
                  <div className="wb-message-text">{request.text}</div>
                </div>
                <div className="demo-request-materials">
                  {request.captures?.filter(c=>c.kind==='recording').map(c=><div key={c.id} className="demo-snapshot-capture"><CaptureTile item={c}/></div>)}
                  {request.materials.map((m) => (
                    <AttachmentDownload key={m.id} material={m} />
                  ))}
                </div>
                <details className="demo-request-details">
                  <summary>{uiText("查看参数与发送记录（")}{draft.requests.length}）
                  </summary>
                  <dl>
                    {request.controls?.map(c=><div key={c.id}><dt>{controlLabel(c.kind,uiLanguage())} · {c.origin==='recommended'?'推荐 / Suggested':'用户指定 / User specified'}</dt><dd>{valueLabel(c,uiLanguage())}{['expert','skills','connectors'].includes(c.kind)?' · 演示选项 / Demo only':''}</dd></div>)}
                    {request.parameters.map((p) => (
                      <div key={p.id}>
                        <dt>
                          {p.scope === "全文" ? uiText("全文") : p.scope} · {uiText(p.role)}
                        </dt>
                        <dd>{p.value || p.label}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
                <div className="wb-message assistant">
                  <strong>
                    <img src="./assets/xiaoyi-work/logo.png" alt="" />
                    {uiText("小艺Work")}
                  </strong>
                  <div className="deck-job" role="status">
                    {request.status === "running" ? (
                      <>
                        <I.LoaderCircle size={17} className="demo-spin" />
                        {uiText(request.stage || "准备材料")}
                        <button onClick={() => onStop(request.id)}>{uiText("停止生成")}</button>
                      </>
                    ) : request.status === "complete" ? (
                      uiText("已生成，可打开预览和编辑。")
                    ) : request.status === "failed" ||
                      request.status === "stopped" ? (
                      <>
                        <p role="alert">
                          {uiText(request.error || "生成已停止，输入已保留。")}
                        </p>
                        <button onClick={() => onRetry(request)}>{uiText("重试生成")}</button>
                      </>
                    ) : (
                      <>
                        <span>{uiText("已保存的请求")}</span>
                        <button onClick={() => onRetry(request)}>{uiText("生成成果")}</button>
                      </>
                    )}
                  </div>
                  {(request.artifacts || []).map((a) => (
                    <button
                      className="wb-file-card"
                      key={a.id}
                      aria-label={uiText("打开 ") + a.title}
                      onClick={() => {
                        setSelected(a.id);
                        setClosed(false);
                      }}
                    >
                      <span className={"wb-file-symbol " + a.kind}>
                        <FileIcon kind={a.kind} />
                      </span>
                      <span>
                        {a.title}
                        <small>
                          {uiText(labels[a.kind])} ·{" "}
                          {a.kind === "slides"
                            ? "HTML"
                            : a.kind === "document"
                              ? "Markdown"
                              : a.mime.split("/")[1].toUpperCase()}
                        </small>
                      </span>
                      <I.PanelRightOpen size={18} />
                    </button>
                  ))}
                  {!!request.artifacts?.length && (
                    <small className="demo-model-label">
                      {[...new Set(request.artifacts.map((a) => a.model))].join(
                        " · ",
                      )}
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="demo-task-compose">{composer}</div>
        </section>
        {chosen && !closed && (
          <aside
            className="wb-file-panel wbf-results wbf-replica-artifact"
            aria-label={uiText("成果预览")}
          >
            <div className="wb-preview-tabs" role="tablist">
              {files.map(({ artifact }) => (
                <div key={artifact.id}>
                  <button
                    role="tab"
                    aria-selected={chosen.artifact.id === artifact.id}
                    className={
                      chosen.artifact.id === artifact.id ? "active" : ""
                    }
                    onClick={() => setSelected(artifact.id)}
                  >
                    {artifact.title}
                  </button>
                </div>
              ))}
              <button aria-label={uiText("收起成果预览")} onClick={() => setClosed(true)}>
                <I.PanelRightClose size={16} />
              </button>
            </div>
            <ArtifactEditor
              key={chosen.artifact.id}
              artifact={chosen.artifact}
              materials={chosen.request.materials}
              onChange={(a) => onArtifact(chosen.request.id, a)}
            />
          </aside>
        )}
      </div>
    </>
  );
}
