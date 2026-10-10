import { useEffect, useState } from "react";
import * as I from "lucide-react";
import { shareGroups, type WbApproval } from "../../../packages/core/workbuddy-approvals";
import { resultLabels } from "../../../packages/core/workbuddy";
import { command, currentState, uid, useRuntime, navigateBack } from "./runtime";
import { ConnectionButton, useInlineConnection } from "./connection-access";
import { useBack } from "./back";
import { SwitchButton } from "./phone-wechat";
import { usePhoneInsets } from "./phone-insets";
import { useWorkBuddyTaskInput } from "./workbuddy-task-input";
import { WorkBuddyApproval } from "./workbuddy-approval";
import "./phone-workbuddy.css";
import { documentDirty } from "../../../packages/core/workbuddy-documents";
import { PhoneWorkBuddyReceipts } from "./phone-workbuddy-receipts";
import { PhoneWorkBuddyDocument } from "./phone-workbuddy-document";

const statusLabels = { running: "正在执行", paused: "已暂停", planned: "等待计划确认", complete: "已完成", "needs-type": "请选择成果类型" };
type View = { kind: "overview" } | { kind: "task"; id: string } | { kind: "draft"; id: string } | { kind: "approval"; id: string } | { kind: "document"; id: string; resumed?: boolean } | { kind: "receipts"; returnFileId: string };
export function PhoneWorkBuddyHub({ onClose }: { onClose: () => void }) {
  useInlineConnection();
  const r = useRuntime(), w = r.state.workbuddy;
  const [view, setView] = useState<View>({ kind: "overview" });
  useBack(() => { if (view.kind === "overview") onClose(); else if (view.kind === "receipts") setView(view.returnFileId && w.files.some(f => f.id === view.returnFileId) ? { kind: "document", id: view.returnFileId, resumed: true } : { kind: "overview" }); else setView({ kind: "overview" }); return true; }, 100);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const task = view.kind === "task" ? w.tasks.find(t => t.id === view.id) : undefined;
  const request = view.kind === "approval" ? w.approvals.find(a => a.id === view.id) : undefined;
  const draft = view.kind === "draft" ? w.inputDrafts[view.id] : undefined;
  async function openDraft(request?: WbApproval) {
    if (busy) return; setBusy(true); setError("");
    try {
      const existing = Object.values(w.inputDrafts).find(d => !d.consumedBy && d.purpose === "approval-supplement" && d.requestId === request?.id);
      const id = request && existing ? existing.id : uid();
      const ack = await command("wb-input-open", { draftId: id, purpose: request ? "approval-supplement" : "create",
        ...(request ? { taskId: request.taskId, requestId: request.id, requestRevision: request.revision } : {}) });
      if (ack.ok) setView({ kind: "draft", id }); else setError(ack.error || "无法打开草稿");
    } finally { setBusy(false); }
  }
  async function requestShare(taskId: string, artifactId: string) {
    if (busy) return; setBusy(true); setError("");
    try {
      const file = w.files.find(f => f.id === artifactId)!;
      const operationId = uid();
      const ack = await command("wb-approval-request", { taskId, artifactId, artifactRevision: file.contentRevision || 0, group: "project", operationId });
      if (ack.ok) {
        const id = currentState().workbuddy.operations[operationId]?.requestId;
        if (id) setView({ kind: "approval", id });
      } else setError(ack.error || "请求未完成，请核对待审批列表");
    } finally { setBusy(false); }
  }
  const pending = w.approvals.filter(a => a.status === "pending");
  return <main className="workbuddy-phone wb-mobile-hub" style={usePhoneInsets()}>
    <header className="wb-phone-status"><span><i className={r.connected ? "online-dot" : "offline-dot"} />{r.connected ? "已连接" : "离线快照"} · WorkBuddy</span><SwitchButton /><ConnectionButton /></header>
    <nav className="wb-mobile-nav"><button aria-label={view.kind === "document" ? "返回" : "返回任务总览"} onClick={navigateBack}><I.ChevronLeft /></button><h1>{view.kind === "overview" ? "任务总览" : view.kind === "draft" ? draft?.purpose === "create" ? "新建任务" : "补充审批条件" : view.kind === "approval" ? "独立审批" : view.kind === "receipts" ? "补充票据材料" : view.kind === "document" ? "PPT 协同编辑" : "任务详情"}</h1></nav>
    {!r.connected && <p className="wb-phone-warning" role="status">连接已断开，状态待同步；未提交草稿保留</p>}
    <div className={"wb-mobile-scroll" + (["document", "receipts"].includes(view.kind) ? " wb-mobile-document-route" : view.kind === "draft" ? " wb-mobile-draft-route" : "")}>
      {view.kind === "document" && <PhoneWorkBuddyDocument key={view.id} fileId={view.id} resumed={view.resumed} onReceipts={() => setView({ kind: "receipts", returnFileId: view.id })} />}
      {view.kind === "receipts" && <PhoneWorkBuddyReceipts onReturn={() => setView(view.returnFileId && w.files.some(f => f.id === view.returnFileId) ? { kind: "document", id: view.returnFileId, resumed: true } : { kind: "overview" })} />}
      {view.kind === "overview" && <>
        <button className="wb-mobile-primary" disabled={!r.connected || busy} onClick={() => openDraft()}><I.Plus />新建任务</button>
        <p className="wb-mobile-simulation">本地模拟任务与审批</p>
        <section aria-label="待审批列表"><h2>待审批 <small>{pending.length}</small></h2>{pending.length ? pending.map(a => <button key={a.id} className="wb-mobile-card" onClick={() => setView({ kind: "approval", id: a.id })}><strong>{w.tasks.find(t => t.id === a.taskId)?.title}</strong><span>分享 {a.artifactName}</span><small>待审批 · 版本 {a.revision}</small></button>) : <p>暂无待审批请求</p>}</section>
        {Object.values(w.inputDrafts).some(d => !d.consumedBy) && <section aria-label="未提交草稿"><h2>未提交草稿</h2>{Object.values(w.inputDrafts).filter(d => !d.consumedBy).map(d => <button key={d.id} className="wb-mobile-card" onClick={() => setView({ kind: "draft", id: d.id })}><strong>{d.purpose === "create" ? "新建任务草稿" : "审批补充草稿"}</strong><span>{d.text || "继续编辑"}</span></button>)}</section>}
        <section aria-label="所有任务"><h2>所有任务</h2>{w.tasks.map(t => <button key={t.id} className="wb-mobile-card" data-task-id={t.id} onClick={() => setView({ kind: "task", id: t.id })}><strong>{t.title}</strong><small>{statusLabels[t.status]}{w.approvals.some(a => a.taskId === t.id && a.status === "pending") ? " · 有待审批请求" : ""}</small></button>)}</section>
      </>}
      {draft && <MobileDraft key={draft.id} draftId={draft.id} onDone={receipt => setView(receipt.requestId ? { kind: "approval", id: receipt.requestId } : { kind: "task", id: receipt.taskId })} />}
      {request && <WorkBuddyApproval key={request.id} request={request} onSupplement={() => openDraft(request)} onRequest={id => setView({ kind: "approval", id })} />}
      {task && <section className="wb-mobile-task"><h2>{task.title}</h2><p role="status">{statusLabels[task.status]}</p>
        <details open><summary>最近上下文</summary>{task.messages.slice(-3).map(m => <p key={m.id}>{m.text}</p>)}</details>
        {task.status === "planned" && <button disabled={!r.connected} onClick={() => command("wb-task", { id: task.id, action: "confirm" })}>确认计划并开始</button>}
        {task.status === "running" && <button disabled={!r.connected} onClick={() => command("wb-task", { id: task.id, action: "stop" })}>暂停任务</button>}
        {task.status === "paused" && task.id !== w.fileWorkspace.receipts.taskId && <button disabled={!r.connected} onClick={() => command("wb-task", { id: task.id, action: "continue" })}>继续任务</button>}
        {task.status === "needs-type" && <div className="wb-mobile-actions">{Object.entries(resultLabels).map(([kind, label]) => <button key={kind} disabled={!r.connected} onClick={() => command("wb-task", { id: task.id, action: "type", kind })}>{label}</button>)}</div>}
        {task.id === w.fileWorkspace.receipts.taskId && <button disabled={!r.connected} onClick={() => setView({ kind: "receipts", returnFileId: Object.values(w.fileWorkspace.documents).find(d => d.pages.length)?.fileId || "" })}>补充缺少的票据材料</button>}<h3>成果</h3>{task.files.map(id => { const file = w.files.find(f => f.id === id); return file && <article className="wb-mobile-card" key={id}><strong>{file.name}</strong><small>文件版本 {(file.contentRevision || 0) + 1}</small>{w.fileWorkspace.documents[id]?.pages.length ? <button disabled={!r.connected} onClick={async () => { const ack = await command("wb-window-open", { fileId: id }); if (ack.ok) setView({ kind: "document", id }); }}>编辑此 PPT</button> : null}<button disabled={!r.connected || busy || (w.fileWorkspace.documents[id] && documentDirty(w.fileWorkspace.documents[id])) || w.approvals.some(a => a.artifactId === id && a.status === "pending")} onClick={() => requestShare(task.id, id)}>请求分享审批（本地模拟）</button></article>; })}
        {w.approvals.filter(a => a.taskId === task.id).map(a => <button className="wb-mobile-card" key={a.id} onClick={() => setView({ kind: "approval", id: a.id })}><span>{a.artifactName} · 审批版本 {a.revision}</span><small>{{ pending: "待审批", approved: "已同意", rejected: "已拒绝", superseded: "已更新" }[a.status]}</small></button>)}
        <button disabled={!r.connected} onClick={() => command("wb-navigate", { page: "task", id: task.id })}>在工作台打开此任务</button>
      </section>}
      {view.kind !== "overview" && view.kind !== "document" && view.kind !== "receipts" && !task && !request && !draft && <p role="status">此对象已不存在，未提交内容仍按原草稿保留</p>}
      {error && <p role="alert">{error}</p>}
    </div>
    {r.toast && <div className="toast" role="status">{r.toast}</div>}
  </main>;
}

