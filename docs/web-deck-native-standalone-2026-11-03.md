# 手机与平板独立生成网页演示

更新：2026-11-03。实现记录；不替代 Notion Design/Survey。下方保留分阶段记录；最新手机安装、双端生成和拔线结果见文末「手机原生适配与双端验收」。早期未安装/未配置的结论仅属于当时阶段。

**后续更新（同日）：用户已明确授权证书更新及平板安装。平板签名已续期，新签名 HAP 已安装到 MRDI-W10，并验证前台启动和实际画面。以下最初未签名/未操作设备的结论为前一轮历史状态；最新结果见文末。**

## 运行方式

原生 HAP 已改为 **手机 → 现有双端连接 → 平板 → Gemini**。Mac 不参与这条运行链路。电脑上的 `/api/decks` 开发服务仍供浏览器开发使用；HAP 不访问该地址，也不需要额外配对 Mac 生成服务。

首次在平板现有「连接设置 → 网页演示 · Gemini」中保存 Google API 密钥与模型。凭据仅持久化到平板原生 Asset Store，解锁时可用，不同步其他设备；与手机原有文本润色配置分开。输入配置时的 Web 密码字段仅暂存，保存后清空；原生状态事件不返回密钥。密钥不写进代码、HAP 或构建日志。最初实现阶段未向设备配置；后续已通过现有平板设置界面配置并完成真实生成，见文末。

两端沿用「平板演示」的扫码网络建联或鸿蒙分布式连接。联网生成需要平板能访问 Google Gemini；保存后的本地文字/样式编辑和播放不需要模型联网。手机遥控翻页仍需要手机和平板之间的连接。

1. 当前 Web 源码：平板打开假 WorkBuddy 的新建任务首页，点击主输入区域以启用手机输入；「制作PPT」只填入意图。此前已安装包仍保留独立网页演示入口，包与源码范围见文末。
2. 手机描述需求，例如：`参考产品资料，添加实拍照片。背景用灰色，主色用红色。产品展示页布局我画一下。讲十分钟。`
3. 点击固定句内入口选择文件、从系统图库选择照片、调整颜色、绘制并采用草图；采用材料不会发送。
4. 材料确认传到平板后，点击手机「发送」。平板直接执行草图理解和演示生成，并显示进度、失败或停止状态。
5. 平板打开结果，编辑标题、正文、讲稿、布局、颜色、照片、页面顺序；保存或播放。手机显示讲稿和上一页/下一页/退出按钮。

固定控件仍按现有设计显示，不由模型改变界面结构；无 Laya 模型门槛。Gemini 返回经校验的结构化数据，由登记的 OpenUI 组件显示。

## 材料、任务与执行约束

| 环节 | 实现 |
| --- | --- |
| 文件/照片选择 | 原生系统选择器，返回短期句柄；分块读取到本机，不暴露任意路径接口 |
| 格式 | PDF、TXT、Markdown、PNG、JPEG、WebP；每件不超过 8 MB，最多 12 件，总计 24 MB。当前未解析 DOCX/PPTX/XLSX |
| 本地存储 | 两端各自 IndexedDB 保存字节及 SHA-256，按演示重置代次隔离；显式重置清除对应材料缓存 |
| 手机到平板 | 复用已配对连接；24 KiB 数据块、顺序与长度验证、完整 SHA-256 校验后才采用 |
| 原任务归属 | 选择器返回、控制器卸载、切换任务后仍归原任务；原任务已不存在时不会塞入新任务 |
| 断线/损坏 | 保留手机原件和待采用记录，显示重新采用/移除；未知采用结果先核对任务快照，不自动提交 |
| Web 到原生 | JSON 请求拆成不超过 24 Ki 字符的小块，完整拼接后请求固定 Google 地址；总请求上限 36 Mi 字符 |
| 后台/取消 | 原生取消网络请求；Web 立即结束等待，保留任务供显式重试；执行代次拒绝迟到结果 |
| 保存/播放 | 复用既有文件工作副本、撤销/重做、手动保存；图片从本机 Blob URL 解码，无外部图片链接 |

