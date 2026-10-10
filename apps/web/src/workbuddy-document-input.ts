import { useEffect, useRef, useState } from "react";
import { documentDraftTarget } from "../../../packages/core/workbuddy-documents";
import { command, currentState, role, uid, useRuntime } from "./runtime";

function inputKey(fileId: string, draftId: string) { return `mobile-input:wb-doc-input:${role}:${fileId}:${draftId}`; }
export function readDocumentDraftInput(fileId: string, draftId: string): { text: string; dirty: boolean; canceled?: boolean; operation?: { type: string; value: Record<string, unknown> } | null } | null {
  try { const saved = JSON.parse(localStorage.getItem(inputKey(fileId, draftId)) || "null"); return typeof saved?.text === "string" ? saved : null; } catch { return null; }
}
export function useDocumentDraft(fileId: string, draftId: string) {
  const r = useRuntime(), remote = r.state.workbuddy.fileWorkspace.documents[fileId]?.drafts[draftId];
  const available = role === "tablet" || r.connected;
  const key = inputKey(fileId, draftId);
  const [saved] = useState(() => readDocumentDraftInput(fileId, draftId));
  const [text, setText] = useState<string>(saved?.dirty ? saved.text : remote?.text || ""), [blocked, setBlocked] = useState(Boolean(saved?.dirty)), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const value = useRef(text), dirty = useRef(Boolean(saved?.dirty)), blockRef = useRef(blocked), lock = useRef(false), mounted = useRef(true);
  const revision = useRef(remote?.revision || 0), session = useRef(uid()), sequence = useRef(0), queued = useRef<string | null>(null), running = useRef<Promise<void> | null>(null);
  const pending = useRef<{ type: string; value: Record<string, unknown> } | null>(saved?.operation || null);
  const canceled = useRef(Boolean(saved?.canceled));
  function persist() { try { localStorage.setItem(key, JSON.stringify({ text: value.current, dirty: dirty.current, operation: pending.current, canceled: canceled.current })); } catch { if (mounted.current) setError("本地草稿保存失败，请保留页面"); } }
  function block(message: string) { blockRef.current = true; queued.current = null; persist(); if (mounted.current) { setBlocked(true); setError(message); } }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; persist(); }; }, [draftId]);
  useEffect(() => {
    if (!available && dirty.current) block("连接已断开，文字保留在手机");
    if (!dirty.current && !running.current && remote && !pending.current) { value.current = remote.text; revision.current = remote.revision; setText(remote.text); }
  }, [available, remote?.revision]);
  function binding() { const d = currentState().workbuddy.fileWorkspace.documents[fileId]; return { documentRevision: d?.revision, fileId, draftId }; }
  const anchor = () => ({ app: "workbuddy" as const, targetId: documentDraftTarget(draftId), targetRevision: remote?.targetRevision });
  async function flush(): Promise<void> {
    if (canceled.current) return;
    if (running.current) { await running.current; if (queued.current !== null) return flush(); return; }
    if (queued.current === null || blockRef.current || !mounted.current) return;
    const next = queued.current; queued.current = null;
    running.current = (async () => {
      const ack = await command("wb-doc-draft-edit", { ...binding(), text: next, revision: revision.current, session: session.current, sequence: ++sequence.current }, anchor());
      if (ack.ok) { revision.current = currentState().workbuddy.fileWorkspace.documents[fileId].drafts[draftId].revision; if (!canceled.current && value.current === next) dirty.current = false; persist(); }
      else block(ack.error || "草稿更新失败");
    })();
    try { await running.current; } finally { running.current = null; }
    if (queued.current !== null) return flush();
  }
  function cancel() {
    // Stop the queue immediately; its newest text is recoverable even without an ack.
    canceled.current = true; queued.current = null; blockRef.current = true; persist();
    return command("wb-doc-cancel", binding());
  }
  function update(next: string) { value.current = next; setText(next); dirty.current = true; persist(); if (!available) { block("连接已断开，文字保留在手机"); return; } if (!blockRef.current && !pending.current) { queued.current = next; void flush(); } }
  async function recover() {
    const d = currentState().workbuddy.fileWorkspace.documents[fileId]?.drafts[draftId];
    if (!available || !d || ["applied", "canceled"].includes(d.status)) { setError("请连接并核对原草稿状态"); return; }
    revision.current = d.revision; blockRef.current = false; setBlocked(false); setError(""); queued.current = value.current; dirty.current = true; await flush();
  }
  async function perform(type: "wb-doc-preview" | "wb-doc-apply", extra: Record<string, unknown> = {}) {
    if (lock.current || (blockRef.current && !pending.current)) return false;
    lock.current = true; setBusy(true); setError("");
    try {
      if (!pending.current) { await flush(); if (blockRef.current) return false; pending.current = { type, value: { ...binding(), revision: revision.current, ...extra, operationId: uid() } }; persist(); }
      const op = pending.current, ack = await command(op.type, op.value, anchor());
      if (ack.ok && currentState().workbuddy.operations[String(op.value.operationId)]) { pending.current = null; dirty.current = false; blockRef.current = false; setBlocked(false); persist(); return true; }
      if (!/连接|回执/.test(ack.error || "")) pending.current = null;
      block(ack.error || "请核对修改结果"); return false;
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  return { text, update, recover, perform, cancel, blocked, busy, error, hasPending: !!pending.current, pendingType: pending.current?.type };
}
