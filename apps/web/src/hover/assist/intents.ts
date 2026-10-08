import bookclubMessages from "../data/bookclub-messages.json" with { type: "json" };
import paragraphs from "../data/paragraph-messages.json" with { type: "json" };
import paragraphIntents from "../data/paragraph-intents.json" with { type: "json" };
import destinations from "../data/destinations.json" with { type: "json" };
import constraints from "../data/constraint-rules.json" with { type: "json" };
import provenance from "../data/action-provenance.json" with { type: "json" };
import scenarios from "../data/scenarios.json" with { type: "json" };
import cases from "../data/intent-cases.json" with { type: "json" };
import translations from "../data/translations.json" with { type: "json" };
import reviews from "../data/message-intents.json" with { type: "json" };
import { filePreview } from "./files";
import type {
  Action,
  IntentProvider,
  IntentRequest,
  IntentResult,
} from "./types";
type RawAction = {
  app: string;
  label: string;
  title: string;
  fields: string[][];
  cta: string;
};
const actions = scenarios.actions as Record<string, RawAction>;
export const appNames: Record<string, string> = {
  tongcheng: "同程旅行",
  yuanbao: "元宝",
  workbuddy: "腾讯 WorkBuddy",
  "tencent-docs": "腾讯文档",
  weibo: "微博",
  baidu: "百度网盘",
  wps: "金山文档",
  qunar: "去哪儿旅行",
  caoliao: "草料二维码",
  ima: "腾讯 ima",
  camcard: "名片全能王＋",
  mowen: "墨问",
  xiaodaka: "小打卡",
  weiyun: "微云",
  qunjielong: "群接龙",
  miniapp: "小程序示例",
  calendar: "华为日历",
  phone: "华为电话",
  contacts: "华为联系人",
  notes: "华为备忘录",
  mail: "华为邮件",
  xiaoyi: "华为小艺",
  feishu: "飞书",
  ctrip: "携程",
  gaode: "高德地图",
  meituan: "美团",
  taobao: "淘宝",
  jd: "京东",
  damai: "大麦",
  sf: "顺丰速运",
  wechat: "微信",
};
const normalize = (text: string) =>
  text.trim().replace(/\s+/g, " ").replace(/[“”]/g, '"').replace(/[’]/g, "'");
