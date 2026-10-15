import type {ObjectInput} from "./workbuddy-object";
import type { State, Command, OfficeFile, Product, Slide, DataTable, ObjectTextStyle } from "./model";
import { totals, money } from "./model";
import type { WbFile, WbDraft } from "./workbuddy";
export type FileFormat =
  | "word"
  | "sheet"
  | "slides"
  | "markdown"
  | "html"
  | "pdf"
  | "text"
  | "image"
  | "audio"
  | "video";
export interface FileBody {
  objectStyles?: Record<string,ObjectTextStyle>;
  table?: DataTable;
  text: string;
  marks?: Record<string, string[]>;
  paragraphs?: string[];
  products?: Product[];
  slides?: Slide[];
  asset?: string;
}
export interface FileDocument {
  revision: number;
  saved: FileBody;
  savedAt: number;
  changes: {
    id: string;
    at: number;
    source: string;
    before: FileBody;
    after: FileBody;
  }[];
}
export interface WorkingFile {
  base: number;
  body: FileBody;
  version: number;
  history: FileBody[];
  future: FileBody[];
  changedAt: number;
  highlight: string[];
}
export interface FileSelection {
  file: string;
  paths: string[];
  text: string;
  start?: number;
  end?: number;
}
export interface FileView {
  id: string;
  tabs: string[];
  active: string | null;
  ai: boolean;
  aiWidth: number;
  working: Record<string, WorkingFile>;
  selection: FileSelection | null;
}
export interface FileConversation {
  task: string;
  draft: WbDraft;
  messages: { id: string; role: "user" | "assistant"; text: string }[];
  pending: null | {
    id: string;
    at: number;
    file: string;
    view: string;
    revision: number;
    version: number;
    text: string;
    operation: string;
    selection: FileSelection | null;
  };
  unknown: string;
}
export interface FileBrowserState {
  objectInputs?: Record<string,ObjectInput>;
  objectPointer?: {view:string;file:string;targetRevision:number;x:number;y:number;gesture:string;sequence:number;commit:string;at:number};
  version: 1;
  visible: boolean;
  docs: Record<string, FileDocument>;
  windows: FileView[];
  panel: FileView;
  recent: string[];
  conversations: Record<string, FileConversation>;
  bindings: Record<
    string,
    { view: string; file: string; path: string; revision: number }
  >;
  panelMode: "artifacts" | "workspace" | "changes" | "browser";
}
const clone = <T>(x: T): T => structuredClone(x);
function equal(a:unknown,b:unknown):boolean {
  if(Object.is(a,b))return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((value,i)=>equal(value,b[i]));
  const left=a as Record<string,unknown>,right=b as Record<string,unknown>,keys=Object.keys(left).filter(k=>left[k]!==undefined),other=Object.keys(right).filter(k=>right[k]!==undefined);
  return keys.length===other.length&&keys.every(k=>Object.hasOwn(right,k)&&equal(left[k],right[k]));
}
export const fileDraft = (text = ""): WbDraft => ({
  text,
  revision: 0,
  sequence: 0,
  session: "",
  attachments: [],
  references: [],
});
export const fileView = (id: string): FileView => ({
  id,
  tabs: [],
  active: null,
  ai: false,
  aiWidth: 28,
  working: {},
  selection: null,
});
export const initialFileBrowser = (): FileBrowserState => ({
  version: 1,
  visible: false,
  docs: {},
  windows: [],
  panel: fileView("panel"),
  recent: [],
  conversations: {},
  bindings: {},
  panelMode: "artifacts",
});
export function browserState(s: State): FileBrowserState {
  return s.workbuddy.fileBrowser!;
}
export function activeFileView(s: State): FileView {
  const b = browserState(s);
  return (b.visible ? b.windows.at(-1) : null) || b.panel;
}
export function findFileView(s: State, id: string) {
  const b = browserState(s);
  return id === "panel" ? b.panel : b.windows.find((v) => v.id === id);
}
export function fileReadOnly(s: State, v: FileView, id: string) {
  const b = browserState(s);
  const owner = [...b.windows, b.panel].find((x) => x.tabs.includes(id));
  return !!owner && owner.id !== v.id;
}
function officeBody(o: OfficeFile): FileBody {
  return {
    text: "",
    ...(o.objectStyles ? {objectStyles:clone(o.objectStyles)} : {}),
    ...(o.marks ? { marks: clone(o.marks) } : {}),
    ...(o.paragraphs ? { paragraphs: clone(o.paragraphs) } : {}),
    ...(o.table ? { table: clone(o.table) } : {}),
    ...(o.products ? { products: clone(o.products) } : {}),
    ...(o.slides ? { slides: clone(o.slides) } : {}),
  };
}
export function bodyText(b: FileBody) {
  if(b.table)return [b.table.columns,...b.table.rows].map(row=>row.join(" · ")).join("\n");
  if (b.paragraphs) return b.paragraphs.join("\n\n");
  if (b.slides)
    return b.slides
      .map((s, i) => "# " + (i + 1) + ". " + s.title + "\n\n" + s.body)
      .join("\n\n");
  if (b.products) {
    const t = totals(b.products);
    return (
      b.products
        .map(
          (p) =>
            p.name + " · " + p.quantity + " 件 · " + money(totals([p]).revenue),
        )
        .join("\n") +
      "\n客户报价 " +
      money(t.revenue) +
      "\n采购成本 " +
      money(t.cost) +
      "\n毛利 " +
      money(t.profit)
    );
  }
  return b.text;
}
export function ensureFileDocuments(s: State) {
  const b =
    s.workbuddy.fileBrowser ?? (s.workbuddy.fileBrowser = initialFileBrowser());
  for (const f of s.workbuddy.files)
    if (!b.docs[f.id]) {
      const o = s.officeFiles.find((o) => o.id === f.officeId);
      b.docs[f.id] = {
        revision: 0,
        saved: o ? officeBody(o) : { text: f.content, asset: f.asset },
        savedAt: Date.now(),
        changes: [],
      };
    }
}
export function seedFileBrowser(s: State) {
  ensureFileDocuments(s);
  const w = s.workbuddy;
  const extra: {
    id: string;
    name: string;
    kind: FileFormat;
    content: string;
    asset?: string;
  }[] = [
    {
      id: "sales-html",
      name: "澄星项目工作台.html",
      kind: "html",
      content:
        "# 澄星设计采购工作台\n\n新办公室 30 套办公设备采购。\n\n客户预算 20 万元，设备分批配置、统一交付。\n\n10 月 24 日到货，10 月 28 日验收。",
    },
    {
      id: "sales-pdf",
      name: "客户需求确认.pdf",
      kind: "pdf",
      content:
        "# 澄星设计 · 客户需求确认\n\n林悦提出：为新办公室采购 30 套办公设备，每套包含商务笔记本、27 英寸显示器和扩展坞。\n\n预算上限：20 万元。\n\n---\n\n# 交付与服务\n\n10 月 24 日到货，10 月 26 日配置，10 月 28 日验收。\n\n安装地址与数据迁移范围仍待客户确认。",
    },
    {
      id: "sales-text",
      name: "会前准备清单.txt",
      kind: "text",
      content:
        "澄星项目会前准备\n1. 确认 30 套设备配置。\n2. 带上最新报价和项目介绍。\n3. 核对供货周期及验收安排。",
    },
    {
      id: "sales-image",
      name: "办公设备配置示意.svg",
      kind: "image",
      content: "办公设备配置示意",
      asset: "./assets/workbuddy/sales-equipment.svg",
    },
    {
      id: "sales-audio",
      name: "会议开场提示.wav",
      kind: "audio",
      content: "会议开始提示音",
      asset: "./assets/workbuddy/meeting-cue.wav",
    },
  ];
  for (const e of extra)
    if (!w.files.some((f) => f.id === e.id))
      w.files.push({
        ...e,
        folder: "澄星设计/会前资料",
        task: "",
        draft: fileDraft(e.content),
        edited: false,
        dataVersion: s.reportRevision,
      });
  ensureFileDocuments(s);
}
export function migrateFileBrowser(
  s: State,
  backup: (key: string, value: string) => void,
) {
  if (!s.workbuddy.fileBrowser) {
    backup("mobile-input:backup:file-browser-v1", JSON.stringify(s.workbuddy));
    const legacy = s.workbuddy.files.filter((f) => f.edited && f.officeId);
    s.workbuddy.fileBrowser = initialFileBrowser();
    for (const f of legacy)
      s.workbuddy.files.push({
        ...clone(f),
        id: f.id + "-legacy-text",
        name: f.name.replace(/\.[^.]+$/, "") + " · 旧版编辑备份.md",
        kind: "markdown",
        officeId: undefined,
        draft: fileDraft(f.content),
        task: "",
      });
  }
  seedFileBrowser(s);
  browserState(s).visible ??= false;
  delete browserState(s).objectPointer;
  for (const co of Object.values(browserState(s).conversations))
    if (co.pending) {
      co.pending = null;
      co.unknown = "上次编辑已暂停，请重新发送";
    }
  return s;
}
export function working(s: State, v: FileView, id: string) {
  const d = browserState(s).docs[id];
  return (
    v.working[id] ??
    (v.working[id] = {
      base: d.revision,
      body: clone(d.saved),
      version: 0,
      history: [],
      future: [],
      changedAt: 0,
      highlight: [],
    })
  );
}
export function fileBody(s: State, v: FileView, id: string): FileBody {
  return v.working[id]?.body || browserState(s).docs[id]?.saved || { text: "" };
}
export function fileDirty(s: State, v: FileView, id: string) {
  return (
    !!v.working[id] &&
    !equal(v.working[id].body, browserState(s).docs[id]?.saved)
  );
}
export function fileConflict(s: State, v: FileView, id: string) {
  return (
    !!v.working[id] && v.working[id].base !== browserState(s).docs[id]?.revision
  );
}
export function pathText(b: FileBody, path: string) {
  const [type, i, key] = path.split("/");
  if(type === "table")return b.table?.rows[Number(i)]?.[Number(key)] ?? "";
  if (type === "paragraph") return b.paragraphs?.[Number(i)] || "";
  if (type === "cell")
    return String(b.products?.[Number(i)]?.[key as keyof Product] ?? "");
  if (type === "slide")
    return String(b.slides?.[Number(i)]?.[key as keyof Slide] ?? "");
  return b.text;
}
export function changePath(b: FileBody, path: string, text: string): string | null {
  const [type, i, key] = path.split("/");
  if(type === "table"){
    const row=b.table?.rows[Number(i)],column=Number(key);
    if(!row||!Number.isInteger(column)||column<0||column>=row.length)return "单元格不存在";
    row[column]=text;
  } else if (type === "paragraph") {
    if (!b.paragraphs || !Number.isInteger(Number(i)) || Number(i) < 0 || Number(i) >= b.paragraphs.length) return "段落不存在";
    b.paragraphs[Number(i)] = text;
  } else if (type === "cell") {
    const p = b.products?.[Number(i)],
      n = Number(text);
    if (
      !p ||
      !["quantity", "cost", "price", "discount"].includes(key) ||
      !text.trim() ||
      !Number.isFinite(n) ||
      n < 0 ||
      (key === "quantity" && !Number.isInteger(n)) ||
      (key === "discount" && n > 100)
    )
      return "请输入有效的数量或金额";
    (p as unknown as Record<string, unknown>)[key] = n;
  } else if (type === "slide") {
    if (!b.slides?.[Number(i)] || !["title", "body", "notes"].includes(key))
      return "幻灯片对象不存在";
    b.slides[Number(i)][key as keyof Slide] = text;
  } else if (path === "text") b.text = text;
  else return "对象不存在";
  return null;
}
export function editBody(
  s: State,
  v: FileView,
  id: string,
  body: FileBody,
  source = "手动编辑",
) {
  if (fileReadOnly(s, v, id)) return "文件已在另一窗口打开，当前仅可查看";
  if (fileConflict(s, v, id)) return "文件在别处发生了修改，请刷新或另存副本";
  const a = working(s, v, id);
  if (equal(a.body, body)) return null;
  a.history.push(clone(a.body));
  a.history = a.history.slice(-40);
  a.future = [];
  a.body = clone(body);
  a.version++;
  a.changedAt = Date.now();
  a.highlight = [];
  if(source!=='手机编辑')syncBindings(s,v,id);
  return null;
}
function syncBindings(s: State, v: FileView, id: string) {
  const b = browserState(s);
  for (const [target, binding] of Object.entries(b.bindings))
    if (binding.file === id && binding.view === v.id) {
      binding.revision = b.docs[id].revision;
      const d = s.workbuddy.entityDrafts[target];
      if (d) {
        const text = pathText(fileBody(s, v, id), binding.path);
        if (d.text !== text) {
          d.text = text;
          d.revision++;
        }
        if (s.target?.id === target) s.target.value = text;
      }
    }
}
export function saveBrowserFile(
  s: State,
  v: FileView,
  id: string,
  source = "手动保存",
) {
  const b = browserState(s),
    f = s.workbuddy.files.find((f) => f.id === id);
  if (!f) return "文件不存在";
  if (fileReadOnly(s, v, id)) return "当前文件只读";
  if (fileConflict(s, v, id)) return "文件在别处发生了修改，请刷新或另存副本";
  const a = working(s, v, id),
    d = b.docs[id];
  if (!equal(a.body, d.saved)) {
    d.changes.push({
      id: id + "-" + (d.revision + 1),
      at: Date.now(),
      source,
      before: clone(d.saved),
      after: clone(a.body),
    });
    d.changes = d.changes.slice(-40);
    d.saved = clone(a.body);
    d.revision++;
    d.savedAt = Date.now();
    f.content = bodyText(d.saved);
    f.edited = true;
    f.draft = fileDraft(f.content);
    const o = s.officeFiles.find((o) => o.id === f.officeId);
    if (o) {
      if(d.saved.objectStyles)o.objectStyles=clone(d.saved.objectStyles);
      if (d.saved.marks) o.marks = clone(d.saved.marks);
      if (d.saved.table) o.table = clone(d.saved.table);
      if (d.saved.products) o.products = clone(d.saved.products);
      if (d.saved.paragraphs) o.paragraphs = clone(d.saved.paragraphs);
      if (d.saved.slides) o.slides = clone(d.saved.slides);
    }
  }
  a.base = d.revision;
  syncBindings(s, v, id);
  return null;
}
export function reconcileOfficeFiles(s: State) {
  if (!s.workbuddy.fileBrowser) return;
  ensureFileDocuments(s);
  const b = browserState(s);
  for (const f of s.workbuddy.files) {
    const o = s.officeFiles.find((x) => x.id === f.officeId);
    if (!o) continue;
    const body = officeBody(o),
      d = b.docs[f.id];
    if (equal(body, d.saved)) continue;
    d.changes.push({
      id: f.id + "-office-" + s.revision,
      at: Date.now(),
      source: "WPS 编辑",
      before: clone(d.saved),
      after: clone(body),
    });
    d.changes = d.changes.slice(-40);
    d.saved = body;
    d.revision++;
    d.savedAt = Date.now();
    f.content = bodyText(body);
    f.draft = fileDraft(f.content);
    for (const v of [...b.windows, b.panel]) {
      const a = v.working[f.id];
      if (a && equal(a.body, d.changes.at(-1)!.before)) {
        a.body = clone(body);
        a.base = d.revision;
        a.version++;
        syncBindings(s, v, f.id);
      }
    }
  }
}
function openTab(s: State, v: FileView, id: string) {
  if (!s.workbuddy.files.some((f) => f.id === id)) return "文件不存在";
  ensureFileDocuments(s);
  v.tabs = [...new Set([...v.tabs, id])];
  v.active = id;
  v.selection = null;
  if (v.id === "panel") {
    s.workbuddy.previewActive = id;
    s.workbuddy.preview = [...new Set([...s.workbuddy.preview, id])];
  }
  browserState(s).recent = [
    id,
    ...browserState(s).recent.filter((x) => x !== id),
  ].slice(0, 16);
  s.target = null;
  return null;
}
function conversation(s: State, id: string, taskId: string) {
  const b = browserState(s);
  if (!b.conversations[id]) {
    const co: FileConversation = {
      task: taskId,
      draft: fileDraft(),
      messages: [],
      pending: null,
      unknown: "",
    };
    b.conversations[id] = co;
    const f = s.workbuddy.files.find((f) => f.id === id)!;
    s.workbuddy.tasks.unshift({
      id: taskId,
      title: "文件对话 · " + f.name,
      messages: [],
      status: "complete",
      kind: null,
      mode: "ask",
      model: s.workbuddy.settings.model,
      expert: "",
      project: "chengxing",
      favorite: false,
      step: 0,
      epoch: taskId,
      startedAt: 0,
      elapsed: 0,
      files: [id],
      dataVersion: f.dataVersion,
    });
    s.workbuddy.drafts[taskId] = fileDraft();
  }
  return b.conversations[id];
}
export function fileTargetFocus(
  s: State,
  id: string,
  label?: string,
): string | null | undefined {
  const [, type, viewId, fileId, ...rest] = id.split(":");
  if (type !== "doc" && type !== "co") return undefined;
  const b = browserState(s);
  if (type === "co") {
    const f = s.workbuddy.files.find((f) => f.id === viewId);
    if (!f) return "文件不存在";
    conversation(s, f.id, "file-task-" + f.id);
    if (s.target?.id === id) return null;
    s.target = {
      id,
      app: "workbuddy",
      kind: "text",
      label: label || "和 WorkBuddy 对话 · " + f.name,
      value: b.conversations[f.id].draft.text,
      revision: s.revision + 1,
    };
    return null;
  }
  const v = findFileView(s, viewId),
    f = s.workbuddy.files.find((f) => f.id === fileId),
    path = rest.join(":");
  if (!v || v.active !== fileId || !f) return "文件目标已变化";
  if (fileReadOnly(s, v, fileId)) return "当前文件只读";
  if (["pdf", "image", "audio", "video"].includes(f.kind)) return "当前文件仅可查看";
  if (fileConflict(s, v, fileId))
    return "文件在别处发生了修改，请刷新或另存副本";
  const value = pathText(fileBody(s, v, fileId), path);
  if (s.target?.id === id) return null;
  b.bindings[id] = {
    view: viewId,
    file: fileId,
    path,
    revision: b.docs[fileId].revision,
  };
  s.workbuddy.entityDrafts[id] = fileDraft(value);
  s.target = {
    id,
    app: "workbuddy",
    kind: path.startsWith("cell/") ? "number" : "text",
    label: label || f.name,
    value,
    revision: s.revision + 1,
  };
  return null;
}
export function fileTargetDraft(s: State, id: string) {
  if (id.startsWith("wb:co:"))
    return browserState(s).conversations[id.split(":")[2]]?.draft;
  return undefined;
}
export function fileTargetEdit(
  s: State,
  id: string,
  text: string,
): string | null | undefined {
  if (!id.startsWith("wb:doc:")) return undefined;
  const binding = browserState(s).bindings[id],
    v = binding && findFileView(s, binding.view);
  if (
    !v ||
    v.active !== binding.file ||
    binding.revision !== browserState(s).docs[binding.file]?.revision
  )
    return "文件目标或版本已变化，草稿已保留";
  const body = clone(fileBody(s, v, binding.file));
  const error = changePath(body, binding.path, text);
  if (error) return error;
  return editBody(s, v, binding.file, body, '手机编辑');
}
export function fileTargetSubmit(
  s: State,
  id: string,
  text: string,
  commandId: string,
): string | null | undefined {
  if (id.startsWith("wb:doc:")) {
    const binding = browserState(s).bindings[id],
      v = binding && findFileView(s, binding.view);
    if (!v) return "编辑目标已变化";
    const err = fileTargetEdit(s, id, text);
    return err || saveBrowserFile(s, v, binding.file);
  }
  if (id.startsWith("wb:co:")) {
    const file = id.split(":")[2],
      v = activeFileView(s);
    if (v.active !== file) return "对话文件已变化";
    return startAI(s, v, file, text, commandId);
  }
  return undefined;
}
export function filePhoneContext(s: State) {
  const id = s.target?.id || "";
  const b = s.workbuddy.fileBrowser;
  if (!b) return null;
  const binding = b.bindings[id],
    file = id.startsWith("wb:co:") ? id.split(":")[2] : binding?.file;
  const f = s.workbuddy.files.find((f) => f.id === file);
  if (!f) return null;
  const v = binding ? findFileView(s, binding.view) : activeFileView(s);
  return {
    file: f,
    selection: v?.selection,
    conversation: b.conversations[f.id],
    isAI: id.startsWith("wb:co:"),
  };
}
const operations = [
  "summary",
  "polish",
  "append",
  "replace",
  "quote",
  "generate",
] as const;
function infer(text: string) {
  if (/替换为|替换|改成|修改为/.test(text)) return "replace";
  if (/总结|摘要|大纲/.test(text)) return "summary";
  if (/润色|错别字|简洁|礼貌|正式/.test(text)) return "polish";
  if (/数量|单价|折扣|价格.*\d/.test(text)) return "quote";
  if (/生成|新建/.test(text)) return "generate";
  if (/补充|介绍|续写/.test(text)) return "append";
  if (/替换|改成|修改为/.test(text)) return "replace";
  return "";
}
function startAI(
  s: State,
  v: FileView,
  id: string,
  text: string,
  epoch: string,
  operation?: string,
) {
  if (!text.trim()) return "请输入修改要求";
  const co = conversation(s, id, "file-task-" + id);
  if (co.pending) return "当前修改仍在处理";
  co.messages.push({ id: epoch, role: "user", text });
  const op = operation || infer(text);
  co.draft.text = "";
  co.draft.revision++;
  co.unknown = "";
  if (!operations.includes(op as (typeof operations)[number])) {
    co.unknown = text;
    co.messages.push({
      id: epoch + "-unknown",
      role: "assistant",
      text: "请选择要执行的操作。",
    });
    return null;
  }
  mirrorConversation(s, id);
  if (op !== "summary" && op !== "generate") {
    if (fileReadOnly(s, v, id)) return "当前文件只读";
    if (fileConflict(s, v, id)) return "文件已变化，请刷新或另存副本";
    if (!v.selection && !/全文|整份|整个|全部/.test(text))
      return "请先选择要修改的内容，或明确指定全文";
    if (
      ["pdf", "image", "audio", "video"].includes(
        s.workbuddy.files.find((f) => f.id === id)!.kind,
      )
    )
      return "当前格式仅可查看";
  }
  const a = working(s, v, id);
  if (op === "quote" && !a.body.products)
    return "请选择报价表中的数量或金额单元格";
  co.pending = {
    id: epoch,
    at: Date.now(),
    file: id,
    view: v.id,
    revision: browserState(s).docs[id].revision,
    version: a.version,
    text,
    operation: op,
    selection: clone(v.selection),
  };
  v.ai = true;
  if (s.target?.id === "wb:co:" + id) s.target.value = "";
  return null;
}
function mirrorConversation(s: State, id: string) {
  const co = browserState(s).conversations[id],
    task = s.workbuddy.tasks.find((t) => t.id === co.task);
  if (task) task.messages = clone(co.messages);
}
function createFile(
  s: State,
  id: string,
  format: FileFormat,
  name?: string,
  body?: FileBody,
  folder = "澄星设计/工作成果",
) {
  const ext = {
    word: "docx",
    sheet: "xlsx",
    slides: "pptx",
    markdown: "md",
    html: "html",
    pdf: "pdf",
    text: "txt",
    image: "svg",
    audio: "wav",
    video: "webm",
  }[format];
  const b = body || {
    text: "",
    ...(format === "word" ? { paragraphs: ["新建文档", ""] } : {}),
    ...(format === "sheet"
      ? {
          products: [
            {
              id: id + "-p",
              name: "产品",
              quantity: 1,
              cost: 0,
              price: 0,
              discount: 0,
            },
          ],
        }
      : {}),
    ...(format === "slides"
      ? { slides: [{ title: "新建演示", body: "", notes: "" }] }
      : {}),
  };
  const f: WbFile = {
    id,
    name: name || "未命名文件." + ext,
    kind: format,
    content: bodyText(b),
    asset: b.asset,
    draft: fileDraft(bodyText(b)),
    folder,
    task: "",
    edited: false,
    dataVersion: s.reportRevision,
  };
  if (["word", "sheet", "slides"].includes(format)) {
    f.officeId = "office-" + id;
    s.officeFiles.push({
      id: f.officeId,
      name: f.name,
      kind: format as OfficeFile["kind"],
      paragraphs: b.paragraphs,
      products: b.products,
      table: b.table,
      objectStyles:b.objectStyles,
      slides: b.slides,
    });
  }
  s.workbuddy.files.push(f);
  browserState(s).docs[id] = {
    revision: 0,
    saved: clone(b),
    savedAt: Date.now(),
    changes: [],
  };
  return f;
}
function finishAI(s: State, id: string, epoch: string) {
  const b = browserState(s),
    co = b.conversations[id],
    p = co?.pending;
  if (!p || p.id !== epoch) return "修改已结束";
  const v = findFileView(s, p.view),
    a = v?.working[id];
  if (
    !v ||
    v.active !== id ||
    p.revision !== b.docs[id]?.revision ||
    p.version !== a?.version
  ) {
    co.pending = null;
    co.messages.push({
      id: epoch + "-stale",
      role: "assistant",
      text: "内容已变化，本次修改已停止。原草稿保留。",
    });
    mirrorConversation(s, id);
    return null;
  }
  const old = clone(a.body),
    body = clone(old);
  let reply = "";
  if (p.operation === "summary")
    reply =
      "当前文件要点：\n" +
      bodyText(body).split(/\n+/).filter(Boolean).slice(0, 6).join("\n");
  else if (p.operation === "generate") {
    const f = createFile(
      s,
      epoch + "-result",
      "markdown",
      "项目会前简报.md",
      {
        text:
          "# 项目会前简报\n\n" +
          bodyText(body) +
          "\n\n下一步：确认采购数量、报价和交付安排。",
      },
      s.workbuddy.files.find((f) => f.id === id)!.folder,
    );
    const task = s.workbuddy.tasks.find(t => t.id === co.task);
    if (task) task.files.push(f.id);
    openTab(s, v, f.id);
    reply = "已生成 " + f.name + "。";
  } else {
    const paths = p.selection?.paths.length
      ? p.selection.paths
      : body.paragraphs
        ? body.paragraphs.map((_, i) => "paragraph/" + i)
        : body.slides
          ? body.slides.flatMap((_, i) => [
              "slide/" + i + "/title",
              "slide/" + i + "/body",
            ])
          : body.products
            ? body.products.map((_, i) => "cell/" + i + "/quantity")
            : ["text"];
    if (p.operation === "quote") {
      const match = p.text.match(
        /(?:数量|(?:采购|销售)?单价|折扣|价格|改成|改为|调整到|调整为|设为)\s*(?:为|到|是)?\s*(\d+(?:\.\d+)?)/,
      );
      if (!match) {
        co.pending = null;
        co.unknown = p.text;
        co.messages.push({
          id: epoch + "-missing",
          role: "assistant",
          text: "请补充要调整的数量或金额。",
        });
        mirrorConversation(s, id);
        return null;
      }
      const field = /数量/.test(p.text) ? "quantity" : /采购单价/.test(p.text) ? "cost" : /销售单价/.test(p.text) ? "price" : /折扣/.test(p.text) ? "discount" : "";
      const quotePaths = paths.filter(path => path.startsWith("cell/") && (!field || path.endsWith("/" + field)));
      if (!quotePaths.length) {
        co.pending = null;
        co.messages.push({id:epoch+"-field",role:"assistant",text:"请选中与修改要求对应的单元格。"}); mirrorConversation(s,id); return null;
      }
      for (const path of quotePaths) {
        if (!path.startsWith("cell/")) continue;
        const err = changePath(body, path, match[1]);
        if (err) {
          co.pending = null;
          co.messages.push({
            id: epoch + "-error",
            role: "assistant",
            text: err,
          });
          mirrorConversation(s, id);
          return null;
        }
      }
    } else
      for (const path of paths) {
        const text = pathText(body, path);
        const ranged =
          p.selection?.paths.includes(path) &&
          p.selection.start !== undefined &&
          p.selection.end !== undefined;
        const selected = ranged
          ? text.slice(p.selection!.start, p.selection!.end)
          : text;
        let next = selected;
        if (p.operation === "polish")
          next = selected
            .replace(/哈喽|收到收到/g, "收到")
            .replace(/咱们/g, "我们")
            .replace(/聊聊/g, "沟通")
            .replace(/\s+$/g, "")
            .replace(/([，。！？])\1+/g, "$1");
        if (p.operation === "append")
          next =
            selected +
            "\n项目介绍：澄星设计计划为新办公室配置办公设备，重点核对采购数量、报价、供货和验收安排。";
        if (p.operation === "replace") {
          const value = p.text.match(
            /(?:替换为|改成|修改为|改为)\s*[“「"]?([\s\S]+?)[”」"]?$/,
          )?.[1];
          if (!value) {
            co.pending = null;
            co.messages.push({
              id: epoch + "-missing",
              role: "assistant",
              text: "请明确替换后的文字。",
            });
            mirrorConversation(s, id);
            return null;
          }
          next = value;
        }
        if (ranged)
          next =
            text.slice(0, p.selection!.start) +
            next +
            text.slice(p.selection!.end);
        const error = changePath(body, path, next);
        if (error) return error;
      }
    const err = editBody(s, v, id, body, "AI 编辑");
    if (err) return err;
    syncBindings(s, v, id);
    a.highlight = paths;
    reply = equal(old, body)
      ? "已检查，当前选区无需修改。"
      : "已修改所选内容，可撤销或保存。";
  }
  co.pending = null;
  co.messages.push({ id: epoch + "-done", role: "assistant", text: reply });
  mirrorConversation(s, id);
  return null;
}
export function fileBrowserInteraction(
  s: State,
  c: Command,
): string | null | undefined {
  if (!c.type.startsWith("wb-fb-")) return undefined;
  ensureFileDocuments(s);
  const b = browserState(s),
    p = (c.value || {}) as Record<string, unknown>,
    id = String(p.file || ""),
    v = findFileView(s, String(p.view || activeFileView(s).id));
  switch (c.type) {
    case "wb-fb-open": {
      b.visible = true;
      let view = b.windows.at(-1);
      if (!view || p.newWindow) {
        view = fileView(c.id);
        b.windows.push(view);
      }
      return id ? openTab(s, view, id) : null;
    }
    case "wb-fb-tab":
      if (!v) return "窗口已关闭";
      return openTab(s, v, id);
    case "wb-fb-ai":
      if (!v) return "窗口已关闭";
      v.ai = Boolean(p.open);
      if (!v.ai && s.target?.id.startsWith("wb:co:")) s.target = null;
      return null;
    case "wb-fb-width":
      if (!v) return "窗口已关闭";
      v.aiWidth = Math.max(22, Math.min(48, Number(p.width) || 28));
      return null;
    case "wb-fb-mode":
      if (
        !["artifacts", "workspace", "changes", "browser"].includes(
          String(p.mode),
        )
      )
        return "面板类型不存在";
      b.panelMode = p.mode as FileBrowserState["panelMode"];
      return null;
    case "wb-fb-select": {
      if (!v || v.active !== id) return "文件已切换";
      const paths = Array.isArray(p.paths) ? p.paths.map(String) : [String(p.path || "text")];
      const body = clone(fileBody(s, v, id));
      for (const path of paths) {
        const err = changePath(body, path, pathText(body, path));
        if (err) return err;
      }
      if (p.start !== undefined || p.end !== undefined) {
        if (paths.length !== 1 || !Number.isInteger(p.start) || !Number.isInteger(p.end) || Number(p.start) < 0 || Number(p.end) <= Number(p.start) || Number(p.end) > pathText(body, paths[0]).length) return "选区已变化";
      }
      v.selection = {
        file: id,
        paths,
        text: String(p.text || ""),
        ...(Number.isInteger(p.start) && Number.isInteger(p.end)
          ? { start: Number(p.start), end: Number(p.end) }
          : {}),
      };
      return null;
    }
    case "wb-fb-edit": {
      if (!v || v.active !== id) return "文件已切换";
      if (p.version !== working(s, v, id).version) return "编辑版本已变化";
      const body = clone(fileBody(s, v, id));
      const err = changePath(
        body,
        String(p.path || "text"),
        String(p.text ?? ""),
      );
      if (err) return err;
      const edited = editBody(s, v, id, body);
      if (!edited) syncBindings(s, v, id);
      return edited;
    }
    case "wb-fb-format": {
      if (!v || v.active !== id) return "文件已切换";
      const mark = String(p.mark);
      if (!["bold", "italic", "underline", "strike"].includes(mark))
        return "格式无效";
      const body = clone(fileBody(s, v, id)),
        path = String(p.path || "paragraph/0");
      body.marks ??= {};
      const marks = body.marks[path] || [];
      body.marks[path] = marks.includes(mark)
        ? marks.filter((x) => x !== mark)
        : [...marks, mark];
      return editBody(s, v, id, body);
    }
    case "wb-fb-save":
      if (!v) return "窗口已关闭";
      return saveBrowserFile(s, v, id, String(p.source || "手动保存"));
    case "wb-fb-reload":
      if (!v) return "窗口已关闭";
      delete v.working[id];
      s.target = null;
      return null;
    case "wb-fb-copy": {
      if (!v) return "窗口已关闭";
      const f = s.workbuddy.files.find((f) => f.id === id);
      if (!f) return "文件不存在";
      const copy = createFile(
        s,
        c.id,
        f.kind,
        f.name.replace(/(\.[^.]+)$/, " · 副本$1"),
        clone(fileBody(s, v, id)),
        f.folder,
      );
      return openTab(s, v, copy.id);
    }
    case "wb-fb-create": {
      if (!v) return "窗口已关闭";
      if (!["word", "sheet", "slides", "markdown"].includes(String(p.format)))
        return "新建类型不存在";
      const f = createFile(s, c.id, p.format as FileFormat);
      return openTab(s, v, f.id);
    }
    case "wb-fb-reorder":
      if (
        !v ||
        !Array.isArray(p.tabs) ||
        p.tabs.length !== v.tabs.length ||
        new Set(p.tabs).size !== v.tabs.length ||
        p.tabs.some((id) => !v.tabs.includes(String(id)))
      )
        return "标签顺序无效";
      v.tabs = p.tabs as string[];
      return null;
    case "wb-fb-close":
    case "wb-fb-exit": {
      if (!v) return "窗口已关闭";
      const ids =
        c.type === "wb-fb-exit"
          ? [...v.tabs]
          : p.mode === "other"
            ? v.tabs.filter((x) => x !== id)
            : p.mode === "right"
              ? v.tabs.slice(v.tabs.indexOf(id) + 1)
              : [id];
      if (
        ids.some((x) => fileDirty(s, v, x)) &&
        !["save", "discard"].includes(String(p.choice))
      )
        return "存在未保存修改";
      for (const x of ids) {
        if (p.choice === "save" && fileDirty(s, v, x)) {
          const err = saveBrowserFile(s, v, x);
          if (err) return err;
        }
        delete v.working[x];
        v.tabs = v.tabs.filter((t) => t !== x);
      }
      v.active = v.tabs.includes(v.active || "")
        ? v.active
        : v.tabs.at(-1) || null;
      v.selection = null;
      s.target = null;
      if (v.id === "panel") {
        s.workbuddy.previewActive = v.active;
        s.workbuddy.preview = [...v.tabs];
      }
      if (!v.tabs.length && v.id !== "panel")
        b.windows = b.windows.filter((x) => x.id !== v.id);
      if (v.id !== "panel") b.visible = b.windows.length > 0;
      return null;
    }
    case "wb-fb-undo":
    case "wb-fb-redo": {
      if (!v || fileReadOnly(s, v, id)) return "当前文件只读";
      if (fileConflict(s, v, id)) return "文件已变化";
      const a = working(s, v, id),
        undo = c.type === "wb-fb-undo",
        from = undo ? a.history : a.future,
        to = undo ? a.future : a.history;
      if (!from.length) return "没有可" + (undo ? "撤销" : "重做") + "的修改";
      to.push(clone(a.body));
      a.body = from.pop()!;
      a.version++;
      a.changedAt = Date.now();
      a.highlight = [];
      syncBindings(s, v, id);
      return null;
    }
    case "wb-fb-ai-send":
      if (!v || v.active !== id) return "文件已切换";
      return startAI(
        s,
        v,
        id,
        String(p.text || ""),
        c.id,
        p.operation ? String(p.operation) : undefined,
      );
    case "wb-fb-ai-finish":
      return finishAI(s, id, String(p.epoch));
    case "wb-fb-ai-cancel":
      if (b.conversations[id]?.pending) b.conversations[id].pending = null;
      return null;
    case "wb-fb-chat-new":
      delete b.conversations[id];
      conversation(s, id, c.id);
      s.target = null;
      return null;
    case "wb-fb-attach": {
      const co = conversation(s, id, "file-task-" + id),
        attachment = String(p.attachment);
      if (!s.workbuddy.files.some((f) => f.id === attachment))
        return "附件不存在";
      co.draft.attachments = [
        ...new Set([...co.draft.attachments, attachment]),
      ];
      co.draft.revision++;
      return null;
    }
    case "wb-fb-highlight-clear":
      if (v?.working[id]) v.working[id].highlight = [];
      return null;
    case "wb-fb-local-record":
      s.workbuddy.notices.unshift({
        id: c.id,
        text:
          "已保存本地" +
          String(p.action || "分享") +
          "记录：" +
          String(p.name || ""),
        read: false,
      });
      return null;
    default:
      return "文件操作不存在";
  }
}
