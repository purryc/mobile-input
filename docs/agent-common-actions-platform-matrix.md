# Agent 通用操作：四种执行路线与 Windows／鸿蒙 PC 边界

历史研究记录。本报告已合并到 [Agent 通用操作 Survey](../survey/agent-common-operations/agent-common-operations-survey.md)，后续以合并稿为准。合并稿补入 WorkBuddy 分享/Open API、新增材料入口和动态参数 widget 评估，修正本记录中 WorkBuddy 接口尚未确认的旧结论。

日期：2026-10-20。对象：WorkBuddy、Codex、Claude、豆包、Kimi、OpenCode、小艺。

**结论：统一手机上的动作名称，按应用、端形态和当前状态选择执行路线。Windows 可规划快捷键、菜单序列、可访问性和应用接口四条路线；鸿蒙 PC 当前宜以已核验的键盘入口与应用主动接入为基础，跨应用可访问性仍是关键待确认项。**

这里的“通用”表示可复用的语义动作池，不表示七个应用全部拥有该功能。资料支持、工程可实现、当前项目接通、真机通过是四种不同状态。本轮完成资料与本地代码记录复核，没有进行 Windows／鸿蒙 PC 端到端操作验收。

## 1. 四种路线到底做到哪一步

| 路线 | 判断标准与例子 | Windows | 鸿蒙PC | 能得到的反馈 |
| --- | --- | --- | --- | --- |
| K：直接快捷键 | 一次单键或组合键完成所标动作。Ctrl+N 可完成“新建”；Ctrl+Shift+M 只完成“打开模型菜单” | 有公开键位的目标应用可适配；软件接收端可用 SendInput，或使用已兼容的外部 HID | 目标应用接受外部键盘时可适配；需核验主机接收、修饰键及目标版本键位。系统智慧键单列 | 按键已发出；仅靠 HID 不知道业务是否完成 [P1,L2] |
| S：菜单／连续按键序列 | 打开入口→选择目标→确认。也包含 Ctrl+X→N 这类 Leader 序列；斜杠命令是文本命令序列 | 可实现，依赖焦点、菜单结构、语言和版本；具体路径需逐条验证 | 仅在真实应用支持键盘导航且输入通道可用时成立；不能照搬 Windows 序列 | 无读回时仅知道序列已发送；可配合 A 或 I 验证结果 [P1,W2,K2,O1] |
| A：可访问性操作 | 读按钮名称、角色、选中值和可用动作，再 Invoke／Select／Toggle | UI Automation 提供平台基础；逐应用检查实际暴露的控件与模式，不能承诺所有 Electron/Web/TUI 都完整可读 | 尚未确认商业鸿蒙 PC 对普通第三方开放的通用跨应用树读取及动作能力；不能直接套 Android 做法 | 能读 UI 当前值与选择状态；仍需确认业务完成 [P2,P3] |
| I：应用／会话接口 | 按 session/thread/request ID 调用应用协议，并读取状态与事件 | Codex、OpenCode、Kimi Code 有可研究的会话协议；Claude SDK 面向自建集成，范围另列 | 自己适配的鸿蒙应用可提供接口；鸿蒙客户端连接远端 Agent 服务可作为方案。均不等于控制任意鸿蒙原生应用 | 有机会取得任务身份、支持值、请求 ID 与权威状态；需接入同一服务与会话 [C3,O4,K6,A6] |

K 与 S 按**用户点击后的完整目标**区分：“打开模型菜单”是 K；“把模型设成指定值”通常是 S、A 或 I。一个动作可混合路线，例如用 K 开菜单、A 找到目标并执行。

Windows SendInput 受 UIPI 等限制，普通进程不能借此向更高完整性级别的目标任意注入；返回插入事件数也不证明业务成功。[P1] UI Automation 的 Invoke、Selection、RangeValue 等模式取决于目标控件的提供者。[P2]

OpenHarmony 的 `getWindowRootElement`、`getWindows`、`performAction` 等旧接口文档明确标为自 API 12 废弃，并说明不再开放相关能力。[P3] 这证明**不能沿用旧公开接口作产品承诺**；它不能证明商业鸿蒙 PC 所有系统合作渠道均不存在。无障碍标签、应用内焦点导航与第三方读取其他应用的 UI 树，也需要分别判断。

