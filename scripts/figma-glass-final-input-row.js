await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const get=id=>figma.getNodeByIdAsync(id),created=[],mutated=[],removed=[];const m=n=>(mutated.push(n.id),n);
const row=await get('98:5404'),voice=await get('98:5409'),send=await get('98:5302'),space=await get('98:5298'),grid=await get('98:5268');
row.insertChild(1,space);send.layoutPositioning='AUTO';row.itemSpacing=8;row.primaryAxisAlignItems='CENTER';row.counterAxisAlignItems='CENTER';space.resize(214,58);send.resize(58,58);voice.resize(58,58);m(row);m(space);m(send);m(voice);
grid.itemSpacing=8;grid.resize(346,190);grid.primaryAxisSizingMode='FIXED';
for(const keyRow of grid.children){keyRow.resize(keyRow.width,58);m(keyRow);for(const key of keyRow.children){key.resize(key.width,58);m(key);}}m(grid);
const pad=await get('32:11467');const draft=(await get('98:5299')).clone();pad.appendChild(draft);draft.name='Input / transcript and draft';draft.x=12;draft.y=68;created.push(draft.id,...draft.findAll(()=>true).map(n=>n.id));
let i=0;for(const n of pad.children)if(n.type==='ELLIPSE'){n.y=132+Math.floor(i/10)*32;n.visible=n.y<305;i++;m(n);}
// Obsolete hidden containers are not used by any live state.
const obsolete=['5:7794','32:11538','32:11541','32:11542','32:11565','32:11570','52:5307','98:5328','98:5402','98:5418','98:5419','98:5420'];
for(const id of obsolete){const n=await get(id);if(n){removed.push(n.id);n.remove();}}
for(const rootId of ['5:7589','5:7769']){const root=await get(rootId);for(const n of root.findAll(n=>n.type==='TEXT'&&!n.visible)){if(n.parent.type!=='INSTANCE'){removed.push(n.id);n.remove();}}}
return {createdNodeIds:created,mutatedNodeIds:[...new Set(mutated)],removedNodeIds:removed,trackpadDraft:draft.id,keyboardRow:row.children.map(n=>({id:n.id,name:n.name,x:n.x,y:n.y,w:n.width,h:n.height})),keyboardEnd:grid.y+Math.max(...grid.children.map(n=>n.y+n.height))};
