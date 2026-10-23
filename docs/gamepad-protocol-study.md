# 极客外设游戏控制与协议路线

> 2026-10-20 v1.5 主题版更新：原生手柄两种目标系统配置及键鼠手柄已有Mac描述符与实际HID报告，46项动作、362条报告。当前结论见[正式竞品报告](../survey/geek-peripherals/geek-peripherals-competitive-prd.md)第三篇（18-29章）。以下保留此前阶段性记录，不作为最新能力边界。

研究日期：2026-10-20（America/Toronto）。真机目标：Mate 70 Air，极客外设 `com.xbin.peripheral` **1.3.6 / 1360000**。前一轮报告对象为 1.3.5，不能混为同一版本。

## 结论

原生手柄模式采用 Bluetooth HID Gamepad 是合理推断，证据强于仅看外观：应用区分手柄与键鼠手柄，经典手柄布局的导出数据使用 `gamepad.xbox` 标识，映射编辑器以手柄按钮为目标。但尚未取得主机 HID 描述符或按钮/轴报告，因此具体协议、报告布局、Xbox/XInput 兼容性仍未证实。

键鼠手柄的映射机制已直接观察到：相同的手柄形状按钮可以指向键盘按键和鼠标按钮。游戏键盘不必使用 Gamepad 输出。MIDI 是另一种控制消息体系，本轮没有观察到极客外设的 MIDI 入口或配置；不据此断言其内部绝无 MIDI。

## 本轮新增真机证据

所有原始截图、UI 树、导出数据都保存在忽略目录 `reference/private/geek-peripherals/`，仅供本地研究。

| 证据 | 观察结果 | 能证明什么 |
| --- | --- | --- |
| 系统包元数据 | 1.3.6，编译 SDK 6.1.1.125，normal/release | 本轮实际版本身份；不证明调用具体 API |
| `59`、`71` 布局页 | 手柄与键鼠手柄独立分类；经典布局均标 8 组件 | 控件外观与输出类型可以分离 |
| `64` 导出内容 | `format: geek-peripheral.control-layout`、`version: 1`、`meta.deviceId: gamepad.xbox` | 应用公开导出格式和内部布局类别；不是抓包结果 |
| `67`、`72` 编辑页 | 两类均为 `resource:/RAWFILE/web_operate_gamepad.html`，横屏布局编辑 | 至少共享这个 Web 资源路径；未取得其脚本或桥接函数 |
| `68` 手柄映射 | A/B/X/Y、LB 分别映射对应手柄按钮 | 手柄语义映射 UI |
| `73`—`75` 键鼠映射 | 下表具体映射 | 键盘/鼠标语义映射 UI；本轮未向主机触发这些按钮 |

当前键鼠手柄经典布局显示：

| 手机控件 | 映射目标 |
| --- | --- |
| A / B / X / Y | 空格 / Esc / E / R |
| LB / RB | 左 Ctrl / 左 Shift |
| LT / RT | 鼠标左键 / 鼠标右键 |
| Select / Start | Backspace / Enter |
| L3 / R3 | 左 Alt / 鼠标中键 |
| 方向上 / 下 | 键盘方向上 / 下 |

此前回答的 WASD 是机制示例；本轮实际看到的方向上/下映射是键盘方向键，不能把 WASD 写成应用默认值。方向左/右、摇杆连续位移、斜向和多指并发未在本轮验证。

经典布局的 `meta.componentIds` 选择 8 个组件，`groups` 则保存 35 个组件配置记录，包含位置百分比、宽高、缩放、角度、组合 ID 和形状。35 个配置记录不代表 35 个组件都显示或工作。配置中出现左右摇杆、扳机、方向盘、触摸板等条目，也不代表相应硬件报告已验证。导出的这一份数据没有提供 HID Report Descriptor、报告 ID 或真实协议字节。

采用应用内“导出”把预设复制到手机剪贴板，再在同一应用的导入草稿中粘贴以读取文本；未提交导入。未保存布局或映射变更。查看编辑器会改变首页所选类型，结束时已切回本轮起始的鼠标模式并返回首页；恢复模式时曾触发快速配对页的自动连接，未进行鼠标输入。没有删除/新增配对，手机剪贴板目前是该预设导出数据。初次布局列表出现“手游布局 17 组件”，稍后显示“全能布局 15 组件”，变化原因未确定，不将其解释为手动编辑或已证实的版本迁移。

