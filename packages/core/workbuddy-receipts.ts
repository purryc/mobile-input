import type { Command, State } from "./model";
import { newWbDraft, type WbDraft } from "./workbuddy";
import { operationReplay, saveOperation, validId } from "./workbuddy-mobile";
export interface ReceiptFields { date: string; vendor: string; description: string; amount: string; }
export interface ReceiptDraft { id: string; taskId: string; month: number; fields: ReceiptFields; revision: number; targetRevision: number; session: string; sequence: number; status: "editing" | "committed" | "canceled"; }
export interface ReceiptState { taskId: string; revision: number; year: number; missingMonths: number[]; rows: (ReceiptFields & { id: string; month: number; cents: number })[]; drafts: Record<string, ReceiptDraft>; }
export const newReceiptState = (): ReceiptState => ({ taskId: "receipt-year-demo", revision: 0, year: 2026, missingMonths: [2, 5, 9], rows: [], drafts: {} });
export const receiptTarget = (id: string) => `wb:receipt:${id}`;
export function ensureReceiptTask(s: State) {
  const r = s.workbuddy.fileWorkspace.receipts;
  if (s.workbuddy.tasks.some(t => t.id === r.taskId)) return;
  s.workbuddy.tasks.push({ id: r.taskId, title: "整理今年收据（示例任务）", messages: [{ id: "receipt-notice", role: "assistant", text: "缺少 2、5、9 月的票据材料，请从手机补充示例照片或附件并核对字段。" }], status: "paused", kind: "quote", mode: "ask", model: "本地票据示例", expert: "", project: "", favorite: false, step: 0, epoch: r.taskId, startedAt: 0, elapsed: 0, files: [], dataVersion: 0 });
  s.workbuddy.drafts[r.taskId] = newWbDraft();
}
function checkFields(f: ReceiptFields, year: number, month: number): boolean {
  if (!f || ![f.date, f.vendor, f.description, f.amount].every(v => typeof v === "string")) return false;
  const date = f.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!date || +date[1] !== year || +date[2] !== month || +date[3] < 1 || +date[3] > new Date(year, month, 0).getDate()) return false;
  return !!f.vendor.trim() && f.vendor.length <= 80 && !!f.description.trim() && f.description.length <= 100 && /^\d{1,5}(\.\d{1,2})?$/.test(f.amount) && Number(f.amount) > 0;
}
export function receiptInteraction(s: State, c: Command): string | null | undefined {
  if (!c.type.startsWith("wb-receipt-")) return undefined;
  const r = s.workbuddy.fileWorkspace.receipts, v = (c.value || {}) as Record<string, unknown>, id = String(v.draftId || "");
  if (["wb-receipt-commit", "wb-receipt-reset"].includes(c.type)) { const replay = operationReplay(s, c); if (replay !== undefined) return replay; }
  if (v.taskId !== r.taskId || !s.workbuddy.tasks.some(t => t.id === r.taskId)) return "票据任务不存在";
  if (c.type === "wb-receipt-reset") {
    if (v.expectedRevision !== r.revision) return "票据任务版本已变化";
    r.missingMonths = [2, 5, 9]; r.rows = []; r.revision++;
    for (const draft of Object.values(r.drafts)) if (draft.status === "editing") draft.status = "canceled";
    s.workbuddy.files = s.workbuddy.files.filter(f => f.id !== "receipt-year-table");
    const task = s.workbuddy.tasks.find(t => t.id === r.taskId)!; task.status = "paused"; task.files = [];
    const space = s.workbuddy.fileWorkspace; space.tabs = space.tabs.filter(id => id !== "receipt-year-table"); delete space.documents['receipt-year-table'];
    if (space.active === "receipt-year-table") { space.active = space.tabs.at(-1) || null; space.pageId = space.active ? space.documents[space.active].currentPageId || null : null; space.open = !!space.tabs.length; space.pointer = null; space.pointerEpoch++; space.retiredGestures = []; }
    saveOperation(s, c, r.taskId); return null;
  }
  if (!validId(id)) return "票据草稿标识无效";
  if (c.type === "wb-receipt-open") {
    if (v.sourceId !== "builtin-receipt-v1" || !r.missingMonths.includes(Number(v.month))) return "请从缺材料通知选择一个月份的内置示例";
    const old = r.drafts[id]; if (old) return old.month === v.month && old.taskId === v.taskId ? null : "票据草稿归属不匹配";
    const month = Number(v.month);
    r.drafts[id] = { id, taskId: r.taskId, month, fields: { date: `${r.year}-${String(month).padStart(2, "0")}-12`, vendor: "云杉样例商店（虚构）", description: "办公耗材（演示）", amount: "42.00" }, revision: 0, targetRevision: s.revision + 1, session: "", sequence: 0, status: "editing" };
    return null;
  }
  const d = r.drafts[id]; if (!d || d.status !== "editing") return "票据草稿已结束，字段仍保留";
  if (c.type === "wb-receipt-cancel") { d.status = "canceled"; return null; }
  if (c.targetId !== receiptTarget(id) || c.targetRevision !== d.targetRevision || v.revision !== d.revision) return "票据草稿目标或版本已变化";
  if (c.type === "wb-receipt-edit") {
    if (!checkFields(v.fields as ReceiptFields, r.year, d.month) || !validId(v.session) || !Number.isInteger(v.sequence) || Number(v.sequence) < 1) return "字段或序号无效，请核对日期、商店、项目和金额";
    if (d.session === v.session && Number(v.sequence) <= d.sequence) return "已忽略过期票据输入";
    d.fields = structuredClone(v.fields as ReceiptFields); d.session = String(v.session); d.sequence = Number(v.sequence); d.revision++; return null;
  }
  if (c.type !== "wb-receipt-commit") return "票据操作不存在";
  if (v.expectedRevision !== r.revision || !r.missingMonths.includes(d.month)) return "该月份或票据任务已更新，请核对表格";
  if (v.confirmed !== true || !checkFields(d.fields, r.year, d.month)) return "请先核对字段再确认整理";
  const cents = Math.round(Number(d.fields.amount) * 100);
  r.rows.push({ ...structuredClone(d.fields), id: String(v.operationId), month: d.month, cents }); r.missingMonths = r.missingMonths.filter(m => m !== d.month); r.revision++; d.status = "committed";
  const table = ["日期,商店,项目,金额", ...r.rows.map(row => [row.date, row.vendor, row.description, (row.cents / 100).toFixed(2)].map(cell => `"${cell.replaceAll('"', '""')}"`).join(","))].join("\n");
  let file = s.workbuddy.files.find(f => f.id === "receipt-year-table");
  if (!file) { file = { id: "receipt-year-table", name: "2026 收据整理（本地示例）.csv", kind: "sheet", content: table, draft: newWbDraft(table), folder: "票据示例", task: r.taskId, edited: false, dataVersion: 0, contentRevision: 0 }; s.workbuddy.files.push(file); }
  else { file.content = table; file.draft = newWbDraft(table); file.contentRevision = (file.contentRevision || 0) + 1; }
  const task = s.workbuddy.tasks.find(t => t.id === r.taskId)!; task.files = [file.id]; task.status = r.missingMonths.length ? "paused" : "complete";
  task.messages.push({ id: `receipt-${v.operationId}`, role: "assistant", text: `已核对并补充 ${d.month} 月示例材料；${r.missingMonths.length ? `仍缺 ${r.missingMonths.join("、")} 月` : "示例月份已补齐"}。本地表格已更新。` });
  saveOperation(s, c, r.taskId); return null;
}
