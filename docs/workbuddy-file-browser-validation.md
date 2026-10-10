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
| 第二批浏览器 | **8/8 通过**：PPT 闭环、独立窗口/多标签/显式保存/调宽、Roadmap、票据、版本变化/取消/Back 取消与文字恢复/重新锁定、小屏安全区、断线恢复、丢失保存回执重试 |
| 第一批手机/审批 | **6/6 再次通过** |
| 原有 WorkBuddy | **5/5 再次通过**；四条旧销售链和 WPS、计划/暂停继续、旧输入与设置保留 |
| 生产构建 | 通过；既有大 chunk 警告仍存在 |
| 全量浏览器回归 | 新流程补齐回执丢失用例前，**22/26 通过，4 个既有失败**；最新相关集合另跑 19 条 |

核心覆盖冻结目标、多对象/几何、过期版本、乱序/退休指针、取消、保存与外部版本冲突、关闭放弃、文档局部撤销/重做/重置、重新启动后 operationId 重试、迁移失败、旧分享失效、票据原任务补充/重复/字段验证/重置。浏览器使用生产静态产物和实际独立 bridge，未用侧加载第二个 runtime 或修改源码规避基础问题。

最终交付的 `browser-release.log` 为 **19/19 通过**，包括第二批 8＋第一批 6＋旧 WorkBuddy 5；此运行使用最后的源码所生成 `dist/`，包含可见 Back 取消与恢复、任务类型/节点保留和窗口菜单。25 个待提交文件凭证模式扫描无命中，没有新增二进制、私有素材或依赖。

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

浏览器采用第一批验收中记录的 `artifacts/cloud/playwright.config.ts` 覆盖 `/usr/bin/chromium`。测试自行启动 5191 bridge，不另起同端口服务。窗口菜单复核曾将构建输出隔离在 `artifacts/cloud/second-slice/final-review-dist`，5182 只绑定 127.0.0.1；最终交付也在最新 `dist/` 的 5184 静态服务再次跑相同 19 条：

```sh
npm run build -- --outDir /workspace/mobile-input/artifacts/cloud/second-slice/final-review-dist
python3 -m http.server 5182 --bind 127.0.0.1 --directory artifacts/cloud/second-slice/final-review-dist
TEST_BASE_URL=http://localhost:5182 npx playwright test --config artifacts/cloud/playwright.config.ts tests/workbuddy-file-window.spec.ts tests/workbuddy-mobile.spec.ts tests/workbuddy.spec.ts
```

本轮证据均在忽略目录 `artifacts/cloud/second-slice/`：`core-final.log`、`check-final.log`、`build-final.log`、`browser-all-production.log`、`browser-final.log`、`browser-final-review.log`、`browser-delivery.log`、`browser-release.log`，及 `phone-ppt-preview.png`、`tablet-ppt-window.png`、`independent-file-window.png`、`roadmap-window.png`、`receipt-supplement.png`。首次浏览器尝试因 5190 服务已停止、5186 旧服务失效而无效；改用独立的新静态服务，未视作产品通过或基线失败。

## 边界

这是受控本地演示：不解析/导出真实 PPTX，不理解任意图片，不访问真实票据或税务资料，不调用 OCR/WorkBuddy/付费模型，不要求相机/麦克风权限。Office 的保存更新浏览器本地演示文件与已保存副本，不覆盖磁盘原文件；Markdown 在该模型中自动保存。关闭实际浏览器窗口使用原生未保存提示，主工作台保留工作副本；关闭标签有保存/放弃/取消。

旧 PPT/表格是只读，Word/Markdown 仅纯文本；未实现官方全部格式、OS Open With、账号、权限、云上传、文件路径菜单或多独立执行窗口。每文件 AI 仅显示该文档的本地草稿/修改记录，未接通真实对话模型。存储需要浏览器可写；容量不足会提示失败，用户应保留页面，不作为真正文件系统事务保证。

Figma 由父设计任务维护，本任务没有编辑 Figma；视觉截图只证明云 Web 布局，不宣称像素一致、真人可达性、HAP 安装、原生语音或真机交互。研究依据与未来 8–12 人形成性测试建议在 PRD/spec。没有 PR、合并、强推、公开部署、Drive 上传或共享权限变更；本轮提交推送仅按用户最新授权同步独立工作分支。
