# 控制器与拍照返回修复 · 2026-11-03

## 问题与修改

1. **拍照导致断连**：NativeBridge 原先将系统相机／图库／文档选择器的临时后台当成普通离开，主动关闭分布式连接。现在为应用自己打开的选择器保留最多 180 秒的演示通道；语音和控制暂停，返回后核验权威状态、恢复输入会话。普通后台仍保留原有安全停止。真实 Mac 分支继续沿用现有暂停与可信自动重连，未宣称 Mac 相机全过程连接不变。
2. **微信空白**：PhoneScene 原先在读屏未完成时进入没有微信快捷内容的 PhoneGeneric。现在始终显示微信会话上下文，无有效输入目标时显示明确“输入回复”入口；读屏完成前不显示建议回复／服务动作，无归属写入仍被阻止。
3. **Codex 只能编辑两行**：共享 Composer 的 live-wb-scroll 包裹层不是 flex 容器，textarea 的 flex 因而不起作用；旧 Codex 类名也未接入。现在 textarea 填满实际可用编辑区并独立滚动，主题不决定布局。
4. **WorkBuddy 发送/生成恢复**：拍照后的 paused 会话现在在前台和权威同步就绪后恢复；原生 send 返回失败立即报告，不再空等回执；手机释放控制及断线不再暂停平板已接受的生成任务。新增只读命令结果查询，针对持久化未知发送查询平板回执/已接受消息，缺失时保留内容允许明确重试，查询、重连、材料采用都不会自动重发。

`release` 的全局含义区分手机控制释放与平板本地离开；平板自身后台或显式停止仍可暂停生成。收到的材料仍须完整字节及哈希验证。

## 修改范围

- 原生：`apps/harmony/shared/NativeBridge.ets`、`MacFiles.ets`。
- 手机：`phone.tsx`、`phone-wechat.tsx`、`phone-wechat-layout.css`、`phone-mac.tsx`、`phone-mac.css`、`input-session-ui.tsx`、`web-deck-composer.tsx`。
- 协议：`apps/web/src/runtime.ts`、`packages/core/model.ts`、`scripts/dev-bridge.mjs`。
- 验证：`packages/core/controller-recovery.test.ts`、`tests/controller-recovery.spec.ts`、`tests/web-deck-native.spec.ts`。

## 分层验证

- `npm test`：213 通过，包含真实 ArkTS 类在模拟依赖中的 picker/background 生命周期、phone release 不停止已接受任务，以及原有核心测试。
- `npm run check` / `npm run build`：通过。
- `npx playwright test tests/controller-recovery.spec.ts tests/web-deck-native.spec.ts tests/mac-auto-sync.spec.ts`：10 通过。覆盖微信进入、读屏与输入；390×844 / 390×700 下 Codex 收起/键盘/触控板三态和长文本滚动；回前台会话恢复；未知发送只查询不重发；通道拒绝立即返回；相机返回模拟后材料采用、明确发送、模拟生成和播放；损坏字节重试和 Mac 输入同步。
- 浏览器原生选择器/模型为模拟结果，不代替实际拍照、鸿蒙链路或真实 Gemini 验收。
- `python3 scripts/build-hap.py --preserve-demo tablet phone`：两端签名构建通过；相同 Web 快照，保留演示代次 1793741702534。两端 HAP 内 Web 资源逐文件匹配 dist。
- 实际识别 MRDI-W10 平板与 SUP-AL90 手机，均已覆盖安装并启动成功。未卸载、未清空演示、未配置或导出密钥、未向真实 Mac Agent 发送任务。
- **本轮未验证**：系统相机实际拍摄返回、两种真实设备链路、真实 Gemini 生成、拔 USB 后操作、真人连续听写、实际 Mac 多行输入。需要用户在修复版复试，不能由模拟通过推定。

## 构建与证据

- tablet: builtAt `1793745854873`; SHA-256 `bc8053e83bff1830b94490bc4c75b6579a535c4eb641c2ed2d682fcdf4aea693`；安装/启动返回成功。
- phone: builtAt `1793745854873`; SHA-256 `e1220da2f1701b22a27daaf0eb8bbb05b783bf9a30bac1178f5f6129af407490`；安装/启动返回成功。

忽略目录 `artifacts/controller-recovery/` 保存安装记录 release.json、浏览器截图；`artifacts/controller-recovery-{core,browser-final,build,hap}.log` 保存验证日志。未推送 GitHub 或上传 Drive。此前 `Input-Agent-完整交接包-2026-11-03.zip` 是此轮修复前快照，本轮没有覆盖它。


## 拍照返回二次修正（用户复测反馈后）

用户反馈上一版仍然“拍照后断连，之后又自动恢复”，因此上一版不计为拍照链路验收通过。只读检查现存日志未取得该次分布式失败记录，不能据此断言底层从未断开。

