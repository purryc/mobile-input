# 手机任务入口与独立审批：第一切片

基线：`df71727b6a201b727478f25f7f77beebd590e30d`。实现分支：`workbuddy-mobile-approval`。本切片已获开发授权；用户随后明确授权相关测试通过后提交并推送独立开发分支。main 合并、PR 与公开部署不在授权范围内；基线测试分支推送已单独验证。

## 范围与差异

手机从明确的 WorkBuddy 按钮打开任务总览，不需要电脑先选择编辑目标。浏览任务和草稿是手机本地路由，不改 `workbuddy.page/task/target`。WorkBuddy 内仅“在工作台打开此任务”导航电脑。从其他应用进入的按钮明确标为“在工作台打开 WorkBuddy”，表示会切换工作台应用。其他应用的被动输入规则保留。

手机新建使用独立 `inputDrafts`，用途为 `create` 或 `approval-supplement`，归属包含 draft ID、task ID、request ID／版本。新建仍调用现有销售生成器，四条销售链、默认／计划／问答和执行 epoch 保持。没有路线图、票据或模型生成的新能力。

审批只控制一次本地分享记录：在任务成果上显式请求，显示文件快照／内容版本、演示接收组与条件。Yes 原子保存 `approved` 与本地模拟 effect；No 只将该请求置 `rejected`，任务与成果不变；补充将旧请求置 `superseded`，创建新 ID／递增版本的 `pending`，再次 Yes 才产生 effect。补充条件记录为动作说明；不声称执行任意文本改写。接收范围只选预定义虚构组，不从文字推断真实地址。

没有将审批复用为 `planned`、`stop` 或 `wb-submit` 追问。审批与任务执行状态分别保存：当前审批针对已有成果，任务不因请求进入执行等待，因此本切片不引入泛化 waiting/blockedBy。未来执行中审批须另外实现阻塞与 epoch 契约。

## 新协议

所有状态转移在 `packages/core`；手机只发送命令，bridge 仍只中继。协议 5 保持，描述增加 `task-input-v1`、`approval-v1` 能力与待审批 ID／版本。

| 命令 | 保护与原子效果 |
| --- | --- |
| `wb-input-open` | draftId＋purpose＋task/request 归属；不清除其他草稿 |
| `wb-input-edit` | `targetId=wb:input:<draftId>`、稳定 `targetRevision`、value.revision/session/sequence；序列化完整文字写入 |
| `wb-task-create` | 相同锚点和草稿版本、operationId；只消费新建草稿一次，生成确定 taskId；电脑路由不动 |
| `wb-approval-request` | taskId、所属 artifactId/contentRevision、演示组、operationId；保存不可变文件与范围快照 |
| `wb-approval-decide` | taskId/requestId/expectedRevision/decision/operationId；检验 pending、权威时间、成果版本及快照；终态不可重执行 |
| `wb-approval-supplement` | 请求归属／版本＋独立补充草稿锚点、revision、完整文字、可选组、operationId；旧请求失效，新请求待确认；不建任务 |
| `wb-approval-refresh` | 显式替换已过期／文件已更新的 pending；新快照仍待确认 |

持久 `operations` 记录业务操作签名与 task/request 结果，跨新 command ID 和刷新返回原结果；复用 operationId 改参数拒绝。Store.seen 继续只是传输去重。手机提交使用同步 ref 锁，未收到回执保留原 operation 与草稿供核对重试。新目标绑定独立于全局电脑 target，旧输入 hook 原有保护不改。

`WbFile.contentRevision` 独立于 sales dataVersion／draft revision；每次正文保存或明确刷新递增，且审批额外比较正文和名称，拒绝快照被改后的旧 Yes。批准只写 `simulation:true` 的本地 effect，未调用分享、邮件、支付或模型接口。

v1→v2 先备份，再添加四个新领域。备份失败核心不部分迁移；运行时保留原持久数据，展示失败并阻止 WorkBuddy 新写入。旧 `undo` 保留当前 WorkBuddy 领域及其生成的 Office 对象，不将旧整状态快照恢复成可再次审批的旧请求。它仍不是文档级局部撤销。

## 分层边界

本次只验证纯核心、浏览器双窗口及 Web 构建。独立草稿语音、相机、真实 WorkBuddy API、后台任务服务、受控几何对象、触控板、候选应用与局部撤销未实现；旧上下文原生语音桥保留，本轮未验证真机语音和设备权限。本地 runner 仍只在云端权威浏览器 WorkBuddy 前台可见时运行；关掉该权威页面会暂停，不能宣称常驻云 agent。

设计由父任务独立负责。代码对应 A01/A03/A04/A05–A09 的功能语义；未读取／改写 Figma，也未做同状态像素比较，不宣称视觉验收。
