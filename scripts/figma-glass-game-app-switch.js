await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const source=await figma.getNodeByIdAsync('53:5341');
const roots=figma.currentPage.findAll(n=>n.type==='FRAME'&&n.parent.type==='SECTION'&&n.name.startsWith('game'));
const created=[],mutated=[],entries=[];
for(const root of roots){
 let button=root.children.find(n=>n.name==='Game / app switch');
 if(!button){button=source.clone();root.appendChild(button);created.push(button.id,...button.findAll(()=>true).map(n=>n.id));}
 button.name='Game / app switch';button.resize(48,48);button.x=772;button.y=18;button.cornerRadius=24;button.fills=[{type:'SOLID',color:{r:1,g:.98,b:.93},opacity:.38}];button.strokes=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.8}];button.strokeWeight=1;
 for(const n of button.children)if(n.type==='INSTANCE')n.resize(22,22);
 await button.setReactionsAsync(source.reactions);mutated.push(button.id);
 entries.push({root:root.id,name:root.name,button:button.id,x:button.x,y:button.y,w:button.width,h:button.height,destination:button.reactions[0].actions[0].destinationId});
}
return {createdNodeIds:created,mutatedNodeIds:mutated,entries,destinationExists:!!(await figma.getNodeByIdAsync('5:11016'))};
