# WPS 文档快捷键面板预览

入口：本机预览服务运行时打开 http://127.0.0.1:8797 。这是由 Codex 根据 Design MD 和已有定义表生成的单个方案，使用真正的 OpenUI Renderer。未调用在线生成 API、未连接真实 WPS、未操作原生设备。

## 最新设计规则

用户随后明确按WPS子应用解析图标：文档/表格/演示分别根据W／S／P图标取色，主图标仅适用于首页；原Design Skill G15已有三类子应用的蓝／绿／橙红约定。本目录当前橙红预览保留为主图标取色算法样例，不是WPS文字场景的最终主题；尚未实现子应用识别与主题切换。后续生成直接读取[Notion Design](https://app.notion.com/p/3f9194db24c38165996cf89b22e7d69e) 的T01–T06及P01–P07，不能沿用此样例的全局主图标假设。

## 图标取色更新 · 2026-10-22

按用户要求，本预览已从Word预置蓝切为项目中的WPS桌面SVG图标取色。结果为 `#FF4419`，选中实底上的文字为 `#182431`，计算对比度约4.56:1；浅色背景为 `#FFF3F0 / #FFFAF9 / #FFE9E3`。该结果不声称是厂商官方品牌标准色，也没有读取操作系统当前桌面的安装图标。

`extract-icon-theme.mjs` 将本地SVG栅格化为128px画布，排除透明、近白、低饱和和过暗像素，再按12度色相桶统计候选，选主桶像素均值；白底不会因面积大成为主色。记录图标SHA-256和算法版本。当前阈值是预览启发式，多色、灰度图标回退System蓝；跨应用上线前需要样本校准。当前输入格式为已有SVG，位图入口尚未封装。用户指定图标来源优先级只作用于本预览，既有设计系统Word token保持原值。

旧蓝色截图保留为artifacts内的 `*-word-blue.png`。

## 可交互内容

- 11个主要动作＋固定 More；默认溢出为删除线和两端对齐。
- 加粗、斜体、下划线、删除线、颜色、字号、对齐和链接作用于右侧唯一示例段落，状态由本地文档回读。
- 编辑底栏支持本地复制/剪切/粘贴/删除/撤销/重做；剪贴板是预览内的独立缓冲区。保存只写当前浏览器的示例存储。
- 键盘输入到示例段落；触控板展示本地指针移动。语音、采集、右键及未制作的键盘分区明确禁用。
- 长按450ms进入整理；拖放或选定键后点目标位置完成换位，More固定。顺序保存在当前浏览器。Escape关闭弹层或结束整理。
- 紧凑布局为7动作＋More，恢复尺寸后原位恢复。链接/颜色一次一个辅助面板；颜色立即应用。

## 复用与新增的边界

| 内容 | 来源与处理 |
| --- | --- |
| 主色与背景 | 项目WPS桌面图标取色 `#FF4419`；背景按Design MD的6.5% / 2.5% / 12%白色混合派生 |
| 按键外观 | 已登记 `professional-action-key`，Figma `1568:38898`；本次编写与该设计对应的预览renderer，采用已约定96px / 72px模板，并非复用了此前不存在的通用运行时组件 |
| 固定输入底栏 | 直接导入 `apps/web/src/input-dock.css`，复用 `assets/figma/input-dock/` SVG与结构；只覆盖外层主题token。未导入与真实会话耦合的InputDock运行逻辑 |
| 动作与名称 | 父级 `definitions.json`；每个键保留functionId。字号增减、三种对齐是相同功能的不同参数操作，去重需同时考虑参数 |
| 功能图标 | 项目已安装Lucide组件导出SVG；主图标遵循表内映射，对齐与字号增减按参数使用语义变体 |
| 应用标识 | 已审核的 `apps/web/public/assets/apps/wps.svg`；保留原色 |
| OpenUI | 使用独立体验项目已安装的 `@openuidev/react-lang` 1.0.1 与Zod4；仅封装ShortcutPanel、ShortcutKey和ActivateKey白名单 |
| 执行适配 | 本次新增独立示例文档adapter；字号8–48pt为此fixture范围，不是WPS能力声明。所有状态、成功提示和保存仅对应示例 |

## 文件与复现

- `preview.tsx` / `preview.css`：可编辑视图、组件封装、本地交互。
- `extract-icon-theme.mjs`：本地图标像素分析与主题派生，不涉及在线模型。
- `build.mjs`：从定义表/提取主题/已安装图标生成 `catalog.json`，使用现有esbuild输出到忽略的artifacts目录。
- `panel.openui`：首次生成的OpenUI Lang计划；按钮ID只允许目录中13项。
- `tsconfig.json`：此预览独立类型检查，未加入生产应用入口。

在项目根目录运行：

```sh
node docs/input-design-contract/wps-shortcut-preview/build.mjs
./node_modules/.bin/tsc -p docs/input-design-contract/wps-shortcut-preview/tsconfig.json
python3 -m http.server 8797 --bind 127.0.0.1 --directory artifacts/wps-shortcut-preview-2026-10-22
```

构建默认读取同机 `/Users/hmi/Documents/openui-playground/app/node_modules`。可用 `OPENUI_NODE_MODULES` 指向另一个已有安装；迁移机器时同时更新tsconfig中的两条OpenUI/Zod解析路径。没有新增依赖或修改主项目锁文件。图标提取使用现有Playwright及已安装Chrome，因此构建机需具备Chrome。

## 本次验证 · 2026-10-22

独立TypeScript检查和esbuild构建通过。Chrome浏览器21项检查通过：真实OpenUI解析与动作分发、格式状态、1pt步进、颜色、对齐、链接、保存、撤销、More、键盘、长按不执行、排序/刷新保留、紧凑容量、390px无横向溢出、展开dock为368px；无页面错误。

证据在 `artifacts/wps-shortcut-preview-2026-10-22/`：`validation.json`、`check.mjs`、`library-schema.json`、`desktop.png`、`phone.png`、`mobile.png`。截图是浏览器预览证据。未做真机、真实WPS、在线模型多次生成或完整生产回归验收。
