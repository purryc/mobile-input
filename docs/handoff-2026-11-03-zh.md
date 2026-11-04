# Input Agent 开发交接（中文）

资料日期：2026-11-03（America/Toronto）。这是当前工作区源码交接，包含未提交修改；不是 GitHub 已发布版本。基准提交 `4179e0ab78190afc6a9932088adf27eacb5b4730`。具体文件以交付 manifest 的 SHA-256 为准。

## 1. 接手先读什么

先读根目录 `AGENTS.md` 中最新条目，再读本文及英文对应版本。较早 README、验收记录中的“立即发送建议回复”“手机假桌面”“采用即传输”等行为已被新规则覆盖；不能把历史记录当成当前行为。设计规则仍以 Notion 为准，Figma 提供视觉，不在本地建立另一份设计规则镜像。

- 设计：https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=2316-110521
- Design：https://app.notion.com/p/3f9194db24c38165996cf89b22e7d69e
- PRD：https://app.notion.com/p/3f9194db24c381bf8b76c804062303e3
- 本轮工程记录：`docs/workbuddy-widget-fidelity-2026-11-03.md`、`docs/workbuddy-inline-input-2026-11-03.md`、`docs/workbuddy-send-repair-2026-11-03.md`。

## 2. 产品边界和运行架构

手机端选择目标：平板演示、真实 Mac 应用、真实鸿蒙应用（Mac 桥接）。同一应用共用控制器布局、Composer、参数 Widget、AI 润色和 InputDock，由适配器提供状态和能力。真实鸿蒙跨应用控制尚未接通，不得展示演示数据冒充可用。

平板演示包含邮件、WPS、微信、豆包、笔记、天生会画、Mario、WorkBuddy、Bilibili 九个入口。它们是交互复刻环境，不是直接操控这些原生应用。Hover 第三方推荐页、邮件发送、审批等均为本地演示行为。真实 Mac 控制是独立分支，已有 Codex、WorkBuddy、WPS 适配，其他应用不能据此推定可用。

平板演示运行时不需要 PC：手机通过扫码 LAN 或鸿蒙分布式向平板发送输入和材料，平板是权威状态源。Gemini 网页幻灯片生成、草图理解、AI 修改均由平板原生组件调用；需要可访问 Gemini 的互联网。已保存的编辑/播放使用本地材料。手机 Gemini 文本润色是另一条独立调用链。Mac 控制需要 Mac companion 运行。浏览器开发版依赖电脑调试桥，不是脱离 PC 的验收证据。

## 3. 代码导航

| 路径 | 职责 |
|---|---|
| `packages/core/` | 共享状态、命令、去重、作用域、业务与协议测试 |
| `packages/core/live-workbuddy.ts` | 演示/Mac 共用的五类参数识别和目标文本投影 |
| `packages/core/web-deck-generation.ts` | Gemini 请求、草图理解、结果与页面绑定校验 |
| `packages/core/polish-parameters.ts` | 润色保护参数片段、校验返回结果 |
| `apps/web/src/phone-controller-frame.tsx` | 与控制目标无关的手机外壳、身份和任务条 |
| `apps/web/src/agent-input-view.tsx`、`agent-widget-color.tsx` | 共享 Composer、照片、颜色、时长、画板组件 |
| `apps/web/src/web-deck-composer.tsx` | 演示 WorkBuddy 输入、材料采用、明确发送 |
| `apps/web/src/phone-live-workbuddy.tsx` | 真实 Mac WorkBuddy 输入适配 |
| `apps/web/src/web-deck-staging.ts` | 原任务归属的手机本地附件和发送冻结状态 |
| `apps/web/src/web-deck-device.ts` | IndexedDB、材料分块、哈希校验、原任务队列 |
| `apps/web/src/runtime.ts` | 双端同步、权威快照、回执和连接恢复 |
| `apps/web/src/web-deck-native.ts`、`web-deck-runner.ts` | 原生模型桥与平板任务执行 |
| `apps/harmony/shared/` | 网络、分布式、语音、选择器、Asset Store、Gemini 原生层 |
| `scripts/mac-bridge/` | Mac 辅助功能/指针/任务适配、认证和 USB 优先重连 |
| `reference/` | 审核后的素材来源；原始录屏不进入交付包 |

