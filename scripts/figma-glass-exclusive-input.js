await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const changed=[],get=id=>figma.getNodeByIdAsync(id),m=n=>(changed.push(n.id),n);
const touch=await get('32:11467'),keyboard=await get('98:5331');
for(const pad of [touch,keyboard]){pad.name='Input / mode surface';m(pad);}
const touchRow=await get('32:11540');touchRow.name='Input / primary controls';m(touchRow);
const row=keyboard.children.find(n=>n.name==='Keyboard / voice and send');row.name='Input / primary controls';row.y=116;row.resize(346,48);m(row);
const voice=await get('98:5409');voice.resize(48,48);voice.cornerRadius=24;m(voice);
const send=await get('98:5302');send.resize(48,48);send.x=298;send.y=0;m(send);
const grid=await get('98:5268');grid.y=174;m(grid);
const divider=keyboard.children.find(n=>n.name==='Trackpad / button divider');divider.y=169;m(divider);
for(const id of ['93:5323','98:5409']){const n=await get(id);n.name='Input / voice';m(n);}
for(const id of ['93:5302','98:5415']){const n=await get(id);n.name='Input / keyboard option';m(n);}
for(const id of ['97:5264','98:5417']){const n=await get(id);n.name='Input / trackpad option';m(n);}
const evidence=[];
for(const [id,mode]of [['5:7769','trackpad'],['5:7589','keyboard']]){const root=await get(id);const pad=mode==='trackpad'?touch:keyboard;const visible=n=>{let c=n;while(c&&c!==root){if('visible'in c&&!c.visible)return false;c=c.parent;}return true;};evidence.push({root:id,mode,pad:{x:pad.x,y:pad.y,w:pad.width,h:pad.height},keyboardCount:root.findAll(n=>n.name==='Keyboard / QWERTY'&&visible(n)).length,mouseButtonCount:root.findAll(n=>n.name.includes('blank mouse key')&&visible(n)).length});}
return {mutatedNodeIds:[...new Set(changed)],states:evidence,keyboardLayout:{draftY:keyboard.parent.y+keyboard.y+(await get('98:5299')).y,controlsY:keyboard.parent.y+keyboard.y+row.y,keyboardY:keyboard.parent.y+keyboard.y+grid.y,keyboardBottom:keyboard.parent.y+keyboard.y+grid.y+Math.max(...grid.children.map(n=>n.y+n.height))},links:{toKeyboard:(await get('93:5302')).reactions,toTrackpad:(await get('98:5417')).reactions}};
