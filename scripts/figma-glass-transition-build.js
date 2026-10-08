// Editable motion views. Input: L = design-state.json. Reference-inspired original choreography.
const page=await figma.getNodeByIdAsync('21:6225');await figma.setCurrentPageAsync(page);
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const created=[],animated=[],views={},parts={};
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h,o=1)=>({type:'SOLID',color:rgb(h),opacity:o});
const mark=n=>(created.push(n.id),n);
function at(p,n,x,y){p.appendChild(n);n.x=x;n.y=y;return n;}
function frame(name,w,h,parent,x=0,y=0){const n=mark(figma.createFrame());n.name=name;n.resize(w,h);n.fills=[];n.clipsContent=false;if(parent)at(parent,n,x,y);return n;}
function text(str,size=16,style='Regular',color='#183744'){const n=mark(figma.createText());n.fontName={family:'Noto Sans SC',style};n.fontSize=size;n.characters=str;n.fills=[solid(color)];n.textAutoResize='WIDTH_AND_HEIGHT';return n;}
function rect(p,name,w,h,x,y,r=24,fill='#FFFFFF',o=.5){const n=mark(figma.createRectangle());n.name=name;n.resize(w,h);n.cornerRadius=r;n.fills=[solid(fill,o)];at(p,n,x,y);return n;}
function keyframes(pairs,type='FLOAT'){return{keyframes:pairs.map(([t,value])=>({timelinePosition:t,value:{type,value},easing:{type:'EASE_IN_AND_OUT'}}))};}
function animate(n,tracks){n.manualKeyframeTracks=Object.fromEntries(Object.entries(tracks).map(([k,v])=>[k,keyframes(v,k==='SCALE_XY'?'VECTOR':'FLOAT')]));animated.push(n.id);}
function opacity(n,pairs){n.opacity=pairs[pairs.length-1][1];animate(n,{OPACITY:pairs});}
function scale(n,pairs){animate(n,{...Object.fromEntries(Object.entries(n.manualKeyframeTracks).map(([k,v])=>[k,v.keyframes.map(f=>[f.timelinePosition,f.value.value])])),SCALE_XY:pairs.map(([t,s])=>[t,{x:s,y:s}])});}
async function instance(id,w){const c=await figma.getNodeByIdAsync(id);const n=mark(c.createInstance());if(w)n.resize(w,w);return n;}
async function controller(id,parent){const src=await figma.getNodeByIdAsync(id),c=src.clone();for(const n of [c,...c.findAll(n=>'reactions'in n)])if(n.reactions?.length)await n.setReactionsAsync([]);at(parent,c,0,0);created.push(c.id);return c;}
function root(key,x){const f=frame(key,390,844,page,x,210);f.clipsContent=true;f.cornerRadius=36;f.fills=[solid('#EAF2F6')];views[key]=f.id;return f;}
function gradient(colors){return{type:'GRADIENT_LINEAR',gradientTransform:[[.78,.64,-.15],[-.64,.78,.43]],gradientStops:colors.map((c,i)=>({position:i/(colors.length-1),color:{...rgb(c),a:1}}))};}
function prism(parent,name,x,y,w,h){const g=frame(name,w,h,parent,x,y);g.clipsContent=false;
 const halo=rect(g,'Prism / chromatic halo',w+24,h+24,-12,-12,Math.min(w,h)*.3);halo.fills=[gradient(['#FFDAAE','#F3A7EC','#AC9EFF','#80DFF1','#C4F6DD'])];halo.effects=[{type:'LAYER_BLUR',radius:22,visible:true}];halo.opacity=.58;
 const glass=rect(g,'Prism / refractive shell',w,h,0,0,Math.min(w,h)*.22);glass.fills=[solid('#F9FCFF',.22)];glass.strokes=[gradient(['#FFFFFF','#C4CCFF','#9BE5EC','#FFFFFF','#F7BBD5'])];glass.strokeWeight=2.2;glass.effects=[{type:'GLASS',visible:true,lightIntensity:.84,lightAngle:315,refraction:.48,depth:18,dispersion:.23,radius:20},{type:'INNER_SHADOW',visible:true,color:{r:1,g:1,b:1,a:.94},offset:{x:0,y:1},radius:2,spread:0,blendMode:'NORMAL'},{type:'DROP_SHADOW',visible:true,color:{r:.32,g:.44,b:.62,a:.13},offset:{x:0,y:14},radius:30,spread:0,blendMode:'NORMAL'}];
 const inner=rect(g,'Prism / inner light',w*.8,h*.74,w*.1,h*.13,Math.min(w,h)*.17);inner.fills=[gradient(['#DBE9FF','#FEFAE9','#F1C7F1','#C6F4EB'])];inner.opacity=.28;inner.effects=[{type:'LAYER_BLUR',visible:true,radius:30}];
 const shine=rect(g,'Prism / specular edge',w*.65,3,w*.13,5,2);shine.fills=[solid('#FFFFFF',.96)];shine.effects=[{type:'LAYER_BLUR',visible:true,radius:2}];
 return g;
}
function beam(parent,x,y,w,h,name){const n=mark(figma.createEllipse());n.name=name;n.resize(w,h);n.fills=[gradient(['#8BFFF0','#BBADFF','#F8C9EA','#FFF0BB'])];n.effects=[{type:'LAYER_BLUR',visible:true,radius:42}];at(parent,n,x,y);return n;}
function label(str,x,y){at(page,text(str,20,'Medium'),x,y);}
label('Transition views',80,38);at(page,text('光先出现，玻璃成形，控件落位。',36,'Bold'),80,81);

