// Inputs: L, S. Adds reusable state variants and validates guarded prototype paths.
for(const st of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:L.font,style:st});
const created=[],mutated=[];const page=await figma.getNodeByIdAsync('2:2');await figma.setCurrentPageAsync(page);
function label(str,x,y,size=20){const t=figma.createText();t.fontName={family:L.font,style:'Medium'};t.characters=str;t.fontSize=size;t.fills=[{type:'SOLID',color:{r:.07,g:.176,b:.224}}];page.appendChild(t);t.x=x;t.y=y;created.push(t.id);return t;}
label('Mobile Input / Components',80,24,30);label('功能图标 · Lucide',80,72,15);label('原始品牌资产',80,370,15);label('固定输入区与生成控件',80,474,20);
for(const [source,title,states,y]of [['voice','Voice input',['Idle','Recording'],1100],['reply','Reply suggestion',['Default','Selected'],1270],['circle','Pointer tool',['Idle','Held'],1430]]){
 const variants=[];for(const [i,state]of states.entries()){const src=await figma.getNodeByIdAsync(L.components[source]);const c=src.clone();c.name='State='+state;if(i===1){c.fills=[{type:'SOLID',color:{r:.4,g:.82,b:.7},opacity:.22}];if(source==='voice'){const t=c.findOne(n=>n.type==='TEXT');t.characters='结束录音';const icon=c.findOne(n=>n.type==='INSTANCE');icon.swapComponent(await figma.getNodeByIdAsync(L.icons.Square));}else if(source==='reply'){const icon=c.findOne(n=>n.type==='INSTANCE');icon.swapComponent(await figma.getNodeByIdAsync(L.icons.Check));}}variants.push(c);created.push(c.id);}
 const set=figma.combineAsVariants(variants,page);set.name='State / '+title;set.x=80;set.y=y;set.resize(820,120);for(let i=0;i<variants.length;i++){variants[i].x=24+i*390;variants[i].y=38;}created.push(set.id);label(title,80,y-32,16);
}
label('Tokens / 7 application accents',1040,470,20);const names=['wechat','email','workbuddy','word','sheet','presentation','game'];let yy=524;for(const key of names){const v=await figma.variables.getVariableByIdAsync(L.variables['color/'+key]);const sw=figma.createRectangle();sw.resize(48,48);sw.cornerRadius=14;sw.fills=[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',v)];page.appendChild(sw);sw.x=1040;sw.y=yy;created.push(sw.id);label(key,1108,yy+10,16);yy+=72;}
label('Glass / Surface',1040,1090,20);label('细亮边 + 低饱和透光\n正文区域保持稳定底色\n功能文字、图标、布局均可编辑',1040,1130,16);
// Remove inappropriate inherited shortcuts from guarded states.
for(const key of ['wechat-record','wechat-disconnect','wechat-negated','wechat-new-chat']){
 for(const [h,id]of Object.entries(S.hotspots[key])){const keep=key==='wechat-record'?['voice','send']:key==='wechat-disconnect'?['retry']:['switch'];if(!keep.includes(h)){const n=await figma.getNodeByIdAsync(id);if(n?.reactions?.length){await n.setReactionsAsync([]);mutated.push(id);}}}
}
// Send preview and acknowledgement contain the same visible draft.
for(const key of ['wechat-applied','wechat-send-preview','wechat-sent']){const f=await figma.getNodeByIdAsync(S.screens[key]);for(const t of f.findAll(n=>n.type==='TEXT')){if(t.characters==='可以，周五两点见。'||t.characters==='没问题，周五两点见！')t.characters='没问题，周五两点见！';}}
// Place detailed task actions under a saved draft, then restore that exact draft.
const draft=await figma.getNodeByIdAsync(S.screens['wechat-draft']);const action=(await figma.getNodeByIdAsync(L.components.app)).createInstance();draft.appendChild(action);action.x=22;action.y=512;action.name='draft / meeting handoff';created.push(action.id);
await action.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:S.screens['wechat-task'],navigation:'NAVIGATE',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_IN_AND_OUT'},duration:.32}}]}]);
for(const key of ['wechat-task','wechat-missing','feishu-task']){const f=await figma.getNodeByIdAsync(S.screens[key]);const d=f.findOne(n=>n.name==='Input / Draft');const t=d.findOne(n=>n.type==='TEXT');t.characters='可以，我会准时参加。';}
// Restore the base source page as the opening canvas.
return {createdNodeIds:created,mutatedNodeIds:mutated,componentCount:page.findAllWithCriteria({types:['COMPONENT']}).length,componentSetCount:page.findAllWithCriteria({types:['COMPONENT_SET']}).length};
