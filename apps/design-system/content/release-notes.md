# 2026-11-05.1 · Initial Design System release

## 中文

- 新增五栏目中英文设计系统网站、组件/场景/规则搜索与响应式布局。
- 保留原有 88 个稳定登记 ID，补入 ImageInput、DurationInput 和 ContextualPolishActions，共 91 项。71 张既有设计预览保留来源；非交互条目明确标注证据边界。
- 七个真实共享组件接入 A2UI v0.9.1，官方 React / Web Core 固定 0.15.0。支持消息编辑、运行、逐步、数据/事件/校验、复制、重置与版本化下载。
- 图片示例展示确认后同步、失败重试和匹配移除；润色复用真实动作选择与参数保护，示例结果明确为模拟，包含选区、过期保护、无变化和撤销。
- 展示层统一 AgentImageInput，保留历史 photo 协议/存储身份。共享 SVG 支持 GitHub Pages 子路径。
- Notion 为规则唯一维护源；发布快照记录来源修订时间和哈希。手动 Actions 发布，保留源提交以回退。

验证：19 项网站契约测试、10 项相关产品回归测试、网站及产品构建；浏览器检查 1280px 桌面与 390px 手机、中英文、七个 Catalog 组件、搜索、数据绑定、事件、重试、无动作与参数保护。发布源另做无根目录依赖的独立构建检查。Claude CLI 只读审阅后的有效问题已修复。

边界：网站示例没有真实模型调用、设备连接、产品存储写入或实际任务提交。网站的模拟结果不证明原生适配器或真实设备验收。首次网站发布尚无上一线上版本；以后可从主分支历史中的发布提交重新运行同一工作流回退。

## English

- Adds bilingual Guides, Components, Scenarios, A2UI and Resources, searchable by purpose and responsive on mobile.
- Preserves 88 existing stable IDs and adds ImageInput, DurationInput and ContextualPolishActions: 91 entries, 71 sourced design previews. Noninteractive entries distinguish registry evidence from verified capabilities.
- Connects seven shared presentation components to A2UI v0.9.1 with official React / Web Core 0.15.0. Includes message editing, run/step, data/events/validation, copy/reset and versioned downloads.
- Image fixtures demonstrate confirmation-time sync, retry and matching removal. Polish reuses production action selection and parameter protection with explicitly simulated outcomes, selection, stale-result guards, unchanged output and undo.
- Renames the display implementation to AgentImageInput while preserving legacy photo identities. Shared SVG paths support the Pages project subpath.
- Notion remains the sole rule-authoring source. Snapshots carry revision/hash evidence. Publication is manual, with source-based rollback.

Validation: 19 website contract tests, 10 affected product regressions, website/product builds; desktop/mobile browser checks of bilingual navigation, seven Catalog components, search, binding, events, retry, empty actions and parameter protection. An independent source build checks that root dependencies are not required. Confirmed findings from a read-only Claude CLI review were fixed.

Limits: the website makes no real model calls, devices, product storage or task submissions. Fixtures do not establish native adapter or real-device acceptance. This is the first website release; subsequent releases can roll back by dispatching a previous release commit from main history.

## Post-publication correction · 2026-11-05

线上选区验证发现受控 textarea 回填会覆盖提前恢复的光标。现改为在 React 提交后恢复，浏览器实测光标停留在替换片段末尾（24），而不是全文末尾（36）；参数与撤销保持不变。规则版本不变，源码版本由 release.json 分别记录。上一发布提交 `0d9bdf0ee572489824b1db51c446a04462cf2945` 可供回退。

Live selection verification found that the controlled textarea commit overwrote early caret restoration. The preview now restores it after React commits. Browser readback verified offset 24 at the replacement boundary, instead of 36 at the full-text end. Parameters and undo remain intact. Rule version is unchanged; release.json records the separate source version. Previous release commit: `0d9bdf0ee572489824b1db51c446a04462cf2945`.
