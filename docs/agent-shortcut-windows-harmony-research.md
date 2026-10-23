# Agent应用快捷键：Windows与鸿蒙PC

历史研究记录。逐应用完整键表已保留在 [Agent 通用操作 Survey](../survey/agent-common-operations/agent-common-operations-survey.md) 附录；通用动作、接口与多模态/widget 结论以后续合并稿为准。

调研日期：2026-10-20。对象：WorkBuddy、Codex、Claude、豆包、Kimi、OpenCode、小艺。依据官方公开资料及本机官方网页观察；未进行 Windows／鸿蒙PC真机按键验收。本文是关键动作适配研究，不声称覆盖每个版本的全部快捷键。

更新：通用动作、快捷键／菜单序列／可访问性／接口四路线，以及 Windows／鸿蒙PC 的最新适配边界，见 [通用操作平台矩阵](agent-common-actions-platform-matrix.md)。本文保留逐应用键位明细；打开选择器不等于完成具体参数设置。

## 结论

1. **Windows 可以先建立较完整的 Agent 操作库；鸿蒙 PC 目前应优先核验 WorkBuddy 与小艺。** WorkBuddy 官网已有鸿蒙 PC 下载入口，但其任务快捷键文档只提供 Windows/Mac 对照。应用有鸿蒙版，不等于其 Windows 键位全部有效。
2. **九键适合一层当前场景。** 应按“输入任务→执行→等待选择/授权→结果审阅”更换动作，不需要把所有快捷键挤进同一屏。这是设计判断，目前没有这些应用的真实频次数据。
3. **产品、端、模式、焦点都必须进入适配条件。** Claude Chat/Cowork/Code/CLI、Kimi Chat/Work/Code Desktop/CLI，以及 OpenCode Desktop/TUI 的快捷键不能混表执行。

## 口径与固定键扣除

沿用项目清单：固定七键为全选、复制、剪切、粘贴、删除、撤销、重做。本表不重复普通文本编辑键；截图、语音等若已由固定入口完成，也不重复占自适应格。搜索与 Esc 尚不是所有场景的共同固定键。

扣除是语义层面的扣除，不能向所有应用统一发送 Ctrl+A/C/Z/Y：终端的 Ctrl+A 可能是行首，Ctrl+C 可能中断任务，Ctrl+Y 可能是粘回文本。回退整个 Agent 会话／代码变更仍是独立动作，不能冒充文本撤销。

括号中的前后操作是一个功能组，但两个动作仍占两个触控目标；显示/隐藏等单一切换命令才可计一个键。“未知”不表示不支持，也不表示厂商已规划。原 Excel 的单号与规划状态不移植到本次新研究。

## 平台对照

| 产品 | Windows | 鸿蒙PC | 适配判断 |
| --- | --- | --- | --- |
| WorkBuddy | 官方桌面版；任务管理快捷键公开 | 官网提供 PC 安装入口；快捷键待核验 | 两端最值得对照实测；不能直接复制键位表 [W1–W3] |
| Codex | 当前桌面文档有 Windows/Codex 模式键表 | 未找到官方原生 PC 安装包与键表 | Windows 先做；浏览器或远程入口单独验收 [C1–C2] |
| Claude | 桌面 Chat/Cowork/Code 与 CLI；Code 页公开键表 | 未找到官方原生 PC 安装包与键表 | 桌面 Code 与 CLI 分开适配 [A1–A3] |
| 豆包 | 官方桌面下载；华为支持页也确认 Windows 安装 | 本轮未确认 PC 原生版；手机/平板生态资料不算 PC 证据 | 键位缺口较大，需实际安装版快捷键面板 [D1–D2] |
| Kimi | Work 桌面、Code Desktop、CLI 分别存在 | 官方移动端支持鸿蒙，不能推定鸿蒙 PC 版 | 当前可先做 Kimi Code Desktop/CLI；普通聊天端另验 [K1–K4] |
| OpenCode | Desktop/TUI；官方建议 Windows 用 WSL 获得完整终端体验 | 未找到官方原生 PC 支持 | Web 连接远程服务是另一种架构，不能算本机原生运行 [O1–O3] |
| 小艺 | 华为智能鼠标管家提供小艺入口与框选 | 系统级智慧键、小艺搜索、划词入口有官方说明 | Windows 依赖配套入口；鸿蒙与系统结合更深 [H1–H3] |

