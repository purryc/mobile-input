// Append to adaptive kit; inject primary WorkBuddy master IDs.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const set=figma.getNodeById('1286:6160'),extra={};
// Stable recognition is demonstrated while the held voice control stays in place.
for(const [from,to,seconds]of [['Compose','RecognizeColor',1.5],['PreserveColor','RecognizeLayout',2.2]])await figma.getNodeById(primary[from]).setReactionsAsync([{trigger:{type:'AFTER_TIMEOUT',timeout:seconds},actions:[{type:'NODE',destinationId:primary[to],navigation:'CHANGE_TO',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_OUT'},duration:.18}}]}]);
const undo=track(figma.getNodeById(primary.PreserveColor).clone());set.appendChild(undo);undo.name='State=ColorUndone, Input=Minimized';await undo.setReactionsAsync([]);const uc=undo.findOne(n=>n.name==='inline-color');uc.swapComponent(figma.getNodeById('1368:22446'));const up=undo.findOne(n=>n.name==='color-refinement');up.swapComponent(figma.getNodeById('1368:22480'));extra.undo=undo.id;
for(const c of set.children.filter(n=>/State=(CustomColor|PreserveColor),/.test(n.name))){const dock=c.children.find(n=>n.name.startsWith('03 ·'));const icon=dock.findOne(n=>n.type==='INSTANCE'&&n.name==='Icon'&&n.mainComponent?.name==='Icon/Undo2');if(icon)await react(icon.parent,undo.id);}
// Contextual task switch keeps the editor and precise values from the originating task.
for(const [state,id]of Object.entries(primary)){
 const source=figma.getNodeById(id),c=track(source.clone());set.appendChild(c);c.name='State=TasksFrom'+state+', Input=Minimized';await c.setReactionsAsync([]);
 const tools=c.findOne(n=>n.name==='Adaptive / scrolling tools');for(const child of [...tools.children])child.remove();
 const label=txt('切换任务','Title');place(label,tools,0,8);
 const current=await inst('button','Glass','Selected',{label:'公司 Roadmap PPT',icon:'Presentation',w:354});current.resize(354,64);place(current,tools,0,56);await react(current,id);
 const other=await inst('button','Glass','Default',{label:'整理演示票据 · 待补材料',icon:'Paperclip',w:354});other.resize(354,64);place(other,tools,0,136);await react(other,'1286:3775');
 const top=source.children.find(n=>n.name.startsWith('01 ·'));const taskButton=top.children.find(n=>n.type==='INSTANCE'&&n.x===324);await react(taskButton,c.id);extra['tasks'+state]=c.id;
}
// Restore the established WeChat recording/polish/send simulation after relocating controls.
const wcSets=['1304:10334','1304:10583','1304:10840','1304:11112','1304:11475'];
const setVar=(variableId,value)=>({type:'SET_VARIABLE',variableId,variableValue:{type:typeof value==='boolean'?'BOOLEAN':'STRING',resolvedType:typeof value==='boolean'?'BOOLEAN':'STRING',value}});
const nav=id=>({type:'NODE',destinationId:id,navigation:'NAVIGATE',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.1},resetScrollPosition:false});
for(const sid of wcSets)for(const c of figma.getNodeById(sid).children){
 const ed=c.findOne(n=>n.name==='Adaptive / sole composer');const added=ed.children.filter(n=>n.name==='Composer / placeholder');const existing=ed.children.find(n=>n.type==='TEXT'&&n.characters==='输入回复…');
 for(const ph of added){if(existing)ph.remove();else ph.setBoundVariable('visible',await figma.variables.getVariableByIdAsync('VariableID:173:4709'));}
 const dock=c.children.find(n=>n.name.startsWith('03 ·'));let voice=dock.findOne(n=>n.type==='INSTANCE'&&n.name==='voice');if(!voice){const mic=dock.findOne(n=>n.type==='INSTANCE'&&n.name==='Icon'&&n.mainComponent?.name==='Icon/Mic');voice=mic?.parent;}
 if(voice){const recording=sid==='1304:10583';if(recording&&voice.name==='voice'){voice.swapComponent(figma.getNodeById(F.voice.variants['Glass/Pressed']));const key=Object.keys(voice.componentProperties).find(k=>k.startsWith('Label#'));if(key)voice.setProperties({[key]:'松开结束'});}
 await voice.setReactionsAsync([{trigger:{type:recording?'MOUSE_UP':'MOUSE_DOWN',delay:0},actions:recording?[nav('5:5935')]:[setVar('VariableID:173:4710',false),setVar('VariableID:173:4708','好的，明天下午两点见。我会提前准备好报价和项目介绍。'),setVar('VariableID:173:4709',false),nav('5:5794')]}]);}
 const send=ed.findOne(n=>n.name==='Composer / send');if(sid==='1304:10840'){send.setProperties({State:'Default'});await send.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[setVar('VariableID:173:4708',''),setVar('VariableID:173:4709',true),setVar('VariableID:173:4710',true),nav('5:2')]}]);}
}
set.children.forEach((n,i)=>{n.x=24+(i%8)*422;n.y=48+Math.floor(i/8)*884;});set.resize(3420,Math.ceil(set.children.length/8)*884+80);
return{createdNodeIds:created,mutatedNodeIds:[set.id,...wcSets,...Object.values(primary)],extra};
