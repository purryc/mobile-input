> 最新状态见 [2026-10-08 本轮验收](validation-2026-10-08.md)。以下为保留的历史记录。

# 验收记录 — 2026-10-07

## 已通过：本地代码／浏览器

- TypeScript 检查和 Vite production build；同样 3 项浏览器流程在 production 静态产物端口 5190 上再次通过。
- 13 项核心测试：金额、目标过期、重复命令、负数／小数数量校验、内部邮件发送、显式刷新与手改保留、翻页会话、撤销、所有入口、画笔及按键释放。
- 3 项 Chrome 双页面测试：销售连续演示、所有 15 个应用入口、本地视频播放时间真实推进与暂停、手机重新配对读取当前页、浏览器不伪造语音、手机无水平溢出。
- 完整销售链：手机写邮件 → 修改两行数量 → 切换对象保留草稿并重新确认 → 更新汇报数据 → 方案段落编辑 → PPT 手机／平板双向翻页。
- 放映画面 DOM 不含演讲者备注；手机显示备注和当前页。
- Mario 从本地资源加载，Chrome 模拟双触点同时按右与跳跃，读取实际游戏位移及持有键；松手后键集合清空。
- 联调修复：晚到的上一条输入回执覆盖新草稿、目标切换后旧提交、原游戏 keyup 节流、游戏画面缩放、后台时间追赶、旧放映会话翻页。

这些检查不证明真机触摸、局域网、音频、性能或独立运行。

## 已通过：平板签名、安装与启动

2026-10-07，用户完成华为账号登录后，DevEco 为平板项目生成专用签名。在本机缓存配置中关联 default 产品后构建出 `artifacts/hap/tablet/entry-default-signed.hap`，HDC 安装返回 `install bundle successfully`，启动返回 `start ability successfully`。应用名称为「手机 Input」，蓝底双设备图标。

首次真机启动发现 Vite 模块与 CSS 被 rawfile 协议的 CORS 拦截。已改为原生拦截 `https://mobile-input.invalid/` 下的请求，从 HAP 内读取同源文件，未放宽 Web 安全开关，也无需电脑 HTTP 服务。修复后真机截图可见壁纸、小组件、7 个入口及 Mario 图标。随后覆盖更新并隐藏系统状态栏；最新真机截图显示 WPS 文字方案页面：`artifacts/visual-qa/tablet-installed.jpeg`。这不证明双机通信和语音已经通过。

手机端共用资源加载修复，仍为未签名包。签名材料只留在本机缓存与系统签名目录，不进入源码与交付 ZIP。

## 待真机验证

- 手机签名安装和桌面启动；平板系统桌面图标点击启动。
- ArkWeb 原生代理、媒体与子页面资源、网络权限、扫码和 mDNS 自动发现。
- 原生 TCP 双向输入、过期对象拒绝、重连同步和连续翻页。
- 普通话本机识别的真实结果，停止／取消／失败／在线入口与权限拒绝恢复。
- 多指游戏输入、断线／切后台／退出后的释放。
- 拔 USB、关闭电脑服务后完整销售与演讲链路。

## 视觉与内容边界

界面按录屏重建为可交互组件，内容为虚构销售故事。覆盖主界面和主要结构，不宣称像素级一致。WPS 已确认安装包 `cn.wps.office.hap`，并启动实际版本；系统截屏出现中央大块黑色区域，未获得三个编辑器可用的完整视觉参考。因此 WPS 当前是工作流复刻，实际版本的精确视觉对齐仍待补充参考。

邮件正文、主题、人名、邮箱、头像、签名与附件均从虚构数据构造；所有联系人使用 example.com。没有使用原邮件截图。唯一从录屏加入运行包的媒体是 B 站非邮件场景的 7 秒局部视频，裁切掉账户与侧边栏；原始 500MB 录屏、联系表和 WPS 系统截图均不进入应用包。

两个 HAP 解包检查：邮件地址仅包含四个 example.com 示例地址；媒体仅包含 Mario 两张精灵图和已检查的非邮件视频片段；没有 reference、VID 原录屏或私有截图。HAP 中每个 Web 文件均与 dist 逐字节比对，交付 ZIP 已通过完整性校验，SHA-256 在 artifacts/delivery/manifest.json。

浏览器截图位于 `artifacts/`，包含 desktop、mail、sheet、word、presentation、phone-presentation、paint、mario。

## Recording-led visual revision — 2026-10-07

See `../design-qa.md` for current evidence and open differences. The interface has been rebuilt from selected original frames and 113 reviewed non-mail crops. Stable desktop authority was corrected to 608 seconds. The zero-pixel visual target is **not passed**. Existing earlier screenshots and browser tests document the earlier UI; `artifacts/visual-qa/` documents this revision. Typecheck, 13 core tests, production build, two unsigned HAP builds and the in-app two-tab sales/presentation checks are recorded separately in that report.
