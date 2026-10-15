import {WorkBuddyObjectSurface} from './workbuddy-object-surface';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import * as I from "lucide-react";
import type { State } from "../../../packages/core/model";
import { totals, money } from "../../../packages/core/model";
import type { WbFile } from "../../../packages/core/workbuddy";
import {
  activeFileView,
  browserState,
  fileBody,
  fileDirty,
  fileConflict,
  fileReadOnly,
  pathText,
  bodyText,
  type FileView,
} from "../../../packages/core/workbuddy-files";
import { command, navigateBack, toast } from "./runtime";
import { useBack } from "./back";
import { useWorkBuddyInput } from "./workbuddy-input";
import { clipboardWrite } from "./phone-native";
import { ConnectionButton } from "./connection-access";
import {
  OfficeParagraphs,
  OfficeQuoteRows,
  quoteColumns,
  quoteFields,
} from "./workbuddy-office";
import { SlideCanvas } from "./tablet";
import "./workbuddy-file-browser.css";
const run = (action: string, value: Record<string, unknown> = {}) =>
  command("wb-fb-" + action, value);
export function FileTypeIcon({ file }: { file: WbFile }) {
  const C =
    file.kind === "sheet"
      ? I.Table2
      : file.kind === "slides"
        ? I.Presentation
        : file.kind === "image"
          ? I.Image
          : file.kind === "audio"
            ? I.Music
            : file.kind === "html"
              ? I.Globe
              : I.FileText;
  return <C size={17} className={"wbf-type " + file.kind} />;
}
export function WorkspaceTree({
  s,
  onOpen,
}: {
  s: State;
  onOpen: (id: string) => void;
}) {
  const [closed, setClosed] = useState<string[]>([]),
    [search, setSearch] = useState("");
  const folders = [...new Set(s.workbuddy.files.map((f) => f.folder))];
  return (
    <div className="wbf-tree">
      <input
        aria-label="搜索工作空间文件"
        placeholder="搜索文件"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {folders.map((folder) => (
        <section key={folder}>
          <button
            className="wbf-folder"
            onClick={() =>
              setClosed(
                closed.includes(folder)
                  ? closed.filter((x) => x !== folder)
                  : [...closed, folder],
              )
            }
          >
            {closed.includes(folder) ? (
              <I.ChevronRight size={14} />
            ) : (
              <I.ChevronDown size={14} />
            )}
            <I.Folder size={16} />
            {folder}
          </button>
          {!closed.includes(folder) &&
            s.workbuddy.files
              .filter((f) => f.folder === folder && f.name.includes(search))
              .map((f) => (
                <button key={f.id} onClick={() => onOpen(f.id)}>
                  <FileTypeIcon file={f} />
                  <span>{f.name}</span>
                </button>
              ))}
        </section>
      ))}
    </div>
  );
}
function markdownHTML(line: string) {
  const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const formatted = escaped.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, "<u>$1</u>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/~~(.*?)~~/g, "<del>$1</del>")
    .replace(/`(.*?)`/g, "<code>$1</code>").replace(/\*([^*]+)\*/g, "<em>$1</em>");
  const heading = formatted.match(/^(#{1,6}) (.+)$/s);
  return heading ? `<h${Math.min(2, heading[1].length)}>${heading[2]}</h${Math.min(2, heading[1].length)}>` : "<p>" + formatted.replace(/\n/g, "<br>") + "</p>";
}
function readMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  const el = node as HTMLElement, tag = el.tagName?.toLowerCase();
  if (tag === "br") return "\n";
  const text = Array.from(node.childNodes).map(readMarkdown).join("");
  if (tag === "strong" || tag === "b") return "**" + text + "**";
  if (tag === "em" || tag === "i") return "*" + text + "*";
  if (tag === "del" || tag === "s") return "~~" + text + "~~";
  if (tag === "u") return "<u>" + text + "</u>";
  if (tag === "code") return "`" + text + "`";
  if (tag === "h1" || tag === "h2") return (tag === "h1" ? "# " : "## ") + text;
  return text + ((tag === "div" || tag === "p") && el.nextSibling ? "\n" : "");
}
function MarkdownBlock({ line, index, query, onClick, onEdit }: { line: string; index: number; query: string; onClick?: (index: number) => void; onEdit?: (index: number, text: string) => void }) {
  const ref = useRef<HTMLDivElement>(null), rendered = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    if (ref.current && rendered.current !== line) { ref.current.innerHTML = markdownHTML(line); rendered.current = line; }
  }, [line]);
  const commit = () => {
    if (!ref.current || !onEdit) return;
    const text = Array.from(ref.current.childNodes).map(readMarkdown).join("");
    if (rendered.current !== text) { rendered.current = text; onEdit(index, text); }
  };
  return <div ref={ref} id={"wbf-section-" + index} className={"wbf-block " + (query && line.toLowerCase().includes(query.toLowerCase()) ? "wbf-find-hit" : "")} onClick={() => onClick?.(index)} contentEditable={!!onEdit} suppressContentEditableWarning onInput={commit} onBlur={commit} />;
}
function TextBlocks({ text, query = "", onClick, onSelection, onEdit }: { onEdit?: (index: number, text: string) => void; text: string; query?: string; onClick?: (index: number) => void; onSelection?: (text: string) => void }) {
  return <div onMouseUp={() => onSelection?.(window.getSelection()?.toString() || "")} onTouchEnd={() => setTimeout(() => onSelection?.(window.getSelection()?.toString() || ""), 100)}>
    {text.split(/\n\n+/).map((line, i) => <MarkdownBlock key={i} line={line} index={i} query={query} onClick={onClick} onEdit={onEdit} />)}
  </div>;
}
function FieldEditor({
  s,
  v,
  f,
  path,
  label,
  multiline = false,
}: {
  s: State;
  v: FileView;
  f: WbFile;
  path: string;
  label: string;
  multiline?: boolean;
}) {
  const id = "wb:doc:" + v.id + ":" + f.id + ":" + path;
  const body = fileBody(s, v, f.id),
    value = pathText(body, path);
  const focus = () =>
    command("wb-focus", { id, label: f.name + " · " + label });
  const change = (text: string) =>
    run("edit", {
      view: v.id,
      file: f.id,
      path,
      text,
      version: v.working[f.id]?.version || 0,
    });
  return multiline ? (
    <textarea
      aria-label={label}
      value={value}
      onFocus={focus}
      onChange={(e) => change(e.target.value)}
    />
  ) : (
    <input
      aria-label={label}
      value={value}
      onFocus={focus}
      onChange={(e) => change(e.target.value)}
    />
  );
}
function FileAI({ s, v, f, onGuard }: { s: State; v: FileView; f: WbFile; onGuard: (action: () => void, ids?: string[]) => void }) {
  const co = browserState(s).conversations[f.id];
  const input = useWorkBuddyInput(
    "wb:co:" + f.id,
    "和 WorkBuddy 对话 · " + f.name,
  );
  const [attachment, setAttachment] = useState(false);
  useBack(() => { if (!attachment) return false; setAttachment(false); return true; }, 116);
  return (
    <aside className="wbf-ai" style={{ width: v.aiWidth + "%" }}>
      <header>
        <img src="./assets/apps/workbuddy.svg" alt="" />
        <b>WorkBuddy</b>
        <button
          aria-label="回到 WorkBuddy 主页"
          onClick={() =>
            onGuard(() => run("exit", { view: v.id, choice: "discard" }).then((a) => {
              if (a.ok) command("wb-navigate", { page: "home" });
            }))
          }
        >
          <I.ArrowUpRight size={15} />
        </button>
        <span />
        <button
          aria-label="新建文件会话"
          onClick={() => run("chat-new", { file: f.id })}
        >
          <I.MessageCirclePlus size={17} />
        </button>
        <button
          aria-label="收起 AI 对话"
          onClick={() => run("ai", { view: v.id, open: false })}
        >
          <I.X size={17} />
        </button>
      </header>
      <div className="wbf-ai-messages">
        {!co?.messages.length ? (
          <div className="wbf-ai-welcome">
            <h2>WorkBuddy, 我帮你</h2>
            <p>围绕当前文件处理内容</p>
            {[
              "总结全文要点",
              "检查错别字和语病",
              "润色全文",
              "补充全文项目介绍",
            ].map((text) => (
              <button
                key={text}
                onClick={() => {
                  input.update(text);
                  void input.focus();
                }}
              >
                {text}
              </button>
            ))}
          </div>
        ) : (
          co.messages.map((m) => (
            <div className={"wbf-message " + m.role} key={m.id}>
              {m.text}
            </div>
          ))
        )}
        {co?.pending && (
          <div className="wbf-thinking" role="status">
            <i />
            正在处理所选内容…
            <button onClick={() => run("ai-cancel", { file: f.id })}>
              停止
            </button>
          </div>
        )}
        {co?.unknown && (
          <div className="wbf-ai-choices">
            {[
              ["summary", "总结"],
              ["polish", "润色全文"],
              ["append", "补充全文项目介绍"],
              ["quote", "调整数量"],
              ["generate", "生成简报"],
            ].map(([op, text]) => (
              <button
                key={op}
                onClick={() =>
                  run("ai-send", {
                    view: v.id,
                    file: f.id,
                    text: op === "quote" ? co.unknown : text,
                    operation: op,
                  })
                }
              >
                {text}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="wbf-ai-compose">
        {v.selection && (
          <blockquote>
            <I.TextQuote size={14} />
            {v.selection.text || v.selection.paths.join("、")}
          </blockquote>
        )}
        {co?.draft.attachments.length ? (
          <small>
            <I.Paperclip size={12} />
            {co.draft.attachments
              .map((id) => s.workbuddy.files.find((f) => f.id === id)?.name)
              .join("、")}
          </small>
        ) : null}
        <textarea
          aria-label="文件 AI 指令"
          placeholder="输入修改要求…"
          value={input.text}
          onFocus={input.focus}
          onChange={(e) => input.update(e.target.value)}
        />
        <footer>
          <button
            aria-label="添加文件附件"
            onClick={() => setAttachment(!attachment)}
          >
            <I.Plus size={20} />
          </button>
          <span>
            快捷 <I.ChevronDown size={12} />
          </span>
          <span />
          <button
            aria-label="手机语音输入"
            onClick={() => input.focus().then(() => toast("已激活手机输入"))}
          >
            <I.Mic size={19} />
          </button>
          <button
            className="wbf-send"
            aria-label="发送文件指令"
            disabled={
              input.busy || input.blocked || !input.text.trim() || !!co?.pending
            }
            onClick={() => input.submit()}
          >
            <I.ArrowUp size={19} />
          </button>
        </footer>
        {input.blocked && (
          <button onClick={input.recover}>恢复此文件草稿</button>
        )}
        {attachment && (
          <div className="wbf-attachment-menu">
            {s.workbuddy.files
              .filter((x) => x.id !== f.id)
              .map((x) => (
                <button
                  key={x.id}
                  onClick={() =>
                    command("wb-fb-attach", {
                      file: f.id,
                      attachment: x.id,
                    }).then(() => setAttachment(false))
                  }
                >
                  <FileTypeIcon file={x} />
                  {x.name}
                </button>
              ))}
          </div>
        )}
      </div>
    </aside>
  );
}
export function FileSurface({
  s,
  v,
  f,
  onGuard,
}: {
  s: State;
  v: FileView;
  f: WbFile;
  onGuard: (action: () => void, ids?: string[]) => void;
}) {
  const b = browserState(s),
    body = fileBody(s, v, f.id),
    readOnly =
      fileReadOnly(s, v, f.id) || ["pdf", "image", "audio", "video"].includes(f.kind),
    conflict = fileConflict(s, v, f.id);
  const [edit, setEdit] = useState(false),
    [source, setSource] = useState(false),
    [find, setFind] = useState(false),
    [query, setQuery] = useState(""),
    [replacement, setReplacement] = useState(""),
    [outline, setOutline] = useState(false),
    [zoom, setZoom] = useState(100),
    [slide, setSlide] = useState(0),
    [page, setPage] = useState(0),
    [menu, setMenu] = useState(false),
    [hit, setHit] = useState(0);
  const scroll = useRef<HTMLDivElement>(null),
    range = useRef<{ row: number; field: string } | null>(null);
  useBack(() => { if (!menu && !find) return false; setMenu(false); setFind(false); return true; }, 115);
  const selected = s.target?.id.startsWith("wb:doc:" + v.id + ":" + f.id + ":")
    ? s.target.id.split(":").at(-1)!
    : "";
  const select = (path: string, label: string) => {
    const text = pathText(body, path);
    void run("select", { view: v.id, file: f.id, path, text });
    if (!readOnly)
      void command("wb-focus", {
        id: "wb:doc:" + v.id + ":" + f.id + ":" + path,
        label: f.name + " · " + label,
      });
  };
  const change = (path: string, text: string) =>
    run("edit", {
      view: v.id,
      file: f.id,
      path,
      text,
      version: v.working[f.id]?.version || 0,
    });
  const ai = () =>
    run("ai", { view: v.id, open: true }).then(() =>
      command("wb-focus", {
        id: "wb:co:" + f.id,
        label: "和 WorkBuddy 对话 · " + f.name,
      }),
    );
  const format = (mark: string) => {
    if (["word", "slides"].includes(f.kind)) {
      void run("format", {
        view: v.id,
        file: f.id,
        path: selected || "paragraph/0",
        mark,
      });
      return;
    }
    const selection = window.getSelection()?.toString() || v.selection?.text;
    if (!selection) return;
    const wrapper =
      mark === "bold"
        ? "**"
        : mark === "italic"
          ? "*"
          : mark === "strike"
            ? "~~"
            : "<u>";
    const wrapped =
      mark === "underline"
        ? "<u>" + selection + "</u>"
        : wrapper + selection + wrapper;
    void change("text", body.text.replace(selection, wrapped));
  };
  const save = () =>
    run("save", { view: v.id, file: f.id }).then((a) => {
      if (a.ok) toast("已保存");
    });
  const matching = [
    ...(scroll.current?.querySelectorAll<HTMLElement>(".wbf-find-hit") || []),
  ];
  function seek(next: number) {
    const hits = [
      ...(scroll.current?.querySelectorAll<HTMLElement>(".wbf-find-hit") || []),
    ];
    if (!hits.length) return;
    const at = (next + hits.length) % hits.length;
    setHit(at);
    hits[at].scrollIntoView({ block: "center" });
  }
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (["f", "h", "s", "z", "w"].includes(e.key.toLowerCase()))
        e.preventDefault();
      if (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "h")
        setFind(true);
      if (e.key.toLowerCase() === "s") void save();
      if (e.key.toLowerCase() === "z")
        void run(e.shiftKey ? "redo" : "undo", { view: v.id, file: f.id });
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [s.revision, f.id]);
  function textSelection(text: string) {
    if (!text) return;
    const start = body.text.indexOf(text);
    void run("select", {
      view: v.id,
      file: f.id,
      path: "text",
      text,
      ...(start >= 0 ? { start, end: start + text.length } : {}),
    });
  }
  const report = totals(s.reportProducts);
  const dirty = fileDirty(s, v, f.id);
  const visual = (
    <TextBlocks
      text={body.text}
      query={query}
      onClick={
        f.kind === "html" && edit && !readOnly
          ? (i) => {
              textSelection(body.text.split(/\n\n+/)[i]);
            }
          : undefined
      }
      onSelection={textSelection}
      onEdit={f.kind === "html" && edit && !readOnly ? (index, text) => {
        const blocks = body.text.split(/\n\n+/); blocks[index] = text;
        void change("text", blocks.join("\n\n"));
      } : undefined}
    />
  );
  return (
    <section className="wbf-document">
      <div className="wbf-file-meta">
        <span>
          <b>{f.name}</b>
          <small>{dirty ? "未保存" : "已保存"}</small>
          {readOnly && <small>只读</small>}
        </span>
        <span />
        <button
          aria-label="保存文件"
          disabled={readOnly || conflict}
          onClick={save}
        >
          <I.Save size={18} />
        </button>
        <button aria-label="上传文件" onClick={() => setMenu(!menu)}>
          <I.UploadCloud size={18} />
        </button>
        <button
          aria-label="分享文件"
          onClick={() =>
            run("local-record", {
              file: f.id,
              action: "分享",
              name: f.name,
            }).then(() => toast("已保存本地分享记录"))
          }
        >
          <I.Share2 size={18} />
        </button>
        <button aria-label="文件更多" onClick={() => setMenu(!menu)}>
          <I.MoreHorizontal size={20} />
        </button>
        {menu && (
          <div className="wbf-more-menu">
            {["资料库", "腾讯文档", "ima 知识库", "乐享知识库"].map(
              (channel) => (
                <button
                  key={channel}
                  onClick={() => {
                    run("local-record", {
                      action: "上传到" + channel,
                      name: f.name,
                    });
                    setMenu(false);
                    toast("已保存本地上传记录");
                  }}
                >
                  {channel}
                </button>
              ),
            )}
            <hr />
            <button
              onClick={() =>
                run("copy", { view: v.id, file: f.id }).then(() =>
                  setMenu(false),
                )
              }
            >
              另存副本
            </button>
            <button
              onClick={() => {
                setFind(true);
                setMenu(false);
              }}
            >
              查找内容
            </button>
            <button
              onClick={() => {
                setZoom(100);
                setMenu(false);
              }}
            >
              重置缩放
            </button>
          </div>
        )}
      </div>
      {conflict && (
        <div className="wbf-conflict" role="alert">
          文件在别处发生了修改。
          <button
            onClick={() =>
              onGuard(() => run("reload", { view: v.id, file: f.id }), [f.id])
            }
          >
            刷新文件
          </button>
          <button onClick={() => run("copy", { view: v.id, file: f.id })}>
            另存副本
          </button>
        </div>
      )}
      <div className="wbf-toolbar">
        <button onClick={() => setOutline(!outline)} aria-label="文档目录">
          <I.PanelLeft size={16} />
        </button>
        <button
          aria-label="文件撤销"
          disabled={readOnly || !v.working[f.id]?.history.length}
          onClick={() => run("undo", { view: v.id, file: f.id })}
        >
          <I.Undo2 size={16} />
        </button>
        <button
          aria-label="文件重做"
          disabled={readOnly || !v.working[f.id]?.future.length}
          onClick={() => run("redo", { view: v.id, file: f.id })}
        >
          <I.Redo2 size={16} />
        </button>
        <i />
        {!readOnly && (
          <>
            <button className="wbf-ai-action" onClick={ai}>
              <I.Sparkles size={15} />
              AI 编辑
            </button>
            <i />
            {["word", "markdown", "text", "html"].includes(f.kind) && (
              <>
                {["bold", "italic", "underline", "strike"].map((mark, i) => {
                  const Icon = [I.Bold, I.Italic, I.Underline, I.Strikethrough][
                    i
                  ];
                  return (
                    <button
                      key={mark}
                      aria-label={["加粗", "斜体", "下划线", "删除线"][i]}
                      onClick={() => format(mark)}
                    >
                      <Icon size={15} />
                    </button>
                  );
                })}
              </>
            )}
          </>
        )}
        {["markdown", "text"].includes(f.kind) && (
          <button onClick={() => setSource(!source)}>
            {source ? "可视编辑" : "源码编辑"}
          </button>
        )}
        {f.kind === "html" && (
          <button
            onClick={() => {
              if (edit) {
                void save();
              }
              setEdit(!edit);
            }}
          >
            {edit ? "退出编辑" : "编辑网页"}
          </button>
        )}
        <span />
        <button aria-label="查找文件内容" onClick={() => setFind(!find)}>
          <I.Search size={17} />
        </button>
      </div>
      {find && (
        <div className="wbf-find">
          <input
            aria-label="查找文字"
            placeholder="查找"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHit(0);
            }}
          />
          <span>{query ? bodyText(body).split(query).length - 1 : 0} 处</span>
          <button aria-label="上一处" onClick={() => seek(hit - 1)}>
            <I.ChevronUp size={15} />
          </button>
          <button aria-label="下一处" onClick={() => seek(hit + 1)}>
            <I.ChevronDown size={15} />
          </button>
          {!readOnly && ["markdown", "text", "html"].includes(f.kind) && (
            <>
              <input
                aria-label="替换文字"
                placeholder="替换为"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
              />
              <button
                disabled={!query}
                onClick={() =>
                  change("text", body.text.replace(query, replacement))
                }
              >
                替换
              </button>
              <button
                disabled={!query}
                onClick={() =>
                  change("text", body.text.split(query).join(replacement))
                }
              >
                全部替换
              </button>
            </>
          )}
          <button aria-label="关闭查找" onClick={() => setFind(false)}>
            <I.X size={15} />
          </button>
        </div>
      )}
      <div className={"wbf-editor-layout " + (outline ? "with-outline" : "")}>
        {outline && (
          <aside className="wbf-outline">
            {body.paragraphs
              ? body.paragraphs.map((p, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      scroll.current
                        ?.querySelectorAll(".word-paragraph")
                        [i]?.scrollIntoView({ block: "center" })
                    }
                  >
                    {p.slice(0, 24)}
                  </button>
                ))
              : body.slides
                ? body.slides.map((slide, i) => (
                    <button
                      className={slide === body.slides?.[page] ? "active" : ""}
                      key={i}
                      onClick={() => setSlide(i)}
                    >
                      {i + 1}. {slide.title}
                    </button>
                  ))
                : body.text.split(/\n\n+/).map((x, i) =>
                    x.startsWith("#") ? (
                      <button
                        key={i}
                        onClick={() =>
                          scroll.current
                            ?.querySelector("#wbf-section-" + i)
                            ?.scrollIntoView({ block: "center" })
                        }
                      >
                        {x.replace(/^#+ /, "")}
                      </button>
                    ) : null,
                  )}
          </aside>
        )}
        <div
          ref={scroll}
          className={
            "wbf-scroll " +
            (f.kind === "sheet" ? "grid" : "") +
            (b.conversations[f.id]?.pending ? " processing" : "")
          }
          onPointerUp={() => {
            const selection = window.getSelection();
            if (!selection?.rangeCount || selection.isCollapsed || !scroll.current) return;
            const range = selection.getRangeAt(0), nodes = [...scroll.current.querySelectorAll(".word-paragraph")];
            const chosen = nodes.filter((node) => range.intersectsNode(node));
            if (!chosen.length || !scroll.current.contains(range.commonAncestorContainer)) return;
            const paths = chosen.map((node) => "paragraph/" + nodes.indexOf(node));
            const offsets: { start?: number; end?: number } = {};
            if (chosen.length === 1) {
              const prefix = range.cloneRange(); prefix.selectNodeContents(chosen[0]); prefix.setEnd(range.startContainer, range.startOffset);
              offsets.start = prefix.toString().length; offsets.end = offsets.start + selection.toString().length;
            }
            void run("select", { view: v.id, file: f.id, paths, text: selection.toString(), ...offsets });
          }}
          onClick={() => {
            if (v.working[f.id]?.highlight.length)
              void run("highlight-clear", { view: v.id, file: f.id });
          }}
        >
          <div className={"wbf-content " + f.kind} style={{ zoom: zoom / 100 }}>
            {f.kind === "word" && (
              <article className="word-page wbf-word">
                <OfficeParagraphs
                  paragraphs={body.paragraphs || []}
                  marks={body.marks}
                  selected={
                    selected.startsWith("paragraph/")
                      ? Number(selected.split("/")[1])
                      : undefined
                  }
                  onSelect={(i) => {
                    if (!window.getSelection()?.toString())
                      select("paragraph/" + i, "第 " + (i + 1) + " 段");
                  }}
                  onEdit={
                    readOnly
                      ? undefined
                      : (i, text) => {
                          if (text !== body.paragraphs?.[i])
                            void change("paragraph/" + i, text);
                        }
                  }
                />
                <h3>设备与报价</h3>
                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>产品</th>
                      <th>数量</th>
                      <th>客户报价</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.reportProducts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.quantity}</td>
                        <td>{money(totals([p]).revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="quote-total">
                  方案总报价 <strong>{money(report.revenue)}</strong>
                </div>
              </article>
            )}
            {f.kind === "sheet" && body.table && <table className="spreadsheet wbf-data-table"><thead><tr><th/>{body.table.columns.map((column,i)=><th key={i}>{column}</th>)}</tr></thead><tbody>{body.table.rows.map((row,i)=><tr key={i}><th>{i+2}</th>{row.map((text,j)=><td key={j} className={selected===`table/${i}/${j}`?'cell-selected':''}><input aria-label={`${body.table!.columns[j]} · 第 ${i+2} 行`} value={text} readOnly={readOnly} onFocus={()=>select(`table/${i}/${j}`,`${body.table!.columns[j]} · 第 ${i+2} 行`)} onChange={e=>void change(`table/${i}/${j}`,e.target.value)}/></td>)}</tr>)}</tbody></table>}
            {f.kind === "sheet" && !body.table && (
              <>
                <div className="wbf-formula">
                  <span>
                    {v.selection?.paths[0]?.startsWith("cell/")
                      ? "BCDE"[
                          quoteFields.indexOf(
                            v.selection.paths[0].split(
                              "/",
                            )[2] as (typeof quoteFields)[number],
                          )
                        ] +
                        (Number(v.selection.paths[0].split("/")[1]) + 4)
                      : "A1"}
                  </span>
                  <b>ƒx</b>
                  <span>{v.selection?.text || ""}</span>
                </div>
                <table className="spreadsheet">
                  <thead>
                    <tr>
                      <th />
                      {"ABCDEFGH".split("").map((x) => (
                        <th key={x}>{x}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>1</th>
                      <td colSpan={8} className="sheet-title">
                        澄星设计 · 采购与客户报价
                      </td>
                    </tr>
                    <tr>
                      <th>2</th>
                      <td colSpan={8}>锐行办公　|　客户经理：陈朗</td>
                    </tr>
                    <tr>
                      <th>3</th>
                      {quoteColumns.map((c) => (
                        <td className="table-heading" key={c}>
                          {c}
                        </td>
                      ))}
                    </tr>
                    <OfficeQuoteRows
                      selectedPaths={v.selection?.paths}
                      products={body.products || []}
                      selected={selected}
                      onSelect={(i, field) =>
                        select(
                          "cell/" + i + "/" + field,
                          "第 " + (i + 4) + " 行 · " + ["数量", "采购单价", "销售单价", "折扣"][quoteFields.indexOf(field as typeof quoteFields[number])],
                        )
                      }
                      onEdit={
                        readOnly
                          ? undefined
                          : (i, field, text) => {
                              void change("cell/" + i + "/" + field, text);
                            }
                      }
                      onRange={(row, field, phase) => {
                        if (phase === "start") range.current = { row, field };
                        else if (range.current && (range.current.row !== row || range.current.field !== field)) {
                          const low = Math.min(row, range.current.row),
                            high = Math.max(row, range.current.row);
                          const from = quoteFields.indexOf(range.current.field as typeof quoteFields[number]), to = quoteFields.indexOf(field as typeof quoteFields[number]);
                          const columns = quoteFields.slice(Math.min(from,to),Math.max(from,to)+1);
                          void run("select", {
                            view: v.id,
                            file: f.id,
                            paths: Array.from(
                              { length: high - low + 1 },
                              (_, i) => columns.map(column => "cell/" + (low + i) + "/" + column),
                            ).flat(),
                            text:
                              "第 " + (low + 4) + " 至 " + (high + 4) + " 行",
                          });
                          range.current = null;
                        }
                        else range.current = null;
                      }}
                    />
                    <tr className="sum-row">
                      <th>{(body.products?.length || 0) + 4}</th>
                      <td>合计</td>
                      <td>
                        {body.products?.reduce((n, p) => n + p.quantity, 0)}
                      </td>
                      <td />
                      <td />
                      <td />
                      <td>{money(totals(body.products || []).cost)}</td>
                      <td>{money(totals(body.products || []).revenue)}</td>
                      <td>{money(totals(body.products || []).profit)}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="wbf-procurement-note">
                  其他供应商报价、安装地址与数据迁移范围待补充。
                </p>
              </>
            )}
            {f.kind === "slides" && (
              <div className="wbf-slides">
                <aside>
                  {body.slides?.map((x, i) => (
                    <button
                      className={slide === i ? "active" : ""}
                      key={i}
                      onClick={() => setSlide(i)}
                    >
                      <b>{i + 1}</b>
                      <span>{x.title}</span>
                    </button>
                  ))}
                </aside>
                <div>
                  <WorkBuddyObjectSurface s={s} view={v.id} file={f.id}>
                  <SlideCanvas
                    s={{
                      ...s,
                      slides: body.slides || [],
                      slide: Math.min(slide, (body.slides?.length || 1) - 1),
                      presenting: false,
                    }}
                    objectStyles={body.objectStyles}
                    onSelect={
                      readOnly ? () => {} : (path, label) => void command('wb-object-select',{view:v.id,file:f.id,path,label})
                    }
                  />
                  </WorkBuddyObjectSurface>
                  {!readOnly && (
                    <div className="wbf-slide-fields">
                      <FieldEditor
                        s={s}
                        v={v}
                        f={f}
                        path={"slide/" + slide + "/title"}
                        label="幻灯片标题"
                      />
                      <FieldEditor
                        s={s}
                        v={v}
                        f={f}
                        path={"slide/" + slide + "/body"}
                        label="幻灯片正文"
                        multiline
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {["markdown", "text"].includes(f.kind) && (
              <article className="wbf-text-page">
                {source ? (
                  <FieldEditor
                    s={s}
                    v={v}
                    f={f}
                    path="text"
                    label="文件源码"
                    multiline
                  />
                ) : (
                  <>
                    <div
                      className="wbf-visual-editor"
                      onFocus={() => select("text", "文档正文")}
                    >
                      <TextBlocks
                        text={body.text}
                        query={query}
                        onClick={() => select("text", "文档正文")}
                        onSelection={textSelection}
                        onEdit={
                          readOnly
                            ? undefined
                            : (index, text) => {
                                const blocks = body.text.split(/\n\n+/);
                                if (blocks[index] !== text) {
                                  blocks[index] = text;
                                  void change("text", blocks.join("\n\n"));
                                }
                              }
                        }
                      />
                    </div>
                    <button
                      className="wbf-edit-text"
                      onClick={() => setSource(true)}
                    >
                      编辑正文
                    </button>
                  </>
                )}
              </article>
            )}
            {f.kind === "html" && (
              <div className="wbf-web-report">
                <div className="wbf-web-hero">
                  <span>RUIXING OFFICE</span>
                  {visual}
                </div>
                <div className="wbf-web-metrics">
                  <div>
                    <span>设备数量</span>
                    <strong>30 套</strong>
                  </div>
                  <div>
                    <span>客户报价</span>
                    <strong>{money(report.revenue)}</strong>
                  </div>
                  <div>
                    <span>毛利率</span>
                    <strong>{report.margin.toFixed(1)}%</strong>
                  </div>
                </div>
                {edit && !readOnly && (
                  <FieldEditor
                    s={s}
                    v={v}
                    f={f}
                    path="text"
                    label="网页文本内容"
                    multiline
                  />
                )}
              </div>
            )}
            {f.kind === "pdf" && (
              <article className="wbf-pdf">
                <TextBlocks
                  text={body.text.split(/\n\n---\n\n/)[page] || ""}
                  query={query}
                />
                <footer>
                  澄星设计 · 客户需求确认　{page + 1} /{" "}
                  {body.text.split(/\n\n---\n\n/).length}
                </footer>
              </article>
            )}
            {f.kind === "image" && (
              <img
                className="wbf-image-preview"
                src={f.asset}
                alt={f.content}
              />
            )}
            {f.kind === "video" && <video controls src={f.asset} style={{maxWidth:"100%",maxHeight:"70vh"}}/>}
            {f.kind === "audio" && (
              <div className="wbf-audio-preview">
                <I.Music size={60} />
                <h2>{f.name}</h2>
                <audio controls src={f.asset} preload="metadata" />
              </div>
            )}
          </div>
        </div>
      </div>
      {v.selection && (
        <button className="wbf-selection" onClick={ai}>
          <I.Sparkles size={16} />
          AI 编辑 ·{" "}
          {v.selection.paths.length > 1
            ? v.selection.paths.length + " 个对象"
            : v.selection.text.slice(0, 24)}
        </button>
      )}
      <footer className="wbf-bottom">
        <span>
          {f.kind === "slides"
            ? "第 " +
              (slide + 1) +
              " 页，共 " +
              (body.slides?.length || 1) +
              " 页"
            : f.kind === "pdf"
              ? "第 " +
                (page + 1) +
                " 页，共 " +
                body.text.split(/\n\n---\n\n/).length +
                " 页"
              : bodyText(body).length + " 字"}
        </span>
        {f.kind === "pdf" && (
          <>
            <button
              aria-label="PDF 上一页"
              disabled={!page}
              onClick={() => setPage(page - 1)}
            >
              <I.ChevronLeft size={16} />
            </button>
            <button
              aria-label="PDF 下一页"
              disabled={page >= body.text.split(/\n\n---\n\n/).length - 1}
              onClick={() => setPage(page + 1)}
            >
              <I.ChevronRight size={16} />
            </button>
          </>
        )}
        <span />
        <button
          aria-label="缩小文件"
          onClick={() => setZoom(Math.max(50, zoom - 10))}
        >
          <I.Minus size={13} />
        </button>
        <span>{zoom}%</span>
        <button
          aria-label="放大文件"
          onClick={() => setZoom(Math.min(200, zoom + 10))}
        >
          <I.Plus size={13} />
        </button>
        {f.officeId && (
          <button
            onClick={() =>
              onGuard(() => command("office-open", { id: f.officeId }), [f.id])
            }
          >
            在 WPS 中打开 <I.ArrowUpRight size={14} />
          </button>
        )}
      </footer>
    </section>
  );
}
export function WorkBuddyFileBrowser({ s }: { s: State }) {
  const b = browserState(s),
    v = b.windows.at(-1)!;
  const [plus, setPlus] = useState(false),
    [picker, setPicker] = useState(false),
    [account, setAccount] = useState(false),
    [tree, setTree] = useState(false),
    [menu, setMenu] = useState<{ id: string } | null>(null),
    [prompt, setPrompt] = useState<{
      ids: string[];
      action: () => void;
    } | null>(null);
  const dragging = useRef<{ id: string; x: number; y: number } | null>(null);
  const f = s.workbuddy.files.find((f) => f.id === v.active);
  const guard = (action: () => void, ids = v.tabs) => {
    const dirty = ids.filter((id) => fileDirty(s, v, id));
    if (dirty.length) setPrompt({ ids: dirty, action });
    else action();
  };
  const close = (id: string, mode?: string) => {
    const ids =
      mode === "other"
        ? v.tabs.filter((x) => x !== id)
        : mode === "right"
          ? v.tabs.slice(v.tabs.indexOf(id) + 1)
          : [id];
    guard(
      () => run("close", { view: v.id, file: id, mode, choice: "discard" }),
      ids,
    );
    setMenu(null);
  };
  useBack(() => {
    if (prompt) {
      setPrompt(null);
      return true;
    }
    if (plus || picker || account || menu) {
      setPlus(false);
      setPicker(false);
      setAccount(false);
      setMenu(null);
      return true;
    }
    if (v.ai) {
      run("ai", { view: v.id, open: false });
      return true;
    }
    guard(() => run("exit", { view: v.id, choice: "discard" }));
    return true;
  }, 110);
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "w" && v.active) {
        e.preventDefault();
        close(v.active);
      }
      if (e.key === "Escape") {
        setPlus(false);
        setPicker(false);
        setMenu(null);
      }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [s.revision]);
  async function savePrompt() {
    if (!prompt) return;
    for (const id of prompt.ids) {
      const ack = await run("save", { view: v.id, file: id });
      if (!ack.ok) return;
    }
    const action = prompt.action;
    setPrompt(null);
    action();
  }
  return (
    <div className="wbf-window">
      <header className="wbf-tabs">
        <button className="wbf-back" aria-label="返回" onClick={navigateBack}>
          <I.ChevronLeft size={23} />
        </button>
        <div className="wbf-tab-list">
          {v.tabs.map((id) => {
            const x = s.workbuddy.files.find((f) => f.id === id)!;
            return (
              <div
                key={id}
                className={"wbf-tab " + (id === v.active ? "active" : "")}
                data-file-tab={id}
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest("button[aria-label]")) return;
                  dragging.current = { id, x: e.clientX, y: e.clientY };
                  e.currentTarget.setPointerCapture(e.pointerId);
                  e.currentTarget.classList.add("dragging");
                }}
                onPointerUp={(e) => {
                  const drag = dragging.current;
                  dragging.current = null;
                  e.currentTarget.classList.remove("dragging");
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
                  if (!drag) return;
                  const moved = Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10;
                  const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-file-tab]")?.dataset.fileTab;
                  if (moved && target && target !== drag.id) {
                    const tabs = v.tabs.filter((t) => t !== drag.id);
                    tabs.splice(tabs.indexOf(target), 0, drag.id);
                    void run("reorder", { view: v.id, tabs });
                  } else if (!moved) void run("tab", { view: v.id, file: id });
                }}
                onPointerCancel={(e) => { dragging.current = null; e.currentTarget.classList.remove("dragging"); }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenu({ id });
                }}
              >
                <button onClick={(e) => { if (e.detail === 0) void run("tab", { view: v.id, file: id }); }}>
                  <FileTypeIcon file={x} />
                  <span>{x.name}</span>
                  {fileDirty(s, v, id) && <i />}
                </button>
                <button aria-label={"关闭 " + x.name} onClick={() => close(id)}>
                  <I.X size={14} />
                </button>
                <button
                  aria-label={"标签菜单 " + x.name}
                  onClick={() => setMenu({ id })}
                >
                  <I.ChevronDown size={12} />
                </button>
              </div>
            );
          })}
        </div>
        <button aria-label="新建或打开文件" onClick={() => setPlus(!plus)}>
          <I.Plus size={20} />
        </button>
        <span />
        {f && (
          <button
            aria-label="和 WorkBuddy 对话"
            className={v.ai ? "active" : ""}
            onClick={() => run("ai", { view: v.id, open: !v.ai })}
          >
            <I.MessageCircle size={18} />和 WorkBuddy 对话
          </button>
        )}
        <button aria-label="工作空间目录" onClick={() => setTree(!tree)}>
          <I.FolderTree size={19} />
        </button>
        <button aria-label="文件账号菜单" onClick={() => setAccount(!account)}>
          <img src="./assets/apps/workbuddy.svg" alt="" />
        </button>
        <ConnectionButton />
      </header>
      {plus && (
        <div className="wbf-plus-menu">
          <b>新建文件</b>
          {[
            ["word", "文档"],
            ["sheet", "表格"],
            ["slides", "幻灯片"],
            ["markdown", "Markdown"],
          ].map(([format, label]) => (
            <button
              key={format}
              onClick={() =>
                run("create", { view: v.id, format }).then(() => setPlus(false))
              }
            >
              <I.FilePlus size={16} />
              {label}
            </button>
          ))}
          <hr />
          <button
            onClick={() => {
              setPicker(true);
              setPlus(false);
            }}
          >
            <I.FolderOpen size={16} />
            打开文件
          </button>
          <h4>最近打开</h4>
          {b.recent.map((id) => {
            const x = s.workbuddy.files.find((f) => f.id === id);
            return (
              x && (
                <button
                  key={id}
                  onClick={() =>
                    run("tab", { view: v.id, file: id }).then(() =>
                      setPlus(false),
                    )
                  }
                >
                  <FileTypeIcon file={x} />
                  {x.name}
                </button>
              )
            );
          })}
        </div>
      )}
      {menu && (
        <div className="wbf-tab-menu">
          {[
            ["current", "关闭"],
            ["other", "关闭其他标签"],
            ["right", "关闭右侧标签"],
          ].map(([mode, label]) => (
            <button
              key={mode}
              onClick={() =>
                close(menu.id, mode === "current" ? undefined : mode)
              }
            >
              {label}
            </button>
          ))}
          <hr />
          <button
            onClick={() => {
              const x = s.workbuddy.files.find((f) => f.id === menu.id)!;
              clipboardWrite("/" + x.folder + "/" + x.name)
                .then(() => toast("已复制路径"))
                .catch(() => toast("无法复制，请重试"));
              setMenu(null);
            }}
          >
            复制路径
          </button>
          <button
            onClick={() => {
              setTree(true);
              setMenu(null);
            }}
          >
            打开文件位置
          </button>
          <button
            onClick={() => {
              guard(
                () => run("open", { file: menu.id, newWindow: true }),
                [menu.id],
              );
              setMenu(null);
            }}
          >
            在新窗口打开
          </button>
        </div>
      )}
      {account && (
        <div className="wbf-account">
          <b>陈朗 · 锐行办公</b>
          <button
            onClick={() =>
              guard(() => run("exit", { view: v.id, choice: "discard" }))
            }
          >
            打开 WorkBuddy 主页
          </button>
          <button
            onClick={() =>
              guard(() =>
                run("exit", { view: v.id, choice: "discard" }).then(() =>
                  command("wb-navigate", { page: "settings" }),
                ),
              )
            }
          >
            设置
          </button>
        </div>
      )}
      <div className="wbf-body">
        {tree && (
          <aside className="wbf-workspace">
            <WorkspaceTree
              s={s}
              onOpen={(id) => run("tab", { view: v.id, file: id })}
            />
          </aside>
        )}
        {f ? (
          <FileSurface
            key={v.id + ":" + f.id}
            s={s}
            v={v}
            f={f}
            onGuard={guard}
          />
        ) : (
          <div className="wbf-empty">
            <I.Files size={58} />
            <h1>打开文件，继续工作</h1>
            <button onClick={() => setPicker(true)}>打开文件</button>
            <button onClick={() => setPlus(true)}>新建文件</button>
            <h3>最近打开</h3>
            {b.recent.slice(0, 5).map((id) => {
              const x = s.workbuddy.files.find((f) => f.id === id);
              return (
                x && (
                  <button
                    key={id}
                    onClick={() => run("tab", { view: v.id, file: id })}
                  >
                    {x.name}
                  </button>
                )
              );
            })}
          </div>
        )}
        {f && v.ai && (
          <>
            <div
              className="wbf-divider"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                  const rect =
                    e.currentTarget.parentElement!.getBoundingClientRect();
                  run("width", {
                    view: v.id,
                    width: ((rect.right - e.clientX) / rect.width) * 100,
                  });
                }
              }}
            />
            <FileAI key={v.id + ":" + f.id} s={s} v={v} f={f} onGuard={guard} />
          </>
        )}
      </div>
      {picker && (
        <div className="wbf-overlay">
          <div className="wbf-picker" role="dialog" aria-label="打开演示文件">
            <header>
              <h2>打开文件</h2>
              <button
                aria-label="关闭文件选择"
                onClick={() => setPicker(false)}
              >
                <I.X />
              </button>
            </header>
            <WorkspaceTree
              s={s}
              onOpen={(id) =>
                run("tab", { view: v.id, file: id }).then(() =>
                  setPicker(false),
                )
              }
            />
          </div>
        </div>
      )}
      {prompt && (
        <div className="wbf-overlay">
          <div
            className="wbf-save-dialog"
            role="dialog"
            aria-label="未保存修改"
          >
            <h2>保存修改？</h2>
            <p>
              {prompt.ids
                .map((id) => s.workbuddy.files.find((f) => f.id === id)?.name)
                .join("、")}
            </p>
            <footer>
              <button onClick={() => setPrompt(null)}>取消</button>
              <button
                onClick={() => {
                  for (const id of prompt.ids)
                    void run("reload", { view: v.id, file: id });
                  const action = prompt.action;
                  setPrompt(null);
                  action();
                }}
              >
                不保存
              </button>
              <button className="primary" onClick={savePrompt}>
                保存
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
export function WorkBuddyResults({ s }: { s: State }) {
  const b = browserState(s),
    v = b.panel,
    f = s.workbuddy.files.find((f) => f.id === v.active);
  const [dirtyPrompt, setDirtyPrompt] = useState<{action: () => void; ids: string[]} | null>(null);
  useEffect(() => {
    if (
      s.workbuddy.previewActive &&
      v.active !== s.workbuddy.previewActive
    )
      void run("tab", { view: "panel", file: s.workbuddy.previewActive });
  }, [s.workbuddy.previewActive]);
  const open = (id: string) => {
    void run("tab", { view: "panel", file: id });
  };
  const guard = (action: () => void, ids = v.tabs) => {
    const dirty = ids.filter(id => fileDirty(s, v, id));
    if (dirty.length) setDirtyPrompt({ action, ids: dirty });
    else action();
  };
  useBack(() => { if (!dirtyPrompt) return false; setDirtyPrompt(null); return true; }, 117);
  return (
    <aside className="wb-file-panel wbf-results">
      <nav className="wbf-result-modes">
        {[
          ["artifacts", "产物"],
          ["workspace", "工作空间文件"],
          ["changes", "变更"],
          ["browser", "浏览器"],
        ].map(([mode, name]) => (
          <button
            key={mode}
            className={b.panelMode === mode ? "active" : ""}
            onClick={() => run("mode", { mode })}
          >
            {name}
          </button>
        ))}
      </nav>
      {b.panelMode === "browser" ? (
        <LocalBrowser />
      ) : (
        <>
          <div className="wb-preview-tabs">
            {v.tabs.map((id) => {
              const x = s.workbuddy.files.find((f) => f.id === id);
              return (
                x && (
                  <div key={id}>
                    <button
                      className={id === v.active ? "active" : ""}
                      onClick={() => open(id)}
                    >
                      {x.name}
                    </button>
                    <button
                      aria-label={"关闭预览 " + x.name}
                      onClick={() =>
                        guard(
                          () =>
                            run("close", {
                              view: "panel",
                              file: id,
                              choice: "discard",
                            }),
                          [id],
                        )
                      }
                    >
                      <I.X size={12} />
                    </button>
                  </div>
                )
              );
            })}
            <button
              aria-label="文件目录"
              onClick={() =>
                command("wb-file-panel", { open: !s.workbuddy.filePanel })
              }
            >
              <I.FolderTree size={16} />
            </button>
          </div>
          {b.panelMode === "workspace" || s.workbuddy.filePanel ? (
            <div className="wb-directory">
              <WorkspaceTree s={s} onOpen={open} />
            </div>
          ) : null}
          {b.panelMode === "artifacts" && (
            <div className="wbf-artifact-list">
              {s.workbuddy.tasks
                .find((t) => t.id === s.workbuddy.task)
                ?.files.map((id) => {
                  const x = s.workbuddy.files.find((f) => f.id === id);
                  return (
                    x && (
                      <button key={id} onClick={() => open(id)}>
                        <FileTypeIcon file={x} />
                        {x.name}
                      </button>
                    )
                  );
                })}
            </div>
          )}
          {b.panelMode === "changes" ? (
            <div className="wbf-changes">
              {Object.entries(b.docs).flatMap(([id, d]) =>
                d.changes.map((change) => (
                  <details key={change.id}>
                    <summary>
                      {s.workbuddy.files.find((f) => f.id === id)?.name} ·{" "}
                      {change.source}
                    </summary>
                    <del>{bodyText(change.before)}</del>
                    <ins>{bodyText(change.after)}</ins>
                  </details>
                )),
              )}
              <p>
                {Object.values(b.docs).every((d) => !d.changes.length)
                  ? "暂无文件修改"
                  : ""}
              </p>
            </div>
          ) : (
            f && (
              <>
                <div className="wbf-inline-preview">
                  <div className="wb-preview-body">
                    <FileSurface key={f.id} s={s} v={v} f={f} onGuard={guard} />
                  </div>
                </div>
                <footer>
                  <button
                    onClick={() =>
                      guard(() => run("open", { file: f.id }), [f.id])
                    }
                  >
                    <I.Maximize2 size={15} />
                    独立窗口打开
                  </button>
                  <button
                    onClick={() => run("ai", { view: "panel", open: !v.ai })}
                  >
                    AI 对话
                  </button>
                </footer>
                {v.ai && <FileAI key={f.id} s={s} v={v} f={f} onGuard={guard} />}
              </>
            )
          )}
        </>
      )}
      {dirtyPrompt && (
        <div className="wbf-panel-save">
          <h3>保存当前修改？</h3>
          <button onClick={() => setDirtyPrompt(null)}>取消</button>
          <button
            onClick={() => {
              for (const id of dirtyPrompt.ids)
                run("reload", { view: "panel", file: id });
              dirtyPrompt.action();
              setDirtyPrompt(null);
            }}
          >
            不保存
          </button>
          <button
            onClick={async () => {
              for (const id of dirtyPrompt.ids)
                if (fileDirty(s, v, id)) {
                  const a = await run("save", { view: "panel", file: id });
                  if (!a.ok) return;
                }
              dirtyPrompt.action();
              setDirtyPrompt(null);
            }}
          >
            保存
          </button>
        </div>
      )}
    </aside>
  );
}
function LocalBrowser() {
  const pages = ["项目概览", "设备配置", "交付安排"];
  const [tabs, setTabs] = useState([{ id: 1, history: [0], at: 0 }]),
    [active, setActive] = useState(1),
    [address, setAddress] = useState("项目概览"),
    [zoom, setZoom] = useState(100),
    [query, setQuery] = useState(""),
    [refresh, setRefresh] = useState(0);
  const tab = tabs.find((t) => t.id === active)!;
  const go = (index: number) => {
    setTabs(
      tabs.map((t) =>
        t.id === active
          ? {
              ...t,
              history: [...t.history.slice(0, t.at + 1), index],
              at: t.at + 1,
            }
          : t,
      ),
    );
    setAddress(pages[index]);
  };
  return (
    <div className="wbf-local-browser">
      <nav>
        {tabs.map((t) => (
          <div key={t.id}>
            <button
              onClick={() => {
                setActive(t.id);
                setAddress(pages[t.history[t.at]]);
              }}
            >
              {pages[t.history[t.at]]}
            </button>
            <button
              aria-label={"关闭网页 " + t.id}
              onClick={() => {
                const rest = tabs.filter((x) => x.id !== t.id);
                if (!rest.length) {
                  const id = Date.now();
                  setTabs([{ id, history: [0], at: 0 }]);
                  setActive(id);
                } else {
                  setTabs(rest);
                  if (active === t.id) setActive(rest.at(-1)!.id);
                }
              }}
            >
              <I.X size={12} />
            </button>
          </div>
        ))}
        <button
          aria-label="新建网页标签"
          onClick={() => {
            const id = Date.now();
            setTabs([...tabs, { id, history: [0], at: 0 }]);
            setActive(id);
          }}
        >
          <I.Plus size={17} />
        </button>
      </nav>
      <header>
        <button
          aria-label="网页后退"
          disabled={!tab.at}
          onClick={() =>
            setTabs(
              tabs.map((t) => (t.id === active ? { ...t, at: t.at - 1 } : t)),
            )
          }
        >
          <I.ChevronLeft size={17} />
        </button>
        <button
          aria-label="网页前进"
          disabled={tab.at >= tab.history.length - 1}
          onClick={() =>
            setTabs(
              tabs.map((t) => (t.id === active ? { ...t, at: t.at + 1 } : t)),
            )
          }
        >
          <I.ChevronRight size={17} />
        </button>
        <button aria-label="刷新网页" onClick={() => setRefresh(refresh + 1)}>
          <I.RefreshCw size={17} />
        </button>
        <input
          aria-label="内置页面地址"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const index = pages.findIndex((x) => address.includes(x));
              if (index < 0) toast("请选择项目概览、设备配置或交付安排");
              else go(index);
            }
          }}
        />
      </header>
      <div className="wbf-web-tools">
        <input
          aria-label="查找网页"
          placeholder="查找内容"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={() => setZoom(zoom - 10)}>−</button>
        <span>{zoom}%</span>
        <button onClick={() => setZoom(zoom + 10)}>＋</button>
      </div>
      <article key={refresh} style={{ zoom: zoom / 100 }}>
        <h1>{pages[tab.history[tab.at]]}</h1>
        <TextBlocks
          query={query}
          text={
            [
              "澄星设计新办公室采购项目\n\n30 套办公设备，预算上限 20 万元。",
              "轻舟 Pro 商务笔记本\n\n明境 27 英寸显示器\n\n畅联 USB-C 扩展坞",
              "10 月 24 日设备到货\n\n10 月 26 日配置与联调\n\n10 月 28 日客户验收",
            ][tab.history[tab.at]]
          }
        />
        {pages.map((p, i) => (
          <button key={p} onClick={() => go(i)}>
            {p}
          </button>
        ))}
      </article>
    </div>
  );
}
