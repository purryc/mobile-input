# Input Agent 图标库

2026-10-22 · Design-only。用户授权整理小艺既有图标并补充完整通用库到 Figma。

## 结构与使用约定

### 专业图标补齐 · 2026-10-22

- 依据现有 `survey/comprehensive-panel-survey/` 与 `survey/keycombiner-shortcuts/` 的动作语料补齐语义图形；原始研究、工作簿和快捷键记录不改动。
- `reference/icon-library-custom/` 存放原创 SVG 与生成源，`reference/icon-library-coverage.json` 记录来源记录、图形对应和文字回退。原创图形使用 `Icon / Input Agent / <category> / <name>` 命名，不冒充应用官方图标。
- 本轮补齐绘画 24、CAD/矢量 24、剪辑 16、表格 8、Agent/采集 8，共 80 个专用图形。沿用 Lucide 的 24 px / 2 px 圆端线条，单色绑定已有 token，不为每条键位制造重复图标。
- 已有图形准确表达的动作复用；长命令、变量值、代码片段、陌生术语使用真实动作名称。语料的自动匹配只作为设计候选，不能将所有记录标成图标已人工验收或快捷键已可执行。
- Figma 同文件图标页增加专业母版分区，Design System 增加实例目录及可单独链接的分类 Frame。此处图标补齐不改变运行能力，也不覆盖用户场景排版。

- Figma 同一文件内独立图标页存放母版，`2:2` Design System 放入口与常用图标实例；按来源和功能分组，保留现有组件引用。
- `vendor/icon-library/lucide/`：固定提交的上游 SVG、分类元数据与许可证。保留图标几何、24×24 坐标及默认 2px 笔画。
- `vendor/icon-library/xiaoyi/`：用户已有研究重绘 SVG 与原清单副本；24×24、1.65px，保留来源/置信度。原项目不改动。
- `reference/icon-library.json`：版本、来源、哈希、覆盖核对及 Figma 节点映射。
- `artifacts/icon-library/`：临时下载、迁移脚本与截图，不进入应用运行包。禁止在目录中放原始录像或个人数据。
- 默认通用场景用 Lucide；小艺专有语义使用 Xiaoyi。一个工具栏不混用两种笔画家族。现有场景不批量替换，本轮交付可选用组件库。
- 单色绑定 foundation/text-primary，强调态绑定 theme/accent-foreground；应用容器拥有主题，图标不写死蓝色。彩色重绘与品牌标识保持原色。
- 16/20/24/32px 为视觉尺寸，触控按钮仍须提供至少 48px 热区。缺少专用语义时登记补绘，不用模糊图标冒充功能。
- 小艺图标为独立研究重建，不是华为官方 Symbols；第三方服务继续使用其真实 Logo。

## 来源与选择

- 小艺本地库：`/Users/hmi/Documents/Reference/Huawei Reference/Xiaoyi Design System/public/icons/manifest.json`，当前 97 枚。够覆盖助手基础界面，不足以独立覆盖全部生成式输入控件。
- Lucide：<https://lucide.dev/guide/>；官方仓库 <https://github.com/lucide-icons/lucide>。统一线性语言，完整导入固定快照，具体数量以实际 SVG 校验为准。
- Material Symbols 同样覆盖广，且已有少量既有引用；本轮保留旧引用，不另全量复制第二套通用库，避免图标命名及风格继续混杂。

## 交付状态

已完成：小艺 97 枚 + Lucide 1,903 枚 + Input Agent 原创 80 枚，共 2,080 个原生可编辑矢量组件；名称唯一、24×24，无空矢量或裁切标签。原常用入口使用 60 个实例，新增专业入口使用 89 个实例。

- [Design System 常用图标入口](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1978-94701)：48 枚常用实例及 System / WorkBuddy / GoPaint 三种主题示例。
- [完整图标页](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1972-25479)：小艺独立分组，Lucide 按上游 40 个主分类排列；Assets 搜索 `Icon / Lucide` 或 `Icon / Xiaoyi`，拖入实例即可使用。
- Lucide 固定源提交：`20aef31db93fe4d9f398dbb15b120d99c48eef95`。许可为 ISC，并保留所继承 Feather 图标的 MIT 通知；完整文本见 `vendor/icon-library/lucide/LICENSE`。
- 小艺保留全部 97 个 SVG、原清单、来源与置信度，10 枚彩色图保留原色，其余单色绑定主题文本颜色。
- 通用库覆盖文字格式、媒体、文件、绘画和设备图标；此前缺少的调色刀、液化、涂抹等已纳入 80 枚原创专业图标。仪表图不直接等同旋钮，扫描图不直接等同全选。
- 现有场景及其组件引用未批量替换，应用代码未修改；此处为同文件本地图标组件库，未发布为团队共享库。
- 验证：母版数量/唯一性/尺寸/矢量/颜色绑定；入口实例与文本边界；常用入口及小艺目录截图；三种主题颜色解析。截图存于忽略的 `artifacts/icon-library/`。

## 专业补绘入口与研究覆盖

- [专业图标实例总览](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1983-94940) / [80 枚专业母版](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1981-25479)。Assets 搜索 `Icon / Input Agent`。
- 分类 Frame：[绘画与笔刷](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1983-94944)、[CAD 与矢量](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1983-95094)、[剪辑与时间轴](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1983-95246)、[表格](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1983-95342)、[Agent 与采集](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1983-95393)。
- 原研究包含 KeyCombiner 116 个集合、12,198 条记录，及综合面板研究的 73 组专业操作、20 个任务套装。原文件未修改；来源动作与示例能力未升级为实测通过。
- 73 组专业操作逐组映射到现有或新图标，保留范围和动作名称。80 枚原创中 68 枚可关联现有研究行，其余 12 枚由此前绘画、参数、Agent 和采集需求补充。图形是本项目原创语义隐喻，不能冒充对应软件的官方工具栏素材。
- 对全部 12,198 条记录运行可追溯的词法候选匹配：6,036 条产生候选图标；4,985 条保留真实动作文字；1,177 条为代码/语法等文字记录。候选未逐行人工确认，不宣称每条都有唯一图标。具体候选、来源记录 ID、73 组人工语义映射与组件 ID 见 `reference/icon-library-coverage.json`。
- 新增图形通过 XML/哈希/重复内容检查；Figma 80 个母版尺寸、图形边界及单色绑定通过；89 个专业入口实例在 20/24/32 px、System/WorkBuddy/GoPaint 三种示例下检查。
- 重建原创源：`python3 reference/icon-library-custom/build-icons.py`；重建候选映射：`python3 reference/icon-library-custom/build-coverage.py`。脚本只重建本轮派生资产，不更改研究源；Figma 节点 ID 以 `reference/icon-library.json` 为登记源，重新生成候选表后需重新附加节点映射。
