# Confirmed attachment synchronization / 已确认附件同步

日期：2026-11-05。实现记录，非第二份设计规范；现行规则以 AGENTS.md 与 Notion PRD 为准。

## 用户交互规则

- 图片在图片 Widget 中明确确认、草图点击采用、参考文件完成选择后，进入手机 Composer，并立即向原目标的未发送草稿同步真实文件。
- 未确认图片和未采用笔迹留在手机；关闭面板、重连、切任务均不会确认它们。
- 删除手机已确认附件，同步移除目标草稿中同一个附件。只移除引用，不删除源文件、其他附件或已发送记录。
- 同步附件与提交任务分开。只有用户点击发送才提交；同步、删除、重连和重试均不提交。
- UI、材料归属与同步流程共用。真实鸿蒙跨应用适配尚未实现，不借用演示端能力宣称已接通。

## 代码变更

| 层 | 文件 | 行为 |
|---|---|---|
| 共享同步 | `apps/web/src/use-attachment-sync.ts` | 串行执行、按 owner/signature 合并、失败显式重试；没有提交接口 |
| Mac Agent | `apps/web/src/phone-agent-editor.tsx` | 确认后上传并采用；删除使用待同步记录；记录字节上传与目标采用的区别；上传期间删除不会迟到采用 |
| 演示 WorkBuddy | `apps/web/src/web-deck-composer.tsx` | 确认后分块传输、采用、移除；待确认照片排除；采用回执后释放本地重复暂存 |
| 平板验证 | `apps/web/src/runtime.ts` | 原生端在采用命令前校验文件真实字节及 SHA-256 |
| 业务状态 | `packages/core/workbuddy-deck.ts` | 同 ID 采用幂等；12 件 / 24 MB 限制；删除与生成分开 |
| Mac 协议 | `scripts/mac-bridge/protocol.mjs`, `server.mjs` | 单个 owner 绑定的不透明文件 ID 执行 `agent-detach`；路径仅内部解析 |
| 原生适配 | `scripts/mac-bridge/agent.swift` | 精确移除控件或 WorkBuddy 文件卡的原生文本标记；重读正文、其他附件和目标后才能确认成功 |
| 标签 | `apps/web/src/ui-labels.json` | 同步附件状态的英文标签 |

WorkBuddy 的附件卡没有单独暴露 AX 关闭按钮。当前实现读取卡片精确文本标记，设置选区后等待实际选中内容匹配，才执行 Delete。选择更新异步，不能只依据 setter 成功。正文同步同样核对实际选区，避免误删已采用附件。

## 验证与证据

执行命令：

```sh
npm run check
npm test
npm run test:mac
npx playwright test tests/agent-attachments.spec.ts tests/web-deck-native.spec.ts tests/workbuddy-context-actions.spec.ts tests/agent-edit-review.spec.ts tests/mac-selection-trackpad.spec.ts
npm run build
```

- 核心测试：232 通过。
- Mac 协议／原生策略测试：36 通过。
- 浏览器回归：16 项通过（390×700 / 390×844、三种 Mac Agent 夹具、平板原生模拟与选区回归）。
- Swift 原生 helper 编译通过。
- Web 生产构建通过；既有大 bundle 警告仍在。
- 测试覆盖：确认前照片不上传、文件／确认照片／已采用草图的实际字节与 hash、采用后删除、删除失败保留并重试、传输中删除、原任务归属、断线/超时不提交、显式发送失败保留、上下文菜单回归。
- 浏览器中的 Mac 和原生平板能力均为受控模拟，发送也仅发送到夹具，不是用户的真实 Agent。

私有日志位于忽略目录 `artifacts/workbuddy-review/`：`attachment-typecheck.log`、`attachment-core.log`、`attachment-mac-tests.log`、`attachment-final-browser.log`、`attachment-build.log`。AX 结构与草稿内容不进入 Git。

## 真实应用证据及限制

1. 在用户指定的新建 WorkBuddy 草稿，虚构 `InputAgent-fictional-sync.txt` 曾成功显示；第一次采用回读通过，正文不变。
2. 发现文件卡选区更新需要等待，补上有限等待和精确选中校验。独立标记探针已能选中并移除该测试卡。
3. 完整原生适配器重测时前台仍从 WorkBuddy 切至 Codex，返回拒绝/未知；未自动重复执行，也未提交任务。因此 **适配器加入→移除→正文保持的完整真实闭环尚未通过**。最终只读检查 WorkBuddy 未见此测试文件卡；源测试文件仍保留。
4. Codex / ChatGPT 的具名移除控件、Gemini 的具名文件移除已接入代码；本轮未完成对应真实上传删除验收。Gemini 图片只暴露 blob 图片身份，未获得可靠移除控件，图片删除保持明确不可用，不猜坐标。
5. Mac bridge 重启/更换连接会话后，旧材料远端身份若无法核实，会保留材料并要求核对，不重复上传。不能宣称任意跨会话重连已验证。
6. 未重新安装手机或平板，未更新当前运行中的生产 Mac companion。Web/Swift 构建成功与已安装版本是不同证据。
7. 没有真实任务 Send、模型调用、源文件删除、现有用户数据重置或 Git push。其他聊天的设计系统网站改动保持原样。

## English handoff

Confirmed composer attachments now reconcile before Send using the shared serial lifecycle. Pending photo previews remain local. Deletion affects only the owned attachment reference in the destination's unsent draft. Actual bytes and receipts are required; reconnect never submits a task. Tablet/demo and real Mac have separate execution adapters with a common interaction contract.

Local tests and builds are distinct from live acceptance. WorkBuddy's exact file-card marker was observed, but the complete native adapter cycle remains unverified due to foreground changes. Gemini image removal and real Harmony cross-app control are not claimed available. No phone/tablet upgrade or production companion restart was performed for this revision.