## 4. 当前关键行为

- 手机连接并取得权威状态后直接显示对应控制器，没有假的手机桌面。无有效文本目标时不得盲写。
- WorkBuddy 新草稿留在居中输入框的首页；明确发送被接受后才进入底部 Composer 的任务对话。顶部任务条保留，手动打开的键盘/触控板跨任务保持。
- 五类固定参数：颜色、1–60 分钟时长、文件、照片、布局。背景/字体/主题色各自独立；不恢复 Laya，不因识别自动打开 Widget。
- “布局”“排版”“画一下”可建议画板入口。`主题测试，红色` 是已兼容的 ASR 误听，映射为主题色 Chip，但原始正文不被全局改写。否定、改口、手调优先和源文本位置保留。
- 照片先打开图片 Widget，包含图库、拍摄、预览、删除和确认；布局画板为 328×192，工具在下方，支持画笔、橡皮、撤销、清空。颜色面板为 288 px，使用分用途色板、渐变、色相、HEX 和确认。视觉素材见 `reference/workbuddy-widget-assets.json`。
- 文件/照片/已采用草图放在手机 Composer 正文上方。采用、切任务、后台和重连均不提交，也不立即传输附件。只有 Send 冻结本轮正文与附件、完整传输并校验后原子提交；失败保留，结果未知先核对，不重复发送。
- 普通文本继续实时同步。生成后手机显示平板权威状态，支持停止；播放时提供讲稿、前后翻页和退出。
- 已删除“等待平板确认”页脚；发送仍有忙碌保护，没有额外确认步骤。
- 未指定页名的草图作为上下文交给 Gemini，不再因 scope=全文 拒绝已生成结果，也不机械覆盖每一页。明确指定页面时仍校验绑定。
- 连续语音：按住超过 300 ms 开始，松手停止；点击开/再次按下关。句末与静音不结束用户会话。开关采音各一次轻震动；错误使用底部 3 秒 Toast。停止不发送、不润色。
- AI 润色仍是主动调用 Gemini，位于 Composer 外，上下各 8 px、行高 48 px；保护参数、附件、目标及版本，支持撤销，迟到结果不得覆盖新输入。

演示台词：

> 我想做一个十分钟的演示文稿，介绍今年的产品。背景用灰色，字体用黑色，主题色用红色。请参考我的文件，添加一些产品照片。布局我画一下，左边是今年产品总览，右边是分产品的介绍。

资料限制：PDF/TXT/Markdown、PNG/JPEG/WebP，单件 8 MB，最多 12 件，总计 24 MB。没有实现 DOCX/PPTX/XLSX 解析；产物是可编辑网页幻灯片，不等同于完整 Office 文件兼容。

## 5. 本地运行、测试和构建

建议 Node.js 22+，按 lockfile 安装。浏览器测试使用本机 Chrome；HAP 构建还需要 DevEco Studio、对应 SDK/JDK、HDC 及独立签名配置。

```sh
npm ci
npm run bridge
# 另开终端
npm run dev
```

平板 `http://localhost:5188/`，手机 `http://localhost:5188/?role=phone`。浏览器使用扫码网络模式，手机填 `localhost` 和平板配对码。自动化使用独立 5191 桥，开发桥通常为 5189。

```sh
npm run check
npm test
npx playwright test tests/inline-parameters.spec.ts tests/live-workbuddy.spec.ts tests/web-deck-native.spec.ts tests/workbuddy-widget-fidelity.spec.ts
npm run build
python3 scripts/build-hap.py tablet phone
```

`dist/` 是 Web 资源；HAP 输出在 `artifacts/hap/{tablet,phone}/`。脚本使用 `/Applications/DevEco-Studio.app` 和 `~/.cache/mobile-input-{role}`。新的开发机需分别在 DevEco 对两个缓存工程配置签名；示例配置不包含签名，unsigned HAP 不能直接安装。交付签名 HAP 是调试分发包，不保证其他设备获授权，也不是应用商店发布包。