// 01 · Whole application: outgoing UI dissolves into an iridescent material field.
const global=root('01 · Global / 微信 → Email',80);const old=await controller('5:2',global);old.name='Global / outgoing WeChat';const incoming=await controller('5:7893',global);incoming.name='Global / incoming Email';
opacity(old,[[0,1],[.35,1],[.73,.18],[1.04,0]]);opacity(incoming,[[0,0],[.84,0],[1.30,.72],[1.58,1]]);
const veil=beam(global,-100,230,590,360,'Global / prism wash');animate(veil,{OPACITY:[[0,0],[.36,0],[.7,.78],[1.05,.64],[1.55,0]],TRANSLATION_Y:[[0,160],[.7,0],[1.55,-300]],ROTATION:[[0,-22],[1.55,12]]});veil.opacity=0;
const lens=prism(global,'Global / material seed',65,272,260,292);animate(lens,{OPACITY:[[0,0],[.37,.05],[.67,1],[1.05,.75],[1.48,0]],SCALE_XY:[[0,{x:.22,y:.18}],[.38,{x:.22,y:.18}],[.70,{x:.85,y:.85}],[1.08,{x:1.18,y:1.05}],[1.48,{x:1.42,y:1.3}]],ROTATION:[[0,-10],[.7,-5],[1.35,4]],TRANSLATION_Y:[[0,78],[.7,0],[1.4,-60]]});lens.opacity=0;
const streak=beam(global,10,700,360,80,'Global / ascending caustic');animate(streak,{OPACITY:[[0,0],[.5,.7],[.95,.55],[1.5,0]],TRANSLATION_Y:[[0,0],[1.5,-690]]});streak.opacity=0;
// Re-overlay the persistent connection anchor, preventing bright washes from hiding it.
const conn=await instance('4:462');at(global,conn,24,18);parts.global={root:global.id,outgoing:old.id,incoming:incoming.id,prism:lens.id,glow:veil.id};
label('01  整体 · 应用材质重构',80,155);

