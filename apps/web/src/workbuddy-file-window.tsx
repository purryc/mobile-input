import { useEffect, useRef, useState } from "react";
import * as I from "lucide-react";
import { documentDirty } from "../../../packages/core/workbuddy-documents";
import { command, currentState, openFileWindow, role, uid, useRuntime } from "./runtime";
import { useBack } from "./back";
import { WorkBuddyCanvas } from "./workbuddy-canvas";
import { WorkBuddyDocumentEditor } from "./workbuddy-document-editor";
import "./workbuddy-file-window.css";
import { documentOperation } from "./workbuddy-document-operation";

export function WorkBuddyFileWindow() {
  const r = useRuntime(), w = r.state.workbuddy, space = w.fileWorkspace;
  const file = w.files.find(f => f.id === space.active), d = file ? space.documents[file.id] : undefined;
  const page = d?.pages.find(p => p.id === space.pageId), available = role === "tablet" || r.connected;
  const [aiOpen, setAiOpen] = useState(false), [plus, setPlus] = useState(false), [closing, setClosing] = useState<string | null>(null), [error, setError] = useState(""), [width, setWidth] = useState(330);
  const [tabMenu, setTabMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const drag = useRef(""), lock = useRef(false), everOpen = useRef(false);
  useEffect(() => { if (space.open) everOpen.current = true; else if (everOpen.current && role === "filebrowser") window.close(); }, [space.open]);
  const draft = d && Object.values(d.drafts).filter(a => ["editing", "preview"].includes(a.status)).at(-1);
  const dirty = d && documentDirty(d);
  async function perform(type: string, extra: Record<string, unknown> = {}) {
    if (!file || !d || lock.current) return;
    lock.current = true;
    try { const ack = await documentOperation(type, { fileId: file.id, documentRevision: d.revision, ...extra }); if (!ack.ok) setError(ack.error || "操作失败"); else setError(""); } finally { lock.current = false; }
  }
  async function close(id: string, action?: "save" | "discard" | "clean") {
    const doc = space.documents[id]; if (!doc) return;
    if (!action && documentDirty(doc)) { setClosing(id); return; }
    if (lock.current) return; lock.current = true;
    const ack = await documentOperation("wb-window-close", { fileId: id, revision: doc.revision, action: action || "clean" }); lock.current = false;
    if (ack.ok) { setClosing(null); setError(""); } else setError(ack.error || "关闭失败");
  }
  useBack(() => { if (closing) setClosing(null); else if (tabMenu) setTabMenu(null); else if (plus) setPlus(false); else if (space.active) void close(space.active); return true; }, 160);
  useEffect(() => {
    function key(e: KeyboardEvent) { if (!(e.ctrlKey || e.metaKey)) return; if (e.key.toLowerCase() === "s") { e.preventDefault(); if (d && file?.kind !== "markdown") void perform("wb-doc-save"); } if (e.key.toLowerCase() === "w") { e.preventDefault(); if (file) void close(file.id); } }
    function unload(e: BeforeUnloadEvent) { if (space.tabs.some(id => documentDirty(space.documents[id]))) { e.preventDefault(); e.returnValue = ""; } }
    window.addEventListener("keydown", key); window.addEventListener("beforeunload", unload);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("beforeunload", unload); };
  }, [space.active, d?.revision, dirty]);
  async function edit() {
    if (!d?.selection || !file) return;
    const ack = await command("wb-doc-draft-open", { fileId: file.id, documentRevision: d.revision, draftId: uid(), selection: d.selection, source: "text" });
    if (ack.ok) setAiOpen(true); else setError(ack.error || "无法编辑");
  }
  async function select(ids: string[]) { if (file && d && page) await command("wb-doc-select", { fileId: file.id, documentRevision: d.revision, pageId: page.id, objectIds: ids }); }
  if (!space.open) return role === "filebrowser" ? <main className="wb-file-window wb-file-empty"><h1>文件窗口</h1><p>{r.connected ? "标签已关闭，请从工作台打开文件" : "等待主工作台连接"}</p><button onClick={() => window.close()}>关闭窗口</button></main> : null;
  return <main className="wb-file-window" aria-label="WorkBuddy 文件窗口">
    <header className="wb-window-tabs"><img src="./assets/apps/workbuddy.svg" alt="WorkBuddy" />{space.tabs.map(id => { const f = w.files.find(f => f.id === id); return f && <div className={id === file?.id ? "active" : ""} key={id} draggable onDragStart={() => { drag.current = id; }} onDragOver={e => e.preventDefault()} onDrop={() => { const ids = space.tabs.filter(id => id !== drag.current); ids.splice(ids.indexOf(id), 0, drag.current); void command("wb-window-reorder", { fileId: id, tabs: ids }); }} onContextMenu={e => { e.preventDefault(); const root = e.currentTarget.closest(".wb-file-window")!.getBoundingClientRect(); setTabMenu({ id, x: Math.min(e.clientX - root.left, root.width - 180), y: e.clientY - root.top }); }}><button onClick={() => command("wb-window-open", { fileId: id })}><I.FileText size={15} />{f.name}{documentDirty(space.documents[id]) && <span aria-label="未保存">●</span>}</button><button aria-label={`关闭标签 ${f.name}`} onClick={() => close(id)}><I.X size={13} /></button></div>; })}<button aria-label="新建或打开文件" onClick={() => setPlus(!plus)}><I.Plus size={19} /></button><span className="wb-window-demo">本地演示</span></header>
    {plus && <aside className="wb-window-plus" aria-label="文件菜单"><button onClick={async () => { await documentOperation("wb-window-new", { kind: "word" }); setPlus(false); }}>新建文档（纯文本）</button><button onClick={async () => { await documentOperation("wb-window-new", { kind: "markdown" }); setPlus(false); }}>新建 Markdown</button><h4>工作空间文件</h4>{w.files.map(f => <button key={f.id} onClick={async () => { await command("wb-window-open", { fileId: f.id }); setPlus(false); }}>{f.name}</button>)}<h4>最近文件</h4>{space.recent.map(id => w.files.find(f => f.id === id)).filter(Boolean).map(f => <button key={f!.id} onClick={async () => { await command("wb-window-open", { fileId: f!.id }); setPlus(false); }}>{f!.name}</button>)}</aside>}
    <nav className="wb-window-toolbar"><button aria-label="返回并关闭当前标签" onClick={() => file && close(file.id)}><I.ChevronLeft size={18} /></button><strong>{file?.name}</strong><span role="status">{file?.kind === "markdown" ? "自动保存" : dirty ? "未保存" : "已保存到本地演示"}</span>{file?.kind !== "markdown" && <button disabled={!available || !d || !dirty} onClick={() => perform("wb-doc-save")}><I.Save size={16} />保存</button>}<button disabled={!available || !d?.undo.length} onClick={() => perform("wb-doc-undo")} aria-label="撤销当前文档"><I.Undo2 size={16} /></button><button disabled={!available || !d?.redo.length} onClick={() => perform("wb-doc-redo")} aria-label="重做当前文档"><I.Redo2 size={16} /></button>{!!d?.pages.length && <button disabled={!available} onClick={() => perform("wb-doc-reset")}>重置演示</button>}<button className="wb-green" disabled={!available || !d?.selection} onClick={edit}><I.Sparkles size={16} />AI 编辑</button><button onClick={() => setAiOpen(!aiOpen)}>{aiOpen ? "收起对话" : "和 WorkBuddy 对话"}</button>{role === "tablet" && <button onClick={openFileWindow} aria-label="在独立浏览器窗口打开"><I.ExternalLink size={16} /></button>}</nav>
    {tabMenu && <aside className="wb-tab-menu" role="menu" aria-label="标签操作" style={{ left: Math.max(10, tabMenu.x), top: tabMenu.y }}><button role="menuitem" onClick={() => { const id = tabMenu.id; setTabMenu(null); void close(id); }}>关闭标签</button>{[-1, 1].map(delta => <button key={delta} role="menuitem" disabled={space.tabs.indexOf(tabMenu.id) + delta < 0 || space.tabs.indexOf(tabMenu.id) + delta >= space.tabs.length} onClick={() => { const ids = [...space.tabs], old = ids.indexOf(tabMenu.id); ids.splice(old, 1); ids.splice(old + delta, 0, tabMenu.id); void command("wb-window-reorder", { fileId: tabMenu.id, tabs: ids }); setTabMenu(null); }}>{delta < 0 ? "向左移动标签" : "向右移动标签"}</button>)}<button role="menuitem" onClick={() => setTabMenu(null)}>取消</button></aside>}
    <div className="wb-window-body">
      {!!d?.pages.length && <aside className="wb-page-thumbnails" aria-label="页面缩略图">{d.pages.map((p, i) => <div key={p.id} className={page?.id === p.id ? "active" : ""}><button aria-label={`第 ${i + 1} 页 ${p.title}`} onClick={() => command("wb-doc-page", { fileId: file!.id, documentRevision: d.revision, pageId: p.id })}><WorkBuddyCanvas page={p} /><small>{i + 1} · {p.title}</small></button><button className="wb-select-page" aria-label={`选择整页 ${i + 1}`} onClick={async () => { if (page?.id !== p.id) await command("wb-doc-page", { fileId: file!.id, documentRevision: d.revision, pageId: p.id }); await command("wb-doc-select", { fileId: file!.id, documentRevision: d.revision, pageId: p.id, objectIds: p.objects.map(o => o.id) }); }}>选择整页</button></div>)}</aside>}
      <section className="wb-window-stage">{page ? <WorkBuddyCanvas page={page} selected={d?.selection?.objectIds} pointer={space.pointer && space.pointer.fileId === file?.id && space.pointer.pageId === page.id ? space.pointer : null} onSelect={(id, additive) => select(additive ? [...new Set([...(d?.selection?.objectIds || []), id])] : [id])} onBox={box => select(page.objects.filter(o => o.x < Math.max(box.x, box.x2) * 960 && o.x + o.width > Math.min(box.x, box.x2) * 960 && o.y < Math.max(box.y, box.y2) * 540 && o.y + o.height > Math.min(box.y, box.y2) * 540).map(o => o.id))} /> : file?.id === "receipt-year-table" ? <ReceiptTable /> : d && (file?.kind === "markdown" || file?.kind === "word") ? <PlainDocument key={d.fileId} fileId={d.fileId} text={d.text} revision={d.revision} /> : <article className="wb-plain-preview"><small>只读预览 · 旧文件未转换为可编辑对象</small><pre>{file?.content}</pre></article>}</section>
      {aiOpen && <><div className="wb-ai-resizer" onPointerDown={e => { const start = e.clientX, old = width, handle = e.currentTarget; handle.setPointerCapture(e.pointerId); handle.onpointermove = ev => setWidth(Math.max(280, Math.min(520, old + start - ev.clientX))); handle.onpointerup = () => { handle.onpointermove = null; handle.onpointerup = null; }; }} /><aside className="wb-window-ai" style={{ width }}><h3>WorkBuddy <small>{file?.name}</small></h3>{draft ? <WorkBuddyDocumentEditor key={draft.id} fileId={file!.id} draftId={draft.id} /> : <p>选择元素或整页，再点 AI 编辑</p>}{d?.proposals.filter(p => p.status === "applied").map(p => <p className="wb-document-history" key={p.id}>{p.instruction}<small>已应用 · 可撤销</small></p>)}</aside></>}
    </div>
    <footer className="wb-window-footer"><span>{page ? `${(d?.pages.findIndex(p => p.id === page.id) || 0) + 1} / ${d?.pages.length} 页` : file?.folder}</span><span>手机可输入与指向 · 本地保存</span></footer>
    {error && <p className="wb-window-error" role="alert">{error}</p>}
    {closing && <div className="wb-window-modal"><section role="dialog" aria-label="保存文件改动"><h2>保存文件改动？</h2><p>{w.files.find(f => f.id === closing)?.name} 存在未保存的修改</p><button onClick={() => setClosing(null)}>取消关闭</button><button onClick={() => close(closing, "discard")}>不保存并关闭</button><button className="wb-green" onClick={() => close(closing, "save")}>保存并关闭</button></section></div>}
    {role === "filebrowser" && !r.connected && <div className="wb-window-modal"><p>主工作台已关闭，编辑暂停</p></div>}
    {r.state.app !== "workbuddy" && <div className="wb-window-modal"><p>请在主工作台切回 WorkBuddy 后继续</p></div>}
  </main>;
}
function PlainDocument({ fileId, text, revision }: { fileId: string; text: string; revision: number }) {
  const [value, setValue] = useState(text), running = useRef(false), queued = useRef<string | null>(null);
  const rev = useRef(revision); rev.current = revision;
  useEffect(() => { if (!running.current && queued.current === null) setValue(text); }, [text]);
  async function update(next: string) { setValue(next); queued.current = next; if (running.current) return; running.current = true; try { while (queued.current !== null) { const v = queued.current; queued.current = null; const ack = await command("wb-doc-text", { fileId, text: v, documentRevision: rev.current }); if (!ack.ok) break; rev.current = currentState().workbuddy.fileWorkspace.documents[fileId].revision; } } finally { running.current = false; } }
  return <textarea className="wb-plain-document" aria-label="文件正文" value={value} onChange={e => update(e.target.value)} />;
}

function ReceiptTable(){const r=useRuntime().state.workbuddy.fileWorkspace.receipts;return <table className="wb-local-table" aria-label="本地票据表格"><thead><tr><th>日期</th><th>商店</th><th>项目</th><th>金额</th></tr></thead><tbody>{r.rows.map(row=><tr key={row.id}><td>{row.date}</td><td>{row.vendor}</td><td>{row.description}</td><td>{(row.cents/100).toFixed(2)}</td></tr>)}</tbody></table>;}
