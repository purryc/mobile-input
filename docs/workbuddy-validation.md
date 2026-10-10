# WorkBuddy 1.2.0 分层验收

日期：2026-10-09。IA、录屏覆盖与模拟边界见 `workbuddy-ia.md`；协议见 `workbuddy-interactions.md`。实施阶段未自动推送或上传；用户随后明确授权 GitHub 源码备份与更新说明。本次仍不上传 Drive，源码发布不改变以下真机验收边界。

## 源码与业务

- 项目规则先更新：八个桌面／轮换入口、WorkBuddy 独立状态、原项目与双端交互保留。
- 完成独立 WorkBuddy 首页、任务执行、历史与文件预览；专家、技能、连接器、项目、助理、自动化、资料库、Buddy、邮箱、更多与设置本地流程。
- 四种销售成果来自共享虚构业务数据；报价 190380、成本 156900、毛利 33480。手改文件保护、显式刷新和 Word→WPS 内容同步有核心测试。
- 旧共享 WorkBuddy 草稿先备份后迁移；微信草稿、日期、WPS 文件和备注保留。应用退出、后台、重开使未完成任务暂停。
- 官方绿色 SVG 与机器人本地打包；录屏帧只在 `reference/private/frames/workbuddy/`，不进入 HAP、Web 或源码 ZIP。

## 自动化与浏览器：通过

- `npm run check`：通过。
- `npm test`：48/48，通过；覆盖乱序、旧目标、重复发送、任务隔离、计划／问答、暂停恢复、四类成果、刷新保护、迁移、自动化日期、八项轮换、邮件草稿、专家召唤草稿保护。
- 最终全套浏览器回归：13/13，通过（8 项原有场景＋5 项 WorkBuddy），耗时 80.5 秒，无失败或重试通过。
- 新测试覆盖手机显式激活、emoji 删除／撤销、剪切粘贴、实时同步与原子提交；四种成果及 WPS 编辑模式；计划／停止继续；本地配置保存重开；模型菜单、专家、技能、自动化、资料库、多标签目录和 Buddy 配置。
- 浏览器结果：`artifacts/workbuddy-final-regression.json`；前序记录为 `workbuddy-regression.json`、`workbuddy-browser-result.json`。主要截图：`workbuddy-home.png`、`workbuddy-model.png`、`workbuddy-quote.png`、`workbuddy-experts.png`、`workbuddy-skills.png`、`workbuddy-automation.png`、`workbuddy-library.png`、`workbuddy-directory.png`、`workbuddy-phone.png`。
- 对照录屏：首页、模型菜单、分栏预览、目录、专家、技能、自动化、资料库结构已检查；字形、销售文案、推广卡、平板比例存在登记差异，不宣称 pixel-perfect。
- 浏览器剪贴板验证不替代手机 PasteButton 权限流程；未注入模拟语音来冒充真人转写。

## 构建：通过

- 生产 Web 构建成功；Vite 提示主 JS 超过 500 KB，仍成功生成离线产物。
- 两个签名 HAP 构建成功，版本 1.2.0 / 1002000，名称均 Input Agent，包名不变。
- `npm run package` 检查 ZIP 完整性和 HAP 内每个 Web 文件与 `dist` 字节一致；签名材料留在工程外。
- 产物：`artifacts/hap/{tablet,phone}/entry-default-signed.hap`；`artifacts/delivery/mobile-input-source.zip`、`mobile-input-web.zip` 与 SHA256 清单。

## 真机：部分完成

- 重新枚举目标：59LYD25717200954，MRDI-W10，tablet，API 24。
- 平板签名覆盖安装返回 `install bundle successfully`；EntryAbility 启动返回 `start ability successfully`。已保留原来的微信消息与草稿。真机查看桌面、WorkBuddy 首页和模板菜单，官方图标与机器人正常加载；证据为 `artifacts/workbuddy-device-active.png` 和对应布局。其后 USB 调试暂时离线，等待重新接入。
- 手机重新枚举：5ZFYD25B13000537，SUP-AL90，phone，API 26。覆盖安装返回 `install bundle successfully`，EntryAbility 启动成功，`bm dump` 确认已安装版本 1.2.0 / 1002000；WorkBuddy 双端输入、真人语音及剪贴板验证待完成。
- 用户重新拔插后，手机 HDC 连接恢复；真机待机桌面与右上角连接面板显示正常，已打开配对面板。平板仍未建立 HDC 会话。只读 USB 描述符检查：手机接口为 `ff/50/01`，平板为 `ff/ff/00`，当前未暴露与手机相同的调试接口。已请求平板应用连接面板的地址与配对码，以继续局域网验收；不将 USB 枚举视为调试或应用已连接证据。
- 本轮尚未完成“两台设备拔 USB、关闭电脑调试桥”验收；不以浏览器或 Mac 调试客户连接替代。

待验收：真实按住说话、松开编辑、AI润色及原生剪贴板；局域网双端完整四链路；断线重连后草稿核对；拔 USB 后持续使用。已有版本的人声转写确认不能直接算作本轮 WorkBuddy 语音通过。
