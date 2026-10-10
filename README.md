# Input Agent 双设备原型

当前版本 **v1.2.0** · [版本更新说明](CHANGELOG.md) · [本版验收记录](docs/workbuddy-validation.md)

面向销售采购与汇报的平板工作台和手机输入端。两端应用与桌面入口统一为 **Input Agent**；右上角连接图标统一提供配对与实时状态，WPS／Mario 全屏时也可访问。桌面保留邮件、WPS、微信、豆包、笔记、天生会画、Mario 和 WorkBuddy 八个入口。微信支持消息推荐、实时草稿和 Hover 半屏／全屏服务页面。手机根据平板对象提供输入和控制。

**本轮状态与证据见 [WorkBuddy 验收](docs/workbuddy-validation.md)。** 逐页 IA、录屏时间码及模拟边界见 [WorkBuddy 信息架构](docs/workbuddy-ia.md)。

## 浏览器运行

需要 Node.js 22 或更高版本。

```sh
npm ci
npm run bridge
```

另开终端：

```sh
npm run dev
```

- 平板：<http://localhost:5188/>
- 手机：<http://localhost:5188/?role=phone>
- 两端右上角点击连接图标。平板显示配对码；手机填 `localhost` 和六位码。扫码及局域网发现需使用原生 HAP。
- 使用真实手机浏览器时，地址换为电脑的局域网 IP。浏览器调试版依赖电脑上的调试桥。
- 单平板、单手机。重复打开第二个平板浏览器不会替换当前工作台。

```sh
npm test
npm run check
npx playwright test
npm run build
npm run samples
```

浏览器自动化使用本机 Google Chrome，运行测试前需要启动 Web 服务；测试自动启动独立的 5191 调试桥，避免影响正在演示的 5189 会话。`dist/` 是完整静态产物，可用任意静态服务器打开；浏览器双端通信仍需调试桥。HAP 使用随包的静态资源与原生 TCP 服务。

## 两个 HAP

```sh
npm run build
npm run build:hap
```

构建依赖 `/Applications/DevEco-Studio.app` 内 SDK（本机 API 22 / HarmonyOS 6.0.2）。脚本在以下隔离目录构建，保留 DevEco 自动签名配置：

- `~/.cache/mobile-input-tablet`
- `~/.cache/mobile-input-phone`

产物位于 `artifacts/hap/tablet/` 和 `artifacts/hap/phone/`。首次没有签名配置时只能得到 `entry-default-unsigned.hap`，无法安装。**不要把 unsigned 改名为 signed。**

在 DevEco 打开上述缓存工程，在 Project Structure → Signing Configs 登录华为开发者账号并启用自动签名，选择对应真机。平板包名 `com.hmilab.mobileinput.tablet`，手机包名 `com.hmilab.mobileinput.phone`。两个应用都需要自己的签名配置。账号与签名材料保留在本机缓存或 `~/.ohos`，不要复制回源码。

完成签名配置后重新运行 `npm run build:hap`。安装命令见 [构建与安装](docs/build-install.md)。

## 微信与 Hover 演示

1. 平板打开微信 → 陈总，手机保持待机。点击对方消息只高亮平板气泡；点击回复框，经过输入栏闪光和 2 秒读屏，手机才显示原消息、两条建议回复与三个“推荐下一步”。
2. 点击建议回复立即发送；独立草稿保留。手机输入实时同步到平板回复框，点击发送才进入聊天。
3. 按住说话，松开停止；识别结果留在草稿，可编辑、润色、撤销后发送。真实语音仅在手机 HAP 中提供。
4. 日历、提醒、联系人、小艺、备忘录、邮件使用 Hover Sheet；携程、飞书、高德等使用已有全屏演示页面。全部本地模拟，不调用系统日历，不订票、不支付、不发真实邮件。
5. 手机切换按钮每次推进一格，平板显示候选应用；停止点击 1.2 秒后进入。WPS 从销售汇报的编辑模式第一页开始，选择全屏后才放映；返回依次退出放映、编辑页、文件首页和桌面。
6. Mario 使用本地经典第一关。横屏 FC 手柄 A 跳跃、B 加速、START 暂停，长按 SELECT 重开。

手机系统粘贴通过原生安全控件完成：工具栏点击粘贴后，在系统控件上点“粘贴”。取消或失败保留原草稿。

FC 手柄已按指定 Figma 游戏区重做：进入 Mario 请求原生横屏，右上角独立切换应用，支持多指按键和连续轮换。两端均已覆盖安装 1.2.0；FC 专项验收边界见 [FC 横屏验收](docs/fc-landscape-validation.md)，本版真机记录见 [WorkBuddy 验收](docs/workbuddy-validation.md)。

