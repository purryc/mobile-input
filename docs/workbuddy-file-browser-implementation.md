# WorkBuddy 文件浏览器 1.3.0

本轮从 Input Agent 1.2.0 / df71727 实施。源码入口为 `apps/web/src/workbuddy-file-browser.tsx`、限定样式 `workbuddy-file-browser.css`；文件状态和命令在 `packages/core/workbuddy-files.ts`。现有微信、WPS、FC 和八项轮换保留。原生语音、剪贴板和 TCP 桥沿用原接口。没有新增折叠 PC 适配、姿态诊断、真实上传、系统关联或模型服务。

## IA 与来源

```text
WorkBuddy
├─ 更多 → 文件浏览器（应用内全屏页）
├─ 任务 → 右侧面板
│  ├─ 产物：仅当前任务
│  ├─ 工作空间文件：实际演示目录树
│  ├─ 变更：已保存的修改前后
│  └─ 浏览器：内置销售页面 / 多标签 / 历史 / 查找 / 缩放
└─ 资料库 / 任务文件 → 独立窗口打开
   └─ 文件浏览器
      ├─ 标签：切换 / 触摸排序 / 关闭 / 复制路径 / 定位 / 新窗口
      ├─ ＋：新建四种格式 / 内置文件 / 最近
      ├─ 类型工具栏 / 正文 / 页码、字数、缩放
      ├─ AI（默认收起）：逐文件历史 / 选区 / 附件 / 指令 / 新会话
      └─ 保存 / 副本 / 撤销重做 / 冲突刷新 / WPS
```

官方补充页读取于 2026-10-13：[独立文件浏览器](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/File-Browser)、[右侧边栏](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Right-Sidebar)、[人机双写](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Knowledge-Base/Cowriting)。这部分不在原 5.7.7 录屏覆盖中，时间码记为“官方补充”。对照官方 AI 展开、收起、＋和编辑器截图；截图 URL 见素材清单。

## 能力覆盖矩阵

| 能力 | 实现 | 验证与边界 |
|---|---|---|
| 独立窗口、标签、最近、目录 | 应用内全屏逻辑窗口；第二窗口同一文件只读 | 核心与浏览器；不是系统多窗口 |
| 触摸排序、标签菜单 | 指针捕获后按落点排序；关闭当前/其他/右侧 | 排序协议测试；触摸逻辑含隐式捕获处理，真机触摸待验 |
| Word | 共用 Office 段落，直接输入、格式、撤销、手动保存 | 保存写回同一 OfficeFile；不承诺 .docx 兼容 |
| 表格 | 共用产品字段，单元格和区域选择，成本/报价/毛利计算 | 数字验证；不提供通用公式引擎或 .xlsx 导入 |
| PPT | 六页内容组件、缩略图、标题与正文编辑 | 手动保存和 WPS 跳转；备注仍只在手机演示控制器显示 |
| Markdown | 可视与源码编辑、格式、目录、查找替换、500 ms 自动保存 | 中文/emoji、光标稳定性和保存检查；Markdown 为受控演示子集 |
| HTML | 内置页面文本元素与源码文本区编辑、撤销；退出编辑保存 | 结构化销售页面；不执行用户脚本，不浏览任意 URL |
| PDF | 两页销售需求文档、页码、前后翻页、缩放 | 内置内容按页面渲染；没有任意 PDF 解析/导入能力 |
| TXT / 图片 / 音频 | TXT 编辑自动保存，SVG 缩放，WAV 本地播放 | 图片实际加载；音频解码、播放时间推进，未做听感验收 |
| AI 双写 | 总结、润色、补充、替换、报价、生成简报 | 确定性本地操作；明确选区或全文才改写；未知指令先选操作 |
| 逐文件历史 | 关闭重开保留；新会话登记主任务列表；附件可开标签 | 会话隔离、生成文件同目录；不调用附件理解模型 |
| 手机文件输入 | 点击对象/AI框激活；实时草稿、原子保存/提交、上下文 | 浏览器双端；真实语音/系统剪贴板沿用桥，须另验真机 |
| 保存/冲突 | 保存、放弃、取消；另存副本；第二窗口只读 | 旧版本不覆盖，迟到 AI 停止，保留工作草稿 |
| 上传/分享/账号 | 本地记录与原设置入口 | 没有网络上传、外链、计费或真实账号登录 |

视觉采用浅蓝标签、白色窄工具栏、纸张正文和底部状态栏；AI 默认收起，展开为 28%，可拖至 22–48%。与官方 Office 编辑器相比，工具栏按钮较少、文档内容和图表为本项目业务组件，字体及屏幕比例存在差异，不宣称逐像素一致。

## 状态与协议

`WorkBuddyState.fileBrowser` 包含文档快照、递增版本、工作草稿、40步撤销历史、已保存变更、标签顺序、逻辑窗口、最近文件、逐文件会话、选区和编辑绑定。`FileView` 保留来源 WorkBuddy 页面；关闭最外层最后标签恢复该页，内层窗口返回上一窗口。应用切换仅隐藏文件页，不删除工作草稿。

协议版本为 6。新增 `wb-fb-open/tab/reorder/close/exit/create/copy/ai/width/mode/select/edit/format/save/reload/undo/redo/ai-send/ai-finish/ai-cancel/chat-new/attach/local-record`。编辑对象为 `wb:doc:<view>:<file>:<path>`；AI输入为 `wb:co:<file>`。沿用 `wb-focus/edit/submit` 的目标版本、编辑序号与去重回执，发送携带完整文字。AI 完成事件仅由平板本地执行，拒绝手机伪造完成。

AI 捕获窗口、文件版本、工作版本和选区；标签切换、文件变化或旧轮次结果不能覆盖当前编辑。文档正文与 AI 指令草稿分开；只选择文字不会发送。人工保存后写回 OfficeFile，WPS 确认编辑后对照快照产生新版本；已脏的另一个视图提示刷新或副本。重启暂停未完成任务与 AI 修改，不自动重放。

Word/Excel/PPT 手动保存；Markdown/TXT 停止输入500 ms后保存；HTML退出编辑保存。后台或离开 WorkBuddy 暂停自动执行，工作草稿仍持久化。已保存变更记录显示实际 before/after，不使用预置“成功”差异。

首次迁移前备份 `mobile-input:backup:file-browser-v1`。旧 WorkBuddy 手改 Office 文本另存 Markdown 迁移副本，原 Office、草稿、任务及微信数据保留。原始参考帧与签名材料不进入包。

## 连续演示

1. WorkBuddy → 更多 → 文件浏览器 → 客户方案.docx。
2. 点击段落；手机编辑或按住说话，松开后检查文字，点保存修改。
3. 点击AI对话，选择段落，手机发送“替换为……”；检查位置、撤销并保存。
4. ＋打开采购报价.xlsx，修改数量并保存；任务右侧“变更”查看实际内容。
5. ＋打开销售汇报.pptx，查看六页，在WPS中打开后显式全屏放映。
6. 返回文件页逐级返回到原任务。源码样例见 `samples/workbuddy-files.json`。
