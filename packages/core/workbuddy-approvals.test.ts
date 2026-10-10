import { test } from "node:test";
import assert from "node:assert/strict";
import { Store, type Command } from "./model";
import { approvalInteraction } from "./workbuddy-approvals";
import { inputTarget } from "./workbuddy-mobile";
const cmd = (type: string, value?: unknown): Command => ({ id: crypto.randomUUID(), type, value });
function setup() {
  const s = new Store(); s.dispatch(cmd("open", "workbuddy"));
  const create = cmd("wb-approval-request", { taskId: "sample-brief", artifactId: "sales-brief", artifactRevision: 0, group: "project", operationId: "request-a" });
  assert.equal(s.dispatch(create).ok, true);
  return s;
}
const decide = (decision = "approve", operationId = "decision-a") => cmd("wb-approval-decide", {
  taskId: "sample-brief", requestId: "request-a-request", expectedRevision: 1, decision, operationId,
});
test("approval executes exactly one local effect, including lost Ack retry and reload", () => {
  const s = setup(), c = decide(), other = structuredClone(s.state.workbuddy.tasks);
  assert.equal(s.dispatch(c).ok, true); assert.equal(s.dispatch(c).ok, true);
  assert.equal(s.dispatch({ ...c, id: crypto.randomUUID() }).ok, true);
  const restored = new Store(structuredClone(s.state));
  assert.equal(restored.dispatch({ ...c, id: crypto.randomUUID() }).ok, true);
  assert.equal(restored.state.workbuddy.shareEffects.length, 1);
  assert.equal(restored.state.workbuddy.shareEffects[0].simulation, true);
  assert.deepEqual(s.state.workbuddy.tasks, other);
  assert.equal(restored.dispatch(decide("approve", "new-id")).ok, false);
  assert.equal(restored.state.workbuddy.shareEffects.length, 1);
});
test("reject affects only the request, preserves files, running/paused tasks and other requests", () => {
  const s = setup();
  s.dispatch(cmd("wb-approval-request", { taskId: "sample-quote", artifactId: "sales-quote", artifactRevision: 0, group: "manager", operationId: "request-b" }));
  s.state.workbuddy.tasks[0].status = "running";
  const tasks = structuredClone(s.state.workbuddy.tasks), files = structuredClone(s.state.workbuddy.files);
  assert.equal(s.dispatch(decide("reject")).ok, true);
  assert.deepEqual(s.state.workbuddy.tasks, tasks); assert.deepEqual(s.state.workbuddy.files, files);
  assert.equal(s.state.workbuddy.approvals[0].status, "pending");
  assert.equal(s.state.workbuddy.shareEffects.length, 0);
});
test("approval time boundary uses authority time, expired requests can be replaced explicitly", () => {
  for (const offset of [-1, 0, 1]) {
    const s = setup(), r = s.state.workbuddy.approvals[0];
    assert.equal(approvalInteraction(s.state, decide(), r.expiresAt + offset), offset < 0 ? null : "审批已过期，请重新确认");
  }
  const s = setup(); s.state.workbuddy.approvals[0].expiresAt = 0;
  assert.equal(s.dispatch(decide()).ok, false);
  assert.equal(s.dispatch(cmd("wb-approval-refresh", { taskId: "sample-brief", requestId: "request-a-request", expectedRevision: 1, operationId: "refresh-a" })).ok, true);
  assert.equal(s.state.workbuddy.approvals[0].status, "pending");
  assert.equal(s.state.workbuddy.approvals[1].status, "superseded");
});
test("wrong task/request/revision, stale artifact and changed retry payload never execute", () => {
  const s = setup(), c = decide();
  for (const patch of [{ taskId: "sample-quote" }, { requestId: "missing" }, { expectedRevision: 2 }, { decision: "stop" }]) {
    const before = structuredClone(s.state);
    assert.equal(s.dispatch({ ...c, id: crypto.randomUUID(), value: { ...(c.value as object), ...patch } }).ok, false);
    assert.deepEqual(s.state, before);
  }
  s.state.workbuddy.files[0].content += "\n编辑";
  assert.equal(s.dispatch(c).ok, false); assert.equal(s.state.workbuddy.shareEffects.length, 0);
});
test("supplement supersedes the original and requires a new Yes; never creates a follow-up task", () => {
  const s = setup(); const tasks = structuredClone(s.state.workbuddy.tasks);
  s.dispatch(cmd("wb-input-open", { draftId: "supp-a", purpose: "approval-supplement", taskId: "sample-brief", requestId: "request-a-request", requestRevision: 1 }));
  const d = s.state.workbuddy.inputDrafts["supp-a"], anchor = { targetId: inputTarget(d.id), targetRevision: d.targetRevision };
  s.dispatch({ ...cmd("wb-input-edit", { draftId: d.id, revision: 0, text: "仅供评审", session: "phone", sequence: 1 }), ...anchor });
  const c = { ...cmd("wb-approval-supplement", { taskId: "sample-brief", requestId: "request-a-request", expectedRevision: 1,
    draftId: d.id, revision: 1, text: "仅供评审", group: "manager", operationId: "supplement-a" }), ...anchor };
  assert.equal(s.dispatch(c).ok, true); assert.equal(s.dispatch({ ...c, id: crypto.randomUUID() }).ok, true);
  assert.deepEqual(s.state.workbuddy.tasks, tasks); assert.equal(s.state.workbuddy.shareEffects.length, 0);
  assert.equal(s.state.workbuddy.approvals.length, 2);
  assert.equal(s.state.workbuddy.approvals[0].group, "manager");
  assert.equal(s.state.workbuddy.approvals[0].conditions, "仅供评审");
  assert.equal(s.state.workbuddy.approvals[1].status, "superseded");
  assert.equal(s.dispatch(decide()).ok, false);
  assert.equal(s.dispatch(cmd("wb-approval-decide", { taskId: "sample-brief", requestId: "supplement-a-request", expectedRevision: 2,
    decision: "approve", operationId: "new-yes" })).ok, true);
  assert.equal(s.state.workbuddy.shareEffects[0].conditions, "仅供评审");
});
test("approving a manually paused task never resumes it or accepts an old execution epoch", () => {
  const s = setup(), task = s.state.workbuddy.tasks[0];
  task.status = "running"; const epoch = task.epoch;
  s.dispatch(cmd("wb-task", { id: task.id, action: "stop" }));
  assert.equal(s.dispatch(decide()).ok, true);
  assert.equal(s.state.workbuddy.tasks[0].status, "paused");
  assert.equal(s.dispatch(cmd("wb-tick", { id: task.id, epoch })).ok, false);
});
test("old whole-state undo preserves approvals, durable operations and WorkBuddy artifacts", () => {
  const s = setup();
  s.dispatch(cmd("report-refresh")); // Captures a legacy history snapshot with pending approval.
  assert.equal(s.dispatch(decide()).ok, true);
  const wb = structuredClone(s.state.workbuddy);
  assert.equal(s.dispatch(cmd("undo")).ok, true);
  assert.deepEqual(s.state.workbuddy, wb);
  assert.equal(s.dispatch(decide("approve", "another")).ok, false);
  assert.equal(s.state.workbuddy.shareEffects.length, 1);
});
test("explicit file refresh invalidates the old approval and only a replacement snapshots the new file", () => {
  const s = setup();
  assert.equal(s.dispatch(cmd("wb-file", { id: "sales-brief", action: "refresh" })).ok, true);
  assert.equal(s.dispatch(decide()).ok, false);
  assert.equal(s.dispatch(cmd("wb-approval-refresh", { taskId: "sample-brief", requestId: "request-a-request", expectedRevision: 1, operationId: "updated-file" })).ok, true);
  assert.equal(s.state.workbuddy.approvals[0].artifactRevision, 1);
  assert.equal(s.state.workbuddy.shareEffects.length, 0);
});
test("request updates prevent stale supplement edits and preserve the draft for inspection", () => {
  const s = setup();
  s.dispatch(cmd("wb-input-open", { draftId: "supp-a", purpose: "approval-supplement", taskId: "sample-brief", requestId: "request-a-request", requestRevision: 1 }));
  const d = s.state.workbuddy.inputDrafts["supp-a"], anchor = { targetId: inputTarget(d.id), targetRevision: d.targetRevision };
  s.dispatch({ ...cmd("wb-input-edit", { draftId: d.id, revision: 0, text: "保留补充", session: "p", sequence: 1 }), ...anchor });
  s.dispatch(decide("reject"));
  const before = structuredClone(s.state);
  assert.equal(s.dispatch({ ...cmd("wb-input-edit", { draftId: d.id, revision: 1, text: "迟到内容", session: "p", sequence: 2 }), ...anchor }).ok, false);
  assert.equal(s.dispatch({ ...cmd("wb-approval-supplement", { taskId: "sample-brief", requestId: "request-a-request", expectedRevision: 1, draftId: d.id, revision: 1, text: "保留补充", operationId: "late-supp" }), ...anchor }).ok, false);
  assert.deepEqual(s.state, before);
  assert.equal(s.state.workbuddy.inputDrafts[d.id].text, "保留补充");
});
test("same operation with a changed decision or group is rejected and cannot overwrite its receipt", () => {
  const s = setup(), c = decide(); assert.equal(s.dispatch(c).ok, true);
  const before = structuredClone(s.state);
  assert.equal(s.dispatch({ ...c, id: crypto.randomUUID(), value: { ...(c.value as object), decision: "reject" } }).ok, false);
  assert.deepEqual(s.state, before);
});
