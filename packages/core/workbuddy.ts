import type { State, Command, OfficeFile } from "./model";
import { money, totals } from "./model";
import { mobileWorkBuddyInteraction, type WbInputDraft, type WbOperation } from "./workbuddy-mobile";
import { approvalInteraction, type WbApproval, type WbShareEffect } from "./workbuddy-approvals";
import { documentInteraction, newFileWorkspace, releaseDocumentPointer, forgetDocument, type WbFileWorkspace } from "./workbuddy-documents";
import { receiptInteraction } from "./workbuddy-receipts";

export type WorkBuddyPage =
  | "home"
  | "task"
  | "experts"
  | "skills"
  | "connectors"
  | "assistants"
  | "projects"
  | "automation"
  | "library"
  | "buddy"
  | "mailbox"
  | "documents"
  | "knowledge"
  | "inspiration"
  | "settings"
  | "notifications";
export type ResultKind = "brief" | "quote" | "proposal" | "slides";
export type TaskStatus =
  | "needs-type"
  | "planned"
  | "running"
  | "paused"
  | "complete";
export interface WbDraft {
  text: string;
  revision: number;
  sequence: number;
  session: string;
  attachments: string[];
  references: string[];
}
export interface WbTask {
  id: string;
  title: string;
  messages: { id: string; role: "user" | "assistant"; text: string }[];
  status: TaskStatus;
  kind: ResultKind | null;
  mode: "agent" | "plan" | "ask";
  model: string;
  expert: string;
  project: string;
  favorite: boolean;
  step: number;
  epoch: string;
  startedAt: number;
  elapsed: number;
  files: string[];
  dataVersion: number;
}
export interface WbFile {
  id: string;
  name: string;
  kind: "markdown" | "sheet" | "word" | "slides";
  content: string;
  draft: WbDraft;
  folder: string;
  task: string;
  officeId?: string;
  edited: boolean;
  dataVersion: number;
  contentRevision?: number;
}
export interface WbProject {
  id: string;
  name: string;
  instructions: string;
  members: string[];
}
export interface WbAutomation {
  id: string;
  name: string;
  prompt: string;
  time: string;
  days: number[];
  enabled: boolean;
  lastDay: string;
  records: { at: number; task: string; status: string }[];
}
export interface WbAssistant {
  id: string;
  name: string;
  channel: string;
  enabled: boolean;
  messages: { role: string; text: string }[];
}
export interface WorkBuddyState {
  version: 1 | 2;
  inputDrafts: Record<string, WbInputDraft>;
  operations: Record<string, WbOperation>;
  approvals: WbApproval[];
  shareEffects: WbShareEffect[];
  fileWorkspace: WbFileWorkspace;
  page: WorkBuddyPage;
  task: string;
  preview: string[];
  previewActive: string | null;
  filePanel: boolean;
  drafts: Record<string, WbDraft>;
  tasks: WbTask[];
  files: WbFile[];
  projects: WbProject[];
  automations: WbAutomation[];
  assistants: WbAssistant[];
  installed: string[];
  connectors: Record<string, { enabled: boolean; workspace: string }>;
  experts: CatalogItem[];
  settings: {
    model: string;
    mode: "agent" | "plan" | "ask";
    permission: string;
    workspace: string;
    memory: string;
    buddyAuthorized: boolean;
    buddyExpert: string;
    menu: WorkBuddyPage[];
  };
  entityDrafts: Record<string, WbDraft>;
  mailDrafts: {
    id: string;
    recipient: string;
    subject: string;
    body: string;
  }[];
  notices: { id: string; text: string; read: boolean }[];
}
export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  symbol: string;
  team?: boolean;
}
export const wbExperts: CatalogItem[] = [
  {
    id: "procurement",
    name: "采购分析专家",
    category: "产品运营",
    description: "梳理客户需求、比较供应商，核对设备配置与交期。",
    symbol: "采",
  },
  {
    id: "sales",
    name: "销售方案专家",
    category: "营销专家",
    description: "把客户需求变成清晰的采购方案与销售汇报。",
    symbol: "销",
  },
  {
    id: "finance",
    name: "财务分析专家",
    category: "财税工作",
    description: "核算报价、成本与毛利，提示预算风险。",
    symbol: "财",
  },
  {
    id: "writer",
    name: "内容创作专家",
    category: "内容创作",
    description: "整理项目介绍、客户沟通与会议简报。",
    symbol: "文",
  },
  {
    id: "ppt",
    name: "演示设计专家",
    category: "设计创意",
    description: "组织六页销售进展汇报及演讲备注。",
    symbol: "演",
  },
  {
    id: "delivery",
    name: "交付项目经理",
    category: "企业管理",
    description: "梳理库存、到货、安装和验收节点。",
    symbol: "交",
  },
  {
    id: "team-sales",
    name: "销售项目专家团",
    category: "产品运营",
    description: "采购、财务、交付专家分工完成项目方案。",
    symbol: "团",
    team: true,
  },
  {
    id: "team-content",
    name: "内容创作专家团",
    category: "内容创作",
    description: "文案与演示专家共同完成客户材料。",
    symbol: "组",
    team: true,
  },
];
export const wbSkills: CatalogItem[] = [
  {
    id: "document-skills",
    name: "办公文档",
    category: "推荐",
    description: "文档整理、段落编辑与结构化输出",
    symbol: "D",
  },
  {
    id: "ppt-implement",
    name: "演示文稿制作",
    category: "推荐",
    description: "六页业务汇报与演讲备注",
    symbol: "P",
  },
  {
    id: "data",
    name: "数据分析",
    category: "套件",
    description: "采购数据汇总、报价及毛利核算",
    symbol: "数",
  },
  {
    id: "deep-research",
    name: "深度研究",
    category: "SkillHub",
    description: "客户需求与供应商资料整理",
    symbol: "研",
  },
  {
    id: "finance",
    name: "财务分析",
    category: "套件",
    description: "成本、收入和预算比较",
    symbol: "F",
  },
  {
    id: "internal-comms",
    name: "内部沟通",
    category: "套件",
    description: "会议纪要、团队简报与待办",
    symbol: "I",
  },
  {
    id: "product-management",
    name: "产品管理",
    category: "套件",
    description: "需求优先级与采购评审",
    symbol: "产",
  },
  {
    id: "pdfkit",
    name: "腾讯文档 PDFKit",
    category: "精选",
    description: "PDF 阅读与内容整理",
    symbol: "PDF",
  },
  {
    id: "ima",
    name: "腾讯 ima",
    category: "精选",
    description: "知识库内容读取与整理",
    symbol: "知",
  },
  {
    id: "wecom",
    name: "企业微信套件",
    category: "精选",
    description: "企业沟通与通知记录",
    symbol: "企",
  },
];
export const wbConnectors: CatalogItem[] = [
  {
    id: "tencent-docs",
    name: "腾讯文档",
    category: "办公",
    description: "项目文档与报价资料",
    symbol: "文",
  },
  {
    id: "feishu",
    name: "飞书",
    category: "办公",
    description: "项目简报与客户资料",
    symbol: "飞",
  },
  {
    id: "wecom",
    name: "企业微信",
    category: "沟通",
    description: "团队沟通与自动化通知",
    symbol: "企",
  },
  {
    id: "mail",
    name: "邮箱",
    category: "沟通",
    description: "虚构采购邮件及附件",
    symbol: "邮",
  },
  {
    id: "ima",
    name: "ima 知识库",
    category: "资料",
    description: "采购方案与产品资料",
    symbol: "知",
  },
  {
    id: "tapd",
    name: "TAPD",
    category: "项目",
    description: "交付任务与项目进展",
    symbol: "T",
  },
];
export const wbLabels: Record<WorkBuddyPage, string> = {
  home: "新建任务",
  task: "任务",
  experts: "专家",
  skills: "技能",
  connectors: "连接器",
  assistants: "助理",
  projects: "项目",
  automation: "定时任务",
  library: "资料库",
  buddy: "发现应用",
  mailbox: "我的邮箱",
  documents: "腾讯文档",
  knowledge: "知识库",
  inspiration: "灵感",
  settings: "设置",
  notifications: "消息中心",
};
export const resultLabels: Record<ResultKind, string> = {
  brief: "需求简报",
  quote: "采购报价",
  proposal: "客户方案",
  slides: "销售汇报",
};
export const newWbDraft = (text = ""): WbDraft => ({
  text,
  revision: 0,
  sequence: 0,
  session: "",
  attachments: [],
  references: [],
});
export function initialWorkBuddy(): WorkBuddyState {
  return {
    version: 2,
    inputDrafts: {},
    operations: {},
    approvals: [],
    shareEffects: [],
    fileWorkspace: newFileWorkspace(),
    page: "home",
    task: "new",
    preview: [],
    previewActive: null,
    filePanel: false,
    drafts: { new: newWbDraft() },
    tasks: [],
    files: [],
    projects: [
      {
        id: "chengxing",
        name: "澄星设计 · 办公设备采购",
        instructions:
          "为客户提供 30 套设备方案，核对报价、交期与售后。金额使用项目报价表；缺失字段先确认。",
        members: ["陈朗 · 客户经理", "周宁 · 供应商", "许岚 · 销售主管"],
      },
    ],
    automations: [
      {
        id: "weekly",
        name: "每周销售进展简报",
        prompt: "生成澄星设计销售进展汇报",
        time: "09:00",
        days: [5],
        enabled: false,
        lastDay: "",
        records: [],
      },
    ],
    assistants: [
      {
        id: "sales-assistant",
        name: "销售助理",
        channel: "企业微信",
        enabled: false,
        messages: [],
      },
    ],
    installed: ["document-skills", "data", "ppt-implement"],
    connectors: {},
    experts: [],
    settings: {
      model: "Space-Bunny",
      mode: "agent",
      permission: "默认权限",
      workspace: "澄星设计",
      memory: "客户希望预算控制在 20 万元以内；10 月 28 日前验收。",
      buddyAuthorized: false,
      buddyExpert: "sales",
      menu: [
        "home",
        "assistants",
        "experts",
        "automation",
        "library",
        "projects",
      ],
    },
    entityDrafts: {},
    mailDrafts: [],
    notices: [],
  };
}
function content(s: State, kind: ResultKind) {
  const t = totals(s.reportProducts);
  const rows = s.reportProducts
    .map(
      (p) =>
        `| ${p.name} | ${p.quantity} | ${money(p.cost)} | ${money(p.price)} | ${p.discount}% | ${money(totals([p]).revenue)} |`,
    )
    .join("\n");
  const quote = `## 采购与客户报价\n\n| 产品 | 数量 | 采购单价 | 销售单价 | 折扣 | 报价 |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n\n客户报价：${money(t.revenue)}\n\n采购成本：${money(t.cost)}\n\n项目毛利：${money(t.profit)}（${t.margin.toFixed(1)}%）`;
  if (kind === "quote")
    return (
      "# 澄星设计 · 采购报价\n\n" +
      quote +
      "\n\n## 供应商比较\n\n云帆供应：已收到分项报价，确认后 7 个工作日出库。\n\n其他供应商：报价与库存待补充，尚不能作价格比较。\n\n## 交付安排\n\n10 月 24 日到货，10 月 26 日配置，10 月 28 日验收。"
    );
  if (kind === "slides")
    return (
      "# 销售进展汇报\n\n" +
      s.slides
        .map((x, i) => `## ${i + 1}. ${x.title}\n\n${x.body}`)
        .join("\n\n") +
      "\n\n" +
      quote
    );
  if (kind === "proposal")
    return (
      "# 澄星设计办公设备采购方案\n\n" +
      s.paragraphs.slice(1).join("\n\n") +
      "\n\n" +
      quote +
      "\n\n## 会前确认\n\n安装地点、设备使用人名单与数据迁移范围待客户补充。"
    );
  return (
    "# 澄星设计 · 客户需求简报\n\n## 项目背景\n\n澄星设计计划为新办公室采购 30 套设备。联系人为林悦，内部负责人为陈朗。\n\n## 需求摘要\n\n" +
    s.reportProducts.map((p) => `${p.name}：${p.quantity} 件。`).join("\n\n") +
    "\n\n## 预算与交付\n\n预算上限 20 万元；目标 10 月 28 日前验收。\n\n" +
    quote +
    "\n\n## 待确认\n\n安装地点、保修范围和数据迁移需求。"
  );
}
export function seedWorkBuddy(s: State) {
  const w = s.workbuddy;
  if (w.files.length) return;
  for (const kind of ["brief", "quote", "proposal", "slides"] as ResultKind[]) {
    const id = "sales-" + kind,
      c = content(s, kind);
    w.files.push({
      id,
      name:
        resultLabels[kind] +
        { brief: ".md", quote: ".xlsx", proposal: ".docx", slides: ".pptx" }[
          kind
        ],
      kind: (
        {
          brief: "markdown",
          quote: "sheet",
          proposal: "word",
          slides: "slides",
        } as const
      )[kind],
      content: c,
      draft: newWbDraft(c),
      task: "",
      folder: "澄星设计",
      edited: false,
      dataVersion: s.reportRevision,
      officeId:
        kind === "brief"
          ? undefined
          : "sample-" +
            { quote: "sheet", proposal: "word", slides: "slides" }[kind],
    });
  }
  for (const [i, kind] of (
    ["brief", "quote", "proposal"] as ResultKind[]
  ).entries()) {
    const id = "sample-" + kind;
    w.tasks.push({
      id,
      title: resultLabels[kind] + " · 澄星设计",
      messages: [
        {
          id: id + "-u",
          role: "user",
          text: "帮我整理澄星设计的" + resultLabels[kind],
        },
        {
          id: id + "-a",
          role: "assistant",
          text: "已整理需求、报价与交付安排，文件可在右侧查看。",
        },
      ],
      status: "complete",
      kind,
      mode: "agent",
      model: "Space-Bunny",
      expert: i === 1 ? "procurement" : "",
      project: "chengxing",
      favorite: false,
      step: 3,
      epoch: id,
      startedAt: 0,
      elapsed: 0,
      files: ["sales-" + kind],
      dataVersion: s.reportRevision,
    });
    w.drafts[id] = newWbDraft();
  }
}
export function restoreWorkBuddy(
  s: State,
  backup: (key: string, value: string) => void,
) {
  if (!s.workbuddy) {
    if (s.texts["ai-draft"] || s.texts["history:ai-draft"])
      backup(
        "mobile-input:backup:workbuddy-shared-v1",
        JSON.stringify({
          draft: s.texts["ai-draft"],
          history: s.texts["history:ai-draft"],
        }),
      );
    s.workbuddy = initialWorkBuddy();
    seedWorkBuddy(s);
    if (s.app === "workbuddy" && s.texts["ai-draft"])
      s.workbuddy.drafts.new.text = s.texts["ai-draft"];
  }
  const w = s.workbuddy;
  if (w.version === 1) {
    backup("mobile-input:backup:workbuddy-v1", JSON.stringify(w));
    w.inputDrafts = {};
    w.operations = {};
    w.approvals = [];
    w.shareEffects = [];
    w.version = 2;
  }
  w.mailDrafts ??= [];
  if (!w.fileWorkspace) {
    backup("mobile-input:backup:workbuddy-files-v1", JSON.stringify(w));
    w.fileWorkspace = newFileWorkspace();
  }
  releaseDocumentPointer(s);
  w.settings.buddyExpert ??= "sales";
  w.preview = [];
  w.previewActive = null;
  w.filePanel = false;
  for (const task of w.tasks)
    if (task.status === "running") {
      task.status = "paused";
      task.epoch += ":restored";
    }
  return s;
}
export function pauseWorkBuddy(s: State) {
  releaseDocumentPointer(s);
  for (const task of s.workbuddy.tasks)
    if (task.status === "running") {
      task.elapsed += Math.max(0, Date.now() - task.startedAt);
      task.startedAt = 0;
      task.status = "paused";
      task.epoch += ":paused";
    }
}
export function wbDraftFor(s: State, targetId: string) {
  const [, type, id] = targetId.split(":");
  if (type === "draft") return s.workbuddy.drafts[id];
  if (type === "file") return s.workbuddy.files.find((x) => x.id === id)?.draft;
  return s.workbuddy.entityDrafts[targetId];
}
function focus(s: State, id: string, label?: string, initialText = "") {
  const w = s.workbuddy;
  let d = wbDraftFor(s, id);
  if (!d) {
    const [, type, entity, field] = id.split(":");
    let text = "";
    if (type === "project")
      text = w.projects.find((x) => x.id === entity)?.instructions || "";
    else if (type === "settings") text = w.settings.memory;
    else if (type === "assistant") text = "";
    else if (
      type === "form" &&
      /^[a-z-]+-(new|[a-z0-9-]+)$/.test(entity) &&
      ["name", "body", "recipient", "folder"].includes(field)
    )
      text = initialText;
    else return "输入目标不存在";
    d = w.entityDrafts[id] = newWbDraft(text);
  }
  if (s.target?.id === id) return null;
  s.target = {
    id,
    app: "workbuddy",
    kind: "text",
    label: label || "WorkBuddy 输入",
    value: d.text,
    revision: s.revision + 1,
  };
  return null;
}
export function identify(text: string): ResultKind | null {
  if (/汇报|PPT|ppt|幻灯片|演示/.test(text)) return "slides";
  if (/方案|售后|安装/.test(text)) return "proposal";
  if (/报价|采购比较|供应商|毛利|成本/.test(text)) return "quote";
  if (/需求|简报|项目介绍|背景/.test(text)) return "brief";
  return null;
}
export function startTask(
  s: State,
  id: string,
  text: string,
  kind: ResultKind | null,
  config?: Partial<WbTask>,
  input?: WbDraft,
) {
  const w = s.workbuddy;
  const draft = input || w.drafts[w.task] || newWbDraft();
  const mode = config?.mode || w.settings.mode;
  const task: WbTask = {
    id,
    title: text.replace(/\s+/g, " ").slice(0, 28),
    messages: [{ id: id + "-u", role: "user", text }],
    status:
      mode === "ask"
        ? "complete"
        : !kind
          ? "needs-type"
          : mode === "plan"
            ? "planned"
            : "running",
    kind,
    mode,
    model: config?.model || w.settings.model,
    expert: config?.expert ?? w.entityDrafts["selected-expert"]?.text ?? "",
    project:
      config?.project ||
      w.projects.find((p) => p.name === w.settings.workspace)?.id ||
      "chengxing",
    favorite: false,
    step: 0,
    epoch: id,
    startedAt: Date.now(),
    elapsed: 0,
    files: [],
    dataVersion: s.reportRevision,
  };
  if (draft.references.length)
    task.messages[0].text += "\n\n引用：" + draft.references.join("\n");
  if (draft.attachments.length)
    task.messages[0].text +=
      "\n\n附件：" +
      draft.attachments
        .map((x) => w.files.find((f) => f.id === x)?.name || x)
        .join("、");
  if (mode === "ask")
    task.messages.push({
      id: id + "-a",
      role: "assistant",
      text: `澄星设计计划采购 30 套设备，预算上限 20 万元。当前报价为 ${money(totals(s.reportProducts).revenue)}。安装地址、数据迁移与其他供应商价格仍待补充。本轮仅问答，未创建文件。`,
    });
  if (mode === "plan")
    task.messages.push({
      id: id + "-p",
      role: "assistant",
      text:
        "计划：1. 核对客户需求与资料；2. 整理报价和交付节点；3. 生成" +
        (kind ? resultLabels[kind] : "工作成果") +
        "。请确认后开始执行。",
    });
  w.tasks.unshift(task);
  w.drafts[id] = newWbDraft();
  w.task = id;
  w.page = "task";
  w.preview = [];
  w.previewActive = null;
  w.filePanel = false;
  s.target = null;
  return task;
}
function complete(s: State, t: WbTask) {
  const w = s.workbuddy;
  const kind = t.kind!;
  const id = t.epoch + "-file",
    c = content(s, kind),
    officeKind =
      kind === "quote"
        ? "sheet"
        : kind === "proposal"
          ? "word"
          : kind === "slides"
            ? "slides"
            : null;
  let officeId: string | undefined;
  if (officeKind) {
    officeId = "wb-office-" + t.id;
    const old = s.officeFiles.find((f) => f.id === officeId);
    const file: OfficeFile = {
      id: officeId,
      kind: officeKind,
      name:
        "澄星设计 · " +
        resultLabels[kind] +
        { sheet: ".xlsx", word: ".docx", slides: ".pptx" }[officeKind],
      ...(officeKind === "sheet"
        ? { products: structuredClone(s.reportProducts) }
        : officeKind === "word"
          ? { paragraphs: [...s.paragraphs] }
          : { slides: structuredClone(s.slides) }),
    };
    if (!old) s.officeFiles.unshift(file);
  }
  w.files.push({
    id,
    name:
      resultLabels[kind] +
      { brief: ".md", quote: ".xlsx", proposal: ".docx", slides: ".pptx" }[
        kind
      ],
    kind: officeKind || "markdown",
    content: c,
    draft: newWbDraft(c),
    task: t.id,
    folder: "澄星设计",
    officeId,
    edited: false,
    dataVersion: s.reportRevision,
  });
  t.files.push(id);
  t.elapsed += Math.max(0, Date.now() - t.startedAt);
  t.startedAt = 0;
  t.status = "complete";
  t.dataVersion = s.reportRevision;
  t.messages.push({
    id: t.epoch + "-a",
    role: "assistant",
    text:
      "已完成" +
      resultLabels[kind] +
      "，包含客户需求、报价与交付节点。尚未确认的信息保留为待补充。",
  });
  w.notices.unshift({ id, text: t.title + "已完成", read: false });
}
function syncOffice(s: State, f: WbFile) {
  const o = s.officeFiles.find((x) => x.id === f.officeId);
  if (!o) return;
  if (o.kind === "word")
    o.paragraphs = f.content.split(/\n\n+/).map((x) => x.replace(/^#+ /, ""));
  else if (o.kind === "sheet") o.products = structuredClone(s.reportProducts);
  else if (o.kind === "slides") o.slides = structuredClone(s.slides);
}
function saveFile(s: State, f: WbFile, text: string) {
  f.content = text;
  f.contentRevision = (f.contentRevision || 0) + 1;
  f.edited = true;
  if (f.kind === "word") syncOffice(s, f);
}
const pages = Object.keys(wbLabels);
export function workBuddyInteraction(
  s: State,
  c: Command,
): string | null | undefined {
  if (!c.type.startsWith("wb-")) return undefined;
  if (s.app !== "workbuddy") return "WorkBuddy 已退出";
  const receiptResult = receiptInteraction(s, c);
  if (receiptResult !== undefined) return receiptResult;
  const documentResult = documentInteraction(s, c);
  if (documentResult !== undefined) return documentResult;
  const mobileResult = mobileWorkBuddyInteraction(s, c);
  if (mobileResult !== undefined) return mobileResult;
  const approvalResult = approvalInteraction(s, c);
  if (approvalResult !== undefined) return approvalResult;
  const w = s.workbuddy,
    v = (c.value || {}) as Record<string, unknown>,
    id = String(v.id || "");
  switch (c.type) {
    case "wb-navigate": {
      const page = String(v.page);
      if (!pages.includes(page)) return "页面不存在";
      if (page === "task" && !w.tasks.some((t) => t.id === id))
        return "任务不存在";
      w.page = page as WorkBuddyPage;
      if (page === "task") w.task = id;
      if (page === "home") w.task = "new";
      w.preview = [];
      w.previewActive = null;
      w.filePanel = false;
      s.target = null;
      return null;
    }
    case "wb-unfocus":
      if (s.target?.id === id) s.target = null;
      return null;
    case "wb-focus":
      return focus(
        s,
        id,
        String(v.label || "WorkBuddy 输入"),
        String(v.text || ""),
      );
    case "wb-edit":
    case "wb-submit": {
      const t = s.target,
        d = t ? wbDraftFor(s, t.id) : null;
      if (!t || !d || c.targetId !== t.id || c.targetRevision !== t.revision)
        return "目标已变化，草稿已保留";
      const text = String(v.text ?? "");
      if (text.length > 20000) return "内容过长";
      if (v.revision !== d.revision) return "草稿版本已变化，请重新确认";
      if (c.type === "wb-edit") {
        const seq = Number(v.sequence),
          session = String(v.session || "");
        if (!session || !Number.isInteger(seq) || seq < 1)
          return "编辑序号无效";
        if (session === d.session && seq <= d.sequence) return "已忽略过期编辑";
        d.text = text;
        d.revision++;
        d.sequence = seq;
        d.session = session;
        t.value = text;
        s.switcher = null;
        return null;
      }
      if (!text.trim() && t.id.startsWith("wb:draft:")) return "请输入内容";
      if (t.id.startsWith("wb:draft:")) {
        const previous = w.tasks.find((x) => x.id === w.task);
        if (previous?.status === "running") return "当前任务仍在执行";
        const kind = (
          v.kind && Object.keys(resultLabels).includes(String(v.kind))
            ? v.kind
            : identify(text)
        ) as ResultKind | null;
        const config = previous
          ? {
              mode: w.settings.mode,
              model: w.settings.model,
              expert: previous.expert,
              project: previous.project,
            }
          : undefined;
        const task = startTask(s, c.id, text, kind, config);
        if (previous) {
          task.messages = [...previous.messages, ...task.messages];
          task.title = previous.title + " · 追问";
        }
        d.text = "";
        d.revision++;
        d.attachments = [];
        d.references = [];
        return null;
      }
      const [, type, entity] = t.id.split(":");
      d.text = text;
      d.revision++;
      if (type === "file") {
        const f = w.files.find((f) => f.id === entity)!;
        if (w.fileWorkspace.documents[entity]?.pages.length) return "请在文件窗口修改受控 PPT 对象";
        saveFile(s, f, text);
      } else if (type === "project") {
        const p = w.projects.find((x) => x.id === entity);
        if (!p) return "项目不存在";
        p.instructions = text;
      } else if (type === "settings") w.settings.memory = text;
      else if (type === "assistant") {
        const a = w.assistants.find((x) => x.id === entity);
        if (!a) return "助理不存在";
        a.messages.push(
          { role: "user", text },
          {
            role: "assistant",
            text: "已记录本次需求，可在工作台创建对应销售任务。",
          },
        );
        d.text = "";
        d.revision++;
      }
      t.value = d.text;
      s.switcher = null;
      return null;
    }
    case "wb-template": {
      const d = w.drafts[w.task] || w.drafts.new;
      d.text = String(v.text || "");
      d.revision++;
      s.target = null;
      return null;
    }
    case "wb-attach": {
      const d = w.drafts[w.task];
      if (!d) return "任务不存在";
      if (!w.files.some((f) => f.id === id)) return "文件不存在";
      d.attachments = v.remove
        ? d.attachments.filter((x) => x !== id)
        : [...new Set([...d.attachments, id])];
      return null;
    }
    case "wb-reference": {
      const text = String(v.text || "").trim();
      if (!text) return "请选择引用内容";
      const d = w.drafts[w.task];
      d.references = [...d.references, text].slice(-10);
      return null;
    }
    case "wb-reference-remove": {
      w.drafts[w.task].references.splice(Number(v.index), 1);
      return null;
    }
    case "wb-task": {
      if (id === w.fileWorkspace.receipts.taskId && ["confirm", "stop", "continue", "type"].includes(String(v.action))) return "请从原票据任务的补充材料入口继续";
      const t = w.tasks.find((x) => x.id === id);
      if (!t) return "任务不存在";
      switch (v.action) {
        case "rename":
          if (!String(v.name || "").trim()) return "请输入名称";
          t.title = String(v.name).trim().slice(0, 100);
          break;
        case "favorite":
          t.favorite = !t.favorite;
          break;
        case "delete":
          w.tasks = w.tasks.filter((x) => x.id !== id);
          delete w.drafts[id];
          if (w.task === id) {
            w.page = "home";
            w.task = "new";
            s.target = null;
          }
          break;
        case "stop":
          if (t.status === "running") {
            t.elapsed += Date.now() - t.startedAt;
            t.startedAt = 0;
            t.status = "paused";
            t.epoch = c.id;
          }
          break;
        case "continue":
        case "confirm":
          if (!t.kind) return "请先选择成果类型";
          if (t.status !== "paused" && t.status !== "planned")
            return "任务状态已变化";
          t.status = "running";
          t.startedAt = Date.now();
          t.epoch = c.id;
          break;
        case "type":
          if (!Object.keys(resultLabels).includes(String(v.kind)))
            return "成果类型无效";
          t.kind = v.kind as ResultKind;
          t.status = t.mode === "plan" ? "planned" : "running";
          t.startedAt = Date.now();
          t.epoch = c.id;
          break;
        default:
          return "任务操作不存在";
      }
      return null;
    }
    case "wb-tick": {
      const t = w.tasks.find((x) => x.id === id);
      if (!t || t.status !== "running" || v.epoch !== t.epoch)
        return "执行轮次已过期";
      if (Date.now() - t.startedAt < 750) return "执行阶段尚未到达";
      t.step++;
      if (t.step >= 3) complete(s, t);
      return null;
    }
    case "wb-preview": {
      if (!w.files.some((f) => f.id === id)) return "文件不存在";
      if (w.fileWorkspace.documents[id]?.pages.length) return documentInteraction(s, { ...c, type: "wb-window-open", value: { fileId: id } });
      w.preview = [...new Set([...w.preview, id])];
      w.previewActive = id;
      return null;
    }
    case "wb-preview-close": {
      w.preview = w.preview.filter((x) => x !== id);
      w.previewActive = w.preview.at(-1) || null;
      if (s.target?.id === `wb:file:${id}`) s.target = null;
      return null;
    }
    case "wb-file-panel":
      w.filePanel = Boolean(v.open);
      return null;
    case "wb-file": {
      const f = w.files.find((x) => x.id === id);
      if (!f) return "文件不存在";
      if (w.fileWorkspace.documents[id]?.pages.length && ["save", "refresh"].includes(String(v.action))) return "请在文件窗口保存受控 PPT；旧文本预览不能刷新对象模型";
      if (v.action === "save") {
        saveFile(s, f, f.draft.text);
        return null;
      }
      if (v.action === "delete") {
        forgetDocument(s, id);
        w.files = w.files.filter((x) => x.id !== id);
        for (const task of w.tasks)
          task.files = task.files.filter((x) => x !== id);
        w.preview = w.preview.filter((x) => x !== id);
        w.previewActive = w.preview.at(-1) || null;
        for (const d of Object.values(w.drafts))
          d.attachments = d.attachments.filter((x) => x !== id);
        if (s.target?.id === `wb:file:${id}`) s.target = null;
        return null;
      }
      if (v.action === "refresh") {
        if (f.edited) return "此文件已有手动修改，已保留；请生成新版本";
        const kind =
          f.kind === "markdown"
            ? "brief"
            : f.kind === "sheet"
              ? "quote"
              : f.kind === "word"
                ? "proposal"
                : "slides";
        f.content = content(s, kind);
        f.contentRevision = (f.contentRevision || 0) + 1;
        f.draft = newWbDraft(f.content);
        f.dataVersion = s.reportRevision;
        syncOffice(s, f);
        s.target = null;
        return null;
      }
      return "文件操作不存在";
    }
    case "wb-config": {
      if (v.key === "model") {
        w.settings.model = String(v.value);
      } else if (
        v.key === "mode" &&
        ["agent", "plan", "ask"].includes(String(v.value))
      )
        w.settings.mode = v.value as typeof w.settings.mode;
      else if (
        v.key === "permission" &&
        ["默认权限", "完全访问权限"].includes(String(v.value))
      )
        w.settings.permission = String(v.value);
      else if (v.key === "workspace") w.settings.workspace = String(v.value);
      else if (
        v.key === "buddyExpert" &&
        [...wbExperts, ...w.experts].some((x) => x.id === v.value)
      )
        w.settings.buddyExpert = String(v.value);
      else if (v.key === "buddyAuthorized")
        w.settings.buddyAuthorized = Boolean(v.value);
      else if (v.key === "menu") {
        const menu = v.value;
        if (
          !Array.isArray(menu) ||
          menu[0] !== "home" ||
          menu.some((p) => !pages.includes(String(p))) ||
          new Set(menu).size !== menu.length
        )
          return "菜单配置无效";
        w.settings.menu = menu as WorkBuddyPage[];
      } else return "设置不存在";
      return null;
    }
    case "wb-skill":
      if (!wbSkills.some((x) => x.id === id)) return "技能不存在";
      w.installed = v.remove
        ? w.installed.filter((x) => x !== id)
        : [...new Set([...w.installed, id])];
      return null;
    case "wb-connector":
      if (!wbConnectors.some((x) => x.id === id)) return "连接器不存在";
      w.connectors[id] = {
        enabled: Boolean(v.enabled),
        workspace: String(v.workspace || "澄星设计"),
      };
      return null;
    case "wb-expert": {
      const expert = [...wbExperts, ...w.experts].find((x) => x.id === id);
      if (v.action === "create") {
        if (!String(v.name || "").trim()) return "请输入专家名称";
        w.experts.push({
          id: c.id,
          name: String(v.name),
          description: String(v.description || ""),
          category: "我的专家",
          symbol: "我",
          team: Boolean(v.team),
        });
        return null;
      }
      if (!expert) return "专家不存在";
      if (v.action === "delete") {
        w.experts = w.experts.filter((x) => x.id !== id);
        return null;
      }
      if (v.action === "edit") {
        if (!w.experts.some((x) => x.id === id)) return "内置专家不可修改";
        expert.description = String(v.description || "");
        return null;
      }
      if (v.action === "summon") {
        w.page = "home";
        w.task = "new";

        s.target = null;
        w.entityDrafts["selected-expert"] = newWbDraft(id);
        return null;
      }
      return "专家操作不存在";
    }
    case "wb-project": {
      if (v.action === "create") {
        if (!String(v.name || "").trim()) return "请输入项目名称";
        w.projects.push({
          id: c.id,
          name: String(v.name),
          instructions: String(v.instructions || ""),
          members: ["陈朗 · 客户经理"],
        });
        return null;
      }
      const p = w.projects.find((x) => x.id === id);
      if (!p) return "项目不存在";
      if (v.action === "save") {
        p.name = String(v.name || p.name);
        p.instructions = String(v.instructions ?? p.instructions);
      } else if (v.action === "assign") {
        const t = w.tasks.find((x) => x.id === v.task);
        if (!t) return "任务不存在";
        t.project = id;
      } else return "项目操作不存在";
      return null;
    }
    case "wb-assistant": {
      if (v.action === "create") {
        if (!String(v.name || "").trim()) return "请输入助理名称";
        w.assistants.push({
          id: c.id,
          name: String(v.name),
          channel: String(v.channel || "企业微信"),
          enabled: false,
          messages: [],
        });
        return null;
      }
      const a = w.assistants.find((x) => x.id === id);
      if (!a) return "助理不存在";
      a.enabled = Boolean(v.enabled);
      a.channel = String(v.channel || a.channel);
      return null;
    }
    case "wb-automation": {
      if (v.action === "save") {
        if (
          !String(v.name || "").trim() ||
          !String(v.prompt || "").trim() ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v.time))
        )
          return "请填写名称、任务内容和有效时间";
        if (
          !Array.isArray(v.days) ||
          !v.days.length ||
          v.days.some(
            (d) => !Number.isInteger(d) || Number(d) < 0 || Number(d) > 6,
          )
        )
          return "请选择执行日期";
        const old = w.automations.find((x) => x.id === id);
        const a: WbAutomation = {
          id: old?.id || c.id,
          name: String(v.name),
          prompt: String(v.prompt),
          time: String(v.time),
          days: v.days as number[],
          enabled: Boolean(v.enabled),
          lastDay: old?.lastDay || "",
          records: old?.records || [],
        };
        if (old) Object.assign(old, a);
        else w.automations.push(a);
        return null;
      }
      const a = w.automations.find((x) => x.id === id);
      if (!a) return "定时任务不存在";
      if (v.action === "toggle") a.enabled = !a.enabled;
      else if (v.action === "delete")
        w.automations = w.automations.filter((x) => x.id !== id);
      else if (v.action === "run" || v.action === "due") {
        const now = new Date(),
          day = now.toLocaleDateString("en-CA"),
          hhmm = now.toTimeString().slice(0, 5);
        if (
          v.action === "due" &&
          (!a.enabled ||
            a.lastDay === day ||
            !a.days.includes(now.getDay()) ||
            a.time !== hhmm)
        )
          return "尚未到执行时间";
        if (v.action === "due") a.lastDay = day;
        const task = startTask(s, c.id, a.prompt, identify(a.prompt), {
          mode: "agent",
        });
        a.records.unshift({
          at: Date.now(),
          task: task.id,
          status: "已创建任务",
        });
      } else return "自动化操作不存在";
      return null;
    }
    case "wb-library-add": {
      const kind = String(v.kind) as ResultKind;
      if (!Object.keys(resultLabels).includes(kind)) return "资料类型不存在";
      const text = content(s, kind);
      w.files.push({
        id: c.id,
        name: String(v.name || resultLabels[kind] + ".md"),
        kind: "markdown",
        content: text,
        draft: newWbDraft(text),
        folder: String(v.folder || "澄星设计"),
        task: "",
        edited: false,
        dataVersion: s.reportRevision,
      });
      return null;
    }
    case "wb-notice-read":
      for (const n of w.notices) n.read = true;
      return null;
    case "wb-mail-draft": {
      if (!String(v.subject || "").trim()) return "请输入主题";
      const mail = {
        id: id || c.id,
        recipient: String(v.recipient || ""),
        subject: String(v.subject),
        body: String(v.body || ""),
      };
      const old = w.mailDrafts.find((m) => m.id === id);
      if (old) Object.assign(old, mail);
      else w.mailDrafts.push(mail);
      return null;
    }
    case "wb-share":
      w.notices.unshift({
        id: c.id,
        text: "已保存分享记录：" + String(v.name || "销售资料"),
        read: false,
      });
      return null;
    default:
      return "WorkBuddy 操作不存在";
  }
}
