// Figma-only revision, based on Doubao 15.2.0 observed on the connected tablet.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const get=id=>figma.getNodeByIdAsync(id), created=[],mutated=[],removed=[];
const root=await get('198:2437'),section=await get('198:2436');
for(const t of section.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255}),solid=(h,a=1)=>({type:'SOLID',color:rgb(h),opacity:a});
const blue='#367BD5',ink='#193B48',muted='#71889E',mark=n=>(created.push(n.id),n);
const styles=Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s=>[s.name,s.id]));
function box(p,name,w,h,dir){const n=mark(dir?figma.createAutoLayout(dir):figma.createFrame());p.appendChild(n);n.name=name;n.resize(w,h);n.fills=[];if(dir){n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.counterAxisAlignItems='CENTER';}return n;}
function pos(n,x,y){n.x=x;n.y=y;return n;}
function txt(p,s,size=14,color=ink){const t=mark(figma.createText());p.appendChild(t);t.name=s;t.textStyleId=styles['Mobile Input / '+(size<13?'caption':size<16?'label':'body')];t.fontName={family:'Noto Sans SC',style:'Regular'};t.characters=s;t.fontSize=size;t.lineHeight={unit:'PIXELS',value:size>17?28:22};t.fills=[solid(color)];return t;}
function glass(n,sel=false){n.cornerRadius=22;n.fills=[solid(sel?'#D6E7FE':'#FFFFFF',sel?.85:.58)];n.strokes=[solid(sel?'#78A8E9':'#FFFFFF',.9)];n.strokeWeight=1;n.effects=[{type:'INNER_SHADOW',visible:true,color:{r:1,g:1,b:1,a:.7},offset:{x:0,y:1},radius:1,spread:0,blendMode:'NORMAL'}];}
function icon(p,key,size=22){const n=mark(figma.createNodeFromSvg(ICONS[key]));p.appendChild(n);n.name='Icon / '+key;n.resize(size,size);return n;}
function button(p,name,key,w=48,h=48){const b=box(p,name,w,h,'HORIZONTAL');b.primaryAxisAlignItems='CENTER';glass(b);if(key)icon(b,key);return b;}
const nav=(id,navigation='NAVIGATE')=>({type:'NODE',destinationId:id,navigation,transition:{type:'DISSOLVE',duration:.18,easing:{type:'EASE_OUT'}}});
const set=(v,value)=>({type:'SET_VARIABLE',variableId:v.id,variableValue:{type:v.resolvedType,resolvedType:v.resolvedType,value}});
const on=async(n,a,type='ON_CLICK')=>{try{await n.setReactionsAsync([{trigger:{type},actions:a}]);}catch(e){throw new Error(n.name+' '+type+' '+JSON.stringify(a)+' '+e.message);}};
const vars=await figma.variables.getLocalVariablesAsync();const draft=await figma.variables.getVariableByIdAsync('VariableID:199:4492'),empty=await figma.variables.getVariableByIdAsync('VariableID:199:4493');
const coll=await figma.variables.getVariableCollectionByIdAsync(draft.variableCollectionId);
function variable(name,type,value){let v=vars.find(v=>v.variableCollectionId===coll.id&&v.name===name);if(!v){v=figma.variables.createVariable(name,coll,type);created.push(v.id);v.scopes=type==='STRING'?['TEXT_CONTENT']:['ALL_SCOPES'];v.setValueForMode(coll.defaultModeId,value);}return v;}
const topicVar=variable('topic/selection','STRING','0'),attachment=variable('attachment/name','STRING',''),hasAttachment=variable('attachment/visible','BOOLEAN',false);
const q=(p,n)=>p.findOne(x=>x.name===n);
// Replace only superseded entry assets; keep shared input components and draft behavior.
for(const id of ['199:4524','199:4755','199:4754','199:4520','199:4726','199:4888']){const n=await get(id);removed.push(id);n.remove();}
const status=await get('199:4495');status.itemSpacing=8;const dot=status.findOne(n=>n.type==='ELLIPSE');dot.fills=[solid(blue)];const conn=button(status,'Connection / panel','Link');conn.fills=[];conn.strokes=[];
// Dial exposes the current topic and adjacent detents; tap advances it.
const topicNames=['澄星项目采购方案','小猫插画的创作思路','整理销售汇报要点'];const topics=[],dials=[];
for(let i=0;i<3;i++){
 const c=mark(figma.createComponent());section.appendChild(c);c.name='Topic='+i;c.resize(346,120);glass(c);c.description='Current topic with a horizontal detent dial. Prototype topics are fictional.';
 pos(txt(c,'当前话题',11,muted),18,10);pos(txt(c,topicNames[i],18),18,33);
 const row=pos(box(c,'Topic / dial',310,48,'HORIZONTAL'),18,66);row.itemSpacing=8;const prev=button(row,'Topic / previous','ChevronLeft');prev.fills=[];prev.strokes=[];
 const rail=box(row,'Topic / detents',198,48,'HORIZONTAL');rail.primaryAxisAlignItems='CENTER';rail.itemSpacing=9;
 for(let k=0;k<17;k++){const tick=mark(figma.createRectangle());rail.appendChild(tick);tick.resize(k===8?3:1,k===8?23:k%4===0?14:8);tick.cornerRadius=1;tick.fills=[solid(blue,k===8?1:.24)];}
 const next=button(row,'Topic / next','ChevronRight');next.fills=[];next.strokes=[];topics.push(c);dials.push({prev,next,rail});
}
const ts=mark(figma.combineAsVariants(topics,section));ts.name='Doubao / Topic dial';pos(ts,64,1130);ts.resize(1126,160);topics.forEach((n,i)=>pos(n,16+i*370,16));
for(let i=0;i<3;i++){await on(dials[i].prev,[set(topicVar,String((i+2)%3))]);await on(dials[i].next,[set(topicVar,String((i+1)%3))]);await on(dials[i].rail,[nav(topics[(i+1)%3].id,'CHANGE_TO')],'ON_CLICK');}
const ti=mark(topics[0].createInstance());root.appendChild(ti);pos(ti,22,82);ti.setProperties({Topic:{type:'VARIABLE_ALIAS',id:topicVar.id}});
// One reusable feature tile, source labels from the installed tablet application.
const tiles=[];for(const state of ['Default','Selected']){const c=mark(figma.createComponent());section.appendChild(c);c.name='State='+state;c.resize(167,66);c.layoutMode='HORIZONTAL';c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.counterAxisAlignItems='CENTER';c.itemSpacing=10;c.paddingLeft=14;glass(c,state==='Selected');icon(c,'Zap');txt(c,'快速',14,state==='Selected'?blue:ink);tiles.push(c);}
const tileSet=mark(figma.combineAsVariants(tiles,section));tileSet.name='Doubao / Common feature';pos(tileSet,1230,1130);tileSet.resize(390,100);tiles.forEach((n,i)=>pos(n,12+i*190,16));
const defs=[['快速','Zap'],['AI 创作','Sparkles'],['拍题答疑','ScanText'],['同声传译','Languages'],['录音纪要','Mic'],['豆包 P 图','ImagePlus'],['照片动起来','Clapperboard'],['视频通话','Video']];
const selection=defs.map((d,i)=>variable('features/'+i,'STRING',i?'Default':'Selected'));const entries=[];
function tile(parent,i,w=167){const b=mark(tiles[i===0?1:0].createInstance());parent.appendChild(b);b.resize(w,66);b.setProperties({State:{type:'VARIABLE_ALIAS',id:selection[i].id}});b.name='Feature / '+defs[i][0];const t=b.findOne(n=>n.type==='TEXT');t.characters=defs[i][0];const old=b.findOne(n=>n.name==='Icon / Zap'); // icon override stays editable through detached local wrapper
 const f=b.detachInstance();mutated.push(b.id);const io=q(f,'Icon / Zap');io.remove();const ii=icon(f,defs[i][1]);f.insertChild(0,ii);f.name='Feature / '+defs[i][0];return f;}
