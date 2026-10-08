// Editable glass focus; source palette comes from Hover's light blue/lavender/pink gradient.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const get=id=>figma.getNodeByIdAsync(id),created=[],mutated=[];
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255}),solid=(h,a=1)=>({type:'SOLID',color:rgb(h),opacity:a});
function gradient(stops,vertical=false){return{type:'GRADIENT_LINEAR',gradientTransform:vertical?[[0,1,0],[-1,0,1]]:[[1,0,0],[0,1,0]],gradientStops:stops.map(([position,h,a=1])=>({position,color:{...rgb(h),a}}))};}
const spectral=gradient([[0,'#78B6DA'],[.35,'#709CF3'],[.68,'#B3A1EA'],[1,'#DAAED1']]);
const glowEffects=[{type:'DROP_SHADOW',visible:true,color:{...rgb('#70C7F3'),a:.36},offset:{x:-2,y:1},radius:8,spread:1,blendMode:'NORMAL'},{type:'DROP_SHADOW',visible:true,color:{...rgb('#B3A1EA'),a:.27},offset:{x:3,y:1},radius:12,spread:1,blendMode:'NORMAL'}];
function tracks(n,props){n.manualKeyframeTracks=Object.fromEntries(Object.entries(props).map(([k,rows])=>[k,{keyframes:rows.map(([timelinePosition,value])=>({timelinePosition,value:{type:'FLOAT',value},easing:{type:'LINEAR'}}))}]));}
function rect(p,name,x,y,w,h){const n=figma.createRectangle();p.appendChild(n);created.push(n.id);n.name=name;n.x=x;n.y=y;n.resize(w,h);return n;}
function rim(n,active=true){n.fills=[solid('#FFFFFF',.98)];n.strokes=[{...spectral,opacity:active?.92:.46}];n.strokeWeight=active?1.5:1;n.effects=active?glowEffects:[];n.clipsContent=false;mutated.push(n.id);}
const timeline=await get('178:2388');
for(const t of timeline.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);
const steps=[];
for(let i=0;i<4;i++){
 const root=await get(['178:2419','178:2435','178:2457','178:2482'][i]);steps.push(root);
 const tablet=root.findOne(n=>n.name==='Tablet / WeChat'),message=tablet.findOne(n=>n.name==='Tablet / meaningful message'),composer=tablet.findOne(n=>n.name==='Tablet / composer');
 if(i===0||i===2)rim(message,true);else{message.fills=[solid('#FFFFFF')];message.strokes=[];message.effects=[];mutated.push(message.id);}
 if(i>0)rim(composer,i===1);else{composer.strokes=[solid('#DCE3E7')];mutated.push(composer.id);}
 if(i===1){
 composer.manualKeyframeTracks={};const glow=rect(tablet,'Focus / breathing glass rim',composer.x,composer.y,composer.width,composer.height);glow.cornerRadius=composer.cornerRadius;glow.fills=[];glow.strokes=[spectral];glow.strokeWeight=1.8;glow.effects=glowEffects;tracks(glow,{OPACITY:[[0,.2],[.08,1],[.24,.2],[.32,1],[.48,.35]]});
 const glint=rect(composer,'Focus / white refraction',6,1,344,1);glint.fills=[gradient([[0,'#FFFFFF',0],[.25,'#C1ECFF',.8],[.5,'#FFFFFF',1],[.8,'#DBCFFC',.8],[1,'#FFFFFF',0]])];
 }
 if(i===2){
 const beam=await get('178:2464');beam.resize(94,58);beam.x=8;beam.y=2;beam.opacity=.6;beam.cornerRadius=8;beam.fills=[gradient([[0,'#78B6DA',0],[.22,'#78B6DA',.04],[.48,'#B3A1EA',.18],[.62,'#D3EDFF',.26],[.72,'#FFFFFF',.95],[.8,'#CCF2FF',.42],[1,'#DAAED1',0]])];tracks(beam,{TRANSLATION_X:[[0,-80],[.7,340]],OPACITY:[[0,0],[.09,.7],[.61,.7],[.7,0]]});mutated.push(beam.id);
 message.clipsContent=true;message.insertChild(0,beam); // all business text remains above the refractive veil
 for(const [j,y]of [[0,1],[1,59]]){const spark=rect(message,'Reading / edge filament '+j,10,y,100,2);spark.cornerRadius=1;spark.fills=[gradient([[0,'#709CF3',0],[.3,'#91CFF6',.5],[.6,'#FFFFFF',1],[.82,'#B3A1EA',.7],[1,'#DAAED1',0]])];tracks(spark,{TRANSLATION_X:[[0,j?250:-70],[.7,j?-70:330]],OPACITY:[[0,0],[.12,1],[.59,1],[.7,0]]});}
 }
}
// Adapt the same semantic-focus material to the selected context on the phone, without recoloring WeChat actions.
for(const id of ['5:2','5:5794','5:5935']){const n=await get(id);const context=n.findOne(x=>x.name==='Context / source message');if(context){context.strokes=[{...spectral,opacity:.38}];context.strokeWeight=1;mutated.push(context.id);}}
const note=await get('178:2661');note.characters='先双次玻璃聚焦 → 蓝紫语义包络＋折射扫光 → 平板确认 → 手机依序生成。换目标或断线取消旧轮次。';mutated.push(note.id);
return{createdNodeIds:created,mutatedNodeIds:mutated,timeline:timeline.id,steps:steps.map(n=>({id:n.id,reactions:n.reactions})),palette:['#78B6DA','#709CF3','#B3A1EA','#DAAED1']};