## 销售演示路径

1. 平板连接手机，两端显示已连接。
2. 邮件打开客户采购需求，进入供应商附件报价表。
3. 选中 B4 数量，手机输入 40，写入后平板读回，毛利同步计算。
4. 点击「更新汇报数据」，进入 WPS 文字。产品清单和报价更新；用户手改的段落保留。
5. 选择方案段落，手机输入文字，或在已签名 HAP 使用内置语音。停止录音后编辑，再手动写入。
6. WPS 演示放映，手机显示备注与计时，两端可翻页；平板放映画面不显示备注。
7. 天生会画使用手机调色、换笔刷和橡皮擦，平板落笔。
8. 打开 Super Mario，手机横屏双指控制移动与跳跃，暂停或重开。

所有邮件内容均为新编虚构内容，发送只写入本机演示记录；AI 对话为演示界面，没有接模型。WPS 是交互复刻，不读取或保存真实 Office 格式。示例内容源在 `packages/core/model.ts`，JSON 导出位于 `samples/sales-demo.json`。

## 文件

- `apps/web/`：React / TypeScript 两端界面与本地媒体。
- `apps/harmony/`：原生壳、TCP、mDNS、扫码与 Core Speech Kit。
- `packages/core/`：销售数据、权威状态和命令校验。
- `vendor/`：指定 Mario 源码及修改说明。
- `docs/`：协议、素材边界、验收与安装记录。
- `artifacts/`：本地生成的 HAP、交付 ZIP、校验和与截图。

按项目规则不执行自动 Git push。

源码备份使用公开仓库 [purryc/mobile-input](https://github.com/purryc/mobile-input)，用户明确要求同步后才推送。[GitHub 版本更新](https://github.com/purryc/mobile-input/releases)与 `CHANGELOG.md` 说明各版变化。Google Drive TEMP 仅在用户要求上传时更新；本次 1.2.0 备份范围为 GitHub。约定与恢复方式见 [源码备份](docs/source-backup.md)。

## 微信与演示控制更新
- 打开微信直接进入陈总的四条闲聊与最后一条销售消息。手机先保持待机，点击平板窄输入栏后闪烁、扫光，再依次显示两条回复和日程、高德导航、飞书简报。录音按钮固定，转写可编辑；润色位于输入区底部。
- 首次升级备份平板旧聊天到 `mobile-input:backup:boss-scene-v1`，手机草稿到 `mobile-input:phone-draft:wx-boss:backup-v1`。后续启动不重置。场景日期首次生成后固定。
- WPS 手机采用最新 Figma 109:5269 控制器，画笔颜色、粗细、撤销与清空常驻展开。选画笔即显示悬停光标，按住绘制，松手继续悬停；激光按图标开关。手机屏幕朝上、顶部指向平板，每次激活以当前姿态归中，两个方向灵敏度提高30%。详见 `docs/wps-hover-imu-validation.md`。
- 浏览器语音与姿态适配器仅用于自动化协议验证，不构成真机证据。分层结果见 `docs/wechat-presentation-validation.md`。

### 待机桌面与读屏节奏（场景 v3）
手机在微信未激活时显示审核过的桌面截图。只有点击平板输入框，经过两次边缘闪光和消息扫光，手机才展示两条回复与三个动作。点消息只高亮平板气泡。场景升级按版本备份聊天，并保留原日期和未发送草稿。
FC 使用原生安全区居中，不绘制额外手势条。Mario 在平板全屏等比显示，左上角返回保留。最新验收见 `docs/standby-reading-game-validation.md`。

## WorkBuddy 销售演示

桌面打开 WorkBuddy → 新建任务。引用资料库中的客户需求，输入“整理客户需求简报”；召唤采购分析专家后输入“比较供应商报价”；输入“生成客户方案”并在手机补充要求；最后输入“生成六页销售汇报”，预览成果后进入 WPS 编辑及全屏放映。模板只填入，不自动发送。

手机保持待机；点击平板输入框、文件或可编辑字段才进入 WorkBuddy 输入页。所有模型、分享、连接器、渠道与邮件操作均为本地演示；没有对外发送或账号集成。

## 自适应输入设计资料

[设计系统说明](docs/adaptive-input-design-system.md)、`samples/adaptive-component-registry.json`、`samples/adaptive-ui-plan-examples.json` 与 `scripts/figma-adaptive-*.js` 保存可编辑设计目录和构建过程。这部分为 Figma 设计交付；当前应用未实现自适应渲染、真实模型决策或折叠 PC 适配。
