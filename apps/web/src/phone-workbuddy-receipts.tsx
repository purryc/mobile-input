import { useRef, useState } from "react";
import * as I from "lucide-react";
import { receiptTarget, type ReceiptFields } from "../../../packages/core/workbuddy-receipts";
import { command, currentState, uid, useRuntime } from "./runtime";
import { documentOperation } from "./workbuddy-document-operation";
export function PhoneWorkBuddyReceipts({ onReturn }: { onReturn: () => void }) {
  const runtime = useRuntime(), r = runtime.state.workbuddy.fileWorkspace.receipts;
  const [draftId, setDraftId] = useState<string | null>(() => Object.values(r.drafts).find(d => d.status === "editing")?.id || null), [error, setError] = useState(""), [busy, setBusy] = useState(false), [month, setMonth] = useState(r.missingMonths[0] || 2);
  const selectedMonth = r.missingMonths.includes(month) ? month : r.missingMonths[0] || 2;
  const lock = useRef(false), d = draftId ? r.drafts[draftId] : undefined;
  async function open() {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { const id = Object.values(r.drafts).find(d => d.month === selectedMonth && d.status === "editing")?.id || uid(); const ack = await command("wb-receipt-open", { taskId: r.taskId, draftId: id, month: selectedMonth, sourceId: "builtin-receipt-v1" }); if (ack.ok) setDraftId(id); else setError(ack.error || "无法打开示例"); } finally { lock.current = false; setBusy(false); }
  }
  return <section className="wb-phone-document">
    <div className="wb-phone-document-context"><h2>整理今年收据</h2><p>同一任务 · {r.missingMonths.length ? `缺少 ${r.missingMonths.join("、")} 月材料` : "示例月份已补齐"}</p>
      {d?.status === "editing" ? <ReceiptForm key={d.id} draftId={d.id} onDone={() => setDraftId(null)} /> : <>
        {!!r.missingMonths.length && <><label>补充月份<select aria-label="缺票据月份" value={selectedMonth} onChange={e => setMonth(+e.target.value)}>{r.missingMonths.map(m => <option value={m} key={m}>{m} 月</option>)}</select></label><div className="wb-receipt-example">云杉样例商店<br />办公耗材 · ¥42.00<small>完全虚构的内置票据</small></div></>}
        <table className="wb-local-table" aria-label="已整理票据"><thead><tr><th>月份</th><th>项目</th><th>金额</th></tr></thead><tbody>{r.rows.map(row => <tr key={row.id}><td>{row.month} 月</td><td>{row.description}</td><td>{(row.cents / 100).toFixed(2)}</td></tr>)}</tbody></table>
        <p className="wb-mobile-simulation">示例识别与本地表格，不读取实际财务资料</p>
      </>}
      {error && <p role="alert">{error}</p>}
    </div>
    {!d || d.status !== "editing" ? <div className="wb-phone-document-input"><div className="wb-document-entry"><button disabled={!runtime.connected || busy || !r.missingMonths.length} onClick={open}><I.Camera size={19} />拍照（示例）</button><button disabled={!runtime.connected || busy || !r.missingMonths.length} onClick={open}><I.Paperclip size={19} />上传附件（示例）</button></div><div className="wb-document-entry"><button onClick={onReturn}>返回原 PPT</button><button disabled={!runtime.connected || busy} onClick={async () => { if (lock.current) return; lock.current = true; setBusy(true); try { const ack = await documentOperation("wb-receipt-reset", { taskId: r.taskId, expectedRevision: r.revision }); if (ack.ok) { setDraftId(null); setMonth(2); } else setError(ack.error || "重置失败"); } finally { lock.current = false; setBusy(false); } }}>重置票据示例</button></div></div> : <div className="wb-phone-document-input"><button onClick={onReturn}>保留票据草稿并返回 PPT</button></div>}
  </section>;
}
function ReceiptForm({ draftId, onDone }: { draftId: string; onDone: () => void }) {
  const runtime = useRuntime(), r = runtime.state.workbuddy.fileWorkspace.receipts, d = r.drafts[draftId], key = `mobile-input:wb-receipt:${draftId}`;
  const [saved] = useState(() => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } });
  const [fields, setFields] = useState<ReceiptFields>(saved?.fields || d.fields), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const pending = useRef<Record<string, unknown> | null>(saved?.operation || null), lock = useRef(false), sequence = useRef(0), session = useRef(uid());
  function save(next: ReceiptFields, op = pending.current) { try { localStorage.setItem(key, JSON.stringify({ fields: next, operation: op })); } catch { setError("本地票据草稿保存失败，请保留页面"); } }
  function update(k: keyof ReceiptFields, value: string) { const f = { ...fields, [k]: value }; setFields(f); setConfirmed(false); save(f); }
  async function commit() {
    if (lock.current) return; lock.current = true; setBusy(true); setError("");
    try {
      if (!pending.current) {
        const current = currentState().workbuddy.fileWorkspace.receipts.drafts[draftId];
        const ack = await command("wb-receipt-edit", { taskId: r.taskId, draftId, revision: current.revision, fields, sequence: ++sequence.current, session: session.current }, { targetId: receiptTarget(draftId), targetRevision: current.targetRevision, app: "workbuddy" });
        if (!ack.ok) { setError(ack.error || "字段未保存"); return; }
        const next = currentState().workbuddy.fileWorkspace.receipts;
        pending.current = { taskId: r.taskId, draftId, revision: next.drafts[draftId].revision, expectedRevision: next.revision, confirmed: true, operationId: uid() }; save(fields);
      }
      const ack = await command("wb-receipt-commit", pending.current, { targetId: receiptTarget(draftId), targetRevision: d.targetRevision, app: "workbuddy" });
      if (ack.ok) { pending.current = null; localStorage.removeItem(key); onDone(); }
      else { if (!/连接|回执/.test(ack.error || "")) pending.current = null; save(fields); setError(ack.error || "请核对票据结果"); }
    } finally { lock.current = false; setBusy(false); }
  }
  return <div className="wb-receipt-form"><div className="wb-receipt-form-scroll"><div className="wb-receipt-example">示例票据 · {d.month} 月<small>已模拟提取以下字段，请核对</small></div><div className="wb-receipt-fields">{([['date','票据日期'],['vendor','商店'],['description','票据项目'],['amount','票据金额']] as const).map(([k, label]) => <label key={k}>{label}<input aria-label={label} value={fields[k]} disabled={busy || !!pending.current} onChange={e => update(k, e.target.value)} /></label>)}</div>
    <label><input type="checkbox" aria-label="已核对票据字段" checked={confirmed} disabled={busy || !!pending.current} onChange={e => setConfirmed(e.target.checked)} />已核对字段，补充到原票据任务</label>
    </div><div className="wb-receipt-input"><div className="wb-document-entry"><button disabled={busy || !!pending.current} onClick={() => update("description", "会议用品（演示转写）")}><I.Mic size={18} />演示语音修正项目</button><button disabled={busy || !!pending.current} onClick={async () => { const ack = await command("wb-receipt-cancel", { taskId: r.taskId, draftId }); if (ack.ok) onDone(); }}>取消补充</button></div><button className="wb-green" disabled={!runtime.connected || busy || (!confirmed && !pending.current)} onClick={commit}>{busy ? "等待工作台回执…" : pending.current ? "核对并重试原补充" : "确认整理到原任务"}</button></div>
    {error && <p role="alert">{error}</p>}
  </div>;
}