本项目已有的 HID 探针记录只证明手机到 Mac 的部分真实按键链路，尚未证明 Windows／鸿蒙 PC 接收及这些 Agent 动作。我们自己的两端 Demo 协议只控制自己的副本，不能算真实 WorkBuddy、WPS 或小艺的控制接口。[L2]

## 2. 扣除固定键后的通用动作池

固定七键：全选、复制、剪切、粘贴、删除、撤销、重做。本表不重复普通编辑动作；已有固定截图、语音、发送入口时继续复用。Agent 会话回退与普通文本撤销语义不同，单独保留。

“A 候选”均指 Windows 逐应用验证后的路线；鸿蒙跨应用 A 尚无本轮确认方案。“I 候选”须限定后文列出的应用协议与同一会话。下列格数表示独立点按目标，不代表所有场景常驻。

| 通用动作 | K：已知直接键示例 | S：菜单／按键序列 | A：可访问性候选 | I：接口候选 | Windows范围 | 鸿蒙PC范围 | 面板格数 | 来源 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 唤起 Agent | Claude／Kimi Code 可配置全局入口；默认值不统一 | 系统启动器搜索应用，具体序列另验 | 定位并激活目标窗口；需主机适配 | 应用提供深链接／启动协议时接入，不能假设都有 | 按安装版与用户绑定适配 | 小艺有系统智慧键；手机能否发送等价事件未确认 | 1，可放系统层 | A3,K1,H1,H3 |
| 新建任务／会话 | Codex、Claude Code Desktop、Kimi Code Desktop：Ctrl+N | OpenCode TUI：Ctrl+X→N（Leader） | 激活“新建”控件 | 创建会话；创建后是否切换桌面另验 | 多个 Code 端有明确入口 | WorkBuddy 键位待核验；其余原生范围见表3 | 1 | C1,A1,K1,O1 |
| 搜索／选择历史任务 | WorkBuddy：Ctrl+K 打开搜索 | WorkBuddy：Ctrl+K→输入→↑↓→Enter；OpenCode TUI：Ctrl+X→L 打开会话列表 | 搜索框及结果列表选择 | 列出／检索会话，再绑定具体 ID | 已知端可适配 | WorkBuddy 优先实测；不能把 Harmony+S 系统搜索当历史任务搜索 | 1 | W2,O1,H1 |
| （上一任务／下一任务） | WorkBuddy：（Ctrl+[／Ctrl+]）；Codex、Claude Code Desktop：（Ctrl+Shift+Tab／Ctrl+Tab） | 从任务列表选择目标 | 按任务身份激活对应项 | 按 ID 切换面板目标；桌面导航需另接 | 有明确键位；“标签”与“任务”需按界面确认 | WorkBuddy 两键待核验 | 2 | W2,C1,A1 |
| 发送当前任务输入 | Kimi CLI：Enter；其他端需确认发送设置及焦点 | 选发送控件或命令后确认 | Invoke 当前目标的发送控件 | 提交当前会话输入，读取接受与执行事件 | 按端与发送设置适配 | 原生应用键位待验；自有／远端会话协议可另接 | 已有发送则0，否则1 | K2,C3,O4,K6 |
| 停止当前执行 | Claude Code Desktop／CLI、Kimi CLI、OpenCode TUI：Esc；OpenCode Desktop 输入框：Ctrl+G | 有菜单时选择停止；不把“关闭菜单”当停止 | Invoke 当前任务的停止按钮 | 中断指定活动轮次，读回终态 | 多端有文档；不同焦点语义不同 | 原生端未形成已验通用键；不能盲发 Esc | 1，执行中临时出现 | A1,A2,K2,O1 |
| 打开模型菜单 | Codex：Ctrl+Shift+M；Claude Code Desktop：Ctrl+Shift+I；Claude CLI：Alt+P | OpenCode TUI：Ctrl+X→M | 展开模型选择控件 | 读取可用模型，在手机显示列表 | 所列端有文档 | 本地目标待应用适配；远端服务列表可作为方案 | 1 | C1,A1,A2,O1 |
| 选定具体模型／（上一近期模型／下一近期模型） | OpenCode TUI：（Shift+F2／F2）只轮换近期模型；没有七应用通用“全部模型切换键” | 打开菜单→选择目标→确认；Claude Code 菜单支持数字选择，目标与数字对应须读回；Codex 精确导航路径待测 | 按模型名称／ID 选择并回读 | 基于能力列表设置目标模型，绑定会话及生效轮次 | 能规划多路线；循环键不保证指定目标 | 原生适配待验；远端协议方案另列 | 共用模型入口；若展开双向键则2 | O1,A1,C1,C3,K6 |
| 思考强度／（降低／提高） | Claude Code Desktop：Ctrl+Shift+E 仅开菜单；OpenCode TUI：Ctrl+T 轮换模型变体，不能一概叫“增强推理” | 开强度菜单→选受支持档位→确认；没有统一的 ± 热键 | 读取当前档位，选择相邻合法档位 | 读模型支持值再设置；不硬写固定三档或连续数值 | 可适配支持此能力的模型与端 | 本地原生能力待验；远端能力列表可接 | 入口1；展开步进则2 | A1,O1,C3,K6,L1 |
| 工作模式／（计划／执行） | Kimi CLI：Shift+Tab 切换 Plan；OpenCode TUI：Tab／Shift+Tab 轮换 Agent | 通过本应用的模式或 Agent 菜单选择目标 | 读当前模式并选具体模式 | 仅映射应用实际声明的模式 | 模式含义不完全相同，不能统一把所有 Shift+Tab 都叫 Plan | WorkBuddy／小艺本地模式能力需各自确认 | 1入口；非统一二元开关 | K2,O1 |
| 权限方式 | Claude CLI：Shift+Tab 轮换权限模式；Claude Code Desktop：Ctrl+Shift+M 开菜单 | 打开权限菜单→选择本次目标范围 | 读具体权限选项及当前值 | 使用协议提供的权限配置；与单次审批分开 | 按端适配，不与工作模式混在一个字段 | 本地原生未确认通用入口 | 1，通常收进更多 | A1,A2,A6,K6 |
| （允许／拒绝）及实际弹窗选项 | Codex 已出现授权请求时：（Enter／Esc）；Kimi CLI 审批：数字选项或 Esc 拒绝 | Kimi CLI：↑↓→Enter；Enter 只确认当前选项，不固定表示 Yes | 读取请求、实际按钮文案与范围，按用户点选执行 | 读取并回复当前 request ID；过期后失效 | K/S 有条件可用；A/I 能支持更准确的临时面板 | 仅按键时可辅助用户操作，但不能声称自动读懂任意弹窗；A 未确认，I 需应用合作 | 通常2–4，按实际选项生成 | C1,K2,P2,C3,O4,K6 |
| 立即补充／引导执行 | Kimi CLI 执行中：Ctrl+S | 有显式 steer 菜单才适配；普通发送可能排队 | 读取并激活“立即引导”控件 | 协议支持时向活动轮次追加；与下一轮队列分开 | Kimi 有直接键；其他按协议或端验证 | 原生端未确认；远端接口候选 | 1，执行中临时出现 | K2,C3,K6 |
| 查看过程／（展开／收起） | Claude Code：Ctrl+O；Kimi CLI：Ctrl+O 展开工具输出 | 命令菜单中选择过程视图 | 展开区域、读取当前展开状态 | 事件／日志可展示在手机；不代表桌面也已展开 | 已知端有明确键位 | 本地界面另验；远端状态可独立展示 | 1切换 | A1,A2,K2 |
| 查看变更／结果 | Codex：Ctrl+Shift+G；Claude Code Desktop：Ctrl+Shift+D | 从结果／文件／审查菜单选目标 | 按结果名称激活查看控件 | 获取 diff／结果；在手机查看与打开桌面面板分别适配 | Code 端优先；无变更时不显示 | WorkBuddy 本地结果入口待验；远端结果可独立展示 | 1 | C1,A1,O4 |
| 分支／上下文管理／（回退／恢复） | 无跨产品通用直接键；Claude Code Desktop 的 Ctrl+; 是旁支提问，不应自动等同历史分叉 | OpenCode TUI：Ctrl+X→G 时间线、→C 压缩、（→U／→R）回退／恢复；Claude CLI 空输入时 Esc→Esc 回退选择 | 按实际历史节点与作用范围操作 | 接口支持时执行 fork／compact／revert；区分消息与文件的影响 | 各产品分别适配，不套用固定文本 Undo/Redo | 本地原生待确认；远端接口候选 | 收进更多；展开回退／恢复2 | O1,A1,A2,C3,O4,K6 |

