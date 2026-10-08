await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const root=await figma.getNodeByIdAsync('5:7589'),source=await figma.getNodeByIdAsync('5:7769');
const old=[...root.children],created=[],removed=[],mutated=[root.id];
const grid=(await figma.getNodeByIdAsync('5:7697')).clone(),draft=(await figma.getNodeByIdAsync('5:7694')).clone(),send=(await figma.getNodeByIdAsync('5:7684')).clone();
for(const child of source.children){if(child.visible){const n=child.clone();root.appendChild(n);created.push(n.id);}}
const panel=root.children.find(n=>!old.includes(n)&&n.name==='Input / bottom section');
const pad=panel.children.find(n=>n.name==='Trackpad / bottom input surface');pad.name='Keyboard / input surface';
for(const n of pad.children){if(n.type==='ELLIPSE'){removed.push(n.id);n.remove();}}
const toggle=pad.children.find(n=>n.name==='Input / keyboard-trackpad toggle');
const key=toggle.children[0],track=toggle.children[1];key.name='Input / keyboard selected';key.fills=[{type:'SOLID',color:{r:.03,g:.54,b:.35},opacity:.13}];await key.setReactionsAsync([]);track.name='Input / trackpad entry';track.fills=[];track.strokes=[];await track.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:'5:7769',navigation:'NAVIGATE',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_IN_AND_OUT'},duration:.32}}]}]);
pad.appendChild(draft);draft.x=12;draft.y=68;draft.resize(322,40);draft.cornerRadius=16;
for(const n of draft.children){if(n.type==='TEXT'){if(n.characters==='草稿')n.visible=false;else{n.x=12;n.y=8;n.fontSize=14;n.resize(298,24);}}}
pad.appendChild(grid);grid.x=0;grid.y=118;
const buttons=pad.children.find(n=>n.name==='Trackpad / mouse buttons');buttons.name='Keyboard / voice and send';
for(const n of [...buttons.children]){if(n.name!=='Trackpad / voice entry'){removed.push(n.id);n.remove();}}
const voice=buttons.children[0];voice.name='Keyboard / voice entry';buttons.primaryAxisAlignItems='CENTER';
buttons.appendChild(send);send.layoutPositioning='ABSOLUTE';send.x=294;send.y=3;
for(const n of old){removed.push(n.id);n.remove();}
created.push(grid.id,draft.id,send.id,...root.findAll(()=>true).map(n=>n.id));
const tools=panel.children.find(n=>n.name==='Input / compact editing tools');
return {root:root.id,createdNodeIds:[...new Set(created)],removedNodeIds:removed,mutatedNodeIds:mutated,hotspots:{keyboard:key.id,trackpad:track.id,voice:voice.id,send:send.id,draft:draft.id,toolbar:tools.id,surface:pad.id,toggle:toggle.id,status:root.children.find(n=>n.name==='Status / Unified connection and app').id,...Object.fromEntries(tools.children.map(n=>[n.name,n.id]))},switchReactions:track.reactions};
