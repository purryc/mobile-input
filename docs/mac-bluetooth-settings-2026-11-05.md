# Mac 手动连接方式与蓝牙验收 · 2026-11-05

## 当前结果

**已实现 BLE GATT 双向连接并更新手机与 Mac 服务。** 实机已读到真实 Mac/Codex 状态，手机触控板已移动原生光标。初期 SPP 仅观察到单向通信；已替换为公开 BLE GATT 实现。重连曾出现系统链路超时，用户授权后重建了这两台设备的系统蓝牙配对，保留应用信任与数据。后续切换结果见验收表，不把模拟测试等同于实机。

用户最新约定覆盖旧 USB 优先：由用户选择 USB / 蓝牙 / Wi-Fi，插拔线不会切换选择；断线只重试所选通道。没有自动跨通道 fallback。

## 实现

- 设置顺序：界面语言 → 实际连接状态 → 控制目标 → 连接方式 → 继续 → 当前方式的配置。保留中英文、AI 设置与演示数据入口；移除连接方案预览和 USB 优先文案。
- `MacConnectionSettings` 共用分步界面；连接状态来自实际认证结果，选择某个 radio 不代表连接成功。Wi-Fi 才显示二维码及地址；蓝牙才查找设备；USB 复用已配对信任。
- Harmony `MacLink` 仅创建所选链路；`MacTrust` 保存同一 Mac 的各通道端点。恢复连接校验 Mac 身份，不重放结果未知的命令。权限、信任和材料不重置。
- Harmony `MacBluetooth` 使用 GATT Client；Mac companion 使用 CoreBluetooth Peripheral。RX 要求链路加密，TX 要求加密通知，随后仍验证原有 Input Agent 信任与 Mac 身份。
- 手机串行执行订阅、MTU 协商和有回执写入；MTU 完成前不发送认证。修复了系统报告「already has a pending command」时认证卡住的问题。重复连接回调不重复初始化，旧连接回调不能作用于新连接。
- 两端 UTF-8 按字节、换行分帧，保留中文/emoji；限制单帧与队列，Mac 通知根据 CoreBluetooth 背压暂停/恢复。真实材料蓝牙分块采用 2 KiB，USB/Wi-Fi 保留 48 KiB；字节、校验和、所属草稿与明确提交规则不变。
- 诊断只记录连接阶段与错误代码，不记录凭据、正文或文件内容。超时提示按所选 USB/蓝牙/Wi-Fi 区分。USB 插线仅提供调试与可选通道，不自动接管。
- 历史：SPP 的 Mac 写成功不能证明手机收到。BLE 初次双向成功后，重连曾在服务发现阶段出现 0x08 链路超时。延迟服务发现未解决，已撤销该试验。只重建获授权的手机/Mac 系统配对后，重复手动切换通过；不能据此断言已定位操作系统底层根因。没有清除 Input Agent 配对或密钥。

## 验证

| 层次 | 结果 |
|---|---|
| 核心及原生模拟 | 236 项通过：手动路由、无 USB 抢占、超时不重放、旧回调失效、另一 Mac 拒绝、UTF-8 分片等 |
| Mac 测试 | 41 项通过，含原生 Swift GATT 分帧及会话隔离测试 |
| 浏览器 | 4 项通过，390×844 / 390×700，中英文、分步显示及同路重连 |
| 类型检查、生产 Web | 通过（`npm run build` 包含 `tsc --noEmit`） |
| 手机签名构建、覆盖安装 | 成功，未卸载、未清数据、保留 generation |
| 手动 USB 实机 | 已观察到手机“Mac 已连接 · USB”，正常 launch agent 和本项目端口映射已恢复 |
| 蓝牙实机 | **双向已通过**：加密订阅、认证、真实 Codex 状态回传、手机触控板移动；重配后三轮 USB → 蓝牙均通过，观察到蓝牙约 4.17 / 4.01 / 4.39 秒连接；记录在 `artifacts/bluetooth/repaired-round*` |
| Mac 服务重启 | 已通过：同一已选蓝牙通道重新认证、收到状态；没有跨通道切换 |
| Wi-Fi、本轮拔线切换 | 未做新的实机验收；本轮已取消自动切换规则 |
| 真实任务、文档修改 | 未进行 |

## 包与证据

