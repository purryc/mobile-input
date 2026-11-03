# 真实 WorkBuddy 输入实施与验收 · 2026-11-02

## 当前结论

实现真实 Mac WorkBuddy 5.9.3 适配与本地 Laya 五类输入判断。Mac 文字、PDF 附件、显式发送经过真实应用验证；浏览器界面、核心协议与生产构建通过。新手机 HAP 已续签并安装，真实手机已通过局域网配对 Mac，双向中文同步及 Laya 句内入口已观察。系统文管选择产品 PDF、手机传输到 Mac、真实 WorkBuddy 发送及发送后手机清空已通过（2026-11-03）。手机语音、原生相机和拔 USB 后端到端仍待完成验收。平板演示继续独立保留。

## 设计到实现覆盖

|设计范围|实现|证据/限制|
|---|---|---|
|Figma 1286:6473，2162:107657 主面板|LiveWorkBuddyEditor|390×844、390×700 浏览器通过|
|2161:99195 句内编辑|SentenceComposer|背景/主色/字体独立，数字时长，不造缺失参数|
|1493:55578 固定底栏|InputDock|共用原控件，智慧语音标签与几何保留|
|2164:57771 时长|1–60 分钟数值输入与步进|明确数字才展示，修改保留原句并附实际参数|
|2195:42563 原生资料选择|MacFiles + mac-materials|原始字节、20 MB、48 KB 分块；编译与顺序读取测试通过，真机选择、917996 字节传输、SHA-256 一致及提交通过|
|照片/布局|原生相机、实际手绘 PNG|真实相机待验；浏览器实际笔迹通过|
|附件与任务发送|Swift AX/粘贴板 + 守卫协议|真实 PDF 和新消息出现通过|
|任务切换|原生任务入口与独立草稿|代码实现，真实任务导航尚待补充验收|
|Code Connect|本地映射保留|Figma 返回当前套餐仅 Organization/Enterprise 可保存；未宣称在线映射成功|

视觉稿来自现有 Figma 文件 ApFLno64NcMoA17MiPFfZh，沿用已登记的 WorkBuddy、InputDock、sentence-parameters 品牌与控件素材。未把范例照片或笔迹作为运行数据。

## 验证记录

- TypeScript 检查、生产构建通过。
- 核心测试 157 项、Mac 协议/文件测试 7 项、相关浏览器 4 项通过。
- 原生文件读取测试跨 130000 字节验证顺序、拒绝重复 offset、字节一致与释放；修复系统 readSync 的相对 offset 导致跳块问题。
- 本机模型已下载并真实推理：首轮约 1379 ms，后续样例约 274–310 ms；非性能保证。模型曾对含糊时长和否定色误判，显式源文本提取继续限制控件，未填造数字或颜色。
- 真实 Mac 使用独立“Input Agent 接入验收”请求与本次公开产品资料 PDF；观察到 WorkBuddy 新消息、附件名和执行状态，回执 verified。未修改原有用户任务，也未将已提交等同于生成内容质量验收。
- 手机 ArkTS 编译、PackageHap、SignHap 成功，文件 `artifacts/hap/phone/entry-default-signed.hap`。
- 用户已明确允许安装和测试；新包安装成功。SUP-AL90 通过真实网络读取 WorkBuddy，中文双向同步与本地 Laya 句内推荐已观察。
- 真机发现并修复：原生 WebSocket Origin 与浏览器策略混淆、WorkBuddy 空框提示语误读、过长历史任务挤压主区、中文时长前置表达不识别。
- 文管路径 Documents/Input-Agent/产品资料 可选择实际产品 PDF，未使用样例附件代替。首次完成选择时 Mac 自动锁屏，远程操作暂停。解锁后重选并通过真实传输与提交，详见下方补充。
- Laya 对“参考产品文档但不创建/修改文件”曾误判，补充判断说明后该样例通过。模型仍可能误判否定表达，源文本守卫拒绝生成不存在的参数；不宣称通用理解准确率。
- 手机真实语音、剪贴板、相机、拔 USB 与完整重连仍待验收。

## 隔离与恢复

真实材料位于忽略目录 artifacts/mac-bridge/materials；手机恢复数据独立 IndexedDB。传输及结果受认证会话、窗口、输入目标、正文基线和命令去重约束。发送期间冻结编辑；目标变化拒绝晚到结果。任务接受后才清空；未知结果不自动重试。开发日志不写用户提示词或凭据。

## 资料与可复现入口

- 模型 SDK：https://github.com/NandhaKishorM/laya
- 模型：https://huggingface.co/convaiinnovations/laya-multilingual
- 使用说明：[Mac 桥接](mac-bridge-usage.md)。
- 私有验证截图、构建与测试日志：artifacts/mac-bridge/。
- 未 Git push，未上传 Drive。

## 真机材料链路补充 · 2026-11-03

用户解锁后继续，在独立新任务使用公开产品 PDF。原有用户语音草稿保留在旧任务，没有覆盖。

- 手机原生文管选择 `Documents/Input-Agent/产品资料/华为MateBook-Fold非凡大师-产品介绍-2026-11-02.pdf`，返回后显示附件名，正文保留。
- 手机明确点击发送后，真实 Mac WorkBuddy 出现新消息、同名 PDF 和运行状态；手机正文、附件同时清空，发送按钮恢复禁用。
- Mac 收到 917996 字节，SHA-256 与生成源文件一致：`963224d14c93ebfbc10ed95aed12bdfe66abefa012471a393067a8db7d90b649`。私有核对记录位于 `artifacts/mac-bridge/phone-file-submit-verified.json`。
- 本次 USB 仍连接，控制和附件使用局域网 WebSocket；没有把此结果记录为拔 USB 验收。
- 首次锁屏时未恢复正在选择的附件，已补充原任务归属恢复：控制器卸载后选择结果写回原任务存储，不写入新目标；确认提交后清除原目标恢复记录。新增跨卸载、切任务、返回原任务的浏览器测试通过，真机锁屏恢复待复测。
