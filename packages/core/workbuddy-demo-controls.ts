import {extractLiveParameters} from "./live-workbuddy.js";
/** Standalone input contract. No native protocol, transport, or service execution. */
export const controlKinds = [
  "duration",
  "color",
  "font",
  "palette",
  "document",
  "photo",
  "scanner",
  "sketch",
  "expert",
  "skills",
  "connectors",
  "formats",
  "polish",
  "capture",
] as const;
export type DemoControlKind = (typeof controlKinds)[number];
export type ControlOrigin = "explicit" | "recommended" | "manual";
export interface DemoControlBinding {
  id: string;
  kind: DemoControlKind;
  origin: ControlOrigin;
  value: string[];
  phrase: string;
  start: number;
  end: number;
  reason: string;
  revision: string;
  seen?: boolean;
  detached?: boolean;
  suggestionKey?: string;
  /** Source span stays authoritative; append preserves the supporting sentence. */
  presentation?: "replace" | "append";
  purpose?: "value" | "material-entry";
  role?: string;
  scope?: string;
}
export interface ControlOption {
  id: string;
  zh: string;
  en: string;
  detail?: string;
  detailEn?: string;
  color?: string;
  swatches?: string[];
}
export interface ControlDefinition {
  kind: DemoControlKind;
  zh: string;
  en: string;
  multiple?: boolean;
  demo?: boolean;
  options: ControlOption[];
}
const option = (
  id: string,
  zh: string,
  en: string,
  detail?: string,
  detailEn?: string,
): ControlOption => ({
  id,
  zh,
  en,
  ...(detail ? { detail } : {}),
  ...(detailEn ? { detailEn } : {}),
});
export const controlDefinitions: ControlDefinition[] = [
  { kind: "duration", zh: "时间", en: "Duration", options: [] },
  { kind: "color", zh: "颜色", en: "Color", options: [] },
  {
    kind: "font",
    zh: "字体",
    en: "Font",
    options: [
      option("sans-serif", "系统无衬线", "System sans"),
      option("serif", "系统衬线", "System serif"),
      option("monospace", "等宽字体", "Monospace"),
    ],
  },
  {
    kind: "palette",
    zh: "配色方案",
    en: "Palette",
    options: [
      {
        ...option("warm", "温暖自然", "Warm & natural"),
        swatches: ["#C86D51", "#E6B89C", "#FAF3EB", "#2C221E"],
      },
      {
        ...option("calm", "沉静专业", "Calm & professional"),
        swatches: ["#4F63D2", "#8E9CEF", "#F4F6FD", "#182038"],
      },
      {
        ...option("fresh", "清新简洁", "Fresh & simple"),
        swatches: ["#2A9D8F", "#8AB17D", "#F2F9F6", "#1B322C"],
      },
      {
        ...option("aurora", "极光流体", "Aurora glass"),
        swatches: ["#6366F1", "#A855F7", "#EC4899", "#F5F3FF"],
      },
      {
        ...option("minimal", "极简曜石", "Minimal obsidian"),
        swatches: ["#18181B", "#52525B", "#E4E4E7", "#FAFAFA"],
      },
      {
        ...option("sunset", "暮光琥珀", "Sunset amber"),
        swatches: ["#EA580C", "#F59E0B", "#FEF3C7", "#291811"],
      },
      {
        ...option("nordic", "北欧冰川", "Nordic glacier"),
        swatches: ["#0284C7", "#38BDF8", "#F0F9FF", "#0F172A"],
      },
      {
        ...option("morandi", "雅致莫兰迪", "Morandi rose"),
        swatches: ["#9D6B7B", "#C9ADA7", "#F7F3F2", "#2B252C"],
      },
    ],
  },
  {
    kind: "document",
    zh: "参考文件",
    en: "Reference file",
    options: [option("product-brief", "产品介绍 · Product brief.md", "产品介绍 · Product brief.md")],
  },
  { kind: "photo", zh: "图片", en: "Image", options: [] },
  { kind: "scanner", zh: "文档扫描", en: "Document scanner", options: [] },
  { kind: "sketch", zh: "手绘画板", en: "Sketch", options: [] },
  {
    kind: "expert",
    zh: "专家",
    en: "Expert",
    demo: true,
    options: [
      option(
        "ppt",
        "演示设计专家",
        "Presentation designer",
        "发布会与培训演示视觉叙事与版式设计",
        "Visual storytelling & slide layout for keynotes",
      ),
      option(
        "writer",
        "内容创作专家",
        "Content writer",
        "深度长文、品牌故事与结构化方案撰稿",
        "In-depth articles, brand stories & proposals",
      ),
      option(
        "sales",
        "销售方案专家",
        "Sales specialist",
        "客户痛点洞察、价值主张提炼与赢单方案",
        "Customer insights, value propositions & pitch decks",
      ),
      option(
        "finance",
        "财务分析专家",
        "Finance specialist",
        "经营指标核算、预算建模与财务回报分析",
        "Financial modeling, budget planning & ROI analysis",
      ),
      option(
        "procurement",
        "采购分析专家",
        "Procurement analyst",
        "供应商评估、成本拆解与招标比价策略",
        "Supplier evaluation, cost breakdown & bidding",
      ),
      option(
        "delivery",
        "交付项目经理",
        "Delivery manager",
        "里程碑排期、风险管控与跨团队交付协同",
        "Milestone scheduling, risk control & delivery",
      ),
    ],
  },
  {
    kind: "skills",
    zh: "技能",
    en: "Skills",
    multiple: true,
    demo: true,
    options: [
      option(
        "ppt-implement",
        "演示文稿制作",
        "Presentation creation",
        "结构化幻灯片排版、视觉母版与演讲备注",
        "Structured slides, visual masters & speaker notes",
      ),
      option(
        "document-skills",
        "办公文档",
        "Office documents",
        "专业报告、方案文档撰写与多级结构化排版",
        "Professional reports, proposals & formatting",
      ),
      option(
        "data",
        "数据分析",
        "Data analysis",
        "多维指标拆解、趋势洞察与可视化图表构建",
        "Multi-dimensional metrics, trends & charts",
      ),
      option(
        "deep-research",
        "深度研究",
        "Deep research",
        "结构化深度调研工作流，支持多源交叉验证",
        "Structured deep research & cross-source verification",
      ),
      option(
        "product-management",
        "product-management",
        "product-management",
        "产品管理插件，支持功能规格、需求与路线图",
        "Product management plugin for specs & roadmaps",
      ),
      option(
        "demand-mining",
        "国内需求挖掘",
        "CN Demand Mining",
        "中国公域新媒体平台需求挖掘与痛点分析",
        "Public social platform demand & pain-point mining",
      ),
      option(
        "seo-ops",
        "seo-ops",
        "seo-ops",
        "SEO 运营自动化，内容攻击简报与关键词矩阵",
        "SEO operations automation & keyword matrix",
      ),
      option(
        "wechat-miniapp",
        "微信小程序开发框架",
        "WeChat Mini-Program",
        "微信小程序开发框架（模板、组件与云开发）",
        "WeChat Mini-Program templates & components",
      ),
      option(
        "ecom-copywriter",
        "电商爆款文案生成器",
        "E-com Copywriter",
        "电商卖家的爆款文案生成：标题、卖点与详情",
        "High-converting e-commerce titles & detail copy",
      ),
      option(
        "ecomseer-tiktok",
        "EcomSeer TikTok",
        "EcomSeer TikTok",
        "TikTok Shop 电商数据：商品选品与趋势分析",
        "TikTok Shop product selection & trend analytics",
      ),
      option(
        "cn-ecom-search",
        "中国电商搜索",
        "CN E-com Search",
        "8 大中国电商平台商品搜索与全网比价分析",
        "Product search & comparison across 8 CN platforms",
      ),
      option(
        "x-longform-post",
        "x-longform-post",
        "x-longform-post",
        "撰写 X(Twitter) 长文，创始人故事与观点",
        "Compose X(Twitter) longform posts & stories",
      ),
      option(
        "content-factory",
        "内容工厂",
        "Content Factory",
        "多智能体内容生产系统，一份素材多平台改写",
        "Multi-agent content production & adaptation",
      ),
      option(
        "content-dist",
        "内容分发",
        "Content Distribution",
        "将长文内容转化为多平台优化的分发稿件",
        "Transform longform articles into multi-platform posts",
      ),
      option(
        "startup-val",
        "创业验证",
        "Startup Validation",
        "创业想法验证，评估问题-方案匹配度与商业模式",
        "Validate startup ideas & problem-solution fit",
      ),
      option(
        "market-research",
        "市场调研",
        "Market Research",
        "市场调研专家，提供市场分析、竞品格局与画像",
        "Market analysis, competitive landscape & personas",
      ),
      option(
        "startup-learn",
        "创业可以学",
        "Startup Advisory",
        "服务创业者和管理者，解答股权与增长实战问题",
        "Startup & management advisory on equity and growth",
      ),
      option(
        "wechat-publisher",
        "Wechat Publisher",
        "Wechat Publisher",
        "一键发布 Markdown 到微信公众号草稿箱",
        "One-click publish Markdown to WeChat Official Account",
      ),
      option(
        "wechat-article",
        "微信公众号文章发布",
        "WeChat Article Studio",
        "公众号长文写作+AI封面+自动排版与发布",
        "WeChat Official Account writing, AI cover & layout",
      ),
      option(
        "find-skills",
        "find-skills",
        "find-skills",
        "帮助用户发现和安装 AI Agent 扩展技能套件",
        "Discover and install AI Agent extension skills",
      ),
    ],
  },
  {
    kind: "connectors",
    zh: "连接器",
    en: "Connectors",
    multiple: true,
    demo: true,
    options: [
      option(
        "tencent-docs",
        "腾讯文档",
        "Tencent Docs",
        "同步在线文档、表格与团队协作知识库",
        "Sync online docs, sheets & team files",
      ),
      option(
        "feishu",
        "飞书",
        "Feishu",
        "接入飞书云文档、多维表格与群组纪要",
        "Connect Feishu docs, Base tables & notes",
      ),
      option(
        "wecom",
        "企业微信",
        "WeCom",
        "读取企业微信汇报记录、客户与项目资料",
        "Access WeCom reports, client & project records",
      ),
      option(
        "mail",
        "邮箱",
        "Mail",
        "检索往来邮件正文、附件材料与决策记录",
        "Retrieve email threads, attachments & logs",
      ),
      option(
        "ima",
        "ima 知识库",
        "ima Knowledge",
        "调用个人与团队沉淀的结构化知识库与资料",
        "Query curated personal & team knowledge base",
      ),
    ],
  },
  {
    kind: "formats",
    zh: "输出格式",
    en: "Output formats",
    multiple: true,
    options: [
      ["docx", "Word", "#3265B2"],
      ["xlsx", "Excel", "#278451"],
      ["pptx", "PPT", "#C75A32"],
      ["pdf", "PDF", "#C84042"],
      ["md", "Markdown", "#667D97"],
      ["csv", "CSV", "#258982"],
      ["html", "HTML", "#CF6236"],
    ].map(([id, zh, color]) => ({ id, zh, en: zh, color })),
  },
  { kind: "polish", zh: "文本润色", en: "Polish", options: [] },
  { kind: "capture", zh: "截图／录屏", en: "Screen capture", options: [] },
];
export function listControls() {
  return structuredClone(controlDefinitions);
}
export const definition = (kind: DemoControlKind) =>
  controlDefinitions.find((c) => c.kind === kind)!;
