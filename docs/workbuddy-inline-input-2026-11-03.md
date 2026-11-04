# WorkBuddy 参数与输入流程修正 · 2026-11-03

## 范围与证据

本轮仅源码、本地浏览器、原生接口模拟和生产 Web 构建。未安装或操作手机／平板、未提交真实 Mac Agent 任务、未调用真实生成或润色模型、未修改 Figma、未发布。既有语音修复和其他聊天的未提交修改保留。

视觉依据：[句内参数设计 1372:25427](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1372-25427)及用户提供的 WorkBuddy 5.9.3 首页／对话截图。本文件记录实现与验收，不是 Design 规则镜像。旧假桌面与新建即对话约定由 AGENTS.md 的本轮条款覆盖。

## 实现

- `packages/core/live-workbuddy.ts`：演示与 Mac 共用规则，补齐黑／红／灰简称、主色和字体角色归一、照片口语、相邻角色和值之间的 ASR 标点。直接使用原文偏移，不移动原始文字；不同用途分别保留，同用途后一次明确表达覆盖先前表达。既有手选值在原参数表达未改变时保持优先。
- `packages/core/polish-parameters.ts`：保护带参数的分句，其他正文仍可润色；返回后要求每个保护标记恰好出现一次，复核完整正文的参数身份、用途、值和材料邀请。选区只包含参数的一部分时也不能绕过完整正文校验。恢复原文片段后重新定位范围，手调值和材料仍归原任务。
- `apps/web/src/use-phone-editing.ts`：共享回填、目标／版本／选区检查与撤销继续使用原路径；补充 6.5 秒语音收尾恢复，避免丢失结束回调时永久禁用按钮。普通停止后最终转写落定即可发送，稳定 400 ms 后开放润色。
- `apps/harmony/shared/Gemini.ets`：现有润色系统指令补充保护标记规则；不变更模型、服务或凭据路径。本文件已有的安全导入变更不是本轮新增。
- `apps/web/src/sentence-composer.tsx`、`sentence-composer.css`：共享 `--glass-inline-outline` 对应语义 `glass/inline-outline`，浅色 30%、深色 44%；颜色值只用于色点。1 px 内阴影描边不占新空间，保留透明边框原有占位、28 px 视觉面与 32 px 行盒。打开态独立于 Suggested／Default，关闭恢复。去掉旧箭头生成，保留选区。
- `phone-live-workbuddy.css`、`workbuddy-elastic-input.css`：移除冲突的旧句内白色边框和尺寸定义，由共享样式负责；未修改框外 Action Chip、润色组或 InputDock 内部几何。
- `web-deck-composer.tsx`：空画板打开不再禁用发送；真实未采用笔迹、待传材料、失效目标、语音中和正在提交等限制仍有效。润色不因未采用草图而整体禁用。
- `input-session-ui.tsx`、`input-session-ui.css`、`phone.tsx`、`connection-access.tsx`、`packages/core/input-session.ts`：连接取得权威状态后显示当前应用控制器，不走假手机桌面或额外启用确认。未知状态使用连接／恢复界面。已知 WorkBuddy 可见 Composer 绑定其原任务；后台／断线释放控制，重新同步后恢复。每个界面保留一个连接入口；微信推荐仍等待读屏。
- `packages/core/workbuddy-input.ts`、`workbuddy-deck.ts`、`workbuddy.ts`、`apps/web/src/workbuddy.tsx`：未发送草稿映射首页，并将首页 Composer 绑定选中的草稿；新建草稿从第一轮输入初始化参数状态，保证目标投影不依赖先开控件；制作 PPT 仅填入当前草稿意图，不跳任务或发送。接受显式发送后进入对话，既有成果和对话保留。

演示台词、五类控件、七个入口与边界见 [演示脚本](../samples/workbuddy-input-script.md)。

## 本地验证

