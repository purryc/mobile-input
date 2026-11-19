# 控件库、小艺 Work 与 Mobile Input 怎样分别更新

| 要改的体验 | 维护入口 | 本地运行 |
| --- | --- | --- |
| 13 个可独立使用的 React 控件、chip、玻璃样式和原色素材 | `packages/input-controls/src`、`public`；卡片演示在同包的 `example` | `npm ci --prefix packages/input-controls`，再运行 `npm run dev --prefix packages/input-controls`，打开 `http://127.0.0.1:5199/compact.html#/duration` |
| 小艺 Work 的识别与推荐、语音光标、附件归属、润色、结果页 | `apps/web/src/workbuddy-demo-*` 是产品界面，`packages/core/workbuddy-demo-*` 是草稿和业务规则 | 仓库根目录运行 `npm ci`、`npm run dev:workbuddy-demo`，打开 `http://127.0.0.1:5198/`；原来的 `widget-library.html?widget=duration` 仍可用 |
| Mobile Input 的手机、平板和应用控制 | `apps/web/src/phone-*`、`tablet*`；设备能力在 `apps/harmony`，协议在 `packages/core` | 根目录运行 `npm ci`、`npm run dev`；设备端构建见 [设备运行说明](build-install.md) |

## 一次控件修改怎样到达产品

1. 从最新主线开短期分支。先在控件库修改组件及相关卡片，执行包内的 `check`、`test`、`test:browser`、`build` 和 `verify:package`。验证录屏、相机或真实设备时另记所用环境。
2. 为控件库选择一个未使用的新版本。运行 `node packages/input-controls/scripts/pack-library.mjs vendor/input-controls` 生成可安装包；包中包含 ESM、类型、源码、样式和带来源的素材。已交给产品的同版本压缩包视为不可变。网站维护在 `apps/design-system`，下载包和控件预览由库的发布流程更新。
3. 小艺要跟进时，单独开应用升级提交，在根目录运行 `npm install --save-exact ./vendor/input-controls/mobile-input-controls-X.Y.Z.tgz`。随提交保存压缩包、`package.json` 和 `package-lock.json`，通过根目录 `npm run check`、`npm test`、`npm run test:workbuddy-demo:service`、`npm run test:workbuddy-demo`、`npm run build:workbuddy-demo`。再按产品自己的流程发布。回退这个升级提交即可恢复原依赖及校验值。
4. 产品自己的改动直接进对应产品，例如“简短的演讲报告”何时出现 10 分钟推荐属于小艺的规则。Mobile Input 本轮继续使用现有控件和协议；将来接入时也单独锁版本。

小艺当前锁定 **1.7.0**，npm 压缩包与控件库提交 `933901e` 的交付包一致。仓库里的同版本源码可供开发与对照。应用从安装包加载代码和桌面样式。

## 产品边界

小艺通过 `@mobile-input/controls` 和 `@mobile-input/controls/desktop.css` 导入。Vite 从已安装版本同步素材到本地 `input-controls/` 路径。宿主提供语言、主题环境、任务目标、已选择的值和媒体回调。输入框持有原文及光标，调用共享渲染器表达 chip 状态。文本润色属于产品。

扫描与屏幕控件默认使用浏览器采集。拍照和扫描在同一个取景器内切换。小艺的屏幕采集保留产品专属工作区选区和系统工具栏。相机浮层使用库导出的 ScannerWidget，小艺负责无画面超时、失败后的文件导入和草稿归属。浏览器工作区回退绘制当前产品的页面参考画面，其范围局限于此页面。本机截图、跨窗口浏览器授权与页面绘制的能力应分别验证。

生成独立交接目录可运行 `node scripts/workbuddy-demo-release.mjs artifacts/workbuddy-demo/release/source`。把该目录压缩成 ZIP，在干净目录解压后使用解压目录内的 `README.md` 和 `npm ci`。产品依赖的固定控件包随 ZIP 提供。

## Mobile Input 后续接入表

下列位置是现有实现或最接近的宿主入口。仅迁移已存在且语义相同的交互；产品能力的新增单独评估。

| 控件 | Mobile Input 现状／接入位置（apps/web/src） | 可共用与需保留的差异 |
| --- | --- | --- |
| 时间 | `phone-agent-editor.tsx` → `agent-input-view.tsx` | 可复用 1–60 分钟的受控值、加减与编辑；保留移动触控区域和目标绑定 |
| 颜色 | `agent-widget-color.tsx`、`phone-workbuddy-adaptive.tsx` | 可复用 HEX、色相和色块；保留手势锁定、目标对象及提交时机 |
| 字体 | `phone-workbuddy-object.tsx` 选区格式工具 | 对象格式编辑有自己的命令；通用字体名选择器可用于将来的同类输入 |
| 配色 | `phone-workbuddy-adaptive.tsx` 的现有主色入口 | 暂无与桌面配色方案等价的面板；整套方案与主色分别处理 |
| 文件 | `phone-agent-editor.tsx`、`phone-workbuddy-adaptive.tsx` 的文件选择 | 可复用文件列表和 chip；保留连接状态、文件传输及目标端确认 |
| 图片 | `agent-input-view.tsx` 的图片入口 | 可复用选择与确认 UI；手机选择器、待确认材料及采用回执仍在宿主 |
| 扫描 | `capture-panel.tsx`、`native-photo-overlay.tsx` 的相机路径 | 可复用文件预览和确认；现有拍照与桌面文档扫描的能力分别验收 |
| 手绘 | `phone-agent-editor.tsx`、`phone-workbuddy-adaptive.tsx` | 可共享归一化笔迹与预览；保留触控坐标、草稿范围与同步 |
| 专家 | `phone-agent-editor.tsx` 的目标 Agent 上下文 | 未发现同等专家选择入口；可接选择视图，候选和路由由宿主提供 |
| 技能 | `phone-agent-editor.tsx` 的目标 Agent 上下文 | 未发现同等技能多选入口；需宿主提供可用能力及权限 |
| 连接器 | `phone-agent-editor.tsx` 的任务上下文 | 未发现同等连接器候选选择；设备配对和外部资料来源分别处理 |
| 输出格式 | `phone-workbuddy-adaptive.tsx` 的格式参数 | 可共享格式候选；保留单值／多值差异及目标端回执 |
| 截图／录屏 | `capture-panel.tsx`、`capture-producer.tsx` | 可共享预览及确认；保留工作屏来源、跨端采集及材料归属 |
