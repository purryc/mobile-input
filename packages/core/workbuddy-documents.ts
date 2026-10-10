import type { Command, State } from "./model";
import { newWbDraft, type WbDraft, type WbFile } from "./workbuddy";
import { checkInput, operationReplay, saveOperation, validId } from "./workbuddy-mobile";
import { newReceiptState, ensureReceiptTask, type ReceiptState } from "./workbuddy-receipts";

export interface WbObject { id: string; role: string; text: string; x: number; y: number; width: number; height: number; fontSize: number; color: string; fill: string; }
export interface WbPage { id: string; title: string; objects: WbObject[]; }
export interface WbDocumentContent { pages: WbPage[]; text: string; }
export interface WbSelection { fileId: string; documentRevision: number; pageId: string; objectIds: string[]; }
export interface WbDocumentDraft extends WbDraft { id: string; targetRevision: number; selection: WbSelection; source: "text" | "voice-demo"; status: "editing" | "preview" | "applied" | "canceled"; }
export interface WbPatch { objectId: string; before: WbObject; after: WbObject; }
export interface WbProposal { id: string; draftId: string; instruction: string; selection: WbSelection; patches: WbPatch[]; status: "pending" | "applied" | "canceled"; }
export interface WbDocument extends WbDocumentContent {
  fileId: string; revision: number; savedRevision: number; sourceRevision: number; saved: WbDocumentContent; initial: WbDocumentContent; currentPageId: string | null;
  undo: WbDocumentContent[]; redo: WbDocumentContent[]; selection: WbSelection | null;
  drafts: Record<string, WbDocumentDraft>; proposals: WbProposal[];
}
export interface WbFileWorkspace {
  version: 1; open: boolean; tabs: string[]; active: string | null; pageId: string | null; recent: string[];
  documents: Record<string, WbDocument>; pointerEpoch: number; retiredGestures: string[];
  receipts: ReceiptState;
  pointer: { fileId: string; pageId: string; x: number; y: number; gesture: string; sequence: number } | null;
}
export const newFileWorkspace = (): WbFileWorkspace => ({ version: 1, open: false, tabs: [], active: null, pageId: null, recent: [], documents: {}, pointerEpoch: 0, retiredGestures: [], pointer: null, receipts: newReceiptState() });
export const documentDraftTarget = (id: string) => `wb:doc-draft:${id}`;
const data = (d: WbDocument): WbDocumentContent => structuredClone({ pages: d.pages, text: d.text });
export const documentDirty = (d: WbDocument) => JSON.stringify(data(d)) !== JSON.stringify(d.saved);
export function releaseDocumentPointer(s: State) { const w = s.workbuddy.fileWorkspace; if (w) { w.pointer = null; w.pointerEpoch++; w.retiredGestures = []; } }
export function forgetDocument(s: State, fileId: string) {
  const w = s.workbuddy.fileWorkspace;
  w.tabs = w.tabs.filter(id => id !== fileId); w.recent = w.recent.filter(id => id !== fileId); delete w.documents[fileId];
  if (w.active === fileId) { w.active = w.tabs.at(-1) || null; w.pageId = w.active ? w.documents[w.active].currentPageId : null; releaseDocumentPointer(s); }
  w.open = !!w.tabs.length;
}
function remember(d: WbDocument) { d.undo.push(data(d)); if (d.undo.length > 30) d.undo.shift(); d.redo = []; }
function changed(s: State, d: WbDocument) { d.revision++; d.selection = null; releaseDocumentPointer(s); }
function obj(id: string, role: string, text: string, x: number, y: number, width: number, height: number, fontSize = 26, fill = "transparent"): WbObject {
  return { id, role, text, x, y, width, height, fontSize, fill, color: "#20304a" };
}
function demoPages(s: State, id: string, title: string, stages?: { name: string; date: string }[]): WbPage[] {
  if (stages) return [
    { id: `${id}-page-1`, title: "项目 Roadmap", objects: [obj(`${id}-title`, "标题", title, 55, 45, 850, 70, 38),
      ...stages.map((stage, i) => obj(`${id}-stage-${i}`, `阶段 ${i + 1}`, `${stage.date}\n${stage.name}`, 50 + i * 225, 210, 200, 170, 25, "#e8f2ec")), obj(`${id}-caption`, "说明", "先确认里程碑，再推进下一阶段", 60, 430, 820, 50, 22)] },
    { id: `${id}-page-2`, title: "交付与验收", objects: [obj(`${id}-delivery-title`, "标题", "每个阶段都留下可确认的成果", 55, 45, 850, 75, 36), ...stages.map((stage, i) => obj(`${id}-detail-${i}`, `阶段成果 ${i + 1}`, `${stage.name}\n负责人确认 · 完成后验收`, 55 + (i % 2) * 440, 150 + Math.floor(i / 2) * 170, 400, 140, 24, "#f3f5f7"))] },
  ];
  return [
    { id: `${id}-page-1`, title: "销售方案", objects: [obj(`${id}-title`, "标题", title, 55, 65, 850, 100, 40), obj(`${id}-subtitle`, "副标题", "澄星设计 · 办公设备采购", 60, 210, 800, 70, 28), obj(`${id}-goal`, "交付目标", "预算上限 20 万元\n10 月 28 日前完成验收", 60, 330, 800, 130, 27, "#eef3f8")] },
    { id: `${id}-page-2`, title: "设备配置", objects: [obj(`${id}-products-title`, "标题", "统一设备配置", 55, 45, 850, 80, 38), ...s.reportProducts.slice(0, 3).map((p, i) => obj(`${id}-product-${i}`, `产品 ${i + 1}`, `${p.name}\n${p.quantity} 件`, 55 + i * 290, 200, 260, 170, 26, "#f1f4f7"))] },
    { id: `${id}-page-3`, title: "下一步", objects: [obj(`${id}-next-title`, "标题", "明确节点，统一交付", 55, 65, 850, 100, 38), obj(`${id}-steps`, "行动清单", "确认配置与报价\n确定安装地点\n交付、安装与验收", 60, 210, 800, 240, 30, "#eef5f1")] },
  ];
}
function makeDocument(file: WbFile, pages: WbPage[] = []): WbDocument {
  const content = { pages, text: file.content };
  return { ...content, fileId: file.id, revision: 0, savedRevision: 0, sourceRevision: file.contentRevision || 0, currentPageId: pages[0]?.id || null, saved: structuredClone(content), initial: structuredClone(content), undo: [], redo: [], selection: null, drafts: {}, proposals: [] };
}
function open(s: State, file: WbFile) {
  const w = s.workbuddy.fileWorkspace;
  w.documents[file.id] ||= makeDocument(file);
  if (!w.tabs.includes(file.id)) w.tabs.push(file.id);
  if (w.active !== file.id) releaseDocumentPointer(s);
  w.active = file.id; w.pageId = w.documents[file.id].currentPageId || w.documents[file.id].pages[0]?.id || null; w.open = true;
  w.recent = [file.id, ...w.recent.filter(id => id !== file.id)].slice(0, 10);
}
function save(s: State, d: WbDocument, force = false): string | null {
  const f = s.workbuddy.files.find(f => f.id === d.fileId);
  if (!f) return "原文件已不存在";
  if ((f.contentRevision || 0) !== d.sourceRevision) return "文件在别处发生了修改，当前工作副本已保留；放弃并重新打开后载入最新版本";
  if (!force && !documentDirty(d)) return null;
  f.content = d.pages.length ? d.pages.map(p => `# ${p.title}\n\n${p.objects.map(o => o.text).join("\n\n")}`).join("\n\n") : d.text;
  f.draft = newWbDraft(f.content); f.edited = true; f.contentRevision = (f.contentRevision || 0) + 1;
  d.sourceRevision = f.contentRevision; d.savedRevision = d.revision; d.saved = data(d);
  return null;
}
export function selectionAvailable(s: State, sel: WbSelection): string | null {
  if (!sel || typeof sel.fileId !== "string" || typeof sel.pageId !== "string" || !Number.isInteger(sel.documentRevision) || !Array.isArray(sel.objectIds) || sel.objectIds.some(id => typeof id !== "string")) return "选区引用无效";
  const w = s.workbuddy.fileWorkspace, d = w.documents[sel.fileId], page = d?.pages.find(p => p.id === sel.pageId);
  if (!d || !s.workbuddy.files.some(f => f.id === sel.fileId)) return "文档已不存在";
  if (d.revision !== sel.documentRevision) return "文档版本已变化，请重新选择并确认";
  if ((s.workbuddy.files.find(f => f.id === sel.fileId)?.contentRevision || 0) !== d.sourceRevision) return "原文件已被其他编辑器更新，请核对文件版本";
  if (!page || !sel.objectIds.length || sel.objectIds.some(id => !page.objects.some(o => o.id === id))) return "选区对象已变化";
  if (!w.open || w.active !== sel.fileId || w.pageId !== sel.pageId) return "请返回草稿绑定的文件和页面再确认";
  return null;
}
function makePatches(d: WbDocument, draft: WbDocumentDraft): WbPatch[] | string {
  const page = d.pages.find(p => p.id === draft.selection.pageId)!;
  const text = draft.text.trim(), replace = text.match(/(?:改为|改成|替换为)[：:]\s*([\s\S]+)/);
  const color = text.match(/(?:改成|改为|颜色)[：:\s]*(蓝色|绿色|黑色|红色)/);
  const size = text.match(/字号[：:\s]*(\d+)/), move = text.match(/向(右|左|上|下)移动\s*(\d+)/);
  if (!replace && !color && !size && !move) return "当前演示支持：改为：文字、改成蓝色/绿色/黑色/红色、字号 28、向右/左/上/下移动 40";
  if (size && (+size[1] < 12 || +size[1] > 72)) return "字号需在 12–72 之间";
  if (move && (+move[2] < 1 || +move[2] > 300)) return "移动距离需在 1–300 之间";
  if (replace && replace[1].length > 500) return "对象文字最多 500 字";
  const colors = { 蓝色: "#2563eb", 绿色: "#168455", 黑色: "#1f2937", 红色: "#dc2626" };
  return draft.selection.objectIds.map(id => {
    const before = structuredClone(page.objects.find(o => o.id === id)!), after = structuredClone(before);
    if (replace) after.text = replace[1].trim();
    if (color) after.color = colors[color[1] as keyof typeof colors];
    if (size) after.fontSize = +size[1];
    if (move) { const n = +move[2], dir = move[1]; if (dir === "右" || dir === "左") after.x = Math.max(0, Math.min(960 - after.width, after.x + (dir === "右" ? n : -n))); else after.y = Math.max(0, Math.min(540 - after.height, after.y + (dir === "下" ? n : -n))); }
    return { objectId: id, before, after };
  });
}
function draftError(s: State, c: Command, d: WbDocumentDraft | undefined): string | null {
  if (!d || d.status === "applied" || d.status === "canceled") return "编辑草稿已结束，原文字已保留";
  const v = c.value as Record<string, unknown>;
  if (c.targetId !== documentDraftTarget(d.id) || c.targetRevision !== d.targetRevision) return "编辑目标已变化，草稿已保留";
  if (v.revision !== d.revision) return "草稿版本已变化";
  return selectionAvailable(s, d.selection);
}
export function documentInteraction(s: State, c: Command): string | null | undefined {
  if (!c.type.startsWith("wb-doc-") && !c.type.startsWith("wb-window-") && c.type !== "wb-deck-create") return undefined;
  const w = s.workbuddy.fileWorkspace, v = (c.value || {}) as Record<string, unknown>;
  const durable = ["wb-deck-create", "wb-doc-preview", "wb-doc-apply", "wb-doc-undo", "wb-doc-redo", "wb-doc-reset", "wb-doc-save", "wb-window-close", "wb-window-new"].includes(c.type);
  if (durable) { const replay = operationReplay(s, c); if (replay !== undefined) return replay; }
  if (c.type === "wb-deck-create") {
    const input = s.workbuddy.inputDrafts[String(v.draftId)], error = checkInput(s, c, input);
    if (error) return error;
    if (input.purpose !== "create" || typeof v.text !== "string" || !v.text.trim() || v.text.length > 20000) return "请填写演示任务主题";
    let stages: { name: string; date: string }[] | undefined;
    if (v.template === "roadmap") {
      if (v.sourceId !== "builtin-sketch-v1" || v.confirmed !== true || !Array.isArray(v.stages) || v.stages.length !== 4) return "请先核对内置手绘示例的四个阶段";
      if (v.stages.some(a => !a || typeof a.name !== "string" || !a.name.trim() || a.name.length > 40 || typeof a.date !== "string" || !a.date.trim() || a.date.length > 30)) return "请填写有效阶段与日期";
      stages = structuredClone(v.stages);
    } else if (v.template !== "sales") return "此演示模板不存在";
    const id = String(v.operationId), fileId = `deck-${id}`;
    const title = (v.text.match(/标题[：:]\s*(.+)/)?.[1] || v.text.trim()).slice(0, 80);
    const f: WbFile = { id: fileId, name: `${title.slice(0, 30)}.pptx`, kind: "slides", content: title, draft: newWbDraft(title), folder: "澄星设计", task: id, edited: false, dataVersion: s.reportRevision, contentRevision: 0 };
    const d = makeDocument(f, demoPages(s, fileId, title, stages));
    s.workbuddy.files.push(f); w.documents[fileId] = d;
    // Initial generation is already a saved local demo, subsequent edits require Save.
    save(s, d, true); f.edited = false;
    s.workbuddy.tasks.unshift({ id, title, messages: [{ id: `${id}-u`, role: "user", text: v.text }, { id: `${id}-a`, role: "assistant", text: stages ? "已根据核对后的示例节点生成可编辑 Roadmap（本地模拟）。" : "已用固定销售模板生成可编辑 PPT（本地模拟）。" }], status: "complete", kind: "slides", mode: "agent", model: "本地模板", expert: "", project: "chengxing", favorite: false, step: 3, epoch: id, startedAt: 0, elapsed: 0, files: [fileId], dataVersion: s.reportRevision });
    s.workbuddy.drafts[id] = newWbDraft(); input.text = ""; input.revision++; input.consumedBy = id;
    open(s, f); ensureReceiptTask(s); saveOperation(s, c, id); return null;
  }
  if (c.type === "wb-window-new") {
    if (v.kind !== "markdown" && v.kind !== "word") return "本轮新建支持 Markdown 和纯文本文档；PPT 请从手机模板任务创建";
    const id = `doc-${v.operationId}`, f: WbFile = { id, name: v.kind === "markdown" ? "未命名.md" : "未命名.docx", kind: v.kind, content: "", draft: newWbDraft(), folder: "澄星设计", task: "", edited: false, dataVersion: s.reportRevision };
    s.workbuddy.files.push(f); open(s, f); saveOperation(s, c, ""); return null;
  }
  const fileId = String(v.fileId || ""), f = s.workbuddy.files.find(f => f.id === fileId);
  if (!f) return "文件已不存在";
  if (c.type === "wb-window-open") { open(s, f); return null; }
  const d = w.documents[fileId]; if (!d) return "请先打开文件窗口";
  if (c.type === "wb-window-reorder") {
    if (!Array.isArray(v.tabs) || v.tabs.length !== w.tabs.length || new Set(v.tabs).size !== w.tabs.length || v.tabs.some(id => !w.tabs.includes(id))) return "标签顺序无效";
    w.tabs = [...v.tabs]; return null;
  }
  if (c.type === "wb-window-close") {
    if (v.revision !== d.revision) return "关闭前文档版本已变化，请重新确认";
    if (!["save", "discard", "clean"].includes(String(v.action))) return "请选择保存或放弃";
    if (documentDirty(d) && v.action === "clean") return "存在未保存修改，请先确认";
    if (v.action === "save") { const error = save(s, d); if (error) return error; }
    if (v.action === "discard") { Object.assign(d, structuredClone(d.saved)); d.undo = []; d.redo = []; changed(s, d); }
    for (const p of d.proposals) if (p.status === "pending") p.status = "canceled";
    for (const draft of Object.values(d.drafts)) if (draft.status === "preview" || draft.status === "editing") draft.status = "canceled";
    w.tabs = w.tabs.filter(id => id !== fileId);
    if (w.active === fileId) { w.active = w.tabs.at(-1) || null; w.pageId = w.active ? w.documents[w.active].pages[0]?.id || null : null; }
    w.open = !!w.tabs.length; releaseDocumentPointer(s);
    // Reload externally changed text only after an explicit discard/clean close.
    if ((f.contentRevision || 0) !== d.sourceRevision && !d.pages.length) delete w.documents[fileId];
    saveOperation(s, c, f.task); return null;
  }
  if (v.documentRevision !== d.revision) return "文档版本已变化，请重新确认";
  if (c.type === "wb-doc-reset") {
    if (!d.pages.length || !d.initial.pages.length) return "该文件没有可重置的 PPT 演示";
    remember(d); Object.assign(d, structuredClone(d.initial)); changed(s, d);
    for (const p of d.proposals) if (p.status === "pending") p.status = "canceled";
    for (const draft of Object.values(d.drafts)) if (["editing", "preview"].includes(draft.status)) draft.status = "canceled";
    saveOperation(s, c, f.task); return null;
  }
  if (c.type === "wb-doc-save") { const error = save(s, d); if (!error) saveOperation(s, c, f.task); return error; }
  if (c.type === "wb-doc-undo" || c.type === "wb-doc-redo") {
    const from = c.type === "wb-doc-undo" ? d.undo : d.redo, to = c.type === "wb-doc-undo" ? d.redo : d.undo;
    if (!from.length) return "当前文档没有可撤销或重做的修改";
    to.push(data(d)); Object.assign(d, from.pop()!); changed(s, d);
    if (f.kind === "markdown") { const error = save(s, d); if (error) return error; }
    saveOperation(s, c, f.task); return null;
  }
  if (c.type === "wb-doc-text") {
    if (!['markdown', 'word'].includes(f.kind) || d.pages.length) return "该文件只支持预览";
    if (typeof v.text !== "string" || v.text.length > 20000) return "文本无效或过长";
    remember(d); d.text = v.text; changed(s, d); return f.kind === "markdown" ? save(s, d) : null;
  }
  const page = d.pages.find(p => p.id === v.pageId);
  if (c.type === "wb-doc-page") {
    if (!page || w.active !== fileId) return "页面不存在或文件已切换";
    w.pageId = page.id; d.currentPageId = page.id; d.selection = null; releaseDocumentPointer(s); return null;
  }
  if (c.type === "wb-doc-select") {
    if (!page || w.active !== fileId || w.pageId !== page.id || !Array.isArray(v.objectIds) || new Set(v.objectIds).size !== v.objectIds.length || v.objectIds.some(id => !page.objects.some(o => o.id === id))) return "选区无效";
    d.selection = v.objectIds.length ? { fileId, documentRevision: d.revision, pageId: page.id, objectIds: [...v.objectIds] } : null; return null;
  }
  if (c.type === "wb-doc-pointer") {
    if (!page || w.active !== fileId || w.pageId !== page.id || !w.open || v.pointerEpoch !== w.pointerEpoch) return "指向已结束，请重新开始";
    if (!validId(v.gesture) || !Number.isInteger(v.sequence) || Number(v.sequence) < 1 || typeof v.x !== "number" || typeof v.y !== "number" || !Number.isFinite(v.x) || !Number.isFinite(v.y) || v.x < 0 || v.x > 1 || v.y < 0 || v.y > 1 || !["move", "select", "cancel"].includes(String(v.phase))) return "指针样本无效";
    if (w.pointer?.gesture === v.gesture && Number(v.sequence) <= w.pointer.sequence) return "已忽略过期指针样本";
    if (w.retiredGestures.includes(v.gesture)) return "指向手势已结束";
    if (w.pointer && w.pointer.gesture !== v.gesture) { w.retiredGestures.push(w.pointer.gesture); if (w.retiredGestures.length > 64) w.retiredGestures.shift(); }
    if (v.phase === "cancel") { releaseDocumentPointer(s); return null; }
    w.pointer = { fileId, pageId: page.id, x: v.x, y: v.y, gesture: v.gesture, sequence: Number(v.sequence) };
    if (v.phase === "select") {
      let hits: WbObject[];
      if (v.box !== undefined) {
        const box = v.box as { x: number; y: number };
        if (!box || ![box.x, box.y].every(n => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1)) return "框选范围无效";
        const x1 = Math.min(box.x, v.x) * 960, y1 = Math.min(box.y, v.y) * 540, x2 = Math.max(box.x, v.x) * 960, y2 = Math.max(box.y, v.y) * 540;
        hits = page.objects.filter(o => o.x < x2 && o.x + o.width > x1 && o.y < y2 && o.y + o.height > y1);
      } else hits = page.objects.filter(o => v.x as number >= o.x / 960 && v.x as number <= (o.x + o.width) / 960 && v.y as number >= o.y / 540 && v.y as number <= (o.y + o.height) / 540).slice(-1);
      const ids = v.additive && d.selection?.pageId === page.id ? [...new Set([...d.selection.objectIds, ...hits.map(o => o.id)])] : hits.map(o => o.id);
      d.selection = ids.length ? { fileId, documentRevision: d.revision, pageId: page.id, objectIds: ids } : null;
    }
    return null;
  }
  const draftId = String(v.draftId || ""), draft = d.drafts[draftId];
  if (!validId(draftId)) return "编辑草稿标识无效";
  if (c.type === "wb-doc-draft-open") {
    if (draft) return draft.source === v.source && JSON.stringify(draft.selection) === JSON.stringify(v.selection) ? null : "草稿归属不匹配";
    if (!["text", "voice-demo"].includes(String(v.source)) || !v.selection || (v.selection as WbSelection).fileId !== fileId) return "请输入有效选区引用";
    const sel = v.selection as WbSelection, error = selectionAvailable(s, sel); if (error) return error;
    if (new Set(sel.objectIds).size !== sel.objectIds.length) return "选区有重复对象";
    d.drafts[draftId] = { ...newWbDraft(), id: draftId, selection: structuredClone(sel), source: v.source as WbDocumentDraft["source"], targetRevision: s.revision + 1, status: "editing" };
    return null;
  }
  if (c.type === "wb-doc-cancel") {
    if (!draft) return "草稿不存在";
    if (draft.status === "applied") return "已应用的修改请使用文档撤销";
    draft.status = "canceled"; for (const p of d.proposals) if (p.draftId === draftId && p.status === "pending") p.status = "canceled";
    return null;
  }
  if (c.type === "wb-doc-draft-edit") {
    // Text is still recoverable while another page is active; preview/apply check the frozen selection.
    if (!draft || !["editing", "preview"].includes(draft.status) || c.targetId !== documentDraftTarget(draft.id) || c.targetRevision !== draft.targetRevision || v.revision !== draft.revision) return "草稿目标或版本已变化";
    if (typeof v.text !== "string" || v.text.length > 20000 || !validId(v.session) || !Number.isInteger(v.sequence) || Number(v.sequence) < 1) return "编辑输入无效";
    if (draft.session === v.session && Number(v.sequence) <= draft.sequence) return "已忽略过期编辑";
    draft.text = v.text; draft.revision++; draft.sequence = Number(v.sequence); draft.session = String(v.session); draft.status = "editing";
    for (const p of d.proposals) if (p.draftId === draftId && p.status === "pending") p.status = "canceled";
    return null;
  }
  const error = draftError(s, c, draft); if (error) return error;
  if (c.type === "wb-doc-preview") {
    const patches = makePatches(d, draft); if (typeof patches === "string") return patches;
    if (patches.every(p => JSON.stringify(p.before) === JSON.stringify(p.after))) return "修改与当前内容一致";
    for (const p of d.proposals) if (p.draftId === draftId && p.status === "pending") p.status = "canceled";
    const proposalId = String(v.operationId);
    d.proposals.push({ id: proposalId, draftId, instruction: draft.text, selection: structuredClone(draft.selection), patches, status: "pending" }); draft.status = "preview";
    saveOperation(s, c, f.task, proposalId); return null;
  }
  if (c.type === "wb-doc-apply") {
    const p = d.proposals.find(p => p.id === v.proposalId && p.draftId === draftId);
    if (!p || p.status !== "pending" || p.instruction !== draft.text) return "预览已结束或指令已变化";
    const currentPage = d.pages.find(page => page.id === p.selection.pageId)!;
    if (p.patches.some(patch => JSON.stringify(currentPage.objects.find(o => o.id === patch.objectId)) !== JSON.stringify(patch.before))) return "预览前值已变化，请重新生成";
    remember(d); for (const patch of p.patches) Object.assign(currentPage.objects.find(o => o.id === patch.objectId)!, structuredClone(patch.after));
    p.status = "applied"; draft.status = "applied"; changed(s, d); saveOperation(s, c, f.task, p.id); return null;
  }
  return "文档操作不存在";
}
