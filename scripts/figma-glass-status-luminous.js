// Input PAGE. Merge the status row and restore luminous retro glass.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(PAGE));
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const created=[],mutated=[],removed=[],rows=[];const m=n=>(mutated.push(n.id),n);
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h,a=1)=>({type:'SOLID',color:rgb(h),opacity:a});
const gradient=(arr)=>({type:'GRADIENT_LINEAR',gradientTransform:[[.72,.69,-.2],[-.69,.72,.48]],gradientStops:arr.map(([h,a],i)=>({position:i/(arr.length-1),color:{...rgb(h),a}}))});
const hosts=figma.currentPage.findAll(n=>n.type==='FRAME'&&n.children.some(c=>c.name==='Context / active application'));
for(const f of hosts){const app=f.children.find(n=>n.name==='Context / active application'),status=f.children.find(n=>n.name==='Status / Connected');if(!status)continue;const s=status.height/40;
 for(const n of [...f.children])if(n.type==='INSTANCE'&&n.name==='Control / Circle'&&n.y<30*s){removed.push(n.id);n.remove();}
 const row=figma.createAutoLayout();row.name='Status / Unified connection and app';row.layoutMode='HORIZONTAL';row.counterAxisAlignItems='CENTER';row.itemSpacing=16*s;row.fills=[];row.resize(f.width-48*s,48*s);f.appendChild(row);row.x=24*s;row.y=18*s;created.push(row.id);rows.push({host:f.id,row:row.id});
 row.appendChild(status);status.resize(85*s,40*s);m(status);
 row.appendChild(app);app.resize(Math.max(100*s,row.width-101*s),48*s);app.layoutMode='HORIZONTAL';app.counterAxisAlignItems='CENTER';app.paddingLeft=0;app.itemSpacing=0;for(const c of app.children){if(c.type!=='TEXT'){c.visible=false;m(c);}else{c.fontSize=14*s;m(c);}}m(app);
}
// The old persistent overlay duplicated the same connection status in global motion frames.
for(const f of figma.currentPage.findAll(n=>n.type==='FRAME'&&n.children.some(c=>c.name==='Global / outgoing WeChat'))){for(const n of [...f.children])if(n.name==='Status / Connected'){removed.push(n.id);n.remove();}}
const games=figma.currentPage.findAll(n=>n.type==='FRAME'&&n.children.some(c=>c.name==='Game / D-pad'));
for(const f of games){const s=f.width/844;f.fills=[gradient([['#FFFCF0',1],['#DCD8C7',1],['#F4E6CF',1]])];m(f);const plate=f.children.find(n=>n.name==='FC / charcoal inset');if(plate){plate.fills=[gradient([['#938B77',.83],['#394344',.92],['#716253',.85]])];plate.strokes=[gradient([['#FFFFFF',.95],['#C3B993',.55],['#FFF0C9',.9]])];plate.strokeWeight=1.8*s;plate.effects=[{type:'GLASS',visible:true,lightIntensity:.8,lightAngle:315,refraction:.25,depth:12,dispersion:.06,radius:14},{type:'INNER_SHADOW',visible:true,color:{r:1,g:.98,b:.9,a:.6},offset:{x:0,y:2*s},radius:3*s,spread:0,blendMode:'NORMAL'},{type:'DROP_SHADOW',visible:true,color:{r:.2,g:.16,b:.12,a:.17},offset:{x:0,y:8*s},radius:14*s,spread:0,blendMode:'NORMAL'}];m(plate);}
 const d=f.children.find(n=>n.name==='Game / D-pad');for(const n of d.children){if(n.type==='INSTANCE'||n.type==='RECTANGLE'){const pressed=n.fills.some(p=>p.type==='SOLID'&&p.color.r>.3&&p.color.r>p.color.g*2);n.fills=[gradient(pressed?[['#962D3B',1],['#641C2A',1],['#A44848',1]]:[['#6B6D64',.95],['#262F30',.98],['#484941',1]])];n.strokes=[solid('#FFF5D7',.35)];n.strokeWeight=.8*s;m(n);}}
 for(const n of f.children.filter(n=>n.name==='Game / A'||n.name==='Game / B')){const pressed=n.fills.some(p=>p.type==='SOLID'&&p.color.r<.5);n.fills=[gradient(pressed?[['#B54C54',1],['#701D2C',1],['#99283A',1]]:[['#F38977',.96],['#B52B41',.95],['#DE5C51',1]])];n.strokes=[gradient([['#FFF6DC',.95],['#F39F89',.5],['#FFE1BB',.85]])];n.strokeWeight=1.8*s;n.effects=[{type:'INNER_SHADOW',visible:true,color:{r:1,g:.92,b:.79,a:.65},offset:{x:0,y:2*s},radius:3*s,spread:0,blendMode:'NORMAL'},{type:'DROP_SHADOW',visible:true,color:{r:.25,g:.04,b:.08,a:.4},offset:{x:0,y:5*s},radius:9*s,spread:0,blendMode:'NORMAL'}];m(n);
 const shine=figma.createEllipse();n.insertChild(0,shine);if(n.layoutMode!=='NONE')shine.layoutPositioning='ABSOLUTE';shine.name='FC / button reflected light';shine.resize(58*s,18*s);shine.x=16*s;shine.y=8*s;shine.fills=[gradient([['#FFF7DF',.57],['#FFFFFF',.13],['#FFFFFF',0]])];shine.effects=[{type:'LAYER_BLUR',radius:3*s,visible:true}];created.push(shine.id);}
 const mid=f.children.find(n=>n.name==='Game / select and start');for(const n of mid.children){n.fills=[gradient([['#F1E9D6',.9],['#B7B5A8',.75],['#D8CDB6',.9]])];n.strokes=[solid('#FFF9E8',.8)];n.effects=[{type:'INNER_SHADOW',visible:true,color:{r:1,g:1,b:.96,a:.75},offset:{x:0,y:2*s},radius:3*s,spread:0,blendMode:'NORMAL'}];m(n);}
 for(const n of f.children.filter(n=>n.name.startsWith('FC / molded stripe'))){n.fills=[gradient([['#FBF4DD',.8],['#C8C4B4',.4],['#E8D5AF',.75]])];n.strokes=[solid('#FFF9E4',.25)];n.strokeWeight=.6*s;m(n);}
}
return {createdNodeIds:created,mutatedNodeIds:[...new Set(mutated)],removedNodeIds:removed,rows,games:games.map(n=>n.id)};
