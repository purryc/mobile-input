## 2026-10-15 · 按输入意图展示辅助控件

- 恢复文本框内的推荐入口：只推荐用户提到的内容；工具展开隐藏对应入口，关闭完全移除面板并恢复仍有效的入口。
- 取消顶部摘要与最小化状态；多个工具、文本框及键盘／触控板共同分配中部高度，正文聚焦不再收起工具。
- 保留草图附件、待确认笔迹、颜色和逐任务草稿；增加多面板、关闭恢复、否定意图、低高度和任务隔离回归。
- 以 Figma `1286:6473` 及用户最新行为说明为准，详见 [推荐输入验证](docs/workbuddy-elastic-input-update.md)。

## 2026-10-15 · 分布式应用状态自动核对

- 自动检测手机与大屏的应用、目标、版本差异并重新同步，避免停留在旧应用。
- 同步期间保护草稿并显示明确等待状态，拒绝旧同步回复，保留连接和重试入口。
- 验证记录：`docs/distributed-state-sync.md`。

## 2026-10-15 · Gemini 文本润色

- 手机 AI润色改接用户 Gemini API，使用原生安全存储，不依赖 Mac 服务。
- 保留场景动作、选区、撤销、取消和过期结果保护；连接设置增加 Gemini 配置与真实测试。
- 两端签名 HAP 已安装；手机真实润色验证成功。详细边界见 `docs/gemini-polish.md`。

## 2026-10-15 · Source backup and update summary

- Backed up the current Input Agent 1.4.0 sources: method-first connection settings, native Harmony distributed collaboration and LAN fallback, shared task color/layout recognition, connection recovery and the ASR parameter fix.
- Included the current editable design registry and design-specification index. Material-input component states and attention effects are documented as design work, separately from implemented runtime behavior.
- Preserved existing drafts and business data. Device validation confirms distributed input after USB removal; long-duration and high-frequency transport tests remain open. See the dated entries and linked validation records below.
- Public source excludes private recordings, device captures, credentials, signing profiles, dependencies and generated installation packages. Signed HAPs and local delivery archives remain in ignored artifacts.

## 2026-10-15 · Connection method selection and native Harmony collaboration

- Added method-first radio cards to both connection panels: Harmony distributed collaboration or LAN QR pairing. QR/manual inputs remain hidden until LAN is selected; distributed mode shows trusted-device discovery, progress and actionable errors. Kept ChatGPT account settings collapsed and separate.
- Integrated native device discovery, collaboration sessions, peer identity checks and application handshake while retaining the existing bundle IDs, drafts and explicit LAN fallback.
- Added bounded 1 KiB text framing for JSON/SVG-compatible messages and incremental state snapshots after initial synchronization. Switching methods cancels obsolete traffic and pending commands without replaying effects.
- Verified 117 core tests, all 50 browser scenarios across the full run and focused retest, Web and signed HAP builds, and installation on both devices. User confirmed distributed WorkBuddy input and synchronization after unplugging USB. Long-duration and high-frequency transport stress remain unverified.
- Validation, design comparison and device limitations are recorded in [connection validation](docs/distributed-connection-validation.md). No automatic GitHub push.

## 2026-10-15 · Task input recognition and connection recovery

- Extended shared WorkBuddy auxiliary recognition to common color/shade, HEX and layout phrasing across new tasks, follow-ups and material tasks; preserved negation, task identity and manual parameters.
- Fixed material panels hiding explicitly opened tools and removed false inference conflicts against newer manual parameter revisions; stale text/targets still reject.
- Serialized native socket frames and isolated obsolete connection callbacks so a failed old send cannot close a replacement session.
- Verified 110 core tests, 13 targeted browser tests, production Web build and both signed HAP builds. Device and Distributed Service Kit evidence is recorded in `docs/task-input-and-connectivity-2026-10-15.md`; distributed transport is not enabled by this patch.

## 2026-10-15 · 修复手机语音引擎参数错误

