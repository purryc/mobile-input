# Liquid Glass 色彩与主题契约

2026-10-20。适用于设计系统及生成式快捷面板；本轮不修改运行时。

## 层级与默认值

1. 基础色复用现有 Primitives，补充 Harmony 蓝与中性色。系统蓝为 `#0A59F7`，与当前确认卡片及华为 radio 默认色一致。玻璃材质是本项目设计选择，不称为鸿蒙官方材质参数。
2. Material 定义透明度、文字、边缘、阴影和深浅材质，不绑定某个应用。新增中性文字，避免全局文字偏青。
3. 新的 `Input / Theme` 集合以 `System` 为默认模式；场景色仅改变 accent、tint、focus、背景轻微染色。先继承系统主题，明确进入应用后才应用场景主题。
4. 组件通过语义变量继承所属 Frame 的主题，不固定为 WorkBuddy、Email 或独立写死颜色。状态色、内容色点和第三方 logo 不随主题换色。

## 核心 tokens

| 角色 | 浅色值 | 用法 |
| --- | --- | --- |
| system/accent | #0A59F7 | 默认智慧语音、选中、聚焦、拖动落点 |
| theme/tint | accent / 12% | 语音及选中按钮底色 |
| theme/outline | accent / 42% | 选中、整理态边缘 |
| foundation/text-primary | #182431 | 正文、普通图标 |
| foundation/text-secondary | #566579 | 次要状态 |
| glass/control | 白 / 30% | 普通操作键 |
| glass/dock | 白 / 22% | 固定底栏 |
| foundation/glass-popup | 白 / 72% | 更多弹层，优先保证可读性 |
| foundation/edge | 白 / 78% | 玻璃轮廓 |
| foundation/scrim | #0B1E38 / 14% | 弹层下方遮罩 |
| foundation/dot | #566579 / 38% | 触控板点阵 |

玻璃效果沿用现有原生 GLASS（radius 9、depth 16、refraction .42、dispersion .055）；阴影改为中性蓝灰，统一浅边缘。默认按钮为透明玻璃，主色集中用于可交互状态，不把所有键染蓝。保留既有字号、圆角、触控尺寸和布局。

## 场景映射与状态

- System：鸿蒙蓝；桌面、默认面板、未知场景均用此模式。
- WorkBuddy：继承现有青绿；Bilibili：继承现有粉色；WeChat、Email、Word、Sheet、Presentation、Doubao：复用现有应用基础色。主题集合共十模式（含 System）；Mario 专用控制器保留既有独立材质。
- GoPaint：既有蓝色强调＋深色 Liquid Glass，文字与材质同步切深色，不能只把背景改黑。
- 任务状态继续复用既有 task/draft、running、needsinput、error、stopped、complete；黄色提醒与 pulse 不被主题覆盖。
- 系统蓝按钮和蓝色“已完成”分别绑定交互角色与任务角色，不因数值相似合并。

## 迁移范围与验收

迁移范围扩展到最新控制器、生成过渡、自适应输入 Design System 三个页面，包括历史场景及控件母版。默认及未知场景继承 System；应用主题只由场景外层指定，通用子组件不固定应用主题。保留现有布局、组件引用及原型；状态色、参数实际颜色、第三方标识和 FC 专用材质不参与主题替换。旧语义颜色的绑定逐步迁移，旧变量保留兼容，不作为新组件默认。

- 新组件及实例没有固定的 Email/WorkBuddy 内层主题覆盖。
- 普通/整理/拖动/弹层/触控板使用同一 System 主题，智慧语音不再单独发绿。
- 主题示例用同一组件切换 System、WorkBuddy、Bilibili 与 GoPaint；参数色和状态点保持原语义。
- 12 格、最多九键弹层、点外关闭、连续拖动及现有原型目标保留。
- 回读变量别名、主题模式、原型目标及最终截图；不据静态图声称设备或运行时已同步。

## 依据

- 华为 radio 默认色：<https://developer.huawei.com/consumer/cn/doc/doccenter-atomic-service/components-radio>。
- 本文件现有系统确认卡片 `1834:82863` 与 `system/activation/accent`。
- 当前审查：Email 面板混入固定 WorkBuddy 底栏，popup 使用独立硬编码色；证据 `artifacts/shortcut-panel/theme-before.png`。

## 已交付与验收

- 规范板：Figma `1935:94452`；同组件四主题样例母版 `1935:94481`。
- `Input / Theme` 集合 `1933:94481`：System 为默认模式，含九个应用模式；首轮新增 20 个颜色变量、三个 Liquid Glass 效果样式，本轮补充强调前景与强调底色上的文字两个角色，复用既有 control/dock 和任务状态变量。
- 变量和模式导出：[liquid-glass-tokens.json](liquid-glass-tokens.json)。组件仍保留实例引用和已有图标。
- 已扩展迁移到三个页面，清除通用控件旧 Application 模式覆盖；普通键 30%、底栏 22%、语音强调底色 12%、弹层 72%。渲染回查修正了旧实例不透明白底覆盖，以及换图标后的旧青色。
- 回读无失效别名；本轮 1,860 条原型动作引用无失效目标。四个主题样例共用同一母版，GoPaint 同时切换深色 Material。
- 最终截图：`artifacts/shortcut-panel/theme-after-final.png`、`theme-specimen-final.png`、`theme-popup-final.png`。真实设备、动态可读性及应用代码未纳入本轮验收。

## 深色前景与迁移约束 · 2026-10-20

- 分离强调填充、强调前景和强调填充上的文字。GoPaint 强调填充继续 #4D85FF；深色玻璃上的交互前景用 #A9C7FF；蓝色实底按钮用 #081427 深色文字。普通文字和图标使用 #F5F7FC，次级 #AAB6C9。
- 深色材质在应用容器统一指定，通用底栏、截图图标和格式控件不得残留浅色模式或深青色。
- 不改色轮、预设色、已选颜色、图像和任务状态的语义；不将手机截图中的对比度检查声称为真机验证。
- 迁移已完成：三个 Figma 页面，保持组件引用、布局和既有交互。

## 历史场景迁移验收

- 覆盖 `0:1` 最新控制器与完整原型、`21:6225` 生成过渡、`2:2` Design System。旧应用语义变量转为兼容别名，新绑定直接使用规范 tokens。
- 真实节点回读：控件库 14,792、完整场景 1,997、过渡 42。原型目标回读共 1,860 条，无失效目标；没有修改原型 actions、尺寸、位置或组件引用。
- 旧 Application 显式模式仅保留 FC 控件两种专用状态。系统、九种应用模式和深浅 Material 分工明确。
- 视觉回查：系统桌面、WorkBuddy、微信、Bilibili、GoPaint、原子按钮与 GoPaint 主题样例。修复历史截图图标深青色覆盖和选中笔刷前景。
- 参考纯色对比度：#A9C7FF / #202126 = 9.41:1；#081427 / #4D85FF = 5.37:1。此为 token 计算，不代表所有动态玻璃背景或真机均完成无障碍认证。
- 验证记录：`artifacts/shortcut-panel/theme-history-validation.json`；截图同目录 `*-history-final.png`、`gopaint-final.png`、`gopaint-token-final.png`、`default-migrated.png`。
- 本轮同步设计规则与组件注册说明；未修改应用代码。
