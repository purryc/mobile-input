// Figma-only foundations. Prepend token-helpers.js and inventory from discovery.
const page = await figma.getNodeByIdAsync('2:2');
await figma.setCurrentPageAsync(page);
for (const style of ['Regular','Medium','Bold']) await figma.loadFontAsync({family:'Noto Sans SC',style});
const prior=await figma.variables.getLocalVariableCollectionsAsync();
if(prior.some(c=>c.name==='Adaptive / Material')) throw new Error('Foundations already exist: resume from ledger.');
const prim=await figma.variables.getVariableCollectionByIdAsync(inventory.collections.find(c=>c.name==='Mobile Input / Primitives').id);
const newColors={paper:'#F4F6F8',glass:'#FFFFFFBB',glassStrong:'#F7FBFBEF',glassLine:'#FFFFFF',mech:'#EAE7E0',mechStrong:'#F7F4ED',mechLine:'#B8B6AF',mechInk:'#303733',mechMuted:'#626963',well:'#D4D4CD',blue:'#347DDD',blueSoft:'#E4EEFC',greenSoft:'#E1F3EC',orangeSoft:'#FBE7E1',tealSoft:'#E0EFEC',cream:'#F2E9D5',held:'#A52D20',cyan:'#78B6DA',lilac:'#B3A1EA',warning:'#95601E',neutral:'#DCE6EC'};
const newPrim=await createSemanticTokens(prim,{Value:prim.modes[0].modeId},Object.entries(newColors).map(([k,v])=>({name:'adaptive/'+k,type:'COLOR',values:{Value:v},scopes:[],codeSyntax:{WEB:'var(--mi-adaptive-'+k+')'}})));
const old=(name)=>inventory.vars.find(v=>v.c===prim.id&&v.name==='palette/'+name).id;
const p=(name)=>newPrim.variables['adaptive/'+name].id;
const alias=id=>({type:'VARIABLE_ALIAS',id});
const material=await createVariableCollection('Adaptive / Material',['Glass','Mechanical']);
const materialMap={surface:['glass','mech'],reading:['glassStrong','mechStrong'],border:['glassLine','mechLine'],canvas:['glassStrong','mechStrong'],well:['neutral','well']};
const mt=Object.entries(materialMap).map(([k,[g,m]])=>({name:'surface/'+k,type:'COLOR',values:{Glass:alias(p(g)),Mechanical:alias(p(m))},scopes:['FRAME_FILL','SHAPE_FILL','STROKE_COLOR'],codeSyntax:{WEB:'var(--mi-surface-'+k+')'}}));
mt.push(...[['ink',old('ink'),p('mechInk')],['muted',old('muted'),p('mechMuted')]].map(([k,g,m])=>({name:'text/'+k,type:'COLOR',values:{Glass:alias(g),Mechanical:alias(m)},scopes:['TEXT_FILL','SHAPE_FILL','STROKE_COLOR'],codeSyntax:{WEB:'var(--mi-text-'+k+')'}})));
const mv=(await createSemanticTokens(material.collection,material.modeIds,mt)).variables;
const themes=['WeChat','Email','WorkBuddy','Word','Sheet','Presentation','Doubao','Mario'];
const tc=await createVariableCollection('Adaptive / Application',themes);
const keys=['wechat','email','workbuddy','word','sheet','presentation',null,'game'];
const soft=['greenSoft','blueSoft','tealSoft','blueSoft','greenSoft','orangeSoft','blueSoft','cream'];
const tv=(await createSemanticTokens(tc.collection,tc.modeIds,[{name:'theme/accent',type:'COLOR',values:Object.fromEntries(themes.map((t,i)=>[t,alias(keys[i]?old(keys[i]):p('blue'))])),scopes:['FRAME_FILL','SHAPE_FILL','STROKE_COLOR','TEXT_FILL'],codeSyntax:{WEB:'var(--mi-theme-accent)'}},{name:'theme/soft',type:'COLOR',values:Object.fromEntries(themes.map((t,i)=>[t,alias(p(soft[i]))])),scopes:['FRAME_FILL','SHAPE_FILL','STROKE_COLOR'],codeSyntax:{WEB:'var(--mi-theme-soft)'}}])).variables;
const sem=await createVariableCollection('Adaptive / Geometry and feedback',['Value']);
const numeric={'space/4':4,'space/8':8,'space/12':12,'space/16':16,'space/24':24,'space/32':32,'radius/key':10,'radius/control':16,'radius/panel':24,'radius/pill':99,'touch/min':48,'touch/primary':56,'touch/hold':168};
const gv=(await createSemanticTokens(sem.collection,sem.modeIds,[...Object.entries(numeric).map(([name,value])=>({name,type:'FLOAT',values:{Value:value},scopes:[name.startsWith('space')?'GAP':name.startsWith('radius')?'CORNER_RADIUS':'WIDTH_HEIGHT'],codeSyntax:{WEB:'var(--mi-'+name.replaceAll('/','-')+')'}})),...Object.entries({error:old('error'),warning:p('warning'),success:old('wechat'),held:p('held'),white:old('white'),cyan:p('cyan'),lilac:p('lilac'),paper:p('paper')}).map(([name,id])=>({name:'feedback/'+name,type:'COLOR',values:{Value:alias(id)},scopes:['TEXT_FILL','FRAME_FILL','SHAPE_FILL','STROKE_COLOR'],codeSyntax:{WEB:'var(--mi-feedback-'+name+')'}}))])).variables;
const styles={};
for(const [name,size,line,weight] of [['Display',48,60,'Bold'],['Section',28,38,'Bold'],['Title',20,28,'Medium'],['Body',16,26,'Regular'],['Label',14,22,'Medium'],['Caption',12,18,'Regular']]){const s=figma.createTextStyle();s.name='Adaptive / '+name;s.fontName={family:'Noto Sans SC',style:weight};s.fontSize=size;s.lineHeight={unit:'PIXELS',value:line};styles[name]=s.id;}
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const effects={Glass:inventory.effects.find(e=>e.name==='Mobile Input / Frosted glass').id};
for(const [name,pressed] of [['Mechanical',false],['Mechanical pressed',true]]){const e=figma.createEffectStyle();e.name='Adaptive / '+name;e.effects=pressed?[{type:'INNER_SHADOW',visible:true,color:{...rgb('#444A45'),a:.22},offset:{x:0,y:3},radius:5,spread:0,blendMode:'NORMAL'}]:[{type:'DROP_SHADOW',visible:true,color:{...rgb('#565B53'),a:.25},offset:{x:0,y:4},radius:0,spread:0,blendMode:'NORMAL'},{type:'DROP_SHADOW',visible:true,color:{...rgb('#626A60'),a:.15},offset:{x:0,y:7},radius:10,spread:0,blendMode:'NORMAL'},{type:'INNER_SHADOW',visible:true,color:{r:1,g:1,b:1,a:.9},offset:{x:0,y:1},radius:1,spread:0,blendMode:'NORMAL'}];effects[name]=e.id;}
return {createdNodeIds:[],mutatedNodeIds:[],collections:{material:material.collection.id,theme:tc.collection.id,geometry:sem.collection.id},modes:{material:material.modeIds,theme:tc.modeIds},variables:Object.fromEntries(Object.entries({...mv,...tv,...gv}).map(([k,v])=>[k,v.id])),styles,effects,primitives:Object.fromEntries(Object.entries(newPrim.variables).map(([k,v])=>[k,v.id])),counts:{newVariables:Object.keys(newPrim.variables).length+Object.keys(mv).length+Object.keys(tv).length+Object.keys(gv).length},assets:inventory.assets,originalRoots:inventory.originalRoots};
