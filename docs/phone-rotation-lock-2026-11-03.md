# 手机遵循系统旋转锁定 · 2026-11-03

普通手机界面启动以及退出 Mario 后，原 `AUTO_ROTATION` 改为 `AUTO_ROTATION_RESTRICTED`。系统关闭自动旋转时不因传感器变化自行转屏，开启时允许跟随设备方向；不读写或轮询系统设置。Mario 仍使用固定 `LANDSCAPE`，平板保持原方向策略。

覆盖入口：`apps/harmony/phone/entry/src/main/ets/entryability/EntryAbility.ets` 与共享 `NativeBridge.gameLayout(false)`。Web 中 Mario 挂载／卸载仍调用同一原生接口，语音、连接及草稿逻辑不变。

依据：[华为窗口旋转文档](https://developer.huawei.com/consumer/cn/doc/doccenter-capabilities/window-rotation)；当前 DevEco SDK `@ohos.window.d.ts` 的 Orientation 注释确认：AUTO_ROTATION 忽略旋转锁，AUTO_ROTATION_RESTRICTED 受系统自动旋转锁控制。

验证：类型检查、生产构建及核心测试日志在 `artifacts/shared-dock/rotation-*`。系统锁开／关、从 Mario 返回、后台恢复的实际方向需要真机验证；按当前设备暂停规则未安装、启动或探测设备。浏览器不能证明系统旋转锁行为。

后续用户明确授权安装：SUP-AL90 手机签名包覆盖安装成功，EntryAbility 启动成功，已读取应用界面。未改平板，未切换系统设置；锁开／关和退出 Mario 后的物理旋转行为仍待用户实测。