- 移除错误的“系统在线识别”模式切换；原生桥固定使用支持的本机识别配置，并兼容旧调用。
- 识别失败提供真实重试、中文原因与安全错误码，保留正文和目标，不自动提交。
- 106 项核心测试、10 项相关浏览器检查与两端签名构建通过。真机和真人语音结果见 [ASR 修复记录](docs/asr-recovery-2026-10-15.md)。

## 2026-10-14 · 开发进展与完整源码同步

- 新增开发日报，汇总通用输入、WorkBuddy 任务／文件、绘画、Bilibili、ChatGPT 润色与设计同步，分别记录已完成、真机确认和待验收项目。
- README 更新为 1.4.0、九个演示入口和当前验收索引；此次补齐上次 1.2.0 备份之后的可编辑源码、素材索引、测试和设计脚本。
- 同步前 104 项核心测试、46 项全量浏览器回归、类型检查和生产构建通过。更新四处过期测试约定，保留初次失败记录；凭据扫描和排除项检查通过。
- 签名材料、账号授权、私有素材与构建产物保留在本机。完整记录见 [2026-10-14 开发进展](docs/development-progress-2026-10-14.md)。

## 2026-10-14 · 顶部草图附件与开发设计同步

- WorkBuddy 已确认的布局草图移到唯一文本框顶部，缩略图可继续编辑，独立 X 仅删除当前任务草图；正文、颜色与其他材料保留。
- 同步 Figma 原组件与主流程：场景化 AI润色、ChatGPT 账号状态、单一颜色入口、中性新任务、绘画命令自动执行和视频／采集规则。
- 104 项核心测试、6 项浏览器检查及两端签名构建通过；手机和平板已覆盖安装，真机布局和草稿保留已核对。分层证据见 `docs/runtime-design-sync-2026-10-14.md`。

## 2026-10-14 · 场景化 AI润色 action

- 根据应用和当前编辑对象显示三个合适的润色入口：微信回复、任务指令、邮件、标题、正文、演讲备注、笔记和弹幕分别处理。
- 新任务保持格式中性，数字与绘画命令不显示文本润色；明确点击才调用 GPT，仍支持选区、撤销和迟到结果保护。

## 2026-10-14 · 手机独立 ChatGPT 授权与真实润色

- 手机连接设置增加 ChatGPT 登录、取消与退出；使用官方 OAuth，授权保存在手机应用私有目录。
- AI润色通过官方 Responses 接口处理当前字段或选区，支持取消、错误保留原文、成功撤销；继续编辑或切换目标后不接受旧结果。
- 修复手机模型目录接收上限过小导致润色失败；真实授权、润色、平板同步和撤销已在两端验证。无需 Mac 代理，不自动发送聊天或提交任务；分层记录见 `docs/chatgpt-polish.md`。

## 2026-10-14 · Single color action and recognition feedback

- Keep one color action chip; retain structured parameters without adding HEX text or duplicate badges.
- Sweep recognized color words in blue/lilac before revealing the action, preserving editable text and stable voice controls.
- Back up and clean legacy generated color annotations while retaining artwork and user-authored text.

## 2026-10-14 · 手机输入与意图面板设计同步

- 同步文本框默认抑制系统软键盘，保留明确的系统中文输入入口；鸿蒙壳按字段拦截键盘请求。
- 文本框内意图入口点击展开颜色／手绘／相机／文档；关闭保留内容，右上关闭、右下确认。
- 对象修改一次发送直接更新平板文件，移除手机修改预览与二次应用。
- 同步玻璃样式、截图图标与键盘展开态语音图标；保留现有任务、草稿与材料。
- 验证与边界：`docs/input-intent-runtime-update.md`。

# 版本更新说明

## 1.4.0 — 2026-10-14

