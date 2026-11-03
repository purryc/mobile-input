# Codex 共用布局与 WorkBuddy 指针优化 · 2026-11-03

## 交付范围

手机真实 Mac 控制模式下，Codex 与 WorkBuddy 共用标题栏、当前任务、编辑容器和 InputDock。Codex 使用用户指定的 ChatGPT 黑白中性色，图标来源及主题范围见 `reference/chatgpt-agent-theme.json`；这是明确品牌主题，不宣称自动跟随 Mac 深浅模式。WorkBuddy 保留原配色、任务列表、材料和句内参数能力。Codex 不虚构尚未接入的任务历史、文件采集或 Laya 能力。

保留真实应用独立目标、草稿和发送能力判定。没有发送权限时不显示可用提交入口。未操作或发送 Codex 任务，也未改写现有 WorkBuddy 文本。

## 卡顿原因与调整

旧 Mac 桥接在每条 pointer 回执后调用完整 state 读取，350 ms 定时轮询也共用同一原生串行队列。WorkBuddy 完整读取涉及任务列表、标题及辅助功能树，原实现还有重复遍历；相比 Codex，状态读取更重，容易阻塞下一次鼠标移动。

本次 pointer 直接返回紧凑回执；连续移动期间暂停后台整页轮询，最后移动后至少 250 ms 才允许恢复。已经排队但尚未执行的后台读取再次核对是否处于移动期。完整业务写入仍执行原权威校验。原生指针路径保留锁屏、前台应用、窗口身份和标题检查，省去无关的焦点元素读取。WorkBuddy 一次状态读取共用一份辅助功能树。

已经开始执行的状态读取不会被强制中断，因此不承诺消除所有首帧延迟；网络延迟也属于独立因素。

## 分层验证

| 层级 | 结果 |
| --- | --- |
| TypeScript / Web 生产构建 | 通过；保留现有大包体提醒 |
| 核心测试 | 157 / 157 通过 |
| Mac 桥接测试 | 8 / 8 通过，包含连续 600 个指针采样期间不排入后台扫描、停手恢复 |
| 浏览器 | 5 / 5 通过；390×844 / 390×700 标题与底栏、语音键几何一致，Codex 语音键实际颜色为中性黑 |
| Swift | 原生辅助程序编译通过，更新后的桥接已启动 |
| Mac 实测 | 前台为真实 WorkBuddy，完整读取热启动约 51–67 ms；30 次原地 move 均收到执行回执，中位数 8.33 ms |
| 手机构建安装 | 签名 HAP 构建成功，SUP-AL90 install -r 返回成功，Input Agent 已启动 |
| 手机端到端体感 | 尚待确认；重新配对期间手机转到系统控制中心，已停止真机操作并询问用户。上述 8.33 ms 仅为 Mac 原生处理，不包含手机传输或屏幕显示延迟 |
| 无线网络 | 未验证；当前公司网络直连不通，USB 反向端口作为临时验证通道，不能作为无线通过证据 |

## 证据与产物

- `artifacts/mac-bridge/agent-layout-tests.log`
- `artifacts/mac-bridge/codex-844.png`、`codex-700.png`
- `artifacts/mac-bridge/workbuddy-state-after.json`
- `artifacts/mac-bridge/workbuddy-pointer-native.json`
- `artifacts/mac-bridge/build-agent-layout.log`、`hap-agent-layout.log`
- `artifacts/hap/phone/entry-default-signed.hap`

早期比较文件中前台实际是 Codex，不作为 WorkBuddy 前后性能对比。未推送 GitHub，未上传 Drive。

## 热点重连跟进

按用户请求重新连接：手机已在热点，Mac 初始仍连接 Huawei-Guest；切换后 Mac 为 172.20.10.2，手机为 172.20.10.3。更新手机 Mac 地址并重新配对，界面显示 WorkBuddy 和已连接；桥接进程确认来自 172.20.10.3 的真实 TCP 连接。移除本项目 39872 USB 反向映射后连接仍保持。此项确认热点连接与手机切换应用成功，连续触控板滑动体感仍待用户确认。证据：`artifacts/mac-bridge/hotspot-reconnection.json` 及 `device/hotspot-workbuddy.*`。