const fixtureMessages = Object.values(scenarios.chats).flatMap(
  (chat) => chat.messages,
);
const conversationKeys: Record<string, keyof typeof scenarios.chats> = {
  "wx-boss": "boss",
  "wx-daily": "wife",
  "wx-alex": "alex",
  "wx-life": "wife",
};
const findCase = (r: IntentRequest) => {
  const chat = scenarios.chats[conversationKeys[r.conversationId]];
  if (!chat?.messages.some((m) => m.id === r.target.messageId))
    return undefined;
  const message = r.context.find((m) => m.id === r.target.messageId);
  const fixture = fixtureMessages.find((m) => m.id === r.target.messageId);
  if (
    !message ||
    !fixture ||
    normalize(message.text) !== normalize(fixture.text)
  )
    return undefined;
  return cases.find((c) => c.targets.includes(r.target.messageId));
};
function action(id: string, sources: string[], r: IntentRequest): Action {
  const raw = actions[id];
  const fieldSources =
    (provenance as Record<string, Action["fieldSources"]>)[id] || [];
  const fields = raw.fields.map(([key, value]): [string, string] => {
    const source = fieldSources.find((f) => f.field === key);
    const valid = source?.messageIds.every((mid) => {
      const current = r.context.find((m) => m.id === mid);
      const original = fixtureMessages.find((m) => m.id === mid);
      return (
        current &&
        original &&
        normalize(current.text) === normalize(original.text)
      );
    });
    return [key, valid ? value : "待补充（来源消息缺失或已变化）"];
  });
  return {
    id,
    destination: (destinations as Record<string, Action["destination"]>)[id],
    label: raw.label,
    app: raw.app,
    title: raw.title,
    cta: raw.cta,
    fields,
    sources,
    fieldSources,
    missing: fields
      .filter(
        ([, value]) =>
          /待补充|请选择|待选择|to confirm/.test(value) ||
          value.trim() === "待确认",
      )
      .map(([key]) => key),
  };
}
export class LocalIntentProvider implements IntentProvider {
  evaluate(r: IntentRequest) {
    if (r.target.kind === "file" && filePreview(r.target.artifactId))
      return {
        eligible: true,
        focusable: true,
        actions: [] as Action[],
        reason: "file",
      } as const;
    const actions = this.recommend(r);
    const review = reviews.find((row) => row.messageId === r.target.messageId);
    const current = r.context.find((m) => m.id === r.target.messageId);
    const fixture = fixtureMessages.find((m) => m.id === r.target.messageId);
    const known =
      current && fixture && normalize(current.text) === normalize(fixture.text);
    const reason = actions.length
      ? "mapped"
      : known && review?.classification === "dummy"
        ? "dummy"
        : known && review?.classification === "context-only"
          ? "context-only"
          : "unmapped";
    return {
      eligible: actions.length > 0,
      focusable:
        r.target.kind !== "free" &&
        Boolean(r.target.text.trim() || actions.length),
      actions,
      reason,
    } as const;
  }
  recommend(r: IntentRequest) {
    const c = findCase(r);
    if (!c) return [];
    const related = r.context
      .filter((m) => c.sources.includes(m.id))
      .map((m) => m.text)
      .join("\n");
    const blocked = new Set(
      constraints
        .filter(
          (rule) =>
            rule.caseIds.includes(c.id) &&
            new RegExp(rule.pattern, "i").test(related),
        )
        .flatMap((rule) => rule.blockedActionIds),
    );
    // Unknown later corrections are not interpreted by this local fixture provider.
    // Preserve the supported preset but require reconfirmation of affected parameters.
    const extra = r.context.filter(
      (m) => !fixtureMessages.some((f) => f.id === m.id),
    );
    const correction = extra.some((m) =>
      /改成|改到|取消|不用了|已完成|已经.*好了|不要|先别|actually|instead|cancel/i.test(
        m.text,
      ),
    );
    const paragraphActions = (paragraphIntents as Record<string, string[][]>)[
      r.target.messageId
    ]?.[r.target.paragraphIndex ?? -1];
    return (paragraphActions || c.actions)
      .filter((id) => !blocked.has(id))
      .slice(0, 3)
      .map((id) => {
        const next = action(
          id,
          c.sources.filter((mid) => r.context.some((m) => m.id === mid)),
          r,
        );
        if (correction) {
          next.fields = next.fields.map(([key]) => [
            key,
            "待确认（聊天有新的更正）",
          ]);
          next.missing = next.fields.map(([key]) => key);
          next.sources = [...next.sources, ...extra.map((m) => m.id)];
        }
        return next;
      });
  }
  example(r: IntentRequest) {
    return findCase(r)?.example || "这条消息需要我做什么？";
  }
  async resolve(r: IntentRequest, signal?: AbortSignal): Promise<IntentResult> {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (r.tool !== "translate")
      await new Promise<void>((resolve, reject) => {
        if (signal?.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        const abort = () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener("abort", abort);
          resolve();
        }, 850);
        signal?.addEventListener("abort", abort, { once: true });
      });
    if (r.tool === "translate") {
      const value = normalize(r.target.text),
        pair = [
          ...translations,
          ...paragraphs.flatMap((p) => p.translations),
          ...bookclubMessages.flatMap((p) => p.translations),
        ].find((t) => normalize(t.en) === value || normalize(t.zh) === value);
      const english =
        /[a-z]{2}/i.test(r.target.text) &&
        !/[\u4e00-\u9fff]/.test(r.target.text);
      const parts = Array.from(
        new Intl.Segmenter("en", { granularity: "sentence" }).segment(
          r.target.text,
        ),
        (item) => {
          const part = translations.find(
            (t) =>
              normalize(t.en) === normalize(item.segment) ||
              normalize(t.zh) === normalize(item.segment),
          );
          return part ? (english ? part.zh : part.en) : null;
        },
      );
      const combined =
        parts.length && parts.every(Boolean)
          ? parts.join(english ? "" : " ")
          : null;
      return {
        title: "翻译",
        text: pair
          ? english
            ? pair.zh
            : pair.en
          : combined || "暂时无法翻译这句话，请换一段内容。",
        actions: [],
        sources: [r.target.messageId],
        missing: [],
        direction: english ? "英语 → 中文" : "中文 → 英语",
        matched: !!pair || !!combined,
      };
    }
    const file =
      r.target.kind === "file" ? filePreview(r.target.artifactId) : null;
    if (file)
      return {
        title: "文档总结",
        text: /总结|摘要|内容|讲什么|summary/i.test(r.question)
          ? file.summary
          : `已收到你的问题：“${r.question}”。我可以先帮你总结文档内容。`,
        actions: [],
        sources: [file.id],
        missing: [],
        matched: /总结|摘要|内容|讲什么|summary/i.test(r.question),
      };
    // A spoken request may refer to a known message without pointing at it.
    // Only resolve one unambiguous context match, never manufacture parameters.
    const candidates =
      r.target.kind === "free" || !findCase(r)
        ? r.context.filter((m) => {
            const candidate = findCase({
              ...r,
              target: {
                ...r.target,
                messageId: m.id,
                text: m.text,
                paragraphIndex: undefined,
              },
            });
            return (
              candidate && new RegExp(candidate.keywords, "i").test(r.question)
            );
          })
        : [];
    if (candidates.length === 1)
      r = {
        ...r,
        target: {
          ...r.target,
          kind: "message",
          messageId: candidates[0].id,
          text: candidates[0].text,
        },
      };
    const c = findCase(r),
      generic =
        /这条|这段|这个信息|需要我|帮我看看|什么意思|what does|what should/i.test(
          r.question,
        );
    if (!c || (!generic && !new RegExp(c.keywords, "i").test(r.question))) {
      return {
        title: "小艺",
        text: c
          ? `可以试着问：“${c.example}”`
          : `已收到你的问题：“${r.question}”。暂时无法回答这个问题。你可以问我当前消息中的时间、地点或待办。`,
        actions: [],
        sources: [r.target.messageId],
        missing: [],
        matched: false,
      };
    }
    const recommended = /先别|不要|不用|取消|don't|do not|cancel/i.test(
      r.question,
    )
      ? []
      : this.recommend(r);
    return {
      title: c.title,
      text: recommended.some((a) =>
        a.fields.some(([, v]) => /来源消息缺失|聊天有新的更正/.test(v)),
      )
        ? "相关消息已更新，请先确认草稿中的日期、地点或联系人。"
        : c.answer,
      actions: recommended,
      sources: c.sources,
      missing: Array.from(new Set(recommended.flatMap((a) => a.missing))),
      matched: true,
    };
  }
}