命名页的照片、草图和独立颜色范围沿用共享生成契约。草图映射到封面、左图右文、左文右图、上下排列、卡片、大图六种登记布局，不承诺任意手绘的像素复刻。成果仍为应用内可编辑网页演示，未增加独立 HTML/PPTX 导出。

## 实现入口

- `packages/core/web-deck-generation.ts`：Web 开发服务与原生端共享生成/单页修改契约。
- `apps/harmony/shared/DeckService.ets`：平板限定调用、Asset Store、分块缓冲、Google HTTP、取消。
- `apps/harmony/shared/MacFiles.ets`：复用文件选择与受限读取；新增图库分支，不改变真实 Mac 照片采集路径。
- `apps/harmony/shared/NativeBridge.ets`、两端 `Index.ets`：注册有界接口，保留本地来源和角色验证。
- `apps/web/src/web-deck-native.ts`、`web-deck-settings.tsx`：原生请求适配和现有设置面板扩展。
- `apps/web/src/web-deck-device.ts`：本地资产、连接上传/读取、原任务待采用队列。
- `apps/web/src/web-deck-composer.tsx`、`web-deck-image.tsx`、`web-deck-view.tsx`：手机选择/绘制、图片显示、编辑与播放。

ArkWeb 本地资源拦截对本应用源的 Blob URL 使用系统正常处理；其余非本地资源保持原限制。SDK 的回调类型未包含文档所允许的 `null`，因此采用窄范围类型适配并通过 ArkTS 编译。参见 [Huawei 页面加载说明](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/web-page-loading)。当前材料上限低于 Google inline 请求上限；参见 [Gemini 文件输入方式](https://ai.google.dev/gemini-api/docs/file-input-methods)。

## 验证与未验证

- 核心测试 168/168，Mac 协议测试 10/10，Node 生成服务测试 2/2 通过。
- 原生服务的两个 VM 测试覆盖私有凭据、固定 Google URL、分块/大小/顺序检查、取消和迟到响应；HTTP 与 Asset Store 为桩。
- `tests/web-deck-native.spec.ts` 使用独立手机/平板浏览器上下文和原生接口桩，禁止 `/api/decks`，覆盖真实材料字节传输、草图/照片/颜色生成契约、编辑保存、手机翻页、刷新恢复、断网本地播放、选择器迟到归属、坏块拒绝与显式重试、大请求分块及后台中止。
- Google 真实 API 的前轮虚构资料测试另见 [Web 实现记录](web-deck-implementation-2026-11-03.md)；本轮原生模拟不作为真实设备调用证据。
- 最终浏览器、Web 构建、HAP 与私密信息检查结果以 `artifacts/web-deck/*standalone*` 日志和 `standalone-package-manifest.json` 为准。
- 最终相关浏览器回归 **9/9 通过**：原生适配 4 项、原有网页演示 3 项、真实 WorkBuddy 模拟桥接 2 项。TypeScript 和生产 Web 构建通过；生产 JS 约 1.45 MB（gzip 439 KB），仍有包体大小提示。浏览器验收单独运行，避免开发服务器在并行构建时热重载造成假失败。
- 两端 ArkTS 编译及打包通过。手机可签名；平板现有签名证书已于 **2026-10-21** 到期，最新平板成果是未签名 HAP。目录中旧的平板签名包不属于本次成果。
- **未安装、启动、探测或操作手机/平板。** 系统图库、真实 HAP 两端传输、设备网络到 Google、设备内离线持久化和性能仍需后续真机验收。浏览器隔离模拟与本地编译不能代替它们。

## 本轮包位置

- 手机：`artifacts/hap/phone/entry-default-signed.hap`。
- 平板：`artifacts/hap/tablet/entry-default-unsigned.hap`；需更新有效签名材料后签名，当前不可作为可安装包交付。
- 两包内嵌重置代次一致，`dist/assets` 与包内 Web 资源逐字节一致；已解包检查，两包均不含本地 Google API 密钥。包摘要保存在 `artifacts/web-deck/standalone-package-manifest.json`。

## 平板证书续期与真机安装 · 2026-11-03

- 用户明确授权后，在 DevEco 的 `mobile-input-tablet` 缓存工程中启用自动签名，保留包名 `com.hmilab.mobileinput.tablet`。原私有配置及材料先备份到项目外 `~/.ohos/signing-backups/tablet-2026-11-03/`，新材料仍位于 `~/.ohos/config/`，未写入源码。
- 新叶证书有效期为 2026-11-03 12:08:39 至 **2026-11-17 12:08:39（America/Toronto）**。这是短期调试签名，不能将根证书 2049 年到期日期误报为应用证书期限。
- `npm run build` 及 `python3 scripts/build-hap.py tablet` 均通过，包含 `SignHap` 成功。最新可安装成果：`artifacts/hap/tablet/entry-default-signed.hap`，SHA-256 `6b44d16a2d6d11fe1d1dbc437acb1fec22f3bc289e4a90687eb349d3c76c4ac9`。包内检查未发现本地 Google API 密钥。
- 定向安装到已识别的 MRDI-W10：HDC 明确返回 `install bundle successfully`，随后 `aa start` 返回 `start ability successfully`。设备包管理器确认版本 1.4.0（1004000），Ability 状态为 FOREGROUND；实际截图确认 Input Agent 桌面正常显示。
- 未执行卸载、未操作手机、未提交生成任务。安装前包元数据查询未返回有效信息，因此不声称已验证旧版数据迁移。此轮真机证据仅涵盖安装/启动，不涵盖手机材料传输或 Gemini 生成。
- 安装及构建日志、前台记录、截图和摘要均位于忽略目录 `artifacts/web-deck/tablet-renew-*`；最终索引为 `tablet-renew-install-manifest.json`。前文两端同代次产物记录属于上一轮；本轮仅重新构建并安装平板。


## 手机原生适配与双端验收 · 2026-11-03

### 本轮补齐的缺口

- 复用现有原生文件/图库选择、分块读取、IndexedDB、SHA-256 与平板 DeckService，没有增加手机生成服务或 Mac 依赖。
- 修正初次连接的演示代次兼容：新手机包先接受已认证平板的首份权威快照；收到后仍拒绝低代次旧快照。没有为对齐版本重建或重置平板。
- 文件选择的 deck 分支限制支持格式；对原生文件大小、分块解码、空块及越界读取增加校验，失败释放句柄。真实 Mac 文件分支维持独立。
- 后续源码修正：分布式网页演示命令等待上限扩为 30 秒；发送期间锁定按钮，核对权威执行代次后再显示失败。此修正发生在手机安装后，尚未做真机复验。

### 实际安装包

| 项目 | 手机 | 平板 |
| --- | --- | --- |
| 设备 | SUP-AL90 | MRDI-W10 |
| 包名 | com.hmilab.mobileinput.phone | com.hmilab.mobileinput.tablet |
| 版本 | 1.4.0 / 1004000 | 1.4.0 / 1004000 |
| 本轮操作 | 升级安装并启动成功 | 沿用之前已安装包，未重装 |
| 构建代次 | 1793728277437 | 1793726352417 |
| SHA-256 | bad38b16289857478b42858b919d878178c0f125179e4dcaba4a0b1398f205ec | 6b44d16a2d6d11fe1d1dbc437acb1fec22f3bc289e4a90687eb349d3c76c4ac9 |

手机包位于 `artifacts/hap/phone/entry-default-signed.hap`，安装元数据见 `artifacts/web-deck/phone-standalone-install-manifest.json`。版本号相同不代表资源一致。**该已安装包不含后续 ContextualPolishActions 迁移，也不含本次观察后补的发送等待修正**；当前 Web 源码与安装包的验证范围分别记录。

### 真机已验证

1. 两端通过鸿蒙分布式连接，平板既有连接设置配置生成服务。生成调用由平板原生 DeckService 发起，手机润色配置未改变。
2. 手机系统文管选择专门创建的 228 字节 `fictional-product.txt`（虚构“轻舟工作台”）；两端显示采用的材料。没有使用私人文档。
3. 手机系统图库选择本次虚构测试界面的截图 JPEG，随后出现已采用缩略图。**这是测试图片，不是实拍产品照片**；验证的是图库选择与图片传输。
4. 分别调整主色、保持背景/文字颜色独立，将时长从 5 分钟改为 6 分钟；在空画板实际绘制左框与右侧条目并采用。未预填笔迹。
5. 文件、图片和草图经过既有接收完成路径后才可发送；手机在采用过程中禁用发送。发送前没有自动生成。
6. 明确发送后，平板真实调用 Gemini，出现生成过程并打开可编辑网页演示。标题为“轻舟工作台：随时随地的便携办公新体验”，下一页为“原型展示与交互形态”。此处仅记录观察到的成果，不宣称布局与草图逐像素一致。
7. 手机显示讲稿，上一页、下一页和退出放映实际更新平板；重新进入放映成功。
8. 用户按要求拔掉两台 USB 后，再进行手机下一页及退出放映，回复“同步”。这是**用户确认的拔线验收**。该链路不调用 Mac 的生成服务；本次未以关闭电脑网络或所有 Mac 进程的方式另测。

### 观察到的问题与证据边界

- 分布式回执有延迟：已安装版本一度显示“未收到回执，请核对平板”，平板随后正常生成。不能将这一段报告为完全无异常；源码等待/重复点击修正仍待安装复验。
- 真实生成使用本次虚构文本、测试截图和手绘草图。没有逐一真机验证 PDF、Markdown、PNG、WebP 的全部组合；它们的格式/边界覆盖仍是代码及模拟证据。
- 原任务迟到采用、坏块拒绝、重试不自动发送、后台取消、大请求分块和离线缓存已由浏览器原生桩覆盖，未逐一进行真机破坏性复演。
- 停止生成、此次版本的真实语音/剪贴板、再次冷启动后的材料恢复尚未单独真机验收。
- 不将普通浏览器或桩生成结果计入上述真实 Gemini 成功。

### 可复现证据

忽略目录 `artifacts/web-deck/`：安装 manifest、phone-*.log、final-browser-tests.log、polish-typecheck.log。专用虚构 TXT 位于 `fictional/`。

忽略目录 `artifacts/mac-bridge/device/`：`deck-phone-installed`、`deck-document-adopted`、`deck-tablet-doc-confirmed`、`deck-photo-ready`、`deck-color-open`、`deck-duration-adjust`、`deck-sketch-drawn`、`deck-ready-to-send`、`deck-tablet-generation-progress`、`deck-result-open`、`deck-playback-phone`、`deck-playback-tablet`、`deck-phone-next`、`deck-tablet-next`、`deck-phone-prev`、`deck-phone-exit`、`deck-tablet-exit`、`deck-ready-unplug` 的 PNG 和 UI 记录。设备截图/原始日志保持私有，不放入源码包。

## 同日后续：统一控制器与安装

用户后续明确授权两端更新安装，解除此前润色仅源码验证限制。共享任务条、主题、Composer/辅助控件及框外润色已随同一 Web 快照安装至两端；完整构建代次、包哈希、真机确认与未复测项见 [统一控制器验收](unified-phone-controller-2026-11-03.md)。本段不将早期模拟证据升级为新的真实模型调用记录。


## 直接编辑新版后续验收 · 2026-11-03

新版平板以虚构“星帆便携工作灯”跑通三页生成、画布直接编辑、局部 Gemini 标题修改、保存与播放。用户分别确认拔线后启动生成，以及拔线后的局部 AI／播放通过；接回读回验证新成果及标题。备注首次读回存在差异，随后连线补验保存和切页保留成功，未另验冷启动。完整包版本、中途其他聊天安装导致的重置、证据分层及遗留提示问题见 [直接编辑真机记录](workbuddy-direct-edit-2026-11-03.md#真机与拔线验收--2026-11-03用户追加授权)。
