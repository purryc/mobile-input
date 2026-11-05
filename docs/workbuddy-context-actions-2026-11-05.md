# WorkBuddy 动态选区菜单与 USB 恢复 · 2026-11-05

## 实现与边界

手机复用 Codex 的 AgentEditReviews、Agent 编辑器及 InputDock。适配器读取 WorkBuddy 当前原生辅助功能结构，提供当前动作的身份、文字、启用状态和所属任务；不固定假设每次编辑后都是接受／拒绝。

实际观察 WorkBuddy 5.9.3 的 PPT 画布：AI编辑 →「说说你想怎么修改」输入框 → 确认修改想法 →「1个修改想法」取消／发送。确认想法与正式发送分开。只在真实原生结构提供差异时显示 before/after；pending 菜单没有伪造差异和接受／拒绝。

原生适配排除 CopyPasteAssist 和隐藏画布输入代理，防止把语音写入非任务目标。当前任务以实际选中行的 AX 元数据确认，解决任务名称含时间后缀导致当前项无法匹配。修改要求拥有独立编辑身份，任务正文/材料保持独立。待发送想法阶段暂时阻止普通 prompt 覆盖，以保留 WorkBuddy 原生选区引用，当前取消／发送仍可用。

动作在执行前核对连接、窗口、任务、编辑目标、菜单内容与当前按钮。菜单变化、消失、旧回执或重复连接不重放操作。原生操作回读仅证明菜单状态发生变化，不代表模型生成或文档保存成功。

当前画布 AX 未提供语义级对象 ID 和文本选区范围；选区入口以真实工具栏节点、当前幻灯片身份和菜单位置核验。不能宣称获得完整选区版本。原生接受／拒绝结果页尚未观察，不登记猜测选择器；共享组件的结果分支仅通过模拟测试。

## USB 故障

现场观察到 USB 设备和39872反向映射正常，Node服务存活，但原生辅助进程已不存在。重启现有 LaunchAgent 后手机恢复 USB 连接。辅助进程退出的最初原因尚未证实。

新增辅助进程生命周期守卫：异常退出/启动失败导致桥接进程退出，由既有 KeepAlive 重启整个服务并创建新命令会话；正常关闭抑制恢复。信任凭据、草稿和材料保留，未知命令不自动重发。诊断不记录正文或凭据。

## 验证

- TypeScript 与生产 Web 构建通过；已有大 chunk 警告保留。
- Swift 原生辅助进程编译通过。
- 35 项 Mac 协议/模拟/生命周期测试通过，包括真实子进程异常退出后的单次恢复请求。
- 5 项浏览器测试通过，覆盖390×700、390×844，Codex和WorkBuddy共享菜单、键盘/触控板、小屏按钮可达、切换任务后旧控件移除；Send/Cancel/Accept/Reject只对本地夹具操作。
- 真实只读证据：WorkBuddy AI编辑、修改要求、取消／发送菜单及选中任务。只打开过AI编辑，不写文字，不点击正式发送、取消、接受或拒绝。
- 待用户验收：手机输入修改要求、确认想法、点击实际取消或发送后的接续；真实生成的结果菜单和接受／拒绝；辅助进程故障后手机端自动恢复交互。

## 文档与修改范围

现行 PRD：https://app.notion.com/p/402194db24c38158a6e0e1d7b6ab1a47，已补「动态选区菜单接续」。未修改 Figma，未建立 Design 镜像。

- scripts/mac-bridge/agent.swift：WorkBuddy作用域读取、菜单动作与目标校验。
- scripts/mac-bridge/server.mjs、helper-lifecycle.mjs：服务异常恢复。
- apps/web/src/mac-link.ts、agent-edit-review.tsx/.css、phone-agent-editor.tsx：共享动态菜单、可选差异、小屏布局与重复发送入口处理。
- tests/workbuddy-context-actions.spec.ts、scripts/mac-bridge/generic-agent.test.mjs、helper-lifecycle.test.mjs：相应回归。
- AGENTS.md：最新动态菜单原则和维护边界。

私有 AX、截图与测试输出留在忽略目录 artifacts/workbuddy-review/；不提交真实任务，不修改真实文档，不清空数据，不自动 Git push。

## 维护安装

手机与 Mac 维护更新，保留演示代次1793741702534。平板未改协议或原生功能，不重装。最终安装和包哈希见下方记录。

- SUP-AL90 手机 `com.hmilab.mobileinput.phone` 1.4.0 覆盖安装和启动均成功。
- HAP SHA-256：`f831276369b904a7459a3d6d7f2c31fca9433349080de45bb7c87a03cd2d97bb`。构建时间戳 `1793909344703`，代次 `1793741702534` 未变。
- Mac 更新重启，HTTP39873返回200；新Node及原生辅助进程同时存活。
- 安装后手机截图确认“Mac已连接·USB”。Mac前台在Codex与WorkBuddy之间变化，未获得稳定的手机真实WorkBuddy菜单验收；没有因此继续点击真实业务动作。
- 此轮验证不包含真实发送/取消/接受/拒绝。所有现有草稿、材料、权限和信任配置均按维护路径保留，未执行重置或卸载。
