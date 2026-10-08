// Existing Figma document only. Local components, editable layers, simulated entry feedback.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const get=id=>figma.getNodeByIdAsync(id),created=[],mutated=[];
const root=await get('198:2437'),section=await get('198:2436');
for(const id of ['5:2','98:5326','29:9738'])for(const t of (await get(id)).findAll(n=>n.type==='TEXT'))for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const mark=n=>(created.push(n.id),n),ink='#193B48',blue='#448AE3',muted='#738797';
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h,a=1)=>({type:'SOLID',color:rgb(h),opacity:a});
const collection=figma.variables.createVariableCollection('Doubao / entry prototype');created.push(collection.id);
function variable(name,type,value,scopes){const v=figma.variables.createVariable(name,collection,type);v.scopes=scopes;v.setValueForMode(collection.defaultModeId,value);created.push(v.id);return v;}
const accent=variable('color/doubao','COLOR',{...rgb(blue),a:1},['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR']);
const draft=variable('draft/text','STRING','',['TEXT_CONTENT']),empty=variable('draft/empty','BOOLEAN',true,['ALL_SCOPES']),voiceLabel=variable('voice/label','STRING','按住说话',['TEXT_CONTENT']);
const styles=Object.fromEntries((await figma.getLocalTextStylesAsync()).map(s=>[s.name,s.id]));
const textPaint=figma.variables.setBoundVariableForPaint(solid(ink),'color',await figma.variables.getVariableByIdAsync('VariableID:4:18'));
const bluePaint=figma.variables.setBoundVariableForPaint(solid(blue),'color',accent);
function txt(p,value,size=14,color=ink,name=value){const n=mark(figma.createText());p.appendChild(n);n.name=name;n.textStyleId=styles['Mobile Input / '+(size<13?'caption':size<16?'label':'body')];n.fontName={family:'Noto Sans SC',style:'Regular'};n.fontSize=size;n.lineHeight={unit:'PIXELS',value:size>=18?28:22};n.characters=value;n.fills=[color===ink?textPaint:color===blue?bluePaint:solid(color)];return n;}
function frame(p,name,w,h,dir=null){const n=mark(dir?figma.createAutoLayout(dir):figma.createFrame());p.appendChild(n);n.name=name;n.resize(w,h);n.fills=[];if(dir){n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.counterAxisAlignItems='CENTER';}return n;}
function glass(n,selected=false,pressed=false){n.cornerRadius=24;n.fills=[solid(pressed?'#D0E3FA':selected?'#DAEAFC':'#FFFFFF',pressed?.86:selected?.7:.48)];n.strokes=[solid(selected?blue:'#FFFFFF',selected?.56:.94)];n.strokeWeight=1;n.effects=[{type:'INNER_SHADOW',visible:true,color:{r:1,g:1,b:1,a:.65},offset:{x:0,y:1},radius:1,spread:0,blendMode:'NORMAL'}];}
const cameraSvg='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#193B48" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>';
const iconDefs={question:await get('4:232'),creative:await get('4:235'),switch:await get('4:114'),chevron:await get('4:108'),check:await get('4:133')};
function icon(p,key,size=24){const n=mark(key==='photo'?figma.createNodeFromSvg(cameraSvg):iconDefs[key].createInstance());p.appendChild(n);n.name='Icon / '+key;n.resize(size,size);return n;}
const setVar=(v,value)=>({type:'SET_VARIABLE',variableId:v.id,variableValue:{type:v.resolvedType,resolvedType:v.resolvedType,value}});
const nodeAction=(id,navigation='CHANGE_TO')=>({type:'NODE',destinationId:id,navigation,transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.12}});
async function on(n,trigger,actions){await n.setReactionsAsync([{trigger:['MOUSE_DOWN','MOUSE_UP','MOUSE_LEAVE'].includes(trigger)?{type:trigger,delay:0}:{type:trigger},actions}]);}
// Independent blue atmosphere; no content or behavior is imported from WeChat.
root.fills=[{type:'GRADIENT_LINEAR',gradientTransform:[[.5,.85,-.08],[-.85,.5,.66]],gradientStops:[{position:0,color:{...rgb('#E8F1F9'),a:1}},{position:.52,color:{...rgb('#F1F5FA'),a:1}},{position:1,color:{...rgb('#D8E7F7'),a:1}}]}];mutated.push(root.id);
const status=frame(root,'Status / connection and app',342,48,'HORIZONTAL');status.x=24;status.y=18;status.itemSpacing=9;
const dot=mark(figma.createEllipse());status.appendChild(dot);dot.resize(6,6);dot.fills=[solid('#00966C')];txt(status,'已连接',13);const spacer=frame(status,'Status / flexible space',1,1);spacer.layoutSizingHorizontal='FILL';
const logo=await get('198:2438');status.appendChild(logo);logo.resize(26,26);mutated.push(logo.id);txt(status,'豆包',14,blue);
// Topic component has press feedback only.
const topics=[];
for(const state of ['Default','Pressed']){const c=mark(figma.createComponent());section.appendChild(c);c.name='State='+state;c.resize(346,80);c.layoutMode='HORIZONTAL';c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.primaryAxisAlignItems='SPACE_BETWEEN';c.counterAxisAlignItems='CENTER';c.paddingLeft=20;c.paddingRight=20;glass(c,false,state==='Pressed');const label=frame(c,'Topic / label',238,50,'VERTICAL');label.counterAxisAlignItems='MIN';label.itemSpacing=2;txt(label,'当前话题',11,muted);txt(label,'新话题',19);icon(c,'switch',22);topics.push(c);}
const topicSet=mark(figma.combineAsVariants(topics,section));topicSet.name='Doubao / Topic entry';topicSet.x=540;topicSet.y=884;topicSet.resize(756,116);topics.forEach((n,i)=>{n.x=16+i*378;n.y=16;});
await on(topics[0],'MOUSE_DOWN',[nodeAction(topics[1].id)]);await topics[1].setReactionsAsync(['MOUSE_UP','MOUSE_LEAVE'].map(type=>({trigger:{type,delay:0},actions:[nodeAction(topics[0].id)]})));
const topicInstance=mark(topics[0].createInstance());root.appendChild(topicInstance);topicInstance.x=22;topicInstance.y=94;
// A single component controls the three mutually exclusive entry cards.
const defs=[['question','问问题'],['creative','AI 创作'],['photo','拍照答题']],groups=[],cards={};
for(const [mode]of defs)for(const state of ['Idle','Pressed']){
 const c=mark(figma.createComponent());section.appendChild(c);c.name='Mode='+mode+', State='+state;c.resize(346,312);c.layoutMode='VERTICAL';c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.itemSpacing=12;c.fills=[];cards[c.id]=[];
 for(const [key,label]of defs){const selected=mode===key,b=frame(c,'Entry / '+key,346,96,'HORIZONTAL');b.paddingLeft=20;b.paddingRight=20;b.itemSpacing=16;glass(b,selected,selected&&state==='Pressed');const tile=frame(b,'Entry / icon tile',48,48,'HORIZONTAL');tile.primaryAxisAlignItems='CENTER';tile.cornerRadius=16;tile.fills=[solid('#FFFFFF',selected?.64:.42)];icon(tile,key,26);const t=txt(b,label,19);t.layoutSizingHorizontal='FILL';icon(b,selected?'check':'chevron',20);cards[c.id].push(b);}
 groups.push(c);
}
const groupSet=mark(figma.combineAsVariants(groups,section));groupSet.name='Doubao / Adaptive entries';groupSet.x=540;groupSet.y=104;groupSet.resize(1126,688);
groups.forEach((n,i)=>{n.x=16+Math.floor(i/2)*370;n.y=16+(i%2)*340;});
for(const [i,c]of groups.entries())for(const [j,b]of cards[c.id].entries()){
 const idle=groups[j*2],press=groups[j*2+1];
 if(i%2===0)await b.setReactionsAsync([{trigger:{type:'MOUSE_DOWN',delay:0},actions:[nodeAction(press.id)]}]);
 else await b.setReactionsAsync([{trigger:{type:'MOUSE_UP',delay:0},actions:[nodeAction(idle.id)]},{trigger:{type:'MOUSE_LEAVE',delay:0},actions:[nodeAction(groups[Math.floor(i/2)*2].id)]}]);
}
const heading=txt(root,'常用功能',13,muted);heading.x=24;heading.y=204;
const entries=mark(groups[0].createInstance());root.appendChild(entries);entries.x=22;entries.y=238;
// Clone native fixed input geometry, then bind only Doubao-owned draft state.
const bottom=(await get('173:4753')).clone();root.appendChild(bottom);created.push(bottom.id,...bottom.findAll(()=>true).map(n=>n.id));bottom.x=0;bottom.y=590;
async function clean(n){for(const x of [n,...n.findAll(()=>true)])if('reactions' in x&&x.reactions.length)await x.setReactionsAsync([]);}
await clean(bottom);
const q=(n,name)=>n.findOne(x=>x.name===name),sample='帮我画一只小猫。';
const draftText=q(bottom,'Draft / text'),placeholder=q(bottom,'Draft / placeholder');draftText.setBoundVariable('characters',draft);placeholder.setBoundVariable('visible',empty);placeholder.characters='输入你的问题…';
const voice=q(bottom,'Voice / hold');voice.fills=[solid('#FFFFFF',.36)];voice.strokes=[solid('#FFFFFF',.96)];const vl=q(voice,'Label');vl.setBoundVariable('characters',voiceLabel);vl.fills=[bluePaint];
for(const n of voice.findAll(n=>n.type==='VECTOR')){if(n.fills.length)n.fills=[bluePaint];if(n.strokes.length)n.strokes=[bluePaint];}
async function wireDraftTools(area){for(const [name,actions]of [['Edit / 粘贴',[setVar(draft,sample),setVar(empty,false)]],['Edit / 删除',[setVar(draft,''),setVar(empty,true)]],['Edit / 剪切',[setVar(draft,''),setVar(empty,true)]],['Edit / 撤销',[setVar(draft,''),setVar(empty,true)]],['Edit / 重做',[setVar(draft,sample),setVar(empty,false)]]]){const b=q(area,name);if(b)await on(b,'ON_CLICK',actions);}const sw=q(area,'Edit / 切换应用');if(sw)await on(sw,'ON_CLICK',[nodeAction('5:11016','NAVIGATE')]);}
async function wireVoice(v){const t=v.findOne(n=>n.type==='TEXT');if(t){t.setBoundVariable('characters',voiceLabel);t.fills=[bluePaint];}await v.setReactionsAsync([{trigger:{type:'MOUSE_DOWN',delay:0},actions:[setVar(voiceLabel,'松开结束')]},{trigger:{type:'MOUSE_UP',delay:0},actions:[setVar(voiceLabel,'按住说话'),setVar(draft,sample),setVar(empty,false)]},{trigger:{type:'MOUSE_LEAVE',delay:0},actions:[setVar(voiceLabel,'按住说话')]}]);}
await wireDraftTools(bottom);await wireVoice(voice);await on(q(bottom,'Input / send'),'ON_CLICK',[setVar(draft,''),setVar(empty,true)]);
const home=(await get('173:4856')).clone();root.appendChild(home);created.push(home.id);
// Reuse existing keyboard/trackpad panels without copying chat content or chat navigation.
const inputVariants=[];
for(const [index,id]of ['98:5326','29:9738'].entries()){
 const c=(await get(id)).clone();section.appendChild(c);const v=mark(figma.createComponentFromNode(c));created.push(...v.findAll(()=>true).map(n=>n.id));v.name='Mode='+(index?'Trackpad':'Keyboard');v.resize(390,482);v.fills=[solid('#EAF2FA',.98)];v.cornerRadius=28;await clean(v);
 for(const n of v.findAll(n=>n.type==='TEXT')){if(n.boundVariables.characters?.id==='VariableID:173:4708')n.setBoundVariable('characters',draft);if(n.boundVariables.visible?.id==='VariableID:173:4709')n.setBoundVariable('visible',empty);}
 const tr=q(v,'Input / transcript and draft');if(tr)for(const t of tr.findAll(n=>n.type==='TEXT'))t.setBoundVariable('characters',draft);
 await wireDraftTools(v);const voice=q(v,'Input / voice');if(voice)await wireVoice(voice);inputVariants.push(v);
}
const inputSet=mark(figma.combineAsVariants(inputVariants,section));inputSet.name='Doubao / Shared input modes';inputSet.x=540;inputSet.y=1104;inputSet.resize(828,514);inputVariants.forEach((n,i)=>{n.x=16+406*i;n.y=16;});
const overlay=frame(section,'Prototype / shared input panel',390,844);overlay.x=1408;overlay.y=1104;overlay.fills=[];overlay.cornerRadius=0;overlay.clipsContent=true;
const overlayInstance=mark(inputVariants[0].createInstance());overlay.appendChild(overlayInstance);overlayInstance.x=0;overlayInstance.y=362;
const inputMode=variable('input/mode','STRING','Keyboard',['ALL_SCOPES']);
overlayInstance.setProperties({Mode:{type:'VARIABLE_ALIAS',id:inputMode.id}});
for(const [i,v]of inputVariants.entries()){
 for(const [name,target]of [['Input / keyboard option',0],['Input / trackpad option',1]]){const b=q(v,name);if(b)await on(b,'ON_CLICK',i===target?[{type:'CLOSE'}]:[setVar(inputMode,target?'Trackpad':'Keyboard')]);}
}
for(const [name,mode]of [['Input / keyboard','Keyboard'],['Input / trackpad','Trackpad']])await on(q(bottom,name),'ON_CLICK',[setVar(inputMode,mode),{type:'NODE',destinationId:overlay.id,navigation:'OVERLAY',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.16},}]);
const title=txt(section,'豆包 · 自适应入口',22);title.x=64;title.y=40;
for(const [label,x,y]of [['入口组件 · 默认 / 按下 / 选中',540,60],['话题入口 · 仅按下反馈',540,842],['复用输入组件 · 键盘 / 触控板',540,1058]]){const t=txt(section,label,16);t.x=x;t.y=y;}
const note=txt(section,'本轮只提供话题与三项功能入口；相机、画布、附件和话题列表后续设计。',13,muted);note.x=64;note.y=1000;
const note2=txt(section,'原型中的语音与草稿为模拟；复用输入面板不连接真实键盘、设备或豆包服务。',13,muted);note2.x=64;note2.y=1030;
const note3=txt(section,'再次点击已选中的键盘 / 触控板图标可收起输入面板。',13,muted);note3.x=540;note3.y=1652;
section.resizeWithoutConstraints(1840,2040);
const flows=[...figma.currentPage.flowStartingPoints];flows.push({nodeId:root.id,name:'豆包 · 自适应入口'});figma.currentPage.flowStartingPoints=flows;
return{createdNodeIds:[...new Set(created)],mutatedNodeIds:mutated,root:root.id,section:section.id,entries:entries.id,groupSet:groupSet.id,groupVariants:groups.map(n=>n.id),topicSet:topicSet.id,topic:topicInstance.id,bottom:bottom.id,inputSet:inputSet.id,overlay:overlay.id,variables:{draft:draft.id,empty:empty.id,voice:voiceLabel.id,mode:inputMode.id}};
