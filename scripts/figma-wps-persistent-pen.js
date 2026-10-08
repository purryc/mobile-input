// Input STATE: current editable Figma screen ledger.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const get=id=>figma.getNodeByIdAsync(id),created=[],mutated=[],removed=[],screens={...STATE.screens},evidence=[];
const source=(await get(screens.settings)).findOne(n=>n.name==='Presentation / pen settings');
const position=await figma.variables.getVariableByIdAsync(STATE.consistencyRevision.brushVariables.position),labelVar=await figma.variables.getVariableByIdAsync(STATE.consistencyRevision.brushVariables.label);
const collection=await figma.variables.getVariableCollectionByIdAsync(position.variableCollectionId);position.setValueForMode(collection.defaultModeId,35);labelVar.setValueForMode(collection.defaultModeId,'3 px');mutated.push(position.id,labelVar.id);
const settingsKeys=['settings','settings-blue','settings-green'];
const colors={橙红:{r:.78,g:.27,b:.16},蓝色:{r:.16,g:.49,b:.9},墨黑:{r:.07,g:.19,b:.23},金色:{r:.89,g:.66,b:.23},绿色:{r:.12,g:.59,b:.35}};
for(const [key,id]of Object.entries(screens)){
 if(settingsKeys.includes(key))continue;
 const root=await get(id),hold=root.findOne(n=>n.name==='Presentation / hold to draw');
 for(const n of root.findAll(n=>n.name==='Pen status')){removed.push(n.id);n.remove();}
 if(!hold)continue;
 const panel=source.clone();root.appendChild(panel);created.push(panel.id);panel.name='Presentation / persistent pen settings';panel.x=22;panel.y=548;panel.resize(346,120);panel.fills=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.48}];panel.cornerRadius=24;
 for(const n of [...panel.children])if(n.name==='Settings heading'||n.name==='Settings / close'){removed.push(n.id);n.remove();}
 const notes=root.findOne(n=>n.name==='Presentation / notes'),scroll=root.findOne(n=>n.name==='Presentation / scrollable notes'),nav=root.findOne(n=>n.name==='Presentation / navigation'),volume=root.findOne(n=>n.name==='Presentation / tablet volume');
 notes.resize(346,272);scroll.resize(310,214);nav.y=424;volume.y=488;mutated.push(notes.id,scroll.id,nav.id,volume.id);
 const palette=panel.findOne(n=>n.name==='Pen / colors');palette.x=12;palette.y=8;palette.resize(322,48);palette.itemSpacing=20;palette.primaryAxisAlignItems='CENTER';mutated.push(palette.id);
 const selected=key.includes('green')?'绿色':key.includes('blue')?'蓝色':key==='black'?'墨黑':key==='gold'?'金色':'橙红';
 for(const b of palette.children){const colorName=b.name.split(' / ')[1],active=selected===colorName;b.strokeWeight=active?2:1;b.strokes=[{type:'SOLID',color:active?colors[colorName]:{r:1,g:1,b:1},opacity:active?1:.9}];
 if(b.reactions.some(r=>(r.actions||[]).some(a=>a.destinationId===id)))await b.setReactionsAsync([]);mutated.push(b.id);}
 const controls=figma.createAutoLayout('HORIZONTAL');panel.appendChild(controls);created.push(controls.id);controls.name='Pen / size and edit row';controls.x=12;controls.y=64;controls.resize(322,48);controls.primaryAxisSizingMode='FIXED';controls.counterAxisSizingMode='FIXED';controls.itemSpacing=8;controls.counterAxisAlignItems='CENTER';controls.fills=[];
 const slider=panel.findOne(n=>n.name==='Pen / brush-size slider');controls.appendChild(slider);slider.resize(210,48);slider.x=0;slider.y=0;mutated.push(slider.id);
 const heading=panel.findOne(n=>n.name==='Brush size label'),value=panel.findOne(n=>n.name==='Brush size value');slider.appendChild(heading);slider.appendChild(value);heading.x=0;heading.y=0;heading.fontSize=11;heading.lineHeight={unit:'PIXELS',value:16};value.x=178;value.y=0;value.fontSize=11;value.lineHeight={unit:'PIXELS',value:16};mutated.push(heading.id,value.id);
 const track=slider.findOne(n=>n.name==='Brush track'),fill=slider.findOne(n=>n.name==='Brush filled track'),thumbRow=slider.findOne(n=>n.name==='Brush thumb position');track.x=10;track.y=30;track.resize(190,4);fill.x=10;fill.y=30;thumbRow.x=0;thumbRow.y=16;thumbRow.resize(210,32);mutated.push(track.id,fill.id,thumbRow.id);
 const hits=slider.findOne(n=>n.name==='Brush slider / hit areas');for(const n of [...hits.children]){removed.push(n.id);n.remove();}hits.resize(210,48);mutated.push(hits.id);
 for(const [size,x]of [[1,1],[4,52],[8,121],[12,190]]){const hit=figma.createFrame();hits.appendChild(hit);created.push(hit.id);hit.name='Brush size / '+size+' px';hit.resize(52.5,48);hit.fills=[];await hit.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'SET_VARIABLE',variableId:position.id,variableValue:{type:'FLOAT',resolvedType:'FLOAT',value:x}},{type:'SET_VARIABLE',variableId:labelVar.id,variableValue:{type:'STRING',resolvedType:'STRING',value:size+' px'}}]}]);}
 slider.appendChild(hits);
 const oldOptions=panel.findOne(n=>n.name==='Pen / edit tools');for(const b of [...oldOptions.children]){controls.appendChild(b);b.resize(48,48);for(const t of [...b.children])if(t.type==='TEXT'){removed.push(t.id);t.remove();}mutated.push(b.id);}removed.push(oldOptions.id);oldOptions.remove();
 const pen=root.findOne(n=>n.name==='Tool / pen');await pen.setReactionsAsync([]);mutated.push(pen.id);
 evidence.push({id,key,notesHeight:notes.height,panelY:panel.y,panelHeight:panel.height,rowWidths:controls.children.map(n=>n.width)});
}
const replacements={[screens.settings]:screens.ink,[screens['settings-blue']]:screens.blue,[screens['settings-green']]:screens.green};
for(const n of figma.currentPage.findAll(n=>'reactions' in n&&n.reactions.length)){const raw=JSON.stringify(n.reactions);let next=raw;for(const [a,b]of Object.entries(replacements))next=next.split('"'+a+'"').join('"'+b+'"');if(next!==raw){await n.setReactionsAsync(JSON.parse(next));mutated.push(n.id);}}
for(const key of settingsKeys){const node=await get(screens[key]);removed.push(node.id);node.remove();delete screens[key];}
const section=await get('109:5271');let index=0;for(const node of section.children.filter(n=>n.type==='FRAME')){node.x=30+(index%4)*430;node.y=64+Math.floor(index/4)*920;mutated.push(node.id);index++;}
const missing=[];for(const n of figma.currentPage.findAll(n=>'reactions' in n&&n.reactions.length))for(const r of n.reactions)for(const a of r.actions||[])if(a.destinationId&&!await get(a.destinationId))missing.push({source:n.id,target:a.destinationId});
figma.viewport.scrollAndZoomIntoView([await get(screens.ink)]);
return {createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,screens,evidence,missing};