| 层级 | 结果 |
| --- | --- |
| 核心规则、协议、原生模拟 | `npm test`：202 / 202 通过。含角色归一、断句、否定、手调优先、参数保护、部分选区、首页草稿归属；保留语音片段与震动、USB 重连等现有模拟回归。 |
| 浏览器 | 21 个不同用例通过，分两批与末次相关复验执行。具体命令如下。 |
| 类型／生产构建 | `npm run check`、`npm run build` 通过。Vite 仍报告现有大 chunk 体积提示，不影响构建。 |
| 真机／真实模型 | 本轮未验证，不把模拟 ASR、Gemini、Mac 回执或文件选择当作真实设备成功。 |

浏览器覆盖：

- 390×844、390×700 的收起／键盘／触控板；七个 Chip、28 px 面、激活／关闭恢复、主题切换与深色 44%；发送、框外润色和智慧语音可达。
- 多参数连续听写的模拟片段、主动结束和权威回传；结束后发送／润色恢复，缺失结束回调可恢复，停止不提交。
- 空画板允许发送，存在未采用笔迹阻止发送但仍允许润色，清空后恢复。
- 润色加载、失败、重复触发阻止、旧结果拒绝、回填／撤销、手改颜色与时长、文件／照片／草图材料引用保持。
- 连接直接进入控制器；未发送草稿首页；PPT 意图与参数操作不跳页；接受发送进入底部 Composer 对话。故意阻断生成网络的用例如实显示失败，不冒充生成成功。
- Mac 与演示共享 UI、任务条、主题和面板持久化；Mac 模拟投影回传；微信读屏与采用不发送；选区格式、触控板拖选；原生模拟材料分块／哈希失败与重试、迟到选择仍归原任务。

复现（浏览器测试使用已有 localhost:5188 开发页，并独占测试桥 5191；各命令顺序执行）：

```sh
npm test
npm run check
npx playwright test tests/inline-parameters.spec.ts tests/live-workbuddy.spec.ts tests/web-deck-native.spec.ts tests/design-sync.spec.ts tests/shared-dock.spec.ts tests/unified-controller.spec.ts
npx playwright test tests/continuous-speech.spec.ts tests/chatgpt-polish.spec.ts
npm run build
```

## 视觉与日志

忽略目录 `artifacts/inline-parameters/` 保存六对同文案、同视口截图：

- `before-844-collapsed.png` / `after-844-collapsed.png`，以及相同尺寸的 keyboard、trackpad。
- `before-700-collapsed.png` / `after-700-collapsed.png`，以及相同尺寸的 keyboard、trackpad。
- `active-700-color.png` / `closed-700-color.png` 检查打开、关闭恢复。
- `tablet-home.png` / `tablet-conversation.png` 检查主页及发送后布局；后者为主动阻断模型网络的本地测试失败状态。
- `manifest.json` 记录图片尺寸、SHA-256、验证范围及日志。

日志位于 `artifacts/inline-parameters-{core,typecheck,build,regression-final,final-followup,last-regression,visual-final}.log`。保留早期失败日志：旧“主色”标签断言与 CSS 颜色序列化断言已按新角色和浏览器实际表示修正；没有弱化业务期望。完整历史浏览器套件没有全量运行。

## 待真机验收

- 新版在真实 ASR 断句、多颜色与照片台词下的识别、结束回调及按钮恢复。
- 当前手机 Gemini 对受保护标记的真实响应与参数回填／撤销。
- 原生文件／图库选择、实际材料传输与断线恢复，以及新版直达控制器的两种设备连接。
- 安装、签名包、USB 拔线独立运行均未做；本轮没有生成或安装新的 HAP。

## 本轮测试和文档文件

- 新增：`packages/core/inline-parameters.test.ts`、`tests/inline-parameters.spec.ts`、本记录、`samples/workbuddy-input-script.md`。
- 更新：`packages/core/demo-reset.test.ts`、`packages/core/design-session.test.ts`、`tests/design-sync.spec.ts`、`tests/enable-input.ts`、`tests/live-workbuddy.spec.ts`、`tests/web-deck-native.spec.ts`。
- 项目约定：`AGENTS.md` 顶部本轮条款。其余源码修改在“实现”逐项列出。
- `Speech.ets`、原生语音测试、润色密钥导入及组件注册表等本轮开始前已有修改继续保留，未把这些既有工作计为本轮新增功能。

