# WorkBuddy 第二批云端验收

2026-10-10 UTC；分支 `workbuddy-mobile-approval`。第一批起点 `42aff172309c167f9b8aa70c7a26aefcb1db9fea`，main 基线 `df71727b6a201b727478f25f7f77beebd590e30d`。首次云端启动与 48 条原核心基线见 `workbuddy-mobile-cloud-validation.md`；本页只记录第二批新跑结果。

## 实现与协议

- 独立文件窗口：标签、图标/文件名、拖动和菜单重排、少量文档新建、工作空间/最近文件、页缩略图、画布、默认收起可调宽 AI 栏、保存态及关闭选择。可打开一个真实附属 Web 窗口，snapshot/command/ack 走校验 source/origin 的同源 opener；主工作台仍是唯一执行器。
- 可编辑 PPT：稳定页/对象 ID、实际几何/文本/颜色/字号、文档单调版本、冻结引用草稿、前后 patch、确认应用、手动保存、文档内撤销重做与可撤销的演示重置。原全局 State.undo 不参与，其他任务/审批不回退。
- 手机：触控板点选/框选，以及对象列表/整页的替代路径；先选再点击文字/演示语音，锁定文档/页/对象/版本，固定下部预览与确认控件。版本变化阻止旧预览，显式重新锁定保留文字；断线保留、回执丢失复用原 operationId。
- 手绘 Roadmap：内置手绘 SVG → 模拟节点读取 → 用户修改与核对 → 真正生成可编辑 Roadmap 对象；可继续指向修改和重置。
- 补票据：PPT 中缺材料通知 → 示例拍照/附件 → 字段核对/演示语音修正 → 补到同一个任务与本地 CSV/表格 → 返回原 PPT 引用、草稿和预览；可取消和重置。

切换其他应用后重新打开 WorkBuddy 仍进入原有新任务界面，文件/选区/草稿继续保留，可显式重新打开文件；新子模型初次追加先备份旧 WorkBuddy；备份失败阻止写入并保留旧存储字节。审批沿用第一批协议；PPT 保存后的文件 revision 使旧分享请求失效。受控 PPT 的旧文本预览入口导向新窗口，阻止旧字符串编辑/刷新破坏对象一致性。

## 实际检查

环境继续为 Linux 云端 `/workspace/mobile-input`，Node v24.19.0、npm 11.9.0、Chromium 151.0.7922.173。`npm ls --depth=0` 成功，无新增依赖或锁文件变化；不依赖 Mac、设备或密钥。

| 检查 | 第二批结果 |
|---|---|
| 类型检查 | `npm run check` 通过；最新生产构建也执行 `tsc --noEmit` |
| 全部核心测试 | **83/83 通过**；第一批 63＋第二批 20 |
| 第二批浏览器 | **12/12 通过**：原有 8 个闭环与边界用例，加 4 个取消恢复边界用例 |
| 第一批手机/审批 | **6/6 再次通过** |
| 原有 WorkBuddy | **5/5 再次通过**；四条旧销售链和 WPS、计划/暂停继续、旧输入与设置保留 |
| 生产构建 | 通过；既有大 chunk 警告仍存在 |
| 全量浏览器回归 | 新流程补齐回执丢失用例前，**22/26 通过，4 个既有失败**；该次相关集合另跑 19 条，取消边界追加复核见下节 |

核心覆盖冻结目标、多对象/几何、过期版本、乱序/退休指针、取消、保存与外部版本冲突、关闭放弃、文档局部撤销/重做/重置、重新启动后 operationId 重试、迁移失败、旧分享失效、票据原任务补充/重复/字段验证/重置。浏览器使用生产静态产物和实际独立 bridge，未用侧加载第二个 runtime 或修改源码规避基础问题。

第二批初次交付的 `browser-release.log` 为 **19/19 通过**，包括第二批 8＋第一批 6＋旧 WorkBuddy 5；此运行使用当时的源码所生成 `dist/`，包含可见 Back 取消与恢复、任务类型/节点保留和窗口菜单。初次交付的 25 个文件凭证模式扫描无命中，没有新增二进制、私有素材或依赖。

## 取消草稿边界追加复核

起点 `f9df17230f03df19d44f73b65fc1513c00c995bf`。延迟首个 `wb-doc-draft-edit` 回执，首段已写入工作台、第二段仅在手机排队时，旧实现的取消与 Back 恢复只读取服务端首段；断线后 Back 没有恢复入口。三个用例先失败，日志 `cancel-repro.log`，修复后通过。另一个用例验证已确认的手机旧缓存不能覆盖工作台对同一个草稿的后续输入：先复现旧缓存恢复错误，再修复并通过，日志 `cancel-clean-cache-repro.log`。

取消和 Back 统一调用输入队列的取消入口，先记录本端最新文字与本地取消标志，停止排队输入，再向核心请求取消。离线返回和页面重新进入可以找到保留记录；恢复结束旧草稿，绑定原文件、页、对象与文档版本，不使用随后选中的副标题。迟到回执不再把已取消记录标为已同步。只在手机有未同步文字或本端取消时优先使用本地记录；已确认缓存则以工作台当前草稿为准。文档版本变化仍拒绝自动恢复，预览/确认约束未放宽。

