// Narrow migration following unified color component update. No app code changes.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const set=await figma.getNodeByIdAsync('1286:6160'),changed=[],removed=[];
const state=c=>c.name.match(/State=([^,]+)/)?.[1],mode=c=>c.name.match(/Input=([^,]+)/)?.[1];
const lookup=(s,m)=>set.children.find(c=>state(c)===s&&mode(c)===m);
async function link(n,dest,type='ON_CLICK'){if(!n||!dest)return;let owner=n;while(owner&&owner.type!=='COMPONENT')owner=owner.parent;if(owner?.id===dest.id)return;await n.setReactionsAsync([{trigger:{type},actions:[{type:'NODE',destinationId:dest.id,navigation:'CHANGE_TO',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_OUT'},duration:.18},resetVideoPosition:false}]}]);}
for(const c of set.children){
 const s=state(c),m=mode(c);
 if(['RecognizeColor','CustomColor','PreserveColor'].includes(s)){
  const palette=c.findOne(n=>n.type==='INSTANCE'&&n.name==='color-refinement');if(!palette)continue;
  palette.resize(354,328);await palette.setReactionsAsync([]);
  for(const n of palette.findAll(n=>n.name==='Color / #C92A2A'))await link(n,lookup('CustomColor',m));
  for(const n of palette.findAll(n=>n.name==='Color / #E03131'))await link(n,lookup('RecognizeColor',m));
  for(const n of palette.findAll(n=>['Color / hue','Color / saturation and brightness'].includes(n.name)))await link(n,lookup(s==='RecognizeColor'?'CustomColor':'PreserveColor',m),'ON_DRAG');
  changed.push(c.id);
 }
 if(['Running','Paused','Complete','RoadmapComplete'].includes(s)){
  const top=c.children.find(n=>n.name.startsWith('01 ·')),mid=c.children.find(n=>n.name.startsWith('02 ·'));
  const scroll=mid?.children.find(n=>n.name==='Adaptive / scrolling tools');if(!scroll)continue;
  const action=scroll.findOne(n=>n.type==='INSTANCE'&&n.findOne?.(t=>t.type==='TEXT'&&['停止任务','继续任务'].includes(t.characters)));
  if(action){const keep=action.clone();top.appendChild(keep);keep.name='Task tracking / '+(s==='Running'?'stop':'resume');keep.resize(96,48);keep.x=216;keep.y=96;for(const t of keep.findAllWithCriteria({types:['TEXT']})){for(const f of t.getRangeAllFontNames(0,t.characters.length))await figma.loadFontAsync(f);t.fontSize=12;}}
  for(const n of [...scroll.children]){removed.push(n.id);n.remove();}
  const composer=mid.children.find(n=>n.name==='Adaptive / sole composer');
  if(composer?.type==='FRAME'){
   composer.y=8;composer.resize(354,mid.height-20);
   const send=composer.children.find(n=>n.name==='Composer / send');if(send)send.y=composer.height-60;
  }
  changed.push(c.id);
 }
}
const section=await figma.getNodeByIdAsync('109:5262');
const annotations=section.children.filter(n=>n.type==='TEXT');
for(const t of annotations){if(/当前步骤|成果入口|自定义颜色|精确约束保留/.test(t.characters)){for(const f of t.getRangeAllFontNames(0,t.characters.length))await figma.loadFontAsync(f);t.characters=t.characters.replace(/当前步骤/g,'顶部简要状态').replace(/成果入口/g,'PC 显示成果').replace(/自定义颜色/g,'实时调色').replace(/精确约束保留/g,'继续输入，保留色值');changed.push(t.id);}}
return {changed,removed};
