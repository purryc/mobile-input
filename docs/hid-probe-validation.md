# 独立蓝牙键盘探针：实机验证记录

日期：2026-10-16（America/Toronto）。关联：[极客外设拆解](geek-peripherals-analysis.md)。

## 当前结论

**手机到 Mac 的键盘事件链路已通过两轮接收端验证：R/E/A 各一次 keydown 和 keyup，无 repeat。用户确认其他应用及测试页收到 `rea`；测试页采集值实际为输入法组合文本 `re a`，精确落字和稳定性仍需单独验收。**

后续复查时 Mac `bluetoothd` 已为 `running`（PID 28834）；历史累计崩溃计数仍为 18，不能把历史计数当作当前仍在崩溃。手机日志出现 Profile 状态 `2` 及完整 6 帧发送。用户报告的接收位置为其他应用，未指定应用名称；这是用户确认的实测结果，未冒充自动采集证据。

### 接收端实测（12:22 EDT）

日志 `mac-events-20261016T160612Z.jsonl` 记录两轮各 9 个事件：3 次 keydown、3 次 keyup、3 次 input；键序列均为 R → E → A，每键各有完整松开，全部 `trusted = true`、`repeat = false`。结合用户手动聚焦并触发手机的操作确认，构成本轮真实蓝牙输入证据。

两轮 input 均为 `insertCompositionText`，文本依次为 `r` → `re` → `re a`；浏览器页面读回也显示 `re a`。没有 Space 按键事件，空格出现在组合文本中。因此按键报告正确抵达，但不能将其等同于确定的 ASCII `rea` 已提交；尚未采集 compositionend。具体输入法名称未核实。后续产品应区分按键/快捷键通道与精确文本传输通道，不应靠盲发按键保证中文或长文本落字。

收尾点击了手机“停止”，界面禁用发送并记录全松开报告；观察窗口内没有追加键盘事件。这只覆盖完整发送后的停止，不代表发送中断、切后台或重连不补发已经通过实机验收。结构化结果见 `receiver-verification.json`。探针和接收服务器已停止。

### 前一轮失败记录（已被后续进展更新）

Mac 的 `bluetoothd` 服务连续崩溃，检查时为 `spawn scheduled`，18 次 successive crashes，最后信号 `Abort trap: 6`。最早崩溃记录为当天 11:14:31，探针首次启动截图为 11:52:20；这些记录早于探针运行，但尚不能确定崩溃根因，也不能据此归因于极客外设。Mac 设置曾显示蓝牙关闭；打开后设备列表为空，系统蓝牙信息查询未返回。

探针连接回调为 `1 → 0`（连接中 → 断开），`cause = 0`，没有到达已连接状态。发送按钮始终禁用，因此没有发出 `rea` 报告；接收页仍为空。测试结束后停止了探针和本地接收服务器。

## 对 Mobile Input Agent 的意义

已找到可独立实现的系统入口：手机能够注册为标准蓝牙键盘。用户已确认其输出抵达真实应用输入框，支持将它作为基础输入通道继续开发。当前还不能宣称支持任意应用、鼠标、滚动、中文输入或 Agent 工作流。

键盘输入依赖主机焦点和键盘布局；连接成功也不能确认某个业务操作完成。后续仍需目标确认、按键释放、断线处理，以及主机侧可观察的结果。HID 本身不提供屏幕理解、应用语义、文档内容或任务完成回执。

## 验证分层

| 层级 | 结果 | 证据 / 限制 |
| --- | --- | --- |
| 独立源码 | 已完成 | `apps/harmony/hid-probe/`；包名 `com.hmilab.hidprobe`，未替换 Input Agent |
| 控制器测试 | 7/7 通过 | 描述符长度、按下/松开、后台取消、断线不重放、目标校验、连接超时、失败可见 |
| 原项目回归 | 通过 | 类型检查、122 项 core/protocol 测试、Web 构建；Web 保留体积警告 |
| 最终 HAP | 构建、签名通过 | 最终增量构建无 warning/error；已安装并重启应用检查 |
| 手机 API | 已观察 | `createHidDeviceProfile` 存在，注册回调 `true` |
| 配对读取 | 已观察 | 读取已有设备，用户指定的 Mac 可选择；未修改配对记录 |
| Profile 连接 | 已观察 | 后续手机日志出现状态 `2`，Mac 蓝牙服务已运行 |
| 真实输入 | 按键链路通过 | 两轮完整 R/E/A 接收事件；输入法组合值 `re a`，精确提交仍待验收 |
| 正常发送的按键释放 | 已验证 | 两轮每键均有 keyup，无 repeat；发送中断时的释放仍待实测 |
| 完整发送后停止 | 已观察 | 已停止、发送禁用、全松开报告日志；观察窗口无追加键盘事件，未记录底层解除注册确认 |

