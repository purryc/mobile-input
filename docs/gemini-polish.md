# Gemini 文本润色更新 · 2026-10-15

## 交付行为

按本轮用户要求，以 Gemini API 替换当前 ChatGPT OAuth 润色入口。手机原生直接访问 Google，运行不需要 Mac 代理；当前配置模型为 `gemini-3.8-flash`。旧 ChatGPT 实现保留作历史源码，但运行桥不再实例化它，不做供应商自动回退。

- 场景动作保持原样：聊天、任务指令、邮件、标题、讲稿、笔记等分别使用已有映射。只发送用户主动选择的文本或当前字段，以及对应润色指令。
- 不上传整段会话、附件、任务材料或共享状态；不自动提交任务或消息。
- 原有目标、焦点、版本、文本快照校验、取消、失败保留原文、撤销继续生效。
- 仅接受 `STOP` 完成且非空的候选正文，忽略 thought 内容；截断、拦截、空结果不覆盖原文。上游错误正文不进入 UI 或日志。
- 连接面板的次级项改为 Gemini API：配置/替换/移除密钥，修改模型，以及测试润色。界面区分“已配置”和真正完成一次原生调用后的“已验证”。测试使用固定的虚构设备报价句，不读取或修改用户草稿。

## 凭据

密钥通过 `x-goog-api-key` 请求头传递，端点固定为 Google 官方 HTTPS API。使用鸿蒙 Asset Store，`DEVICE_UNLOCKED`、`SyncType.NEVER`；已存密钥不返回 Web、不进入设备间协议、不写入 HAP。手动设置的输入值保存成功后清空，未写入 localStorage。

开发设备可使用 `python3 scripts/provision-gemini.py --device <HDC-ID> --config <私有配置路径>`，或设置 `GEMINI_API_KEY` 后省略 config。脚本仅生成权限 0600 的临时文件，通过已授权 USB 写入应用私有 cache。重新打开连接面板后导入安全存储并立即删除一次性文件。不要把密钥写进命令文本、项目配置、源码、交付包或版本控制。

## 分层验收

- 本机真实 Google 请求：HTTP 200，完成原因 STOP；示例的“明天下午两点”“30套设备”保留。
- 核心/协议：122 项通过，包括 Gemini 正文解析、截断拒绝、错误分类、原生请求内容、设备限定存储参数、取消和换配置后的晚到结果丢弃。
- 浏览器：2 项通过。验证成功替换与撤销、选区、取消/晚到/切目标保护；设置的临时密钥清空、无 localStorage 写入、已配置与已验证区分。浏览器用桥接桩，不作为真实模型证据。
- TypeScript 与生产 Web 构建通过；两端签名 HAP 构建、覆盖安装成功。
- SUP-AL90 真机：使用用户既有配置导入成功；一次性文件已删除；点击“测试润色”后由原生真实调用返回并显示“已验证”。没有改写用户现有草稿。
- 本轮未重新要求真人语音、原生剪贴板及拔 USB 后端到端验收；已有语音/连接验收不冒充本轮重新完成。
- 未执行 Git commit、push 或 Drive 上传。

证据位于忽略目录 `artifacts/gemini-polish/`：构建/测试/安装日志、`verify-result.json`、`phone-verified.jpeg`。截图和 UI dump 不含密钥。

## 官方接口来源

- [GenerateContent REST API](https://ai.google.dev/api/generate-content)：systemInstruction、contents、完成原因与候选正文。
- [Gemini API key](https://ai.google.dev/gemini-api/docs/api-key)：API key 认证。
- [Text generation](https://ai.google.dev/gemini-api/docs/text-generation)：当前模型及文本接口说明。

原生 Asset Store 接口同时对照本机 DevEco SDK `@ohos.security.asset.d.ts`，并以手机实际保存/读取成功作为设备证据。
