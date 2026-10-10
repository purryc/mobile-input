import { test } from "node:test";
import assert from "node:assert/strict";
import { Store, initialState, type Command } from "./model";
import { restoreWorkBuddy } from "./workbuddy";
import { inputTarget } from "./workbuddy-mobile";

const cmd = (type: string, value: unknown): Command => ({ id: crypto.randomUUID(), type, value });
function setup() { const s = new Store(); s.dispatch(cmd("open", "workbuddy")); return s; }
function open(s: Store, id: string) { assert.equal(s.dispatch(cmd("wb-input-open", { draftId: id, purpose: "create" })).ok, true); }
function anchored(s: Store, id: string, type: string, v: Record<string, unknown>) {
  const d = s.state.workbuddy.inputDrafts[id];
  return { ...cmd(type, { draftId: id, revision: d.revision, ...v }), targetId: inputTarget(id), targetRevision: d.targetRevision };
}
test("mobile drafts are isolated and ordered without moving the tablet focus or route", () => {
  const s = setup(); s.dispatch(cmd("wb-focus", { id: "wb:draft:new" }));
  const before = { task: s.state.workbuddy.task, page: s.state.workbuddy.page, target: structuredClone(s.state.target) };
  for (const id of ["a", "b"]) open(s, id);
  assert.equal(s.dispatch(anchored(s, "a", "wb-input-edit", { text: "A需求", session: "phone", sequence: 2 })).ok, true);
  assert.equal(s.dispatch(anchored(s, "b", "wb-input-edit", { text: "B报价", session: "phone", sequence: 1 })).ok, true);
  assert.equal(s.dispatch(anchored(s, "a", "wb-input-edit", { text: "旧A", session: "phone", sequence: 1 })).ok, false);
  assert.equal(s.state.workbuddy.inputDrafts.a.text, "A需求");
  assert.equal(s.state.workbuddy.inputDrafts.b.text, "B报价");
  assert.deepEqual({ task: s.state.workbuddy.task, page: s.state.workbuddy.page, target: s.state.target }, before);
});
test("mobile creation is durable across retry/reload and consumes only its own draft", () => {
  const s = setup(); open(s, "a"); open(s, "b");
  s.dispatch(anchored(s, "b", "wb-input-edit", { text: "B保留", session: "p", sequence: 1 }));
  const c = anchored(s, "a", "wb-task-create", { text: "整理客户需求", operationId: "create-a" });
  assert.equal(s.dispatch(c).ok, true);
  const count = s.state.workbuddy.tasks.length;
  assert.equal(s.state.workbuddy.task, "new"); assert.equal(s.state.target, null);
  const restored = new Store(restoreWorkBuddy(structuredClone(s.state), () => {}));
  assert.equal(restored.dispatch({ ...c, id: crypto.randomUUID() }).ok, true);
  assert.equal(restored.state.workbuddy.tasks.length, count);
  assert.equal(restored.state.workbuddy.tasks[0].status, "paused");
  assert.equal(restored.state.workbuddy.inputDrafts.b.text, "B保留");
  assert.equal(restored.dispatch(anchored(restored, "a", "wb-task-create", { text: "重复创建", operationId: "new-op" })).ok, false);
  assert.equal(restored.dispatch({ ...c, id: crypto.randomUUID(), value: { ...(c.value as object), text: "另一任务" } }).ok, false);
});
test("mobile input rejects wrong anchors, stale revisions, invalid modes and mismatched ownership", () => {
  const s = setup(); open(s, "a");
  const c = anchored(s, "a", "wb-input-edit", { text: "需求", session: "p", sequence: 1 });
  assert.equal(s.dispatch({ ...c, id: crypto.randomUUID(), targetRevision: -1 }).ok, false);
  assert.equal(s.dispatch(c).ok, true);
  assert.equal(s.dispatch({ ...c, id: crypto.randomUUID() }).ok, false);
  assert.equal(s.dispatch(cmd("wb-input-open", { draftId: "a", purpose: "approval-supplement", taskId: "other" })).ok, false);
  assert.equal(s.dispatch(anchored(s, "a", "wb-task-create", { text: "需求", operationId: "bad", mode: "other" })).ok, false);
});
test("v1 migration backs up before mutating and retains old drafts, files, chats and WPS", () => {
  const s = initialState(); const w = s.workbuddy;
  w.version = 1;
  const before = structuredClone(s); const backups: string[] = [];
  restoreWorkBuddy(s, (k) => backups.push(k));
  assert.deepEqual(backups, ["mobile-input:backup:workbuddy-v1"]);
  assert.equal(w.version, 2); assert.deepEqual(w.drafts, before.workbuddy.drafts);
  assert.deepEqual(w.files, before.workbuddy.files); assert.deepEqual(s.chat, before.chat); assert.deepEqual(s.slides, before.slides);
  restoreWorkBuddy(s, () => assert.fail("must not re-backup"));
  const failed = structuredClone(before);
  assert.throws(() => restoreWorkBuddy(failed, () => { throw Error("full"); }));
  assert.deepEqual(failed, before);
});
test("mobile new input never inherits the tablet draft references or globally selected expert", () => {
  const s = setup(); s.state.workbuddy.drafts.new.references = ["仅属于电脑的引用"];
  s.state.workbuddy.entityDrafts["selected-expert"] = { text: "finance", revision: 0, sequence: 0, session: "", references: [], attachments: [] };
  open(s, "a");
  assert.equal(s.dispatch(anchored(s, "a", "wb-task-create", { text: "客户需求", operationId: "own-task" })).ok, true);
  assert.equal(s.state.workbuddy.tasks[0].expert, "");
  assert.equal(s.state.workbuddy.tasks[0].messages[0].text, "客户需求");
  assert.deepEqual(s.state.workbuddy.drafts.new.references, ["仅属于电脑的引用"]);
});