// 02 · Local: remote selection changes from cells to a chart; only the contextual region generates.
const local=root('02 · Local / 选中图表 → 生成控件',570);const localBase=await controller('5:9517',local);localBase.name='Local / stable input controller';
for(const n of localBase.children)if(n.y>=280&&n.y<600)opacity(n,[[0,1],[.35,1],[.60,0]]);
const oldQuote=localBase.findOne(n=>n.name==='Context / Quote');opacity(oldQuote,[[0,1],[.3,1],[.5,0]]);
const q=await instance('4:485');q.resize(346,96);const prop=Object.keys(q.componentProperties).find(k=>k.startsWith('Text#'));q.setProperties({[prop]:'季度销售额 · 柱状图'});const cap=q.findOne(n=>n.type==='TEXT'&&n.characters==='已选消息');cap.characters='大屏已选组件';at(local,q,22,176);opacity(q,[[0,0],[.32,0],[.5,1]]);
const controls=frame('Local / generated chart controls',346,280,local,22,294);controls.layoutMode='VERTICAL';controls.itemSpacing=12;controls.counterAxisAlignItems='MIN';
const head=text('图表控件',13,'Medium','#536C7B');controls.appendChild(head);
const titlebox=frame('Chart / title',346,70,controls);titlebox.cornerRadius=23;titlebox.fills=[solid('#FFFFFF',.57)];titlebox.strokes=[solid('#FFFFFF',.95)];titlebox.layoutMode='VERTICAL';titlebox.paddingLeft=18;titlebox.paddingTop=9;titlebox.itemSpacing=5;titlebox.appendChild(text('标题',11,'Regular','#536C7B'));titlebox.appendChild(text('季度销售额',16,'Medium'));
const typeRow=frame('Chart / type',346,54,controls);typeRow.layoutMode='HORIZONTAL';typeRow.itemSpacing=12;for(const [txt,ic]of [['柱状图','Table2'],['折线图','SlidersHorizontal']]){const n=await instance(L.components.button);const pp=Object.keys(n.componentProperties);n.setProperties({[pp.find(k=>k.startsWith('Label#'))]:txt,[pp.find(k=>k.startsWith('Icon#'))]:L.icons[ic]});typeRow.appendChild(n);}
const colorRow=frame('Chart / palette',346,50,controls);colorRow.layoutMode='HORIZONTAL';colorRow.counterAxisAlignItems='CENTER';colorRow.itemSpacing=20;colorRow.appendChild(text('配色',13,'Medium'));for(const color of ['#428774','#4E80CD','#C37E66']){const sw=mark(figma.createEllipse());sw.resize(32,32);sw.fills=[solid(color)];sw.strokes=[solid('#FFFFFF')];sw.strokeWeight=3;colorRow.appendChild(sw);}
const range=await instance(L.components.button);range.resize(346,54);const rp=Object.keys(range.componentProperties);range.setProperties({[rp.find(k=>k.startsWith('Label#'))]:'修改数据范围',[rp.find(k=>k.startsWith('Icon#'))]:L.icons.Table2});controls.appendChild(range);
opacity(controls,[[0,0],[.87,0],[1.27,1]]);animate(controls,{OPACITY:[[0,0],[.87,0],[1.27,1]],TRANSLATION_Y:[[0,18],[.87,18],[1.27,0]]});controls.opacity=1;
const localLens=prism(local,'Local / generation membrane',22,308,346,242);animate(localLens,{OPACITY:[[0,0],[.4,0],[.64,.88],[.94,.62],[1.28,0]],SCALE_XY:[[0,{x:.3,y:.18}],[.42,{x:.3,y:.18}],[.74,{x:1.02,y:.93}],[1.18,{x:1,y:1}]]});localLens.opacity=0;
const localGlow=beam(local,30,370,330,140,'Local / bounded caustic');animate(localGlow,{OPACITY:[[0,0],[.5,.2],[.74,.65],[1.25,0]],TRANSLATION_Y:[[0,42],[1.25,-60]]});localGlow.opacity=0;
parts.local={root:local.id,controller:localBase.id,controls:controls.id,prism:localLens.id,quote:q.id};label('02  局部 · 选中组件生成控件',570,155);

