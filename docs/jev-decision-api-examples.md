# Jev Decision API：七类通用判断与控件匹配

2026-10-19 修订。与[设计规则](jev-decision-flow.md)第7.6节、Figma第4页137:882及第5页148:883同步。设计契约与预期答案；未发送真实API请求，未验证准确率、延迟、端侧离线推理或第三方接入。

## 两条线与本地已知信息

启用后并行处理场景输入与上下文服务。应用控制、文本用途、已选任务分别记录，不再使用混合的 input_context 单选。当前应用、模式、已注册字段用途、已选任务及真实请求优先由本地确定。模型不确定不能撤掉已验证基础面板。

state包含input_session、application_control、focus、draft、reply_state、selected_task/agent_request、visible_context、capabilities和interaction；这些均为产品自定义数据，不是新增API顶层字段。来源须可见且授权、带身份与版本；只发送相关内容。字段名称仅为示例，实施时映射现有协议。

## 七类问题

| 问题族 | API形式与答案 | 条件与用途 |
| --- | --- | --- |
| field_purpose | Choice：agent_prompt / chat_reply / email_body / document_text / short_label / other / unknown | 仅语义用途未注册时推断；已注册字段跳过 |
| intent_clarity | Choice：clear / unclear / conflicting / not_applicable | 判断目标是否可理解；清楚仍可能缺参数或材料 |
| input_assistance | Choice：none / parameter / material / both / not_applicable | 根据Agent正文或真实补充请求判断辅助类型，不固定询问颜色/手绘 |
| action_relevance_* | 对已验证操作候选分别Noul／统一刻度Score | 根据当前应用模式、对象与任务筛选相关操作；与前六类共享state，不生成能力 |
| polish_* | 对合法候选分别Noul | 非空正文才可改写；可推荐多项，最多遵循现有三个入口限制 |
| reply_mode | Choice：none / acknowledge / user_decision / uncertain | 可回复来源＋空草稿＋尚未输入＋未关闭；只判方向，不生成正文 |
| service_* | 对可用服务分别Noul；也可用Score排序 | 根据来源推荐本地/第三方服务卡片，可有多项 |

一份state、一批独立问题：每题完整写出条件，不依赖同批其他答案。七类问题不等于恰好七个请求项，多个操作／服务／润色候选可展开多个问题。三个原有教学示例仍覆盖文字／服务六类，保留10个问题；新增剪辑操作示例演示第七类，生产调用跳过本地已知或确定不适用的判断。Noul为“是”的概率，不虚构实测分数或未经校准的阈值。

## 三组完整请求与预期答案

- [WorkBuddy请求](../samples/jev-decision-workbuddy-request.json)：做一份产品介绍，主题用红色，布局我画给你。
- [微信请求](../samples/jev-decision-wechat-request.json)：可见会议来信，回复框为空且用户尚未输入。
- [邮件请求](../samples/jev-decision-email-request.json)：你们还没给报价，今天赶紧发过来。

这三个教学样例将字段用途标为未注册语义提示，以展示field_purpose；真实已注册场景直接采用系统字段用途并省略该题。样例候选目录为设计数据，不证明当前已集成。

| 样例 | field_purpose | intent_clarity | input_assistance | 润色候选预期 | reply_mode | 服务候选预期 |
| --- | --- | --- | --- | --- | --- | --- |
| WorkBuddy | agent_prompt | clear | both | prompt_clarity相关 | none | calendar/map不相关 |
| 微信空回复框＋会议来信 | chat_reply | not_applicable | not_applicable | 全部不适用 | acknowledge | calendar相关；map不相关 |
| 已写邮件正文 | email_body | clear | not_applicable | email_tone相关 | none | calendar/map不相关 |

以上仅为预期，不是假造的API响应。真实读取 answers.field_purpose.choice、answers.reply_mode.choice、answers.polish_email_tone.noul、answers.service_calendar.noul。Choice还返回probabilities与confidence。

## 回复显示、采用与改写路径