“未找到”限定本次已检查的官网与文档，不宣称平台绝对不可运行。CLI 的 Windows 键位仍取决于终端、版本及用户自定义。网页能打开，也不代表键位、附件或电脑控制已适配鸿蒙。

## 各应用关键动作

以下键位为官方默认说明或明确标注的观察值。成对功能合写。CSV含逐行来源链接，适合Excel筛选。

### WorkBuddy

| 端/模式 | 动作 | Windows | 鸿蒙PC | 条件 / 证据 |
| --- | --- | --- | --- | --- |
| 桌面 | 搜索任务 | Ctrl+K | 客户端已提供；本键位待核验 | 应用内全局搜索；官方文档 [W2] |
| 桌面 | 定位当前任务 | Ctrl+Shift+E | 客户端已提供；本键位待核验 | 在任务列表定位当前任务；官方文档 [W2] |
| 桌面 | （上一任务／下一任务） | （Ctrl+[／Ctrl+]） | 客户端已提供；本键位待核验 | 不是文本光标移动；官方文档 [W2] |
| 桌面 | 对话内查找 | Ctrl+F | 客户端已提供；本键位待核验 | 焦点在对话；网页焦点时可能搜索网页；官方文档 [W3] |
| 桌面 | （放大网页／缩小网页） | （Ctrl++／Ctrl+-） | 客户端已提供；本键位待核验 | 内置浏览器；官方文档 [W3] |
| 桌面 | 重置网页缩放 | Ctrl+0 | 客户端已提供；本键位待核验 | 内置浏览器；官方文档 [W3] |
| 桌面 | （上一结果／下一结果） | （↑／↓） | 客户端已提供；本键位待核验 | 搜索弹层；官方文档 [W2] |
| 桌面 | 打开搜索结果 | Enter | 客户端已提供；本键位待核验 | 搜索结果选中；官方文档 [W2] |
| 桌面 | 切换搜索分类 | Ctrl+Tab | 客户端已提供；本键位待核验 | 搜索弹层；官方文档 [W2] |
| 桌面 | 关闭搜索 | Esc | 客户端已提供；本键位待核验 | 搜索弹层；官方文档 [W2] |
| 桌面 | 归档所选任务 | E | 客户端已提供；本键位待核验 | 任务批量管理模式；随后确认；官方文档 [W2] |
| 桌面 | （勾选／取消勾选）任务 | X 或 Space | 客户端已提供；本键位待核验 | 任务批量管理模式；一个切换动作；官方文档 [W2] |

### Codex

