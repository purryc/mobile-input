import { useEffect, useRef, useState } from "react";
import { command, currentState, role, uid, useRuntime } from "./runtime";
import { wbDraftFor } from "../../../packages/core/workbuddy";
import type { Target } from "../../../packages/core/model";

/** Serialize draft writes, retaining local content after a stale target or failed receipt. */
export function useWorkBuddyInput(id: string, label: string, initialText = "") {
  const r = useRuntime(),
    remote = wbDraftFor(r.state, id),
    key = `mobile-input:workbuddy-draft:${role}:${id}`;
  const [saved] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      return v?.pending ? v : null;
    } catch {
      return null;
    }
  });
  const [text, setText] = useState<string>(
      saved?.text ?? remote?.text ?? initialText,
    ),
    [blocked, setBlocked] = useState(Boolean(saved)),
    [busy, setBusy] = useState(false);
  const value = useRef(text),
    dirty = useRef(Boolean(saved)),
    anchor = useRef<Target | null>(null),
    queued = useRef<string | null>(null),
    running = useRef<Promise<void> | null>(null),
    revision = useRef(remote?.revision || 0),
    sequence = useRef(0),
    session = useRef(uid()),
    mounted = useRef(true),
    blockedRef = useRef(Boolean(saved));
  function persist() {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ text: value.current, pending: dirty.current }),
      );
    } catch {}
  }
  function block() {
    blockedRef.current = true;
    setBlocked(true);
    queued.current = null;
    persist();
  }
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      persist();
    };
  }, [id]);
  useEffect(() => {
    const t = r.state.target;
    if (
      anchor.current &&
      (t?.id !== anchor.current.id || t?.revision !== anchor.current.revision)
    ) {
      if (dirty.current || running.current) block();
      else anchor.current = null;
    }
    if (!dirty.current && !running.current && remote) {
      value.current = remote.text;
      setText(remote.text);
      revision.current = remote.revision;
    }
    if (role === "phone" && !r.connected && dirty.current) block();
  }, [
    remote?.revision,
    r.state.target?.id,
    r.state.target?.revision,
    r.connected,
  ]);
  async function focus() {
    if (blockedRef.current) return false;
    const state = currentState();
    if (state.app !== "workbuddy") return false;
    if (state.target?.id !== id) {
      const ack = await command("wb-focus", { id, label, text: initialText });
      if (!ack.ok) return false;
    }
    const next = currentState();
    if (next.target?.id !== id) return false;
    anchor.current = next.target;
    revision.current = wbDraftFor(next, id)?.revision || 0;
    return true;
  }
  async function flush(): Promise<void> {
    if (running.current) {
      await running.current;
      if (queued.current !== null) return flush();
      return;
    }
    if (queued.current === null || blockedRef.current || !mounted.current)
      return;
    const run = async () => {
      if (!anchor.current && !(await focus())) {
        block();
        return;
      }
      const text = queued.current;
      queued.current = null;
      if (text === null) return;
      const t = anchor.current!;
      const ack = await command(
        "wb-edit",
        {
          text,
          revision: revision.current,
          sequence: ++sequence.current,
          session: session.current,
        },
        { app: "workbuddy", targetId: t.id, targetRevision: t.revision },
      );
      if (!mounted.current) return;
      if (ack.ok) {
        revision.current = wbDraftFor(currentState(), id)?.revision || 0;
        if (value.current === text) dirty.current = false;
        persist();
      } else block();
    };
    running.current = run();
    try {
      await running.current;
    } finally {
      running.current = null;
    }
    if (queued.current !== null) return flush();
  }
  function update(next: string) {
    value.current = next;
    setText(next);
    dirty.current = true;
    persist();
    void command("switch-cancel");
    if (!blockedRef.current) {
      queued.current = next;
      void flush();
    }
  }
  async function recover() {
    blockedRef.current = false;
    setBlocked(false);
    anchor.current = null;
    const local = value.current;
    if (await focus()) {
      dirty.current = true;
      queued.current = local;
      await flush();
    }
  }
  async function submit(kind?: string) {
    if (busy || blockedRef.current) return false;
    setBusy(true);
    try {
      await flush();
      if (blockedRef.current) return false;
      if (!anchor.current && !(await focus())) return false;
      const t = anchor.current!;
      const ack = await command(
        "wb-submit",
        { text: value.current, revision: revision.current, kind },
        { app: "workbuddy", targetId: t.id, targetRevision: t.revision },
      );
      if (ack.ok) {
        dirty.current = false;
        localStorage.removeItem(key);
        anchor.current = null;
        return true;
      }
      block();
      return false;
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return { text, update, focus, flush, submit, recover, blocked, busy };
}
