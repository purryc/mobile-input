// Inputs PAGE and MOTION.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const get=id=>figma.getNodeByIdAsync(id),mutated=[];const m=n=>(mutated.push(n.id),n);
const specs=MOTION?[{pad:'22:6945',draft:'110:5688',row:'22:7020',divider:'22:7019'}]:[{pad:'32:11467',draft:'108:5254',row:'32:11540',divider:'32:11539'},{pad:'98:5331',draft:'98:5299',row:'98:5404',divider:'98:5403',grid:'98:5268'}];
const layouts=[];
for(const spec of specs){
 const pad=await get(spec.pad),panel=pad.parent,draft=await get(spec.draft);panel.appendChild(draft);draft.layoutPositioning='ABSOLUTE';draft.name='Input / transcript and draft';draft.x=22;draft.y=72;draft.resize(346,40);m(draft);
 pad.y=120;pad.resize(346,330);m(pad);
 for(const id of [spec.row,spec.divider,spec.grid].filter(Boolean)){const n=await get(id);n.y-=48;m(n);}
 for(const n of pad.children)if(n.type==='ELLIPSE'){n.y-=48;m(n);}
 layouts.push({pad:pad.id,draft:draft.id,draftGlobalY:panel.y+draft.y,draftHeight:draft.height,padGlobalY:panel.y+pad.y,toggleGlobalY:panel.y+pad.y+12});
 if(MOTION){
  draft.opacity=1;draft.manualKeyframeTracks={OPACITY:{keyframes:[[0,0],[.5,0],[.95,1]].map(([t,v])=>({timelinePosition:t,value:{type:'FLOAT',value:v},easing:{type:'EASE_IN_AND_OUT'}}))}};
  const seed=await get('22:7058');seed.y=120;seed.resize(346,330);for(const n of seed.children){n.y*=330/378;n.resize(n.width,n.height*330/378);m(n);}m(seed);
  for(const n of [pad,seed]){const tracks=JSON.parse(JSON.stringify(n.manualKeyframeTracks));for(const k of tracks.TRANSLATION_Y.keyframes)k.value.value*=133/157;for(const k of tracks.SCALE_XY.keyframes)if(k.timelinePosition<=.35)k.value.value.y*=378/330;n.manualKeyframeTracks=tracks;}
 }
}
return {mutatedNodeIds:[...new Set(mutated)],layouts};
