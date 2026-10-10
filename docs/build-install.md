# 构建、签名和安装

## 已检测环境

2026-10-07：macOS、DevEco Studio，SDK HarmonyOS 6.0.2（API 22）。连接的平板 MRDI-W10 为 API 24，手机 SUP-AL90 为 API 26。HDC 可列出两台设备；这只证明调试链路可达。

运行 `npm ci && npm run build`，然后 `npm run build:hap`。构建脚本默认顺序构建 tablet、phone，也可单端构建：

```sh
python3 scripts/build-hap.py tablet
python3 scripts/build-hap.py phone
```

`build-profile.example.json5` 不包含签名材料。真正生效的根签名配置在 `~/.cache/mobile-input-{role}/build-profile.json5`。重复构建不会覆盖缓存中的签名配置。`scripts/init-harmony.py` 是一次性脚手架，日常不要执行 `--regenerate`。

## 签名

在 DevEco 中分别打开缓存目录，登录华为开发者账号并在 Signing Configs 自动签名，选择对应设备；若开发者账号要求补充设备授权，在 DevEco 完成。新包名不能直接复用绑定其他包名的旧 profile。

安装必须使用真实签名产物。当前试装 unsigned 的实测错误为：`9568320: no signature file`。本项目没有绕过签名。

```sh
HDC=/Applications/DevEco-Studio.app/Contents/sdk/default/openharmony/toolchains/hdc
"$HDC" list targets
"$HDC" -t TABLET_DEVICE_ID install artifacts/hap/tablet/entry-default-signed.hap
"$HDC" -t PHONE_DEVICE_ID install artifacts/hap/phone/entry-default-signed.hap
"$HDC" -t TABLET_DEVICE_ID shell aa start -a EntryAbility -b com.hmilab.mobileinput.tablet
"$HDC" -t PHONE_DEVICE_ID shell aa start -a EntryAbility -b com.hmilab.mobileinput.phone
```

两端桌面名称均为「Input Agent」，保留蓝底双设备图标作为启动入口。默认前台运行；手机切后台将停止语音并断开，返回前台重新配对同步。两台设备使用同一 Wi-Fi 或手机热点，需允许局域网设备互通。原生固定 TCP 端口 39871，mDNS 服务 `_mobileinput._tcp`。自动发现失败可在手机扫码平板二维码或填平板局域网地址及配对码。

## 语音验收

手机需授予麦克风权限。默认普通话、本机引擎优先；不可用时手机显示失败原因，用户可点「使用系统在线识别」。使用在线识别需设备可联网。微信录音转写实时镜像到平板高亮草稿，停止不会发送聊天消息；其他场景仍显式写入。使用本人新说的一句话验证，记录真实转写结果，不用内置文字代替。

## 无电脑验收

先停止电脑上的 `npm run bridge` / `npm run dev`，拔掉两台设备 USB；保持同一 Wi-Fi 或热点，在设备桌面启动两个 HAP。完整执行 README 演示路径，包括真实语音、两端翻页、断线恢复和游戏松手释放。当前尚未完成此项，不用浏览器结果替代。

## 数据重置与导出

初始业务数据在 `packages/core/model.ts`；`npm run samples` 生成独立 JSON。平板保存于应用 Web 本地存储，刷新页面不清空；开发浏览器清除当前站点存储可重置。真机清除该应用数据会重置演示。工程不向外部邮件、WPS 或模型账号写入内容。

## 2026-10-08 安装与剪贴板更新

两端均已生成专属签名并覆盖安装成功。签名仍仅位于外部缓存工程。
普通签名声明 `ohos.permission.READ_PASTEBOARD` 会导致安装错误 9568289。本版移除该受限权限，使用原生 `PasteButton` 临时授权读取。写入使用系统剪贴板；剪切等待复制成功才删除。参考 [华为粘贴控件文档](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/pastebutton)。

最新分层证据以 [本轮验收](validation-2026-10-08.md) 为准；历史记录中的“手机未签名”是旧状态。
