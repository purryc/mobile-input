# WorkBuddy 手机任务与审批：独立云端验收

日期：2026-10-10 UTC。基线 `df71727b6a201b727478f25f7f77beebd590e30d`；独立分支 `workbuddy-mobile-approval`，本次提交可由该分支 Git 历史定位。本记录只报告本轮实际运行；不将旧版 HAP 或初始化任务报告当成本次功能证据。

## 环境与本轮基线

- `/workspace/mobile-input` 位于独立 Linux x64 云环境；初始 HEAD 精确匹配基线，初始工作区干净。父目录 `/workspace` 不是仓库，实际检查在仓库目录运行。
- Node `v24.19.0`，npm `11.9.0`，Chromium `151.0.7922.173`。没有依赖 Mac、真机、密钥或 DevEco。
- `npm ci --cache /tmp/mobile-input-npm-cache` 成功，安装 62 个包；依赖锁文件未改。
- 源码修改前：`npm run check` 通过，`npm test` **48/48** 通过，`npm run build` 通过。
- 基线浏览器重跑使用修改前已构建的独立静态产物、`5187` HTTP 服务和测试自启的 `5191` bridge，**9/13** 通过。第一次对正在修改的 Vite 服务的混合运行受到热更新影响，已作废；验收只采用隔离基线。初始化任务的 7/6 结果单独归属初始化，不与本轮合并。

## 首切片验证

| 检查 | 本轮结果 |
| --- | --- |
| 类型检查 | `npm run check` 通过；最终生产构建也执行 `tsc --noEmit` |
| 核心 | **63/63 通过**，原有 48＋新增 15 |
| 新手机／审批浏览器 | **6/6 通过**，开发服务与最终生产静态产物分别通过，双窗口、390×844 手机视口 |
| 生产构建 | 通过，`dist/` 产物生成；既有大 chunk 警告仍存在 |
| 现有浏览器回归 | **9/13 通过，4 失败**，失败用例集合与隔离基线一致 |
| 旧 WorkBuddy 浏览器 | 原有 **5/5 通过**，包括四条销售链、计划确认／暂停继续、旧手机编辑、预览和设置 |
| FC、连接可靠性、WPS 指针／墨迹 | 相关原有通过用例本轮再次通过 |
| 凭证／素材检查 | 修改文件未命中凭证模式，无新增二进制素材；私有录屏和 Library 交接文件未入源码 |

新核心覆盖：两份输入的隔离和乱序、目标锚点／revision、创建后的跨刷新重试、不串电脑引用／专家、v1 备份失败不部分迁移、审批三分支、不同 command ID 的相同 operationId、旧请求终态保护、到期前／等于／之后、错误任务／请求／版本、文件更新失效、补充后新 ID／版本和再次 Yes、手动暂停不因审批恢复，以及旧全局 undo 不恢复已处理请求。

新浏览器覆盖：

1. 无电脑输入焦点，手机主动打开总览；两草稿切换保留；双击新建仅一个任务，电脑首页不移动。
2. 分享审批→补充条件／演示接收组→新版本待确认→再次 Yes，只产生一个本地模拟记录。
3. No 保留任务与文件；另一任务的待审批保持。
4. 断线后编辑保留本地文字；重配对后显式“恢复到当前草稿”才写回。
5. 工作台刷新文件，使旧 Yes 禁用；显式按最新文件替换后才允许确认。
6. 模拟存储配额导致 v1 备份失败：持久数据保持原字节，WorkBuddy 写入被阻止。

## 既有浏览器失败与证据限制

| 用例 | 隔离基线 | 本次回归 |
| --- | --- | --- |
| connection-access | 长链在 Mario 阶段超时 | 同一用例在游戏加载阶段超时 |
| flow | 长链放映阶段超时 | 已存在的 `getByText('已连接工作台')` 同时匹配面板和状态栏，strict mode 失败 |
| wechat-presentation 的 standby／voice | y 坐标浮点值严格相等失败，例如 765 与 765.47998 | 同类断言失败 |
| wechat | 长链在 Mario 阶段超时 | 同一连接文本的既有重复匹配失败 |

失败用例集合没有新增；其中失败阶段受时序影响。已有失败路径仍未全部执行，因此不宣称全套绿色或所有回归行为获完整证明。未修改产品源码或既有断言规避这些问题。

## 复跑与截图

核心与构建：`npm run check`、`npm test`、`npm run build`。

浏览器原配置使用本机 Chrome；云端在忽略目录创建配置覆盖实际 Chromium 路径。内容如下（命令从仓库根运行）：

```ts
// artifacts/cloud/playwright.config.ts
import base from '../../playwright.config';
export default {
  ...base,
  testDir: '../../tests', outputDir: '../browser',
  webServer: { ...base.webServer, cwd: process.cwd() },
  use: { ...base.use, channel: undefined,
    launchOptions: { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } }
};
```

Web 开发服务使用 `npm run dev -- --port 5190 --strictPort`。测试：

```sh
TEST_BASE_URL=http://localhost:5190 npm run test:browser -- --config artifacts/cloud/playwright.config.ts tests/workbuddy-mobile.spec.ts
```

测试配置自动启动独立 `5191` bridge，不再另启该端口。最终产物另由 `python3 -m http.server 5186 --bind 127.0.0.1 --directory dist` 提供静态浏览器验证，使用相同新测试和 `TEST_BASE_URL=http://localhost:5186`；这只是云主机内的检查服务，没有公开部署。

忽略目录中的本轮证据：`artifacts/cloud/core-final.log`、`build-final.log`、`baseline-browser-pristine.log`、`regression-browser.log`、`mobile-browser.log`、`mobile-browser-production.log`。手机截图：`mobile-task-overview.png`、`mobile-approval-pending.png`、`mobile-approval-updated.png`、`mobile-approval-approved.png`、`mobile-approval-rejected.png`。日志和截图不包含私有邮件或原始录屏，不计作签名安装或真机证据。

## 边界与交付

状态／执行仍由核心和权威浏览器控制，手机只输入命令，bridge 未改。运行时只在 WorkBuddy 前台可见时推进现有本地任务；未接常驻后台服务或真实 WorkBuddy API。新独立草稿只实现文字输入，旧语音桥保留而本轮未做真机识别。分享仅写 `simulation:true` 本地记录；没有真实邮件、分享外链、支付、付费模型调用、账户权限或共享权限变更。

Figma 由父设计任务负责，本次未编辑或绕过其暂停的视觉 QA；功能与 A01/A03/A04/A05–A09 对应，不宣称像素匹配。受控成果对象、草图、触控板、语音目标锁定、局部候选／应用／撤销、材料补充和执行中阻塞审批仍属后续切片。

父提供的只读交接最新 v1（44,843 字节）已通过 Library 分页完整读取。按支持路径 materialize 和一次指定云端目录的重试均返回 `download failed`，未声称本地文件可读；不使用猜测 URL 或新凭证，传输限制未阻碍代码实现。

用户单独授权的基线推送已建立 `codex/cloud-sync-check`，独立 `git ls-remote` 回读为精确基线 SHA。本次实现仅推独立工作分支；main、PR、合并、公开部署与共享权限均未变。