## 三层概念

1. **如何连接**：USB、经典蓝牙、BLE、IP 网络。
2. **发送什么格式的数据**：HID 报告、MIDI 消息、OSC 消息、自定义应用消息。
3. **应用通过什么接口读取**：系统 HID 接口、XInput/DirectInput/GameInput、CoreMIDI、应用插件/API 等。

Game Pad 是 HID Usage 类型之一，键盘、鼠标、Consumer Control、Digitizer 也是相关用途类别。USB-IF 的 Usage 定义不保证每个主机都支持。经典蓝牙 HID 与 BLE HOGP 是不同承载方案；仅凭“蓝牙连接”或设备名不能分辨。见 [USB-IF HID](https://www.usb.org/hid)、[HID Usage Tables](https://www.usb.org/sites/default/files/hut1_7.pdf)、[Bluetooth HID](https://www.bluetooth.com/specifications/specs/human-interface-device-profile-1-1-1/)、[HOGP](https://www.bluetooth.com/specifications/specs/hid-over-gatt-profile/)。

XInput 是 Windows 应用接收输入的 API，并不等于通用 HID 手柄；Xbox 外观、A/B/X/Y 名称或 `gamepad.xbox` 字符串均不足以证明 XInput 兼容。见 [Microsoft 对照文档](https://learn.microsoft.com/en-us/windows/win32/xinput/xinput-and-directinput)。

## Mobile Input Agent 可选择的路线

下表为基于标准的工程判断，不表示极客外设实现了全部路线，也不是本项目已实现清单。

| 路线 | 适用任务 | 接入条件 / 限制 |
| --- | --- | --- |
| HID 键鼠 | 通用软件操作、快捷键、键鼠游戏 | 已有独立键盘事件实证；依赖焦点和输入法，缺业务结果回执 |
| HID Gamepad / Joystick | 摇杆、模拟轴、扳机、方向盘 | 系统与游戏需要识别；普通 HID 不保证 Xbox 兼容 |
| HID Consumer / Digitizer | 媒体按键、笔或触摸数据 | 需要描述符与主机支持；手机输出权限和采样质量待测 |
| MIDI | 琴键、打击垫、音序、推子、旋钮 | 软件需接收 MIDI 或提供映射；不会自动变成系统键鼠 |
| OSC | 多维连续参数、姿态、音视频与创意软件 | 接收软件需约定地址和参数，或开发适配器 |
| 自定义应用协议 | 指定目标、编辑对象、提交 Agent 任务、返回状态和结果 | 需要接收端/插件/API；明确鉴权、权限、幂等与撤销边界 |

MIDI 可以由 USB、BLE、RTP 网络等承载，不能把 MIDI 与蓝牙当作同一层的二选一。Mac 自带 Audio MIDI Setup 支持 BLE MIDI；这只确认 Mac 接收侧基础能力，Mate 70 Air 作为发送端的 API 和兼容性仍需另做探针。[MIDI Association](https://midi.org/midi-transports)、[Apple BLE MIDI](https://support.apple.com/guide/audio-midi-setup/set-up-bluetooth-midi-devices-ams33f013765/mac)。

OSC 定义带地址、类型和参数的消息，与传输分离，常用于多媒体控制；例如自定义 `/camera/pan 0.4`，前提是接收端实现这个地址。它不会自动让任意软件产生对应效果。[OSC 原始规范](https://opensoundcontrol.stanford.edu/spec-1_0.html)。

建议保留统一的控件与意图层，按目标挂输出适配器：HID 负责通用直接输入；MIDI/OSC 负责支持这些协议的专业软件；应用协议负责有目标和结果回执的 Agent 操作。无需把产品锁定为某一种协议，也无需现在实现所有协议。

## 仍需实证

- 分别读取原应用手柄与键鼠手柄模式下的主机 Usage Page/Usage、Report Descriptor、按钮与轴变化，再确认真实输出。
- 本轮手柄显示未配对，没有为取证移除现有键鼠配对。当前没有原应用 gamepad 主机枚举或抓包证据。
- 多键、斜向、连续轴、死区、报告频率、宏、反馈震动、后台/断线释放尚未验收。
- MIDI/OSC 只完成协议路线研究，没有新建发送器，也没有改造 Input Agent 产品代码。

已保存 58—79 共 22 组本轮采集，导出 JSON 已解析并校验字段。研究不等于游戏控制端到端通过。
