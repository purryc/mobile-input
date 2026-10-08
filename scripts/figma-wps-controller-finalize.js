// Inputs STATE and VOLUME. Connect the latest controller states and remove replaced states.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const get=id=>figma.getNodeByIdAsync(id),created=[],mutated=[],removed=[],screens={...STATE.screens};
const volume=await get(VOLUME.component);
const volumeKeys=['muted','volume-25','volume-50','volume-75','volume-100'];
for(const key of volumeKeys){const n=await get(screens[key]);removed.push(n.id);n.remove();delete screens[key];}
for(const [key,id]of Object.entries(screens)){
 const root=await get(id),old=root.findOne(n=>n.name==='Presentation / tablet volume');
 const x=old.x,y=old.y;removed.push(old.id);old.remove();const instance=volume.createInstance();root.appendChild(instance);instance.name='Presentation / tablet volume';instance.x=x;instance.y=y;created.push(instance.id);
 const settings=root.findOne(n=>n.name==='Presentation / pen settings');if(settings)root.appendChild(settings);
 const meta=root.findOne(n=>n.name==='Presentation / page');meta.characters=meta.characters.replace('/ 12','/ 06').replace('12 /','06 /');mutated.push(meta.id);
 if(key==='disconnected'){instance.opacity=.35;const notes=root.findOne(n=>n.name==='Presentation / notes');notes.opacity=.3;const header=root.children.find(n=>n.name.includes('status')||n.name.includes('header'));if(header){const dot=header.findOne(n=>n.type==='ELLIPSE');if(dot){dot.fills=[{type:'SOLID',color:{r:.8,g:.22,b:.18}}];mutated.push(dot.id);}}}
}
const target={...screens,chooser:'5:11016'},byNode={};
const ownerFor=id=>Object.keys(STATE.controls).find(k=>Object.values(STATE.controls[k]).includes(id));
for(const l of STATE.links){if(volumeKeys.includes(l.key)||!await get(l.id))continue;let key=l.key;
 const owner=ownerFor(l.id),c=owner?STATE.controls[owner]:null;
 if(c&&l.id===c.previous){key=owner==='first'?'first':owner==='second'?'first':owner==='previous'?'second':owner==='next'?'default':owner==='last'?'next':'previous';}
 if(c&&l.id===c.next){key=owner==='first'?'second':owner==='second'?'previous':owner==='previous'?'default':owner==='next'?'last':owner==='last'?'last':'next';}
 if(!target[key])throw Error('Missing destination '+key);let ancestor=await get(l.id);let same=false;while(ancestor&&ancestor.type!=='PAGE'){if(ancestor.id===target[key]){same=true;break;}ancestor=ancestor.parent;}if(same)continue;
 const trigger={type:l.event};if(l.event==='AFTER_TIMEOUT')trigger.timeout=l.timeout;if(l.event==='MOUSE_UP'||l.event==='MOUSE_DOWN')trigger.delay=0;if(l.event==='MOUSE_LEAVE'){trigger.delay=0;}
 (byNode[l.id]??=[]).push({trigger,actions:[{type:'NODE',destinationId:target[key],navigation:'NAVIGATE',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_OUT'},duration:l.event.startsWith('MOUSE')?.08:.24},resetScrollPosition:false}]});
}
for(const [id,reactions]of Object.entries(byNode)){const n=await get(id);await n.setReactionsAsync(reactions);mutated.push(id);}
const oldIds=['5:10337','7:5514','15:5867','15:5957'];let rerouted=0;
for(const n of figma.currentPage.findAll(n=>'reactions' in n&&n.reactions.length>0)){
 const raw=JSON.stringify(n.reactions);let next=raw;for(const old of oldIds)next=next.split('"'+old+'"').join('"5:9875"');
 if(next!==raw){await n.setReactionsAsync(JSON.parse(next));mutated.push(n.id);rerouted++;}
}
for(const id of oldIds){const n=await get(id);if(n){removed.push(id);n.remove();}}
const groups=[
 {id:'109:5270',name:'备注与翻页',keys:['default','previous','next','first','second','last','fullscreen-off','disconnected']},
 {id:'109:5271',name:'指向与标注',keys:['laser','calibrated','ink','drawing','settings','blue','settings-blue','drawing-blue','thick','ink-thick','drawing-thick','black','gold','cleared']},
 {id:'109:5272',name:'字幕与音量',keys:['caption-listening','caption-partial','caption-final','caption-error','ink-caption']}
];
let y=104;const outer=await get('109:5269');
for(const group of groups){const section=await get(group.id);section.name=group.name;section.x=40;section.y=y;section.resizeWithoutConstraints(1760,80+Math.ceil(group.keys.length/4)*920);
 for(let i=0;i<group.keys.length;i++){const n=await get(screens[group.keys[i]]);section.appendChild(n);n.x=30+(i%4)*430;n.y=64+Math.floor(i/4)*920;mutated.push(n.id);}
 mutated.push(section.id);y+=section.height+64;
}
outer.resizeWithoutConstraints(1840,y);mutated.push(outer.id);
const note=figma.createText();outer.appendChild(note);created.push(note.id);note.name='WPS prototype / scope';note.fontName={family:'Noto Sans SC',style:'Regular'};note.fontSize=15;note.fills=[{type:'SOLID',color:{r:.26,g:.34,b:.38}}];note.characters='可编辑交互原型 · 手机采音、字幕与姿态均为模拟；备注仅在手机显示。音量以 25% 档位演示，真实产品为连续 0–100%。';note.x=40;note.y=44;
figma.currentPage.flowStartingPoints=[...figma.currentPage.flowStartingPoints.filter(f=>!oldIds.includes(f.nodeId)),{nodeId:screens['caption-error'],name:'WPS · 字幕失败与恢复'},{nodeId:screens.disconnected,name:'WPS · 断线与恢复'}];
return {createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,screens,rerouted,connectedSources:Object.keys(byNode).length,outerHeight:y};
