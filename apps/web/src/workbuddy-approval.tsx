import { useRef, useState } from "react";
import { approvalUnavailable, shareGroups, type WbApproval } from "../../../packages/core/workbuddy-approvals";
import { command, currentState, uid, useRuntime } from "./runtime";

export function WorkBuddyApproval({ request, onSupplement, onRequest }: {
  request: WbApproval; onSupplement: () => void; onRequest: (id: string) => void;
}) {
  const r = useRuntime(), unavailable = approvalUnavailable(r.state, request);
  const operationKey = `mobile-input:wb-approval-operation:${request.id}`;
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [saved] = useState(() => { try { return JSON.parse(localStorage.getItem(operationKey) || "null"); } catch { return null; } });
  const lock = useRef(false), pending = useRef<{ type: string; value: Record<string, unknown> } | null>(saved);
  const effect = r.state.workbuddy.shareEffects.find(e => e.requestId === request.id);
  async function act(action: "approve" | "reject" | "refresh") {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      pending.current ||= { type: action === "refresh" ? "wb-approval-refresh" : "wb-approval-decide",
        value: { taskId: request.taskId, requestId: request.id, expectedRevision: request.revision,
          ...(action === "refresh" ? {} : { decision: action }), operationId: uid() } };
      try { localStorage.setItem(operationKey, JSON.stringify(pending.current)); }
      catch { setError("重试记录保存失败，请保留页面并核对结果"); }
      const op = pending.current, ack = await command(op.type, op.value);
      if (ack.ok) {
        const receipt = currentState().workbuddy.operations[String(op.value.operationId)];
        pending.current = null;
        localStorage.removeItem(operationKey);
        if (receipt?.requestId && action === "refresh") onRequest(receipt.requestId);
      } else {
        setError(ack.error || "请核对当前请求结果");
        if (!/连接|回执/.test(ack.error || "")) { pending.current = null; localStorage.removeItem(operationKey); }
      }
    } finally { lock.current = false; setBusy(false); }
  }
  return <section className="wb-approval" aria-label="审批请求">
    <h2>{request.status === "pending" ? "请确认本次分享" : request.status === "superseded" ? "审批方案已更新" : request.status === "approved" ? "已同意本次请求" : "已拒绝本次请求"}</h2>
    <p className="wb-mobile-simulation">本地模拟 · 分享不会对外发送</p>
    <dl><dt>文件</dt><dd>{request.artifactName} · 版本 {request.artifactRevision + 1}</dd>
      <dt>接收范围</dt><dd>{shareGroups[request.group]}</dd>
      <dt>动作</dt><dd>保存本地分享记录</dd><dt>审批版本</dt><dd>{request.revision}</dd></dl>
    {request.conditions && <blockquote>{request.conditions}</blockquote>}
    <details><summary>查看待分享内容</summary><pre>{request.content}</pre></details>
    {request.status === "pending" && <>
      {unavailable && <p role="status">{unavailable}</p>}
      <div className="wb-mobile-actions">
        <button disabled={busy || !r.connected || Boolean(unavailable)} onClick={() => act("approve")}>同意本次请求</button>
        <button disabled={busy || !r.connected || Boolean(unavailable)} onClick={() => act("reject")}>拒绝本次请求</button>
        <button disabled={busy || !r.connected || Boolean(unavailable)} onClick={onSupplement}>补充条件</button>
      </div>
      {unavailable && <button disabled={busy || !r.connected} onClick={() => act("refresh")}>按最新文件重新确认</button>}
    </>}
    {request.status === "superseded" && request.replacementRequestId && <button onClick={() => onRequest(request.replacementRequestId!)}>查看更新后的审批</button>}
    {request.status === "approved" && <p role="status">{effect ? "本地分享记录已保存" : "已批准，等待核对执行结果"}</p>}
    {request.status === "rejected" && <p role="status">本次分享未获批准，任务和成果已保留</p>}
    {busy && <p role="status">正在提交，请等待工作台回执…</p>}
    {error && <p role="alert">{error}</p>}
    {pending.current && !busy && <button disabled={!r.connected} onClick={() => act("approve")}>核对并重试原操作</button>}
  </section>;
}