- 修复 WorkBuddy 断线时切到通用页面并禁用全部输入的问题：保留任务编辑页，数字、表情与编辑工具继续修改本地草稿，提供明确的连接／目标恢复入口；重连不自动提交或覆盖平板内容。
- 通用键盘／触控板按最新 Figma 重做透明玻璃布局：三排键盘与 ABC／符号／表情，空白触控区与左右鼠标键，模式切换和智慧语音整合进最后一排；保留系统中文输入。修复 WorkBuddy 意图处理误删末尾换行。
- WorkBuddy 所有任务的手机文本框移除常驻画笔与调色板入口；用户表达颜色或布局意图后才显示对应工具，保留已确认参数和手绘附件的编辑能力。
- 新增天生会画三态控制器、分层画布、六种笔触、连续色环、涂抹/液化、文本图层和撤销重做。
- 普通字段采用焦点驱动的双向编辑；并发修改保留输入并提供恢复选择，应用发送保持显式操作。
- 统一固定输入区、自绘键盘/系统中文入口、原型内触控板左右键和单按钮语音手势。
- 按最新要求，明确的绘画语音命令在识别完成后直接执行，无需二次确认；文字聚焦时只听写。迁移备份旧画作，保持笔记及既有业务状态。
- 修复纯标点识别结果误弹绘画操作菜单；通用录音由手势停止，字幕保持独立分句逻辑。
- 绘画自动执行改为读取原生完成事件携带的最终转写和原目标身份，避免分开发送的转写/完成事件导致漏执行；同一语音会话去重。
- 浏览器与真机验证分别记录于 `docs/paint-input-update.md`。


## 开发中 · 2026-10-14 · WorkBuddy 与 Bilibili 输入场景

- 跟进最新 Figma，为 Bilibili 手机端补齐播放／暂停、1×／1.5×／2×、连续音量与静音、全屏／列表切换；参数实际控制平板视频，手机无进度拖动条。

- 修复连续转写在回执先于状态到达时误触发草稿保护；受保护草稿显示原因，并可在发送位置确认目标后继续预览。保留明确“应用修改”。

- WorkBuddy 增加单一弹性输入框、任务卡片、颜色／HEX、原始手绘与确认缩略图；Roadmap 参数实际影响六页演示产物。
- 支持任务 A 执行时切到 B 补材料／处理绑定范围的审批，再返回 A；对象指向和修改指令独立保存，预览后明确应用。
- Bilibili 成为第九个入口，复用已有 Hover 本地视频；手机操作列表、点赞收藏、单枚演示投币及弹幕，大屏显示结果。未知请求先查询，重连不重放。
- 共享采集入口支持应用窗口截图、圈选、显式开始／停止的无声录屏；手机系统相机结果先保留在本机，恢复原目标后明确加入参考。采集不自动提交任务。
- 已观察手机系统相机打开／取消、中文 emoji 原生剪切粘贴，以及原生手机向浏览器大屏发送弹幕和投币操作。两端已更新；真人对象语音识别、人工恢复后预览及标题修改已验证。修复后的真人语音发送、预览及应用标题修改已由用户确认；真实拍照及完整拔 USB 双端验收仍待完成。
- 两个场景分别记录于 [WorkBuddy 验收](docs/workbuddy-adaptive-input-validation.md)和 [Bilibili 验收](docs/bilibili-input-validation.md)。工程包继续使用 1.3.0；不把开发检查描述为最终版本验收。

## v1.3.0 · 2026-10-13

- 新增WorkBuddy应用内全屏文件浏览器：浅蓝标签、最近、新建、目录、触摸排序、独立逻辑窗口与逐级返回。
- 九类虚构销售文件；Word/表格/PPT直接编辑并共用WPS内容，Markdown/TXT自动保存，HTML退出编辑保存，内置PDF分页、SVG缩放和WAV实际播放。
- 逐文件AI对话、选区改写、撤销重做、生成同目录简报；手机实时编辑与原子提交，保留真实语音和原生剪贴板入口。
- 右侧面板分为产物、工作空间文件、实际变更和内置销售网页浏览器。
- 升级前备份，旧手改文本另存迁移副本；未保存关闭确认、版本冲突副本、第二窗口只读及迟到AI结果保护。
- 验证：类型检查、62项核心/协议测试、19项完整浏览器回归、Web及两端签名构建通过；手机已安装1.3.0，平板未被调试工具识别，双端真机及拔USB验收待完成。
- 官方视觉与能力来源、模拟边界、测试和真机情况分别记录于[覆盖矩阵](docs/workbuddy-file-browser-implementation.md)和[验收](docs/workbuddy-file-browser-validation.md)。本轮不自动推送GitHub或上传Drive。