| 端/模式 | 动作 | Windows | 鸿蒙PC | 条件 / 证据 |
| --- | --- | --- | --- | --- |
| 桌面 Codex 模式 | 新建会话 | Ctrl+N | 未查到官方原生PC版／键表 | 桌面 Codex；官方文档 [C1] |
| 桌面 Codex 模式 | 命令菜单 | Ctrl+Shift+P 或 Ctrl+K | 未查到官方原生PC版／键表 | 会话焦点；终端 Ctrl+K 含义不同；官方文档 [C1] |
| 桌面 Codex 模式 | （上一会话／下一会话） | （Ctrl+Shift+Tab／Ctrl+Tab） | 未查到官方原生PC版／键表 | 可能切换标签，取决于界面；官方文档 [C1] |
| 桌面 Codex 模式 | 对话内查找 | Ctrl+F | 未查到官方原生PC版／键表 | 当前对话；官方文档 [C1] |
| 桌面 Codex 模式 | 搜索历史会话 | 默认未分配 | 未查到官方原生PC版／键表 | 可以在设置中绑定；官方文档 [C1] |
| 桌面 Codex 模式 | 下一个待处理会话 | Ctrl+Alt+A | 未查到官方原生PC版／键表 | Codex 模式；官方文档 [C1] |
| 桌面 Codex 模式 | 模型选择 | Ctrl+Shift+M | 未查到官方原生PC版／键表 | 打开选择器，不等于自动选模型；官方文档 [C1] |
| 桌面 Codex 模式 | 打开文件夹 | Ctrl+O | 未查到官方原生PC版／键表 | Codex / Work；官方文档 [C1] |
| 桌面 Codex 模式 | 查找文件 | Ctrl+P | 未查到官方原生PC版／键表 | Codex；官方文档 [C1] |
| 桌面 Codex 模式 | （显示／隐藏）文件树 | Ctrl+Shift+E | 未查到官方原生PC版／键表 | Codex；官方文档 [C1] |
| 桌面 Codex 模式 | 打开变更审查 | Ctrl+Shift+G | 未查到官方原生PC版／键表 | Codex；官方文档 [C1] |
| 桌面 Codex 模式 | （显示／隐藏）终端 | Ctrl+` | 未查到官方原生PC版／键表 | Codex；官方文档 [C1] |
| 桌面 Codex 模式 | 打开旁支对话 | Ctrl+Alt+S | 未查到官方原生PC版／键表 | Codex；官方文档 [C1] |
| 桌面 Codex 模式 | 归档会话 | Ctrl+Shift+A | 未查到官方原生PC版／键表 | 当前会话；官方文档 [C1] |
| 桌面 Codex 模式 | （同意／拒绝）请求 | （Enter／Esc） | 未查到官方原生PC版／键表 | 仅当前授权请求已打开；按请求文案显示；官方文档 [C1] |
| 桌面 Codex 模式 | 恢复上一条输入 | ↑ | 未查到官方原生PC版／键表 | 输入框为空；官方文档 [C1] |

### Claude

| 端/模式 | 动作 | Windows | 鸿蒙PC | 条件 / 证据 |
| --- | --- | --- | --- | --- |
| 桌面 Code 页 | 新建会话 | Ctrl+N | 未查到官方原生PC版／键表 | Code 页；官方文档 [A1] |
| 桌面 Code 页 | （上一会话／下一会话） | （Ctrl+Shift+Tab／Ctrl+Tab） | 未查到官方原生PC版／键表 | Code 页；官方文档 [A1] |
| 桌面 Code 页 | 停止当前响应 | Esc | 未查到官方原生PC版／键表 | Code 页正在响应；官方文档 [A1] |
| 桌面 Code 页 | 模型选择 | Ctrl+Shift+I | 未查到官方原生PC版／键表 | Code 页；官方文档 [A1] |
| 桌面 Code 页 | 思考强度选择 | Ctrl+Shift+E | 未查到官方原生PC版／键表 | Code 页，模型支持时；官方文档 [A1] |
| 桌面 Code 页 | 权限模式菜单 | Ctrl+Shift+M | 未查到官方原生PC版／键表 | Code 页；仅打开菜单；官方文档 [A1] |
| 桌面 Code 页 | （显示／隐藏）变更面板 | Ctrl+Shift+D | 未查到官方原生PC版／键表 | Code 页；官方文档 [A1] |
| 桌面 Code 页 | （显示／隐藏）浏览器 | Ctrl+Shift+B | 未查到官方原生PC版／键表 | Code 页；官方文档 [A1] |
| 桌面 Code 页 | 选取网页元素 | Ctrl+Shift+S | 未查到官方原生PC版／键表 | Code 页内置 Browser；官方文档 [A1] |
| 桌面 Code 页 | （显示／隐藏）终端 | Ctrl+` | 未查到官方原生PC版／键表 | Code 页；官方文档 [A1] |
| 桌面 Code 页 | 旁支提问 | Ctrl+; | 未查到官方原生PC版／键表 | Code 页；官方文档 [A1] |
| 桌面 Code 页 | 切换过程详情 | Ctrl+O | 未查到官方原生PC版／键表 | Code 页，不是打开文件；官方文档 [A1] |
| 桌面 Code 页 | 采纳建议输入 | Tab 或 → | 未查到官方原生PC版／键表 | 输入为空且出现建议；采纳不发送；官方文档 [A1] |
| 桌面 Chat/Cowork | 全局唤起 | 设置中自定义；默认值未确认 | 未查到官方原生PC版 | 新版 Academy 说明支持 Windows 唤起；旧 Mac 文档存在相反表述；官方资料存在版本差异 [A3,A5] |
| Chat／Artifact | 快捷键帮助 | Ctrl+/ | 浏览器版本待核验 | 页头显示 Claude 快捷键；文档内部显示文档快捷键；官方文档 [A4] |
| Claude Code CLI | 停止当前运行 | Esc | 未查到官方原生PC支持 | 运行中；弹窗时可能关闭或拒绝；官方文档 [A2] |
| Claude Code CLI | 模型选择 | Alt+P | 未查到官方原生PC支持 | Windows 终端；与桌面 Code 页不同；官方文档 [A2] |
| Claude Code CLI | 任务清单 | Ctrl+T | 未查到官方原生PC支持 | 任务 checklist；官方文档 [A2] |
| Claude Code CLI | 展开过程记录 | Ctrl+O | 未查到官方原生PC支持 | CLI transcript viewer；官方文档 [A2] |
| Claude Code CLI | 历史输入搜索 | Ctrl+R | 未查到官方原生PC支持 | CLI 输入；官方文档 [A2] |
| Claude Code CLI | 回到历史节点 | Esc 然后 Esc | 未查到官方原生PC支持 | 输入为空时；有草稿时先清空草稿，不能盲发双 Esc；官方文档 [A2] |
| Claude Code CLI | 轮换权限模式 | Shift+Tab | 未查到官方原生PC支持 | CLI；不能作为直接切换到某个确定模式；官方文档 [A2] |
| Claude Code CLI | 换行 | Ctrl+J | 未查到官方原生PC支持 | CLI 输入；Shift+Enter 依终端支持；官方文档 [A2] |