// 03 · Trackpad: light seed travels from the entry to a 346×346 tactile glass square.
const track=root('03 · Trackpad / 玻璃方块生成',1060);const trackBase=await controller('5:2',track);trackBase.name='Trackpad / stable input controller';for(const n of trackBase.children)if(n.y>=176&&n.y<600)opacity(n,[[0,1],[.28,1],[.54,0]]);
const padTitle=at(track,text('触控板',19,'Medium'),24,189);opacity(padTitle,[[0,0],[.76,0],[1.2,1]]);
const close=await instance(L.components.circle);const cp=Object.keys(close.componentProperties).find(k=>k.startsWith('Icon#'));close.setProperties({[cp]:L.icons.X});at(track,close,314,173);opacity(close,[[0,0],[1.05,0],[1.36,1]]);
const pad=frame('Trackpad / glass square',346,346,track,22,236);pad.cornerRadius=34;pad.clipsContent=true;pad.fills=[solid('#FBFDFF',.45)];pad.strokes=[gradient(['#FFFFFF','#C2C9F2','#C7F1E8','#FFFFFF'])];pad.strokeWeight=1.4;pad.effectStyleId=L.effects.glass;
for(let yy=32;yy<250;yy+=32)for(let xx=29;xx<330;xx+=32){const dot=mark(figma.createEllipse());dot.resize(1.5,1.5);dot.fills=[solid('#536C7B',.16)];at(pad,dot,xx,yy);}
const pointer=await instance(L.icons.MousePointer2,24);at(pad,pointer,161,132);
const divider=rect(pad,'Trackpad / button divider',310,1,18,280,0,'#A6BBC6',.26);
const clicks=frame('Trackpad / mouse buttons',310,52,pad,18,287);clicks.layoutMode='HORIZONTAL';clicks.itemSpacing=10;for(const label of ['左键','右键']){const b=await instance(L.components.button);b.resize(150,48);const ps=Object.keys(b.componentProperties);b.setProperties({[ps.find(k=>k.startsWith('Label#'))]:label,[ps.find(k=>k.startsWith('Icon#'))]:L.icons.MousePointer2});clicks.appendChild(b);}
animate(pad,{OPACITY:[[0,0],[.55,0],[.87,.7],[1.25,1]],SCALE_XY:[[0,{x:.15,y:.15}],[.54,{x:.15,y:.15}],[.86,{x:.79,y:.84}],[1.06,{x:1.025,y:1.025}],[1.38,{x:1,y:1}]],TRANSLATION_X:[[0,-86],[.54,-38],[1.2,0]],TRANSLATION_Y:[[0,374],[.54,125],[1.16,0]],ROTATION:[[0,-10],[.6,-7],[1.3,0]]});
const padSeed=prism(track,'Trackpad / condensing square',22,236,346,346);animate(padSeed,{OPACITY:[[0,0],[.25,0],[.45,1],[.8,.8],[1.22,0]],SCALE_XY:[[0,{x:.10,y:.10}],[.3,{x:.10,y:.10}],[.60,{x:.32,y:.30}],[.92,{x:1.02,y:1.02}],[1.22,{x:1,y:1}]],TRANSLATION_X:[[0,-86],[.3,-86],[.62,-25],[1.18,0]],TRANSLATION_Y:[[0,374],[.3,374],[.65,88],[1.15,0]],ROTATION:[[0,-8],[.6,-8],[1.2,0]]});padSeed.opacity=0;
const tether=beam(track,73,459,104,320,'Trackpad / light trail');animate(tether,{OPACITY:[[0,0],[.28,0],[.54,.6],[.92,0]],TRANSLATION_Y:[[0,60],[.88,-100]],SCALE_XY:[[0,{x:.2,y:.3}],[.55,{x:1,y:1}],[.95,{x:1.3,y:.2}]]});tether.opacity=0;
parts.trackpad={root:track.id,controller:trackBase.id,surface:pad.id,close:close.id,seed:padSeed.id};label('03  触控板 · 从光点生长成方块',1060,155);
for(const f of [global,local,track]){const timeline=f.timelines[0];if(timeline.duration<2.4)f.setTimelineDuration(timeline.id,2.4);}
at(page,text('整体 1.25 s · 空间光色重构\n局部 0.95 s · 控制区域内生成\n触控板 1.10 s · 凝聚、展开、落定',18,'Medium'),80,1110);
at(page,text('三段动效均保留连接锚点和已确定的输入位置。光效为短暂过渡；操作就绪后回到低饱和玻璃。',16),80,1230);
page.flowStartingPoints=[{nodeId:global.id,name:'01 整体切换'},{nodeId:local.id,name:'02 局部生成'},{nodeId:track.id,name:'03 触控板展开'}];
return {createdNodeIds:created,animatedNodeIds:animated,views,parts,pageId:page.id};
