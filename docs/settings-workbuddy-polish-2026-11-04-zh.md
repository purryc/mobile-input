# 设置、WorkBuddy 常驻输入、润色与图片选择更新

日期：2026-11-04。版本仍为 1.4.0；以构建时间、代次和包哈希识别本次维护更新。

## 本轮变化

- 手机和平板使用设置齿轮并保留连接状态。新增共享中文／英文 UI 词典：演示端以平板设置为权威，Mac 控制仅改变手机 UI。用户正文、任务名、附件和生成成果不翻译。
- WorkBuddy 新建、对话、完成和成果查看／编辑继续显示同一个任务 prompt。成果文件、页码、选区及版本作为独立上下文；普通听写不覆盖成果。全屏放映保留专用控制器。完成状态仅在手机顶部任务条显示。
- 平板接受发送后显示一次 180 ms 按压反馈，再进入运行／停止状态。以请求 ID 去重；传输失败、拒绝和重连不冒充接受。
- Prompt 润色按正文需要最多提供“整理结构／精简表达”。只保护最小完整参数锚点，允许普通正文改写；保留材料和参数，成功回填、撤销、过期结果拒绝。未改变原文时如实提示并复位忙碌状态。
- Bilibili 使用品牌粉色及底部安全区布局，InputDock 内部几何保持共享。
- 图片控件统一为“图片选择”。识别图片、照片、本地图片、配图、产品图和拍照；图表、画图和否定表达不误触发。保留旧参数 ID，兼容现有草稿。
- 图片为空时 118 px，仅显示标题、关闭、选择图片和拍摄；有图片时 230 px，显示预览与确认对勾。删除最后一张恢复紧凑状态。选择／拍摄只进入原任务预览，确认后进入 Composer，明确发送后才传输。已采用后句内图片 Chip 继续可点击。

## 主要修改位置

| 范围 | 文件 |
|---|---|
| 语言与设置 | apps/web/src/i18n.ts、ui-labels.json、connection-access.tsx；packages/core/model.ts |
| 任务 prompt 与成果上下文 | packages/core/workbuddy-prompt.ts、workbuddy-deck.ts、web-deck-generation.ts；apps/web/src/workbuddy-input.ts、web-deck-composer.tsx、phone-workbuddy-object.tsx |
| 润色 | packages/core/polish-actions.ts、polish-parameters.ts；apps/web/src/use-phone-editing.ts、runtime.ts、phone-controller.tsx |
| 图片与共享控件 | packages/core/live-workbuddy.ts；apps/web/src/agent-input-view.tsx、phone-live-workbuddy.tsx、phone-live-workbuddy.css、sentence-composer.tsx |
| 设计登记 | reference/workbuddy-widget-assets.json、samples/adaptive-component-registry.json |

其他应用修改主要为显式 UI 文案翻译；测试同步更新设置入口名称。没有新增模型服务或修改 Figma。

## 设计覆盖

| 设计／行为 | 实现 | 验证 |
|---|---|---|
| Figma 1646:11696 空图片控件 | 紧凑双 CTA，无空预览／确认 | 浏览器、手机截图、用户真机确认 |
| Figma 2164:58664 已选图片控件 | 预览与确认，删空折叠 | 浏览器、用户真机确认 |
| 中文／英文，390×844／390×700，三种底栏状态 | 共享 token、固定 InputDock | 浏览器；两端语言同步真机观察 |
| 完成任务／成果页常驻 prompt | 任务输入与成果选区分离 | 核心测试、浏览器、手机实际成果页 |
| 润色回填与参数保护 | 最小锚点、忙碌复位、撤销 | 七入口模拟测试；真实手机 Gemini 正文＋图片 Chip |
| 接受发送反馈 | 请求级一次反馈 | 浏览器原生模拟；真机发送尚未复验 |

设计来源：[空态](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1646-11696)、[有图片](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=2164-58664)。标题按用户最新要求改为“图片选择”；复用已登记本地图标，不引入设计稿示例照片。

## 自动验证

- `npm run check`：通过。
- `npm test`：220/220 通过。
- `TEST_BASE_URL=http://localhost:5187 npx playwright test tests/controller-recovery.spec.ts tests/live-workbuddy.spec.ts tests/settings-persistent-prompt.spec.ts tests/web-deck-native.spec.ts tests/workbuddy-widget-fidelity.spec.ts`：当时版本 18/18 通过。
- 后续增加英文重载用例后：`TEST_BASE_URL=http://localhost:5187 npx playwright test tests/bilibili-input.spec.ts tests/settings-persistent-prompt.spec.ts tests/trackpad-parity.spec.ts`：11/11 通过。两组存在重叠，不相加为独立用例数。
- 连续听写、Mac 自动重连、FC 控制器浏览器回归分别通过；它们不等同本次真机回归。
- `npm run build`：通过，保留现有大 chunk 警告。
- `python3 scripts/build-hap.py --preserve-demo tablet phone`：两端签名构建通过。
- `git diff --check`：通过。

早期回归发现旧入口选择器、英文同名按钮和丢失余额空格的问题，已修正并重跑对应测试。没有把模拟模型结果作为真实生成验收。

## 安装与真机证据

两端同一 Web 构建：`builtAt=1793810733947`，保留代次 `1793741702534`。使用覆盖安装，不卸载、不清空数据；配对、原生密钥和真实 Mac 记录保留。

| 设备／包 | SHA-256 | 安装与启动 |
|---|---|---|
| SUP-AL90 / com.hmilab.mobileinput.phone | b8fd555fdc1ef8c0534865ab1e287a033252a1130f71bb53ecb9c9d7964244cb | 成功 |
| MRDI-W10 / com.hmilab.mobileinput.tablet | c1f1c86080eed6bd4b98b95f584df9d3013ca2952a657a062ee6b1165ce1a5db | 成功 |

实测鸿蒙分布式连接、双端语言切换、任务条、图片入口及紧凑空态。打开已有虚构“需求简报”成果后，手机保留任务 prompt 与文件上下文。使用虚构正文进行一次真实手机 Gemini 润色，正文发生修改、图片 Chip 保留，撤销恢复原文；未发送任务。

用户真机反馈“都正常”：选图／拍摄后先出现预览和对勾，确认后才进入文本框，删除最后一张恢复紧凑双按钮。此项为用户报告，不声称自动化逐步观测了图库和相机两个分支。

私有证据位于忽略目录 `artifacts/settings-update/`：`release.json`、`device/image-empty.jpeg`、`device/artifact-prompt.jpeg`、浏览器多尺寸截图。日志保存于该目录的 logs/。这些截图、设备状态和 HAP 不上传 GitHub。

## 未验证与边界

本轮未重新执行平板真实 Gemini 生成、真机发送反馈、物理拔线、LAN 双端路径、全部七参数真实润色、真实 Mac 发送／文档编辑，以及语音／剪贴板／旋转／USB 切换／⌘Tab 真机全量回归。没有提交真实 Mac 任务。原生模拟测试不替代上述验收。

设备检查期间出现过连接恢复及一次非预期 Mario 切换；重新连接后完成上述检查，根因未确定，不据此宣称持续连接稳定性通过。既有专用审批、补材料及部分旧草稿结构保留原路径。未映射原生／外部错误可能仍显示中文。

## 源码备份

修改前备份已推送 `purryc/mobile-input`：`63ecc4ffff3413c2fb00cd9257274e463fba0910`。本记录随最终源码更新提交；最终远端提交回执保存在忽略的发布记录中。源码备份不包含密钥、签名材料、私人图片、设备状态、视频、压缩包或 HAP。
