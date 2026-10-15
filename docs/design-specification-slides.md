# Mobile Input Agent design specification

- [Figma Slides · 20页](https://www.figma.com/slides/ylIR7XjcoubXhUiTmEuNI6/Mobile-Input-Agent)
- [当前PRD](https://app.notion.com/p/3f9194db24c381bf8b76c804062303e3)
- [Design Skill](https://app.notion.com/p/3f9194db24c38165996cf89b22e7d69e)
- [Mobile Input Survey](https://purryc.github.io/mobile-input-agent-research/)
- [可编辑控件库](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=2-2)
- Updated: 2026-10-15
- Audience: 产品、设计、技术评审。交付设计文档与组件，不修改运行代码。

## Narrative and visual contract

先说明背景、用户与能做什么，再说明怎么做。主线为：产品背景→用户需求→客户与付费动机→四大场景→产品和技术架构→页面结构与控件库→具体Examples→验收。
保留1920×1080，Noto Sans SC／Inter、浅色阅读面与蓝／青／淡紫强调。封面与结尾深蓝。文字、图表、架构及布局为原生可编辑节点；既有控制器与研究图像保留源链接。
ImageGen客户情境图统一采用折叠PC展开大屏立在桌上、未连接物理键盘／鼠标／手写笔的情境；手机承接文字、语音、指向与场景控制，替代物理输入设备。该图是示意，不能冒充访谈、设备兼容验证或付费证据。研究产品能力、公开使用个案、本产品收益与付费假设分别表达。所有人物与材料示例为生成或虚构，不含私人邮件。

## Slide index

| 页 | 内容 | Figma node |
| --- | --- | --- |
| 01 | 产品定位 | `1:42` |
| 02 | 当前产品背景 | `4:13` |
| 03 | 当前用户需求背景 | `17:36` |
| 04 | 客户情境与付费动机 | `17:71` |
| 05 | 四大场景总览 | `4:42` |
| 06 | 整体产品与技术架构 | `17:94` |
| 07 | High-level UI与固定／动态区域 | `4:76` |
| 08 | 控件集合：原子控件、输入组合、场景组合 | `19:4` |
| 09 | 文本：场景润色 | `5:5` |
| 10 | 意图辅助输入：参数、手绘与材料 | `5:27` |
| 11 | Agent：从当前屏幕获取任务 | `18:112` |
| 12 | Agent：请求与执行管理 | `5:43` |
| 13 | Agent：补材料并继续原任务 | `18:137` |
| 14 | 绘画与视频剪辑双屏概览 | `19:76` |
| 15 | 绘画Example | `6:2` |
| 16 | 演示Example | `5:65` |
| 17 | 媒体遥控Example | `6:24` |
| 18 | 游戏手柄Example | `6:46` |
| 19 | 四场景变化规则 | `19:115` |
| 20 | 设计验收与待验证假设 | `6:68` |

## Rules synchronized with PRD

### Latest library revision: semantic list

2026-10-15 v12：按用户要求将第8页 `19:4` 原位改为纯文字列表，替换v11六类图片卡片。按现行PRD及Design Skill §2.3的「原子控件 → 输入组合 → 场景组合」组织；原子层列动作、选择、参数、输入与状态，组合层列文本、基础输入、意图材料、目标任务、专业及专用控制，场景层列四类应用任务。参数输入保持通用语义，专业控制明确包含音乐、旋转与时间导航等已有组件，不以绘画参数代替。所有正文和布局为可编辑节点，层级标题保留源库链接。已截图检查排版；脚本为 `artifacts/design-specification-2026-10-15/v12-library-list.js`。本段替代下方v11对第8页的描述，其余页面不变。

### Current revision: individual controls and paired screens

2026-10-15 v11：第8页从整板缩略图改为8个独立控件、6个分类卡片：语音、编辑工具栏、意图入口、草图附件、色轮、任务卡片、文件入口、时间导航轮。去掉重复颜色与状态，键盘／触控板、其他专业控制、材料状态在右侧文字索引中说明。分类标题链接源组件，完整库入口保留。

第14页为绘画和视频剪辑两个双屏概览，每个例子左侧主屏、右侧手机。第15–18页分别放大绘画、演示、媒体、游戏的同一分工；游戏手机保持横向。来源如下：

- 绘画主屏：`artifacts/paint/tablet-layers.png`；手机：Figma `1443:16044`。均为既有设计／本地演示。
- 视频剪辑：新增可编辑源画板 [1709:46135](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1709-46135)，主屏 `1711:13438`，手机 `1711:13480`。复用专业导航轮、Action key、默认输入 dock；时间线片段为新本地组件。预览内容使用已审核 Big Buck Bunny 素材，主屏和手机选中视频02、时间12:08。仅补绘高层设计，没有修改代码或接入第三方剪辑应用。
- 演示主屏：`artifacts/device-wps-hover/tablet-hover.png`；手机在既有 `5:10065` 基础上复制为 [1718:13601](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1718-13601)，保留原布局，标题、页码及讲稿改为同一现有销售案例。讲稿直接取 `packages/core/sales-speaker-notes.ts` 首篇，未编造案例内容；原组件和原画面保留。
- 媒体：`artifacts/adaptive-input/bilibili-danmaku-paused.png` 与 `bilibili-phone.png`，均为现有“甄嬛传 · 华妃经典片段”本地演示画面，链接现有控制器设计。
- 游戏：`artifacts/device-wechat-presentation/tablet-mario-v3.png` 与 Figma `5:10639`。

已逐页视觉检查第8、14–18页，并核对1920×1080、图片填充及越界情况。剪辑源由224个可编辑层构成，包含36个组件实例及1个时间线片段组件；其图片层仅为素材预览、素材缩略图和应用图标，文字字体为Noto Sans SC。幻灯片使用这些源的渲染图，标题、说明、布局与源链接可编辑。记录见 `artifacts/design-specification-2026-10-15/v11-library-and-dual-screen-ledger.json`。以下v10段落为上一轮记录，第8、14–18页以本段为准。 最终读取时文件共有19个Slide，原四场景对照节点 `19:115` 已不在文档中；本轮未删除该页，保留当前文档状态，未恢复或重排其他页面。

### UI source revision: library and concrete examples

2026-10-15：第7页改为同一 WorkBuddy 输入状态的收起／键盘展开对照。收起直接引用 `1646:11696`；展开状态在源 Figma 补绘为 `1698:12986`，由原画面和现有键盘组件 `1493:55590` 组合，中部随底栏高度收缩，发送保留可见。其余既有控制器未修改。

- 第8页直接置入原子控件、键盘／触控板、绘画参数、专业控制、任务／采集、材料输入六组源库画面，分组标题链接可编辑源。
- 第9页并排展示已有微信 `5:5935`、邮件 `5:8037`、WorkBuddy 润色完成 `1598:44275`；说明采用对应界面的实际动作文案。
- 第10页使用已有 WorkBuddy 颜色识别 `1372:25427`、调色 `1372:25571`、手绘 `15:5743`、框内采用 `1286:6473`。不以抽象工具图代替使用例子。
- 第11页使用现有微信推荐 `5:2`、日程 `5:6326`、导航 `7:4762`。第13页使用已有请求 `5:8710`、截图预览 `1646:12672`、补充待发送 `1646:12329`；明确三者为不同已有状态，不虚构为同一任务的连续材料上传回执。
- 第12、14–18页保留原有实际 UI 示例并刷新来源图；第19页改为微信、Agent、绘画、媒体的四列 UI 对照。第20页仍为验收规则。
- Persona 语音图使用内置 ImageGen 定点修复：去除桌上重复的手和前臂，保留靠嘴持手机的单一可见手臂，保存 `v9-persona-text.png` 并替换原图片节点。

本轮新增／更新图片、节点、源链接和提示词登记于 `artifacts/design-specification-2026-10-15/v10-ui-source-ledger.json`；编辑脚本为 `v10-slides-ui.js`。已检查第7–11、13、19页的图像填充、文字边界与整页导出。幻灯片说明和布局保持可编辑；UI 图像对应链接中的可编辑源。未修改运行代码，也不将设计图视为真实接口接入证明。

### Slide 05 revision: large-screen application coverage

2026-10-15后续修订：按用户要求移除四个大屏内的多窗口示意拼图，每类改为一张真实应用界面，旁边保留应用图标及手机设计稿。文本采用Survey的`assets/content-oct6/workbuddy-official-7.jpg`；Agent采用同目录`workbuddy-official-6.jpg`，两图均来自WorkBuddy官方Cowriting文档（源索引`data/content-media-oct6.json`）。专业采用[华为GoPaint界面介绍](https://consumer.huawei.com/cn/support/content/zh-cn16041995/)的公开编辑页图片，保存为`v5-gopaint-official.png`；娱乐采用本轮Bilibili官网首页实截`v5-bilibili-live.jpg`。Bilibili播放详情页访问返回412，未用错误页面或本地仿制界面冒充真实截图。最终页为`v5-slide-05.png`，旧版v4留作修改记录。页内标注实际应用名称及来源类型；截图不证明手机跨应用接入，手机仍为Input Agent设计稿。GoPaint手机同步改用对应绘画控制器。以下v4描述保留为历史记录，以本段为当前视觉版本。

第5页原位更新为四个「折叠PC大屏＋手机控制器」双端场景，保留20页顺序。大屏展开立放，无物理键盘；应用窗口、场景标签和说明为可编辑节点。

- 文本：Word／WPS、微信、邮件、Outlook、备忘录、飞书，展示文档、聊天、邮件三类编辑工作区。
- Agent：WorkBuddy任务、小艺屏幕伴随、豆包对话与任务；日历、高德地图与飞书作为服务／协作场景。任务卡片与服务入口是设计示意，不是实际集成截图或执行证明。
- 专业：GoPaint、WPS演示、花瓣剪辑、图库，覆盖绘画调参、演示翻页、剪辑与修图。
- 娱乐：Bilibili、华为视频、QQ音乐、华为音乐、游戏中心、Mario，覆盖视频、音乐、游戏与弹幕。
- 图标复用已审核的`apps/web/public/assets/apps/`资产；WPS使用`wps.svg`官方符号，WorkBuddy使用`native-wechat/workbuddy.png`，Bilibili使用品牌字标，Mario使用本地游戏favicon。绘画画面来自本地虚构原型`artifacts/paint/tablet-layers.png`；游戏画面来自`artifacts/device-wechat-presentation/tablet-mario-v3.png`；视频画面来自已登记的Big Buck Bunny素材`assets/bilibili/bunny-30s.jpg`。没有使用私人邮件或原生用户作品截图。
- 页脚标注场景示意与拓展范围，不将这些应用全部列为已接入。已核对四类双端画面、图标及文字边界。修改记录与最终导出为`artifacts/design-specification-2026-10-15/v4-*`。

- 本地上下文、能力检查、规则与控件渲染；Jev类／其他模型为可替换决策来源，部署与性能待验证。直接输入和连续控制不逐次等待模型。
- 意图辅助输入包括颜色、手绘、File uploader、相机、窗口截屏与裁剪；稳定意图／明确补材料请求只推荐入口，由用户点击打开。
- 颜色合法调整即时生效；材料先预览、显式采用，再由明确发送／提交处理。采用不执行、不批准其他请求。
- 材料绑定App、任务、目标与输入版本。状态区分已选择、已采用、传输中、已传输、目标可读取和失败／不可用；真实适配器更新后两类结果。
- 取消保留正文；失败可重试／移除／改选。目标变化不把旧材料附到新目标。原生相机待采用会话和截图／录屏缓存仍遵循各自生命周期。
- File uploader为新增设计目标；内部文件浏览器不等于系统文件导入或云上传。具体平台能力与浏览器／设备验证记录分别保留。
- 颜色入口同步为色点＋调整颜色，精确HEX在参数面板；不把生成HEX注释追加到任务正文。对象修改仍为显式提交，大屏显示结果，手机不增加Apply页。

## Material component additions

[材料输入评审板](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1634-40528)，位于现有DS页面。
- `material-source` / `1634:40537`：File、Camera、Screen × Ready／Unavailable，共6状态。
- `material-preview` / `1634:40566`：File、Photo、Screen、Crop，共4状态。
- `material-attachment` / `1634:40616`：Selected、Adopted、Uploading、Transferred、Readable、Failed，共6状态。
复用现有应用主题、材质、几何变量和文字样式；评审板使用13个实例展示主要流程。关闭／采用至少48×48、位于面板壳层。组件状态不模拟真实上传或平台权限。

## Validation and evidence

- 原有12张幻灯片全部保留其身份，原位更新并新增8张；实际SLIDE_ROW中的20页顺序与页脚一致。工具的旧getSlideGrid列表可能仍按创建顺序返回，验收以持久化行子节点及页面位置为准。
- 20页均导出1920×1080并审阅总览。文字边界、文字相互重叠、空图片填充检查通过；源链接直接指向研究或可编辑Figma。
- 登记表79项全部解析到实际Figma节点；含4项历史Fold模板，在当前页范围中明确排除。新材料3组／16状态均注册，不改原运行能力状态。
- 主PRD新增商业探索、架构候选、五类意图输入与材料状态规则；Design Skill新增G25。两个页面均写入后重新读取核对。
- 本轮不运行设备或云接入验证，不把设计、静态截图或组件状态当作真实运行证据。
- 生成图、导出页、脚本、组件ledger、PRD修改记录与检查数据位于忽略目录 `artifacts/design-specification-2026-10-15/`，v2文件保留首版输出。未commit或push。

## Image provenance

### Slide 03 revision: four user categories with contextual photos

v8交互修订：第一列改为手机举到嘴边说话，第二列改为展开大屏水平平放在桌面作画（一手持笔、一手持手机），第三列改为手指直接点击手机上的任务按钮。第四列沿用v7。前三图为 `v8-persona-{text,creative,agent}.png`，提示词为 `v8-persona-prompts.md`；仍由内置 ImageGen 编辑，保留原有四列文字及图片节点。第二列平放姿态为用户最新要求，取代此前所有大屏立放的统一约束。

v7姿态修订：四张照片统一为人物正对大屏、视线落在大屏任务上的肩后视角。绘画者右手持一支数位笔在大屏作画，左手持手机调色／调工具；其余类别将手机保持在手边作为辅助输入或遥控设备。当前图片为 `v7-persona-{text,creative,agent,leisure}.png`，替换原四个图片节点且保留四列文字与版式。内置 ImageGen 编辑提示词保存在同目录 `v7-persona-prompts.md`；v6图片保留为历史版本。

2026-10-15：按用户澄清将第3页原有四类人群改为四列，每列上方增加一张 ImageGen 人物情境图，下方保留类别、工作目标、当前做法与核心需要。不添加姓名、年龄或个人故事。四类依次为邮件／消息／文档工作者，绘画／剪辑／音乐使用者，多项目／多线程协作者，演示者／大屏娱乐用户。四图均以手机承担输入、展开立放的折叠PC呈现任务为情境，无物理键盘。图片为虚构人群示意，不是受访者照片或实证资料；页脚明确标注。第4页保持原状。

生成图留存于 `artifacts/design-specification-2026-10-15/v6-persona-{text,creative,agent,leisure}.png`，对应 Figma 图片节点 `52:3`、`52:12`、`52:21`、`52:30`。可编辑布局脚本为 `v6-persona-columns.js`，导出页为 `v6-slide-03.png`。已回读四个图片填充并检查完整页面，文字与布局保持可编辑。

Survey根目录：`/Users/hmi/Documents/input agent/Survey/mobile-input-agent-unified-2026-10-06/`。素材作为研究机制参考，不外推本产品表现。

| 图像 | 来源 | 使用 |
| --- | --- | --- |
| Typeless | Survey `assets/legacy/typeless.png`；原Google Play素材登记于`data/media.json` | 第2页 |
| TourBox Elite | Survey `assets/expansion/tourbox.webp`；[官方产品](https://www.tourboxtech.com/en/tourbox-elite/) | 第2页，PNG转码 |
| Stream Deck | Survey `assets/expansion/stream-deck.jpg`；[研究来源索引](https://purryc.github.io/mobile-input-agent-research/#history-streamdeck) | 第2页 |
| Codex Micro | Survey `assets/expansion/codex-micro.webp`；[官方产品](https://worklouder.cc/codex-micro) | 第2页，PNG转码 |
| 客户情境三联图 | ImageGen编辑，`customer-contexts-fold-pc-v3.png`；三种情境均为折叠PC展开立放、手机代替物理输入设备；虚构人物，非受访者。旧版v2保留 | 第4页 |
| 微信润色 | Figma `5:5935` | 第5、9页 |
| WorkBuddy | Figma `1286:6473`、`5:8710`、`5:8847` | 封面、第5、7、12页 |
| 专业控件 | Figma `1568:38677` | 第14页 |
| 绘画 | Figma `1443:16044`、`1472:16901` | 封面、第15页 |
| 演示 | Figma `5:9875`、`5:10065` | 第5、16页 |
| 媒体 | Figma `1358:12215`、`1475:46165` | 封面、第5、17页 |
| 横屏手柄 | Figma `5:10639` | 第18页 |

架构、材料流程和场景示意使用原生Figma节点绘制；不是外部应用截图或实际执行回执。
