// Scoped replay of final interaction corrections; requires the saved 2026-10-08 node ledger.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const changed = [];
const get = id => figma.getNodeByIdAsync(id);
const action = (variableId, type, value) => ({type:'SET_VARIABLE', variableId, variableValue:{type,resolvedType:type,value}});
for (const id of ['178:2425','178:2435','178:2457']) {
  const node = await get(id), reactions = JSON.parse(JSON.stringify(node.reactions));
  for (const reaction of reactions) { delete reaction.action; for (const a of reaction.actions) if(a.type==='NODE') a.transition=null; }
  await node.setReactionsAsync(reactions); changed.push(id);
}
for (const id of ['183:2450','183:2507']) {
  const node=await get(id); node.layoutPositioning='ABSOLUTE'; node.x=3; node.y=8; changed.push(id);
}
for (const id of ['173:4837','173:5137']) {
  const node=await get(id), reactions=JSON.parse(JSON.stringify(node.reactions));
  for (const r of reactions) { delete r.action; r.actions=r.actions.filter(a=>a.variableId!=='VariableID:178:2415'); r.actions.unshift(action('VariableID:178:2415','STRING','松开结束')); }
  await node.setReactionsAsync(reactions); changed.push(id);
}
const send=await get('173:4991');send.opacity=.3;await send.setReactionsAsync([]);changed.push(send.id);
for (const id of ['173:4800','173:5091']) {
  const node=await get(id), reactions=JSON.parse(JSON.stringify(node.reactions));
  for(const r of reactions){delete r.action; const a=r.actions.find(a=>a.type==='SET_VARIABLE'&&a.variableId==='VariableID:173:4708'); if(a){r.actions=r.actions.filter(a=>a.variableId!=='VariableID:173:4712');r.actions.push({...a,variableId:'VariableID:173:4712'});}}
  await node.setReactionsAsync(reactions);changed.push(id);
}
const pressed=await get('178:2674');
for(const n of pressed.findAll(n=>n.type==='VECTOR')) { if(n.fills.length)n.fills=[{type:'SOLID',color:{r:1,g:1,b:1}}];if(n.strokes.length)n.strokes=[{type:'SOLID',color:{r:1,g:1,b:1}}];changed.push(n.id); }
return {mutatedNodeIds:changed};
