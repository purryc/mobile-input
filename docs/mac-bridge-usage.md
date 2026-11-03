# Input Agent · Mac 控制首版

## 启动

在项目目录执行 `npm run mac:bridge`，然后在这台 Mac 打开 <http://127.0.0.1:39873/>。首次启动会用系统 Swift 编译辅助程序。终端保持运行；Ctrl+C 停止并释放鼠标。

手机新版 Input Agent → 右上角连接 → **Mac 应用** → 扫描 Mac 二维码，或填写页面中的地址和六位配对码。配对页仅允许本机访问；配对码五分钟有效，过期刷新页面。手机回后台会暂停控制，同一进程可点“重新连接”，不重发操作。重启手机进程或 Mac 服务后重新配对。

Mac 和手机需能局域网互访；访客 Wi-Fi 的客户端隔离可能阻断连接。当前通道是个人可信局域网试用的 WebSocket，不提供公网部署、TLS 或跨网络中继。不要端口转发。配对只开放 WorkBuddy/Codex/WPS 的明确能力，没有远程终端或任意脚本接口。

## 日常操作

- **平板演示**：原有分布式和 LAN 连接、九应用不变。
- **Mac 应用**：点击 WorkBuddy/Codex/WPS 切到实际应用；在 Mac 点输入位置，手机读取该目标。
- **Codex**：支持可访问输入框的双向文字同步；键盘、手机原生语音、剪贴板复用共享输入区。只在找到当前输入区内可用发送按钮时显示“发送到 Codex”；不会以回车猜测发送。自动化测试不发送任务，实际提交待手动验收。
- **WPS 文字**：正文缺少可靠的完整文本读回时，手机保留一段待插入文字，点击“输入到 Mac”插入当前正文位置。不是全文同步。保存独立操作；支持的格式快捷键保持中性，不伪造当前样式。表格/演示尚未验证全文编辑，当前以窗口触控板及可读写字段为限。
- **鸿蒙应用**：入口已加入，显示尚未接通。没有自动 HDC 控制、模拟成功或用 fake app 顶替真实应用。

触控板位置限定在当前允许的应用窗口；切窗口/任务、断线和后台释放按键。手机本地文本与 Mac 同时修改时保留双方文字，提供“采用 Mac 内容 / 使用手机内容”，不静默覆盖。新目标不会继承旧输入。

“重置演示”仅在平板演示目标显示；真实 Mac 文档与聊天不受影响。真实目标的未同步输入保存在手机本地独立恢复记录，未进入 GitHub、日志或演示包。

## 版本与验收

2026-11-02 手机签名已续期，新手机 HAP 已获授权安装。真实 Mac WorkBuddy 输入、PDF 采用与提交通过本机验证；手机局域网连接、中文双向同步、句内控件和文管选择已有真机观察，2026-11-03 手机 PDF 完整传输、真实发送与清空通过；语音及拔 USB 仍待验收。平板旧签名状态不作为本轮手机交付证明。最新证据见 [WorkBuddy 实施与验收](live-workbuddy-implementation-2026-11-02.md)，原有目标的历史结果保留在 [Mac 验收记录](mac-bridge-validation.md)。

实现依据：Apple [AXUIElementSetAttributeValue](https://developer.apple.com/documentation/applicationservices/1460434-axuielementsetattributevalue)、[keyboardSetUnicodeString](https://developer.apple.com/documentation/coregraphics/cgevent/keyboardsetunicodestring%28stringlength%3Aunicodestring%3A%29)。UI 能力和输入语义遵循 Notion 主规范的 G02/G08/G11、T01–T06、P01–P07；当前主题使用已登记回退，未宣称完成真实图标动态取色。

## 真实 WorkBuddy 与固定输入规则 · 2026-11-03

适配 Mac WorkBuddy 5.9.3（`com.tencent.workbuddy.mac`）。在 WorkBuddy 点击任务框后，手机显示该真实目标。输入中的明确短语由本地固定规则匹配到资料、照片、颜色、手绘布局和时长入口。背景、主色、字体及页面范围分别保存，一次打开一个辅助控件。无需安装语义模型。

文件由手机系统选择器或相机获取原始字节，单文件上限 20 MB；显式发送前经分块传输和 SHA-256 核对。发送核对正文和 WorkBuddy 实际附件，再操作可用发送按钮；只有观察到新任务消息才清空手机输入。结果未知时不自动重发。当前文字输入上限 2800 UTF-16 单元，避免 WorkBuddy 自动将长正文转为附件。

执行 `npm run mac:bridge` 即可启动桥接。真实应用的任务仍交给 WorkBuddy 处理，Gemini 润色仍需显式点击。独立的 fake WorkBuddy「生成网页演示」会在明确发送后调用 Google，见 [网页演示实施记录](web-deck-implementation-2026-11-03.md)。两个执行通道、文件及任务状态分开。

系统文件选择或相机可能使手机应用进入后台，返回后先重新核对目标；不会自动提交或重放文件写入。本地保护记录独立于演示重置。
