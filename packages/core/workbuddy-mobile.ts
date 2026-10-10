import type { Command, State } from "./model";
import { identify, newWbDraft, startTask, type WbDraft } from "./workbuddy";

export interface WbInputDraft extends WbDraft {
  id: string;
  purpose: "create" | "approval-supplement";
  taskId: string | null;
  requestId?: string;
  requestRevision?: number;
  targetRevision: number;
  consumedBy?: string;
}
export interface WbOperation {
  signature: string;
  type: string;
  taskId: string;
  requestId?: string;
}
export const inputTarget = (id: string) => `wb:input:${id}`;
export const validId = (id: unknown): id is string => typeof id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(id) && !Object.hasOwn(Object.prototype, id);

/** Business receipts survive reloads; command IDs remain transport-level deduplication. */
export function operationReplay(s: State, c: Command): string | null | undefined {
  const v = c.value as Record<string, unknown>;
  if (!validId(String(v?.operationId || ""))) return "操作标识无效";
  const receipt = s.workbuddy.operations[String(v.operationId)];
  if (!receipt) return undefined;
  return receipt.signature === JSON.stringify({ type: c.type, value: c.value })
    ? null : "操作标识已用于其他内容";
}
export function saveOperation(s: State, c: Command, taskId: string, requestId?: string) {
  const v = c.value as Record<string, unknown>;
  s.workbuddy.operations[String(v.operationId)] = {
    signature: JSON.stringify({ type: c.type, value: c.value }), type: c.type, taskId, requestId,
  };
}
export function checkInput(s: State, c: Command, d: WbInputDraft | undefined): string | null {
  if (!d) return "输入草稿不存在";
  const v = c.value as Record<string, unknown>;
  if (c.targetId !== inputTarget(d.id) || c.targetRevision !== d.targetRevision)
    return "输入目标已变化，草稿已保留";
  if (v.revision !== d.revision) return "草稿版本已变化，请重新确认";
  if (d.consumedBy) return "草稿已提交，请查看任务结果";
  if (d.purpose === "approval-supplement") {
    const r = s.workbuddy.approvals.find(r => r.id === d.requestId);
    if (!r || r.taskId !== d.taskId || r.revision !== d.requestRevision || r.status !== "pending")
      return "审批已变化，补充草稿已保留";
  }
  return null;
}

export function mobileWorkBuddyInteraction(s: State, c: Command): string | null | undefined {
  if (!["wb-input-open", "wb-input-edit", "wb-task-create"].includes(c.type)) return undefined;
  const w = s.workbuddy, v = (c.value || {}) as Record<string, unknown>, id = String(v.draftId || "");
  if (!validId(id)) return "草稿标识无效";
  if (c.type === "wb-input-open") {
    if (!["create", "approval-supplement"].includes(String(v.purpose))) return "输入用途无效";
    const old = w.inputDrafts[id];
    if (old) return old.purpose === v.purpose && old.taskId === (v.taskId || null) &&
      old.requestId === v.requestId && old.requestRevision === v.requestRevision ? null : "草稿归属不匹配";
    if (v.purpose === "create" && (v.taskId || v.requestId)) return "新建草稿归属无效";
    if (v.purpose === "approval-supplement") {
      const r = w.approvals.find(r => r.id === v.requestId);
      if (!r || r.taskId !== v.taskId || r.revision !== v.requestRevision || r.status !== "pending")
        return "审批已变化，请查看当前请求";
    }
    w.inputDrafts[id] = { ...newWbDraft(), id, purpose: v.purpose as WbInputDraft["purpose"],
      taskId: v.taskId ? String(v.taskId) : null, requestId: v.requestId as string | undefined,
      requestRevision: v.requestRevision as number | undefined, targetRevision: s.revision + 1 };
    return null;
  }
  if (c.type === "wb-task-create") {
    const replay = operationReplay(s, c);
    if (replay !== undefined) return replay;
  }
  const d = w.inputDrafts[id], error = checkInput(s, c, d);
  if (error) return error;
  if (typeof v.text !== "string" || v.text.length > 20000) return "输入内容无效或过长";
  if (c.type === "wb-input-edit") {
    if (typeof v.session !== "string" || !validId(v.session) || !Number.isInteger(v.sequence) || Number(v.sequence) < 1)
      return "编辑序号无效";
    if (d.session === v.session && Number(v.sequence) <= d.sequence) return "已忽略过期编辑";
    d.text = v.text; d.revision++; d.sequence = Number(v.sequence); d.session = v.session;
    return null;
  }
  if (d.purpose !== "create" || !v.text.trim()) return "请使用新建草稿并填写任务内容";
  if (v.mode !== undefined && !["agent", "plan", "ask"].includes(String(v.mode))) return "工作模式无效";
  const taskId = String(v.operationId);
  if (w.tasks.some(t => t.id === taskId)) return "任务标识已存在";
  // Creating from the phone never moves the tablet's route, focus, preview or current task.
  const board = { page: w.page, task: w.task, preview: [...w.preview], previewActive: w.previewActive,
    filePanel: w.filePanel, target: s.target };
  startTask(s, taskId, v.text.trim(), identify(v.text), { mode: v.mode as "agent" | "plan" | "ask" | undefined, expert: "" }, d);
  Object.assign(w, { page: board.page, task: board.task, preview: board.preview,
    previewActive: board.previewActive, filePanel: board.filePanel });
  s.target = board.target;
  d.text = ""; d.revision++; d.consumedBy = taskId;
  saveOperation(s, c, taskId);
  return null;
}