## v1.2.0 · 2026-10-09

- 新增第八个桌面与轮换入口 WorkBuddy；以 5.7.7 录屏重建独立首页、任务、分栏文件预览及办公模块，保留 1200 ms 轮换。
- 新增需求简报、采购报价、客户方案、六页汇报四种销售成果，关联既有 WPS；计划先确认，仅问答不生成文件。
- 专家／专家团、技能、连接器、项目、助理、定时任务、资料库、邮箱、Buddy 与设置均保存本地演示记录。
- 手机显式聚焦后提供真实原生语音入口、实时草稿同步、中文编辑工具和 AI润色；目标版本、编辑序号与命令去重保护发送。
- 一次性备份迁移旧 WorkBuddy 共用草稿，保留微信与 WPS 数据；未完成任务重开显示已暂停。
- 完整官方绿色图标与机器人本地打包，私有录屏及账户内容排除出应用与源码包。
- 收录[自适应输入设计系统](docs/adaptive-input-design-system.md)、组件目录、四种输入计划样例及 Figma 构建脚本；覆盖 Glass／Mechanical 材质与八种应用主题。这部分为设计交付，未接入应用运行时、真实模型或折叠 PC 适配。
- 验证：类型检查、48 项核心／协议测试、13 项完整浏览器回归和生产 Web 构建通过；两端签名 HAP 1.2.0 已覆盖安装。WorkBuddy 首页、模板与手机配对界面有真机观察记录。
- 待验证：WorkBuddy 真机双端实时输入、真人语音及剪贴板、局域网四条链路、断线恢复和拔 USB 后独立运行。此前其他场景的真机结果不算作本轮 WorkBuddy 通过。
- [信息架构](docs/workbuddy-ia.md)、[交互与协议](docs/workbuddy-interactions.md)、[分层验收](docs/workbuddy-validation.md)。用户于 2026-10-09 追加授权，将当前源码备份到公开 GitHub，并发布本版更新说明；本次不上传 Drive。

## v1.1.1 · 2026-10-08

- 手机连接图标并入微信、WPS 和 FC 现有状态行，移除控制器顶部额外的 48 px 状态栏；保留配对面板、应用切换和原生安全区。
- 微信输入框和有效消息改为 Hover 风格的青蓝／淡紫珠光渐变细边；读屏时播放玻璃扫光。保留两次 240 ms 输入框脉冲，消息理解延长为 2 秒，完成后手机才弹出推荐；连接期间保留持续环绕光。
- 微信“相关动作”改为“推荐下一步”；压缩冗余标题和间距，移除重复底部留白，腾出的空间用于可编辑草稿，默认内容和三项动作同屏可见。
- 来源与实现差异记录于 `reference/hover-focus-material.json`；未修改原 Hover 项目。
- 本地构建与真机记录见 [本轮验收](docs/wechat-reading-fit-validation.md)。
- 按用户要求将源码发布到公开 GitHub 仓库；Google Drive TEMP 保存同一提交的源码 ZIP，继续排除原始录屏、私有截图、签名凭据和构建产物。

## v1.1.0 · 2026-10-08

### 名称与连接入口

- 手机端、平板端及系统桌面入口统一为 **Input Agent**。保留原有应用包名，覆盖安装继续使用原有数据和权限。
- 两端右上角常驻连接图标，绿色圆点表示已连接，橙色表示未连接；点击查看实时状态和配对信息。
- 平板提供二维码与六位配对码；手机支持输入配对码、扫码及重新发现平板。
- 手机入口位于紧邻真实系统状态栏的应用状态区。微信待机、编辑、推荐页面、WPS 和横屏 FC 均可访问；平板全屏放映及 Mario 保留轻量连接按钮。
- 应用切换仍使用独立按钮。打开连接面板取消待定轮换、释放游戏按键、停止姿态指向和录音；关闭后保留当前页面和文字草稿。

