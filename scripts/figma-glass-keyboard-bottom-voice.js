await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const get=id=>figma.getNodeByIdAsync(id),mutated=[];
const row=await get('98:5404');row.y=320;row.resize(346,58);mutated.push(row.id);
const voice=await get('98:5409');voice.resize(58,58);voice.cornerRadius=29;mutated.push(voice.id);
const send=await get('98:5302');send.resize(52,52);send.x=294;send.y=3;mutated.push(send.id);
const grid=await get('98:5268');grid.y=118;grid.itemSpacing=6;mutated.push(grid.id);for(let i=0;i<grid.children.length;i++){grid.children[i].y=i*50;mutated.push(grid.children[i].id);}
const divider=await get('98:5403');divider.y=313;mutated.push(divider.id);
const original=await get('93:5323');
const bounds=n=>{const root=n.id==='93:5323'?'5:7769':'5:7589';let x=0,y=0,c=n;while(c&&c.id!==root){x+=c.x;y+=c.y;c=c.parent;}return {x,y,width:n.width,height:n.height};};
return {mutatedNodeIds:mutated,keyboardVoice:bounds(voice),trackpadVoice:bounds(original),voiceReaction:voice.reactions,keyboardLocalY:grid.y,keyboardContentBottom:grid.y+Math.max(...grid.children.map(n=>n.y+n.height)),controlsLocalY:row.y};
