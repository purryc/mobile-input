# GitHub source sync · 2026-11-04

## 中文

用户明确要求将当前累计源码同步至 `purryc/mobile-input` 的 `main`。本次包含共享 Web、两端原生工程已有版本、Mac 桥接、测试、规则和实施记录；不是新一轮设备安装，也不发布二进制包。

主要更新见根目录 `CHANGELOG.md` 的 2026-11-04 中英文条目。功能覆盖和证据分别见：

- [统一 Agent 控制器](generic-agent-controller-2026-11-04.md)
- [微信共享输入](phone-controller-wechat-audit-2026-11-04.md)
- [真实附件接入](agent-attachments-2026-11-04.md)
- [Codex 会话切换](codex-task-sync-2026-11-04.md)、[Recents 与状态](codex-recents-status-2026-11-04.md)、[执行中输入](codex-live-composer-2026-11-04.md)
- [光标、听写与主题](caret-dictation-theme-2026-11-04.md)
- [选区操作与触控板](selection-input-recovery-2026-11-04.md)
- [Edit 后续流程与最新安装记录](edit-review-continuation-2026-11-04.md)

发布前重新执行类型检查、231 项核心测试和 32 项 Mac 协议/原生策略测试，全部通过。最近一轮 Edit 相关浏览器回归 9 项通过，Swift、生产 Web 和手机签名构建通过；本次仅修改发布文档，沿用该构建证据。现有 Vite 大包及 ArkTS 警告未消除。

真实 Codex Edit 已读取和验证；实际 Accept/Reject、后续手机文档听写、真实任务/模型执行仍留给用户验收。WorkBuddy 同类结果菜单尚无已验证的原生适配器。不能将浏览器/协议模拟视作这些能力的真机通过。

密钥、签名、私人 AX 数据和截图、录屏、设备记录、构建 HAP/ZIP 均不纳入。源码提交前检查暂存内容、敏感值模式、排除路径及空白错误；推送后核对本地 HEAD、origin/main 和 GitHub main。

## English

This is an explicitly authorized source backup to `purryc/mobile-input/main`, including accumulated shared UI, Mac adapters, tests and implementation records. Existing phone/tablet native sources remain included; this publication does not reinstall devices or release HAP binaries.

Fresh checks passed: TypeScript, 231 core tests and 32 Mac protocol/native-policy tests. The latest implementation checkpoint also passed nine focused browser tests, Swift compilation, production Web and signed phone builds. Documentation-only publication updates reuse that build evidence; existing bundle-size/ArkTS warnings remain.

Physical Codex Edit was inspected and exercised. Actual Accept/Reject, subsequent phone document dictation and real model/task submission remain user acceptance items. The corresponding WorkBuddy native review adapter is not yet verified. See the linked implementation records for scoped evidence, installation hashes and limitations.

Credentials, signing inputs, private evidence, recordings, device records and runtime archives are excluded. Publication verifies staged contents and remote commit agreement; no real Agent task is submitted.
