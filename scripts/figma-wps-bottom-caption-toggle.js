// Input ROOT_IDS: current phone roots including paired-preview phone copies.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const created=[],mutated=[],removed=[],evidence=[];
for(const id of ROOT_IDS){
 const root=await figma.getNodeByIdAsync(id),tools=root.findOne(n=>n.name==='Presentation / fixed tools');
 const old=tools.findOne(n=>n.name==='Tool / calibration');if(old){removed.push(old.id);old.remove();}
 const slot=figma.createFrame();tools.appendChild(slot);created.push(slot.id);slot.name='Tool / live captions';slot.resize(74.5,56);slot.fills=[];slot.clipsContent=false;
 const rows=root.children.filter(n=>n.name==='Presentation / live captions'||n.name==='Presentation / captions enabled');
 const notes=root.findOne(n=>n.name==='Presentation / notes'),scroll=root.findOne(n=>n.name==='Presentation / scrollable notes'),nav=root.findOne(n=>n.name==='Presentation / navigation');
 notes.resize(346,notes.height+60);scroll.resize(310,scroll.height+60);nav.y+=60;mutated.push(notes.id,scroll.id,nav.id);
 for(const row of rows){
  const status=row.findOne(n=>n.type==='TEXT'&&n.name==='Caption status');
  if(status){notes.appendChild(status);status.x=228;status.y=14;status.fontSize=11;status.lineHeight={unit:'PIXELS',value:17};status.characters=status.characters==='手机正在收音'?'手机采音中':status.characters;const bound=row.boundVariables.visible;if(bound)status.setBoundVariable('visible',await figma.variables.getVariableByIdAsync(bound.id));mutated.push(status.id);}
  slot.appendChild(row);row.x=0;row.y=0;row.resize(74.5,56);row.cornerRadius=22;row.fills=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.32}];row.effects=[];mutated.push(row.id);
  const label=row.findOne(n=>n.name==='Caption label'),toggle=row.findOne(n=>n.name==='Captions / toggle');
  for(const n of [...row.children])if(n!==label&&n!==toggle){removed.push(n.id);n.remove();}
  label.characters='实时字幕';label.fontSize=11;label.lineHeight={unit:'PIXELS',value:16};label.x=15.25;label.y=4;mutated.push(label.id);
  toggle.x=0;toggle.y=0;toggle.resize(74.5,56);mutated.push(toggle.id);
  const track=toggle.findOne(n=>n.name==='Switch track'),knob=toggle.findOne(n=>n.type==='ELLIPSE'),on=knob.x>10;
  track.x=15.25;track.y=26;track.resize(44,24);track.cornerRadius=12;knob.resize(20,20);knob.x=on?37.25:17.25;knob.y=28;mutated.push(track.id,knob.id);
 }
 const settings=root.findOne(n=>n.name==='Presentation / pen settings');if(settings)root.appendChild(settings);
 evidence.push({id,notesHeight:notes.height,toolCount:tools.children.length,captionPosition:{x:slot.x,y:tools.y},captionStates:rows.length,penMenu:!!settings});
}
// Superseded calibration-only presentation boards no longer have an entry control.
const obsolete=['5:10543','152:6373','152:6436'];
for(const id of obsolete){const n=await figma.getNodeByIdAsync(id);if(n){removed.push(id);n.remove();}}
const section=await figma.getNodeByIdAsync('109:5271');let i=0;for(const root of section.children.filter(n=>n.type==='FRAME')){root.x=30+(i%4)*430;root.y=64+Math.floor(i/4)*920;i++;mutated.push(root.id);}
const missing=[];for(const n of figma.currentPage.findAll(n=>'reactions' in n&&n.reactions.length))for(const r of n.reactions)for(const a of r.actions||[])if(a.destinationId&&!await figma.getNodeByIdAsync(a.destinationId))missing.push({source:n.id,target:a.destinationId});
figma.viewport.scrollAndZoomIntoView([await figma.getNodeByIdAsync('5:9875')]);
return {createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,evidence,missing};