- 手机：`com.hmilab.mobileinput.phone`，1.4.0，SUP-AL90。
- 保留代次：`1793741702534`；Web 构建时间戳：`1793917155792`。
- HAP：`artifacts/hap/phone/entry-default-signed.hap`。
- SHA-256：`84b44d1a3a216c2eaef50539ff4475316fb2d97a5e97b17360dc0460a7ac1be1`。
- 本地私有证据：`artifacts/bluetooth/`（测试/构建/安装日志、release-evidence.json、真机系统诊断）。`artifacts/hid-probe/captures/` 保存界面截图及结构。
- 界面截图：`settings-zh-844.png`、`settings-en-844.png`、`settings-zh-700.png`、`settings-en-700.png`；设备截图包括 `final-usb-connected.png`。
- 临时关闭的项目 USB 数据映射已恢复；正常 LaunchAgent 重新运行。HDC 调试在测试期间保留。
- 未推送 GitHub，未改 Figma，未重新安装平板；原有草稿、配对、权限、原生凭据及演示代次保留。

## 复现命令

```sh
npm test
npm run test:mac
npx playwright test tests/mac-connection-settings.spec.ts tests/mac-auto-connect.spec.ts tests/mac-bluetooth-transfer.spec.ts
npm run build
python3 scripts/build-hap.py phone --preserve-demo
```

安装用已确认手机设备执行 HDC `install -r`，随后启动 EntryAbility。不要卸载或清缓存。蓝牙继续修复时保留 USB 调试，但手机连接方式手动选择蓝牙；USB 数据映射存在本身不触发接管。

## API 依据

