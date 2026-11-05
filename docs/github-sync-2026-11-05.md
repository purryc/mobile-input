# Source update / 源码更新 · 2026-11-05

Target / 目标：`purryc/mobile-input` → `main`。用户明确要求源码备份；不发布安装包、不触发网站部署、不操作真实任务。

## 中文更新说明

- **手动连接方式**：手机设置按界面语言、连接状态、控制目标、连接方式组织；USB、蓝牙、Wi-Fi 分步配置，插拔线不自动切换，断线只重试用户选中的方式。
- **真实蓝牙双向通道**：Harmony GATT Client 与 Mac CoreBluetooth Peripheral 复用应用认证、状态、命令和材料传输。保留加密、MTU 协商、分包、队列限制与真实回执。
- **触控板与多屏**：基于原生当前位置发送相对位移，覆盖扩展屏和 Dock。合并未发送位移、保留按键边界；协商紧凑包和最多四个在途移动，仅单MTU移动可用无ATT响应写入，仍等待应用执行回执。去掉无状态变化回执导致的整屏重绘。
- **附件同步**：文件、图片和草图确认加入 Composer 后，按原会话同步真实字节及采用；预览未确认不上传，删除只作用于对应未发送草稿附件。发送任务仍是独立明确操作，失败/未知结果不冒充成功、不自动重发。
- **WorkBuddy 当前菜单**：共享手机选区/修改控件跟随实际原生动作，包括修改想法的发送/取消。只在有真实差异数据时显示差异，不假设每个阶段都有接受/拒绝。原生 helper 异常退出时由既有服务恢复。

## 验证与限制

| 验证层 | 结果 |
|---|---|
| 本次源码备份检查 | TypeScript通过；核心245项、Mac46项及4项浏览器测试通过；变更文件凭据特征扫描无命中，私有文件由忽略规则排除 |
| 已有构建证据 | Web生产与手机ArkTS签名构建通过，保留既有大chunk提示 |
| 最新安装 | 手机覆盖安装、启动和Mac服务更新通过；保留演示代次1793741702534、配对、权限与原生密钥；未重新安装平板 |
| 蓝牙指针真机 | 正反向移动、停止后静止；用户反馈“明显改善，松手不再追赶” |
| 量化边界 | 同工具测得尾随约0.218s→0.108s，反向0.143s；不是精确触摸延迟或帧率测量 |
| 尚待验证 | 最终版本物理拔USB复测、HID鼠标直通、全部附件组合及重连删除闭环、实际WorkBuddy模型修改后的接受/拒绝 |

本轮未提交真实Agent任务、未修改真实文档。部分附件加入与独立移除已经实测，但不能据此宣称所有应用和跨会话重连组合全部通过。当前实现仍为BLE应用通道，未接入极客外设代码或原生HID鼠标。

安装包哈希、详细测试边界见 [蓝牙验收记录](mac-bluetooth-settings-2026-11-05.md)、[附件同步记录](confirmed-attachment-sync-2026-11-05.md)、[WorkBuddy菜单记录](workbuddy-context-actions-2026-11-05.md)、[跨屏指针记录](mac-relative-pointer-displays-2026-11-05.md)。原始截图、AX、日志、HAP与私有材料只保存在忽略目录。

## English release notes

- Added explicit USB, Bluetooth and Wi-Fi selection. Cable insertion does not override the selected method; reconnection retries only that transport. Settings retain language selection at the top.
- Added authenticated, encrypted bidirectional Harmony-to-Mac BLE GATT communication with bounded framing, MTU negotiation and actual command receipts.
- Improved native relative pointer movement across displays and the Dock. Negotiated compact packets, a bounded paced motion window and single-packet Write Without Response reduce redundant transport waits while retaining application execution acknowledgements. Pointer-only receipts no longer redraw the whole phone controller.
- Confirmed files, images and sketches reconcile to the owning unsent draft. Removal targets only the matching draft attachment. Preview, adoption, reconnection and task submission remain distinct; uncertain submissions are not replayed.
- Shared contextual controls reflect WorkBuddy's actual current menu, including instruction Send/Cancel. Diffs and Accept/Reject are not invented. Unexpected native helper exits restart the companion through its existing service.

Type checking, 245 core tests, 46 Mac tests and 4 browser tests passed for this backup. Web and signed phone builds passed previously for the same implementation; the phone and companion were upgraded while preserving data and trust. The user confirmed noticeably improved Bluetooth tracking with no post-release catch-up.

Timing figures are tool-relative proxies, not touch-to-photon measurements. Final-build physical USB unplug, native HID mouse integration, all attachment/reconnect/removal combinations, and live model-generated WorkBuddy Accept/Reject remain unverified. No real Agent task was submitted. Credentials, signing inputs, private captures/logs, recordings and built packages are excluded from this source backup.