### 本次同步包含的演示更新

- 微信直接进入陈总会话，照片头像、闲聊与采购消息、输入框局部高亮、读屏和逐项推荐；其他会话按可见消息匹配 Hover 本地模拟服务。
- 手机默认待机桌面；显式激活输入框后进入文字与语音输入，支持实时草稿同步、编辑、AI润色、建议回复即发。
- WPS 默认打开第一页编辑模式，全屏后开始演示；替换最新 Figma 控制器，补充六页口语化演讲备注。
- 演示支持逐页笔迹、画笔悬停与按住绘制、姿态指向、颜色与粗细、字幕及翻页；修复长白框和重复结束提示。
- FC 横屏等比居中，保留组合按键和应用切换；Mario 平板全屏等比显示。

### 验证与边界

- 类型检查、38 项核心／协议测试、7 项原有浏览器场景及新增连接入口回归测试通过。
- 原生构建与真机记录见 [v1.1.0 验收记录](docs/input-agent-v1.1.0-validation.md)。
- 所有第三方服务继续为本地演示；未新增真实日历、预订、支付或账号接入。
- 签名凭据、原始录屏与设备截图不进入 GitHub 源码。USB 拔除后的完整双设备验收未在本版本重新执行。

### 30-second Bilibili media
- Added a continuous 30-second Big Buck Bunny excerpt with original audio and source credit; retained both Hover clips. New video drafts/reactions are initialized without replacing prior records.
- Verified phone playback/pause, volume, editable speech and moving danmaku without USB; WorkBuddy photo adoption and cross-app crop separately confirmed by the user.


## 2026-10-14 — Bilibili demonstration playlist and reactions

- Reordered playback to Hua Fei (5-second loop), Big Buck Bunny (5-second loop), and Yu Yan's official Foretold practice video (continuous 00:30–01:00 excerpt, 30-second loop).
- Added tablet-only applied-action feedback: like pop/rays, favorite star burst, coin flip/ring. Receipt queries, old receipts and reopened views do not replay these effects; reduced motion is respected.
- Preserved prior video drafts/reactions during catalog migration; the new Yu Yan video has an independent identity and fresh action state. Re-selecting the current video preserves duration and playback position.
- Source provenance is in `reference/bilibili-input.json`; original clips remain unchanged. YouTube authentication was used only with user authorization and was not saved to source or packages.
- Playback-list Reset Interactions clears only the current video reactions and refunds local demo coins, while retaining drafts, comments and idempotent receipts.

### GoPaint tablet UI refinement
- Rebuilt the painting surface against installed Huawei GoPaint 16.0.0.235: full canvas, floating drawing/editing toolbars, brush library, color panels and real layer thumbnails.
- Added per-stroke opacity with backwards-compatible defaults; preserved drawings, undo history, phone text editing and automatic voice commands.
- Kept private device screenshots out of runtime and delivery bundles. Native filters, selection/transform and brush imports remain outside the demo scope.

### WorkBuddy new-task context fix
- Removed the hard-coded presentation/Roadmap summary from the phone's unsubmitted task composer. Empty and ordinary drafts no longer claim that a presentation task exists.
- Renamed the contextual color panel to the format-neutral “主色”; explicit color/layout intent and existing task restoration remain available.

### WorkBuddy composer focus animation
- Added WeChat-style cyan/lilac edge pulses and glass sweep on explicit task-input activation, followed by a subtle connected-target orbit.
- Kept input immediate; draft synchronization does not restart the animation, and disconnect/target changes stop it.

### WorkBuddy explicit phone-input entry
- Tapping the task input surface now activates the phone composer and focus animation together, including blank padding and repeated taps on an already focused field.
- Explicit activation recovers an unknown target after release while preserving unsent text; toolbar actions and task submission remain separate.