- [Huawei GATT development guide](https://developer.huawei.com/consumer/en/doc/harmonyos-guides-V13/gatt-development-guide-V13/)
- [Apple CBPeripheralManager](https://developer.apple.com/documentation/corebluetooth/cbperipheralmanager)
- [Apple GATT access permissions](https://developer.apple.com/documentation/corebluetooth/cbattributepermissions)
- 本机公开 SDK 头文件与 Harmony ConnectivityKit 声明；API 存在不等于本机双向连接已通过。

## 本轮验证边界

- 仅测试原生光标移动与只读真实状态；没有点击发送、Steer、接受修改或编辑真实文档。
- 蓝牙大图片/大文件尚未完成真机吞吐验收；2 KiB 分块与完整字节由模拟测试验证，不能据此承诺大附件速度。
- 本轮未重装平板，未重新验收 Wi-Fi。USB 全程接着用于 HDC；实际控制通道由手机显示、原生认证日志及 Mac 收发共同确认是蓝牙。物理拔线的长时稳定性另列待验。
- 公开源码只包含代码与脱敏记录，AX、系统日志、草稿截图和配对现场证据保留在忽略目录。

最终指针核对：移动前约 `(1029, 698)`，手机前向滑动后约 `(1186, 740)`，反向后约 `(1030, 698)`。仅移动，无鼠标点击或文本输入；原始坐标记录 `gatt-final-pointer.json`。没有把测试工具发起到采样的时间等同于端到端延迟。


## 追加：蓝牙附件实机检查（2026-11-05）

本次仅向未发送草稿加入专门制作的测试材料，没有 Send、Steer 或模型执行。手机手动选择蓝牙；USB 起初只用于 HDC 操作及将虚构 fixture 放入手机。后续手机 → Mac 的材料传输经过已认证 BLE GATT。

| 检查 | 实际结果 |
|---|---|
| TXT 文件 | 手机原生文件选择器选择 100 B 虚构 TXT；Mac 文件逐字节一致，WorkBuddy 原生草稿出现对应附件。通过。 |
| PNG 图片字节 | 手机文件选择器选择 4453 B 虚构 PNG；Mac 字节一致，WorkBuddy 原生草稿出现对应附件。通过。此项不等同于图片 Widget/图库确认验收。 |
| 手绘草图 | 手机实际绘制三条线后采用；Mac 收到 27256 B PNG，服务端 SHA-256 校验后落盘，WorkBuddy 草稿出现布局草图。首次因正文选区校验拒绝，手动重试后通过，不能记为无故障通过。 |
| Codex 草图 | 独立新草稿中观察到实际草图缩略图和虚构测试正文；没有提交。首轮较慢，未独立记录精确端到端耗时。 |
| 图片 Widget | 图库入口可打开。虚构图在 Documents 中，向图库导入遇到文件管理新版隐私条款，已取消；没有使用私人照片。预览/确认链路本轮未验完。 |
| 删除同步 | 手机删除测试草图后，Mac 返回“无法确认附件归属”，附件仍在 Mac 草稿；未通过，不把本地消失当作远端删除成功。 |
| 后台恢复 | 手动切到文件管理后回 Input Agent，一度显示蓝牙未建立；点击重新连接后恢复认证。该手动跳出不属于应用内部持有的系统 picker 流程，仍记录其恢复局限。 |
| 物理拔 USB | 已请求拔线；以 `unplug-observations.jsonl` 的实际 USB 列表与连接采样为准，尚未得出验收结论。 |

发现的正文 no-op 问题：采用/移除材料会把手机 draft 标为 dirty，即使投射正文没变，旧 Mac WorkBuddy 分支仍尝试选中并重写正文，触发附件保护。已在 `agent.swift` 跳过相同正文的重写，仍保留目标/base/选区和结果读回验证。Swift 编译与 41 项 Mac 测试通过；单独修复 helper 的真实 no-op 调用为 verified，正文与三个附件均未变化。清理测试草稿后已更新 Mac companion，手机 HAP 无改动。另加附件插入前的原生选区收起与读回，防止 paste 替换选中文本。独立原生 helper 使用三个虚构附件完成加入及逐个移除，全程原文不变（`native-material-cycle.json`）；这项是 Mac 本机真实控件验证，蓝牙整链路重测另行记录。

证据（忽略目录，不发布私人界面）：`artifacts/bluetooth/material-transfer-evidence.json`、`wb-*-private.json`、`noop-live-readback.json`、`material-mac-tests.log`、`material-swift-build.log`、`unplug-observations.jsonl`；截图在 `artifacts/hid-probe/captures/bt-*`。原始草稿已在 `wb-before-private.json` 保存，测试清理及恢复结果另行记录。

清理与恢复：第一轮失败现场已保存；在断开应用连接后，仅清理本轮三个虚构卡片，恢复 `wb-before-private.json` 中原有的 6 字符草稿。`cleanup-result.json` 记录正文完全恢复、附件为 0。手机重连后同样读回 6 字符，未发送。


### 第二轮与最终边界

- 更新 Mac 适配器后，独立 native helper 的选区收起、三附件采用和三次精确移除全部 verified，原文字节未变。41 项 Mac 测试再次通过，Swift 构建通过；手机没有重装。
- 手机经蓝牙第二轮 TXT 成功；随后连续追加 PNG / 草图未完成整链路，报“WorkBuddy 还有手机未登记的附件，请先核对”。已观察到 WorkBuddy 内联附件插入会在正文中留下额外换行，正文/附件回读与登记需要进一步核对；尚不能宣布该归属问题解决。没有降低来源保护或伪造成功。
- 两轮测试现场已保存。最终仅清理本次测试材料并恢复原有 6 字符草稿，Mac 读回附件 0；手机本轮三个测试卡片也已移除。Codex 独立未发送测试草稿留存供核对，没有操作此前已有私人图片或发送任务。
- 连续 30 次采样约 147 秒全部已连接、BLE 认证计数不变；每次都仍能看到手机 USB。故这只是 **USB 保留调试时的 BLE 在线观察**，不等于物理拔线通过。拔线请求已发给用户，本轮尚未收到拔线结果。后续恢复连接由手动选择蓝牙完成，不自动改选 USB/Wi-Fi。
- 大文件吞吐、图库 Widget 确认、跨后台长期重连以及物理拔 USB 稳定性尚未通过。TXT/PNG 小文件的字节通过不能外推成全部附件可稳定同步。


## 拔线反馈与指针延迟修正

用户确认物理拔掉手机 USB 后，仍显示蓝牙已连接且光标可移动，但“特别慢”。本轮 HDC 返回 Empty，Mac companion 同时仍显示已连接。故独立蓝牙控制可用已得到用户确认；流畅度未通过，不能把连接稳定当作低延迟。

源码发现两个可能放大延迟的机制（尚非完整根因定论）：移动回执间隔超过 250 ms 时，原 AX quiet window 会允许在每次移动间重新扫描；完整状态比较包含 pointer，光标本身的变化会触发整页状态重新发送。修正仅对 BLE 使用 1200 ms quiet window，并在广播变化判断中排除 pointer-only 差异。真正的应用、目标、正文、选区、任务/状态变化仍发送完整权威状态；USB/Wi-Fi 保持原规则，未改移动增益、按键顺序或安全检查。

新增两项自动测试覆盖慢回执间隔下的扫描抑制及 pointer-only 比较，连同 BLE 原生分帧共 6 项通过；完整 Mac suite 43 项通过。准备更新 Mac 服务；手机当前无 USB，实际 MTU、上行分包耗时及修正后的真实手感待核对。没有更改手机包、没有自动切换连接方式、没有文本写入或发送任务。


### 延迟修正版本

- 用户补充：既有延迟追赶，也有移动距离不足。
- 真机固定滑动基线（USB 只供 HDC，控制仍为蓝牙）：光标累计约 304.6 个 Mac 点，HDC 滑动命令返回后仍移动约 0.52 秒，采样读到 5 次位置变化。工具起始时间不是手指实际触碰时刻，不能把它直接当作端到端首帧延迟。
- 蓝牙协商新增 `compact-pointer-v1`：仅压缩相对指针线上表示，完整保留 id/seq/session/window/target、动作及精确 delta，在原协议验证前展开。旧服务不声明能力时保留 JSON；重连清除协商状态。手机实际 negotiated payload = 244 bytes；典型移动由多包缩为一包，不省略身份校验或回执。
- Mac 相对位移增加 50%，保持线性，因此队列合并前后总位移一致；三个 Mac 通道倍率相同。屏幕边界、当前原生坐标、拖拽/释放仍沿用原规则。
- Mac suite 46 项、原生 BLE/指针队列 11 项通过，Swift/ArkTS 签名构建成功。Mac 服务及手机已覆盖更新，保留 generation `1793741702534`。手机 SHA-256 `a3596c05aba8df8152c709fa3e2433a546bf9f2bf4419cdff92d4b229b5c5198`，builtAt `1793919819415`。未重新安装平板。
- 本轮仅移动光标，没有文本写入或任务发送；端到端改善以 `pointer-swipe-before.json` / `pointer-swipe-after.json` 及用户后续手感核对为准。

同一 500 物理像素、同速 HDC 滑动复测：更新前累计 X 约 304.6 Mac 点、5 次采样位置变化、命令返回后的尾随 0.520 秒；更新后约 455.2 点、12 次变化、尾随 0.209 秒。仅作相同工具的相对比较，不将 HDC 命令返回当作精确触摸抬起时间。记录 `pointer-comparison.json`；实际手感与升级后的再次拔线仍由用户验收。

反向复测出现脚本之外的 Y 方向移动及额外 X 位移，判定存在外部操作干扰；`pointer-swipe-return.json` 保留但不计入性能验收。已停止设备操作，请用户确认手感。MacLink 原生回归额外 6 项通过。

### 连续相对位移与 Geek Peripheral 对照（后续，待安装）

- 用户反馈上一版有改善，仍未达到原生触控板手感。重新核对 `survey/geek-peripherals/geek-peripherals-competitive-prd.md` 第14/27章：原应用实际枚举了复合 HID，鼠标 Report ID 3 声明按钮及有符号相对 X/Y/Wheel。这证明报告契约，不证明其私有加速度实现或本项目已复用其代码。报告中的采样时钟不用于延迟结论。
- 本项目独立 HID Probe 只实证了键盘接收；它与主应用的 BLE GATT 双向通道分开。本轮保留 BLE，未注册新的 HID profile、替换系统配对或宣称已接入 HID 鼠标。公开接口的前台、单一应用注册与 API 23 约束见 [OpenHarmony HID Device](https://github.com/openharmony/docs/blob/master/zh-cn/application-dev/reference/apis-connectivity-kit/js-apis-bluetooth-hid.md)。真正的 HID 鼠标路径、与 GATT 并行的主机身份绑定及生命周期仍未实现/验证。
- 共享 PointerQueue 对协商后的 Mac 相对移动采用最多4个在途动作、16ms最小发送间隔。后续移动不必等待上一动作往返回执；按钮/滚动作为顺序屏障，保留实际回执与失败释放。未发送相对位移合并时不再截掉超过单包限制的行程；绝对指针仍串行。Mac bridge 广告 `pointerWindow:4`，旧服务不声明时客户端退回1，避免过载旧服务。
- Mac pointer 队列上限独立放宽到8，其余操作仍3；保留认证、序号、去重、目标验证、串行原生执行。没有将排队当作已执行，也没有自动补发失败动作。
- 无状态变化的 Mac 操作回执只结算对应 Promise，不再引起整屏控制器重绘；真实状态回传仍通知 UI。语音、附件和业务发送逻辑不变。
- 本地29项核心/原生测试、15项Mac测试、1项浏览器拖选/选区编辑回归通过；类型检查、Web生产和手机签名构建通过。浏览器测试导航已适配当前设置的“控制目标→连接方式→继续”；保留原拖选/语音断言。Web仍有既有大chunk提示。
- 待安装手机 SHA-256：`4ee1ba4802be58a21cb3eb5b82ee6ab3ebc29cb8f97868615c8ce39baa499ac9`，generation `1793741702534`，builtAt `1793920769471`。本轮尚未更新运行中的 Mac 服务或安装手机；既有设备继续运行上一版。平板不需要更新。
- 本轮基线水平滑动出现脚本前后的额外X/Y移动，`artifacts/bluetooth/pointer-stream-baseline-invalid.json` 排除出性能验收。已暂停设备操作并请用户确认无并发使用；新版本实机手感/端到端延迟/拔线回归均待测。未发送任务、输入正文、清空数据或推送Git。
- 可复现证据：`pointer-stream-all-tests.log`、`pointer-stream-mac-tests.log`、`pointer-stream-browser-tests.log`、`pointer-stream-web-build.log`、`pointer-stream-hap-build.log`、`pointer-stream-release.json`，均在忽略目录 `artifacts/bluetooth/`。

### 连续移动实机复测与最终安装（同日）

用户确认暂停其他操作后继续。先安装前述流水版并更新 Mac 服务；实测发现只增加在途窗口、仍逐包等待 ATT Write Response 时，尾随从约0.218s增加至0.519s，该中间版判定退化，未作为最终改善结果。

最终修正：双方协商 `pointer-write-command-v1`，仅完整落在一个协商 MTU 内的紧凑 `move` 使用公开 `GattWriteType.WRITE_NO_RESPONSE`；Mac RX 同时声明 write/writeWithoutResponse，仍要求加密。应用级实际执行回执、身份、序号和最多4个在途动作不变。按钮、松手、材料、认证、多包移动及旧服务仍使用 WRITE；重连清空快通道协商。不将 BLE 本地入队当作动作已执行，不自动换 USB/Wi-Fi。依据：[OpenHarmony BLE GattWriteType](https://github.com/openharmony/docs/blob/master/zh-cn/application-dev/reference/apis-connectivity-kit/js-apis-bluetooth-ble.md#gattwritetype)。

| 同速500物理像素滑动 | Mac累计X（点） | HDC命令返回后最后移动 | Y变化 |
|---|---:|---:|---:|
| 前版基线，有效滑动区间 | +454.879 | 0.218s | 0 |
| 中间流水版，退化 | +457.538 | 0.519s | 0 |
| 最终快速移动版 | +455.246 | 0.108s | 0 |
| 最终版反向复测 | -458.515 | 0.143s | 0 |

分析窗统一为HDC返回后1秒；前两组长录制在约6–7秒后出现额外移动，不计入该窗口。原始数据保留，不宣称全程无外部干扰。最终正反两组均在随后观察期间稳定；工具本身启动和采样有延迟，这些数值只用于同工具相对比较，不等于精确触摸抬起时间、屏幕刷新率或原生触控板同等手感。数据见 `pointer-fast-comparison.json` 及各原始JSON。

- 最终30项核心/原生模拟、16项Mac协议/Swift测试通过；共享浏览器拖选回归1项通过；既有Web生产构建、类型检查通过，原生改动后签名构建通过。
- 手机最终已覆盖安装并启动，SHA-256 `a25c030b06900c85a69556a2ac0d7d4ff10beb4fdd008a44c0514fa77fb819f5`，builtAt `1793922198137`，generation仍为 `1793741702534`。Mac服务已重启至本轮源码；蓝牙重新认证、正反向移动和松手后静止已实测。前述待安装包已被此包替代。未重装平板。
- 保留现有数据/配对/权限/原生密钥，USB仅用于安装及HDC操作，UI仍显示蓝牙连接。没有文本写入、任务发送或Git推送。
- 未验证：最终版本物理拔USB复测、精确首帧延迟、HID鼠标直通。HID方案仍未接入，不冒充极客外设驱动。
- 证据：`pointer-fast-release.json`、`pointer-fast-install.log`、`pointer-fast-launch.log`、`pointer-fast-tests.log`、`pointer-fast-mac-tests.log`、`pointer-fast-hap-build.log`及`pointer-fast-final`手机抓图/界面记录，保存在既有忽略目录。

### 用户手感验收

用户对最终修正版反馈：“明显改善，松手不再追赶”。据此将蓝牙触控板跟手与松手停止的主观验收标记为通过。反馈未明确说明是否已拔掉USB，因此最终版物理拔线项仍待确认；不据此声称已达到原生触控板性能或已使用HID。此次仅更新验收记录，未操作设备或推送Git。