## 后续授权安装 · 2026-11-03

用户追加“安装发布我要在真机测试”，本节为前述本地验证之后的独立证据。已在 AGENTS.md 记录两端构建、覆盖安装和启动授权；没有 GitHub/Drive 发布。

- Web 重新构建及两端 ArkTS 签名构建成功；版本仍为 **1.4.0**，两端构建代次 **1793736386755**。逐文件核对两包 Web 资源完全相同（入口构建标记及角色元数据单独处理）。
- SUP-AL90 手机与 MRDI-W10 平板均返回 `install bundle successfully` 和 `start ability successfully`。无卸载，未额外清应用数据；新代次按既有规则执行一次演示重置，保留原生配对、权限和密钥。
- 平板连接设置观察到“鸿蒙分布式已连接”；手机观察到“已连接 · Shino-MatePad Pro”。打开 WorkBuddy 后，手机直接出现任务条、当前草稿与固定智慧语音；平板展示新建任务首页。
- 观察到草稿开始变化后停止 UI 操作，将真实输入测试交给用户。没有代用户发送任务、调用 Gemini 或改动真实 Mac 文档。
- 新包的真人七入口识别、润色和发送流程，以及拔 USB 后独立运行，等待用户验收；此前浏览器结果不升级为这些项目的真机通过。

签名包与证据在 `artifacts/inline-parameters-release/`：

| 角色 | 文件 | SHA-256 |
| --- | --- | --- |
| 手机 | `input-agent-phone.hap` | `f1c28c0548391fca4aaa9ae5e063dafdbfc35407b70f5a6069d033c5c3ca034e` |
| 平板 | `input-agent-tablet.hap` | `3c37df23e9e72dddb89771b1b59b685f90afe576fe6258bbb31c36efb1ce044e` |

`manifest.json` 保存资源哈希与验证分层；`*-install.log`、`*-launch.log`、`*-package-info.json` 保存工具回执与包信息；`*-launch`、`*-connection`、`*-workbuddy` 的 PNG/JSON 为真实设备画面和布局。HAP 哈希来自实际提交安装的本地文件，不声称直接读回了系统安装目录内的 HAP 字节。

## ASR follow-up: 主题测试，红色

Added the observed 主题测试 homophone as a narrowly scoped theme-color role alias in the shared demo/Mac WorkBuddy parser. It only matches an adjacent known color via the existing bounded punctuation/copula grammar; it does not rewrite original text or broaden arbitrary 测试 phrases. Original offsets, independent background/font roles, negation, explicit correction, manually selected values and polish masking remain intact.

Verification includes intermediate transcript without color, final transcript with red, rendering/opening the editable color chip, source prose preservation, negative/unrelated clauses and three colors together. Actual ASR acoustic output is unchanged; this fix tolerates its reported transcript. No model invocation or task submission is required to recognize the chip.

Validation: 209 core tests, 10 browser tests, TypeScript/production build and both native builds passed. An initial unrelated browser fill raced editor initialization; the test now awaits editable readiness and the full relevant suites pass. Device install/launch succeeded; actual user pronunciation remains to be verified. Evidence in `artifacts/asr-theme-color/`.
- tablet: generation 1793741702534, SHA-256 `7da194a3c586440e2026db2da95be71b0bff3dd25327ddbe5912ebe2adb208b7`.
- phone: generation 1793741702534, SHA-256 `362fc071ac977f8c2a801e7ea6a1ea33e670cad1ee26ef26ea4482e5a7683127`.
Distributed reconnect verified after upgrade; phone shows connected tablet WorkBuddy controller. No task submitted.