查到并修正两处代码问题：
- 分布式前台刷新将权威状态待核验与实际断连混为同一状态，导致连接错误判断、输入页卸载和材料等待被取消。现在独立记录通道可用性与输入就绪；已建立通道的刷新保持同一个输入组件、显示短暂同步反馈并禁止交互，权威快照及会话恢复后再启用；真实断连仍显示恢复界面。材料传输的连接判断不再因单纯权威刷新而清空，但提交仍必须等权威状态就绪。
- 系统选择器完成后可能再次通知后台，原逻辑因 busy 已清除而关闭通道。选择器后台租期现在锁存，重复后台不重新计时，回前台或原 180 秒上限结束租期。普通后台仍关闭。新增原生生命周期与 Web 权威刷新／实际通道断开诊断，仅输出固定事件码，无输入内容、材料或凭据。

新增分布式模拟测试在恢复时延迟快照超过断线窗口的 1 秒阈值：校验编辑器 DOM 未重建、草稿保留、无连接错误弹层、旧状态不能提交、恢复后能编辑、真实断开仍有错误弹层。原生 VM 测试覆盖选择器 busy 清除后的重复后台及租期不延长。

验证结果：213 项核心测试通过；typecheck/生产构建通过；独立新启的 Vite 服务上 11 项浏览器/原生模拟回归通过。首次测试使用热更新中的开发服务器，动态导入状态模块与页面状态不一致，导致失败；隔离启动后重跑全部通过，保留两次日志以供复查。真实模型未调用。

两端保留原演示代次 `1793741702534`，同一 Web 快照，升级安装及启动返回成功；逐文件核对 HAP Web 与 dist（index 的构建代次注入除外）。未卸载、未清空用户输入或密钥。

- tablet：builtAt `1793746490558`；SHA-256 `2dc96c79766b0d98f065594f1a1172be431e0e219b28ca3756f62c339d34fd88`。
- phone：builtAt `1793746490558`；SHA-256 `3768cdbc0095e39395a0252b20b9a4cfccbd3ae48015f8be99ba34ed6a6026d0`。

证据：`artifacts/controller-recovery/camera-release.json`；`artifacts/controller-recovery-camera-{core,browser-final,build,hap}.log`；截图 `artifacts/controller-recovery/camera-authority-refresh.png`。额外分布式确认日志 `artifacts/controller-recovery-camera-distributed-final.log`。

**等待真机复测**：实际相机返回是否保持连接及同一输入页、照片和草稿保留、发送恢复；本轮没有再次提交生成请求，不声称真实生成和拔线验证通过。已发起用户复测问题，后续结果追加到本记录。

## 用户复测与照片确认／持续入口修正

用户确认上一版拍照返回后不再出现连接中断提示或跳出输入页；这项记录为用户真机反馈，不扩展为生成成功验收。

照片交互补齐：
- 拍照／图库返回只进入当前任务的图片 Widget 待确认预览。复用现有 `pendingPhotos`／Mac material `pending` 状态；点击 Widget 确认才进入 Composer 上方的附件区。
- 关闭 Widget、切任务、切应用和重连都不自动采用；未确认照片须确认或移除后才可发送，发送前不传附件。
- 修正演示和真实 Mac WorkBuddy 的 `visible` 参数过滤：已采用照片不再使正文中的照片参数退化为纯文本。原 Chip 可重新打开同一个图片 Widget、继续选择和删除，保持原正文和归属。
- 确认后清除旧的“确认或移除待选照片”提示，避免提示与当前状态矛盾。保留照片附件、句内参数和固定输入底栏的不同用途。

代码涉及 `web-deck-composer.tsx`、`phone-live-workbuddy.tsx`，复用已有本地照片暂存，不改传输协议或已通过的相机连接生命周期。浏览器原生模拟补充图库／相机未确认时无正文附件、关闭再开保留预览、确认后 Chip 保留、再次打开／删除、禁止提前传输，以及延迟选择器跨任务归属检查。

跨应用复测额外发现旧自动聚焦请求晚到的问题：返回 WorkBuddy 并切回原任务后，目标可能被旧 `wb:draft:new` 覆盖，原任务正文仍存在但界面绑定错误。现将自动聚焦标记为条件请求；平板遇到任务已换、已有目标、预览或播放时直接忽略，不覆盖当前目标。新增核心测试，以及未确认照片跨任务／应用返回测试。涉及 `input-session-ui.tsx`、`packages/core/workbuddy.ts`；不放宽用户提交校验。

最终验证：214 项核心测试、14 项浏览器／原生模拟测试、TypeScript 和 Web 生产构建通过；两端签名 HAP 构建、覆盖安装和启动通过，代次仍为 1793741702534，未重置配对、密钥或原记录。
- tablet: builtAt `1793748774816`, SHA-256 `3c326af188e64f72522f4818520d28e7f6c17f521f64e8347b0f30271624c4bf`。
- phone: builtAt `1793748774816`, SHA-256 `9599a0d4113e5e2a3755df9f9d7dda25beb100fe9f659d4beefb7eff37d08bb0`。
证据：`artifacts/photo-confirm-core.log`、`photo-confirm-browser-final.log`、`photo-confirm-build.log`、`photo-confirm-hap-final.log`，安装记录 `artifacts/controller-recovery/photo-confirm-release.json`，确认后照片 Chip 截图 `artifacts/controller-recovery/photo-confirmed-chip.png`。

本次相机返回不断线已有用户上一版真机反馈；新照片确认与 Chip 常驻交互仍待用户在本安装版复试。未调用真实 Gemini、未发送真实 Mac 任务、未发布。
