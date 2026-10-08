// Inputs: PAGE_ID, APP_ICON. Move trackpad beside keyboard; preserve each state's existing guarded navigation.
const p=await figma.getNodeByIdAsync(PAGE_ID);await figma.setCurrentPageAsync(p);
const rows=p.findAll(n=>n.type==='FRAME'&&n.name==='Input / voice and keyboard');
const fonts=new Map();for(const t of p.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))fonts.set(JSON.stringify(s.fontName),s.fontName);for(const f of fonts.values())await figma.loadFontAsync(f);
const circle=await figma.getNodeByIdAsync('4:465');const created=[],mutated=[],changes=[];
for(const row of rows){
 const host=row.parent.parent,toolbar=host.findOne(n=>n.name==='Input / Fixed tools');
 if(!toolbar)continue;const tool=toolbar.children[5];const previous=PAGE_ID==='0:1'?(tool.reactions||[]):[];
 const scale=row.width/346;const kb=row.children[0],voice=row.children.find(n=>n.name==='Input / Voice');
 let tp=row.children.find(n=>n.name==='Input / Trackpad');
 if(!tp){tp=circle.createInstance();tp.name='Input / Trackpad';const pk=Object.keys(tp.componentProperties).find(k=>k.startsWith('Icon#'));tp.setProperties({[pk]:'4:73'});if(scale!==1)tp.rescale(scale);row.insertChild(1,tp);created.push(tp.id,...tp.findAll(()=>true).map(n=>n.id));await tp.setReactionsAsync(previous);}
 if(voice)voice.resize(166*scale,58*scale);row.itemSpacing=8*scale;
 const keys=Object.keys(tool.componentProperties);tool.setProperties({[keys.find(k=>k.startsWith('Label#'))]:'切换应用',[keys.find(k=>k.startsWith('Icon#'))]:APP_ICON});tool.name='tool/AppSwitch';
 const header=host.findOne(n=>n.name==='Context / active application');const guarded=['wechat-record','wechat-disconnect'].includes(host.name);
 const reactions=guarded||PAGE_ID!=='0:1'?[]:header?.reactions||[];
 await tool.setReactionsAsync(reactions);
 if(guarded)tool.opacity=.42;
 mutated.push(row.id,voice.id,tool.id);
 changes.push({screen:host.name,trackpad:tp.id,appSwitch:tool.id,order:row.children.map(n=>n.name),width:row.children.reduce((sum,n)=>sum+n.width,0)+row.itemSpacing*(row.children.length-1),container:row.width,trackpadNextToKeyboard:row.children[1].id===tp.id});
}
for(const t of p.findAllWithCriteria({types:['TEXT']})){
if(t.characters.includes('剪贴板、复制、粘贴、撤销、重做、触控板')){t.characters=t.characters.replace('剪贴板、复制、粘贴、撤销、重做、触控板','剪贴板、复制、粘贴、撤销、重做、切换应用');mutated.push(t.id);}
if(t.characters.includes('文本框与键盘／语音／发送位置')){t.characters=t.characters.replace('文本框与键盘／语音／发送位置','文本框与键盘／触控板／语音／发送位置');mutated.push(t.id);}
}
return {createdNodeIds:created,mutatedNodeIds:mutated,changes,updated:rows.length,fit:changes.every(c=>Math.abs(c.width-c.container)<.1)};

