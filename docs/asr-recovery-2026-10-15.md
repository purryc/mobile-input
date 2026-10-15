# 手机语音参数报错修复 · 2026-10-15

## 观察与原因

用户报告手机显示 `Asr CreateEngineParams is wrong!`。SUP-AL90 的实际 UI 树确认该提示；同一进程的 Core Speech Kit 日志记录三次 `language: zh-CN, online: 0.00, locate: CN, recognizerMode: short`，随后创建引擎失败。

旧错误入口“系统在线识别”仅将 React boolean 设为 true，原生桥据此向 Core Speech Kit 传入 `online: 0`。这不是另一个已集成的系统识别器，而是同一接口的不支持配置。首次进入该入口之前的识别失败原因未保留，不能推断为网络或权限问题。

参考：[华为 speechRecognizer API](https://developer.huawei.com/consumer/cn/doc/harmonyos-references/hms-ai-speechrecognizer)；本机 API 声明 `/Applications/DevEco-Studio.app/Contents/sdk/default/hms/ets/api/@hms.ai.speechRecognizer.d.ts`。实际失败值由设备日志确认，不采用网上互相矛盾的 0/1 注释。

## 修复

- 原生端固定普通话、本机模式 `online: 1`，明确 CN／short 配置。旧桥 boolean 保留 ABI 兼容，但不能再选择 mode 0。
- 删除未集成的“系统在线识别”模式切换，错误区提供真正的“重试识别”；仍要求连接有效且当前目标可编辑，点击重试才开始新一轮录音。
- 创建失败转为中文提示与安全数字错误码；权限和服务释放提示分别处理，不向用户暴露底层英文 SDK 消息。
- 重试保留任务正文；停止不提交，取消恢复录音前正文。沿用既有目标、晚到转写与命令路由保护。

## 验证

- 先增加并运行失败测试：直接执行真实 `Speech.ets` 转译产物，仅用设备 SDK 替身；旧 online=true 路径抛参数错误，启动错误暴露英文。修复后两项通过。该测试验证适配器行为，不冒充设备 SDK 的真实识别。
- 新浏览器用例复现错误入口，验证修复后实际重试进入聆听、始终请求本机模式、正文不变、取消后恢复且未生成任务。
- TypeScript 通过；核心 106/106；相关浏览器 10/10，含绘画语音、微信、WPS 字幕／姿态以及 ChatGPT 润色。
- Web 与两端签名 HAP 构建通过，继续使用现有 1.4.0 包名与版本，保留原用户数据与账号授权。真机启动与人工转写结果随后追加，不能以模拟测试代替。

证据目录：`artifacts/asr-recovery/`。本轮未推送 GitHub。

## 真机安装与连接

- 手机签名包覆盖安装明确返回成功，重新启动 Input Agent 后 ChatGPT 仍显示已登录。平板未重装，继续使用原会话及原任务。
- 从平板连接面板读取当前地址与配对码，手机重新配对后恢复 WorkBuddy，UI 为“已连接”，手机与平板当前正文一致；没有发送任务或清空正文。
- 用户在修复版手机上按住“智慧语音”、松开后明确确认“正常出现文字”。本次真人语音转写恢复通过；没有用合成事件替代。未要求拔掉 USB 或额外验证所有场景。
- 两端 HAP 已生成，但本轮只安装手机；当前问题不需要重启平板或改动其任务。
