// PAGE selects a single existing page. No prototype roots are recreated.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const page=figma.currentPage,created=[],mutated=[],removed=[],groups=[];
function section(name,parent){const n=figma.createSection();n.name=name;n.fills=[{type:'SOLID',color:{r:.91,g:.94,b:.94}}];parent.appendChild(n);created.push(n.id);return n;}
function arrange(parent,nodes,columns=4){let x=40,y=72,rowH=0,maxX=0;for(let i=0;i<nodes.length;i++){if(i&&i%columns===0){x=40;y+=rowH+72;rowH=0;}const n=nodes[i];parent.appendChild(n);n.x=x;n.y=y;mutated.push(n.id);x+=n.width+40;maxX=Math.max(maxX,x);rowH=Math.max(rowH,n.height);}parent.resizeWithoutConstraints(maxX,y+rowH+40);return {width:maxX,height:y+rowH+40};}
if(PAGE==='0:1'){
 const roots=page.children.filter(n=>n.type==='FRAME');const byName=new Map(roots.map(n=>[n.id==='5:7769'?'wechat-trackpad':n.name,n]));
 const spec=[
 ['01 · 微信',[
 ['01 · 回复与输入方式',['wechat','wechat-trackpad','wechat-keyboard','wechat-clipboard']],
 ['02 · 语音、编辑与发送',['wechat-draft','wechat-reply2','wechat-record','wechat-edit','wechat-preview','wechat-applied','wechat-send-preview','wechat-sent']],
 ['03 · 选区与剪贴操作',['wechat-selection','wechat-selection-preview','wechat-selection-applied','wechat-copied','wechat-pasted']],
 ['04 · 第三方任务与返回',['wechat-task','wechat-missing','feishu-task','gaode-preview','gaode-route','wechat-return','wechat-pending-app']],
 ['05 · 上下文与恢复',['wechat-quiet','wechat-target','wechat-negated','wechat-new-chat','wechat-disconnect','wechat-failed']]]],
 ['02 · Email',[['邮件撰写与附件',['email','email-edit','email-attachment','email-preview','email-sent']]]],
 ['03 · WorkBuddy',[['任务发起与要求',['workbuddy','workbuddy-requirements']],['执行、确认与停止',['workbuddy-running','workbuddy-approval','workbuddy-done','workbuddy-stop']]]],
 ['04 · WPS 文字',[['选区、格式与应用',['word','word-format','word-preview','word-applied']]]],
 ['05 · WPS 表格',[['公式、填充与范围',['sheet','sheet-average','sheet-fill','sheet-preview','sheet-applied']]]],
 ['06 · WPS 演示',[['指向、翻页与校准',['presentation','presentation-held','presentation-next','presentation-center']],['画笔与标注',['presentation-pen','presentation-settings','presentation-ink','presentation-blue','presentation-cleared']],['提词与自动滚动',['presentation-notes','presentation-notes-fast','presentation-notes-held','presentation-notes-fast-held']]]],
 ['07 · 超级玛丽',[['手柄、暂停与连接',['game','game-paused','game-disconnect']],['按住与释放',['game-held-up','game-held-down','game-held-left','game-held-right','game-held-b','game-held-a']]]],
 ['08 · 应用切换',[['全局入口',['chooser']]]]
 ];
 const planned=spec.flatMap(([,s])=>s.flatMap(([,names])=>names));const missing=planned.filter(n=>!byName.has(n));const unassigned=[...byName.keys()].filter(n=>!planned.includes(n));if(missing.length||unassigned.length)throw Error(JSON.stringify({missing,unassigned}));
 const heights=[100,100,100];
 for(const [name,subgroups]of spec){const outer=section(name,page);let y=64,maxWidth=0;const detail=[];
  for(const [label,names]of subgroups){const inner=section(label,outer);const size=arrange(inner,names.map(n=>byName.get(n)),name.includes('玛丽')?2:4);inner.x=40;inner.y=y;y+=size.height+64;maxWidth=Math.max(maxWidth,size.width);detail.push({id:inner.id,name:label,frames:names.map(n=>byName.get(n).id)});}
  outer.resizeWithoutConstraints(maxWidth+80,y-24);const col=heights.indexOf(Math.min(...heights));outer.x=80+col*2060;outer.y=heights[col];heights[col]+=outer.height+160;groups.push({id:outer.id,name,subsections:detail});
 }
 for(const n of [...page.children])if(n.type==='TEXT'){removed.push(n.id);n.remove();}
}
if(PAGE==='21:6225'){
 const frames=page.children.filter(n=>n.type==='FRAME');const names={'22:6227':'01 · 全局 / 应用切换','22:6545':'02 · 局部 / 上下文控件生成','22:6772':'03 · 输入方式 / 触控板展开'};
 for(let i=0;i<frames.length;i++){const frame=frames[i],s=section(names[frame.id]||frame.name,page);arrange(s,[frame],1);s.x=80+i*550;s.y=100;groups.push({id:s.id,name:s.name,frames:[frame.id]});}
 for(const n of [...page.children])if(n.type==='TEXT'){removed.push(n.id);n.remove();}
}
if(PAGE==='2:2'){
 const original=[...page.children];const components=original.filter(n=>n.type==='COMPONENT'||n.type==='COMPONENT_SET');
 for(const id of ['4:98','4:103']){const n=components.find(n=>n.id===id);if(n&&(await n.getInstancesAsync()).length===0){removed.push(n.id);n.remove();}}
 const active=components.filter(n=>!removed.includes(n.id));
 const cats=[['01 · 功能图标',active.filter(n=>n.name.startsWith('Icon/'))],['02 · 应用品牌',active.filter(n=>n.name.startsWith('Brand/'))],['03 · 输入与通用控件',active.filter(n=>/^(Input|Control|Keyboard|Status)\s*\//.test(n.name))],['04 · 上下文与生成控件',active.filter(n=>/^(Context|Suggestion)\s*\//.test(n.name))],['05 · 交互状态变体',active.filter(n=>n.name.startsWith('State /'))]];
 let y=100;for(const [name,nodes]of cats){const s=section(name,page);arrange(s,nodes,name.includes('图标')?10:name.includes('品牌')?7:name.includes('变体')?1:2);s.x=80;s.y=y;y+=s.height+96;groups.push({id:s.id,name,components:nodes.map(n=>n.id)});}
 const tokens=original.filter(n=>n.x>=1040);const tokenSection=section('06 · 主题颜色与玻璃材质',page);for(const n of tokens){const x=n.x,y=n.y;tokenSection.appendChild(n);n.x=x-1000;n.y=y-400;mutated.push(n.id);}tokenSection.resizeWithoutConstraints(430,880);tokenSection.x=1450;tokenSection.y=100;groups.push({id:tokenSection.id,name:tokenSection.name});
 for(const n of original)if(n.type==='TEXT'&&n.parent===page){removed.push(n.id);n.remove();}
}
return {page:PAGE,createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,groups,topLevel:page.children.map(n=>({id:n.id,type:n.type,name:n.name,x:n.x,y:n.y,width:n.width,height:n.height}))};
