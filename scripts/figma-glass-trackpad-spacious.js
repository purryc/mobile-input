// Inputs PAGE, MOTION. In-place revision of the existing trackpad destination.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const ids=MOTION?{root:'22:6772',panel:'29:8512',pad:'22:6945',tools:'52:5771',footer:'52:5769',bg:'52:5770',row:'22:6786',key:'22:6787',voice:'22:6789',buttons:'22:7020',divider:'22:7019',pointer:'22:7016',title:'22:6927',close:'22:6932'}:{root:'5:7769',panel:'29:9738',pad:'32:11467',tools:'52:5309',footer:'52:5307',bg:'52:5308',row:'5:7840',key:'5:7841',voice:'5:7857',buttons:'32:11540',divider:'32:11539',pointer:'32:11538',title:'32:11565',close:'32:11570'};
const created=[],mutated=[];const m=n=>(mutated.push(n.id),n);const get=id=>figma.getNodeByIdAsync(id);
const panel=await get(ids.panel),pad=await get(ids.pad),tools=await get(ids.tools),footer=await get(ids.footer),row=await get(ids.row);
panel.appendChild(tools);tools.layoutPositioning='ABSOLUTE';tools.x=22;tools.y=16;tools.cornerRadius=24;tools.fills=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.2}];m(tools);
footer.layoutMode='NONE';row.x=0;row.y=58;m(footer);m(row);(await get(ids.bg)).visible=false;m(await get(ids.bg));
pad.y=72;pad.resize(346,266);pad.cornerRadius=26;m(pad);
for(const c of pad.children){if(c.type==='ELLIPSE'){c.visible=c.y<=192;m(c);}}
for(const id of [ids.pointer,ids.title,ids.close]){const n=await get(id);n.visible=false;m(n);}
const divider=await get(ids.divider);divider.x=12;divider.y=201;divider.resize(322,1);m(divider);
const buttons=await get(ids.buttons);buttons.x=0;buttons.y=208;buttons.resize(346,58);buttons.itemSpacing=10;buttons.primaryAxisSizingMode='FIXED';buttons.counterAxisSizingMode='FIXED';m(buttons);
for(const c of buttons.children){c.visible=false;m(c);}
const hotspots={};
for(const side of ['left','right']){
 const half=figma.createAutoLayout('HORIZONTAL');half.name='Trackpad / '+side+' blank mouse key';half.resize(168,58);half.primaryAxisSizingMode='FIXED';half.counterAxisSizingMode='FIXED';half.counterAxisAlignItems='CENTER';half.fills=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.28}];half.strokes=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.66}];half.strokeWeight=1;half.cornerRadius=22;half.itemSpacing=0;buttons.appendChild(half);created.push(half.id);
 const source=await get(side==='left'?ids.key:ids.voice);let control=source.clone();half.appendChild(control);control=control.detachInstance();control.name=side==='left'?'Trackpad / keyboard entry':'Trackpad / voice entry';control.resize(48,58);control.primaryAxisSizingMode='FIXED';control.counterAxisSizingMode='FIXED';control.primaryAxisAlignItems='CENTER';control.counterAxisAlignItems='CENTER';control.paddingLeft=0;control.paddingRight=0;control.paddingTop=0;control.paddingBottom=0;control.itemSpacing=0;control.fills=[];control.strokes=[];control.effects=[];control.manualKeyframeTracks={};
 for(const c of control.children){if(c.type==='TEXT')c.visible=false;if(c.type==='INSTANCE')c.resize(22,22);}
 created.push(control.id,...control.findAll(()=>true).map(n=>n.id));hotspots[side==='left'?'keyboard':'voice']=control.id;
 const blank=figma.createAutoLayout('HORIZONTAL');blank.name='Trackpad / '+side+' click area';blank.resize(120,58);blank.primaryAxisSizingMode='FIXED';blank.counterAxisSizingMode='FIXED';blank.fills=[];half.appendChild(blank);created.push(blank.id);hotspots[side+'Click']=blank.id;
 if(side==='right')half.insertChild(0,blank);
}
const anim=(n,values)=>{n.manualKeyframeTracks={OPACITY:{keyframes:values.map(([t,v])=>({timelinePosition:t,value:{type:'FLOAT',value:v},easing:{type:'EASE_IN_AND_OUT'}}))}};};
if(MOTION){
 row.opacity=0;anim(row,[[0,1],[.28,1],[.6,0]]);m(row);
 for(const n of [pad,await get('22:7058')]){const tracks=JSON.parse(JSON.stringify(n.manualKeyframeTracks));for(const k of tracks.TRANSLATION_Y.keyframes)k.value.value*=101/195;for(const k of tracks.SCALE_XY.keyframes){if(k.timelinePosition<=.35)k.value.value.y*=190/266;}n.manualKeyframeTracks=tracks;m(n);}
 const seed=await get('22:7058');seed.y=72;seed.resize(346,266);for(const n of seed.children){n.y*=266/190;n.resize(n.width,n.height*266/190);m(n);}m(seed);
}else{footer.visible=false;m(footer);}
return {createdNodeIds:created,mutatedNodeIds:[...new Set(mutated)],root:ids.root,hotspots,pad:{id:pad.id,x:pad.x,y:panel.y+pad.y,width:pad.width,height:pad.height,gestureHeight:201},toolsY:panel.y+tools.y,buttonsY:panel.y+pad.y+buttons.y,tools:tools.children.map(n=>({id:n.id,width:n.width,height:n.height,reactions:n.reactions})),entryReactions:await Promise.all(Object.entries(hotspots).filter(([k])=>k==='keyboard'||k==='voice').map(async([key,id])=>({key,id,reactions:(await get(id)).reactions})))};
