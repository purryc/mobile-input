# 情境润色开发迁移记录

日期：2026-11-03。本文件记录实现和验收，不作为 Notion Design 的本地镜像。本轮仅修改源码与 Web 构建，没有将润色改动安装到手机或平板，没有修改 Figma，也没有新增运行时 API。

## 设计来源与已实现范围

已读取当前 [润色控件](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1591-39306)、[Action Chip](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=271-3871)、[交互原型](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=2276-39359)及 [Notion Design](https://app.notion.com/p/3f9194db24c38165996cf89b22e7d69e) G20 / APP-WX-02。

按用户后续“根据最新的设计更新做”，采用当前稿的左侧固定智慧铅笔＋AI润色标题、右侧文字动作组，覆盖最初粘贴方案“不增加标题”的旧表述。标题和动作文字为 14/22 px。来源登记在 `reference/contextual-polish-figma.json`，不向 Figma 写入。

- `ContextualPolishActions` 只负责显示动作、绑定标识、处理中、禁用、失败重试；请求、目标验证和回填继续由 `usePhoneEditing` 与既有 `requestPolish` 负责。
- Composer 下方独立动作组，间隔 8 px，最多三项；无大卡片、无展开入口。固定标题 72 px，动作区独立横滚，动作最小 80×48 px，长标签扩宽。
- 复用 `ApplicationActionChip` 的玻璃与状态样式，使用共享 InputDock 的现有主题 token。微信服务仍在推荐下一步，保留原 Logo、上下文和 Hover 行为；润色使用编辑标识。
- 移除旧 Composer 内润色行及失效样式。InputDock 内部尺寸、左右键、语音位置不因本次迁移改变。
- 400 ms 稳定文本/选区窗口；录音期间不刷新推荐布局。无可编辑内容、纯命令、数字字段和绘画非文本目标不显示动作，也不保留空行。
- 内容与字段角色共同筛选动作，短内容不凑三项；明确要求保留语气时不推荐改变语气的处理。
- 显式点击才调用原手机 Gemini 润色链路。加载仅标记当前动作，其余动作禁用；失败保留原文并重试；成功回填并可撤销。
- 请求校验编辑身份、版本、原文、选区和连接状态。目标/选区变化或继续输入取消旧请求，迟到结果不覆盖；识别出的句内参数源词若被模型删除则拒绝结果、保留原文。附件/草图的归属与字节不由润色改写。没有发送、提交任务或自动保存副作用。

## 迁移覆盖

| 场景 | 实现 |
| --- | --- |
| 微信 | Composer 外动作组；推荐下一步仍在原区，采用回复和显式发送不变 |
| 邮件、文档、笔记、豆包 | 共用 PhoneGeneric，只有有效文本目标显示 |
| WorkBuddy 普通/自适应/对象指令/网页演示 | 同一共享动作组；参数与附件保持在 Composer，发送仍明确操作 |
| 真实 Mac WorkBuddy、Codex 和已适配文本 | 共用组件与原润色通路；没有新增真实 Mac 能力或提交 |
| Bilibili | 有效弹幕编辑目标显示，润色不发弹幕 |
| 天生会画 | 仅图层名或文本目标显示；绘画命令态不显示 |

## 验证与边界

- TypeScript 检查、核心测试 177/177 与生产 Web 构建通过。生产包仍有既有大 chunk 提示，未为这次视觉迁移做无关拆包。
- 8 项相关浏览器测试通过：润色加载/回填/撤销/失败重试、编辑/选区/目标变化拒绝迟到结果、参数保护；演示重置与首份权威快照；原生桩材料字节传输、原任务采用、坏块拒绝及显式重试、生成/播放和后台取消。
- 另有 4 项最终浏览器回归通过（含再次运行润色用例，共 11 个不同用例）：八类共享场景的三种底栏模式、手动展开状态跨任务保留、触控板 tap/double tap 与取消不误触；覆盖 390×844、390×700、360×700。日志为 `polish-dock-browser-tests-final.log`。
- WorkBuddy 检查 390×844、390×700 下收起、键盘、触控板三态：动作至少 48 px，发送、润色和智慧语音均可达。六张截图位于 `artifacts/web-deck/polish-*.png`。
- 浏览器的润色结果来自原生 API 桩，用于验证调用/回填生命周期，**没有用预设文本替换产品真实请求链路，也不作为新一轮真实 Gemini 润色成功证明**。
- 本轮没有安装润色版本；手机实际安装包、真实网页演示生成和拔线测试另见 `web-deck-native-standalone-2026-11-03.md`。两类验收不能混用。
- 尚未逐个场景完成润色后的真机安全区、原生键盘/语音/剪贴板与真实 Gemini 回填验证；照片/文件/草图持有期间的真实模型润色保留尚未真机复验。

复现：`npm run check`、`npm test`、`npm run build`；浏览器 `tests/chatgpt-polish.spec.ts`、`tests/demo-reset.spec.ts`、`tests/web-deck-native.spec.ts`。本轮使用独立 5196 调试桥和关闭热更新的 5189 测试前端，避免并行开发热重载中断配对；配置/日志保存在忽略目录 `artifacts/shared-dock/test-run/` 与 `artifacts/web-deck/`。

## 同日后续：统一控制器与安装

用户后续明确授权两端更新安装，解除此前润色仅源码验证限制。共享任务条、主题、Composer/辅助控件及框外润色已随同一 Web 快照安装至两端；完整构建代次、包哈希、真机确认与未复测项见 [统一控制器验收](unified-phone-controller-2026-11-03.md)。本段不将早期模拟证据升级为新的真实模型调用记录。