## 3. 七个应用分别能落哪条路线

以下“可适配”仍是资料依据与工程判断，不表示本项目已连接这些真实应用。全部 Windows A 路线都需实际读取该版本 UIA 树；不存在“Windows 有 UIA，所以七个应用都已支持”的推导。

| 应用与端 | Windows：K／S | Windows：A | I：接口与范围 | 鸿蒙PC：本地与远端分开 | 来源 |
| --- | --- | --- | --- | --- | --- |
| WorkBuddy 桌面 | K：搜索、定位、任务前后切换；S：搜索结果导航有文档。模型／强度／审批路径待验 | 候选；未验证其 UIA 控件及动作覆盖 | 本轮未确认控制既有桌面任务的公开接口；不能拿 CodeBuddy CLI、模型 API 或 MCP 扩展代替证据 | 官网列出鸿蒙电脑版；优先核验 K/S。跨应用 A、任务接口未确认 | W1,W2,W3 |
| Codex 桌面／App Server | K：新建、模型菜单、审查等；S：菜单完成指定模型／强度需验证 | 候选；旧键盘实现是 Mac AX，不能充当 Windows UIA 证据 | App Server 可管理 thread/turn 与模型能力；与当前桌面会话同步需单独验证 | 本轮未找到原生 PC 版证据；鸿蒙客户端连接受控的远端服务可规划，不算本地 Codex | C1,C2,C3,L1 |
| Claude Chat／Cowork／Code／CLI | Code Desktop 有模型／强度／权限菜单快捷键；CLI 键表独立；Chat/Cowork 不能照搬 | 桌面候选；终端中的控件语义可能不完整 | Agent SDK 面向自己运行的 Claude Code 进程；不是任意已打开的 Claude Chat/Cowork 窗口遥控 API | 本轮未找到原生 PC 版证据；可研究远端 SDK 客户端，商业账户接入另遵官方规则 | A1,A2,A3,A6 |
| 豆包桌面 | Windows 版存在；本轮没有可确认的默认 Agent 快捷键／完整序列 | 候选，需在已登录客户端检查 | 未确认既有桌面聊天／任务控制接口；模型推理 API 不算同一个产品会话 | 本轮未确认原生 PC 版；手机鸿蒙版与网页访问都不能代替 PC 验收 | D1,D2 |
| Kimi Work／Code Desktop／CLI | Code Desktop 的新建、文件夹等有键表；CLI 的 Plan、停止、引导、审批有键表；Work 单列 | 桌面候选；CLI 审批优先采用明确键序列／协议 | Kimi Code 的 kimi web 有实验性 REST/WS；不能推定 Work/普通聊天可用同一协议 | 本轮未确认原生 PC 版；官方 Code 远控可研究为入口，鸿蒙浏览器适配及自定义键盘接入待验 | K1,K2,K3,K4,K6,K7 |
| OpenCode Desktop／TUI／Server | TUI：Leader、近期模型循环、Agent／变体切换；Desktop 不继承整套 TUI 键表 | 桌面候选；TUI 不保证每个菜单项都有 UIA 节点 | Server HTTP 接口及 TUI 控制端点明确；必须连接当前实例，另起 serve 会创建另一服务 | 本轮未找到原生 PC 版证据；可规划 Web／自有客户端连远端 Server，非本机 Agent 执行 | O1,O2,O4 |
| 小艺系统入口 | Windows 配套华为鼠标的 AI 入口有官方说明；不能映射成未知的普通组合键 | 配套窗口候选，需检查 UIA | 本轮未确认面向普通第三方的现有小艺会话控制 API | K：Harmony+S 为小艺搜索；HarmonyOS 6+ 智慧划词在符合条件时用单击 Ctrl。智慧键短按/长按为专用入口，HID 等价事件待验；完整会话控制未确认 | H1,H2,H3 |

