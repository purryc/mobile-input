// Inputs: PAGE, MOTION. Update the latest trackpad without adding another view.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const ids=MOTION?{root:'22:6772',panel:'29:8512',toolbar:'22:6784',row:'22:6786',pad:'22:6945',title:'22:6927',close:'22:6932'}:{root:'5:7769',panel:'29:9738',toolbar:'5:7795',row:'5:7840',pad:'32:11467',title:'32:11565',close:'32:11570'};
const created=[],mutated=[],toolsMap={};const m=n=>(mutated.push(n.id),n);
const get=id=>figma.getNodeByIdAsync(id);
const panel=await get(ids.panel),old=await get(ids.toolbar),row=await get(ids.row),pad=await get(ids.pad);
const footer=figma.createAutoLayout();footer.name='Input / unified compact footer';footer.layoutMode='VERTICAL';footer.itemSpacing=10;footer.resize(346,116);footer.primaryAxisSizingMode='FIXED';footer.counterAxisSizingMode='FIXED';footer.fills=[];footer.clipsContent=false;panel.appendChild(footer);footer.layoutPositioning='ABSOLUTE';footer.x=22;footer.y=222;created.push(footer.id);
const bg=figma.createRectangle();bg.name='Input / footer shared glass';footer.appendChild(bg);bg.layoutPositioning='ABSOLUTE';bg.resize(346,116);bg.x=0;bg.y=0;bg.cornerRadius=28;bg.fills=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.22}];bg.strokes=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.65}];bg.strokeWeight=1;created.push(bg.id);
const compact=figma.createAutoLayout();compact.name='Input / compact editing tools';compact.layoutMode='HORIZONTAL';compact.itemSpacing=8;compact.paddingLeft=9;compact.paddingRight=9;compact.counterAxisAlignItems='CENTER';compact.resize(346,48);compact.primaryAxisSizingMode='FIXED';compact.counterAxisSizingMode='FIXED';compact.fills=[];footer.appendChild(compact);created.push(compact.id);
for(const src of old.children){let n=src.clone();compact.appendChild(n);n=n.detachInstance();n.resize(48,48);n.primaryAxisAlignItems='CENTER';n.counterAxisAlignItems='CENTER';n.paddingTop=0;n.paddingBottom=0;n.paddingLeft=0;n.paddingRight=0;n.itemSpacing=0;n.fills=[];n.strokes=[];n.effects=[];for(const t of n.children){if(t.type==='TEXT')t.visible=false;else if(t.type==='INSTANCE')t.resize(18,18);mutated.push(t.id);}created.push(n.id);toolsMap[n.name]=n.id;}
footer.appendChild(row);row.x=0;row.y=58;m(row);
pad.y=16;pad.resize(346,190);m(pad);for(const n of pad.children){if(n.type==='ELLIPSE'){n.visible=n.y<=96;m(n);}if(n.name==='Trackpad / button divider'){n.y=131;m(n);}if(n.name==='Trackpad / mouse buttons'){n.y=138;m(n);}if(n.type==='INSTANCE'&&n.width===24){n.y=58;m(n);}}
const title=await get(ids.title),close=await get(ids.close);title.y=26;close.y=20;m(title);m(close);
const anim=(n,tracks)=>{n.manualKeyframeTracks=Object.fromEntries(Object.entries(tracks).map(([k,values])=>[k,{keyframes:values.map(([t,v])=>({timelinePosition:t,value:{type:typeof v==='number'?'FLOAT':'VECTOR',value:v},easing:{type:'EASE_IN_AND_OUT'}}))}]));m(n);};
if(MOTION){old.visible=true;old.opacity=0;anim(old,{OPACITY:[[0,1],[.28,1],[.53,0]],TRANSLATION_Y:[[0,118],[1.2,118]]});anim(compact,{OPACITY:[[0,0],[.5,0],[.92,1]]});anim(bg,{OPACITY:[[0,0],[.5,0],[.92,1]]});compact.opacity=1;bg.opacity=1;
 for(const n of [pad,await get('22:7058')]){const tracks=JSON.parse(JSON.stringify(n.manualKeyframeTracks));const yy=tracks.TRANSLATION_Y;if(yy){const start=yy.keyframes[0].value.value;for(const k of yy.keyframes)k.value.value=start?k.value.value*195/start:0;n.manualKeyframeTracks=tracks;m(n);}}
 const seed=await get('22:7058');seed.y=16;seed.resize(346,190);for(const n of seed.children){n.y*=190/160;n.resize(n.width,n.height*190/160);m(n);}m(seed);
}else{old.visible=false;m(old);}
return {createdNodeIds:created,mutatedNodeIds:[...new Set(mutated)],root:ids.root,footer:footer.id,compact:compact.id,toolsMap,padSize:[pad.width,pad.height],footerGlobalY:panel.y+footer.y,rowGlobalY:panel.y+footer.y+row.y};
