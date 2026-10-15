// Main demo page; preserve frame IDs and existing root destinations.
const sceneSets=[];const demoRoots=[];
const wbSet=await figma.getNodeByIdAsync('1286:6160');
for(const c of [...wbSet.children].filter(n=>n.type==='COMPONENT'&&n.width===390&&n.height===844)){
 const state=c.name.match(/State=([^,]+)/)?.[1];c.name+=', Input=Expanded';let children=[...c.children];
 let input=children.filter(n=>['edit-tools','composer','compact-composer','Persistent voice and input dock','Input mode · mutually exclusive','keyboard','trackpad'].includes(n.name));
 const sketch=['Sketch','SketchRecording'].includes(state);if(sketch){const comp=input.find(n=>n.name==='compact-composer'||n.name==='composer');if(comp){comp.y=704;if(comp.name==='composer')comp.resize(354,56);}const mode=input.find(n=>n.name==='Input mode · mutually exclusive');if(mode){input=input.filter(n=>n!==mode);children=children.filter(n=>n!==mode);mode.remove();}const tools=children.find(n=>n.name==='Sketch tools');if(tools)tools.y=224;const canvas=children.find(n=>n.name==='Editable sketch / layout input');if(canvas){canvas.y=284;canvas.resize(354,338);}const edit=await inst('edit-tools','Glass');place(edit,c,3,648);input.push(edit);children.push(edit);}
 const bg=children.find(n=>n.name==='Fixed input section');if(bg){children=children.filter(n=>n!==bg);bg.remove();}
 const top=children.filter(n=>['status-row','Current task / switch receiver','Pinned object reference'].includes(n.name));const topEnd=top.some(n=>n.name==='Pinned object reference')?250:148;
 const dockY=sketch?636:Math.max(topEnd+64,Math.min(...input.map(n=>n.y))-12);const mid=children.filter(n=>!top.includes(n)&&!input.includes(n)&&!n.name.startsWith('Ambient'));
 // Preview/submit stays task-adaptive above the dock, except the full keyboard action.
 for(const n of mid.filter(n=>n.y>=dockY)){if(n.y>=770){input.push(n);}else if(n.y+n.height>dockY)n.y=dockY-n.height-8;}
 const r=groupRegions(c,top,mid.filter(n=>!input.includes(n)),input,dockY,topEnd);const comp=input.find(n=>['composer','compact-composer'].includes(n.name));const locked=/Recording/.test(state);const control=await collapseControl(c,r,comp,locked);const compact=await compactClone(c,r,control,locked);wbSet.appendChild(compact);demoRoots.push(c.id);
}
// Repack WorkBuddy variants, without changing visible overview frames.
wbSet.children.forEach((n,i)=>{n.x=32+i%5*422;n.y=48+Math.floor(i/5)*884;});wbSet.resize(2160,Math.ceil(wbSet.children.length/5)*884+80);mutated.push(wbSet.id);
const sections=['109:5254','109:5260','109:5265','109:5267','109:5269','198:2436'];
let setY=100;
for(const sid of sections){const sec=await figma.getNodeByIdAsync(sid);const frames=sec.findAll(n=>n.type==='FRAME'&&n.width===390&&n.height===844&&n.children.some(c=>/Status|status-row/.test(c.name)));
 for(const frame of frames){const c=track(figma.createComponent());page.appendChild(c);c.name='Input=Expanded';c.resize(390,844);c.fills=frame.fills;c.effects=frame.effects;c.cornerRadius=frame.cornerRadius;c.clipsContent=true;
 const theme=sid==='109:5254'?'WeChat':sid==='109:5260'?'Email':sid==='109:5265'?'Word':sid==='109:5267'?'Sheet':sid==='109:5269'?'Presentation':'Doubao';mode(c,'Glass',theme);
 for(const n of [...frame.children]){if(n.name==='Home indicator'||(n.type==='RECTANGLE'&&n.y>=830&&n.height<8)){n.remove();continue;}moveKeep(n,c);}
 let children=[...c.children];let input=[];let dockY=590;
 const bottom=children.find(n=>/^Input \/ (fixed bottom section|bottom section)$/.test(n.name));
 if(bottom){dockY=bottom.y;for(const n of [...bottom.children]){const x=n.x+bottom.x,y=n.y+bottom.y;c.appendChild(n);n.x=x;n.y=y;input.push(n);}children=children.filter(n=>n!==bottom);children.push(...input);bottom.remove();const bg=input.filter(n=>n.name==='Input / glass section boundary');for(const n of bg){input=input.filter(v=>v!==n);children=children.filter(v=>v!==n);n.remove();}}
 if(theme==='Doubao'&&frame.id==='205:3476'){
 dockY=650;const tools=input.find(n=>n.name==='Input / fixed editing tools');tools.y=656;const composer=input.find(n=>n.name==='Input / draft surface');composer.y=710;const voice=input.find(n=>n.name==='Input / stable voice row');voice.y=780;
 const output=input.find(n=>n.name==='Creative / output and attachment');input=input.filter(n=>n!==output);if(output){output.y=280;output.x=18;}const canvas=children.find(n=>n.name==='Doubao / Sketch input');canvas.y=338;canvas.resize(354,300);
 }
 if(theme==='Presentation'){dockY=748;input=children.filter(n=>n.name==='Presentation / fixed tools');}
 if(!input.length){c.remove();continue;}
 const top=children.filter(n=>/Status|status-row|Context \/ identity|Context \/ source message|Context \/ Quote|Doubao \/ Topic dial|Presentation \/ (title|page|timer|app switch)/.test(n.name)||(n.type==='TEXT'&&n.y<180));
 // Compact legacy titles and remove unused space above their object reference.
 if(['Email','Word','Sheet'].includes(theme)){const title=top.find(n=>n.type==='TEXT');if(title){title.y=78;title.fontSize=20;}const quote=top.find(n=>n.name==='Context / Quote');if(quote)quote.y=116;}
 const topEnd=theme==='Presentation'?140:Math.min(dockY-64,Math.max(...top.map(n=>n.y+n.height))+12);
 const mid=children.filter(n=>!top.includes(n)&&!input.includes(n)&&!n.name.startsWith('Ambient'));
 const r=groupRegions(c,top,mid,input,dockY,topEnd);const comp=input.find(n=>/draft surface|transcript and draft|Composer|Draft/i.test(n.name));const locked=/转写中/.test(frame.name);const collapse=await collapseControl(c,r,comp,locked);const compact=await compactClone(c,r,collapse,locked);
 const set=track(figma.combineAsVariants([c,compact],page));set.name='Demo / '+frame.name+' · 输入展开与最小化';set.description='Three stable regions. Input collapse preserves draft and target. Recording/held interaction locks layout. Prototype simulation only.';set.x=11600;set.y=setY;c.x=24;c.y=48;compact.x=438;compact.y=48;set.resize(852,916);setY+=972;
 const instance=track(c.createInstance());frame.appendChild(instance);instance.x=instance.y=0;frame.fills=[];demoRoots.push(frame.id);sceneSets.push(set.id);mutated.push(frame.id);
 }
}
return {createdNodeIds:created,mutatedNodeIds:[...mutated,...layoutChanges],collapsePairs,sceneSets,demoRoots};
