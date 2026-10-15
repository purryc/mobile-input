// Repair compact editor affordances and restore useful PC adaptive content.
for(const id of ['271:3678','271:3688']){const c=await figma.getNodeByIdAsync(id);c.primaryAxisAlignItems='MIN';const t=c.children.find(n=>n.name==='Value');t.resize(232,t.height);t.textAutoResize='NONE';t.textTruncation='ENDING';t.maxLines=1;mutated.push(id);}
for(const c of (await figma.getNodeByIdAsync('271:4927')).children){c.itemSpacing=8;c.resize(280,56);for(const n of c.children)n.resize(64,56);mutated.push(c.id);}
for(const f of [F.sketch,F.camera])for(const id of Object.values(f.variants)){const c=await figma.getNodeByIdAsync(id);const area=c.children.find(n=>n.name==='Canvas');if(area){area.layoutSizingVertical='FILL';area.layoutSizingHorizontal='FILL';}}
for(const [id,f]of Object.entries(F).filter(([id])=>id.startsWith('recipe-')&&id.endsWith('-pc'))){const set=await figma.getNodeByIdAsync(f.id);for(const c of set.children){const top=c.children.find(n=>n.name==='01 · 当前对象与任务状态'),mid=c.children.find(n=>n.name==='02 · 上下文自适应输入');const title=id.includes('wechat')?'陈总 · 当前消息':id.includes('doubao')?'澄星项目采购方案':id.includes('sheet')?'销售报价表 · D13':'澄星采购方案 · 03 / 06';place(txt(title,'Title'),top,300,24);
 if(id.includes('wechat')){for(const [i,label]of ['可以，我会准时参加。','时间没问题，我先准备方案。'].entries()){const b=await inst('reply','Glass','Default',{label,w:378});place(b,mid,412,8+i*76);}for(const [i,label]of ['安排日程','高德导航','飞书项目简报'].entries()){const b=await inst('app-action','Glass','Default',{label,w:430,icon:['CalendarDays','MapPin','FileText'][i]});place(b,mid,814,8+i*68);} }
 if(id.includes('sheet')){const range=await inst('choice','Glass','Selected',{label:'应用到 D13',w:354});place(range,mid,414,8);const formula=await inst('chip','Glass','Selected',{label:'SUM · 求和',w:172});place(formula,mid,414,76);const avg=await inst('chip','Glass','Default',{label:'AVERAGE · 平均值',w:172});place(avg,mid,596,76);const preview=await inst('task','Glass','Default',{w:448});place(preview,mid,800,8);for(const t of preview.findAllWithCriteria({types:['TEXT']})){if(t.characters.includes('采购方案'))t.characters='计算结果 · 预览';else if(t.characters.includes('星海'))t.characters='当前选区 D2:D12';else t.characters='确认后写入 D13';}}
 }}
// Semantic region and interaction rules are documentation, outside controller frames.
const replaceText=async(id,s)=>{const n=await figma.getNodeByIdAsync(id);n.characters=s;mutated.push(id);};
await replaceText('274:9922','对象与状态 / 上下文 / 固定输入');
await replaceText('274:9923','顶部：当前对象与任务状态。\n中部：建议、画板、色板和参数。\n底部：固定输入，可最小化。');
await replaceText('274:13372','顶部固定当前对象与任务状态；中部承载上下文控件。\n底部草稿、编辑、语音与键盘 / 触控板可最小化。\n最小化保留草稿与展开入口，不改变输入目标。\n录音、拖动、绘制与游戏按住期间禁止重排。');
await replaceText('274:13378','componentId / region / props / state / actions / capabilities\nregion = target | adaptive | fixedInput\n主题由 appId 映射；本轮统一 Liquid Glass。\n输入区折叠由用户控制；模型不能覆盖草稿或锁定状态。');
// Remove the redundant second game specimen; the game controls remain fixed during play.
const gameBoard=await figma.getNodeByIdAsync(ds.boards.games);const gs=gameBoard.children.filter(n=>n.type==='INSTANCE');if(gs[1])gs[1].remove();
// Readable master packing after recipe expansion.
const masters=await figma.getNodeByIdAsync(ds.masters||'277:15031');let yy=80;for(const set of masters.children.filter(n=>n.type==='COMPONENT_SET')){set.x=40;set.y=yy;yy+=set.height+100;}if(masters.type==='SECTION')masters.resizeWithoutConstraints(Math.max(5700,...masters.children.map(n=>n.x+n.width+40)),yy+40);
return {createdNodeIds:created,mutatedNodeIds:mutated};
