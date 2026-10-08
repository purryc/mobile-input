// Inputs STATE and CAPTION_SVG. Native, editable Figma refinement.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const get=id=>figma.getNodeByIdAsync(id),created=[],mutated=[],removed=[],screens={...STATE.screens};
const accent={r:.78,g:.27,b:.16},green={r:.12,g:.59,b:.35},ink={r:.07,g:.19,b:.23};
const paint=(color,opacity=1)=>({type:'SOLID',color,opacity});
const sec=await get('109:5271');
for(const [key,source]of [['green','blue'],['settings-green','settings-blue'],['drawing-green','drawing-blue']]){const n=(await get(screens[source])).clone();sec.appendChild(n);n.name='presentation-'+key;screens[key]=n.id;created.push(n.id);for(const t of n.findAll(n=>n.type==='TEXT'&&n.name==='Pen status')){t.characters='绿色';t.fills=[paint(green)];mutated.push(t.id);}}
const nav=id=>({type:'NODE',destinationId:id,navigation:'NAVIGATE',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_OUT'},duration:.2}});
for(const key of ['green','settings-green','drawing-green']){const root=await get(screens[key]),pen=root.findOne(n=>n.name==='Tool / pen'),hold=root.findOne(n=>n.name==='Presentation / hold to draw');if(key!=='settings-green')await pen.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[nav(screens['settings-green'])]}]);else await pen.setReactionsAsync([]);mutated.push(pen.id);
await hold.setReactionsAsync(key==='drawing-green'?[{trigger:{type:'MOUSE_UP',delay:0},actions:[nav(screens.green)]},{trigger:{type:'MOUSE_LEAVE',delay:0},actions:[nav(screens.green)]}]:[{trigger:{type:'MOUSE_DOWN',delay:0},actions:[nav(screens['drawing-green'])]}]);mutated.push(hold.id);
const close=root.findOne(n=>n.name==='Settings / close');if(close){await close.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[nav(screens.green)]}]);mutated.push(close.id);}}
const collection=figma.variables.createVariableCollection('Presentation / brush size');created.push(collection.id);
const length=figma.variables.createVariable('brush/slider-position',collection,'FLOAT');length.scopes=['WIDTH_HEIGHT'];length.setValueForMode(collection.defaultModeId,52);length.setVariableCodeSyntax('WEB','var(--prototype-brush-slider-position)');created.push(length.id);
const labelVar=figma.variables.createVariable('brush/size-label',collection,'STRING');labelVar.scopes=['TEXT_CONTENT'];labelVar.setValueForMode(collection.defaultModeId,'3 px');labelVar.setVariableCodeSyntax('WEB','var(--prototype-brush-size-label)');created.push(labelVar.id);
const rootIds=[...Object.values(screens),...Object.values(STATE.paired.phones)];
function text(p,name,value,x,y,size=12){const n=figma.createText();p.appendChild(n);created.push(n.id);n.name=name;n.fontName={family:'Noto Sans SC',style:'Regular'};n.fontSize=size;n.lineHeight={unit:'PIXELS',value:18};n.characters=value;n.fills=[paint(ink)];n.x=x;n.y=y;return n;}
function rect(p,name,x,y,w,h,color,opacity=1){const n=figma.createRectangle();p.appendChild(n);created.push(n.id);n.name=name;n.x=x;n.y=y;n.resize(w,h);n.cornerRadius=h/2;n.fills=[paint(color,opacity)];return n;}
for(const id of rootIds){const root=await get(id),slot=root.findOne(n=>n.name==='Tool / live captions');
 for(const row of slot.children){const button=row.findOne(n=>n.name==='Captions / toggle'),knob=button.findOne(n=>n.type==='ELLIPSE'),active=knob.x>25;
  for(const c of [...row.children])if(c!==button){removed.push(c.id);c.remove();}for(const c of [...button.children]){removed.push(c.id);c.remove();}
  row.fills=[paint(active?accent:{r:1,g:1,b:1},active?.15:.32)];row.cornerRadius=22;
  button.name='Captions / button';button.layoutMode='HORIZONTAL';button.primaryAxisSizingMode='FIXED';button.counterAxisSizingMode='FIXED';button.primaryAxisAlignItems='CENTER';button.counterAxisAlignItems='CENTER';button.resize(74.5,56);button.fills=[];
  const ico=figma.createNodeFromSvg(CAPTION_SVG);button.appendChild(ico);created.push(ico.id);ico.name='Icon / live captions';ico.resize(22,22);mutated.push(row.id,button.id);
 }
 for(const t of root.findAll(n=>n.type==='TEXT'&&n.name==='Pen status')){t.characters=t.characters.split(' · ')[0];mutated.push(t.id);}
 const panel=root.findOne(n=>n.name==='Presentation / pen settings');if(!panel)continue;
 panel.y=408;panel.resize(346,256);panel.fills=[paint({r:.98,g:.98,b:.97},.985)];mutated.push(panel.id);
 const colors=panel.findOne(n=>n.name==='Pen / colors');colors.resize(310,48);colors.itemSpacing=14;colors.y=52;mutated.push(colors.id);
 const g=colors.children[0].clone();colors.appendChild(g);created.push(g.id);g.name='Pen color / 绿色';const dot=g.findOne(n=>n.type==='ELLIPSE');dot.fills=[paint(green)];await g.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[nav(screens.green)]}]);
 const selected=root.name.includes('green')?'绿色':root.name.includes('blue')?'蓝色':'橙红';for(const b of colors.children){const selectedHere=b.name.endsWith(selected);b.strokeWeight=selectedHere?2:1;b.strokes=[paint(selectedHere?(selected==='绿色'?green:selected==='蓝色'?{r:.16,g:.49,b:.9}:accent):{r:1,g:1,b:1},selectedHere?1:.9)];mutated.push(b.id);}
 const options=panel.findOne(n=>n.name==='Pen / edit tools');for(const b of [...options.children])if(/px$/.test(b.name)){removed.push(b.id);b.remove();}options.y=192;options.itemSpacing=12;options.resize(310,48);for(const b of options.children){b.resize(149,48);mutated.push(b.id);}mutated.push(options.id);
 text(panel,'Brush size label','笔刷大小',18,112);const value=text(panel,'Brush size value','3 px',284,112);value.setBoundVariable('characters',labelVar);
 const slider=figma.createFrame();panel.appendChild(slider);created.push(slider.id);slider.name='Pen / brush-size slider';slider.x=18;slider.y=134;slider.resize(310,48);slider.fills=[];
 rect(slider,'Brush track',12,23,286,4,ink,.15);const fill=rect(slider,'Brush filled track',12,23,52,4,accent,.8);fill.setBoundVariable('width',length);
 const thumbRow=figma.createAutoLayout('HORIZONTAL');slider.appendChild(thumbRow);created.push(thumbRow.id);thumbRow.name='Brush thumb position';thumbRow.x=2;thumbRow.y=0;thumbRow.resize(310,48);thumbRow.primaryAxisSizingMode='FIXED';thumbRow.counterAxisSizingMode='FIXED';thumbRow.counterAxisAlignItems='CENTER';thumbRow.itemSpacing=0;thumbRow.fills=[];
 const spacer=figma.createFrame();thumbRow.appendChild(spacer);created.push(spacer.id);spacer.name='Brush position spacer';spacer.resize(52,1);spacer.fills=[];spacer.setBoundVariable('width',length);
 const thumb=figma.createEllipse();thumbRow.appendChild(thumb);created.push(thumb.id);thumb.name='Brush thumb';thumb.resize(20,20);thumb.fills=[paint({r:1,g:1,b:1})];thumb.strokes=[paint(accent,.5)];
 const hits=figma.createAutoLayout('HORIZONTAL');slider.appendChild(hits);created.push(hits.id);hits.name='Brush slider / hit areas';hits.resize(310,48);hits.fills=[];hits.itemSpacing=0;
 for(const [size,position]of [[1,1],[3,52],[6,130],[9,208],[12,286]]){const hit=figma.createFrame();hits.appendChild(hit);created.push(hit.id);hit.name='Brush size / '+size+' px';hit.resize(62,48);hit.fills=[];await hit.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'SET_VARIABLE',variableId:length.id,variableValue:{type:'FLOAT',resolvedType:'FLOAT',value:position}},{type:'SET_VARIABLE',variableId:labelVar.id,variableValue:{type:'STRING',resolvedType:'STRING',value:size+' px'}}]}]);}
}
// Brush-size variables supersede the old fixed-thickness boards.
const replacements={[screens.thick]:screens.settings,[screens['ink-thick']]:screens.ink,[screens['drawing-thick']]:screens.drawing};
for(const n of figma.currentPage.findAll(n=>'reactions' in n&&n.reactions.length)){const raw=JSON.stringify(n.reactions);let updated=raw;for(const [a,b]of Object.entries(replacements))updated=updated.split('"'+a+'"').join('"'+b+'"');if(raw!==updated){await n.setReactionsAsync(JSON.parse(updated));mutated.push(n.id);}}
for(const key of ['thick','ink-thick','drawing-thick']){const n=await get(screens[key]);removed.push(n.id);n.remove();delete screens[key];}
let i=0;for(const root of sec.children.filter(n=>n.type==='FRAME')){root.x=30+(i%4)*430;root.y=64+Math.floor(i/4)*920;i++;mutated.push(root.id);}
const missing=[];for(const n of figma.currentPage.findAll(n=>'reactions' in n&&n.reactions.length))for(const r of n.reactions)for(const a of r.actions||[])if(a.destinationId&&!await get(a.destinationId))missing.push({source:n.id,target:a.destinationId});
figma.viewport.scrollAndZoomIntoView([await get('5:9875'),await get('7:5312')]);
return {createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,screens,brushVariables:{position:length.id,label:labelVar.id},missing};