1. 当前有可回复的来源、空草稿且尚未输入：在授权范围内预先生成具体回复建议。Jev决定适用性/方向，独立文本生成能力提供正文。
2. 用户采用：写入绑定大屏字段并同步手机唯一编辑区，收起建议；两端是同一编辑会话，可继续修改和场景润色，发送独立。
3. 用户未采用而开始键入、粘贴或语音草稿变化：立即关闭回复建议，展开编辑区与场景润色。晚到生成结果不得覆盖内容或重新弹出建议。
4. 本次已关闭建议不因清空草稿自动重开；新的回复目标重新判断。采纳、生成结果均核对source/target/version/input-state；切换来源或目标后丢弃旧结果。
5. 需要用户表态时提供立场选择，不推定用户已同意参加、付款或承诺。普通新建邮件和文档并非仅因有上下文就成为回复场景。

当前微信回复是本地规则演示；现有Gemini仅用于用户明确点击的润色。本设计的自动回复生成尚未接入，本次不修改运行代码。

## 第二层：具体控件匹配

“clear + both”不能单独推出颜色和手绘；必须由“主题用红色”“布局我画给你”等原句片段或真实材料请求提供依据。颜色、手绘、文件、相机、截屏随后从注册库匹配。已识别类型本地直达；需要模型且候选已齐时可与通用问题同批评估。来源范围、真实值与材料由识别器/输入工具提供，不由分类答案冒充。

用户点入口展开，同一时间一个辅助控件；参数按现有实时契约更新，材料显式采用，不发送任务。普通文本默认提供回复或场景润色，不附加无依据的参数工具。

## 基础面板与服务切换

- 有可用预设使用绘画/演示/游戏专用面板；没有预设使用默认键盘/触控板与已验证常用快捷键。预设内编辑图层名等文字后回原控制状态。
- 独立动作/撤销重做用Button；同一数量可靠相对步进可用Dial/Stepper；只有min/max/current、设置指定值和真实反馈齐全才用绝对Slider或有界Dial。不得编造快捷键、范围与当前值。
- 服务卡片与当前输入并存；选择→打开→校验→成功成为当前操作→重新取state。取消或失败保留原草稿；选择不等于执行。任务管理只展示用户选中任务的真实选项，后台任务不抢占。
- 断连/后台/切应用释放持续控制，不重放；过期模型结果丢弃，单题失败仅撤下对应增强。原始文字、参数和材料保持原归属。

## 从判断到面板的生成契约（联合评审工作稿）

ContextSnapshot → CapabilityManifest → DecisionResults → 本地编译PanelSpec → 注册控件与稳定布局 → 用户操作 → 真实适配器与回执。能力清单由适配方维护，模型只筛选当前有用的操作。新应用应可以通过能力声明／适配得到默认面板，不必另写整页手机UI；需用未写过专用页面的应用验证。

新增[剪辑操作请求](../samples/jev-decision-editor-request.json)只问两个独立候选：任务“检查切点，不改音量”时，预期frame_step相关、preview_volume不相关。读取answers.action_relevance_frame_step.noul及answers.action_relevance_preview_volume.noul，文档不伪造实测分数。本地确认同一时间数量、同作用域、前后步进可靠后匹配相对Dial；无current就不画绝对位置。音量未进推荐区不代表能力被删除。

系统已知信息本地直达；基础面板先呈现。仅在应用／模式／对象／任务、稳定文字或真实请求变化时重评，不逐键逐帧调用。增强结果按版本、能力和交互锁重新校验；未知、失败、超时仅撤对应增强。用户固定项与手动模式优先，Desktop无文本目标默认触控板；不全局因焦点强开键盘。

Choice／Score的confidence与Noul概率不同；阈值需按问题和中文数据校准。托管评测使用虚构／脱敏state，真实内容出端另需明确授权，不把设备连接视作上传授权。完整商业假设、四份数据示例、批量门控、布局和验证预算见[联合评审](adaptive-panel-generation-review.md)及[Notion](https://app.notion.com/p/3fe194db24c3815592b8cd44240a6ff8)。

## API与验证边界

POST https://api.typesafe.ai/v1/systemone；顶层仅model、state、questions，凭据来自安全配置，不写入样例。真实响应顶层answers按自定义问题ID映射。批量可以复用上下文，但没有本项目延迟实测；托管HTTPS接口不等于本地离线部署。

- [API reference](https://docs.typesafe.ai/api)
- [Choice](https://docs.typesafe.ai/primitives/choice)
- [Parallel questions](https://docs.typesafe.ai/cookbooks/parallel_questions)
