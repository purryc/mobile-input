# 连接方式选择与鸿蒙协同 · 2026-10-15

## 产品决策与交互

保留两端右上角同一个连接入口和现有控制器高度。面板顺序为“设备连接／真实状态 → 连接方式 → 所选方式的操作”。首次没有选项时不显示二维码、地址或附近设备；选择会持久化，重新打开恢复上次方式。

| 层级 | 鸿蒙分布式 | 扫码网络建联 |
|---|---|---|
| 一级选择 | 单选卡，设备协同图标、名称、简短说明、选中圆点 | 单选卡，扫码图标、名称、简短说明、选中圆点 |
| 二级内容 | 首次选择请求多设备协同权限并查询可信设备；设备名、刷新、连接状态 | 平板显示 QR／配对码／地址；手机先显示扫码，再显示手动地址与配对码 |
| 等待与失败 | 区分查找、连接、应用握手、工作台同步与失败；提供刷新或明确切换网络 | 复用现有发现、扫码、手动配对与 TCP 恢复 |
| 返回 | 关闭设置保留编辑内容 | 同左；键盘或内容滚动后关闭按钮仍固定可达 |

ChatGPT 账号收进独立折叠区；它的外网状态不冒充设备连接状态。单选整张卡可点并支持键盘/无障碍语义。没有新增系统栏或第二行常驻工具栏。

选择方式属于明确设置操作。后续已有协同连接时，仍使用“点击平板文本框 → 手机显示匹配输入页”的交互；本轮不承诺在未授权、未选择设备时通过点文本框绕过系统配对。

## 原生实现与协议

- 新增 `apps/harmony/shared/DistributedLink.ets`，使用 Distributed Service Kit 的 DeviceManager、AbilityConnectionSession、connect/acceptConnect 与 sendMessage。保留既有两个 bundle ID；接收端检查对端包名、模块、Ability 和协议参数。
- 注册 `UIAbility.onCollaborate`；系统协同权限通过真实运行时授权请求获取。设备列表来自原生 API，浏览器不编造设备或连接结果。
- 同账号可使用两个不同包名；本轮设备为 SUP-AL90 与 MRDI-W10，用户确认同一华为账号。原生握手后手机仍等待权威快照完成才进入已连接状态。
- 官方 sendMessage 单条上限 1 KiB。序列化帧预留头部，按 UTF-8／JSON 转义长度分片，保留中文、emoji、JSON 和 SVG 文本。整条消息限制、顺序校验、超时、重复完整消息拒收及新会话重置均有测试。
- 首次传完整状态；之后发送同一会话／基础版本的增量，避免把附件与历史反复随每次输入发送。基础版本不一致时请求完整同步；没有成功状态时不丢弃受保护草稿。普通命令仍使用已有去重、版本、序号与回执。
- 模式切换与后台终止旧会话，清理未发送队列与活跃控制。TCP 连接与分布式会话不会并行接管；旧 WebSocket/native socket 事件不改变替换后的连接。未确认的操作不自动重放。
- 用户可明确切回 LAN。没有在失败时偷偷改变所选连接方式。

参考：
- [华为：跨设备连接 UIAbility 开发指南](https://developer.huawei.com/consumer/cn/doc/HarmonyOS-Guides/abilityconnectmanager-guidelines)
- [OpenHarmony：应用多端协同 API](https://github.com/openharmony/docs/blob/master/zh-cn/application-dev/reference/apis-distributedservice-kit/js-apis-distributed-abilityConnectionManager.md)，sendMessage 的 1 KiB 限制。
- 安装的 DevEco SDK：`@ohos.distributedsched.abilityConnectionManager.d.ts`、`@ohos.distributedDeviceManager.d.ts`、`UIAbility.onCollaborate`。

## 验证与限制

| 层级 | 结果与边界 |
|---|---|
| 核心 | 117 项通过：包含分片大小／乱序／重复／超时，JSON/SVG/emoji 往返，原生握手与拒绝无关应用、模式切换，增量快照与不安全路径拒绝 |
| 类型与生产 | TypeScript 检查、Web 生产构建及两端签名 HAP 构建通过；保留既有版本 1.4.0／1004000 |
| 浏览器 | 全量 50 项首次完成结果为 49 通过、1 失败：旧文件输入测试未先选择网络方式便查找配对码。更新测试入口后，文件浏览器 6 项全部复测通过，覆盖此前失败项；最终 50 项均有通过记录。另有 15 项聚焦连接／原输入／微信／WPS／FC／Bilibili 回归通过 |
| 真机安装 | 两端覆盖安装，保持包名和原业务数据；最终安装回执在 evidence 目录 |
| 真实发现与会话 | 两端系统授权后能查到对方；手机发起、平板接收；真实分布式握手及首次任务快照通过 |
| 平板→手机 | 点击既有 WorkBuddy 输入框，手机进入同一草稿并显示既有“深红色”参数；没有写入测试文字或发送用户任务 |
| 手机→平板 | 手机点击应用轮换，平板显示九应用格子并高亮 Bilibili，随后进入；大状态分片修复后用增量同步避免回执延迟 |
| 网络回退 | 两端切换到扫码网络，平板生成 QR／地址／PIN，手机使用其手动入口连接成功；没有把手动配对写成相机扫码验收 |
| 拔 USB | 最终安装版：用户确认分布式模式下点击 WorkBuddy 文本框、手机输入及拔线后同步可用（回复“keyi”）。随后 HDC 目标列表为 `[Empty]`；拔线后的交互结果依据用户反馈，未独立录屏 |
| 长时与高频 | 未完成长时稳定性、网络切换、IMU/游戏高频、2 MiB 材料压力测试；本轮证明发现、建联、状态与普通命令，不保证所有负载更快 |
| 真实语音 | 复用既有 ASR；本轮未新增真人语音通过记录 |

早期真机第一次握手后遇到大消息 `Parameter error`，已根据 1 KiB 限制修复并重测。之后发现重复完整快照拖慢焦点与回执，改成首次完整／后续增量；保留两次观察记录，不将早期握手等同完整成功。

证据：`artifacts/distributed-connection/`（私有忽略目录）。设计比对见 [design QA](design-qa.md)。不自动推送 GitHub 或上传 Drive。

回归过程记录：更早的一次全量运行在旧配对步骤和媒体循环超时后主动中止；后续运行的 30 秒视频循环通过，未用增加等待伪造媒体结果。最终日志为 `browser-full-final.log`（49/50）与 `browser-files-final.log`（6/6）。修改测试入口后未再重复整套已通过场景。
