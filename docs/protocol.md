# 双端协议与状态

平板是权威状态；手机只持有快照、固定输入目标和未提交草稿。开发浏览器通过 `scripts/dev-bridge.mjs` WebSocket 中继，原生 HAP 通过 ArkTS TCP 点对点传递同一 JSON 消息，无电脑中继。

## 原生会话

- 平板 TCP 39871，mDNS `_mobileinput._tcp`。
- 帧：4 字节大端 payload 长度 + UTF-8 JSON。最大 2 MiB；读取累积缓冲处理分包和粘包。
- 外层 `{kind, pin, payload}`：`hello` 六位码握手，`welcome`，`data`，`error`。
- 单手机占用，未握手连接 8 秒后关闭。每次启动平板 Web 新配对码。二维码只包含本机 IP 和配对码。
- 当前限定同一可信局域网、前台使用；尚未实现公网服务、TLS、后台保活、多手机仲裁。
- Web 调用原生代理只允许原生拦截并从 HAP 内供给的 `https://mobile-input.invalid/` 页面（外部来源与路径穿越返回 404，不转发到网络）。收到的 JSON 用 JSON.parse 解析，不能拼接为可执行代码。

浏览器调试桥默认 5189；自动化测试使用独立 5191，URL 参数 `bridge` 仅作用于浏览器。测试不占用用户正在演示的单平板连接。

## 数据协议 v2

- `snapshot`：完整 `state` 和 `context`。
- context：protocolVersion、app、documentId、worksheet、object、revision、presentationSession、slide、operations。
- 对象：id、label、kind、app、revision、value。例：`cell:0:quantity`、`paragraph:2`、`slide:3:body`。
- `command`：id、type、app、targetId、targetRevision、sessionId、value。
- `ack`：id、ok、error、revision。手机按命令编号匹配回执；4 秒未回执则请求状态同步，不自动重发修改。
- `sync`：重连优先拉取平板当前快照。

输入与格式命令必须匹配应用、对象和对象版本。开始输入后手机固定该目标；平板换对象时手机保留草稿并禁用提交，明确重新绑定后才可继续。来自上一条输入的晚回执不得覆盖随后开始的新草稿。

Store 缓存最近 1000 条命令编号与回执，重复编号直接返回原回执，避免重复发送和翻页。重启进程不保留去重缓存；手机也不持久化或重放待执行命令。输入等修改支持最近 30 次撤销。

## WPS 与销售一致性

`products` 是编辑中的采购表；`reportProducts` 是用户明确点击「更新汇报数据」得到的汇报快照。方案表、总报价与 PPT 图表都读取同一快照。编辑后的段落或标题标记为手改，数据更新不覆盖这些文字；表格和图表仍刷新。历史邮件保留原始虚构需求，用于展示采购往来时间线。

PPT `startedAt` 同时作为放映会话标识和计时基准。翻页采用绝对页码，避免重连重复执行相对翻页。命令会话不匹配则拒绝。演讲备注可在编辑画面维护，放映时仅手机显示。

## 游戏与语音

游戏按键为完整持有集合，可包含左右与跳跃。手机每 150ms 刷新持有状态；松手、pointercancel、失去捕获、断线、后台、应用切换释放。平板与 iframe 各有 700ms 看门狗。暂停清空按键，重开重新加载关卡。真实游戏坐标与持有键通过 iframe `mario-state` 回读用于浏览器验收。

Core Speech Kit 通过 ArkTS AudioCapturer 获取 16kHz 单声道 PCM，实时回调进入当前语音 session 的手机草稿。旧 session 回调丢弃；取消与后台释放采音。本机引擎不可用不填示例文案，显示显式在线引擎入口。用户已确认真机能转写并编辑；识别失败、取消与在线回退的完整矩阵待验收。

## 微信、推荐页与轮换

- `chat-focus` 区分 `message:<conversation>:<message>` 与 `composer:<conversation>`，目标带版本。
- `chat-edit` 携带完整草稿、会话、draft revision、编辑 session 和递增 sequence。平板拒绝旧目标、旧版本和同 session 的过期序号。
- `chat-submit` 原子携带完整文本，发送成功后清空该会话草稿。`chat-reply` 不改独立草稿。
- 手机缓存未同步草稿；重新打开时保留并要求明确绑定，不覆盖新目标。剪贴板异步返回时核对草稿，避免剪掉随后输入的内容。
- 服务页使用 `conversation:message:action` 记录键。Sheet 字段、提醒选项与本地结果保存在手机；不修改聊天草稿，不执行真实日历或第三方操作。
- `switch-step` 更新七项循环索引、1200 ms 截止时间和 epoch。平板自行提交，过期 epoch 被拒绝；输入、返回、后台、断线取消计时。
- `office-open` 打开已有文件或建立新文件；返回 WPS 首页保存当前文件内容。
- FC 完整按键集合支持 ArrowLeft、ArrowRight、Space、Shift。松手、后台、断开和离开应用释放。
