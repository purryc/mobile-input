# Mac 原生相对指针与多显示器修复

日期：2026-11-05。

## 问题与修复

原有手机触控板累计 0–1 位置，原生 `pointerDisplay(window)` 只选取前台窗口面积占比最大的一个显示器。系统光标虽然由 CGEvent 控制，但被限定在该显示器内。

新版本使用现有 USB/LAN 连接发送相对位移，Mac 从 `CGEvent.location` 的真实光标位置继续移动。点击、双击、按下、释放均在当前系统光标位置发生。手机换手、实体鼠标移动后继续使用手机时不再依赖旧的手机绝对坐标。当前增益为每个触控 CSS 点对应 2 个桌面逻辑点；不宣称完整复制系统触控板加速度或多指手势。

- 通过 `pointer-relative` 能力协商；旧客户端继续兼容绝对位置，但映射到全部活动显示器联合范围。
- 每次读取实际显示器排列，支持负坐标、不同尺寸、上下排列；不把 Retina 像素数当桌面逻辑坐标。
- 指针限于实际显示区域，包含 Dock，不落入联合矩形内的无屏幕区域。跨屏仍遵循 macOS 显示器排列；没有相接的边缘不承诺强行穿越。
- 队列合并相对位移时累加未发送增量；保留按下/释放屏障，异常清理不重放。
- 保留配对、锁屏、前台目标及断线保护。指针移动不是任意应用文本写入授权，本文不宣称解除全部应用控制限制。
- 平板假应用仍使用原有绝对坐标协议；不需要重装平板。

## 极客外设研究对应关系

最新研究 `survey/geek-peripherals/geek-peripherals-competitive-prd.md` 第14章已记录原应用键盘模式的复合 HID 描述符，Report ID 3 声明 X/Y/Wheel 有符号相对位移。它支持采用相对鼠标语义；本实现使用自有 Mac companion + CGEvent，没有复制私有源码，也没有切换为蓝牙 HID/虚拟触控板驱动。早期 `docs/geek-peripherals-analysis.md` 的未取得接收端证据结论已不是最新研究状态。

## 修改位置

- `scripts/mac-bridge/agent.swift`：全局显示器几何、相对事件、能力声明、旧坐标兼容。
- `scripts/mac-bridge/protocol.mjs`：相对位移类型和范围校验。
- `packages/core/pointer-queue.ts`：相对增量合并，保持按钮顺序。
- `apps/web/src/input-dock.tsx`：共享触控板输出相对移动，不改变 UI。
- `apps/web/src/phone-agent-editor.tsx`、`phone-mac.tsx`：按原生能力启用。
- `pointer-queue.test.ts`、`pointer-displays.test.mjs`、`mac-selection-trackpad.spec.ts`：队列、几何、协议、浏览器手势回归。

## 分层验证

| 项目 | 结果 |
|---|---|
| TypeScript | 通过 |
| 核心测试 | 233 通过 |
| Mac 协议/原生策略测试 | 38 通过；几何测试没有移动真实光标 |
| 浏览器 | 1 项通过：相对移动累计、拖拽释放、选区菜单与语音目标回归 |
| Web / Swift / 手机签名构建 | 通过；Web 仍有既有大 chunk 警告 |
| 真实 Mac 光标 | 通过：从内屏 (1000,400) 到扩展屏 (1900,400)、(3000,400)，再恢复原位置；4 次实际读回匹配。零点击、零文本写入 |
| 手机安装启动 | SUP-AL90 / 5ZFYD25B13000537，覆盖安装和启动成功 |
| Mac 服务 | 更新后连接页 HTTP 200、控制端口在线、USB 39872 反向映射存在 |
| 手机到 Mac 跨屏体感 | 用户于 2026-11-05 对跨屏往返及实体鼠标接续测试回复“好了”，记录为用户验收通过；与上面的原生探针证据分开 |

实测排列：内屏 `(0,0,1728,1117)`，扩展屏 `(1728,-203,1920,1080)`。两屏右/左交界只在共同高度范围相接，内屏下方的部分右边缘没有对应的扩展屏。

## 手机包

- Bundle：`com.hmilab.mobileinput.phone`，1.4.0。
- SHA-256：`b637eaed2b3a10186d6018f054e669716848bf6cc555e8dcf12d7311d758e65d`。
- 保留 reset generation：`1793741702534`；新 builtAt：`1793911400977`。
- 使用 `python3 scripts/build-hap.py phone --preserve-demo`；不卸载、不清空数据，未重装平板。
- Mac 服务使用现有 launch agent 重启，保留信任及配对；无任务发送或真实文档修改，无 Git push。
- 此维护包包含当前累计共享源码；前一份附件同步记录中的未完成真机能力没有因此升级为已通过。

可复现证据位于忽略目录 `artifacts/pointer-displays/`：测试/构建/安装日志、包哈希、显示器几何与 `live-result.json`。真实光标探针只移动光标，最后恢复，避免业务操作。
