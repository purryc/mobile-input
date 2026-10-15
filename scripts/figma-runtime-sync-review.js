await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const page=figma.currentPage,created=[],changed=[],loaded=new Set();
async function fonts(n){for(const t of n.type==='TEXT'?[n]:n.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName'])){const k=JSON.stringify(s.fontName);if(!loaded.has(k)){await figma.loadFontAsync(s.fontName);loaded.add(k);}}}
const sample=await figma.getNodeByIdAsync('1372:25301');await fonts(sample);
function label(parent,value,x,y,w=390,size=14){const t=sample.clone();parent.appendChild(t);t.characters=value;t.fontSize=size;t.textAutoResize='HEIGHT';t.resize(w,30);t.x=x;t.y=y;t.fills=[{type:'SOLID',color:{r:.12,g:.16,b:.22}}];created.push(t.id);return t;}
async function update(id,value){const t=await figma.getNodeByIdAsync(id);await fonts(t);t.characters=value;changed.push(id);}
await update('1358:12218','喻言 · 第 3 / 3 条');await update('1475:46167','喻言 · 第 3 / 3 条');
await update('1358:12645','代码已实现：华妃 5 秒循环 → 大雄兔 5 秒循环 → 喻言 30 秒连续片段循环。点赞／收藏／投币在平板回执后播放动效；弹幕先显示再飘走，暂停不冻结。播放、音量、语音后编辑发送和拔线直连已由用户确认。Figma 仅演示控件状态。');
await update('1443:16396','代码已实现：点击开始／再次按下停止；按住超过 300 ms 开始、松开停止。纯绘画态中，最终识别出的明确支持命令自动执行一次；中间转写、取消、错误和过期结果均不执行。文本聚焦时只听写。固定语音按钮不移动；图层、涂抹／液化和撤销已实现，拔线语音新建图层已由用户确认。Figma 仅模拟状态。');
await update('1485:16785','明确绘画命令在最终识别完成后自动执行一次；有效文本焦点下仅听写到该字段。换目标或断线取消旧路由。');
await update('1428:32722','代码已实现：截图／录屏取当前原型应用窗口，相机取手机；先预览，再明确采用为当前任务材料。截图默认可滚动，圈选模式才接管拖动。录屏显式开始／停止、静音、最多 20 秒。相机采用、草稿保留、发送、跨应用圈选和 5 秒录屏预览已由用户确认；Figma 内容建议为模拟，不代表接入通用视觉模型。');
await update('1372:26523','当前实现：唯一任务输入区；颜色与布局入口仅在用户表达意图后出现。颜色短语蓝紫扫光后只显示“调整颜色”，不追加 HEX 或第二个红色 chip。确认草图在文字上方，可编辑或独立删除。普通字段双向同步；任务与对象指令明确提交一次，手机不增加预览／应用修改步骤。Figma 切换只模拟交互，真机验证见源码验收记录。');
// Apply the scene polish footer to focused paint and Bilibili editors.
const paintComposer=await figma.getNodeByIdAsync('1472:16913');let pp=paintComposer.children.find(n=>n.name==='Runtime / contextual polish');if(!pp){pp=(await figma.getNodeByIdAsync('1591:39286')).createInstance();paintComposer.appendChild(pp);pp.name='Runtime / contextual polish';created.push(pp.id);}pp.x=14;pp.y=472;
const bili=await figma.getNodeByIdAsync('1475:46165');const bc=bili.findOne(n=>/sole composer|唯一|Composer \/ text|Composer \/ shared/i.test(n.name)&&n.type==='FRAME');if(bc){let bp=bc.children.find(n=>n.name==='Runtime / contextual polish');if(!bp){bp=(await figma.getNodeByIdAsync('1591:39278')).createInstance();bc.appendChild(bp);bp.name='Runtime / contextual polish';created.push(bp.id);}bp.x=14;bp.y=Math.max(60,bc.height-100);changed.push(bc.id);}
let host=page.children.find(n=>n.name==='12 · 开发同步 / 附件与真实润色');if(host)throw new Error('Review already exists; update IDs instead of duplicating.');host=figma.createSection();page.appendChild(host);host.name='12 · 开发同步 / 附件与真实润色';host.x=80;host.y=Math.max(...page.children.filter(n=>n!==host).map(n=>n.y+n.height))+160;host.resizeWithoutConstraints(1850,2910);host.fills=[{type:'SOLID',color:{r:.93,g:.95,b:.97}}];created.push(host.id);
label(host,'开发同步 · 附件与场景化 AI润色',36,32,1500,26);
label(host,'2026-10-14 · 复用现有组件和输入底栏；示例均为可编辑设计，授权、语音与模型调用以真机验收记录为准。',36,76,1700,14);
const readySource=await figma.getNodeByIdAsync('1286:6473');await fonts(readySource);
const names=['附件在正文顶部','删除附件 · 保留正文','正在润色 · 可取消','润色完成 · 可撤销','失败保留原文','连接设置 · ChatGPT 已登录','绘画语音 · 已自动执行','Bilibili · 喻言循环'];const frames=[];
for(let i=0;i<8;i++){let f;if(i===6){const source=await figma.getNodeByIdAsync('1443:16163');await fonts(source);f=source.clone();}else if(i===7){await fonts(bili);f=bili.clone();}else f=readySource.clone();host.appendChild(f);f.name='SYNC-'+String(i+1).padStart(2,'0')+' · '+names[i];f.x=36+(i%4)*450;f.y=166+Math.floor(i/4)*940;frames.push(f);created.push(f.id);label(host,names[i],f.x,f.y-32,390,15);}
return{reviewSection:host.id,reviewFrames:frames.map((f,i)=>({id:f.id,name:names[i]})),createdNodeIds:created,mutatedNodeIds:changed};
