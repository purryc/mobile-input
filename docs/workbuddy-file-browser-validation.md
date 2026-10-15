# Input Agent 1.3.0 文件浏览器分层验收

日期：2026-10-13。基线为1.2.0提交df71727；本轮实现保留在当前工作区，未提交/推送GitHub或上传Drive。规则先更新；IA、官方参考、能力范围见 [实施与覆盖矩阵](workbuddy-file-browser-implementation.md)。

## 源码与核心：通过

- `npm run check`通过。`npm test`最终62/62；证据：`artifacts/workbuddy-files-typecheck.log`、`workbuddy-files-core.log`。
- 新增14项机制检查：迁移备份与手改文本副本、九种格式、手动保存与Office共享、撤销重做、未保存关闭、标签顺序、版本/序号、原子保存/去重、只读第二窗口、WPS冲突副本、逐文件会话、选区AI与实际变更、迟到结果、中文emoji局部替换、主任务预览同步、生成同目录文件、重启暂停、删除关联状态、区域数量修改不覆盖价格。每个test可能检查多项机制。
- Word/表格/PPT正文为共享Office结构；Markdown/TXT自动保存；HTML退出编辑保存；内置PDF分两页，SVG真实加载，WAV实际解码播放。无通用Office/PDF导入解析承诺。
- 语音和原生剪贴板使用既有手机接口，未注入假转写。全部推荐及授权/分享/上传是本地演示。

## 浏览器：通过

- 最终完整回归19/19通过，无跳过或重试通过，耗时 94.0 秒；结果见 `artifacts/workbuddy-files-browser-release.json`。前次完整18/18、WorkBuddy专项10/10、范围专项6/6也通过。
- 保留微信、WPS编辑/放映、FC组合按键与释放、配对、轮换及原WorkBuddy任务流程。
- 新文件页检查：九类样例、AI默认收起/展开、单一连接入口、中文/emoji文本、可视编辑连续输入光标、500ms自动保存、PDF分页、图片尺寸、WAV播放时间推进、HTML退出保存、查找、保存取消、第二窗口、逐文件历史、撤销重做、手机实时编辑/AI原子提交、WPS读回、真实变更与网页前进后退。
- 触摸浏览器通过Chrome触摸事件实际拖动标签；分隔条调整宽度。鼠标框选四个单元格后上下文保留，AI修改两行数量且采购价格不变。
- 参考截图检查浅蓝标签、工具栏、纸张、默认收起与28%AI区域、＋和分栏。差异：Office工具栏为演示子集，文案/图表/字体及屏幕比例不同，不宣称逐像素一致。
- 图像：`artifacts/file-browser-{word,ai,sheet,slides,markdown,session,phone,changes,local-web}.png`。浏览器剪贴板与输入检查不替代原生权限、真实语音或真机触摸。

## 构建与交付：通过

- 生产Web成功；Vite提示主JS大于500KB，未阻止构建。Web资源随HAP打包，无CDN依赖。
- 两端签名HAP为1.3.0 / 1003000，名称Input Agent、既有包名不变。日志 `artifacts/workbuddy-files-web-build.log`、`workbuddy-files-hap-build.log`。
- `npm run package`生成源码和WebZIP，校验HAP每个Web文件与dist字节一致、压缩包完整性及排除private/签名材料；文件与SHA256列在 `artifacts/delivery/manifest.json`。
- 样例：`samples/workbuddy-files.json`及 `workbuddy-demo.json`。原创SVG和WAV来源、哈希、官方参考URLs登记 `reference/workbuddy-manifest.json`；音频可用 `python3 scripts/generate-file-browser-audio.py`重建。

## 真机：部分完成

- SUP-AL90手机（5ZFYD25B13000537）覆盖安装签名HAP返回 `install bundle successfully`，EntryAbility启动成功；`bm dump`确认1.3.0 / 1003000。记录：`artifacts/workbuddy-files-phone-install.log`、`workbuddy-files-phone-install-receipt.json`。
- 真机查看手机应用待机/连接面板，系统安全区及唯一连接入口可见；布局和截图：`artifacts/file-browser-phone-installed.json`、`file-browser-phone-device.png`。
- 用户两次确认MRDI-W10已接线后多次枚举，重启HDC服务，仍只有手机目标；直接查询原平板ID59LYD25717200954返回 `Not match target founded`。平板1.3.0包已生成，尚未安装。
- **未验证**：本版平板真实触摸/文件流程、双机局域网文件编辑、真人语音后编辑、手机原生剪贴板授权、断线恢复、拔USB并关闭电脑服务后的独立运行。既有版本的用户语音确认不算作本版验收。
- 没有用浏览器或Mac模拟连接替代真机通过；没有恢复折叠PC或姿态诊断源码。

## 复核步骤

设备重新进入HDC列表后，按 `docs/build-install.md`对MRDI-W10覆盖安装tablet签名包。双端在同一可互通Wi-Fi/热点，开启连接面板配对。从客户方案段落进入手机输入，真人语音提出改动，松手编辑、保存；报价表调整数量，检查变更；六页汇报进入WPS。最后断开USB、停止电脑开发服务，重复该链路并检查重连不会重发。