function MobileDraft({ draftId, onDone }: { draftId: string; onDone: (receipt: { taskId: string; requestId?: string }) => void }) {
  const r = useRuntime(), d = r.state.workbuddy.inputDrafts[draftId], editor = useWorkBuddyTaskInput(draftId);
  const request = r.state.workbuddy.approvals.find(a => a.id === d.requestId);
  const optionsKey = `mobile-input:wb-create-options:${draftId}`;
  const [savedOptions] = useState(() => { try { return JSON.parse(localStorage.getItem(optionsKey) || "null"); } catch { return null; } });
  const defaults = [{ name: "需求确认", date: "10 月" }, { name: "方案评审", date: "11 月" }, { name: "开发交付", date: "12 月" }, { name: "验收上线", date: "1 月" }];
  const savedStages = Array.isArray(savedOptions?.stages) && savedOptions.stages.length === 4 && savedOptions.stages.every((s: { name: unknown; date: unknown }) => s && typeof s.name === "string" && typeof s.date === "string") ? savedOptions.stages as typeof defaults : defaults;
  const [result, setResult] = useState<string>(["sales-task", "ppt-demo", "roadmap-demo"].includes(savedOptions?.result) ? savedOptions.result : "sales-task"), [recognized, setRecognized] = useState(Boolean(savedOptions?.recognized)), [confirmed, setConfirmed] = useState(false), [stages, setStages] = useState(savedStages);
  const [mode, setMode] = useState<string>(["agent", "plan", "ask"].includes(savedOptions?.mode) ? savedOptions.mode : "agent"), [group, setGroup] = useState(request?.group || "project");
  const [optionsError, setOptionsError] = useState("");
  useEffect(() => { try { localStorage.setItem(optionsKey, JSON.stringify({ result, recognized, stages, mode })); setOptionsError(""); } catch { setOptionsError("任务选项草稿保存失败，请保留页面"); } }, [optionsKey, result, recognized, stages, mode]);
  return <section className="wb-mobile-compose"><div className="wb-mobile-compose-scroll">
    <p>{d.purpose === "create" ? "创建独立销售演示任务" : `补充：${request?.artifactName || "原审批"} · 审批版本 ${d.requestRevision}`}</p>
    <label>{d.purpose === "create" ? "任务内容" : "补充条件"}<textarea aria-label={d.purpose === "create" ? "手机新建任务草稿" : "审批补充草稿"} value={editor.text} disabled={editor.busy || editor.hasPending} onChange={e => editor.update(e.target.value)} /></label>
    {d.purpose === "create" && <label>成果类型<select aria-label="新建任务成果类型" value={result} disabled={editor.busy || editor.hasPending} onChange={e => { setResult(e.target.value); setConfirmed(false); }}><option value="sales-task">现有销售任务</option><option value="ppt-demo">可编辑 PPT 演示</option><option value="roadmap-demo">手绘 Roadmap 演示</option></select></label>}
    {d.purpose === "create" && result === "roadmap-demo" && <>
      <div className="wb-sketch-preview" aria-label="内置手绘 Roadmap 示例"><svg viewBox="0 0 340 190"><path d="M20 100Q80 90 130 105T220 98T320 100 M30 45L100 43 105 78 28 80Z M120 120L195 118 198 160 116 162Z M210 38L287 43 289 80 213 83Z" fill="none" stroke="#68786e" strokeWidth="2" strokeLinecap="round" /><g fill="#576a60" fontSize="14"><text x="37" y="66">需求确认</text><text x="128" y="146">方案评审</text><text x="221" y="66">开发交付</text><text x="263" y="145">验收上线</text></g><path d="M65 80L65 97 M158 118L158 100 M250 81L250 98 M300 130L300 100" stroke="#68786e" fill="none" /></svg></div>
      <button disabled={editor.busy || editor.hasPending} onClick={() => { setRecognized(true); setConfirmed(false); }}>读取示例手绘节点（模拟）</button>
      {recognized && <><p>核对阶段与日期</p>{stages.map((stage, i) => <div className="wb-roadmap-stage" key={i}><input aria-label={`阶段 ${i + 1} 名称`} value={stage.name} onChange={e => { setStages(stages.map((s, n) => n === i ? { ...s, name: e.target.value } : s)); setConfirmed(false); }} /><input aria-label={`阶段 ${i + 1} 日期`} value={stage.date} onChange={e => { setStages(stages.map((s, n) => n === i ? { ...s, date: e.target.value } : s)); setConfirmed(false); }} /></div>)}<label><input type="checkbox" aria-label="已核对手绘节点" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />已核对示例节点</label></>}
      <p className="wb-mobile-simulation">内置示例识别，不读取或理解任意图片</p>
    </>}
    {d.purpose === "create" ? result === "sales-task" ? <label>工作模式<select aria-label="新建任务工作模式" disabled={editor.busy || editor.hasPending} value={mode} onChange={e => setMode(e.target.value)}><option value="agent">默认执行</option><option value="plan">先确认计划</option><option value="ask">仅问答</option></select></label> : <p>固定模板 · 本地模拟生成</p> : <label>接收范围<select aria-label="审批接收范围" disabled={editor.busy || editor.hasPending} value={group} onChange={e => setGroup(e.target.value as typeof group)}>{Object.entries(shareGroups).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>}
    {editor.blocked && !editor.hasPending && <div className="wb-phone-warning">草稿已保留<button disabled={!r.connected} onClick={editor.recover}>恢复到当前草稿</button></div>}
    </div><div className="wb-mobile-submit-bar"><button className="wb-mobile-primary" disabled={!r.connected || editor.busy || (!editor.hasPending && (editor.blocked || !editor.text.trim() || (result === "roadmap-demo" && !confirmed)))} onClick={async () => {
      const receipt = await editor.submit(d.purpose === "create" ? result === "sales-task" ? "wb-task-create" : "wb-deck-create" : "wb-approval-supplement",
        d.purpose === "create" ? result === "sales-task" ? { mode } : { template: result === "roadmap-demo" ? "roadmap" : "sales", ...(result === "roadmap-demo" ? { sourceId: "builtin-sketch-v1", stages, confirmed } : {}) } : { taskId: d.taskId, requestId: d.requestId, expectedRevision: d.requestRevision, group });
      if (receipt) onDone(receipt);
    }}>{editor.busy ? "等待工作台回执…" : editor.hasPending ? "核对并重试原提交" : d.purpose === "create" ? "提交新任务" : "更新方案并重新确认"}</button>
    {editor.error && <p role="alert">{editor.error}</p>}
    {optionsError && <p role="alert">{optionsError}</p>}
    <p className="wb-mobile-simulation">{d.purpose === "create" ? "使用现有销售演示数据；语音与外部 API 待接入" : "补充不会自动同意；更新后需再次确认"}</p></div>
  </section>;
}