四个追加浏览器用例 `cancel-fixed-dev.log` 已完成先失败后通过：延迟回执后取消、延迟回执后 Back、断线 Back 后恢复，以及工作台后续文字优先于干净手机缓存。没有应用文档修改；原版本与原对象断言成立。原有的全量浏览器失败集合继续作为历史限制，不将相关集合通过宣称为全套通过。

一次追加生产集合运行 **22/23 通过**：原有的文档断线用例在首次编辑框出现前立刻断网，`wb-doc-draft-open` 尚未完成，因此离线输入框不存在。日志保留为 `cancel-browser-release-attempt.log`。测试补齐“编辑框已可见”的断网前置条件，保留文字、目标和未应用断言，独立复核 **1/1 通过**，日志 `cancel-offline-recheck.log`；未为此改变产品源码。

最后一次最新 `dist/` 生产复核 **23/23 通过**：第二批 12＋第一批手机/审批 6＋原 WorkBuddy 5，日志 `cancel-browser-release.log`。追加修复后 `npm run check`、全部核心测试 **83/83**、`npm run build` 再次通过，日志 `cancel-check.log`、`cancel-core.log`、`cancel-build.log`。六个变更文件只有源码、测试和文档，差异中的凭证模式扫描无命中，未新增依赖、二进制或私有素材。这些是独立云环境手动运行的检查，不是 GitHub CI；当前 Git tree 无 `.github/workflows` 配置。

## 既有失败集合

本轮与第一批隔离基线同为 `connection-access`、`flow`、`wechat-presentation` 的 standby/voice、`wechat` 四个用例：

- connection-access：30 秒长链超时，Mario 阶段 frame 操作未完成。
- flow：旧 `getByText('已连接工作台')` 同时匹配两个元素，strict mode 失败。
- wechat-presentation：既有坐标严格相等断言，765 对 765.0610961914062。
- wechat：30 秒长链超时；失败阶段会随时序变化。

未改这些既有用例或无关产品源码，不宣称全套绿色。这些失败路径的后续行为仍未获完整证明。

## 复跑与证据

```sh
npm run check
npm test
npm run build
```

浏览器采用第一批验收中记录的 `artifacts/cloud/playwright.config.ts` 覆盖 `/usr/bin/chromium`。测试自行启动 5191 bridge，不另起同端口服务。窗口菜单复核曾将构建输出隔离在 `artifacts/cloud/second-slice/final-review-dist`，5182 只绑定 127.0.0.1；初次交付在 `dist/` 的 5184 静态服务跑 19 条，追加修复后同命令在最新 `dist/` 跑 23 条：

```sh
npm run build -- --outDir /workspace/mobile-input/artifacts/cloud/second-slice/final-review-dist
python3 -m http.server 5182 --bind 127.0.0.1 --directory artifacts/cloud/second-slice/final-review-dist
TEST_BASE_URL=http://localhost:5182 npx playwright test --config artifacts/cloud/playwright.config.ts tests/workbuddy-file-window.spec.ts tests/workbuddy-mobile.spec.ts tests/workbuddy.spec.ts
```

本轮证据均在忽略目录 `artifacts/cloud/second-slice/`：`core-final.log`、`check-final.log`、`build-final.log`、`browser-all-production.log`、`browser-final.log`、`browser-final-review.log`、`browser-delivery.log`、`browser-release.log`，及 `phone-ppt-preview.png`、`tablet-ppt-window.png`、`independent-file-window.png`、`roadmap-window.png`、`receipt-supplement.png`。首次浏览器尝试因 5190 服务已停止、5186 旧服务失效而无效；改用独立的新静态服务，未视作产品通过或基线失败。

追加复核日志的名称见上节；上述截图由最终 23 条生产测试重新写出。凭据和截图未提交 GitHub，不提供虚构的仓库文件链接；可通过独立 Library 交付附件保留，不上传私有来源或环境文件。没有本轮演示视频。

## 边界

这是受控本地演示：不解析/导出真实 PPTX，不理解任意图片，不访问真实票据或税务资料，不调用 OCR/WorkBuddy/付费模型，不要求相机/麦克风权限。Office 的保存更新浏览器本地演示文件与已保存副本，不覆盖磁盘原文件；Markdown 在该模型中自动保存。关闭实际浏览器窗口使用原生未保存提示，主工作台保留工作副本；关闭标签有保存/放弃/取消。

旧 PPT/表格是只读，Word/Markdown 仅纯文本；未实现官方全部格式、OS Open With、账号、权限、云上传、文件路径菜单或多独立执行窗口。每文件 AI 仅显示该文档的本地草稿/修改记录，未接通真实对话模型。存储需要浏览器可写；容量不足会提示失败，用户应保留页面，不作为真正文件系统事务保证。

Figma 由父设计任务维护，本任务没有编辑 Figma；视觉截图只证明云 Web 布局，不宣称像素一致、真人可达性、HAP 安装、原生语音或真机交互。研究依据与未来 8–12 人形成性测试建议在 PRD/spec。没有 PR、合并、强推、公开部署、Drive 上传或共享权限变更；本轮提交推送仅按用户最新授权同步独立工作分支。
