# WorkBuddy 5.9.3 对话与直接编辑修正 · 实施记录

日期：2026-11-03。行为规则仍由现有 [Notion 设计规范 APP-WB-01](https://app.notion.com/p/3f9194db24c38165996cf89b22e7d69e) 维护。本文件是实施与验证记录，不是第二份 Design 文档。

## 基准与交付

本轮前置观察为 Mac WorkBuddy 5.9.3：左侧任务消息独立滚动、输入框固定底部；右侧标签打开 Markdown 与 PPT。Markdown 选字出现格式工具条，PPT 选择对象出现选框；两者点击 AI 编辑后才出现局部修改输入框。观察只选择、打开入口，没有修改或提交真实文件。

已先更新项目 AGENTS.md 和 Notion APP-WB-01，再实施以下代码：

- Gemini 任务复用普通任务的消息、成果卡片和底部输入布局，去掉独立任务页面。执行状态来自真实执行器，完成记录使用实际耗时和返回模型。
- 成果编辑区保留标签、保存、撤销／重做，移除生成文稿及旧演示幻灯片下方的标题、正文、讲稿／样式整页表单。生成文稿改为缩略图、画布、备注、播放／缩放；页面设置按需展开，图片可选中、替换、删除和按对象调整显示方式。
- Markdown 正文和表格单元格直接编辑。选择坐标映射到原 Markdown 源文位置，格式及 AI 修改按范围处理，不用第一次字符串匹配。支持已确认的粗体、斜体、下划线、删除线、链接、行内代码浮动入口。
- 新旧幻灯片直接编辑对象；文字选区支持已有格式、手机指向与格式控件。局部 AI 输入仅在明确选择 AI 编辑后展开；取消和失败保留要求，成功后清空已执行要求，文件仍沿用保存策略。
- 手动编辑和格式操作直接修改本地工作副本；显式 AI 提交交给平板 Gemini。手机不执行模型请求，原生路径不调用 Mac HTTP 服务。
- 本地直接编辑不因未连接手机反复弹连接提示；已配对时仍按原规则激活手机目标。手机句内辅助控件、目标 HEX／文本转换和真实附件传输保留。

## 接口和兼容

- `packages/core/workbuddy-edit-contract.ts` 定义 `FileEditTarget`（view/file/path/start/end/base/version/source）、`FileEditRequest` 和只含替换文字的 `FileEditPatch`。
- `reviseFileSelection` 与 `/api/decks/revise-selection` 在原生／浏览器执行路径共用同一模型约束。模型只返回选区替换文本，不返回整页或任意执行命令。
- `wb-object-direct` 处理原地编辑；`wb-object-mark` 处理 Markdown 标记；对象显式提交创建请求，只有执行端可完成／失败。请求同时绑定选区、文件版本、输入要求版本与目标代次。修改期间手动编辑、切页／文件／目标、取消、后台释放或重载均不重放旧请求。
- 生成文稿沿用 schemaVersion 1，新增的对象路径使用稳定页面 ID，格式存入已有 FileBody.textRuns／paragraphAlign；旧文件不必重建。每张图片可有独立 photoFits，旧页面继续使用原 imageFit 回退。
- 旧的整页 revise 接口保留兼容，本轮界面只使用局部修改接口。网页幻灯片继续保存为 HTML 演示，不新增 PPTX 导入／导出承诺。

## 已验证

| 层级 | 结果 | 覆盖 |
| --- | --- | --- |
| 核心 | `npm test` 186 项通过 | 选区替换、邻接内容保持、重复文字与表格位置、格式撤销／重做、晚到结果、伪造完成拒绝、后台／切 App／重载不重放 |
| 浏览器 | 20 个相关用例通过；19 项回归后新增 1 项 IME 用例，最终复跑 6 项相关交互全部通过 | 生成、直接编辑、局部 AI、固定底部输入、文件切换、中文组合输入及 emoji、手机格式／指向、保存重开、播放、材料传输与离线播放 |
| 原生模拟 | 包含在浏览器结果内 | 手机材料送达、平板原生 Gemini 调用、局部改写、后台取消、分块传输；断言手机模型调用为 0、Mac API 请求为 0 |
| Web | TypeScript 与 Vite 构建通过 | 大 bundle 提示仍在，未扩展为打包优化任务 |
| ArkTS / HAP | 手机、平板均 BUILD SUCCESSFUL | 在独立缓存 mobile-input-workbuddy-edit-check-* 编译；签名 HAP 内 Web JS 哈希与本次 dist 相同 |

相关浏览器文件：`tests/web-deck.spec.ts`、`tests/web-deck-native.spec.ts`、`tests/workbuddy-direct-edit.spec.ts`、`tests/workbuddy-files.spec.ts`，以及 `tests/design-sync.spec.ts` 中手机选区格式和触控板拖选两项。

一次扩大回归中，旧 WeChat 用例仍等待“开始使用”确认而超时；当前规则已要求适配字段直接进入。它不属于本次 WorkBuddy 变更，未修改 WeChat 实现，也未把该用例计入通过数。

视觉证据（均为虚构资料／浏览器截图）：

- `artifacts/web-deck/replica-task-composer.png`
- `artifacts/web-deck/replica-ppt-selected.png`
- `artifacts/web-deck/replica-markdown-selected.png`
- `artifacts/web-deck/replica-markdown-ai.png`

编译输出独立存放：

- `artifacts/workbuddy-edit/hap/tablet/entry-default-signed.hap`
- `artifacts/workbuddy-edit/hap/phone/entry-default-signed.hap`

## 源码阶段的证据边界（后续真机结果见下文）

源码与构建阶段没有安装或操作手机／平板，没有向真实 WorkBuddy 提交任务，没有调用真实 Gemini，没有修改 Figma 或发布／推送。浏览器模型返回使用 fixture，原生调用使用 mock；不能据此宣称真实 Gemini 输出质量、真机输入法或双设备物理闭环已通过。

复刻范围为上述已观察入口及已实现控件；未增加完整 Office 动画、打印、旋转／自由变形、云分享或 AI 图片生成能力。人工本地编辑无网络依赖，生成及 AI 修改仍需 Gemini 网络与平板既有凭据。


## 真机与拔线验收 · 2026-11-03（用户追加授权）

结论：本轮虚构材料下，生成、直接编辑、局部 Gemini 修改、保存与播放的主流程通过。拔线阶段由用户在设备上操作并确认；接回后通过 UI 树和截图核对成果。此结论不扩展为全部格式、异常路径或冷启动持久化均已通过。

### 安装版本与中途变更

- 本聊天升级安装 `artifacts/workbuddy-edit/hap/tablet/entry-default-signed.hap`，SHA-256 `6076fbf853f218fb6f346751b2ed3ed6ccdf99bbebec4711be16b727037d58c2`。HDC 返回安装成功；启动成功。设备为 MRDI-W10，包名保持 `com.hmilab.mobileinput.tablet`。没有卸载或读取密钥。
- 13:54 另一个聊天安装共享布局收尾包，触发项目规定的演示代次重置，打断第一轮验收。第一轮生成和直接编辑证据保留，未将其当成最终包的完整验收。
- 最终验收沿用该收尾包 `artifacts/hap/tablet/entry-default-signed.hap`，SHA-256 `d41a7a6d35ede04fed5c1e36fe6cf5f56dd8563b3e826271949bf717b0217035`，设备更新时刻为 2026-11-03 13:54:10 America/Toronto。包内含本次直接编辑及局部 AI 修改实现。本聊天未再次覆盖它。

### 实测结果

| 环节 | 实际结果与证据 |
| --- | --- |
| 独立生成 | 虚构“星帆便携工作灯”资料直接填入正文，要求三页、白底与绿色主题、三分钟、虚构规格。用户拔掉 USB 后才发送，等生成完成再接回，明确回复“已生成并接回”。读回确认三页新成果及 `gemini-3.8-flash`；界面记录 13 秒。未将文件名当成附件，本次材料为正文，未复测附件选择与传输。 |
| 直接编辑 | 平板画布标题从“星帆便携工作灯：随时随地的专注之光”改为“星帆工作灯·直接编辑验收”。前后 UI 树比较确认本页正文和备注均未变化。 |
| 局部 AI | 在标题对象上选择文字，打开浮动 AI 编辑，输入改为“星帆工作灯：随行照明”的要求。用户拔线后提交并确认成功；接回读到该标题，封面正文保持原文，其他两页标题保持原文。调用路径为平板原生 DeckService，未用电脑生成服务。 |
| 备注与保存 | 首次要求的“拔线编辑通过”未出现在接回读数中，用户先反馈未保留，随后最新回复“都通过”。保留这段证据差异，不以最后口头确认抹掉首次读回。补做连线下独立备注输入，第三页读到“【真机备注编辑验收】”；点击保存显示“已保存”，切页再返回仍保留标记。备注的补验属于连线真机证据，未另验冷启动。 |
| 播放 | 用户确认拔线后进入播放、翻到第二页并退出成功，随后再次确认“都通过”。接回确认已回编辑器，三页成果与 AI 标题仍存在。未将该确认写成自动化逐帧采集。 |

### 运行边界与观察项

- 平板使用已配置的原生 Gemini 凭据，生成与局部 AI 仍需要网络可达 Gemini。“脱离电脑”不等于“模型离线运行”。本次未测试关闭 Wi-Fi 后的全部编辑路径。
- 没有提交真实 WorkBuddy 任务，没有操作真实文档，没有修改手机安装包、Figma 或发布到外部服务。
- 真机切换幻灯片时观察到“不支持的操作”提示，页面实际已切换；源码对应缩略图调用 `unfocus`，共享命令未支持该命令。另有未连手机时本地输入触发“手机尚未连接”的提示。这两项是遗留反馈问题，不能据主流程成功宣称界面无问题；本轮没有为修提示再次安装并清除验收成果。
- 格式全矩阵、Markdown 真机局部 AI、照片替换、异常网络、冷启动恢复和断连竞态仍沿用已有本地测试证据，未在本轮逐项真机重测。

### 可复现证据

安装及材料：`artifacts/workbuddy-edit/device/installation.json`、`fictional-brief.txt`、`verification.json`。

截图和 UI 树位于 `artifacts/mac-bridge/device/`：`wb-edit-generated`（首轮）、`wb-unplug-generated`（最终包拔线生成）、`wb-final-page-one`、`wb-final-direct`、`wb-final-ai-ready`、`wb-unplug-final`、`wb-final-saved`、`wb-final-note-retained`。过程文本保存在 `artifacts/workbuddy-edit/device/`。日志与截图保持本地私有。
