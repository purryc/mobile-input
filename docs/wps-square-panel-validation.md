# WPS 方形画笔面板与演讲备注

## 设计来源

2026-10-08 重新读取用户指定的 Figma `ApFLno64NcMoA17MiPFfZh / 109:5269`，逐帧使用 `5:9875`、`5:10065`、`143:9906` 和按压变体 `178:2674` 的设计上下文及截图。

- 常规备注区 536 px；画笔备注区 360 px，内部滚动区域 286 px。
- 画笔模式翻页区 y512；左右两个 168 × 168 px 方块位于 y576，左侧 x22、右侧 x200。
- 左侧五色、同心选色圈、1–12 px 滑杆、撤销和清空；右侧按住绘制，按下为 `#a52d20` 配白色笔图标，按钮文案与位置固定。
- 四个底部工具仍在 y756，右上角应用切换保持原功能。使用真实系统栏，不绘制 Figma 装饰性手势条。
- 本地复用经哈希比对相同的 10 个图标，新增白色笔、选色及滑杆 SVG；根尺寸和哈希见 `reference/presentation-figma.json` 的 `squarePanelRevision`。

## 讲稿与数据保护

六页各补充五段口语讲稿，覆盖项目开场、需求、采购比较、报价、风险、下一步行动。正文见 `packages/core/sales-speaker-notes.ts`，可编辑样例见 `samples/sales-demo.json`。

备注只在手机显示。金额继续以更新后的报价页为准，讲稿没有硬编码会随报价修改而过期的成本、毛利金额。报告刷新保留完整讲稿。

旧版默认一句话备注先备份再升级，备份键为 `mobile-input:backup:speaker-notes-v1`。仅替换已知旧默认内容；保留用户备注、用户标记过的备注、幻灯片正文及其他文件。升级标记保证重启不重复改写。

## 验证结果

- 类型检查、38 项核心测试、生产构建通过。新增测试覆盖备份失败不改数据、只迁移默认备注、重复迁移无副作用、保留自建文件和报告刷新不缩短讲稿。
- WPS 浏览器双端流程通过：备注滚动、方块尺寸和位置、深红按压态、画笔悬停与落笔、页间笔迹、颜色与粗细、撤销/清空、字幕适配、全屏与应用切换、结束提示防重。
- 对照截图：`artifacts/wps-square-panel/figma-default.png`、`figma-ink.png`、`browser-pen-released.png`、`browser-pen-pressed.png`。
- 两端签名 HAP 构建及覆盖安装成功，原生 TCP 重新配对。实际安装状态已升级到长备注。
- 真机确认第 1 页编辑模式、手动开始放映、画笔方块布局、真实按住/释放反馈、备注滚动和翻页后的页码、备注更新。设备截图：`device-default.png`、`device-pen.png`、`device-pressed.png`、`device-scrolled.png`，同在上述证据目录。
- 本轮未重新测试语音识别、姿态方向校准或物理拔 USB；这些功能的原实现保留。只验证本次 WPS 范围，未重跑其他应用的浏览器场景。不声明全界面逐像素一致。

## 交付

更新 Web 构建、两端签名 HAP、`artifacts/delivery/mobile-input-source.zip`、`artifacts/delivery/mobile-input-web.zip` 和校验清单。未 Git push。
