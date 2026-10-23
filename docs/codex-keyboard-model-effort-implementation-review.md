# 旧 Codex 手机键盘的模型与强度实现复核

日期：2026-10-20。只读检查旧项目代码，补充研究结论；未修改旧键盘实现、未操作真实 Codex 菜单、未更改用户模型或强度。

## 结论

我们之前确实实现过“手机直接选择模型、拖动滑杆选择强度”。现存代码采用混合链路：

**App Server 提供能力与任务状态 → 手机生成模型下拉和离散强度滑杆 → Bridge 操作 Mac 可访问性菜单 → App Server 更新同一任务设置 → 回传手机。**

该实现不是经过验证的纯键盘宏，也不能证明所有 Agent 均支持同一按键序列。它说明了一个可复用的产品设计：手机控件表达用户意图，由各应用适配器选择执行方式。

旧项目已从历史路径 `/Users/hmi/Documents/Virtual Keyboard/codex-mobile-keyboard` 迁到：

`/Users/hmi/Documents/input agent/Mobile Phone Input Agent/Remote Input Keyboard/code/codex-mobile-keyboard`

下文文件均相对该现存目录。

## 代码证据

| 层 | 文件与入口 | 实际逻辑 |
| --- | --- | --- |
| 能力读取 | `apps/bridge/src/codexAppServer.ts:68`、`:90` | 启动 `codex app-server --listen stdio://`，请求 `model/list`，读取各模型的 `supportedReasoningEfforts`、默认强度和名称 |
| 手机生成 | `apps/mobile/src/components/CodexControl.tsx:49`、`:139` | 模型使用原生 select；强度滑杆 min=0、max=档位数−1、step=1；档位来自所选模型能力列表 |
| 语义命令 | `CodexControl.tsx:78` | 发送 `codex.thread.configure`，包含 slotId、model、effort；并非发送“按几次方向键” |
| 合法值处理 | `packages/protocol/src/index.ts:212` | 请求强度不在支持列表时回到模型默认值；更换模型时不硬沿用旧档位 |
| 任务与顺序 | `apps/bridge/src/index.ts:326` | 找到 slot 对应 threadId，打开该桌面任务、加载任务状态；先调用 Mac helper，再更新 App Server，最后广播快照 |
| Mac 菜单 | `services/macos-input/macos_input.py:413` | 定位模型控件，点击弹层，找到 Model 或 Effort 菜单项，再按文字查找目标选项并点击 |
| 后台设置 | `apps/bridge/src/codexAppServer.ts:264` | 请求 `thread/settings/update`，参数包含 threadId、model、effort |
| 发起任务 | 同文件 `:281` | `turn/start` 显式带 model 与 effort；执行中手机控件标 NEXT TURN |

## 选择 High 时具体做什么

1. 手机根据当前模型返回的档位表，把滑杆位置换成 `high`。
2. Bridge 接收语义命令并定位同一 threadId。
3. Mac helper 识别 composer 附近的 `AXPopUpButton`，从其标题判断当前模型/强度。
4. 若尚不是目标强度，点击控件，寻找描述以 `Effort ` 开头的 `AXMenuItem`。
5. 打开该项，按标题、描述或值匹配 `High`；匹配对象包括菜单项与单选项。
6. 通过元素位置中心进行鼠标点击；无位置时尝试 `AXPress`。结束时发 Esc 收起菜单，并恢复鼠标位置。
7. helper 返回后，Bridge 请求 App Server 更新设置，再回传手机。

因此现存实现是“读取可访问性信息并按语义定位菜单”的自动操作，不是通过截图 OCR，也没有在模型/强度路径中发送 Up/Down/Enter 导航序列。

另一个独立路径确实使用普通按键：APP 拨盘操作 Cmd+Tab，演示翻页操作 Page Up/Page Down。不能据此把模型滑杆也归类为纯快捷键。

## 能借用什么

- **模型选择控件**：一个当前模型入口，展开模型列表。
- **强度控件**：仅展示当前模型支持的离散档位。也可以呈现为（降低／提高），分别取相邻档位后提交具体目标值。
- **意图与执行分开**：手机发送“设为 High”，不需要关心底层是接口、可访问性动作还是经过验证的菜单按键序列。
- **任务绑定**：模型/强度设置跟随 threadId，而不是只根据前台应用名称。
- **下一轮语义**：运行时修改明确标为 NEXT TURN，不暗示已改变正在执行的推理。

对新九键面板，可由一个“模型/强度”入口展开临时面板。底层适配器应区分：

| 执行类型 | 能力边界 |
| --- | --- |
| 直接快捷键 | 一次触发即完成明确动作 |
| 菜单按键序列 | 经验证的焦点与导航流程；需检查结果，不能盲按固定次数 |
| 可访问性操作 | 读取当前菜单语义并激活具体选项；旧项目使用这一类 |
| 应用接口 | 读取支持值并提交具体模型/强度；旧项目同时使用 App Server |

不能将旧 Mac helper 直接用于 Windows 或鸿蒙；两端需要各自的可访问性、输入或应用接口适配。

## 当前实现的限制

1. **标签兼容风险**：`macos_input.py:437` 把 `xhigh`、`ultra` 都映射到 `Extra High`。代码无法保证桌面档位与发给 App Server 的值相同；需要改为读取实际支持值和界面标签的准确对应。
2. **缺少结果读回**：`_select_setting` 点击后清理菜单，`configure` 没有再次读取最终值；helper 的 `configured: true` 只表示函数正常返回，不证明当前界面已是目标值。
3. **双写不原子**：先改桌面 UI，再改 App Server；后者失败时没有回滚/冲突状态处理，可能出现桌面已变而手机报错。
4. **滑动请求可能重叠**：range 的每次 onChange 都立即发送 configure，没有看到该路径的末值合并或最新请求序号保护。Python 菜单操作有锁，但不等于整条跨进程链路只保留最新值。
5. **界面耦合**：英文 Model/Effort/High 标签、composer 下部定位和菜单区域扫描依赖当时版本；新布局、多语言与新档位都需重新验证。
6. **接口有版本边界**：旧代码初始化开启 experimentalApi；现存方法名只能证明历史实现使用它，不能直接证明当前客户端仍接受。

## 本轮验证

- 读取现存源码与本项目规则，核对手机 → 协议 → Bridge → Mac helper → App Server 完整调用顺序。
- `npm run test -w @agent-keyboard/protocol`：7 项通过。
- `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s services/macos-input/tests -p 'test_*.py'`：18 项通过。
- 菜单配置路由测试使用 `FakeCodexDesktop`，没有实际遍历和点击 Codex 菜单；这些结果不能替代端到端验收。
- 没有启动旧 Bridge、注入输入、改变模型、提交任务或进行 Windows／鸿蒙设备测试。当前工具对 Codex 本机界面访问有限制，本次未尝试绕过。

下一步若要复用：先修正标签映射与结果读回，再验证“设置指定档位→桌面显示一致→下一轮实际值一致”。如果选择纯快捷键方案，应另行验证菜单焦点与导航路径，不能把旧可访问性实现视为该方案的实测证据。
