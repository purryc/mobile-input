import { useRef, useState } from "react";
import * as I from "lucide-react";
import { command, currentState, uid, useRuntime } from "./runtime";
import { WorkBuddyCanvas } from "./workbuddy-canvas";
import { WorkBuddyDocumentEditor } from "./workbuddy-document-editor";
import { readDocumentDraftInput } from "./workbuddy-document-input";
import type { WbDocumentDraft, WbSelection } from "../../../packages/core/workbuddy-documents";
import "./workbuddy-file-window.css";

export function PhoneWorkBuddyDocument({ fileId, onReceipts, resumed }: { fileId: string; onReceipts?: () => void; resumed?: boolean }) {
  const r = useRuntime(), w = r.state.workbuddy.fileWorkspace, d = w.documents[fileId], file = r.state.workbuddy.files.find(f => f.id === fileId);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false), [boxMode, setBoxMode] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(() => d && Object.values(d.drafts).filter(a => ["editing", "preview"].includes(a.status) && !readDocumentDraftInput(fileId, a.id)?.canceled).at(-1)?.id || null);
  const page = d?.pages.find(p => p.id === w.pageId), draft = draftId ? d?.drafts[draftId] : undefined;
  const gesture = useRef(uid()), sequence = useRef(0), lastMove = useRef(0), start = useRef<{ x: number; y: number } | null>(null), pointerAnchor = useRef<{ documentRevision: number; pointerEpoch: number; pageId: string } | null>(null), lock = useRef(false);
  if (!d || !file) return <p>文档已不存在</p>;
  const ended = draft && ["applied", "canceled"].includes(draft.status), editing = draft && !ended;
  const selected = page && d.selection?.pageId === page.id ? d.selection.objectIds : [];
  function retainedText(original: WbDocumentDraft) { const saved = readDocumentDraftInput(fileId, original.id); return saved && (saved.dirty || saved.canceled) ? saved.text : original.text; }
  const canceled = Object.values(d.drafts).filter(a => a.status !== "applied" && (a.status === "canceled" || readDocumentDraftInput(fileId, a.id)?.canceled) && retainedText(a).trim()).at(-1);
  async function openDraft(source: "text" | "voice-demo", text?: string, originalSelection?: WbSelection) {
    const selection = originalSelection || d.selection;
    if (lock.current || !selection || !r.connected) return; lock.current = true; setBusy(true);
    try {
      if (originalSelection) {
        if (originalSelection.documentRevision !== d.revision) { setError("原文档版本已变化，取消的文字仍保留；请核对后重新选择并确认"); return; }
        const pageAck = await command("wb-doc-page", { fileId, documentRevision: d.revision, pageId: originalSelection.pageId });
        if (!pageAck.ok) { setError(pageAck.error || "无法返回原页面"); return; }
        const selectAck = await command("wb-doc-select", { fileId, documentRevision: d.revision, pageId: originalSelection.pageId, objectIds: originalSelection.objectIds });
        if (!selectAck.ok) { setError(selectAck.error || "原对象已变化，文字保留"); return; }
      }
      if (draft && ["editing", "preview"].includes(draft.status)) {
        const canceled = await command("wb-doc-cancel", { fileId, draftId: draft.id, documentRevision: d.revision }); if (!canceled.ok) { setError(canceled.error || "原草稿未取消"); return; }
      }
      const id = uid(), ack = await command("wb-doc-draft-open", { fileId, documentRevision: d.revision, selection, draftId: id, source });
      if (ack.ok) {
        if (text) { const next = currentState().workbuddy.fileWorkspace.documents[fileId].drafts[id]; await command("wb-doc-draft-edit", { fileId, draftId: id, documentRevision: d.revision, revision: 0, text, session: uid(), sequence: 1 }, { targetId: `wb:doc-draft:${id}`, targetRevision: next.targetRevision, app: "workbuddy" }); }
        setDraftId(id); setError("");
      } else setError(ack.error || "无法打开编辑");
    } finally { lock.current = false; setBusy(false); }
  }
  async function restoreCanceled(original: WbDocumentDraft) {
    const text = retainedText(original);
    // An offline Cancel may only be local. End the old draft before restoring it.
    const ack = await command("wb-doc-cancel", { fileId, draftId: original.id, documentRevision: d.revision });
    if (!ack.ok) { setError(ack.error || "请核对原草稿状态，文字已保留"); return; }
    await openDraft(original.source, text, original.selection);
  }
  function pos(e: React.PointerEvent) { const b = e.currentTarget.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)), y: Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)) }; }
  function point(e: React.PointerEvent, phase: "move" | "select" | "cancel") {
    if (!r.connected || !page || !pointerAnchor.current) return;
    const now = Date.now(); if (phase === "move" && now - lastMove.current < 34) return; lastMove.current = now;
    const xy = pos(e), anchor = pointerAnchor.current;
    void command("wb-doc-pointer", { fileId, ...anchor, gesture: gesture.current, sequence: ++sequence.current, ...xy, phase, ...(boxMode && phase === "select" && start.current ? { box: start.current } : {}) });
  }
  const matching = w.active === fileId && !!page;
  return <section className="wb-phone-document">
    <div className="wb-phone-document-context">
      <h2>{file.name}</h2>{!matching && <><p>工作台正在查看其他文件，原草稿保留</p><button disabled={!r.connected} onClick={() => command("wb-window-open", { fileId })}>回到此文件</button></>}
      {page && <>
        <div className="wb-phone-page-nav">{d.pages.map((p, i) => <button key={p.id} aria-label={`手机第 ${i + 1} 页`} className={page.id === p.id ? "active" : ""} disabled={!r.connected} onClick={() => command("wb-doc-page", { fileId, documentRevision: d.revision, pageId: p.id })}>{i + 1}</button>)}<button disabled={!r.connected} onClick={() => command("wb-doc-select", { fileId, documentRevision: d.revision, pageId: page.id, objectIds: page.objects.map(o => o.id) })}>选择整页</button></div>
        <WorkBuddyCanvas page={page} selected={selected} pointer={w.pointer?.fileId === fileId ? w.pointer : null} />
        <p role="status">{selected.length ? `已选择：${page.objects.filter(o => selected.includes(o.id)).map(o => o.role).join("、")}` : "点选对象，或用触控板指向"}</p>
        <div className="wb-phone-object-list" role="region" aria-label="页面对象">{page.objects.map(o => <button key={o.id} className={selected.includes(o.id) ? "active" : ""} disabled={!r.connected} onClick={() => command("wb-doc-select", { fileId, documentRevision: d.revision, pageId: page.id, objectIds: [o.id] })}>{o.role}</button>)}</div>
        <button className="wb-box-mode" onClick={() => setBoxMode(!boxMode)}>{boxMode ? "切换到点选" : "切换到框选"}</button>
        <div className="wb-phone-touchpad" role="application" aria-label="PPT 触控板" onPointerDown={e => { if (!r.connected) return; const s = currentState().workbuddy.fileWorkspace; pointerAnchor.current = { pointerEpoch: s.pointerEpoch, documentRevision: d.revision, pageId: page.id }; gesture.current = uid(); sequence.current = 0; start.current = pos(e); e.currentTarget.setPointerCapture(e.pointerId); point(e, "move"); }} onPointerMove={e => { if (start.current) point(e, "move"); }} onPointerUp={e => { point(e, "select"); start.current = null; }} onPointerCancel={e => { point(e, "cancel"); start.current = null; }}><I.MousePointer2 size={25} /><span>{boxMode ? "拖动框选" : "移动指针 · 松手点选"}</span></div>
      </>}
      {onReceipts && <button className="wb-receipt-notice" onClick={onReceipts}><I.ReceiptText size={16} />{r.state.workbuddy.fileWorkspace.receipts.missingMonths.length ? "票据任务缺少材料 · 去补充" : "票据示例已补齐 · 查看表格"}</button>}
      {ended && <p role="status">{draft.status === "applied" ? d.revision === draft.selection.documentRevision + 1 ? "修改已应用，当前文档可保存或撤销" : "该编辑已完成，当前文档又有后续变更" : "编辑已取消，文字已保留"}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
    <div className={"wb-phone-document-input" + (editing ? " has-editor" : "")}>{resumed && <small className="wb-resume-hint" role="status">已恢复原 PPT 草稿，请核对锁定对象与当前版本</small>}{editing ? <WorkBuddyDocumentEditor key={draft.id} fileId={fileId} draftId={draft.id} onCanceled={() => setDraftId(null)} onRebind={text => openDraft(draft.source, text)} /> : <>
      <div className="wb-document-entry"><button disabled={!r.connected || !d.selection || busy} onClick={() => openDraft("text")}><I.Type size={19} />文字修改</button><button disabled={!r.connected || !d.selection || busy} onClick={() => openDraft("voice-demo")}><I.Mic size={19} />演示语音</button></div>
      <div className="wb-document-entry"><DocumentAction fileId={fileId} type="wb-doc-save" label="保存文档" /><DocumentAction fileId={fileId} type="wb-doc-undo" label="撤销此文档" disabled={!d.undo.length} /><DocumentAction fileId={fileId} type="wb-doc-redo" label="重做此文档" disabled={!d.redo.length} /></div>
      <div className="wb-document-entry"><DocumentAction fileId={fileId} type="wb-doc-reset" label="重置此 PPT 演示" /></div>
      {canceled && <button disabled={!r.connected || busy} onClick={() => restoreCanceled(canceled)}>恢复上次取消的文字</button>}
    </>}</div>
  </section>;
}
function DocumentAction({ fileId, type, label, disabled }: { fileId: string; type: string; label: string; disabled?: boolean }) {
  const r = useRuntime(), [busy, setBusy] = useState(false), lock = useRef(false);
  const key = `mobile-input:wb-doc-action:${fileId}:${type}`;
  const pending = useRef<Record<string, unknown> | null>((() => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } })());
  async function act() {
    if (lock.current) return; lock.current = true; setBusy(true);
    try {
      if (!pending.current) { try { pending.current = JSON.parse(localStorage.getItem(key) || "null"); } catch {} }
      if (!pending.current) pending.current = { fileId, documentRevision: currentState().workbuddy.fileWorkspace.documents[fileId].revision, operationId: uid() };
      localStorage.setItem(key, JSON.stringify(pending.current));
      const ack = await command(type, pending.current);
      if (ack.ok || !/连接|回执/.test(ack.error || "")) { pending.current = null; localStorage.removeItem(key); }
    } finally { lock.current = false; setBusy(false); }
  }
  return <button disabled={!r.connected || busy || (disabled && !pending.current)} onClick={act}>{busy ? "等待回执…" : pending.current ? "重试原操作" : label}</button>;
}
