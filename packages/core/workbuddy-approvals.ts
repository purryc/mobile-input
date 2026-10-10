import type { Command, State } from "./model";
import { checkInput, operationReplay, saveOperation } from "./workbuddy-mobile";

export const shareGroups = { project: "澄星项目组（演示）", manager: "销售主管（演示）" } as const;
export interface WbApproval {
  id: string;
  taskId: string;
  revision: number;
  status: "pending" | "approved" | "rejected" | "superseded";
  action: "share-artifact";
  artifactId: string;
  artifactRevision: number;
  artifactName: string;
  content: string;
  group: keyof typeof shareGroups;
  conditions: string;
  createdAt: number;
  expiresAt: number;
  replacementRequestId?: string;
  decisionOperationId?: string;
}
export interface WbShareEffect {
  id: string;
  requestId: string;
  taskId: string;
  status: "succeeded";
  simulation: true;
  artifactId: string;
  artifactRevision: number;
  artifactName: string;
  content: string;
  group: keyof typeof shareGroups;
  conditions: string;
  at: number;
}
export function approvalUnavailable(s: State, r: WbApproval, now = Date.now()) {
  if (r.status !== "pending") return "审批已处理，请查看结果或最新请求";
  if (now >= r.expiresAt) return "审批已过期，请重新确认";
  const task = s.workbuddy.tasks.find(t => t.id === r.taskId),
    file = s.workbuddy.files.find(f => f.id === r.artifactId);
  if (!task || !task.files.includes(r.artifactId) || !file) return "审批成果已不存在";
  if ((file.contentRevision || 0) !== r.artifactRevision || file.content !== r.content || file.name !== r.artifactName)
    return "成果已更新，请重新确认当前版本";
  return null;
}
export function approvalInteraction(s: State, c: Command, now = Date.now()): string | null | undefined {
  if (!["wb-approval-request", "wb-approval-decide", "wb-approval-supplement", "wb-approval-refresh"].includes(c.type))
    return undefined;
  const v = (c.value || {}) as Record<string, unknown>, w = s.workbuddy;
  const replay = operationReplay(s, c);
  if (replay !== undefined) return replay;
  const task = w.tasks.find(t => t.id === v.taskId);
  if (!task) return "任务不存在";
  if (c.type === "wb-approval-request") {
    const file = w.files.find(f => f.id === v.artifactId);
    if (!file || !task.files.includes(file.id)) return "成果不属于此任务";
    if (v.artifactRevision !== (file.contentRevision || 0)) return "成果版本已变化";
    if (!Object.hasOwn(shareGroups, String(v.group))) return "请选择演示接收范围";
    if (w.approvals.some(r => r.taskId === task.id && r.artifactId === file.id && r.status === "pending"))
      return "此成果已有待处理审批";
    const id = String(v.operationId) + "-request";
    w.approvals.unshift({ id, taskId: task.id, revision: 1, status: "pending", action: "share-artifact",
      artifactId: file.id, artifactRevision: file.contentRevision || 0, artifactName: file.name, content: file.content,
      group: v.group as WbApproval["group"], conditions: "", createdAt: now, expiresAt: now + 30 * 60 * 1000 });
    saveOperation(s, c, task.id, id);
    return null;
  }
  const r = w.approvals.find(r => r.id === v.requestId);
  if (!r || r.taskId !== task.id) return "审批请求不属于此任务";
  if (r.revision !== v.expectedRevision) return "审批版本已变化，请查看最新请求";
  if (c.type === "wb-approval-refresh") {
    if (r.status !== "pending") return "审批已处理";
  } else {
    const error = approvalUnavailable(s, r, now);
    if (error) return error;
  }
  if (c.type === "wb-approval-decide") {
    if (!["approve", "reject"].includes(String(v.decision))) return "审批决定无效";
    r.status = v.decision === "approve" ? "approved" : "rejected";
    r.decisionOperationId = String(v.operationId);
    if (r.status === "approved") w.shareEffects.push({ id: String(v.operationId), requestId: r.id,
      taskId: task.id, status: "succeeded", simulation: true, artifactId: r.artifactId,
      artifactRevision: r.artifactRevision, artifactName: r.artifactName, content: r.content,
      group: r.group, conditions: r.conditions, at: now });
    // This request governs sharing only. No task pause, start, cancellation or artifact rewrite.
    saveOperation(s, c, task.id, r.id);
    return null;
  }
  let conditions = r.conditions, group = r.group;
  if (c.type === "wb-approval-supplement") {
    const d = w.inputDrafts[String(v.draftId)], error = checkInput(s, c, d);
    if (error) return error;
    if (d.purpose !== "approval-supplement" || d.taskId !== task.id || d.requestId !== r.id)
      return "补充草稿归属不匹配";
    if (typeof v.text !== "string" || !v.text.trim() || v.text.length > 20000) return "请填写补充条件";
    if (v.text !== d.text) return "补充草稿尚未同步，请保留并重试";
    if (v.group !== undefined && !Object.hasOwn(shareGroups, String(v.group))) return "接收范围无效";
    conditions = v.text.trim(); group = v.group === undefined ? r.group : v.group as WbApproval["group"];
    d.consumedBy = String(v.operationId); d.revision++;
  }
  const file = w.files.find(f => f.id === r.artifactId);
  if (!file || !task.files.includes(file.id)) return "审批成果已不存在";
  const id = String(v.operationId) + "-request";
  r.status = "superseded"; r.replacementRequestId = id;
  w.approvals.unshift({ ...r, id, revision: r.revision + 1, status: "pending",
    artifactRevision: file.contentRevision || 0, artifactName: file.name, content: file.content,
    conditions, group, createdAt: now, expiresAt: now + 30 * 60 * 1000,
    replacementRequestId: undefined, decisionOperationId: undefined });
  saveOperation(s, c, task.id, id);
  return null;
}