**数据注意：** 默认构建会创建新演示代次，首次启动按项目规则重置演示记录，保留原生密钥/权限/配对及真实 Mac 数据。本次修复使用 `python3 scripts/build-hap.py --preserve-demo tablet phone`，只在两个缓存工程已有相同合法代次时允许保留；这是维修现有任务的显式模式，不适用于初次构建。

```sh
HDC=/Applications/DevEco-Studio.app/Contents/sdk/default/openharmony/toolchains/hdc
"$HDC" list targets
"$HDC" -t TABLET_ID install -r /absolute/path/input-agent-tablet-signed.hap
"$HDC" -t PHONE_ID install -r /absolute/path/input-agent-phone-signed.hap
"$HDC" -t TABLET_ID shell aa start -b com.hmilab.mobileinput.tablet -a EntryAbility
"$HDC" -t PHONE_ID shell aa start -b com.hmilab.mobileinput.phone -a EntryAbility
```

Mac 控制：在受控 Mac 运行 `npm run mac:bridge`，连接页为 `http://127.0.0.1:39873/`，控制端口 39872。依照 `scripts/mac-bridge/AGENTS.md` 给实际 helper/宿主必要的辅助功能权限。`node scripts/mac-bridge/install-companion.mjs` 会安装用户级常驻服务和连接入口，只在需要该模式时执行。已配对后优先 USB，同一 Mac 可退回已保存无线地址；不要用“能移动鼠标”替代文字/附件提交验收。

## 6. 密钥与敏感材料

平板生成 API 在平板连接设置配置，保存在原生 Asset Store；手机润色 API 独立保存。包内没有 `Google API.md`、API key、OAuth token、签名私钥、配对信任数据、真实附件、设备缓存或私人录屏。接手者必须使用自己的配置。不要把 key 放进 Web、HAP、Git、日志或交接文档；不需要为了平板生成启用 Mac `/api/decks`。

## 7. 验证证据与未验证项

本轮最新逻辑：211 项 core 测试通过；6 项句内输入浏览器测试通过，4 项原生模拟测试通过。之前共享 Widget 专项验证了 390×844、390×700 和收起/键盘/触控板三态，14 项相关浏览器测试通过。TypeScript、Web 和两端签名构建通过。不同阶段的数量不可相加称为一次全量回归。

当前安装：SUP-AL90 手机、MRDI-W10 平板，包版本 1.4.0；演示代次 `1793741702534`，构建时间标识 `1793742483348`。版本号相同不代表代码相同。最新 SHA-256：

- 手机：`dc14e2ea87562093eb6b278f726b41e976a366d5e073f70ffc6e35d10560c640`
- 平板：`7ce19eca2bc2f91f187c694f91cefdafac69afda76db3d98fb0abe3bc0505e16`

真实设备已验证：覆盖安装、启动、分布式恢复连接，原失败任务及草图保留；对原任务明确重试一次后，平板 Gemini 实际生成并打开 6 页“华为 MateBook Fold 非凡大师产品介绍.html”，包含讲稿，界面记录执行 38 秒。生成失败原因原为“草图必须明确页名（全文）”，已修复。没有重复发送或创建另一任务。

此前用户已确认连续听写两种手势及震动正常，也确认过拔 USB 后的双端翻页；这些是历史证据。本次修复没有重新完整验证拔线播放、全部九应用、真实 Mac 控制、相机拍摄或两分钟听写。生成文稿事实与完整布局质量仍需人工审校；模型输出并非事实校验报告。旧证据在本机 `artifacts/`，交付包提供记录摘要，不打包私人设备截图。

## 8. 交付清单与下一步

源码 ZIP 含可编辑代码、lockfile、测试、样例、素材来源及本文；运行 ZIP 含匹配 Web 包、两个签名 HAP、发布元数据。manifest 记录每个交付文件和源码文件的摘要。中文/英文交接文档同时单独上传，方便先读后下载。

建议接手后先复现虚构材料的一条完整链路：三个颜色 → 时长 → 文件/照片 → 空白画板绘制 → 明确发送 → 平板生成 → 打开编辑 → 手机讲稿/翻页。分别记录浏览器、原生模拟、真机与拔 USB 验证。不要测试真实 Mac Agent 提交或清空用户数据，除非获得对应授权。本次只上传 Google Drive TEMP，没有 Git commit/push，也未改变共享权限。
