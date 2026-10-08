// Preserve original prototype destination and tool identities.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const created=[],mutated=[],removed=[];const dest=await figma.getNodeByIdAsync('5:7769');
for(const id of ['24:6233','24:6234','24:6240']){const n=await figma.getNodeByIdAsync(id);if(n){removed.push(n.id);n.remove();}}
const main=await figma.getNodeByIdAsync('5:2');for(const n of main.children)if(n.name==='Ambient / theme light'||n.name==='Context / Quote'||n.name==='建议回复'||n.name==='Suggestion / Reply'){const c=n.clone();dest.insertChild(0,c);c.x=n.x;c.y=n.y;created.push(c.id);}
const zone=await figma.getNodeByIdAsync('5:7794'),panel=zone.parent,bg=panel.findOne(n=>n.name==='Input / glass section boundary');panel.y=474;panel.resize(390,370);bg.resize(390,370);zone.layoutMode='NONE';zone.resize(346,322);zone.x=22;zone.y=16;
const tools=await figma.getNodeByIdAsync('5:7795'),draft=await figma.getNodeByIdAsync('5:7838'),row=await figma.getNodeByIdAsync('5:7840');tools.x=0;tools.y=0;draft.visible=false;row.x=0;row.y=264;
const parts={};for(const [key,id]of [['surface','22:6945'],['title','22:6927'],['close','22:6932']]){const s=await figma.getNodeByIdAsync(id),c=s.clone();panel.appendChild(c);c.layoutPositioning='ABSOLUTE';c.x=s.x;c.y=s.y;c.manualKeyframeTracks={};c.opacity=1;created.push(c.id);parts[key]=c.id;if(key==='close')await c.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'BACK'}]}]);}
const toggle=await figma.getNodeByIdAsync('19:7409');await toggle.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'BACK'}]}]);
mutated.push(dest.id,zone.id,panel.id,bg.id,tools.id,draft.id,row.id,toggle.id);return {createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,parts,view:dest.id};
