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
| 08 | Design System全库地图 | `19:4` |
| 09 | 文本：场景润色 | `5:5` |
| 10 | 意图辅助输入：参数、手绘与材料 | `5:27` |
| 11 | Agent：从当前屏幕获取任务 | `18:112` |
| 12 | Agent：请求与执行管理 | `5:43` |
| 13 | Agent：补材料并继续原任务 | `18:137` |
| 14 | 专业操作与控件选择 | `19:76` |
| 15 | 绘画Example | `6:2` |
| 16 | 演示Example | `5:65` |
| 17 | 媒体遥控Example | `6:24` |
| 18 | 游戏手柄Example | `6:46` |
| 19 | 四场景变化规则 | `19:115` |
| 20 | 设计验收与待验证假设 | `6:68` |

## Rules synchronized with PRD

### Slide 05 revision: large-screen application coverage

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
