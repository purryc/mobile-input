# Mobile Input 双设备原型

面向销售采购与汇报的平板工作台和手机输入端。桌面保留邮件、WPS、微信、豆包、笔记、天生会画和 Mario 七个入口。微信支持消息推荐、实时草稿和 Hover 半屏／全屏服务页面。手机根据平板对象提供输入和控制。

**当前交付状态：Web、两端签名 HAP 均已构建；两台真机已安装，mDNS 发现和原生 TCP 微信同步已观察。用户已确认真机语音可转写并编辑；拔 USB 后完整演示仍待验收。** 详见 [本轮验收记录](docs/validation-2026-10-08.md)。

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
- 平板右上角打开配对码；手机填 `localhost` 和六位码。
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

1. 平板打开微信 → 陈总，点击对方消息；手机显示原消息、建议回复和相关动作。
2. 点击建议回复立即发送；已有草稿保留。点击平板回复框，手机输入实时同步，点击发送才进入聊天。
3. 按住说话，松开停止；识别结果留在草稿，可编辑、润色、撤销后发送。真实语音仅在手机 HAP 中提供。
4. 日历、提醒、联系人、小艺、备忘录、邮件使用 Hover Sheet；携程、飞书、高德等使用已有全屏演示页面。全部本地模拟，不调用系统日历，不订票、不支付、不发真实邮件。
5. 手机切换按钮每次推进一格，平板显示候选应用；停止点击 1.2 秒后进入。WPS 先到文件首页。
6. Mario 使用本地经典第一关。横屏 FC 手柄 A 跳跃、B 加速、START 暂停，长按 SELECT 重开。

手机系统粘贴通过原生安全控件完成：工具栏点击粘贴后，在系统控件上点“粘贴”。取消或失败保留原草稿。

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

源码备份使用私有仓库 [purryc/mobile-input](https://github.com/purryc/mobile-input)，同版本源码 ZIP 保存到 Google Drive TEMP。约定与恢复方式见 [源码备份](docs/source-backup.md)。