接口的具体依据与边界：

- **Codex**：`model/list` 提供可用模型与支持的 effort；`turn/start` 可指定模型／强度，`turn/interrupt`、`turn/steer` 管理活动轮次。选择器应读取实际能力。旧项目的 `thread/settings/update` 只作历史实现记录，当前适配应核对实际协议，不能直接当稳定接口复制。[C3,L1]
- **OpenCode**：会话 HTTP API 与 `/tui/open-models` 等 UI 控制端点并存；打开模型选择器仍不等于设置模型。其 TUI 本身连接服务，控制既有 TUI 需要找到同一实例；不能另起一个服务后声称接管原会话。[O4]
- **Kimi Code**：`kimi web` 暴露实验性 REST/WS；`GET /api/v1/models` 提供支持档位，`POST /api/v1/sessions/{id}/profile` 可设置 model/thinking/plan_mode，审批接口绑定请求 ID。以安装版 OpenAPI 为准，读取 snapshot/事件核验效果；HTTP 200 不等于业务成功。是否与用户当前 Desktop 共享同一服务和会话仍需验证。[K6]
- **Claude**：Agent SDK 能让自建应用运行 Claude Code 引擎并处理会话与权限。将它用于现有桌面界面的同步控制，需要额外证据；也不能假定 SDK 自动继承用户的 claude.ai 登录授权。[A6]
- **WorkBuddy、豆包、小艺**：本轮“未确认公开会话控制 API”是资料缺口，不表示永远不能合作接入。MCP 通常是应用调用外部工具，单凭支持 MCP 不能推导外部键盘可以反向设置该应用模型或批准请求。

