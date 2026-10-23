# 桌面键盘启用手机输入 · 2026-10-20

设计来源：[最新入口与退出设计](https://www.figma.com/slides/ylIR7XjcoubXhUiTmEuNI6/Mobile-Input-Agent?node-id=148-882)。
已查看整页截图，证据位于忽略目录 `artifacts/keyboard-entry-slide-2026-10-20.png`，不引入应用包。

## 行为与覆盖

| 入口／操作 | 运行行为 |
|---|---|
| 点击任务栏键盘 | 请求手机输入，同时保留本地小键盘展开／收起 |
| 点击已展开键盘的标题、空白或键帽 | 请求同一个输入会话；大小写与数字切换保留 |
| 小键盘右上关闭 | 只收起，不请求启用 |
| 手机首次确认 | “暂不”回待机；“开始使用”进入默认桌面控制器 |
| 连续请求、已启用后再次点击 | 不替换待确认身份、不重复确认、不重置控制器 |
| 桌面输入安全 | 无无归属文本框，不修改其他应用草稿、不发送、不录音、不启动应用 |

保留原有长按菜单和标题“手机输入”入口。桌面控制器继续使用搜索、多任务、Esc、四个应用入口及默认展开触控板。离开桌面沿用当前应用控制器。只实现原型内点击，不声明支持手机物理碰屏检测、系统键盘接管或未连接时自动建联。

## 验证

- TypeScript：通过。
- 核心／协议：134 项通过，含连续入口请求身份稳定、确认不修改草稿或控制状态。
- 浏览器：6 项通过，覆盖两个新入口、暂不／关闭、连续点击、无归属文本保护、微信推荐采用、WorkBuddy 格式与保存、触控板拖选、桌面键盘布局。
- 日志：`artifacts/keyboard-entry-core.log`、`artifacts/keyboard-entry-browser.log`。
- 截图：`artifacts/keyboard-entry-tablet.png`、`artifacts/keyboard-entry-phone.png`。
- 生产 Web 与两端签名 HAP 构建成功：`artifacts/keyboard-entry-build.log`、`artifacts/hap/keyboard-entry-2026-10-20.log`。
- MRDI-W10 平板与 SUP-AL90 手机均覆盖安装成功，保留原数据；安装日志位于 `artifacts/device-2026-10-20/keyboard-entry-{tablet,phone}-install.log`。
- 原生分布式：发现 Shino-MatePad Pro 并连接，初次状态同步较慢；点击“重新同步”后恢复。实际点击任务栏键盘，手机出现桌面启用卡；点击“开始使用”进入默认桌面面板。证据 `keyboard-entry-p5.png`、`keyboard-entry-p6.png`，均位于上述真机目录。
- 本次未验证拔 USB 后稳定性；展开键盘各区域及连续点击的详细组合由浏览器测试覆盖，不冒充全部真机通过。分布式首次同步延迟仍存在，未在此补丁中修复。

未推送 GitHub 或上传 Drive。
