// Shared structural helpers; append after figma-adaptive-kit.
const layoutChanges=[],collapsePairs=[];
function region(parent,name,y,h){const r=box(name,parent.width,h);r.layoutMode='NONE';r.clipsContent=false;place(r,parent,0,y);return r;}
function moveKeep(n,parent,dx=0,dy=0){const x=n.x-dx,y=n.y-dy;parent.appendChild(n);n.x=x;n.y=y;}
function groupRegions(c,topNodes,contextNodes,inputNodes,dockY,topEnd){
 const top=region(c,'01 · 当前对象与任务状态',0,topEnd);
 const mid=region(c,'02 · 上下文自适应输入',topEnd,dockY-topEnd);mid.clipsContent=true;mid.overflowDirection='VERTICAL';
 const dock=region(c,'03 · 固定输入 / Expanded',dockY,c.height-dockY);surface(dock,'Glass');dock.cornerRadius=26;dock.clipsContent=false;
 for(const n of topNodes)moveKeep(n,top);for(const n of contextNodes)moveKeep(n,mid,0,topEnd);for(const n of inputNodes)moveKeep(n,dock,0,dockY);
 layoutChanges.push(c.id);return{top,mid,dock};
}
async function collapseControl(c,r,composer,locked=false){
 const b=await inst('icon-button','Glass',locked?'Disabled':'Default',{icon:'ChevronDown'});b.name='输入区 · 最小化';b.fills=[];b.strokes=[];b.effects=[];
 if(composer){let y=composer.y;let x=composer.x;for(let a=composer.parent;a&&a!==r.dock;a=a.parent){x+=a.x;y+=a.y;}place(b,r.dock,x+composer.width-52,y+4);const values=composer.type==='INSTANCE'?composer.findAllWithCriteria({types:['TEXT']}).filter(n=>n.name==='Value'):composer.children.filter(n=>n.type==='TEXT');for(const t of values){if(t.y<60&&t.width>180)t.resize(Math.min(t.width,composer.width-82),t.height);}}
 else {const tools=r.dock.children.find(n=>/tools|toolbar/i.test(n.name));if(tools&&tools.children){tools.resize(290,tools.height);const count=tools.children.length;if(tools.layoutMode==='HORIZONTAL'){tools.itemSpacing=6;for(const a of tools.children)a.resize((290-6*(count-1))/count,a.height);}else{for(const [i,a]of tools.children.entries()){a.x=i*70;a.resize(64,a.height);}}}place(b,r.dock,c.width-66,8);}
 return b;
}
async function compactClone(c,r,collapse,locked=false){
 const clone=track(c.clone());clone.name=c.name.replace('Input=Expanded','Input=Minimized');
 const dock=clone.children.find(n=>n.name==='03 · 固定输入 / Expanded');const mid=clone.children.find(n=>n.name==='02 · 上下文自适应输入');
 dock.name='03 · 固定输入 / Minimized';for(const n of [...dock.children])n.remove();dock.y=c.height-80;dock.resize(c.width,80);mid.resize(mid.width,dock.y-mid.y);
 const draft=r.dock.findAllWithCriteria({types:['TEXT']}).find(t=>t.visible&&/Value|Draft \/ text|Draft \/ placeholder/.test(t.name));
 const mini=box('Minimized draft and restore',c.width-36,56,'HORIZONTAL',8);surface(mini,'Glass','Default','surface/reading');pad(mini,4);mini.primaryAxisAlignItems='SPACE_BETWEEN';const val=txt(draft?.characters||'输入已保留','Label','text/muted',c.width-112);val.maxLines=1;val.textTruncation='ENDING';mini.appendChild(val);const restore=await inst('icon-button','Glass','Default',{icon:'ChevronDown'});restore.name='输入区 · 展开';restore.rotation=180;mini.appendChild(restore);place(mini,dock,18,8);
 for(const panel of mid.children.filter(n=>/Editable sketch|Sketch input|^sketch$|^camera$|Presentation \/ notes|^notes$/.test(n.name))){const newH=mid.height-panel.y-12;if(newH>panel.height)panel.resize(panel.width,newH);}
 collapsePairs.push({expanded:c.id,minimized:clone.id,collapse:collapse.id,restore:restore.id,mini:mini.id,locked});return clone;
}