## 4. 旧 Codex 键盘可复用的正确经验

当前本地复核报告记录的链路为：能力接口→手机模型下拉／离散强度滑杆→Bridge 按可访问性语义定位 Mac 菜单→App Server 配置与状态回传。[L1]

可以复用的是“手机发送明确意图，例如设为 high，再由应用适配器执行”。不能复用成“所有应用只需发送 ↑↓Enter”。旧实现同时存在英文标签耦合、部分强度标签合并、缺少最终 UI 读回、UI/API 双写不原子等限制。新方案应选择一个权威写入路径，其他路径用于验证与同步；不能把两次写入都成功作为未经证明的假设。

模型、强度、工作模式、权限方式必须是四个独立字段。低／中／高是某些模型的选项，不能把它们强加给只有变体、开关或自动档位的应用。

## 5. 对九键自适应区的建议

**九格是容量上限，先按任务阶段生成，再按该应用已接通的能力裁剪。** 这是布局建议，尚无七应用实际频次数据，也未完成手机触达测试。

准备输入时的一个候选九格：

| 位置 | 第一列 | 第二列 | 第三列 |
| --- | --- | --- | --- |
| 第1行 | 新建任务 | 搜索任务 | 更多 |
| 第2行 | 模型 | 思考强度 | 工作模式 |
| 第3行 | 上一任务 | 下一任务 | 查看结果 |

（上一／下一任务）实际占两格。没有模型或强度能力的应用移除相应项，不画失效占位。权限方式、过程详情、分支、压缩和会话回退通常进“更多”；截图、语音、编辑、已有发送入口复用固定区域。

- **执行中**：保持仍可用按钮的位置；把无当前意义的配置格换成“停止”“立即补充”“查看过程”。是否能切换模型以及何时生效以应用状态为准，不能暗示修改正在执行的推理。
- **待审批**：临时替换为原请求的真实选项，通常 2–4 个大目标即可。保留“仅本次／本会话”等范围；关闭或超时即撤销映射。
- **展开模型／强度**：一个入口打开临时列表／离散档位控件；若提供（降低／提高），读出当前合法档位后提交目标值，避免盲发多次循环键。
- **只有 HID 时**：用户看电脑菜单，手机提供（上一项／下一项）、确认、返回。它可辅助操作，但不能显示未经读取的模型名、强度或批准范围。若不能识别实际请求，不自动生成“允许一次／始终允许”等按钮。

“可以用键盘完成”足以证明一条可研究的执行路线；要让手机自动生成带正确标签的面板，还需要知道当前应用、焦点、会话、模式、菜单选项和已选值。能力获取与动作执行应分开记录。

## 6. 接入顺序与验收口径