export const controlLabel = (kind: DemoControlKind, language = "zh") =>
  definition(kind)[language === "en" ? "en" : "zh"];
export function valueLabel(control: DemoControlBinding, language = "zh") {
  const options = definition(control.kind).options;
  return (
    control.value
      .map((v) => {
        const o = options.find((o) => o.id === v);
        return o ? o[language === "en" ? "en" : "zh"] : v;
      })
      .join(" / ") || controlLabel(control.kind, language)
  );
}
export const sampleReference =
  "# Product brief / 产品介绍\n\nFictional demonstration material.\n产品：桌面协作助手。帮助团队准备演示、整理文档与图片。\nProduct: a desktop collaboration assistant for presentations, documents and images.\n";
export const mixedExample = {
  zh: "帮我做一个10分钟的产品演示，背景用灰色，文字用黑色。整体温暖自然一点，需要一些相关资料，专业人士帮我把效果做好，补充已连接资料来源中的相关知识。",
  en: "Create a 10 minute product presentation with a gray background and black text. Make it feel warm and natural, use relevant references, get professional help to make it polished and use connected reference sources.",
};
type Rule = {kind: DemoControlKind; pattern: RegExp; value?: string[]; role?: string; origin: ControlOrigin; group?: number};
// Specific values precede category invitations; recommendations never consume their evidence.
const explicitRules: Rule[] = [
  {kind:"duration",pattern:/(?:演讲时长|演讲时间|汇报时长|培训时长)(?:设为|设置为|为|是|用)?(\d{1,2})分钟/g,group:1,origin:"explicit"},
  {kind:"font",pattern:/微软雅黑|\bArial\b|\bHelvetica\b|\bTimes New Roman\b|系统无衬线|系统衬线|等宽字体/gi,origin:"explicit"},
  {kind:"palette",pattern:/(?:配色方案|调色板)(?:选择|用|采用|设为)(沉静专业|温暖自然|清新简洁)/g,group:1,origin:"explicit"},
  {kind:"document",pattern:/内置产品介绍/g,value:["product-brief"],origin:"explicit"},
  {kind:"scanner",pattern:/扫描件|扫描(?:文档|票据|收据)?|scan(?:ning)?\s+(?:a\s+)?(?:document|receipt|pages?)/gi,origin:"explicit"},
  {kind:"sketch",pattern:/手绘草图|手绘画板/g,origin:"explicit"},
  {kind:"expert",pattern:/演示设计专家|内容创作专家|销售方案专家|财务分析专家|采购分析专家|交付项目经理|presentation designer|content writer|sales specialist|finance specialist/gi,origin:"explicit"},
  {kind:"skills",pattern:/演示文稿制作|办公文档|数据分析|深度研究|presentation creation|office documents|data analysis|deep research/gi,origin:"explicit"},
  {kind:"connectors",pattern:/ima\s*知识库|ima knowledge base|腾讯文档|飞书|企业微信|Tencent Docs|Feishu|WeCom/gi,origin:"explicit"},
  {kind:"formats",pattern:/(?<![\w.\-])(?:PPTX?|PDF|DOCX|XLSX|Markdown|CSV|HTML)(?:(?:和|及|、|\/|\s+and\s+|\s*,\s*|\s+)(?:PPTX?|PDF|DOCX|XLSX|Markdown|CSV|HTML))*(?![\w])/gi,origin:"explicit"},
  {kind:"capture",pattern:/参考截图|参考录屏|截图|截屏|录屏|screenshot|screen\s*(?:recording|capture)|record\s+(?:the\s+)?screen/gi,origin:"explicit"},
  ...([['font',/字体|\bfont\b|\btypeface\b/gi],['palette',/配色方案|调色板|color palette|colour palette|\bpalette\b/gi],['expert',/专家|\bexpert\b/gi],['skills',/技能|\bskills?\b/gi],['connectors',/上下文来源|连接器|\bconnector\b/gi],['formats',/输出格式|导出格式|\boutput formats?\b/gi]] as [DemoControlKind,RegExp][]).map(([kind,pattern])=>({kind,pattern,origin:'explicit' as const})),
];
const recommendedRules: Rule[] = [
  {kind:"duration",pattern:/(?:简短|精炼|简洁)(?:的)?(?:演讲(?:报告)?(?!稿)|口头汇报|培训(?:介绍)?(?!手册|文档|资料|材料|讲义|稿|说明))|简短(?:的)?演示文稿|(?:brief|short|concise) (?:oral report|speech(?!\s+(?:script|draft|text))|oral presentation|training talk)/gi,value:["10"],role:"演讲时长",origin:"recommended"},
  {kind:"color",pattern:/标题有重点|突出标题|emphasi[sz]e the headings/gi,value:["#5267B2"],role:"主题色",origin:"recommended"},
  {kind:"color",pattern:/页面明亮|明亮的页面|bright pages/gi,value:["#F4F6FC"],role:"背景",origin:"recommended"},
  {kind:"color",pattern:/正文清楚易读|正文易读|readable body text/gi,value:["#202637"],role:"字体",origin:"recommended"},
  {kind:"font",pattern:/字形适合培训投影|适合投影的字形|字形清楚易读|font suitable for projection|clear readable type/gi,value:["sans-serif"],origin:"recommended"},
  {kind:"palette",pattern:/温暖自然|温暖|自然一点|沉静专业|清新简洁|\bwarm\b(?:\s+and\s+natural\b)?|calm and professional|fresh and simple|(?:推荐|建议)[^，。；]{0,8}配色方案|recommend[^,.]{0,20}palette/gi,value:["warm"],origin:"recommended"},
  {kind:"document",pattern:/相关产品资料|可靠的产品资料|相关资料|参考一些资料|(?:推荐|建议)[^，。；]{0,8}(?:参考文件|参考材料)|relevant references|supporting materials/gi,value:["product-brief"],origin:"recommended"},
  {kind:"photo",pattern:/直观看到产品(?:实际)?的样子|see what the product looks like/gi,origin:"recommended"},
  {kind:"scanner",pattern:/纸质培训提纲|纸质(?:资料|笔记)|paper (?:training outline|notes)/gi,origin:"recommended"},
  {kind:"sketch",pattern:/(?:排版|布局)想法用文字不容易说清|方便表达布局的方式|layout is hard to describe/gi,origin:"recommended"},
  {kind:"capture",pattern:/现有[^，。；]{0,18}页面的视觉样式|连续的操作步骤和过渡效果|existing page.{0,15}visual style|interaction steps and transitions/gi,origin:"recommended"},
  {kind:"skills",pattern:/把效果做好|合适的制作能力|完善呈现|介绍(?:一下)?(?:(?:今年|本年度|这次|本次)(?:的)?(?:要|将|将要|新|准备|即将)?(?:发布的?|推出的?|上市的?)?(?:新)?|(?:要|将|将要|新|准备|即将)?(?:发布的?|推出的?|上市的?)(?:新)?|新)产品|make it polished|polish the presentation/gi,value:["ppt-implement"],origin:"recommended"},
  {kind:"expert",pattern:/专业人士|专业帮助|介绍(?:一下)?(?:(?:今年|本年度|这次|本次)(?:的)?(?:要|将|将要|新|准备|即将)?(?:发布的?|推出的?|上市的?)?(?:新)?|(?:要|将|将要|新|准备|即将)?(?:发布的?|推出的?|上市的?)(?:新)?|新)产品|professional help/gi,value:["ppt"],origin:"recommended"},
  {kind:"connectors",pattern:/已连接资料来源|(?:推荐|建议)[^，。；]{0,12}上下文来源|已有连接器|connected (?:knowledge|reference) sources|recommend[^,.]{0,20}context source/gi,value:["ima"],origin:"recommended"},
  {kind:"skills",pattern:/分析反馈|analy[sz]e (?:customer )?feedback/gi,value:["data"],origin:"recommended"},
  {kind:"formats",pattern:/打开就能按状态筛选问题、查看负责人和进度|(?:打开就能|可以|能够)[^。；!?]{0,35}(?:筛选问题|筛选反馈)|(?:filter (?:issues|feedback)|view owners and progress)/gi,value:["html"],origin:"recommended"},
  {kind:"formats",pattern:/一份可以继续编辑|方便直接分发和阅读|editable copy|easy to distribute and read/gi,value:["pptx","pdf"],origin:"recommended"},
];
const isNegative = (text: string, start: number) =>
  /(?:不要|不用|无需|不需要|(?<![特分区告识级类性])别|取消|不想)[^，。；,.;!?！？\n]{0,12}$|\b(?:no|not|without|avoid|skip|remove|don['’]t|do not)\b[^,.;，。；!?！？\n]{0,24}$/i.test(text.slice(Math.max(0,start-50),start));
const scopeAt = (text:string,start:number) => text.slice(0,start).split(/[。；;\n]/).at(-1)?.match(/第[一二三四五六七八九十\d]+页/)?.[0] || '全文';
export function dismissalKey(c: DemoControlBinding) {return c.suggestionKey || c.kind+":"+c.reason+":"+c.phrase.toLowerCase();}
export function recommendControls(text:string,context:{previous?:DemoControlBinding[];dismissed?:string[]}={}) {
  const result:DemoControlBinding[]=[];
  for(const rule of [...explicitRules,...recommendedRules]) {
    const match=[...text.matchAll(rule.pattern)].find(m=>{
      if(isNegative(text,m.index!))return false;
      if(rule.value?.includes('html') && (/(?:don['’]t|do not|no need to|avoid)[^.!?]{0,30}(?:build|create|make)[^.!?]{0,30}(?:workspace|dashboard)|(?:写|编写|整理|制作|做)(?:一份|一篇)?[^。；]{0,30}(?:说明文档|手册|说明书)/i.test(text) || !/(?:做|创建|搭建|制作|create|build|make)[^。；.!?]{0,45}(?:工作台|dashboard|workspace)/i.test(text) || /(?:不要|不用|无需|不需要)[^。；]{0,20}工作台|(?:write|prepare).{0,20}(?:document|report).{0,20}(?:workspace|dashboard)/i.test(text)))return false;
      const before=text.slice(0,m.index!).split(/[，。；,.;!?！？\n]/).at(-1)||'';
      const tail=text.slice(m.index!+m[0].length).split(/[，。；,.;!?！？\n]/)[0];
      if(rule.origin==='explicit'&&/^(?:上下文来源|连接器|connector|配色方案|调色板|palette|color palette|colour palette|字体|font|typeface|专家|expert|技能|skills?|输出格式|导出格式|output formats?)$/i.test(m[0])&&/(?:推荐|建议|recommend|suggest)/i.test(before+tail))return false;
      if(rule.kind==='connectors'&&/(?:发到|发送|通知|分享|同步到|\b(?:send|share|notify|post)\b)/i.test(before+tail))return false;
      if(rule.kind==='font'&&/^(字体|font|typeface)$/i.test(m[0])&&/^[^，。；,.;!?！？\n]{0,10}(?:黑色|白色|红色|蓝色|灰色|绿色|黄色|紫色|#[0-9a-f]{6}|black|white|red|blue|gray|grey|green|yellow|purple)/i.test(tail))return false;
      return true;
    });
    if(!match)continue;
    const phrase=rule.group?match[rule.group]:match[0],start=match.index!+match[0].lastIndexOf(phrase),kind=rule.kind,scope=scopeAt(text,start);
    const role=rule.role||(kind==='duration'?'演讲时长':undefined);
    if(result.some(c=>c.kind===kind&&(kind!=='color'||c.role===role)))continue;
    if(rule.origin==='recommended'&&extractLiveParameters(text).some(p=>p.kind===kind&&p.scope===scope&&(
      kind==='duration'||kind==='photo'||
      kind==='document'&&!/(?:推荐|建议|recommend|suggest)/i.test(text.slice(0,p.end).split(/[，。；,.;!?！？\n]/).at(-1)||'')&&(/文件|文档|链接|\.(?:pdf|docx|txt|md)|file|document|link/i.test(p.phrase)||/(?:选择|上传|添加|附上|参考|依据)(?:这|我的|该|这份)?$/.test(text.slice(0,p.start)))||
      kind==='sketch'&&/画|手绘|绘制|sketch|draw/i.test(text.slice(0,p.end).split(/[。；;\n]/).at(-1)||'')
    )))continue;
    if(kind==='duration'&&rule.origin==='recommended'&&/(?:\d+|[零一二两半三四五六七八九十百]+)\s*(?:分钟|小时|minutes?|mins?|hours?)|half an? hour/i.test(text))continue;
    if(kind==='color') {
      if(extractLiveParameters(text).some(p=>p.kind==='color'&&p.scope===scope&&p.role===role))continue;
    }
    if(kind==='document'&&rule.origin==='recommended'&&/(?:[\w\u4e00-\u9fff-]+\.(?:pdf|docx|txt|md)|我的文件|本地文件|my file|local file)/i.test(text))continue;
    let value=rule.value||definition(kind).options.filter(o=>[o.zh,o.en].some(v=>v.toLowerCase()===phrase.toLowerCase())).map(o=>o.id);
    if(kind==='duration'&&rule.origin==='explicit'){if(+phrase<1||+phrase>60)continue;value=[phrase];}
    if(kind==='font'&&!value.length&&!/^(字体|font|typeface)$/i.test(phrase))value=[phrase];
    if(kind==='palette'&&rule.origin==='recommended')value=[/沉静|calm/i.test(phrase)?'calm':/清新|fresh/i.test(phrase)?'fresh':'warm'];
    if(kind==='connectors'&&/ima/i.test(phrase))value=['ima'];
    if(kind==='formats'&&rule.origin==='recommended'&&value.includes('pptx')&&/可以继续编辑的演示稿|editable (?:presentation|slide deck)/i.test(text)&&!/方便直接分发和阅读|easy to distribute and read/i.test(text))value=['pptx'];
    if(kind==='formats'&&rule.origin==='explicit')value=definition(kind).options.filter(o=>new RegExp(o.id==='pptx'?'PPTX?':o.id==='md'?'Markdown|\\bmd\\b':o.id,'i').test(phrase)).map(o=>o.id);
    const next:DemoControlBinding={id:'control-'+kind+(role&&kind==='color'?'-'+role:''),kind,origin:rule.origin,value,phrase,start,end:start+phrase.length,scope,role,reason:rule.origin==='explicit'?'explicit-intent':'related-intent',revision:kind+':'+role+':'+rule.origin+':'+value.join(','),presentation:rule.origin==='recommended'?'append':'replace',purpose:['photo','scanner','sketch','capture'].includes(kind)?'material-entry':'value',suggestionKey:rule.origin==='recommended'?kind+(role?':'+role:'')+':related-intent:'+value.join(','):undefined};
    if(context.dismissed?.includes(dismissalKey(next)))continue;
    const prior=context.previous?.find(c=>c.id===next.id&&(c.phrase===next.phrase||(c.origin==='manual'&&(c.detached||next.origin==='recommended'))));
    result.push(prior?{...next,seen:prior.revision===next.revision?prior.seen:false,...(prior.origin==='manual'?{origin:'manual',value:prior.value,revision:prior.revision,suggestionKey:next.suggestionKey||prior.suggestionKey,detached:next.origin==='explicit'?false:prior.detached}: {})}:next);
  }
  for(const prior of context.previous||[])if(prior.detached&&!['capture','scanner'].includes(prior.kind)&&!context.dismissed?.includes(dismissalKey(prior))&&!result.some(c=>c.id===prior.id))result.push({...prior,start:text.length,end:text.length});
  return result.sort((a,b)=>a.start-b.start);
}
/** Supplement labels are display-only; they never become part of editable source text. */
export function recommendationPrefix(c:DemoControlBinding,language:string) {
 const role=c.kind==='connectors'?(language==='en'?'context source':'上下文来源'):c.role==='主题色'?(language==='en'?'theme color':'主题色'):c.role==='背景'?(language==='en'?'background':'背景'):c.role==='字体'?(language==='en'?'text color':'文字颜色'):controlLabel(c.kind,language);
 return language==='en'?' (Suggested '+(c.purpose==='material-entry'?'reference: ':role+': '):'（推荐'+(c.purpose==='material-entry'?'补充':c.kind==='document'?'参考':role)+'：';
}
export type ControlEvent = {
  type: "change" | "confirm" | "remove" | "close";
  owner: string;
  id: string;
  value?: string[];
};
export function openControl(
  kind: DemoControlKind,
  context: {
    owner: string;
    text: string;
    open: (binding: DemoControlBinding) => void;
  },
) {
  if (!controlKinds.includes(kind) || !context.owner)
    throw Error("Invalid control context");
  const binding: DemoControlBinding = {
    id: "control-" + kind,
    kind,
    origin: "manual",
    value: [],
    phrase: "",
    start: context.text.length,
    end: context.text.length,
    reason: "manual-entry",
    revision: kind + ":manual",
    detached: true,
    seen: true,
  };
  context.open(binding);
  return binding;
}
