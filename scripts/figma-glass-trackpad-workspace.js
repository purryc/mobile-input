// Inputs PAGE and MOTION. Revise existing roots only.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const ids=MOTION?{root:'22:6772',base:'22:6773',title:'22:6781',quote:'22:6791',label:'22:6792',replies:['22:6793','22:6794'],panel:'29:8512',bg:'29:8513',pad:'22:6945',divider:'22:7019',buttons:'22:7020',left:'93:5772',right:'93:5798',key:'93:5785',voice:'93:5806',leftHit:'93:5797',rightHit:'93:5813',track:'22:6788'}:{root:'5:7769',base:'5:7769',title:'5:7791',quote:'32:11451',label:'32:11456',replies:['32:11457','32:11462'],panel:'29:9738',bg:'29:9739',pad:'32:11467',divider:'32:11539',buttons:'32:11540',left:'93:5289',right:'93:5315',key:'93:5302',voice:'93:5323',leftHit:'93:5314',rightHit:'93:5330',track:'19:7409'};
const created=[],mutated=[];const get=id=>figma.getNodeByIdAsync(id);const m=n=>(mutated.push(n.id),n);
const title=await get(ids.title);title.fontSize=20;title.lineHeight={unit:'PIXELS',value:28};title.y=74;m(title);
const quote=await get(ids.quote);quote.y=108;m(quote);const label=await get(ids.label);label.y=212;m(label);
for(let i=0;i<2;i++){const n=await get(ids.replies[i]);n.y=240+i*56;n.resize(346,48);m(n);}
const panel=await get(ids.panel),bg=await get(ids.bg),pad=await get(ids.pad);panel.y=362;panel.resize(390,482);bg.resize(390,482);pad.resize(346,378);m(panel);m(bg);m(pad);
const divider=await get(ids.divider);divider.y=313;m(divider);
const buttons=await get(ids.buttons);buttons.y=320;buttons.itemSpacing=10;buttons.resize(346,58);m(buttons);
const left=await get(ids.left),right=await get(ids.right),key=await get(ids.key),voice=await get(ids.voice);
buttons.insertChild(buttons.children.indexOf(right),voice);voice.resize(58,58);voice.cornerRadius=29;voice.fills=[{type:'SOLID',color:{r:.03,g:.6,b:.4},opacity:.13},{type:'SOLID',color:{r:1,g:1,b:1},opacity:.32}];voice.strokes=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.85}];voice.strokeWeight=1;m(voice);
for(const n of [left,right]){n.resize(134,58);n.cornerRadius=20;m(n);}
for(const id of [ids.leftHit,ids.rightHit]){const n=await get(id);n.resize(134,58);m(n);}
const toggle=figma.createAutoLayout('HORIZONTAL');toggle.name='Input / keyboard-trackpad toggle';pad.appendChild(toggle);toggle.resize(104,48);toggle.primaryAxisSizingMode='FIXED';toggle.counterAxisSizingMode='FIXED';toggle.itemSpacing=4;toggle.paddingLeft=2;toggle.paddingRight=2;toggle.cornerRadius=24;toggle.fills=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.35}];toggle.x=12;toggle.y=12;created.push(toggle.id);
toggle.appendChild(key);key.resize(48,48);key.cornerRadius=22;m(key);
const track=(await get(ids.track)).clone();toggle.appendChild(track);track.visible=true;track.opacity=1;track.resize(48,48);track.fills=[{type:'SOLID',color:{r:.03,g:.54,b:.35},opacity:.13}];track.strokes=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.8}];track.effects=[];track.manualKeyframeTracks={};await track.setReactionsAsync([]);created.push(track.id);track.name='Input / trackpad selected';
let dotIndex=0;for(const n of pad.children){if(n.type==='ELLIPSE'){n.y=84+Math.floor(dotIndex/10)*32;n.visible=true;m(n);dotIndex++;}}
if(MOTION){
 const tracks=JSON.parse(JSON.stringify(bg.manualKeyframeTracks));for(const k of tracks.SCALE_XY.keyframes)k.value.value.y=k.timelinePosition<.3?252/482:k.value.value.y===1?1:k.value.value.y;for(const k of tracks.TRANSLATION_Y.keyframes)k.value.value*=115/59;bg.manualKeyframeTracks=tracks;m(bg);
 // Preserve the original input row at screen y=754 while the expanded panel moves upward.
 const footer=await get('52:5769');footer.y+=112;m(footer);const oldZone=await get('22:6783');oldZone.y+=112;m(oldZone);
 const trail=await get('22:7089');trail.y+=112;m(trail);
 for(const n of [pad,await get('22:7058')]){const t=JSON.parse(JSON.stringify(n.manualKeyframeTracks));for(const k of t.TRANSLATION_Y.keyframes)k.value.value*=157/101;for(const k of t.SCALE_XY.keyframes)if(k.timelinePosition<=.35)k.value.value.y*=266/378;n.manualKeyframeTracks=t;m(n);}
 const seed=await get('22:7058');seed.resize(346,378);for(const n of seed.children){n.y*=378/266;n.resize(n.width,n.height*378/266);m(n);}m(seed);
}
return {createdNodeIds:created,mutatedNodeIds:[...new Set(mutated)],root:ids.root,toggle:toggle.id,keyboard:key.id,trackpad:track.id,voice:voice.id,panelY:panel.y,pad:{id:pad.id,width:pad.width,height:pad.height,globalY:panel.y+pad.y},buttons:buttons.children.filter(n=>n.visible).map(n=>({id:n.id,name:n.name,x:n.x,y:n.y,width:n.width,height:n.height}))};
