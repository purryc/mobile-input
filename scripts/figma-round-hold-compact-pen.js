// Scoped Figma revision: large circular hold, three-row square settings, no recording cancel.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const get=id=>figma.getNodeByIdAsync(id), changed=[],created=[],removed=[];
const touch=n=>(changed.push(n.id),n);
for(const id of ['5:10065','178:2678','178:2663']){
 const root=await get(id);for(const t of root.findAll(n=>n.type==='TEXT'))for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);
}
const hold=touch(await get('142:5447'));hold.x=202;hold.y=577;hold.resize(166,166);
for(const id of ['178:2667','178:2674']){
 const v=touch(await get(id));v.resize(166,166);v.cornerRadius=83;v.layoutMode='VERTICAL';v.primaryAxisSizingMode='FIXED';v.counterAxisSizingMode='FIXED';v.primaryAxisAlignItems='CENTER';v.counterAxisAlignItems='CENTER';v.itemSpacing=12;v.paddingLeft=0;v.paddingRight=0;v.paddingTop=0;v.paddingBottom=0;
 for(const c of v.children){touch(c);if(c.type==='INSTANCE')c.resize(30,30);if(c.type==='TEXT'){c.fontSize=16;c.lineHeight={unit:'PIXELS',value:24};}}
}
const instance=touch(await get('178:2682'));instance.resize(166,166);instance.x=0;instance.y=0;
const panel=touch(await get('163:6188'));panel.x=22;panel.y=576;panel.resize(168,168);panel.cornerRadius=24;
const colors=touch(await get('163:6192'));colors.x=8;colors.y=8;colors.resize(152,40);colors.layoutMode='HORIZONTAL';colors.primaryAxisSizingMode='FIXED';colors.counterAxisSizingMode='FIXED';colors.itemSpacing=0;colors.primaryAxisAlignItems='CENTER';colors.counterAxisAlignItems='CENTER';colors.paddingLeft=0;colors.paddingRight=0;
for(const b of colors.children){touch(b);b.resize(30.4,40);b.cornerRadius=15;for(const c of b.children){touch(c);c.resize(18,18);c.x=6.2;c.y=11;}}
const slider=touch(await get('163:6212'));panel.appendChild(slider);slider.layoutPositioning='AUTO';slider.x=8;slider.y=56;slider.resize(152,48);
const track=touch(await get('163:6213'));track.resize(132,4);
const thumbRow=touch(await get('163:6215'));thumbRow.resize(152,32);
const value=touch(await get('163:6211'));value.x=123;
const hitRow=touch(await get('163:6218'));hitRow.resize(152,48);
const collection=figma.variables.createVariableCollection('WPS / compact pen controls');created.push(collection.id);
const position=figma.variables.createVariable('brush/compact-position',collection,'FLOAT');position.scopes=['WIDTH_HEIGHT'];position.setValueForMode(collection.defaultModeId,24);created.push(position.id);
for(const id of ['163:6214','163:6216']){const n=touch(await get(id));n.setBoundVariable('width',position);}
for(const [i,b] of hitRow.children.entries()){
 touch(b);b.resize(38,48);b.x=38*i;
 const rr=JSON.parse(JSON.stringify(b.reactions));for(const r of rr){delete r.action;for(const a of r.actions)if(a.type==='SET_VARIABLE'&&a.variableId==='VariableID:160:6572'){a.variableId=position.id;a.variableValue.value=[1,36,84,132][i];}}
 await b.setReactionsAsync(rr);
}
for(const [i,b]of colors.children.entries()){const strokes=JSON.parse(JSON.stringify(b.strokes));b.fills=[];b.strokes=[];if(i===0){const ring=figma.createEllipse();b.appendChild(ring);ring.name='Selected color ring';ring.resize(28,28);ring.layoutPositioning='ABSOLUTE';ring.x=1.2;ring.y=6;ring.fills=[];ring.strokes=strokes;ring.strokeWeight=1.5;created.push(ring.id);}}
const editRow=touch(await get('163:6224'));editRow.x=8;editRow.y=112;editRow.resize(152,48);editRow.layoutMode='HORIZONTAL';editRow.primaryAxisSizingMode='FIXED';editRow.counterAxisSizingMode='FIXED';editRow.primaryAxisAlignItems='CENTER';editRow.counterAxisAlignItems='CENTER';editRow.itemSpacing=12;editRow.paddingLeft=0;editRow.paddingRight=0;
touch(await get('163:6207')).name='Pen / 橡皮';
const notes=touch(await get('142:5381'));notes.resize(346,360);touch(await get('142:5383')).resize(310,286);touch(await get('142:5385')).y=512;
const set=touch(await get('178:2678'));set.resize(760,198);
const detail=touch(await get('178:2663'));detail.resizeWithoutConstraints(1760,380);
const rule=detail.findOne(n=>n.type==='TEXT'&&n.name==='Press rules');touch(rule).y=294;
touch(await get('109:5269')).resizeWithoutConstraints(1840,2724);
const cancel=await get('173:4964');if(cancel){removed.push(cancel.id,...cancel.findAll(()=>true).map(n=>n.id));cancel.remove();}
return {createdNodeIds:created,mutatedNodeIds:[...new Set(changed)],removedNodeIds:removed,hold:{diameter:166,container:hold.id,instance:instance.id},settings:{id:panel.id,width:panel.width,height:panel.height},voiceCancelRemoved:true};
