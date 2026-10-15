await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('2:2'));
const changed=[],created=[],removed=[],get=id=>figma.getNodeByIdAsync(id);
async function text(id,value){const n=await get(id);for(const f of n.getRangeAllFontNames(0,n.characters.length))await figma.loadFontAsync(f);n.characters=value;changed.push(id);}
const media=await get('1357:21822'),row=await get('1357:21805'),prev=await get('1374:24723'),list=await get('1374:24728'),next=await get('1374:24734');
const pair=figma.createAutoLayout('HORIZONTAL');pair.name='Media / previous and next';pair.resize(216,56);pair.primaryAxisSizingMode='FIXED';pair.counterAxisSizingMode='FIXED';pair.itemSpacing=8;pair.fills=[];row.appendChild(pair);pair.appendChild(prev);pair.appendChild(next);row.insertChild(0,list);list.resize(96,56);row.itemSpacing=16;row.resize(328,56);created.push(pair.id);changed.push(row.id,prev.id,list.id,next.id);
for(const id of ['1357:21787','1357:21821']){const n=await get(id);removed.push(id);n.remove();}media.resize(354,170);changed.push(media.id);
const draft=await get('1348:22037');for(const n of [...draft.children]){removed.push(n.id);n.remove();}draft.layoutMode='NONE';draft.name='Adaptive / Long task / VUI-03 Inline draft / 框内检查与发送';draft.fills=[];draft.strokes=[];draft.effects=[];const editor=(await get('1401:45573')).createInstance();draft.appendChild(editor);editor.name='Adaptive / sole composer';editor.x=0;editor.y=0;created.push(editor.id);changed.push(draft.id);draft.description='The composer is the editable review surface. Clicking its Send submits the current task directly; no separate Review screen or Submit Task gate. Required approvals remain independent.';
await text('1348:22025','VUI-03  Inline draft / 框内检查与发送');
await text('1348:22039','文字、颜色与草图在同一个文本框内检查和修改；点击框内发送直接发起任务，不再进入独立 Review。执行状态在顶部任务追踪，详细进度在 PC。');
await text('1348:22040','边界 / 选色与确认手绘不发送；实际审批请求单独处理。');
await text('1348:21724','操作中锁定布局和绑定 · 手选优先于自动推荐 · Pin 常用预设 · 框内检查后直接发送 · 停止录音不发送');
await text('1368:22780','颜色识别 → 精确调节 → 布局表达 → 框内发送');
const note=await get('1387:49296');await text(note.id,note.characters.replace('提交：框内发送 → 核对 → 提交任务','提交：文本框内检查 → 点击发送 → 执行中').replace('确认只插入附件；发送与任务提交保持独立','确认只插入附件；点击框内发送才发起任务'));
return {changed,created,removed};
