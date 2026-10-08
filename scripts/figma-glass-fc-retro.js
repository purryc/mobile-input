// Inputs PAGE, S (delivery ledger), TOKENS optional on subsequent pages.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const created=[],mutated=[],removed=[];const m=n=>(mutated.push(n.id),n);
const palette={shell:'#E8E0CE',plate:'#454440',key:'#272826',red:'#A52D35',pressed:'#721C27',gold:'#AF9160',ink:'#423C33',cream:'#F4EBD6',gray:'#B8B2A5'};
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const vars={};if(!TOKENS){const c=figma.variables.createVariableCollection('FC · Retro material');for(const [k,h]of Object.entries(palette)){const v=figma.variables.createVariable(k,c,'COLOR');v.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];v.setValueForMode(c.defaultModeId,rgb(h));vars[k]=v;}}else for(const [k,id]of Object.entries(TOKENS))vars[k]=await figma.variables.getVariableByIdAsync(id);
const fill=k=>[figma.variables.setBoundVariableForPaint({type:'SOLID',color:rgb(palette[k])},'color',vars[k])];
function color(n,k){n.fills=fill(k);m(n);}
function rect(p,name,x,y,w,h,r,k,index){const n=figma.createRectangle();n.name=name;n.resize(w,h);n.cornerRadius=r;n.fills=fill(k);if(index===undefined)p.appendChild(n);else p.insertChild(index,n);n.x=x;n.y=y;created.push(n.id);return n;}
const roots=figma.currentPage.findAll(n=>n.type==='FRAME'&&n.children.some(x=>x.name==='Game / D-pad'));
for(const f of roots){const s=f.width/844;const isPaused=f.name.includes('paused'),isDisconnected=f.name.includes('disconnect');f.fills=fill('shell');m(f);
 const amb=f.children.find(n=>n.name==='Ambient / theme light');if(amb){amb.visible=false;m(amb);}
 for(const old of [...f.children].filter(n=>n.name==='Game / paused suggestions'||n.name==='Game / reconnect')){if(old.name==='Game / reconnect'){for(const c of [...old.children]){f.appendChild(c);c.x=(c.type==='TEXT'?291:328)*s;c.y=(c.type==='TEXT'?177:213)*s;if(c.type==='TEXT')color(c,'cream');else{color(c,'gray');c.effects=[];c.strokes=[];c.cornerRadius=8*s;}m(c);}}removed.push(old.id);old.remove();}
 const plate=rect(f,'FC / charcoal inset',28*s,142*s,788*s,213*s,18*s,'plate',1);plate.strokes=fill('gold');plate.strokeWeight=1.5*s;
 rect(f,'FC / gold upper trim',28*s,73*s,788*s,3*s,1*s,'gold',2);
 const d=f.children.find(n=>n.name==='Game / D-pad');for(const n of d.children){if(n.type==='ELLIPSE'){color(n,'gray');n.opacity=.2;n.strokes=[];n.effects=[];}else{color(n,'key');n.strokes=[];n.effects=[];if('cornerRadius'in n)n.cornerRadius=8*s;if(n.type==='INSTANCE'){for(const t of n.findAllWithCriteria({types:['VECTOR']})){t.strokes=fill('cream');m(t);}}m(n);}}
 // The center remains joined to the four fixed direction hit targets.
 const center=d.children.find(n=>n.type==='RECTANGLE');if(center)center.cornerRadius=0;
 const mid=f.children.find(n=>n.name==='Game / select and start');for(const n of mid.children){color(n,'gray');n.cornerRadius=10*s;n.strokes=fill('cream');n.strokeWeight=.8*s;n.effects=[{type:'INNER_SHADOW',visible:true,color:{r:0,g:0,b:0,a:.2},offset:{x:0,y:2*s},radius:3*s,spread:0,blendMode:'NORMAL'}];for(const t of n.findAllWithCriteria({types:['TEXT']}))color(t,'ink');for(const ic of n.children.filter(x=>x.type==='INSTANCE')){ic.visible=false;m(ic);}}
 for(const n of f.children.filter(n=>n.name==='Game / A'||n.name==='Game / B')){color(n,'red');n.strokes=fill('gold');n.strokeWeight=2*s;n.effects=[{type:'INNER_SHADOW',visible:true,color:{r:1,g:.85,b:.7,a:.35},offset:{x:0,y:2*s},radius:2*s,spread:0,blendMode:'NORMAL'},{type:'DROP_SHADOW',visible:true,color:{r:0,g:0,b:0,a:.32},offset:{x:0,y:5*s},radius:3*s,spread:0,blendMode:'NORMAL'}];for(const t of n.findAllWithCriteria({types:['TEXT']}))color(t,'cream');}
 for(const t of f.children.filter(n=>n.type==='TEXT')){if(t.name.startsWith('WORLD')){color(t,'red');t.x=328*s;t.y=85*s;}else if(['PAUSED','DISCONNECTED'].includes(t.name)||t.name.startsWith('MARIO')){color(t,'ink');t.x=328*s;t.y=113*s;}}
 const header=f.children.find(n=>n.name==='Context / active application');if(header){for(const t of header.findAllWithCriteria({types:['TEXT']}))color(t,'red');header.y=80*s;}
 if(!isDisconnected){for(let i=0;i<3;i++)rect(f,'FC / molded stripe '+i,302*s,(179+i*22)*s,230*s,8*s,3*s,'gray');}
 const key=Object.entries(S.screens).find(([k,id])=>id===f.id)?.[0];const active=key?.startsWith('game-held-')?key.slice(10):key==='game-held'?'A':null;if(active){const h=S.hotspots[key];const target=await figma.getNodeByIdAsync(h[active.toUpperCase()]||h[active]);if(target){color(target,'pressed');target.effects=[{type:'INNER_SHADOW',visible:true,color:{r:0,g:0,b:0,a:.4},offset:{x:0,y:3*s},radius:5*s,spread:0,blendMode:'NORMAL'}];}}
}
return {createdNodeIds:created,mutatedNodeIds:[...new Set(mutated)],removedNodeIds:removed,frames:roots.map(n=>n.id),tokens:Object.fromEntries(Object.entries(vars).map(([k,v])=>[k,v.id]))};
