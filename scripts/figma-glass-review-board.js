// Inputs: L and S. Readable presentation board; all screen copies remain editable.
const page=await figma.getNodeByIdAsync(L.pages.handoff);await figma.setCurrentPageAsync(page);
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:L.font,style});
const created=[];const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
function text(str,size=18,bold=false,w){const n=figma.createText();n.fontName={family:L.font,style:bold?'Bold':'Regular'};n.fontSize=size;n.characters=str;n.fills=[{type:'SOLID',color:rgb('#193642')}];n.textAutoResize=w?'HEIGHT':'WIDTH_AND_HEIGHT';if(w)n.resize(w,n.height);created.push(n.id);return n;}
function at(p,n,x,y){p.appendChild(n);n.x=x;n.y=y;return n;}
function board(name,w,h,x,y){const n=figma.createFrame();n.name=name;n.resize(w,h);n.fills=[{type:'SOLID',color:rgb('#F4F7F8')}];n.cornerRadius=24;at(page,n,x,y);created.push(n.id);return n;}
async function copy(key,parent,x,y,scale=1){const src=await figma.getNodeByIdAsync(S.screens[key]);const n=src.clone();for(const a of [n,...n.findAll(a=>'reactions'in a)])if(a.reactions?.length)await a.setReactionsAsync([]);at(parent,n,x,y);n.rescale(scale);created.push(n.id);return n;}
const overview=board('00 · Seven controllers',2000,1320,80,80);
at(overview,text('Mobile Input',54,true),64,48);at(overview,text('AI 键盘与上下文生成区',24),64,126);
const primary=[['wechat','01 微信'],['email','02 Email'],['workbuddy','03 WorkBuddy'],['word','04 WPS 文字'],['sheet','05 WPS 表格'],['presentation','06 WPS 演示']];
for(let i=0;i<primary.length;i++){const [k,label]=primary[i];const x=64+i*315;at(overview,text(label,18,true),x,206);await copy(k,overview,x,252,.7);}
at(overview,text('07 FC · 超级玛丽',18,true),64,902);await copy('game',overview,64,952,.7);
at(overview,text('稳定的输入肌肉记忆',30,true),760,916);at(overview,text('顶部只保留连接状态；应用与当前对象留在内容区。\n文本工具始终位于文本框之上。\n中部根据对象生成回复、编辑或任务控件。\n演讲与游戏拥有各自的固定控制区。',21,false,1060),760,984);
const motion=board('01 · Transitions and handoff',2000,1730,80,1490);
at(motion,text('同一块输入区，随任务展开',40,true),64,48);at(motion,text('推荐 → 草稿编辑 · 320 ms',22,true),64,126);
await copy('wechat',motion,64,198,.5);const mid=await copy('wechat',motion,404,198,.5);for(const n of mid.children)if(['Context / Quote','Suggestion / Reply','Suggestion / App action'].includes(n.name))n.opacity=.28;await copy('wechat-draft',motion,744,198,.5);
for(const [x,label]of [[64,'0 ms · 选中消息'],[404,'120 ms · 中部淡出'],[744,'320 ms · 编辑建议']])at(motion,text(label,16),x,640);
at(motion,text('保持不动',24,true),1100,220);at(motion,text('连接锚点\n剪贴板、复制、粘贴、撤销、重做、触控板\n文本框与键盘／语音／发送位置',19,false,780),1100,273);
at(motion,text('输入期间',24,true),1100,410);at(motion,text('录音、编辑、触控、绘制时延后控制器替换。\n草稿按会话、消息对象和版本保存。',19,false,780),1100,463);
at(motion,text('横竖屏衔接',22,true),64,750);await copy('presentation',motion,64,820,.43);const rotate=await copy('presentation',motion,405,850,.32);rotate.rotation=-25;for(const n of rotate.children)if(n.name!=='Status / Connected')n.opacity=.35;await copy('game',motion,754,869,.65);
at(motion,text('收起演讲工具',16),64,1210);at(motion,text('旋转期间禁止发出按键',16),404,1210);at(motion,text('横屏就绪后固定按键位置',16),754,1210);
at(motion,text('跨应用任务',24,true),64,1310);at(motion,text('选中消息 → 带来源的任务预览 → 补齐缺失参数 → 目标应用 → 返回原会话与草稿',21,false,1820),64,1365);
at(motion,text('连接与恢复',24,true),64,1450);at(motion,text('断线保留草稿并释放按键；恢复后由用户继续。失败不自动重发。\n快速换目标丢弃旧推荐；否定和已完成信息优先抑制应用动作。',21,false,1820),64,1505);
const notes=board('02 · Contract and evidence',2000,870,80,3310);
at(notes,text('交互契约与交付边界',40,true),64,48);
at(notes,text('微信意图映射',24,true),64,139);at(notes,text('实质消息：默认 2 条回复、最多 3 个相关动作。点击回复只填入草稿。\n应用动作显示具体任务与品牌图标；预览保留参数来源和目的应用。\n闲聊与无明确意图允许为空。不同会话不复用地址、时间、联系人。',20,false,1850),64,193);
at(notes,text('演讲与游戏',24,true),64,333);at(notes,text('IMU 相对指向 + 居中校准。激光笔按住显示、松开隐藏；画笔按住绘制。\n提词保留在手机，支持手动／自动滚动与速度调整；观众端不显示备注。\n游戏建议只在暂停时出现；退出、后台、断线释放所有按键。',20,false,1850),64,385);
at(notes,text('可编辑来源',24,true),64,523);at(notes,text('66 个控制器状态，原生文字、矢量功能图标、组件实例、颜色变量与玻璃效果样式。\n功能图标使用 Lucide；品牌图标复用 Hover 资产；中文字体使用 Noto Sans SC。',20,false,1850),64,575);
at(notes,text('本轮是交互模拟',24,true),64,691);at(notes,text('语音、AI、IMU、第三方跳转与发送回执均为 Figma 模拟。外部服务尚未接入；不代表真实设备验证。',20,false,1850),64,743);
return {createdNodeIds:created,overview:overview.id,motion:motion.id,notes:notes.id};
