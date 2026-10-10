import { test } from "node:test";
import assert from "node:assert/strict";
import { Store, type Command } from "./model";
import { ensureReceiptTask, receiptTarget } from "./workbuddy-receipts";
import { restoreWorkBuddy } from "./workbuddy";
const cmd = (type: string, value: unknown): Command => ({ id: crypto.randomUUID(), type, value });
function setup() { const s = new Store(); s.dispatch(cmd("open", "workbuddy")); ensureReceiptTask(s.state); return s; }
function open(s: Store, month: number, draftId = "receipt-a") {
  assert.equal(s.dispatch(cmd("wb-receipt-open", { taskId: "receipt-year-demo", draftId, sourceId: "builtin-receipt-v1", month })).ok, true);
}
function anchored(s: Store, type: string, extra: Record<string, unknown>) {
  const d = s.state.workbuddy.fileWorkspace.receipts.drafts[String(extra.draftId || "receipt-a")];
  return { ...cmd(type, { taskId: d.taskId, draftId: d.id, revision: d.revision, ...extra }), targetId: receiptTarget(d.id), targetRevision: d.targetRevision };
}
test("receipt supplements update the same task and table once across replay/reload without moving PPT context", () => {
  const s = setup(), w = s.state.workbuddy.fileWorkspace; w.active = "original-ppt"; w.pageId = "original-page";
  open(s, 2); const fields = { date: "2026-02-12", vendor: "示例文具商店（虚构）", description: "会议用品", amount: "56.70" };
  assert.equal(s.dispatch(anchored(s, "wb-receipt-edit", { fields, session: "phone", sequence: 1 })).ok, true);
  const c = anchored(s, "wb-receipt-commit", { expectedRevision: 0, confirmed: true, operationId: "receipt-commit" }); assert.equal(s.dispatch(c).ok, true);
  const count = s.state.workbuddy.tasks.length;
  const restored = new Store(restoreWorkBuddy(structuredClone(s.state), () => {})); assert.equal(restored.dispatch({ ...c, id: crypto.randomUUID() }).ok, true);
  const r = restored.state.workbuddy.fileWorkspace.receipts; assert.equal(r.rows.length, 1); assert.equal(r.rows[0].cents, 5670); assert.deepEqual(r.missingMonths, [5, 9]);
  assert.equal(restored.state.workbuddy.tasks.length, count); assert.equal(restored.state.workbuddy.fileWorkspace.active, "original-ppt"); assert.equal(restored.state.workbuddy.fileWorkspace.pageId, "original-page");
  assert.match(restored.state.workbuddy.files.find(f => f.id === "receipt-year-table")!.content, /会议用品/);
  assert.equal(restored.dispatch({ ...c, id: crypto.randomUUID(), value: { ...(c.value as object), confirmed: false } }).ok, false);
});
test("receipt validation rejects stale, unconfirmed, invalid dates and unordered edits", () => {
  const s = setup(); open(s, 2); const d = s.state.workbuddy.fileWorkspace.receipts.drafts['receipt-a'];
  assert.equal(s.dispatch(anchored(s, "wb-receipt-edit", { fields: { ...d.fields, date: "2026-02-30" }, session: "p", sequence: 1 })).ok, false);
  assert.equal(s.dispatch(anchored(s, "wb-receipt-edit", { fields: d.fields, session: "p", sequence: 2 })).ok, true);
  assert.equal(s.dispatch(anchored(s, "wb-receipt-edit", { fields: d.fields, session: "p", sequence: 1 })).ok, false);
  assert.equal(s.dispatch(anchored(s, "wb-receipt-commit", { expectedRevision: 0, confirmed: false, operationId: "unconfirmed" })).ok, false);
  assert.equal(s.dispatch(anchored(s, "wb-receipt-commit", { expectedRevision: 9, confirmed: true, operationId: "stale" })).ok, false);
  assert.equal(s.state.workbuddy.fileWorkspace.receipts.rows.length, 0);
});
test("cancel and reset do not create new tasks or affect unrelated inputs and approvals", () => {
  const s = setup(); open(s, 2); s.dispatch(cmd("wb-receipt-cancel", { taskId: "receipt-year-demo", draftId: "receipt-a" }));
  assert.equal(s.dispatch(anchored(s, "wb-receipt-commit", { expectedRevision: 0, confirmed: true, operationId: "canceled" })).ok, false);
  open(s, 2, "receipt-b"); assert.equal(s.dispatch(anchored(s, "wb-receipt-commit", { draftId: "receipt-b", expectedRevision: 0, confirmed: true, operationId: "commit-b" })).ok, true);
  s.dispatch(cmd("wb-input-open", { draftId: "other", purpose: "create" })); const before = structuredClone(s.state.workbuddy.inputDrafts);
  assert.equal(s.dispatch(cmd("wb-receipt-reset", { taskId: "receipt-year-demo", expectedRevision: 1, operationId: "reset" })).ok, true);
  assert.deepEqual(s.state.workbuddy.inputDrafts, before); assert.deepEqual(s.state.workbuddy.fileWorkspace.receipts.missingMonths, [2, 5, 9]); assert.equal(s.state.workbuddy.files.some(f => f.id === "receipt-year-table"), false);
  assert.equal(s.state.workbuddy.tasks.filter(t => t.id === "receipt-year-demo").length, 1);
});
