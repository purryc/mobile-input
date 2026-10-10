# WorkBuddy 交互与状态契约

## 连续销售流程

```mermaid
flowchart LR
  A[客户需求与资料库] -->|引用至任务| B[需求简报]
  B --> C[采购分析专家]
  C --> D[供应商与采购报价]
  D --> E[客户方案]
  E -->|手机补充、预览编辑保存| F[方案文档]
  F --> G[六页销售汇报]
  G --> H[WPS第一页编辑]
  H -->|显式全屏| I[放映及手机控制]
```

澄星设计、锐行办公与每种 30 件设备使用现有 seed。报价 190380 元、采购成本 156900 元、毛利 33480 元。成果生成时记录 reportRevision；更改表格并“更新汇报数据”后，旧成果仍保留快照。文件“刷新”是明确动作；已经手工修改的文字保留，需另建版本。

四种类型分别产生需求 Markdown、采购表格、客户方案、六页汇报。成果正文用于分栏预览，Office 数据对象用于现有 WPS；这不是通用 .docx/.xlsx/.pptx 导出器。方案的 Markdown 修改保存后同步其关联 WPS 段落。表格／演示修改应进入 WPS；本地预览文本不解析为任意 Office 结构。

## 导航、返回与状态

进入默认新建任务首页，逐任务草稿、附件、引用、模式、专家、项目与结果独立保存。模板只填入；用户按发送才提交。首页不自动聚焦，手机保持桌面待机。第八个轮换入口仍遵循最后点击后 1200 ms 自动进入，显式编辑取消轮换。

返回顺序：连接面板 → WorkBuddy 菜单／弹层 → 文件预览／目录 → 详情／分类 → 首页 → 桌面。返回按钮最小 48×48。导航关闭旧编辑目标，草稿不删除。切换任务恢复自己的草稿。

任务状态：无法映射→选择类型；计划→等待确认→运行；默认→运行；仅问答→完成且无文件。运行三阶段从本地资料生成成果，显示耗时并可展开步骤详情。停止、退出 WorkBuddy、切后台、断线、重开使正在执行的任务暂停；继续需要新 epoch，旧阶段事件拒绝。仅问答输出固定销售答复，不冒充实时模型。追问保留前轮消息，在独立轮次成果中继续，旧结果仍可查看。

专家／团队、技能与连接器均为本地能力配置。连接器和助理渠道保存本地启停，第三方授权仅改变工作台配置。我的邮箱只读虚构邮件并保存收件人、主题、正文草稿。分享保存本地记录，没有邮件发送、支付或外链创建。

自动化保存星期、HH:mm、启停和执行记录；只在 WorkBuddy 前台当前分钟符合时触发。lastDay 限制一天一次，手动试运行独立；不补跑离线时间。时间依据平板本地时区。执行器不会恢复旧自动化倒计时。

## 双端编辑

平板点击任务输入／文件正文／项目指令／记忆／助理消息／表单字段，才设置 `wb:*` 目标并激活手机。手机显示目标、任务、最近上下文和引用。状态与连接按钮同一行，应用切换保持独立。

文字键入及原生识别结果都进入可编辑草稿，并实时镜像当前平板目标。语音使用现有原生 Core Speech 桥；按住开始、松开结束、取消恢复录音前内容、失败显示原因，无预设转写。固定录音区域，停止不提交。AI润色是本地简洁／礼貌／正式变换，保留数字与业务项并可撤销。

编辑包含剪切、复制、粘贴、删除、全选、撤销、重做。剪切等复制成功再删除，中文 emoji 以 grapheme 删除；粘贴失败保留内容。所有正文与文件修改走版本化编辑；表单“保存”再提交本地配置。

手机本地待发送内容按 role＋targetId 缓存。断线或目标版本变化时阻止覆盖，保留草稿，用户重新确认“恢复到当前目标”才写入。正式发送携带完整文字，先等草稿写入回执，原子执行并清空该任务草稿；不依赖最后一帧实时镜像。

## 数据与协议

`State.workbuddy` 包括 routes、task、drafts、tasks、files、projects、automations、assistants、installed、connectors、experts、settings、entityDrafts、mailDrafts、notices。协议版本 5 的描述包含当前应用、任务身份、目标／目标版本、草稿版本。

| 命令组 | 动作与保护 |
|---|---|
| wb-navigate / wb-focus / wb-unfocus | 合法页面／目标，聚焦同一目标不改目标版本，弹层退出释放旧目标 |
| wb-edit | targetId＋targetRevision、draftRevision、编辑 session＋sequence；拒绝旧序号 |
| wb-submit | 完整 text＋draftRevision＋目标版本；Store command ID 去重 |
| wb-task / wb-tick | 重命名、收藏、删除、停止、继续、确认、类型；tick 校验 epoch，手机不能注入 tick |
| wb-preview / wb-file-panel / wb-file | 目录标签，正文保存，明确刷新，用户文字保护 |
| wb-template / wb-attach / wb-reference | 模板、内置附件、选区上下文；不自动发送 |
| wb-expert / wb-skill / wb-connector | 本地角色、安装与启停配置 |
| wb-project / wb-assistant / wb-config | 项目、助理、设置字段验证和持久化 |
| wb-automation | 时间星期有效性、到期限制、记录，重复创建去重 |
| wb-library-add / wb-mail-draft / wb-share | 本地资料、邮件草稿及分享记录，不对外写入 |

平板 Store 的结果和回执权威，重连先同步 snapshot；不重放发送、执行、日程或创建。已有微信/WPS 状态不重置。缺少 WorkBuddyState 时，先将旧共用 ai-draft/history 备份到 `mobile-input:backup:workbuddy-shared-v1`，再初始化；保留原字段，只在旧应用为 WorkBuddy 时迁移为其新草稿。备份失败不删除旧内容；启动任务全部暂停。

## 来源、文件与运行

实现：`packages/core/workbuddy.ts`；平板：`apps/web/src/workbuddy.tsx`；手机：`phone-workbuddy.tsx`；串行输入：`workbuddy-input.ts`。样例：`samples/workbuddy-demo.json`。视觉与官方差异见 `workbuddy-ia.md`；素材见 `reference/workbuddy-manifest.json`。

Web 随两个 HAP 打包，原生语音／TCP 保持既有接口；不依赖电脑来执行演示任务。浏览器开发版仍需调试桥。所有下载与签名真机证据分别登记于验收文档。