### 豆包

| 端/模式 | 动作 | Windows | 鸿蒙PC | 条件 / 证据 |
| --- | --- | --- | --- | --- |
| Windows 桌面 | 唤起／新对话／新任务／停止 | 公开默认键位未核实 | 未查到鸿蒙PC版证据 | 保留为待核验动作；不采用仿官网的 Alt+Space 等说法；键位未知 [D1,D2] |
| Web（Mac 浏览器观察） | （新工作任务／新对话） | Windows 未确认；观察值为 Mac ⌘J／⇧⌘K | 浏览器适配未测 | 官方页面初始 UI 可见；随后触发地区登录限制，未读到完整快捷键面板；Mac UI观察；不可当作Windows证据 [D3] |

### Kimi

| 端/模式 | 动作 | Windows | 鸿蒙PC | 条件 / 证据 |
| --- | --- | --- | --- | --- |
| Kimi Code Desktop | 新建会话 | Ctrl+N | 未查到官方原生PC版／键表 | Kimi Code Desktop；官方文档 [K1] |
| Kimi Code Desktop | 打开文件夹 | Ctrl+O | 未查到官方原生PC版／键表 | Kimi Code Desktop；官方文档 [K1] |
| Kimi Code Desktop | 关闭标签 | Ctrl+W | 未查到官方原生PC版／键表 | Kimi Code Desktop；官方文档 [K1] |
| Kimi Code Desktop | （显示／隐藏）终端 | Ctrl+` | 未查到官方原生PC版／键表 | Kimi Code Desktop；官方文档 [K1] |
| Kimi Code Desktop | 截图 | Ctrl+Shift+S | 未查到官方原生PC版／键表 | 若现有固定截图入口覆盖本动作，不重复占自适应格；官方文档 [K1] |
| Kimi Code Desktop | 打开设置 | Ctrl+, | 未查到官方原生PC版／键表 | Kimi Code Desktop；官方文档 [K1] |
| Kimi Code Desktop | 全局唤起 | 默认未分配 | 未查到官方原生PC版／键表 | 需用户在设置中绑定；官方文档 [K1] |
| Kimi Work | 全局唤起／按住语音 | 功能已有；默认组合未查明 | 不能用鸿蒙手机版推定PC版 | 发布日志确认功能；需读安装版设置；功能有文档；键位未知 [K3] |
| 普通聊天 Web | 新对话 | Windows 未确认；Mac UI 显示 ⌘K | 浏览器适配未测 | 不把 Mac 修饰键自动替换成 Ctrl；Mac UI观察；不可当作Windows证据 [K5] |
| Kimi Code CLI | 停止当前运行 | Esc | 未查到官方原生PC支持 | 运行中；弹窗时语义随弹窗；官方文档 [K2] |
| Kimi Code CLI | 计划模式 | Shift+Tab | 未查到官方原生PC支持 | CLI；官方文档 [K2] |
| Kimi Code CLI | 外部编辑器 | Ctrl+G | 未查到官方原生PC支持 | CLI；官方文档 [K2] |
| Kimi Code CLI | 展开工具输出 | Ctrl+O | 未查到官方原生PC支持 | CLI；官方文档 [K2] |
| Kimi Code CLI | 立即引导当前任务 | Ctrl+S | 未查到官方原生PC支持 | 执行中 steer；不是保存；官方文档 [K2] |
| Kimi Code CLI | 后台运行 Shell | Ctrl+B | 未查到官方原生PC支持 | 支持的 Shell 运行场景；官方文档 [K2] |
| Kimi Code CLI | 预览待批准差异 | Ctrl+E | 未查到官方原生PC支持 | 授权提示中；官方文档 [K2] |
| Kimi Code CLI | 选择并确认授权项 | ↑/↓ 后 Enter | 未查到官方原生PC支持 | 必须绑定当前提示和选中项；不可固定解释为 Yes；官方文档 [K2] |
| Kimi Code CLI | 拒绝当前授权 | Esc | 未查到官方原生PC支持 | 授权提示中；官方文档 [K2] |

### OpenCode

| 端/模式 | 动作 | Windows | 鸿蒙PC | 条件 / 证据 |
| --- | --- | --- | --- | --- |
| TUI | 命令菜单 | Ctrl+P | 未查到官方原生PC支持 | TUI；官方文档 [O1] |
| TUI | 新建会话 | Ctrl+X 然后 N | 未查到官方原生PC支持 | Leader 序列，非三键同时按；官方文档 [O1] |
| TUI | 会话列表 | Ctrl+X 然后 L | 未查到官方原生PC支持 | TUI；官方文档 [O1] |
| TUI | 模型选择 | Ctrl+X 然后 M | 未查到官方原生PC支持 | TUI；官方文档 [O1] |
| TUI | （下一Agent／上一Agent） | （Tab／Shift+Tab） | 未查到官方原生PC支持 | 主输入状态；弹窗内含义不同；官方文档 [O1] |
| TUI | （下一近期模型／上一近期模型） | （F2／Shift+F2） | 未查到官方原生PC支持 | TUI；官方文档 [O1] |
| TUI | 停止当前运行 | Esc | 未查到官方原生PC支持 | TUI 正在运行；官方文档 [O1] |
| TUI | 压缩上下文 | Ctrl+X 然后 C | 未查到官方原生PC支持 | TUI；官方文档 [O1] |
| TUI | 历史时间线 | Ctrl+X 然后 G | 未查到官方原生PC支持 | TUI；官方文档 [O1] |
| TUI | （回退消息／恢复消息） | （Ctrl+X 然后 U／Ctrl+X 然后 R） | 未查到官方原生PC支持 | 会话级回退，不能等同固定文本撤销/重做；官方文档 [O1] |
| TUI | Agent 列表 | Ctrl+X 然后 A | 未查到官方原生PC支持 | TUI；官方文档 [O1] |
| TUI | 模型变体切换 | Ctrl+T | 未查到官方原生PC支持 | TUI，能力取决于模型；官方文档 [O1] |
| 桌面输入框 | 取消浮层／停止响应 | Ctrl+G | 未查到官方原生PC版 | 官方 Desktop Prompt Shortcuts；不能整套套用 TUI 的 Leader 键；官方文档 [O1] |

### 小艺

| 端/模式 | 动作 | Windows | 鸿蒙PC | 条件 / 证据 |
| --- | --- | --- | --- | --- |
| 系统助手 | （打开／关闭）小艺 | 鼠标管家：默认双击鼠标 AI 键 | 短按智慧键 | Windows 入口需华为无线鼠标3及配套软件；硬件键，不是已知可注入的普通组合键；官方文档 [H1,H3] |
| 系统助手 | （进入／退出）语音模式 | 未确认普通键盘默认值 | 长按智慧键 | 侧边窗关闭时先打开并进入语音；这是与小艺对话，不等于文本听写；官方文档 [H1] |
| 系统搜索 | （打开／关闭）小艺搜索 | 未确认等价组合 | 鸿蒙键+S | 搜索入口，不等于小艺对话侧边窗；官方文档 [H1] |
| 划词 | 选中文字后问小艺 | 未确认等价组合 | 选中文字后单击 Ctrl | HarmonyOS 6.0+ 支持机型；部分应用例外；需智慧划词开启；官方文档 [H2] |
| 框选 | 截图后问小艺 | 鼠标 AI 键长按，框选后点问问小艺 | 本行未确认等价键位 | Windows 鼠标管家流程；截图与上传是不同步骤；官方文档 [H3] |
| 输入法听写 | （开始／停止）语音转写 | 本次未确认 | 语音键 | 有文本焦点且使用小艺输入法；应复用固定语音入口，不与智慧键语音混淆；官方文档 [H1] |

## 九键区怎么放

**九格作为上限，通常留一格“更多”，首层最多八个直接动作。** 以下是面板方案，不是厂商默认布局，也不是测得的高频排名。运行中优先让“停止”替换低优先级动作；出现授权/选项时覆盖局部面板，提示消失后恢复。未知绑定在接入完成前不应显示为可用键。

| 应用/模式 | 首层建议（括号内两项分别占格） | 容量与实现条件 |
| --- | --- | --- |
| WorkBuddy 桌面 | 搜索任务、定位当前任务、（上一任务／下一任务）、对话查找、更多 | 6格有公开 Windows 键位；运行中停止、新任务、附加材料可补入，但本轮未确认键位，必须读 UI/命令后绑定；鸿蒙先验键 |
| Codex 桌面 | 新建、命令菜单、（上一会话／下一会话）、模型、文件、审查、待处理会话、更多 | 恰好9格；运行时需停止入口，可替换“新建”，停止的具体绑定需进一步读取当前版本 UI |
| Claude 桌面 Code | 新建、（上一会话／下一会话）、模型、审查、选取网页元素、旁支提问、停止、更多 | 恰好9格；空闲时不显示不可用停止；Chat/Cowork不能套用本表 |
| Claude Code CLI | 模型、任务清单、历史输入、过程记录、历史回退、换行、停止、更多 | 8格；权限模式放更多；历史回退必须检查草稿状态 |
| Kimi Code Desktop | 新建、打开文件夹、终端、更多 | 4格；截图复用固定区；模型/停止待确认，不能为了填满而乱绑 |
| Kimi Code CLI | 计划模式、过程输出、外部编辑、引导任务、后台运行、停止、更多 | 7格，执行状态改变时按能力开关；授权时换成真实选项与差异预览 |
| OpenCode TUI | 新建、会话列表、模型、（下一Agent／上一Agent）、时间线、压缩、停止、更多 | 恰好9格；面板负责发 Leader 序列；Desktop需另一份映射 |
| 豆包 / Kimi普通聊天 / Kimi Work | 新任务/新对话、历史、模型/模式、添加材料、停止、更多 | 6类设计候选；不能把它们都标成已有快捷键，先检查目标产品 UI |
| 小艺（鸿蒙PC） | 问小艺、小艺搜索、选中文字提问、更多 | 4格候选；语音和截图先复用固定区；智慧键的远程触发需单独验证 |

### 建议用三种状态模板

| 状态 | 优先出现的动作 | 九键的意义 |
| --- | --- | --- |
| 写任务 | 新建、历史/任务搜索、附加材料、模型/模式、换行、更多 | 固定编辑七键继续服务草稿；“附加材料”可能需命令或 UI 操作 |
| 执行中 | 停止、补充/引导、查看过程、查看变更、切换任务、更多 | 执行状态不支持的动作收起；“继续”只有真实可恢复时出现 |
| 待选择/授权 | 实际选项、拒绝/取消、查看差异或详情 | 2–4个大目标通常比9个更合理；选项应保留“本次/本会话”等实际范围 |

上述模板是语义池。产品没有公开热键时，需要接入其命令接口或可访问性/界面动作；本次未验证 Windows UI Automation 或鸿蒙跨应用访问与注入权限，不能把“画出按钮”当成“执行已接通”。

## 对生成式面板的具体启发

1. **跨产品复用动作名称，按产品配置执行路径。** 例如“模型”：Codex 为 Ctrl+Shift+M，Claude 桌面 Code 为 Ctrl+Shift+I，Claude CLI 为 Alt+P，OpenCode TUI 为 Ctrl+X→M。用户看到同一个语义按钮，底层保留不同映射。
2. **同一个键冲突很常见。** Ctrl+O 在 Codex/Kimi Code Desktop 是打开文件夹，在 Claude Code 是过程记录；Ctrl+S 在 Kimi Code CLI 是引导正在运行的任务。这些冲突说明仅有快捷键字符串还不够。
3. **快捷键清单适合生成候选，不足以确定最终按钮。** 最小记录应包含应用身份、端/版本、当前模式、焦点、动作名称、键位或命令、启用条件和来源。没有状态信息时，优先生成新建、搜索、切换等稳定入口，避免推断执行控制。
4. **面板随任务阶段变化，比只按前台应用变化更重要。** Agent 执行中与批准弹窗的核心操作不同；进入生成文档/幻灯片的编辑器，又应使用文档/演示模式的格式与对象操作。
5. **Enter/Esc 是上下文动作，不是通用 Yes/No。** Enter 可能发送文本、打开任务、采纳选择或批准。映射授权时先确认弹窗、请求身份、选项、焦点；界面变了就使旧按钮失效。Claude Code CLI 与桌面不同，不能照搬 Shift+Tab。
6. **专用硬件键单列。** 智慧键、语音键、鼠标 AI 键涉及专用事件、短按/长按和厂商服务；现有资料只确认物理入口，没有证明手机键盘可以发送等价事件。

## 缺口与后续验收清单

| 缺口 | 本次结论 | 最小补证方式 |
| --- | --- | --- |
| WorkBuddy 鸿蒙快捷键 | 有客户端，键表缺平台确认 | 在鸿蒙安装版读取快捷键设置，测试搜索、任务切换、定位、停止和弹窗 |
| 豆包快捷键 | Mac Web 初始观察到新工作任务 ⌘J、新对话 ⇧⌘K；随后地区登录页阻断 | 在正常登录的 Windows 客户端打开快捷键设置；不按 Mac 值换算 |
| Kimi 普通端/Work | Mac Web 新对话显示 ⌘K；Work日志有唤起/语音功能，无确认默认键 | 分别读取 Chat/Work 的 Windows 端设置，避免误用 Code Desktop 表 |
| Claude 全局唤起 | 新 Academy 页面说 Windows 可配置；旧 Mac Quick Entry 页面说不支持该特性 | 以已安装版本设置为准；不写死某个 Alt+Space 组合 |
| OpenCode Desktop | 官方键表的大部分动作属于TUI，仅另列少量桌面输入操作 | 读取桌面实际命令面板；不能把 Ctrl+X Leader 直接当桌面全局键 |
| 执行成功 | 文档与页面观察，不是真机验收 | 逐键验证焦点、执行结果、目标切换、取消、断连；授权按钮不得回放 |

没有为缺少快捷键的产品编造“规划中的官方键”。如果产品支持功能但没有热键，我们的面板仍可规划该动作；应标“待接入”，并单独确定执行方法。

## 来源索引

所有链接检查于2026-10-20。Web UI观察仅为当前 Mac 浏览器；未推断 Windows/Harmony 的修饰键。

- [W1] [WorkBuddy 官网下载](https://www.workbuddy.cn/)
- [W2] [WorkBuddy 任务管理](https://www.workbuddy.cn/docs/workbuddy/Task-Management)
- [W3] [WorkBuddy 右侧边栏](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Right-Sidebar)
- [C1] [Codex 当前桌面命令表（官方原路径跳转到 ChatGPT Learn）](https://learn.chatgpt.com/docs/reference/commands)
- [C2] [Windows 桌面说明](https://learn.chatgpt.com/docs/windows/windows-app)
- [A1] [Claude Code 桌面参考](https://code.claude.com/docs/en/desktop)
- [A2] [Claude Code CLI 交互模式](https://code.claude.com/docs/en/interactive-mode)
- [A3] [Claude Desktop 导航与全局唤起](https://academy.claude.com/tutorials/navigating-the-claude-desktop-app)
- [A4] [Claude Docs 与快捷键帮助](https://support.claude.com/en/articles/16923645-get-started-with-claude-docs)
- [A5] [旧版 Mac Quick Entry 说明](https://support.claude.com/en/articles/12626668-use-quick-entry-with-claude-desktop-on-mac)
- [D1] [豆包官方下载](https://www.doubao.com/download/desktop)
- [D2] [华为支持：Windows 豆包安装](https://consumer.huawei.com/cn/support/content/zh-cn16111117/)
- [D3] [豆包官方 Web](https://www.doubao.com/)
- [K1] [Kimi Code Desktop 设置与快捷键](https://www.kimi.com/code/docs/kimi-code-desktop/settings-and-extensions.html)
- [K2] [Kimi Code CLI 键盘参考](https://www.kimi.com/code/docs/kimi-code-cli/reference/keyboard.html)
- [K3] [Kimi Work 发布日志](https://www.kimi.com/help/kimi-work/release-notes)
- [K4] [Kimi 官方产品发布与平台说明](https://www.kimi.com/news/kimi-k3)
- [K5] [Kimi 官方 Web](https://www.kimi.com/)
- [O1] [OpenCode 键位参考](https://opencode.ai/docs/keybinds/)
- [O2] [OpenCode Windows/WSL](https://opencode.ai/docs/windows-wsl/)
- [O3] [OpenCode 官网](https://opencode.ai/)
- [H1] [华为：鸿蒙电脑快捷键与热键](https://consumer.huawei.com/cn/support/content/zh-cn16050634/)
- [H2] [华为：小艺 Mini 窗与智慧划词](https://consumer.huawei.com/cn/support/content/zh-cn16073812/)
- [H3] [华为：Windows 智能鼠标管家 AI 小艺](https://consumer.huawei.com/cn/support/content/zh-cn16093379/)
