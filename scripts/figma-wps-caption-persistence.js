
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const get=id=>figma.getNodeByIdAsync(id),created=[],mutated=[];
const collection=figma.variables.createVariableCollection('Presentation / prototype captions');created.push(collection.id);
const on=figma.variables.createVariable('captions/on',collection,'BOOLEAN'),off=figma.variables.createVariable('captions/off',collection,'BOOLEAN');for(const [v,b]of [[on,false],[off,true]]){v.scopes=['ALL_SCOPES'];v.setValueForMode(collection.defaultModeId,b);created.push(v.id);}
on.setVariableCodeSyntax('WEB','var(--prototype-captions-on)');off.setVariableCodeSyntax('WEB','var(--prototype-captions-off)');
const set=value=>[{type:'SET_VARIABLE',variableId:on.id,variableValue:{type:'BOOLEAN',resolvedType:'BOOLEAN',value}},{type:'SET_VARIABLE',variableId:off.id,variableValue:{type:'BOOLEAN',resolvedType:'BOOLEAN',value:!value}}];
const sample=(await get(SCREENS['caption-final'])).findOne(n=>n.name==='Presentation / live captions');
for(const [key,id]of Object.entries(SCREENS)){const root=await get(id),row=root.findOne(n=>n.name==='Presentation / live captions'),toggle=row.findOne(n=>n.name==='Captions / toggle');
 const special=key.startsWith('caption-')||key==='ink-caption'||key==='disconnected'||key==='fullscreen-off';
 if(!special){row.setBoundVariable('visible',off);mutated.push(row.id);const active=sample.clone();root.appendChild(active);active.x=row.x;active.y=row.y;active.name='Presentation / captions enabled';active.setBoundVariable('visible',on);created.push(active.id);const t=active.findOne(n=>n.name==='Captions / toggle');await t.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:set(false)}]);mutated.push(t.id);const panel=root.findOne(n=>n.name==='Presentation / pen settings');if(panel)root.appendChild(panel);}
 if(key!=='disconnected'){const desired=key.startsWith('caption-')&&key!=='caption-error'||key==='ink-caption'?false:true;const reactions=JSON.parse(JSON.stringify(toggle.reactions));for(const r of reactions)r.actions=[...set(desired),...r.actions];await toggle.setReactionsAsync(reactions);mutated.push(toggle.id);}
 const retry=root.findOne(n=>n.name==='Captions / retry');if(retry){const rs=JSON.parse(JSON.stringify(retry.reactions));for(const r of rs)r.actions=[...set(true),...r.actions];await retry.setReactionsAsync(rs);mutated.push(retry.id);}
 for(const n of root.findAll(n=>n.name==='Presentation / app switch'||n.name==='Tool / fullscreen')){const rs=JSON.parse(JSON.stringify(n.reactions));for(const r of rs)r.actions=[...set(false),...r.actions];await n.setReactionsAsync(rs);mutated.push(n.id);}
 if(key==='disconnected'){const vol=root.findOne(n=>n.name==='Presentation / tablet volume');const shield=figma.createFrame();root.appendChild(shield);shield.name='Disabled volume hit shield';shield.x=vol.x;shield.y=vol.y;shield.resize(vol.width,vol.height);shield.fills=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:.001}];created.push(shield.id);const reconnect=root.findOne(n=>n.name==='Presentation / reconnect');const rs=JSON.parse(JSON.stringify(reconnect.reactions));for(const r of rs)r.actions=[...set(false),...r.actions];await reconnect.setReactionsAsync(rs);mutated.push(reconnect.id);const dot=root.findOne(n=>n.type==='ELLIPSE');if(dot){dot.fills=[{type:'SOLID',color:{r:.8,g:.22,b:.18}}];mutated.push(dot.id);}}
}
return {createdNodeIds:created,mutatedNodeIds:mutated,variables:{on:on.id,off:off.id}};