// Instead of detaching stateful tiles, construct compact editable cards with independent selected overlays.
const grid=pos(box(root,'Adaptive / common functions',346,294,'VERTICAL'),22,248);grid.itemSpacing=10;pos(txt(root,'常用功能',13,muted),24,218);
for(let r=0;r<4;r++){const row=box(grid,'Feature row / '+r,346,66,'HORIZONTAL');row.itemSpacing=12;for(let k=0;k<2;k++){let i=r*2+k;const b=box(row,'Feature / '+defs[i][0],167,66,'HORIZONTAL');b.paddingLeft=14;b.itemSpacing=10;glass(b,i===0);icon(b,defs[i][1]);txt(b,defs[i][0],14,i===0?blue:ink);entries.push(b);}}
// Attachment affordance is part of the editor, not a floating action.
const bottom=await get('199:4787'),surface=q(bottom,'Input / draft surface');const footer=q(surface,'Draft / AI polish reserved footer');footer.visible=false;
const attach=pos(button(surface,'Attachment / add','Paperclip'),4,62);attach.fills=[];attach.strokes=[];
const badge=pos(box(surface,'Attachment / selected file',280,38,'HORIZONTAL'),58,67);badge.itemSpacing=8;badge.setBoundVariable('visible',hasAttachment);icon(badge,'FileText',18);const badgeText=txt(badge,'',12,blue);badgeText.setBoundVariable('characters',attachment);
// One additional key view: AI creation replaces lower input surface with a sketch canvas.
const creative=mark(root.clone());section.appendChild(creative);creative.name='豆包 · AI 创作 / 草图输入';pos(creative,510,104);created.push(...creative.findAll(()=>true).map(n=>n.id));
q(creative,'Adaptive / common functions').remove();creative.findOne(n=>n.type==='TEXT'&&n.characters==='常用功能').remove();
const modes=pos(box(creative,'Adaptive / primary modes',346,56,'HORIZONTAL'),22,218);modes.itemSpacing=8;const modeButtons=[];
for(const [label,key]of [['快速','Zap'],['AI 创作','Sparkles'],['拍题答疑','ScanText']]){const b=box(modes,'Mode / '+label,110,56,'HORIZONTAL');b.itemSpacing=6;b.primaryAxisAlignItems='CENTER';glass(b,label==='AI 创作');icon(b,key,20);txt(b,label,13,label==='AI 创作'?blue:ink);modeButtons.push(b);}
const cb=q(creative,'Input / fixed bottom section');cb.y=286;cb.resize(390,546);const cs=q(cb,'Input / draft surface');cs.resize(354,82);const ca=q(cs,'Attachment / add');ca.x=300;ca.y=28;const cBadge=q(cs,'Attachment / selected file');cBadge.x=14;cBadge.y=42;cBadge.resize(274,34);q(cb,'Input / stable voice row').y=494;
const cp=q(cs,'Draft / placeholder');cp.characters='描述你的创作想法…';cp.resize(270,22);q(cs,'Draft / text').resize(270,22);
// The canvas states demonstrate input/erase/attach without claiming freehand execution in Figma.
const canvases=[],canvasParts=[];
for(const state of ['Blank','Sketch']){
 const c=mark(figma.createComponent());section.appendChild(c);c.name='State='+state;c.resize(354,330);glass(c);c.fills=[solid('#FFFFFF',.82)];c.description='Editable vector sketch prototype. Tap reveals the example; real freehand input belongs to later runtime work.';
 const hdr=pos(box(c,'Sketch / toolbar',330,48,'HORIZONTAL'),12,6);hdr.itemSpacing=3;const pen=button(hdr,'Sketch / pen','Pencil');pen.fills=[solid('#D6E7FE')];pen.strokes=[];const eraser=button(hdr,'Sketch / eraser','Eraser');eraser.fills=[];eraser.strokes=[];const undo=button(hdr,'Sketch / undo','Undo2');undo.fills=[];undo.strokes=[];const spacer=box(hdr,'Spacer',78,1);const add=box(hdr,'Sketch / attach',98,48,'HORIZONTAL');add.primaryAxisAlignItems='CENTER';add.itemSpacing=4;glass(add);icon(add,'Plus',18);txt(add,'加入输入',12,blue);
 const area=pos(box(c,'Sketch / surface',330,250),12,66);area.cornerRadius=16;
 if(state==='Sketch'){
 const v=mark(figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="260" height="220" viewBox="0 0 260 220" fill="none" stroke="#367BD5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M69 78 L57 26 L101 56 C115 50 142 50 155 56 L199 29 L188 84 C205 115 188 149 151 154 C128 160 89 154 75 133 C61 116 63 94 69 78Z"/><path d="M90 102 L91 106 M165 102 L164 106 M124 115 L134 115 L129 121 M129 121 C123 130 117 127 115 125 M129 121 C136 131 143 127 145 125 M79 118 L42 111 M79 125 L42 130 M178 117 L216 109 M179 126 L218 131 M100 153 C79 179 100 202 134 202 C166 204 179 179 157 154 M167 190 C207 208 226 170 213 156"/></svg>'));area.appendChild(v);pos(v,34,4);
 }
 canvases.push(c);canvasParts.push({area,eraser,undo,add,pen});
}
const canvasSet=mark(figma.combineAsVariants(canvases,section));canvasSet.name='Doubao / Sketch input';pos(canvasSet,64,1350);canvasSet.resize(758,362);canvases.forEach((n,i)=>pos(n,16+i*378,16));
const sketchMode=variable('sketch/state','STRING','Sketch');const canvasInst=mark(canvases[1].createInstance());creative.appendChild(canvasInst);pos(canvasInst,18,436);canvasInst.setProperties({State:{type:'VARIABLE_ALIAS',id:sketchMode.id}});
for(const [pi,p] of canvasParts.entries()){if(pi===0)await on(p.area,[nav(canvases[1].id,'CHANGE_TO')],'ON_CLICK');await on(p.eraser,[set(sketchMode,'Blank')]);await on(p.undo,[set(sketchMode,'Blank')]);await on(p.pen,[set(sketchMode,'Sketch')]);await on(p.add,[set(attachment,'草图.png'),set(hasAttachment,true)]);}
// Attachment source sheet and mock phone-file selection; no user file is uploaded.
function overlay(name,x,y){const o=pos(box(section,name,390,844),x,y);o.fills=[solid('#254E7F',.1)];return o;}
const sheet=overlay('豆包 · 手机附件',956,104);const panel=pos(box(sheet,'Attachment / source sheet',354,262,'VERTICAL'),18,562);panel.paddingLeft=18;panel.paddingRight=18;panel.paddingTop=14;panel.itemSpacing=12;glass(panel);panel.fills=[solid('#EDF4FC',.98)];
const shead=box(panel,'Sheet / heading',318,48,'HORIZONTAL');shead.primaryAxisAlignItems='SPACE_BETWEEN';txt(shead,'从手机添加',17);const close=button(shead,'Close','X');close.fills=[];close.strokes=[];await on(close,[{type:'CLOSE'}]);
const sourceRow=box(panel,'Attachment / sources',318,84,'HORIZONTAL');sourceRow.itemSpacing=12;const sourceButtons=[];
for(const [label,key]of [['相机','Camera'],['相册','Image'],['文件','FileText']]){const b=box(sourceRow,'Attachment source / '+label,98,84,'VERTICAL');b.primaryAxisAlignItems='CENTER';b.itemSpacing=5;glass(b);icon(b,key,26);txt(b,label,13);sourceButtons.push(b);}
const files=box(panel,'Attachment / local demo file',318,62,'HORIZONTAL');files.itemSpacing=12;files.paddingLeft=14;glass(files);icon(files,'FileText');txt(files,'创作参考.pdf',14);await on(files,[set(attachment,'创作参考.pdf'),set(hasAttachment,true),{type:'CLOSE'}]);
for(let i=0;i<3;i++)await on(sourceButtons[i],[set(attachment,['照片.jpg','参考图片.jpg','创作参考.pdf'][i]),set(hasAttachment,true),{type:'CLOSE'}]);
await on(attach,[nav(sheet.id,'OVERLAY')]);await on(ca,[nav(sheet.id,'OVERLAY')]);
for(let i=0;i<entries.length;i++){const actions=selection.map((v,k)=>set(v,k===i?'Selected':'Default'));if(i===1)actions.push(nav(creative.id));await on(entries[i],actions);}
await on(modeButtons[0],[nav(root.id)]);await on(modeButtons[2],[nav(root.id)]);await on(modeButtons[1],[set(sketchMode,'Sketch')]);
// Visible selection feedback for the six retained secondary entries.
for(let i=0;i<entries.length;i++){const b=entries[i];const c=mark(figma.createComponentFromNode(b));c.name='State=Default';const selected=mark(c.clone());section.appendChild(selected);selected.name='State=Selected';glass(selected,true);const setNode=mark(figma.combineAsVariants([c,selected],section));setNode.name='Doubao / '+defs[i][0];pos(setNode,860+(i%2)*460,1350+Math.floor(i/2)*116);setNode.resize(414,100);pos(c,12,16);pos(selected,224,16);const inst=mark(c.createInstance());const row=grid.children[Math.floor(i/2)];row.appendChild(inst);inst.setProperties({State:{type:'VARIABLE_ALIAS',id:selection[i].id}});}
const connection=overlay('豆包 · 连接状态',1380,104);const connectionPanel=pos(box(connection,'Connection / status panel',354,154,'VERTICAL'),18,646);glass(connectionPanel);connectionPanel.fills=[solid('#EDF4FC',.98)];connectionPanel.paddingTop=18;connectionPanel.itemSpacing=12;txt(connectionPanel,'已连接',18,blue);const done=button(connectionPanel,'Connection / close','Check',96);await on(done,[{type:'CLOSE'}]);await on(conn,[nav(connection.id,'OVERLAY')]);await on(q(creative,'Connection / panel'),[nav(connection.id,'OVERLAY')]);
// Relocate shared input components below the key views; maintain existing keyboard/trackpad wiring.
const inputSet=await get('199:5229');pos(inputSet,64,1900);const inputOverlay=await get('199:5230');pos(inputOverlay,980,1900);
for(const id of ['199:5396','199:5397','199:5398','199:5399','199:5400','199:5401']){const n=await get(id);removed.push(id);n.remove();}
const notes=[['原生入口 · 豆包 15.2.0 / 平板实机参考',64,990],['话题拨盘 · 当前标题与逐项切换',64,1080],['创作草图 · 点击画板显示示例；橡皮／撤销清空；加入输入保留为附件',64,1298],['附件为手机来源交互示意；示例文件与草图均为虚构，不读取或上传真实文件。',64,1760],['未展开功能保留选择反馈。Figma 不模拟通话、翻译、拍摄或生成结果。',64,1790],['固定输入 · 键盘 / 触控板',64,1850]];
for(const [s,x,y]of notes)pos(txt(section,s,13,muted),x,y);
section.resizeWithoutConstraints(1840,2860);mutated.push(root.id,status.id,bottom.id,inputSet.id,inputOverlay.id,section.id);
return{createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,main:root.id,creative:creative.id,attachments:sheet.id,topicSet:ts.id,canvasSet:canvasSet.id,topicVariable:topicVar.id,selectionVariables:selection.map(v=>v.id),sketchVariable:sketchMode.id,attachmentVariable:attachment.id};