1. **Windows 基础组**：WorkBuddy 搜索／切任务，Codex 与 Claude Code 的新建／菜单，Kimi Code 的执行与审批，OpenCode TUI 的明确序列。先逐项核实安装版与焦点。
2. **Windows 精确参数组**：优先研究 Codex、OpenCode、Kimi Code 的同一会话协议；真实桌面状态没有对应协议时检查 UIA。不能用独立新会话冒充原窗口设置成功。
3. **鸿蒙本地基础组**：先验 WorkBuddy 鸿蒙版键位、小艺标准键入口及 HID 接收。专用智慧键与普通键分别测试；缺少跨应用可访问性时保留电脑端可见菜单操作。
4. **鸿蒙完整自适应组**：需要目标应用主动提供状态／命令，或系统合作接口；远端 Agent 服务方案另作为跨设备产品形态验证。

每个动作至少记录：应用和版本、端形态、目标会话、前置状态、执行路线、完成条件及证据。验证“键已抵达→目标 UI 改变→同一任务权威状态一致”；模式／模型还需检查下一轮实际生效值。导航途中焦点变化就取消剩余序列；断线后不重放发送／批准。

本轮校验范围：来源对应、表格与 CSV 导出一致性。没有运行应用构建或测试，因为本轮只修改研究材料；没有将资料检查表述为设备实测。

## 来源

前轮逐应用键位明细见 [agent-shortcut-windows-harmony-research.md](agent-shortcut-windows-harmony-research.md)。以下为本报告直接使用的依据；未知项保留未知。

- [P1] [Microsoft SendInput](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput)
- [P2] [Microsoft UI Automation control patterns](https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-controlpatternsoverview)
- [P3] [OpenHarmony AccessibilityExtensionContext 与废弃说明](https://github.com/openharmony/docs/blob/master/zh-cn/application-dev/reference/apis-accessibility-kit/js-apis-inner-application-accessibilityExtensionContext.md)
- [W1] [WorkBuddy 官网平台入口](https://www.workbuddy.cn/)
- [W2] [WorkBuddy 任务管理](https://www.workbuddy.cn/docs/workbuddy/Task-Management)
- [W3] [WorkBuddy 右侧边栏](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Right-Sidebar)
- [C1] [Codex 桌面命令](https://learn.chatgpt.com/docs/reference/commands)
- [C2] [Codex Windows](https://learn.chatgpt.com/docs/windows/windows-app)
- [C3] [Codex App Server](https://learn.chatgpt.com/docs/app-server)
- [A1] [Claude Code Desktop](https://code.claude.com/docs/en/desktop)
- [A2] [Claude Code CLI](https://code.claude.com/docs/en/interactive-mode)
- [A3] [Claude Desktop 导航](https://academy.claude.com/tutorials/navigating-the-claude-desktop-app)
- [A6] [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview)
- [D1] [豆包桌面下载](https://www.doubao.com/download/desktop)
- [D2] [华为：Windows 豆包安装](https://consumer.huawei.com/cn/support/content/zh-cn16111117/)
- [K1] [Kimi Code Desktop 设置与快捷键](https://www.kimi.com/code/docs/kimi-code-desktop/settings-and-extensions.html)
- [K2] [Kimi Code CLI 快捷键](https://www.kimi.com/code/docs/kimi-code-cli/reference/keyboard.html)
- [K3] [Kimi Work 发布日志](https://www.kimi.com/help/kimi-work/release-notes)
- [K4] [Kimi 官方平台说明](https://www.kimi.com/news/kimi-k3)
- [K6] [Kimi Code 服务 API](https://www.kimi.com/code/docs/kimi-code-cli/reference/server-api.html)
- [K7] [Kimi Code Desktop 远程控制](https://www.kimi.com/code/docs/kimi-code-desktop/remote-control.html)
- [O1] [OpenCode 键位](https://opencode.ai/docs/keybinds/)
- [O2] [OpenCode Windows](https://opencode.ai/docs/windows-wsl/)
- [O4] [OpenCode Server](https://opencode.ai/docs/server/)
- [H1] [华为：鸿蒙电脑快捷键与热键](https://consumer.huawei.com/cn/support/content/zh-cn16050634/)
- [H2] [华为：小艺 Mini 窗与智慧划词](https://consumer.huawei.com/cn/support/content/zh-cn16073812/)
- [H3] [华为：Windows 智能鼠标管家](https://consumer.huawei.com/cn/support/content/zh-cn16093379/)
- [L1] [本地旧 Codex 键盘源码复核](codex-keyboard-model-effort-implementation-review.md)
- [L2] [本地 HID 探针验证记录](hid-probe-validation.md)
