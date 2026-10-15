// Inject pageId. Migrate the sole draft editor into adaptive context; preserve node IDs.
const page=await figma.getNodeByIdAsync(pageId);await figma.setCurrentPageAsync(page);
for(const s of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style:s});
const created=[],mutated=[],removed=[],changed=[];
const isComposer=n=>['composer','compact-composer','Input / draft surface','Input / transcript and draft','Input / Draft','Adaptive / sole composer'].includes(n.name);
const roots=page.findAllWithCriteria({types:['COMPONENT']}).filter(c=>c.children.some(n=>n.name==='02 · 上下文自适应输入'));
function move(n,p,x,y){p.appendChild(n);n.x=x;n.y=y;mutated.push(n.id);}
function fitCanvas(mid,limit){for(const n of mid.children.filter(n=>/Editable sketch|Sketch input|^sketch$|^camera$/.test(n.name))){const h=limit-n.y-12;if(h>=180&&h!==n.height){n.resize(n.width,h);mutated.push(n.id);}}}
for(const c of roots.filter(c=>!c.name.includes('Input=Minimized'))){const mid=c.children.find(n=>n.name==='02 · 上下文自适应输入'),dock=c.children.find(n=>n.name==='03 · 固定输入 / Expanded');if(!dock)continue;
 for(const z of dock.children.filter(n=>n.name==='Input / fixed zone')){const x=z.x,y=z.y;const positions=z.children.map(n=>({n,x:x+n.x,y:y+n.y}));for(const item of positions)move(item.n,dock,item.x,item.y);removed.push(z.id);z.remove();}
 const comps=dock.children.filter(isComposer);if(!comps.length)continue;const comp=comps[0],oldY=dock.y,h=comp.height;const oldGlobal=new Map(dock.children.map(n=>[n.id,{x:n.x,y:n.y+oldY}]));let newY,fieldY;
 if(c.width>600){const panel=dock.children.find(n=>['keyboard','trackpad','numpad'].includes(n.name));newY=panel?oldY+h+8:c.height-72;fieldY=panel?oldY:newY-h-8;dock.y=newY;dock.resize(c.width,c.height-newY);for(const n of dock.children){if(n===comp)continue;if(n.name==='edit-tools'){n.x=24;n.y=panel?0:8;}else if(n.name==='segmented'){n.y=0;}else if(n===panel){n.y=dock.height-n.height;}else if(n.name==='Fixed voice and input modes'){n.y=8;}}comp.resize(c.width-48,h);
 }else{newY=oldY+h+12;fieldY=oldY;dock.y=newY;dock.resize(c.width,c.height-newY);for(const n of dock.children){if(n===comp)continue;const old=oldGlobal.get(n.id);n.y=old.y-newY;if(/edit-tools|fixed editing tools|Fixed tools/.test(n.name))n.y=8;}}
 mid.resize(mid.width,newY-mid.y);move(comp,mid,comp.x,fieldY-mid.y);comp.name='Adaptive / sole composer';
 for(const extra of comps.slice(1)){removed.push(extra.id);extra.remove();}
 const collapse=dock.children.find(n=>/最小化|收起键盘/.test(n.name));if(collapse)move(collapse,mid,comp.x+comp.width-52,comp.y+4);
 fitCanvas(mid,comp.y);changed.push(c.id);mutated.push(c.id,mid.id,dock.id);
}
for(const c of roots.filter(c=>c.name.includes('Input=Minimized'))){const mid=c.children.find(n=>n.name==='02 · 上下文自适应输入'),dock=c.children.find(n=>n.name==='03 · 固定输入 / Minimized');if(!dock)continue;const expanded=c.parent.children.find(n=>n.type==='COMPONENT'&&n.name===c.name.replace('Input=Minimized','Input=Expanded'));const source=expanded?.children.find(n=>n.name==='02 · 上下文自适应输入')?.children.find(isComposer);
 dock.y=c.height-64;dock.resize(c.width,64);mid.resize(mid.width,dock.y-mid.y);
 const mini=dock.children.find(n=>n.name==='Minimized draft and restore');if(mini){mini.name='Fixed tools / restore action';mini.fills=[];mini.strokes=[];mini.effects=[];mini.resize(c.width-36,48);mini.y=4;for(const t of mini.children.filter(n=>n.type==='TEXT')){t.characters='展开输入工具';mutated.push(t.id);}}
 if(source){const comp=source.clone();created.push(comp.id);move(comp,mid,source.x,mid.height-source.height-8);fitCanvas(mid,comp.y);}mutated.push(c.id,mid.id,dock.id);changed.push(c.id);
}
return {createdNodeIds:created,mutatedNodeIds:[...new Set(mutated)],removedNodeIds:removed,controllersUpdated:changed.length};
