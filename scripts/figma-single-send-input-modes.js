// Append to adaptive kit. Inject targetPage and preferred master IDs. Design-only migration.
const targetPageNode=await figma.getNodeByIdAsync(targetPage);await figma.setCurrentPageAsync(targetPageNode);
const candidates=targetPageNode.findAllWithCriteria({types:['COMPONENT']}).filter(n=>n.width===390&&n.children.some(c=>c.name==='02 · 上下文自适应输入'&&c.findOne(d=>d.name==='Adaptive / sole composer')));
const groups=new Map();for(const n of candidates){const key=n.parent.id+'|'+n.name.replace(/,?\s*Input=[^,]+/,'').trim();if(!groups.has(key))groups.set(key,[]);groups.get(key).push(n);}
const summaries=[],removed=[],changedSets=new Set();
for(const [key,list]of groups){
 const base=list.find(n=>preferred.includes(n.id))||list.find(n=>n.name.includes('Input=Expanded'))||list[0];
 const stateKey=base.name.replace(/,?\s*Input=[^,]+/,'').trim();
 const locked=/Recording/.test(stateKey);
 const wasKeyboard=/State=(?:Draft)?Keyboard/.test(stateKey)||base.findOne(n=>n.name==='keyboard');
 const wasTrackpad=/State=(?:Draft)?Trackpad|State=Point/.test(stateKey)||base.findOne(n=>n.name==='trackpad');
 const initial=preferred.includes(base.id)?'Minimized':wasKeyboard?'Keyboard':wasTrackpad?'Trackpad':'Minimized';
 const modes=locked?['Minimized']:['Minimized','Keyboard','Trackpad'];const nodes={[initial]:base};
 const spare=list.filter(n=>n!==base);for(const m of modes)if(!nodes[m]){const match=spare.findIndex(n=>n.name.endsWith('Input='+m));nodes[m]=(match>=0?spare.splice(match,1)[0]:spare.shift())||track(base.clone());if(nodes[m].parent!==base.parent)base.parent.appendChild(nodes[m]);} for(const m of modes)if(nodes[m]!==base){const n=nodes[m];for(const c of [...n.children])c.remove();for(const child of base.children){const copy=child.clone();n.appendChild(copy);copy.x=child.x;copy.y=child.y;}}
 // Old duplicate variants are retained as named compatibility states if any incoming link still exists.
 for(const n of spare){n.name=stateKey+', Input=Legacy';}
 for(const m of modes){
  const n=nodes[m];n.name=stateKey+', Input='+m;changedSets.add(n.parent.id);mutated.push(n.id);
  const mid=n.children.find(c=>c.name==='02 · 上下文自适应输入'),top=n.children.find(c=>c.name.startsWith('01 ·'));
  let ed=mid.findOne(c=>c.name==='Adaptive / sole composer');if(!ed)continue;if(ed.type==='INSTANCE'&&!ed.findOne(c=>c.name==='Composer / send'))ed=ed.detachInstance();
  const oldDock=n.children.find(c=>c.name.startsWith('03 ·'));const oldVoice=oldDock?.findOne(c=>c.type==='INSTANCE'&&(/voice/.test(c.name)||c.name==='按住说话'));
  const voiceText=oldVoice?.findOne(c=>c.type==='TEXT')?.characters;
  const oldVoiceReactions=oldVoice?.reactions||[];
  let body=mid.children.find(c=>c.name==='Adaptive / scrolling tools');
  if(!body){body=box('Adaptive / scrolling tools',354,100);body.layoutMode='NONE';mid.appendChild(body);
   for(const c of [...mid.children])if(c!==ed&&c!==body){if(/最小化|展开输入|收起输入/.test(c.name)){removed.push(c.id);c.remove();}else{const x=c.x,y=c.y;body.appendChild(c);c.x=x-18;c.y=y;}}
  }
  const dh=m==='Minimized'?136:370;const dy=844-dh;
  mid.resize(390,dy-top.height);mid.y=top.height;mid.clipsContent=true;
  if(ed.parent!==mid)mid.appendChild(ed);ed.x=18;ed.y=mid.height-ed.height-12;
  body.x=18;body.y=0;body.resize(354,Math.max(48,ed.y-12));body.clipsContent=true;body.overflowDirection='VERTICAL';
  // Custom editors receive the same paper-plane send control; component-based editors inherit it.
  if(!ed.findOne(c=>c.name==='Composer / send')){
   const s=await inst('button','Glass','Default',{label:'发送',icon:'Send',w:88});s.name='Composer / send';s.resize(88,48);
   ed.appendChild(s);if(ed.layoutMode&&ed.layoutMode!=='NONE')s.layoutPositioning='ABSOLUTE';s.x=ed.width-100;s.y=ed.height-56;
   for(const ic of s.findAllWithCriteria({types:['INSTANCE']}))ic.visible=true;
   for(const t of ed.children.filter(c=>c.type==='TEXT')){if(ed.height<=80)t.resize(Math.min(t.width,ed.width-124),t.height);else if(t.y+t.height>ed.height-60)t.resize(t.width,Math.max(22,ed.height-72));}
  }
  if(oldDock){removed.push(oldDock.id);oldDock.remove();}
  const dock=await inst('input-dock','Glass',m);dock.name='03 · 固定输入 / '+m;place(dock,n,0,dy);
  const voice=dock.findOne(c=>c.type==='INSTANCE'&&c.name==='voice');
  if(voice){if(voiceText==='松开结束'||locked){voice.swapComponent(await figma.getNodeByIdAsync(F.voice.variants['Glass/Pressed']));const lp=Object.keys(voice.componentProperties).find(k=>k.startsWith('Label#'));if(lp)voice.setProperties({[lp]:'松开结束'});}
   if(oldVoiceReactions.length)await voice.setReactionsAsync(oldVoiceReactions);
  }
  const buttons=dock.findAll(c=>c.type==='INSTANCE'&&c.name.startsWith('Input mode /'));
  for(const b of buttons){const mode=b.name.endsWith('Keyboard')?'Keyboard':'Trackpad';if(!locked)await react(b,nodes[m===mode?'Minimized':mode].id,'ON_CLICK',.22);else await b.setReactionsAsync([]);}
  // Current dock names are stable action identities, independent of their glyph.
  const suffixes={Minimized:['1368:21827','1368:21842'],Keyboard:['1368:21903','1368:21918'],Trackpad:['1368:22093','1368:22108']};
  for(const [i,mode]of ['Keyboard','Trackpad'].entries()){const b=dock.findOne(c=>c.id.endsWith(';'+suffixes[m][i]));if(b){if(!locked)await react(b,nodes[m===mode?'Minimized':mode].id,'ON_CLICK',.22);else await b.setReactionsAsync([]);}}
 }
 summaries.push({state:stateKey,variants:Object.fromEntries(Object.entries(nodes).map(([k,n])=>[k,n.id]))});
}
for(const id of changedSets){const set=figma.getNodeById(id);if(set.type!=='COMPONENT_SET')continue;set.children.forEach((n,i)=>{n.x=24+(i%8)*422;n.y=48+Math.floor(i/8)*884;});set.resize(3420,Math.ceil(set.children.length/8)*884+80);}
return{createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,groups:summaries};
