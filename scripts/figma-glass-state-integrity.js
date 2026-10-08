// Inputs: L, S. Prototype-only state variables keep previews and resulting states consistent.
const page=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(page);
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:L.font,style});
const collection=figma.variables.createVariableCollection('Prototype / Context');
function variable(name,value){const v=figma.variables.createVariable(name,collection,'STRING');v.setValueForMode(collection.defaultModeId,value);return v;}
const draft=variable('handoff-draft','输入回复…'),formula=variable('sheet-result','=SUM(C2:C8)\n¥ 128,600'),word=variable('word-result','整合团队资源，加快客户交付。');
const created=[],mutated=[],screens={},hotspots={};
const go=id=>({type:'NODE',destinationId:id,navigation:'NAVIGATE',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_IN_AND_OUT'},duration:.32}});
const set=(v,value)=>({type:'SET_VARIABLE',variableId:v.id,variableValue:{type:'STRING',resolvedType:'STRING',value}});
async function connect(id,to,actions=[]){const n=await figma.getNodeByIdAsync(id);await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[...actions,go(to)]}]);mutated.push(id);}
for(const key of ['wechat-task','wechat-missing','feishu-task','wechat-return','gaode-preview','gaode-route']){const f=await figma.getNodeByIdAsync(S.screens[key]);f.findOne(n=>n.name==='Input / Draft').findOne(n=>n.type==='TEXT').setBoundVariable('characters',draft);}
await connect(S.hotspots.wechat.task,S.screens['wechat-task'],[set(draft,'输入回复…')]);await connect(S.hotspots.wechat.map,S.screens['gaode-preview'],[set(draft,'输入回复…')]);
await connect('12:5555',S.screens['wechat-task'],[set(draft,'可以，我会准时参加。')]);
const sf=await figma.getNodeByIdAsync(S.screens['sheet-applied']);sf.findOne(n=>n.type==='TEXT'&&n.characters.includes('=SUM')).setBoundVariable('characters',formula);
for(const [key,value]of [['sheet-preview','=SUM(C2:C8)\n¥ 128,600'],['sheet-average','=AVERAGE(C2:C8)\n¥ 18,371.43'],['sheet-fill','D3:D8 已填充\n相对引用公式 =B3*C3 …']])await connect(S.hotspots[key].apply,S.screens['sheet-applied'],[set(formula,value)]);
const wf=await figma.getNodeByIdAsync(S.screens['word-applied']);wf.findOne(n=>n.type==='TEXT'&&n.characters==='整合团队资源，加快客户交付。').setBoundVariable('characters',word);
await connect(S.hotspots['word-preview'].apply,S.screens['word-applied'],[set(word,'整合团队资源，加快客户交付。')]);await connect(S.hotspots['word-format'].apply,S.screens['word-applied'],[set(word,'提升团队在客户交付方面的效率。')]);
// Give every game button its own held state; release anywhere returns to the stable controller.
const main=await figma.getNodeByIdAsync(S.screens.game);let baseY=Math.max(...page.children.map(n=>n.y+n.height))+150;
for(const [i,key]of ['up','down','left','right','B','A'].entries()){
 const c=main.clone();c.name='game-held-'+key.toLowerCase();c.x=80+(i%3)*924;c.y=baseY+Math.floor(i/3)*510;page.appendChild(c);created.push(c.id);screens[c.name]=c.id;const map={};function pair(a,b){map[a.id]=b.id;if(a.children)for(let j=0;j<a.children.length;j++)pair(a.children[j],b.children[j]);}pair(main,c);hotspots[c.name]=Object.fromEntries(Object.entries(S.hotspots.game).map(([k,id])=>[k,map[id]]));
 for(const n of [c,...c.findAll(n=>'reactions'in n)])if(n.reactions?.length)await n.setReactionsAsync([]);
 const button=await figma.getNodeByIdAsync(hotspots[c.name][key]);button.fills=[{type:'SOLID',color:['A','B'].includes(key)?{r:.55,g:.1,b:.13}:{r:.18,g:.32,b:.36},opacity:.7}];
 await c.setReactionsAsync([{trigger:{type:'MOUSE_UP',delay:0},actions:[{...go(main.id),transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.08}}]}]);
 const source=await figma.getNodeByIdAsync(S.hotspots.game[key]);await source.setReactionsAsync([{trigger:{type:'MOUSE_DOWN',delay:0},actions:[{...go(c.id),transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.08}}]}]);
}
return {createdNodeIds:created,mutatedNodeIds:mutated,screens,hotspots,contextCollection:collection.id,contextVariables:{draft:draft.id,formula:formula.id,word:word.id}};
