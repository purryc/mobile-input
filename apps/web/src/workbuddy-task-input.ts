import { useEffect, useRef, useState } from "react";
import { command, currentState, uid, useRuntime } from "./runtime";
import { inputTarget } from "../../../packages/core/workbuddy-mobile";

/** Independent input binding: browsing another task never changes this draft's ownership. */
export function useWorkBuddyTaskInput(draftId: string) {
  const r = useRuntime(), remote = r.state.workbuddy.inputDrafts[draftId];
  const key = `mobile-input:wb-input:phone:${draftId}:${remote?.purpose}:${remote?.requestId || "new"}`;
  const [saved] = useState(() => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } });
  const [text, setText] = useState<string>(saved?.pending ? saved.text : remote?.text || "");
  const [blocked, setBlocked] = useState(Boolean(saved?.pending));
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const value = useRef(text), dirty = useRef(Boolean(saved?.pending)), blockedRef = useRef(blocked);
  const revision = useRef(remote?.revision || 0), sequence = useRef(0), session = useRef(uid());
  const targetRevision = useRef(remote?.targetRevision), queued = useRef<string | null>(null);
  const running = useRef<Promise<void> | null>(null), mounted = useRef(true), lock = useRef(false);
  const pending = useRef<{ type: string; value: Record<string, unknown> } | null>(saved?.operation || null);
  function persist() {
    try { localStorage.setItem(key, JSON.stringify({ text: value.current, pending: dirty.current, operation: pending.current })); }
    catch { if (mounted.current) setError("本地草稿保存失败，请保留页面并复制内容"); }
  }
  function block(message = "草稿已保留，请核对当前版本") {
    blockedRef.current = true; queued.current = null; persist();
    if (mounted.current) { setBlocked(true); setError(message); }
  }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; persist(); }; }, [draftId]);
  useEffect(() => {
    if (!r.connected && dirty.current) block("连接已断开，草稿保留在手机");
    if (!dirty.current && !running.current && remote && !pending.current) {
      revision.current = remote.revision; value.current = remote.text; setText(remote.text);
    }
  }, [r.connected, remote?.revision]);
  async function flush(): Promise<void> {
    if (running.current) { await running.current; if (queued.current !== null) return flush(); return; }
    if (queued.current === null || blockedRef.current || !mounted.current) return;
    const next = queued.current; queued.current = null;
    running.current = (async () => {
      const ack = await command("wb-input-edit", { draftId, text: next, revision: revision.current,
        session: session.current, sequence: ++sequence.current },
        { app: "workbuddy", targetId: inputTarget(draftId), targetRevision: targetRevision.current });
      if (ack.ok) {
        revision.current = currentState().workbuddy.inputDrafts[draftId]?.revision || 0;
        if (value.current === next) dirty.current = false;
        persist();
      } else block(ack.error);
    })();
    try { await running.current; } finally { running.current = null; }
    if (queued.current !== null) return flush();
  }
  function update(next: string) {
    value.current = next; setText(next); dirty.current = true; persist();
    if (!r.connected) { block("连接已断开，草稿保留在手机"); return; }
    if (!blockedRef.current && !pending.current) { queued.current = next; void flush(); }
  }
  async function recover() {
    const d = currentState().workbuddy.inputDrafts[draftId];
    if (!r.connected || !d || d.consumedBy) { setError("请连接并核对此草稿的当前结果"); return; }
    revision.current = d.revision; targetRevision.current = d.targetRevision;
    blockedRef.current = false; setBlocked(false); setError("");
    dirty.current = true; queued.current = value.current; await flush();
  }
  async function submit(type: string, extra: Record<string, unknown>) {
    if (lock.current || (blockedRef.current && !pending.current)) return null;
    lock.current = true; setBusy(true); setError("");
    try {
      if (!pending.current) {
        await flush(); if (blockedRef.current) return null;
        pending.current = { type, value: { draftId, text: value.current, revision: revision.current,
          ...extra, operationId: uid() } }; persist();
      }
      const op = pending.current;
      const ack = await command(op.type, op.value, { app: "workbuddy", targetId: inputTarget(draftId), targetRevision: targetRevision.current });
      const receipt = currentState().workbuddy.operations[String(op.value.operationId)];
      if (ack.ok && receipt) { dirty.current = false; pending.current = null; localStorage.removeItem(key); return receipt; }
      if (!/连接|回执/.test(ack.error || "")) pending.current = null;
      block(ack.error || "请核对提交结果"); return null;
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  return { text, update, recover, submit, blocked, busy, error, hasPending: Boolean(pending.current) };
}
