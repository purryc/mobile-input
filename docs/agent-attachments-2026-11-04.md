# 通用 Agent 真实附件接入 · 2026-11-04

Codex、Chrome ChatGPT、Chrome Gemini 已通过真实原生适配器上传与附件回读验证，材料为专门创建的虚构 TXT、产品 PNG 和手绘布局 PNG。没有发送真实任务，没有执行模型。手机共享面板和字节传输通过模拟目标验证；不能将两组证据合称手机到真实应用的完整物理验收。

## 实现

- `apps/web/src/phone-agent-editor.tsx`：沿用唯一共享 Agent 面板，图片确认、文件、草图均绑定原会话；显式发送才传输完整字节并等待目标采用。实际提交独立于上传。
- `apps/web/src/mac-attachment-adoption.ts`：共享异步采用流程；校验连接会话、应用、窗口、目标，轮询上传回执。超时、失联或目标变化保留材料，不自动重传或提交。
- `apps/web/src/mac-link.ts`：接收上传编号和阶段回执。
- `scripts/mac-bridge/protocol.mjs`：登记有界、绑定目标的 `agent-attach-status`；保留认证与去重。
- `scripts/mac-bridge/agent.swift`：各应用真实附件入口、原生文件选择器、已选文件核对、上传完成及附件身份回读。上传分阶段执行，避免长时间阻塞状态/心跳。
- `tests/agent-attachments.spec.ts`、`scripts/mac-bridge/generic-agent.test.mjs`：字节/哈希、采用/提交顺序、断线/过期/超时、外来附件及文件名证明测试。

不新增手机页面、不安装扩展、不调用网页隐藏接口。既有 Mac WorkBuddy 采用路径保留。平板演示的独立 Gemini 生成链路不变。

## 目标差异及安全边界

| 目标 | 实际采用路径 | 上传完成证据 |
|---|---|---|
| Codex | Add files and more → Files and folders → 原生选择器 | Composer 的附件移除控件及准确文件名 |
| ChatGPT | 添加文件等内容 → 添加照片和文件 → 原生选择器 | Composer 附件卡；重复上传的数字后缀仅按已选文件名核对 |
| Gemini | Upload & tools → Upload files → 原生选择器 | 文件卡名称；图片为已选文件返回后新增的唯一附件 Blob 身份 |

- 传输副本使用短文件名，逐字节比对源文件；手机保留原名。目标应用可能展示短名或其数字后缀，这是当前适配限制。
- 原生文件选择器必须属于原窗口；路径输入和 Return 仅发生在已核对的系统文件路径窗口中，不进入 Agent 正文。
- 部分按钮不响应 AXPress：Codex 使用核对焦点后的 Space；ChatGPT 使用真实 AX 按钮边界及实时系统命中测试。没有猜测坐标或盲点发送按钮。
- 页面 URL、窗口和原 AX 页面身份共同约束上传。同网址的另一空白标签不继承上传；只允许原页面内部编辑器重建。
- 上传完成前还需没有上传进度/错误且附件状态稳定。未知的已有附件继续进入最终清单检查，不被静默忽略。
- 90 秒总超时；选择器阶段有独立短超时。失败不宣称成功，不重复上传结果未知的文件。仅在选文件之前允许有限重开附件菜单。
- 最终真实 Send 仍要求当前目标、正文基线、全部附件与来源证明一致。本轮从未执行该操作。

## 验证结果

### 本地与模拟

- 类型检查及生产构建通过；现有 Vite 大 chunk 提示保留。
- 核心测试 226 项通过；Mac 协议/原生策略测试 24 项通过。
- 附件浏览器测试 5 项、通用 Agent 浏览器测试 3 项通过。
- 三个目标的同一共享面板分别选择文件、确认图片、实际绘制草图；明确发送前没有上传。模拟发送检查完整字节、SHA-256、PNG 标识、采用后才提交；拒绝提交后保留材料。
- 覆盖上传未完成、回执丢失、超时、连接/目标变化不自动提交或重传；未知附件不被丢弃；重复平台文件名不能跨文件冒认。
- Swift 原生辅助程序编译通过。

### 真实应用（仅附件及未发送草稿）

| 目标 | 文件 | 图片 | 草图 | 提交真实任务 |
|---|---|---|---|---|
| Codex | 上传并读回 | 上传并读回 | 上传并读回 | 未执行 |
| ChatGPT | 上传并读回 | 上传并读回 | 上传并读回 | 未执行 |
| Gemini | 上传并读回 | 上传并读回 | 上传并读回 | 未执行 |

ChatGPT 原有非空测试草稿仅在用户明确允许后清空。Codex/ChatGPT 的本轮最终三件测试附件已清理。Gemini 后续检查发现非空草稿，立即保留，不清理或发送；这次保护性中止没有覆盖此前已成功的上传证据。最终页面身份加强后 ChatGPT 三附件复验通过；Gemini 未在非空草稿上重跑。

以上由项目真实原生适配器直接驱动，不依赖浏览器模拟；手机图库/相机到三个真实目标的完整物理链路、真实发送和模型结果仍待用户验收。现有目标应用结构变化可能令附件入口不可用，此时保留手机内容并拒绝不完整提交。

## 安装

- 手机 SUP-AL90：1.4.0 维护包覆盖安装、启动成功。`installTime` 保持不变，`updateTime` 更新；未卸载或清存储。
- 保留演示代次 `1793741702534`；Web 构建时间戳 `1793827247402`。
- HAP：`artifacts/hap/phone/entry-default-signed.hap`，99,619,599 字节。
- SHA-256：`ac846ce9313569e3eb3d6d587855e64249f2a771ae3727def92d54e453083845`。
- Mac Companion 已更新，连接页确认手机连接与 USB 通道就绪。
- 平板本轮没有附件协议缺口，不重装；保留既有演示和数据。
- 没有修改 Figma、Git push、发布 HAP 或清理真实文档。

## 可复现证据

忽略目录 `artifacts/agent-attachments/` 保存：

- `verified-upload-summary.json`：三个目标的上传结果、完整材料名、无提交标记。
- `packages.json`：包哈希、构建代次、安装/启动、USB 状态及原生源码/二进制摘要。
- `core-tests-final.log`、`mac-tests-final.log`、`material-tests.log`、`browser-tests.log`、`build-final.log`、`phone-build.log`。
- 原生回执、AX 树、截图和安装前后 bundle 信息属于私有验收资料，不进入 GitHub 或公开交付包。

复跑本地：`npm test`、`npm run test:mac`、`npm run build`；启动开发页面后运行 `npx playwright test tests/agent-attachments.spec.ts tests/generic-agent.spec.ts`。真实上传测试仅限独立虚构材料和空白草稿；不要自动复跑真实任务提交。
