// Append to adaptive kit; design-only finishing pass, read node IDs before reuse.
const changed=[];await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const wb=figma.getNodeById('1286:6160');const confirmed={};
for(const c of wb.children.filter(n=>/^State=Sketch,/.test(n.name))){const clone=track(c.clone());wb.appendChild(clone);clone.name=c.name.replace('State=Sketch,','State=SketchConfirmed,');const input=c.name.split('Input=')[1];confirmed[input]=clone.id;
 const panel=clone.findOne(n=>n.name==='layout-intent');panel.swapComponent(figma.getNodeById('1368:22720'));
 const send=clone.findOne(n=>n.name==='Composer / send');await react(send,'1286:3334');
 const origSend=c.findOne(n=>n.name==='Composer / send');origSend.setProperties({State:'Disabled'});await origSend.setReactionsAsync([]);
 const advance=c.findOne(n=>n.name==='Layout / advance');await react(advance,clone.id);
}
// Review returns to the confirmed sketch. Mode changes preserve the confirmation.
for(const [m,id]of Object.entries(confirmed)){const c=figma.getNodeById(id);for(const button of c.findAll(n=>n.name.startsWith('Toggle / '))){const next=button.name.endsWith('Keyboard')?'Keyboard':'Trackpad';await react(button,confirmed[next===m?'Minimized':next]);}}
for(const c of wb.children){const state=c.name.match(/State=([^,]+)/)?.[1];const ed=c.findOne(n=>n.name==='Adaptive / sole composer');
 if(['Sketch','SketchConfirmed'].includes(state)){const tools=c.findOne(n=>n.name==='Adaptive / scrolling tools');const color=await inst('inline-color','Glass','Edited');place(color,tools,0,348);await react(color,'1372:23874');}
 if(state==='Review'){const tools=c.findOne(n=>n.name==='Adaptive / scrolling tools');const back=tools.findOne(n=>n.type==='INSTANCE'&&n.findOne(t=>t.type==='TEXT'&&t.characters==='返回修改'));if(back)await react(back,confirmed.Minimized);
 const summary=c.findOne(n=>n.name==='Task / accumulated review');if(summary){const sketch=track(figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="98" height="64"><g fill="#f0f6f6" stroke="#18756D" stroke-width="1.5"><path d="M3 4 L43 3 L44 60 L2 61 Z M51 4 L95 5 L94 60 L51 59 Z M5 23 L42 23 M5 41 L42 41"/></g></svg>'));sketch.name='Review / retained raw sketch';place(sketch,summary,238,92);}}
 const status=state==='Paused'?'Stopped':['Materials','Received','Approval'].includes(state)?'NeedsInput':['Complete','RoadmapComplete','Applied'].includes(state)?'Complete':['Running','Tasks'].includes(state)?'Running':'Draft';
 const top=c.children.find(n=>n.name.startsWith('01 ·'));if(top&&!top.findOne(n=>n.name==='agent-task-status')){const identity=top.findOne(n=>n.name==='Task identity');if(identity){const meta=identity.children.find(n=>n.type==='TEXT');if(meta)meta.remove();const st=await inst('agent-task-status','Glass',status);identity.appendChild(st);identity.resize(290,64);identity.itemSpacing=0;}}
 if(state==='Paused')for(const t of c.findAllWithCriteria({types:['TEXT']}))if(t.characters==='正在制作演示文稿')t.characters='任务已停止';
 if(['RecognizeColor','RecognizeLayout'].includes(state)&&ed){const text=ed.children.find(n=>n.type==='TEXT');const glow=track(figma.createRectangle());glow.name='Recognition / cyan lilac glass sweep';glow.resize(80,4);glow.cornerRadius=2;glow.fills=[{type:'GRADIENT_LINEAR',gradientTransform:[[1,0,0],[0,1,0]],gradientStops:[{position:0,color:{r:.35,g:.87,b:1,a:.2}},{position:.5,color:{r:.38,g:.61,b:1,a:.8}},{position:1,color:{r:.77,g:.66,b:1,a:.15}}]}];ed.insertChild(0,glow);glow.x=state==='RecognizeColor'?236:14;glow.y=state==='RecognizeColor'?40:69;}
 changed.push(c.id);
}
// Stable voice labels and usable blank composers in the demo.
for(const c of figma.currentPage.findAllWithCriteria({types:['COMPONENT']}).filter(n=>n.width===390)){
 const mid=c.children.find(n=>n.name==='02 · 上下文自适应输入');if(!mid)continue;const ed=mid.findOne(n=>n.name==='Adaptive / sole composer');
 if(ed&&ed.type==='FRAME'){const value=ed.children.find(n=>n.type==='TEXT');if(value&&value.characters===''){const ph=txt('输入内容…','Body','text/muted',ed.width-124);ph.name='Composer / placeholder';place(ph,ed,18,18);const b=ed.findOne(n=>n.name==='Composer / send');if(b&&b.type==='INSTANCE'){b.setProperties({State:'Disabled'});await b.setReactionsAsync([]);}}}
 const voice=c.findOne(n=>n.name==='voice'&&n.type==='INSTANCE');if(voice){const p=Object.keys(voice.componentProperties).find(k=>k.startsWith('Label#'));if(p&&voice.componentProperties[p].value!=='松开结束')voice.setProperties({[p]:'按住说话'});}
}
wb.children.forEach((n,i)=>{n.x=24+(i%8)*422;n.y=48+Math.floor(i/8)*884;});wb.resize(3420,Math.ceil(wb.children.length/8)*884+80);
figma.getNodeById('109:5262').resizeWithoutConstraints(2440,3180);
await figma.setCurrentPageAsync(page);
// Fixed components: touch targets and reusable labels.
for(const id of Object.values(F['inline-color'].variants)){const c=figma.getNodeById(id);c.resize(c.width,48);changed.push(id);}
for(const id of Object.values(F['input-dock'].variants)){const c=figma.getNodeById(id);const v=c.findOne(n=>n.name==='voice');if(v){const p=Object.keys(v.componentProperties).find(k=>k.startsWith('Label#'));if(p)v.setProperties({[p]:'按住说话'});}}
const composerStates={ColorDefault:'1372:23721',ColorEdited:'1372:24014',Compact:'1286:3151'};const comps=[],vmap={};
for(const [state,id]of Object.entries(composerStates)){const source=(await figma.getNodeByIdAsync(id)).findOne(n=>n.name==='Adaptive / sole composer');const c=track(figma.createComponent());c.name='State='+state;c.resize(source.width,source.height);c.fills=source.fills;c.strokes=source.strokes;c.cornerRadius=source.cornerRadius;c.effects=source.effects;for(const ch of source.children){if(!ch.visible)continue;const cp=ch.clone();c.appendChild(cp);cp.x=ch.x;cp.y=ch.y;if('reactions'in cp)await cp.setReactionsAsync([]);}page.appendChild(c);comps.push(c);vmap['Glass/'+state]=c.id;}
const host=figma.getNodeById('277:15031');const set=track(figma.combineAsVariants(comps,host));set.name='Adaptive / Parameter composer';set.description='One editor with inline task parameters and a review-first send action. Compact state reserves send at the right.';set.x=40;set.y=host.height+40;comps.forEach((n,i)=>{n.x=24+i*390;n.y=48;});set.resize(1200,234);host.resizeWithoutConstraints(5700,set.y+set.height+80);
const board=figma.getNodeById('1368:22778');for(const [i,c]of comps.entries())place(track(c.createInstance()),board,1660,300+i*240);
const heading=txt('参数留在唯一文本框内','Title');place(heading,board,1660,260);
const diagram=txt('颜色值：system_default → user_edit\n确认：candidate → unconfirmed → confirmed\n归属：taskId + targetId + targetRevision\n手动值优先；非法 HEX 保留最后合法值\n提交：框内发送 → 核对 → 提交任务\n执行状态与连接状态分别绑定区域','Body','text/muted',950);place(diagram,board,2160,300);
// Library states are discrete interactive samples, not a live semantic engine.
return {createdNodeIds:created,mutatedNodeIds:changed,confirmed,parameterComposer:{id:set.id,states:Object.keys(composerStates),variants:vmap}};