证据保存在忽略目录 `artifacts/hid-probe/`，包括 `validation-summary.json`、`mac-bluetooth-service.txt`、脱敏的 `mac-bluetooth-crash-summary.json`、构建/测试日志，以及 `captures/15-final-registration.*`、`16-final-stopped.*`。原始系统崩溃报告留在系统目录，未复制到源码。

## 实现与边界

- 独立 ArkUI 页面，只请求 `ACCESS_BLUETOOTH`，只允许显式触发固定 `rea` 测试。
- 标准 8 字节键盘输入报告，依次发送 R/E/A 的按下与全松开，共 6 帧；每帧间隔 120 ms。没有自动发送或断线补发。
- 已配对设备地址是虚拟地址，连接使用 `addressType: 1`。早期探针曾误用 real 类型，已修正并加入测试；该实现错误不代表第三方应用或系统的问题。
- 前后台切换、停止和断线取消剩余帧；通道可用时尝试发送全松开。断线后无法保证松开报告抵达主机，需实机验收。
- 本地接收页只监听自己的空白输入框，并记录 trusted 键盘事件及文本。`isTrusted` 单独不足以识别输入设备，实测期间不得用 Mac 键盘或自动化填字制造通过结果。
- 接收服务器只绑定 `127.0.0.1:8768`，不连接外部服务。探针没有 AI 模型调用，本次没有购买会员或付费服务。

## SDK 与签名

本机安装的 DevEco SDK 为 HarmonyOS 6.0.2 / API 22，静态类型仅包含 HID Host；公开文档的 HID Device 能力标为 API 23 起。使用独立原生 JavaScript 适配模块，在真机运行时检查公开方法是否存在，再调用；未修改 SDK 声明、绕过权限或注入第三方应用。此兼容实验通过了该手机上的注册验证，**不等于匹配 SDK 的完整类型验证，也不保证其他系统或上架审核兼容**。

源码目录含空格，DevEco IDE 无法直接打开，因此构建脚本同步到 `~/.cache/input-agent-hid-probe/`。通过 IDE 已登录账号为独立包生成调试签名。私有签名配置保留在缓存项目及 `~/.ohos/config/`，不进入源码；示例配置不含凭据。调试 HAP 的安装范围与有效期受开发签名约束。

## 复现与恢复后验收

在项目根目录运行：

```sh
node --test apps/harmony/hid-probe/tests/controller.test.mjs
python3 scripts/build-hid-probe.py
python3 scripts/hid-probe-receiver.py
```

初次在另一台开发机签名，需要在 DevEco 打开上述缓存项目，为 `com.hmilab.hidprobe` 配置本机调试签名，并将 product 的 signingConfig 绑定到对应配置，然后重新运行构建。产物位于 `artifacts/hid-probe/hap/entry-default-signed.hap`。缺少签名时只能得到 unsigned 包。

后续复查服务已运行，且用户已确认收到输入，不再要求重启。若再次出现设备列表空白或服务崩溃，先检查当前服务状态，再由用户选择是否保存工作并重启；不能把重启预先报告为已修复。

恢复后打开 `http://127.0.0.1:8768/`；手机打开 HID Probe → 检测并启用 → 选择 Mac。只有状态为“输入通道已连接”才在 Mac 前台聚焦空白框并点手机“发送 rea”。验收需同时看到文本 `rea`、R/E/A 各自完整 keydown/keyup、无 repeat，以及停止/切后台后不再追加输入。然后验证断线恢复不补发。若需重新配对，先明确说明将变更的这一组设备记录。

代理没有重启 Mac、重置蓝牙数据库、忘记设备或改动系统服务配置；Mac 蓝牙开关在测试中开启。后续服务运行状态已确认，恢复方式未记录。

## 官方依据

- [HID API](https://github.com/openharmony/docs/blob/master/zh-cn/application-dev/reference/apis-connectivity-kit/js-apis-bluetooth-hid.md)：Device 注册、连接、报告与前台要求。
- [Bluetooth connection API](https://github.com/openharmony/docs/blob/master/zh-cn/application-dev/reference/apis-connectivity-kit/js-apis-bluetooth-connection.md)：已配对设备返回虚拟地址。
- [Bluetooth common API](https://github.com/openharmony/docs/blob/master/zh-cn/application-dev/reference/apis-connectivity-kit/js-apis-bluetooth-common.md)：地址类型定义。

这些公开接口文档解释实现依据；本机结果以以上截图、回调和日志为准。
