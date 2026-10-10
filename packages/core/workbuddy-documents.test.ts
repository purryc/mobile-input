import { test } from "node:test";
import assert from "node:assert/strict";
import { Store, type Command } from "./model";
import { inputTarget } from "./workbuddy-mobile";
import { documentDirty, documentDraftTarget, type WbDocument } from "./workbuddy-documents";
import { restoreWorkBuddy } from "./workbuddy";
const cmd = (type: string, value: unknown): Command => ({ id: crypto.randomUUID(), type, value });
function setup(template = "sales", extra: object = {}) {
  const s = new Store(); assert.equal(s.dispatch(cmd("open", "workbuddy")).ok, true);
  s.dispatch(cmd("wb-input-open", { draftId: "new-deck", purpose: "create" }));
  const input = s.state.workbuddy.inputDrafts['new-deck'];
  const c = { ...cmd("wb-deck-create", { draftId: input.id, revision: input.revision, text: "标题：客户项目汇报", template, operationId: "create-deck", ...extra }), targetId: inputTarget(input.id), targetRevision: input.targetRevision };
  assert.equal(s.dispatch(c).ok, true);
  const fileId = s.state.workbuddy.fileWorkspace.active!;
  return { s, fileId, creation: c };
}
const doc = (s: Store, fileId: string) => s.state.workbuddy.fileWorkspace.documents[fileId];
function select(s: Store, fileId: string, index = 0) {
  const d = doc(s, fileId), page = d.pages[0];
  assert.equal(s.dispatch(cmd("wb-doc-select", { fileId, documentRevision: d.revision, pageId: page.id, objectIds: [page.objects[index].id] })).ok, true);
}
function draft(s: Store, fileId: string, id = "edit-a", source = "text") {
  const d = doc(s, fileId);
  assert.equal(s.dispatch(cmd("wb-doc-draft-open", { fileId, documentRevision: d.revision, draftId: id, selection: d.selection, source })).ok, true);
}
function anchored(s: Store, fileId: string, type: string, v: Record<string, unknown> = {}) {
  const d = doc(s, fileId), a = d.drafts[String(v.draftId || "edit-a")];
  return { ...cmd(type, { fileId, documentRevision: d.revision, draftId: a.id, revision: a.revision, ...v }), targetId: documentDraftTarget(a.id), targetRevision: a.targetRevision };
}
function edit(s: Store, fileId: string, text: string, draftId = "edit-a", sequence = 1) {
  assert.equal(s.dispatch(anchored(s, fileId, "wb-doc-draft-edit", { draftId, text, sequence, session: "phone" })).ok, true);
}
function preview(s: Store, fileId: string, operationId = "preview-a", draftId = "edit-a") {
  const c = anchored(s, fileId, "wb-doc-preview", { operationId, draftId }); assert.equal(s.dispatch(c).ok, true); return c;
}
function apply(s: Store, fileId: string, proposalId = "preview-a", operationId = "apply-a", draftId = "edit-a") {
  const c = anchored(s, fileId, "wb-doc-apply", { operationId, proposalId, draftId }); assert.equal(s.dispatch(c).ok, true); return c;
}
test("PPT creation consumes its own input once and preserves the original tablet task route", () => {
  const { s, fileId, creation } = setup();
  assert.equal(s.state.workbuddy.page, "home"); assert.equal(s.state.workbuddy.task, "new"); assert.equal(s.state.target, null);
  assert.equal(doc(s, fileId).pages[0].objects[0].text, "客户项目汇报"); assert.equal(documentDirty(doc(s, fileId)), false);
  const count = s.state.workbuddy.tasks.length;
  const restored = new Store(restoreWorkBuddy(structuredClone(s.state), () => {}));
  assert.equal(restored.dispatch({ ...creation, id: crypto.randomUUID() }).ok, true);
  assert.equal(restored.state.workbuddy.tasks.length, count);
  assert.equal(restored.dispatch({ ...creation, id: crypto.randomUUID(), value: { ...(creation.value as object), text: "偷换任务" } }).ok, false);
});
test("voice draft freezes selection while pointer moves; preview and apply modify only the bound object", () => {
  const { s, fileId } = setup(); select(s, fileId); draft(s, fileId, "edit-a", "voice-demo");
  select(s, fileId, 1); edit(s, fileId, "改为：新的客户汇报");
  const before = structuredClone(doc(s, fileId)); preview(s, fileId);
  assert.deepEqual(doc(s, fileId).pages, before.pages);
  apply(s, fileId);
  assert.equal(doc(s, fileId).pages[0].objects[0].text, "新的客户汇报");
  assert.equal(doc(s, fileId).pages[0].objects[1].text, before.pages[0].objects[1].text);
  assert.equal(documentDirty(doc(s, fileId)), true);
  assert.notEqual(s.state.workbuddy.files.find(f => f.id === fileId)!.content.includes("新的客户汇报"), true);
});
test("apply receipts survive reload and changed payload cannot run a second mutation", () => {
  const { s, fileId } = setup(); select(s, fileId); draft(s, fileId); edit(s, fileId, "改成蓝色"); preview(s, fileId); const c = apply(s, fileId);
  const restored = new Store(restoreWorkBuddy(structuredClone(s.state), () => {}));
  assert.equal(restored.dispatch({ ...c, id: crypto.randomUUID() }).ok, true); assert.equal(doc(restored, fileId).revision, 1); assert.equal(doc(restored, fileId).undo.length, 1);
  assert.equal(restored.dispatch({ ...c, id: crypto.randomUUID(), value: { ...(c.value as object), proposalId: "other" } }).ok, false);
});
test("switching pages preserves draft and requires returning to the frozen page; cancel forbids a late apply", () => {
  const { s, fileId } = setup(); select(s, fileId); draft(s, fileId); edit(s, fileId, "字号 28"); preview(s, fileId);
  const c = anchored(s, fileId, "wb-doc-apply", { proposalId: "preview-a", operationId: "late-apply" });
  s.dispatch(cmd("wb-doc-page", { fileId, documentRevision: 0, pageId: doc(s, fileId).pages[1].id }));
  assert.equal(s.dispatch(c).ok, false); assert.equal(doc(s, fileId).drafts['edit-a'].text, "字号 28");
  s.dispatch(cmd("wb-doc-page", { fileId, documentRevision: 0, pageId: doc(s, fileId).pages[0].id }));
  s.dispatch(cmd("wb-doc-cancel", { fileId, documentRevision: 0, draftId: "edit-a" }));
  assert.equal(s.dispatch({ ...c, id: crypto.randomUUID() }).ok, false); assert.equal(doc(s, fileId).revision, 0);
});
test("document undo increases revision and leaves other tasks, drafts and approval records current", () => {
  const { s, fileId } = setup(); select(s, fileId); draft(s, fileId); edit(s, fileId, "改成绿色"); preview(s, fileId); apply(s, fileId);
  s.dispatch(cmd("wb-input-open", { draftId: "other-task-draft", purpose: "create" }));
  const domain = structuredClone({ tasks: s.state.workbuddy.tasks, drafts: s.state.workbuddy.inputDrafts, approvals: s.state.workbuddy.approvals });
  assert.equal(s.dispatch(cmd("wb-doc-undo", { fileId, documentRevision: 1, operationId: "undo-a" })).ok, true);
  assert.equal(doc(s, fileId).revision, 2); assert.equal(doc(s, fileId).pages[0].objects[0].color, "#20304a");
  assert.deepEqual({ tasks: s.state.workbuddy.tasks, drafts: s.state.workbuddy.inputDrafts, approvals: s.state.workbuddy.approvals }, domain);
  assert.equal(s.dispatch(cmd("wb-doc-redo", { fileId, documentRevision: 2, operationId: "redo-a" })).ok, true);
  assert.equal(doc(s, fileId).revision, 3); assert.equal(doc(s, fileId).pages[0].objects[0].color, "#168455");
  assert.equal(s.dispatch(anchored(s, fileId, "wb-doc-apply", { operationId: "old-reapply", proposalId: "preview-a" })).ok, false);
});
test("newer document changes reject old previews, out of order editing and unsupported instructions", () => {
  const { s, fileId } = setup(); select(s, fileId); draft(s, fileId); edit(s, fileId, "改成蓝色", "edit-a", 2);
  assert.equal(s.dispatch(anchored(s, fileId, "wb-doc-draft-edit", { text: "旧消息", session: "phone", sequence: 1 })).ok, false);
  preview(s, fileId); select(s, fileId, 1); draft(s, fileId, "edit-b"); edit(s, fileId, "向右移动 40", "edit-b"); preview(s, fileId, "preview-b", "edit-b"); apply(s, fileId, "preview-b", "apply-b", "edit-b");
  assert.equal(s.dispatch(anchored(s, fileId, "wb-doc-apply", { operationId: "apply-old", proposalId: "preview-a" })).ok, false);
  select(s, fileId); draft(s, fileId, "edit-c"); edit(s, fileId, "请帮我调用付费模型", "edit-c");
  assert.equal(s.dispatch(anchored(s, fileId, "wb-doc-preview", { operationId: "preview-c", draftId: "edit-c" })).ok, false);
});
test("pointer selection is ordered, page bound, released on disconnect, and supports multi object box selection", () => {
  const { s, fileId } = setup(); const w = s.state.workbuddy.fileWorkspace;
  const c = cmd("wb-doc-pointer", { fileId, documentRevision: 0, pageId: w.pageId, pointerEpoch: w.pointerEpoch, gesture: "g1", sequence: 2, x: .98, y: .95, phase: "select", box: { x: 0, y: 0 } });
  assert.equal(s.dispatch(c).ok, true); assert.equal(doc(s, fileId).selection!.objectIds.length, 3);
  assert.equal(s.dispatch({ ...c, id: crypto.randomUUID(), value: { ...(c.value as object), sequence: 1 } }).ok, false);
  s.dispatch(cmd("release", null)); assert.equal(s.state.workbuddy.fileWorkspace.pointer, null);
  assert.equal(s.dispatch({ ...c, id: crypto.randomUUID(), value: { ...(c.value as object), sequence: 3 } }).ok, false);
});
test("saving is explicit, refuses external conflicts, and unsaved close requires a choice", () => {
  const { s, fileId } = setup(); select(s, fileId); draft(s, fileId); edit(s, fileId, "改为：保存后的标题"); preview(s, fileId); apply(s, fileId);
  assert.equal(s.dispatch(cmd("wb-window-close", { fileId, revision: 1, action: "clean", operationId: "close-clean" })).ok, false);
  assert.equal(s.dispatch(cmd("wb-doc-save", { fileId, documentRevision: 1, operationId: "save-a" })).ok, true);
  assert.equal(documentDirty(doc(s, fileId)), false); assert.match(s.state.workbuddy.files.find(f => f.id === fileId)!.content, /保存后的标题/);
  s.state.workbuddy.files.find(f => f.id === fileId)!.contentRevision!++;
  assert.equal(s.dispatch(cmd("wb-doc-save", { fileId, documentRevision: 1, operationId: "save-conflict" })).ok, false);
});
test("Markdown saves automatically while document edits stay in the working copy", () => {
  const s = new Store(); s.dispatch(cmd("open", "workbuddy"));
  s.dispatch(cmd("wb-window-new", { kind: "markdown", operationId: "md" }));
  const fileId = s.state.workbuddy.fileWorkspace.active!;
  assert.equal(s.dispatch(cmd("wb-doc-text", { fileId, documentRevision: 0, text: "自动保存文字" })).ok, true);
  assert.equal(s.state.workbuddy.files.find(f => f.id === fileId)!.content, "自动保存文字"); assert.equal(documentDirty(doc(s, fileId)), false);
  s.dispatch(cmd("wb-window-new", { kind: "word", operationId: "word" })); const id = s.state.workbuddy.fileWorkspace.active!;
  s.dispatch(cmd("wb-doc-text", { fileId: id, documentRevision: 0, text: "未保存文字" }));
  assert.equal(s.state.workbuddy.files.find(f => f.id === id)!.content, ""); assert.equal(documentDirty(doc(s, id)), true);
});
test("hand drawn example needs confirmed nodes and generates real editable roadmap objects", () => {
  const stages = [{ name: "核对需求", date: "11 月" }, { name: "采购", date: "12 月" }, { name: "交付", date: "1 月" }, { name: "验收", date: "2 月" }];
  const { s, fileId } = setup("roadmap", { stages, confirmed: true, sourceId: "builtin-sketch-v1" });
  assert.equal(doc(s, fileId).pages.length, 2); assert.equal(doc(s, fileId).pages[0].objects[1].text, "11 月\n核对需求");
  select(s, fileId, 1); draft(s, fileId); edit(s, fileId, "向右移动 40"); preview(s, fileId); apply(s, fileId); assert.equal(doc(s, fileId).pages[0].objects[1].x, 90);
  const value = s.state.workbuddy.operations['create-deck'].signature;
  assert.match(value, /builtin-sketch-v1/);
});
test("additive file workspace migration backs up before mutation and preserves first slice receipts", () => {
  const { s } = setup(); const old = structuredClone(s.state); delete (old.workbuddy as Partial<typeof old.workbuddy>).fileWorkspace;
  const untouched = structuredClone(old); assert.throws(() => restoreWorkBuddy(old, () => { throw Error("full"); })); assert.deepEqual(old, untouched);
  const keys: string[] = []; restoreWorkBuddy(old, key => keys.push(key)); assert.deepEqual(keys, ["mobile-input:backup:workbuddy-files-v1"]);
  assert.deepEqual(old.workbuddy.operations, untouched.workbuddy.operations); assert.deepEqual(old.workbuddy.approvals, untouched.workbuddy.approvals);
});
test("a newer pointer gesture retires the earlier gesture so delayed selection cannot override it", () => {
  const { s, fileId } = setup(), space = s.state.workbuddy.fileWorkspace;
  const payload = { fileId, documentRevision: 0, pageId: space.pageId, pointerEpoch: space.pointerEpoch, x: .2, y: .2, phase: "move", sequence: 1 };
  assert.equal(s.dispatch(cmd("wb-doc-pointer", { ...payload, gesture: "old" })).ok, true);
  assert.equal(s.dispatch(cmd("wb-doc-pointer", { ...payload, gesture: "new" })).ok, true);
  assert.equal(s.dispatch(cmd("wb-doc-pointer", { ...payload, gesture: "old", sequence: 3, phase: "select" })).ok, false);
  assert.equal(doc(s, fileId).selection, null);
});
test("discard restores saved content, cancels previews and re-opening restores the remembered page", () => {
  const { s, fileId } = setup(); const second = doc(s, fileId).pages[1].id;
  s.dispatch(cmd("wb-doc-page", { fileId, documentRevision: 0, pageId: second }));
  s.dispatch(cmd("wb-doc-select", { fileId, documentRevision: 0, pageId: second, objectIds: [doc(s, fileId).pages[1].objects[0].id] }));
  draft(s, fileId); edit(s, fileId, "改成绿色"); preview(s, fileId); apply(s, fileId);
  assert.equal(s.dispatch(cmd("wb-window-close", { fileId, revision: 1, action: "discard", operationId: "discard" })).ok, true);
  assert.equal(doc(s, fileId).pages[1].objects[0].color, "#20304a"); assert.equal(doc(s, fileId).revision, 2);
  s.dispatch(cmd("wb-window-open", { fileId })); assert.equal(s.state.workbuddy.fileWorkspace.pageId, second);
});
test("saving a modified PPT invalidates its earlier independent share approval", () => {
  const { s, fileId } = setup(), file = s.state.workbuddy.files.find(f => f.id === fileId)!;
  assert.equal(s.dispatch(cmd("wb-approval-request", { taskId: file.task, artifactId: fileId, artifactRevision: file.contentRevision, group: "project", operationId: "share" })).ok, true);
  const request = s.state.workbuddy.approvals.at(-1)!;
  select(s, fileId); draft(s, fileId); edit(s, fileId, "改为：新的已保存标题"); preview(s, fileId); apply(s, fileId);
  s.dispatch(cmd("wb-doc-save", { fileId, documentRevision: 1, operationId: "save-updated" }));
  assert.equal(s.dispatch(cmd("wb-approval-decide", { requestId: request.id, expectedRevision: request.revision, taskId: file.task, decision: "approve", operationId: "old-yes" })).ok, false);
  assert.equal(s.state.workbuddy.shareEffects.length, 0);
});
test("malformed selection references fail without throwing and legacy PPT text editing cannot desynchronize geometry", () => {
  const { s, fileId } = setup();
  assert.equal(s.dispatch(cmd("wb-doc-draft-open", { fileId, documentRevision: 0, draftId: "bad-selection", source: "text", selection: { fileId, documentRevision: 0, pageId: doc(s, fileId).pages[0].id, objectIds: null } })).ok, false);
  assert.equal(s.dispatch(cmd("wb-file", { id: fileId, action: "refresh" })).ok, false);
  assert.equal(doc(s, fileId).revision, 0);
});
test("PPT reset restores its generated objects, remains undoable and never resets receipt task data", () => {
  const { s, fileId } = setup(); select(s, fileId); draft(s, fileId); edit(s, fileId, "改为：待重置的标题"); preview(s, fileId); apply(s, fileId);
  const receipts = structuredClone(s.state.workbuddy.fileWorkspace.receipts), tasks = structuredClone(s.state.workbuddy.tasks);
  const c = cmd("wb-doc-reset", { fileId, documentRevision: 1, operationId: "reset-ppt" });
  assert.equal(s.dispatch(c).ok, true); assert.equal(doc(s, fileId).pages[0].objects[0].text, "客户项目汇报"); assert.equal(doc(s, fileId).revision, 2);
  assert.deepEqual(s.state.workbuddy.tasks, tasks); assert.deepEqual(s.state.workbuddy.fileWorkspace.receipts, receipts);
  assert.equal(s.dispatch({ ...c, id: crypto.randomUUID() }).ok, true); assert.equal(doc(s, fileId).revision, 2);
  s.dispatch(cmd("wb-doc-undo", { fileId, documentRevision: 2, operationId: "undo-reset" })); assert.equal(doc(s, fileId).pages[0].objects[0].text, "待重置的标题");
});
test("relaunching WorkBuddy preserves document drafts but still opens the existing New Task surface", () => {
  const { s, fileId } = setup(); select(s, fileId); draft(s, fileId); edit(s, fileId, "改为：重新进入后保留"); preview(s, fileId);
  const before = structuredClone(doc(s, fileId));
  assert.equal(s.dispatch(cmd("open", "desktop")).ok, true); assert.equal(s.dispatch(cmd("open", "workbuddy")).ok, true);
  assert.equal(s.state.workbuddy.page, "home"); assert.equal(s.state.workbuddy.task, "new"); assert.equal(s.state.workbuddy.fileWorkspace.open, false); assert.deepEqual(doc(s, fileId).drafts, before.drafts);
  assert.equal(s.dispatch(anchored(s, fileId, "wb-doc-apply", { proposalId: "preview-a", operationId: "hidden-apply" })).ok, false);
  s.dispatch(cmd("wb-window-open", { fileId })); assert.equal(s.dispatch(anchored(s, fileId, "wb-doc-apply", { proposalId: "preview-a", operationId: "visible-apply" })).ok, true);
});
