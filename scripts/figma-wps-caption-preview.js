
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const get=id=>figma.getNodeByIdAsync(id),created=[],mutated=[],pairs={},toggles={},phones={};
const section=await get('109:5272'),outer=await get('109:5269'),startY=section.height+56;
function text(p,name,value,x,y,size,color,width){const n=figma.createText();p.appendChild(n);created.push(n.id);n.name=name;n.fontName={family:'Noto Sans SC',style:'Regular'};n.fontSize=size;n.lineHeight={unit:'PIXELS',value:Math.round(size*1.6)};n.fills=[{type:'SOLID',color}];n.characters=value;n.x=x;n.y=y;if(width){n.textAutoResize='HEIGHT';n.resize(width,n.height);}return n;}
function rect(p,name,x,y,w,h,color,radius=0){const n=figma.createRectangle();p.appendChild(n);created.push(n.id);n.name=name;n.x=x;n.y=y;n.resize(w,h);n.cornerRadius=radius;n.fills=[{type:'SOLID',color}];return n;}
const states=[['off','default'],['listening','caption-listening'],['partial','caption-partial'],['final','caption-final'],['next','caption-final'],['error','caption-error']];
for(let i=0;i<states.length;i++){
 const [key,source]=states[i],root=figma.createFrame();section.appendChild(root);created.push(root.id);root.name='字幕配对预览 / '+key;root.x=0;root.y=startY+i*1040;root.resize(1760,984);root.fills=[{type:'SOLID',color:{r:.91,g:.93,b:.94}}];root.clipsContent=true;pairs[key]=root.id;
 text(root,'Preview label','手机采音 → 平板观众字幕 · '+({off:'关闭',listening:'采音中',partial:'当前句逐步更新',final:'当前句确认',next:'下一句替换',error:'采音不可用'})[key],24,14,18,{r:.14,g:.24,b:.28});
 text(root,'Simulation boundary','Figma 模拟：演讲备注只在手机可见；字幕最多两行。',24,48,13,{r:.34,g:.42,b:.45});
 const phone=(await get(SCREENS[source])).clone();root.appendChild(phone);created.push(phone.id);phone.x=24;phone.y=90;phone.name='Phone controller';await phone.setReactionsAsync([]);phones[key]=phone.id;
 const toggle=phone.findOne(n=>n.name==='Captions / toggle');toggles[key]=toggle.id;
 const tablet=figma.createFrame();root.appendChild(tablet);created.push(tablet.id);tablet.name='Tablet / audience screen';tablet.x=454;tablet.y=110;tablet.resize(1280,800);tablet.cornerRadius=24;tablet.clipsContent=true;tablet.fills=[{type:'SOLID',color:{r:.985,g:.981,b:.97}}];
 rect(tablet,'Slide accent',72,78,60,6,{r:.78,g:.27,b:.16},3);
 text(tablet,'Slide eyebrow','季度业务回顾',72,112,20,{r:.52,g:.37,b:.31});
 const heading=text(tablet,'Slide title','让持续合作，带来稳定增长',72,178,48,{r:.09,g:.18,b:.22});heading.fontName={family:'Noto Sans SC',style:'Bold'};
 const cols=[['01','客户留存','持续合作 · 回应客户反馈'],['02','新增机会','延伸应用 · 验证具体需求'],['03','下一季度','明确负责人 · 跟进交付进度']];
 for(let j=0;j<cols.length;j++){const x=72+j*388;rect(tablet,'Content divider '+j,x,344,342,1,{r:.82,g:.8,b:.76});text(tablet,'Index '+j,cols[j][0],x,368,18,{r:.78,g:.27,b:.16});text(tablet,'Heading '+j,cols[j][1],x,414,30,{r:.12,g:.23,b:.27});text(tablet,'Summary '+j,cols[j][2],x,474,19,{r:.37,g:.43,b:.45});}
 text(tablet,'Slide number','04 / 06',1140,60,16,{r:.49,g:.53,b:.54});
 const lines={partial:'本季度，我们首先关注客户留存，',final:'老客户的持续合作，\n为本季度提供了稳定的基础。',next:'接下来，新增机会主要来自\n已有产品的延伸应用。'};
 if(lines[key]){const box=rect(tablet,'Live captions',80,652,1120,104,{r:.065,g:.095,b:.115},20);box.opacity=.9;text(tablet,'Audience captions',lines[key],112,667,26,{r:1,g:1,b:1},1056);}
}
const nav=id=>({type:'NODE',destinationId:id,navigation:'NAVIGATE',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.18}});
for(const [key,id]of Object.entries(pairs)){const root=await get(id),toggle=await get(toggles[key]);await toggle.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[nav(pairs[key==='off'||key==='error'?'listening':'off'])]}]);mutated.push(toggle.id);
 if(['listening','partial','final'].includes(key))await root.setReactionsAsync([{trigger:{type:'AFTER_TIMEOUT',timeout:key==='final'?2.4:1.4},actions:[nav(pairs[key==='listening'?'partial':key==='partial'?'final':'next'])]}]);
 if(key==='error'){const retry=(await get(phones[key])).findOne(n=>n.name==='Captions / retry');await retry.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[nav(pairs.listening)]}]);mutated.push(retry.id);}
}
section.resizeWithoutConstraints(1760,startY+states.length*1040);outer.resizeWithoutConstraints(1840,section.y+section.height+64);mutated.push(section.id,outer.id);
figma.currentPage.flowStartingPoints=[...figma.currentPage.flowStartingPoints,{nodeId:pairs.off,name:'WPS · 手机采音与平板字幕'},{nodeId:pairs.error,name:'WPS · 配对字幕失败恢复'}];
return {createdNodeIds:created,mutatedNodeIds:mutated,pairs,toggles,phones};
