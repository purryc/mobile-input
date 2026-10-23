# 键盘与触控板按稿更新

## 全场景共享与手动开合 — 2026-10-20

- 最新规则覆盖下方旧版几何描述：桌面、微信、邮件、笔记、豆包、WorkBuddy、Bilibili、绘画使用唯一 `InputDock`。收起、键盘、触控板和录音状态均显示语音文字；场景只提供颜色 token 与操作能力，不覆写内部尺寸。
- 手动展开状态移出任务组件生命周期。切任务、切对象、同步及专用控制器返回均保留选择；只有用户切模式或收起改变偏好。系统中文输入临时接管，结束后恢复。
- 触控面增加短时轻点与双击；移动、取消、双指和按键拖动不产生附加点击。保留鼠标合并队列及紧凑回执。
- 已同步在线 PRD，并读取核对新增规则；本地完整规则与分层验收见 [共享输入规则](shared-input-prd-2026-10-20.md)。

## Desktop / WorkBuddy parity — 2026-10-20

- Fixed the desktop-only hidden voice label and stretched gesture surface. Both scenes now render the same `InputDock`: 368 px expanded height, 222 px dotted touch surface, joined mouse keys centered, microphone plus 智慧语音 on the right. Desktop retains blue, WorkBuddy retains teal. The latest all-scene revision also keeps the keyboard voice label visible.
- Desktop now uses bottom auto spacing and the same native bottom-inset padding as WorkBuddy. No changes to voice routing, explicit submission, input activation or pointer event behavior.
- Figma: updated desktop masters `1849:82877` / `1849:83970`, labeled voice `1891:88793`, and bottom-anchored instance `1850:20423` in `5:11016`. Existing WorkBuddy shared pad `1493:31242` / dock `1493:55602` remains the reference. Default-page screenshot in Slides `202:913` refreshed in place.
- Verified: `npm run check`; 138 core tests; `npm run build`; `tests/trackpad-parity.spec.ts` (1 passed). Browser comparison at 390 × 844 and 360 × 700 asserts identical dock, surface, mode, joined-key and voice geometry, visible voice text, centered mouse keys, unobscured Send and draft preservation through keyboard/trackpad switching. Screenshots: `artifacts/trackpad-parity/`.
- Figma screenshot inspected. This is design and browser verification; signed HAP installation and real-device acceptance were not performed this turn.


## 视觉基准

2026-10-14 读取 Figma `ApFLno64NcMoA17MiPFfZh` 中 `1493:55578`，使用当前 `1493:55590` 键盘与 `1493:55602` 触控板，覆盖早期独立底栏版本。设计文档的透明玻璃与整合最后一排规则同步应用。

- 390 px 基准：收起 136 px、展开 368 px；顶部编辑工具 48 px；面板内容 222 px，最后一排 56 px，合计面板 288 px。
- 键盘 ABC／123／表情选择、三排 48 px 按键、大小写与退格；最后一排左侧模式切换，中间空格／回车，右侧带文字的智慧语音。
- 触控板使用点阵玻璃表面，最后一排左侧模式切换、中间连体左右键、右侧带文字的智慧语音。两键保留无障碍标签与实际点击行为。
- 细亮边、透明底与柔和阴影，工具栏共用一层玻璃。移除箭头角标、触控板指针插图、重复底栏与文字鼠标键。
- 设计中的 12 个 SVG 均本地保存，24×24 原始尺寸不变，来源／哈希见 `reference/input-dock-figma.json`。绘画沿用深色蓝色主题，其他专用游戏／演讲控制器不变。

## 运行行为

三种模式互斥，点当前模式收起，切换不改草稿。键盘回车只插入换行。ABC 选中后再点击展开输入法菜单，可使用系统中文输入；进入系统输入时收起自绘键盘。自绘键盘开启期间 textarea 使用 `inputmode=none` 防止重叠。保留原有语音手势、编辑选区、采集与鼠标指令。

手机安全区由现有原生内边距处理。窄屏适度缩小横向留白，中部独立滚动；未加入仿制系统栏。

## 验证

结果按实际执行填写；浏览器模拟语音不代表本轮真人识别验证。证据放在 `artifacts/input-dock-design/`。

已通过：TypeScript／Web 生产构建、95 项核心测试、键盘与触控板专项及 WorkBuddy 5 项回归。绘画 6 项及对象输入 1 项也通过。按当前大写键面更新了旧绘画测试定位。专项验证了文字、符号、emoji、完整字符退格、换行、输入法入口、切换收起、固定语音位置、真实原型指针移动与 360／390／404 px 布局。

视觉已检查本地键盘／触控板渲染与 Figma；12 个图标的来源、非空内容、哈希、24 px 尺寸及引用逐项核对。两端 1.4.0 签名 HAP 构建和覆盖安装成功；本轮真人语音与拔线直连未重新验收。

真机视觉：重启并重新配对后，已在 SUP-AL90 检查键盘与触控板，图标、键面、空白触控区、底行开合均显示；保留原任务草稿。截图见 `device-keyboard.jpeg`、`device-trackpad.jpeg`。当时界面另有“未收到回执，请核对平板”的任务状态提示，因此本轮仅记录真机安装与视觉，不能据此宣称端到端输入或联网可靠性通过。
