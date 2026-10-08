// Input ROOT_IDS: current WPS phone screens and paired-preview phone copies.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const removed=[],mutated=[],evidence=[];
for(const id of ROOT_IDS){
 const root=await figma.getNodeByIdAsync(id);
 const volume=root.findOne(n=>n.name==='Presentation / tablet volume');
 if(!volume)continue;
 removed.push(volume.id);volume.remove();
 const shield=root.findOne(n=>n.name==='Disabled volume hit shield');if(shield){removed.push(shield.id);shield.remove();}
 const notes=root.findOne(n=>n.name==='Presentation / notes'),scroll=root.findOne(n=>n.name==='Presentation / scrollable notes'),nav=root.findOne(n=>n.name==='Presentation / navigation');
 notes.resize(notes.width,notes.height+60);scroll.resize(scroll.width,scroll.height+60);nav.y+=60;mutated.push(notes.id,scroll.id,nav.id);
 evidence.push({id,notesHeight:notes.height,navigationY:nav.y});
}
const section=await figma.getNodeByIdAsync('109:5272');section.name='实时字幕';mutated.push(section.id);
const scope=await figma.getNodeByIdAsync('109:5269');
for(const t of scope.findAll(n=>n.type==='TEXT'&&n.name==='WPS prototype / scope')){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);t.characters='可编辑交互原型 · 手机采音、字幕与姿态均为模拟；备注仅在手机显示。';mutated.push(t.id);}
const remaining=scope.findAll(n=>n.name==='Presentation / tablet volume'||n.name==='Disabled volume hit shield'||(n.type==='TEXT'&&/播放音量|平板音量/.test(n.characters))).map(n=>n.id);
const missing=[];for(const n of scope.findAll(n=>'reactions' in n&&n.reactions.length))for(const r of n.reactions)for(const a of r.actions||[])if(a.destinationId&&!await figma.getNodeByIdAsync(a.destinationId))missing.push(a.destinationId);
figma.viewport.scrollAndZoomIntoView([await figma.getNodeByIdAsync('5:10065')]);
return {removedNodeIds:removed,mutatedNodeIds:mutated,evidence,remaining,missing};
