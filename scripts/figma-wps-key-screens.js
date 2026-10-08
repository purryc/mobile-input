// Input STATE: latest WPS root ledger. Keep four editable review frames.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const get=id=>figma.getNodeByIdAsync(id),mutated=[],removed=[],created=[];
const keep={default:STATE.screens.default,ink:STATE.screens.ink,caption:STATE.screens['caption-final'],paired:STATE.paired.pairs.final};
const retained=new Set(Object.values(keep)),replacements={},deleteIds=[];
for(const [key,id]of Object.entries(STATE.screens)){if(retained.has(id))continue;deleteIds.push(id);replacements[id]=/caption/.test(key)?keep.caption:/drawing|blue|green|black|gold|cleared/.test(key)?keep.ink:keep.default;}
for(const id of Object.values(STATE.paired.pairs)){if(retained.has(id))continue;deleteIds.push(id);replacements[id]=keep.paired;}
const primary=await get('109:5270'),preview=await get('109:5272'),outer=await get('109:5269');
primary.name='01 · 核心控制器';primary.x=40;primary.y=104;primary.resizeWithoutConstraints(1760,968);
for(const [i,key,title]of [[0,'default','演示主界面'],[1,'ink','画笔控制'],[2,'caption','实时字幕']]){const root=await get(keep[key]);primary.appendChild(root);root.x=235+i*430;root.y=72;root.name=title;mutated.push(root.id);const label=figma.createText();primary.appendChild(label);created.push(label.id);label.name='Key screen / '+key;label.fontName={family:'Noto Sans SC',style:'Medium'};label.fontSize=16;label.characters=title;label.fills=[{type:'SOLID',color:{r:.2,g:.3,b:.34}}];label.x=root.x;label.y=32;}
preview.name='02 · 手机与平板字幕预览';preview.x=40;preview.y=1136;preview.resizeWithoutConstraints(1760,1080);const pair=await get(keep.paired);pair.x=0;pair.y=64;pair.name='手机采音与平板字幕';mutated.push(pair.id);
let repaired=0;
for(const n of figma.currentPage.findAll(n=>'reactions' in n&&n.reactions.length)){
 let top=n;while(top.parent&&top.parent.type!=='SECTION'&&top.parent.type!=='PAGE')top=top.parent;
 const sourceTop=top.id;
 if(!n.reactions.some(r=>(r.actions||[]).some(a=>a.destinationId&&replacements[a.destinationId])))continue;
 const before=JSON.stringify(n.reactions.map(r=>({trigger:r.trigger,actions:r.actions||[]})));const next=[];
 for(const r of n.reactions){const actions=[];for(const a of r.actions||[]){const b=JSON.parse(JSON.stringify(a));const replaced=b.destinationId&&replacements[b.destinationId];if(replaced)b.destinationId=replaced;if(replaced&&b.destinationId===sourceTop)continue;actions.push(b);}if(actions.length)next.push({trigger:r.trigger,actions});}
 if(JSON.stringify(next)!==before){await n.setReactionsAsync(next);mutated.push(n.id);repaired++;}
}
for(const id of deleteIds){const n=await get(id);if(n){removed.push(id);n.remove();}}
const empty=await get('109:5271');removed.push(empty.id);empty.remove();
outer.resizeWithoutConstraints(1840,2280);mutated.push(primary.id,preview.id,outer.id);
const note=await get('148:8885');note.characters='关键画面预览 · 手机采音、字幕与姿态为模拟；备注仅在手机显示。';mutated.push(note.id);
const flows=figma.currentPage.flowStartingPoints.filter(f=>!deleteIds.includes(f.nodeId));if(!flows.some(f=>f.nodeId===keep.paired))flows.push({nodeId:keep.paired,name:'WPS · 手机与平板字幕预览'});figma.currentPage.flowStartingPoints=flows;
const missing=[];for(const n of figma.currentPage.findAll(n=>'reactions' in n&&n.reactions.length))for(const r of n.reactions)for(const a of r.actions||[])if(a.destinationId&&!await get(a.destinationId))missing.push({source:n.id,target:a.destinationId});
figma.viewport.scrollAndZoomIntoView([outer]);
return {createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,kept:keep,deletedFrameCount:deleteIds.length,repaired,missing,sectionSize:{width:outer.width,height:outer.height}};
