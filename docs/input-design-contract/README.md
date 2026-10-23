# Mobile Input Agent · 设计与定义表

已整理现有项目规则、Notion PRD / Design / Harness 草案、Figma 与场景源码。资产快照日期：2026-10-22；规则合并及缺口编号迁移：2026-10-23。

设计规则统一在 **[Notion 主规范](https://app.notion.com/p/3f9194db24c38165996cf89b22e7d69e)** 读取和编辑。原Design MD内容已完整合并，本地重复正文已按用户要求删除。原Notion页面保留为 [设计资产与验证索引](https://app.notion.com/p/401194db24c3812e8bcbdd7f69dff3b1)，承载四个定义表子页。迁移详情见 [合并记录](design-migration.md)。

优先阅读新版 **[组件 × 功能图文总表](component-functions.html)**，或 [在 Notion 打开](https://app.notion.com/p/401194db24c381e68476eda28b455f48)。合并88项组件和101项功能；71张Figma原图，17张因MCP调用额度限制待补。支持搜索、层级/绑定筛选、展开功能和图片放大；同页有可编辑的Notion文字表。

合并数据另提供 [Markdown](component-functions.md)、[CSV](component-functions.csv)、[JSON](component-functions.json)。组件图为代表变体，不是当前运行时截图。


| 内容 | 本地 | Notion | 覆盖 |
| --- | --- | --- | --- |
| Design 主规范 | 不保留重复正文 | [规则、生成与场景契约](https://app.notion.com/p/3f9194db24c38165996cf89b22e7d69e) | 原场景/模板/G规则＋T主题/P面板/建议Schema/GAP缺口/验收 |
| 图标定义表 | [Markdown](icons.md) · [CSV](icons.csv) | [图标表](https://app.notion.com/p/401194db24c381269e15ff23ae77a6cc) | 354项图标及外观资源，含品牌标识部件 |
| 组件定义表 | [Markdown](components.md) · [CSV](components.csv) | [组件表](https://app.notion.com/p/401194db24c381a58183ce6128ade5f0) | 88条已有登记；原子27/输入组合51/场景组合10 |
| 功能定义表 | [Markdown](functions.md) · [CSV](functions.csv) | [功能表](https://app.notion.com/p/401194db24c381f5ad2ec7a69a60a14e) | 101项输入与控制操作；含设计待接入项 |

找图形时打开 [可搜索图标预览](icons-preview.html)。完整结构数据在 [definitions.json](definitions.json)。预览中的“组合”占位表示尚未独立导出的内联/CSS图形；对应实现位置保留在定义表，不把占位当最终图标设计。

先读主规范对应场景与生成契约，再查三张表；接入缺口见§10.3 GAP-01–14。G01–G25仍指原设计规则。重点待补：统一可执行组件Schema、功能到应用适配器的绑定、建议回复动作命名、旧组件和示例迁移；依主PRD阶段门选择切片，不能要求先运行化整个目录。原Design Skill已合入增量；PRD与Figma未改。

后续普通应用面板默认从桌面icon取色；WPS按当前W／S／P子应用图标分别取蓝／绿／橙色系，主图标仅用于首页。完整取色、缓存、回退及验收统一见主规范§2.4 T01–T06。该规则已确立，通用运行时接入另行验证。

快捷面板细则见主规范§7.7 P01–P07，与§7.1–7.6使用同一生成契约。既有视觉值引用Figma/token导出；四槽位为测试起点，12格等为候选容量模板；无溢出时More空态仍待验收。

## WPS 示例

[WPS 快捷键交互预览](wps-shortcut-preview/README.md) 是此前父图标取色实验：采用已有动作键设计、底栏CSS及SVG，OpenUI Renderer渲染11动作＋More；按钮影响独立示例文档。它尚未实现按W／S／P子应用切换配色，不作为WPS文字场景最终主题。预览服务入口为 http://127.0.0.1:8797 ，尚未接入真实WPS。

## 历史资产核对（2026-10-22）

- 生成规则补充：核对10个现有主题值及27组浅色背景公式；本地原有正文保留。Notion回读确认两节规则、两张流程图和4个子页完整，原有内容未被覆盖。规则验收用例尚未作为运行时功能测试执行。
- Figma：88/88 登记节点存在；核对类型、首个变体尺寸与变体数，未逐态做像素验收。
- 图标：161个 Lucide 引用均可从当前安装包解析；静态资源路径与源码引用检查通过。Hover manifest 图标只证明本地资源登记，不代表真实App接入。
- 本地：三张表的 Markdown、CSV 与 JSON 行 ID 对齐；功能组件引用有效；未指定图标明确标记为待补。
- Notion：主 PRD 下新建一份整理页及三张表子页；回读行数与有序 ID 分别为354 / 88 / 101，父子关系正确。
- 本轮只做文档整理和完整性检查，没有改运行时代码、提交Git或重跑浏览器/真机功能测试。

## 范围与维护

图标覆盖主应用与Hover的Lucide引用、Figma导出图形、相关应用Logo及Hover图标manifest；不纳入头像、截图、壁纸、字体。部分条目是字标部件、外观资源或CSS组合，不是独立动作。

组件表保留历史条目并标状态。功能表针对手机输入和关联控制，未把内部心跳、tick及全部文件管理后台命令都当作用户功能。功能ID与图标ID为本次规范化建议；当前命令单列。Schema示例尚未注册进OpenUI运行时。

设计正文只在Notion主规范维护，后续生成前读取当前版本；不重新生成常驻本地镜像。定义表、CSV/JSON及HTML必须同批更新；不要运行旧快照生成脚本覆盖现有表。2026-10-22资产证据保留在 `artifacts/input-design-contract-2026-10-22/`；合并及删除前的备份、回读与验证在 `artifacts/design-consolidation-2026-10-23/`。本目录保留定义表、预览与迁移记录。
