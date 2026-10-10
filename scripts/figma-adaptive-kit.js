// Shared Figma construction helpers. Inject `ds` from the external state ledger.
const page=await figma.getNodeByIdAsync('2:2');await figma.setCurrentPageAsync(page);
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:'Noto Sans SC',style});
const created=[],mutated=[],roots=[];const V={};for(const [k,id]of Object.entries(ds.variables))V[k]=await figma.variables.getVariableByIdAsync(id);
const A={};for(const a of ds.assets)A[a.name]=await figma.getNodeByIdAsync(a.id);
const F=ds.families||{};let cy=ds.cursorY||100;
const track=n=>(created.push(n.id),n);
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const solid=(h,a=1)=>({type:'SOLID',color:rgb(h),opacity:a});
const paint=(key,opacity=1)=>({...figma.variables.setBoundVariableForPaint(solid('#FFFFFF'),'color',V[key]),opacity});
function bind(n,k,key){if(V[key])n.setBoundVariable(k,V[key]);}
function mode(n,skin,theme){if(skin)n.setExplicitVariableModeForCollection(ds.collections.material,ds.modes.material[skin]);if(theme)n.setExplicitVariableModeForCollection(ds.collections.theme,ds.modes.theme[theme]);}
function txt(s,style='Body',key='text/ink',w){const t=track(figma.createText());t.name='Text';t.fontName={family:'Noto Sans SC',style:'Regular'};t.textStyleId=ds.styles[style];t.characters=s;t.fills=[paint(key)];t.textAutoResize='WIDTH_AND_HEIGHT';if(w){t.textAutoResize='HEIGHT';t.resize(w,t.height);}return t;}
function box(name,w,h,dir='HORIZONTAL',gap=8){const n=track(figma.createAutoLayout(dir));n.name=name;n.resize(w,h);n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.fills=[];n.itemSpacing=gap;bind(n,'itemSpacing','space/'+gap);n.counterAxisAlignItems='CENTER';return n;}
function pad(n,x,y=x){n.paddingLeft=n.paddingRight=x;n.paddingTop=n.paddingBottom=y;for(const k of ['paddingLeft','paddingRight'])bind(n,k,'space/'+x);for(const k of ['paddingTop','paddingBottom'])bind(n,k,'space/'+y);}
function fill(n){n.layoutSizingHorizontal='FILL';}
function shape(w,h,key='surface/well',r=8){const n=track(figma.createRectangle());n.resize(w,h);n.fills=[paint(key)];n.cornerRadius=r;return n;}
function surface(n,skin,state='Default',key='surface/surface',radius='radius/control'){mode(n,skin);n.fills=[paint(key)];n.strokes=[paint(state==='Selected'?'theme/accent':'surface/border')];n.strokeWeight=state==='Selected'?1.5:1;bind(n,'cornerRadius',radius);n.effectStyleId=ds.effects[skin==='Mechanical'&&state==='Pressed'?'Mechanical pressed':skin];if(state==='Disabled')n.opacity=.4;}
function icon(name,size=22,key='text/ink'){const source=A['Icon/'+name];if(!source)throw new Error('Missing icon '+name);const i=track(source.createInstance());i.name='Icon';i.resize(size,size);for(const v of i.findAllWithCriteria({types:['VECTOR','RECTANGLE','ELLIPSE','LINE']})){if(v.strokes.length)v.strokes=[paint(key)];if(v.fills.length)v.fills=[paint(key)];}return i;}
function expose(c,t,name='Label'){t.name=name;const k=c.addComponentProperty(name,'TEXT',t.characters);t.componentPropertyReferences={...t.componentPropertyReferences,characters:k};}
function exposeIcon(c,i){const k=c.addComponentProperty('Icon','INSTANCE_SWAP',i.mainComponent.id);i.componentPropertyReferences={...i.componentPropertyReferences,mainComponent:k};}
function label(c,s,style='Label',key='text/ink',w){const t=txt(s,style,key,w);c.appendChild(t);expose(c,t);return t;}
function section(name,x,y,w,h){const n=track(figma.createSection());n.name=name;n.resizeWithoutConstraints(w,h);n.fills=[solid('#E9EDF0')];page.appendChild(n);n.x=x;n.y=y;roots.push(n.id);return n;}
function place(n,p,x,y){p.appendChild(n);n.x=x;n.y=y;return n;}
async function inst(id,skin='Glass',state,opts={}){const f=F[id];const v=await figma.getNodeByIdAsync(f.variants[skin+'/'+(state||f.states[0])]);const i=track(v.createInstance());i.name=id;if(opts.label){const prop=Object.keys(i.componentProperties).find(k=>k.startsWith('Label#'));if(prop)i.setProperties({[prop]:opts.label});}if(opts.icon){const prop=Object.keys(i.componentProperties).find(k=>k.startsWith('Icon#'));if(prop)i.setProperties({[prop]:A['Icon/'+opts.icon].id});}if(opts.w)i.resize(opts.w,i.height);return i;}
async function react(n,dest,type='ON_CLICK',duration=.16,navigation='CHANGE_TO'){let owner=n;while(owner&&owner.type!=='COMPONENT')owner=owner.parent;if(owner&&owner.id===dest)return;await n.setReactionsAsync([{trigger:type==='MOUSE_UP'?{type,delay:0}:type==='MOUSE_LEAVE'?{type,delay:0}:{type},actions:[{type:'NODE',destinationId:dest,navigation,transition:{type:'SMART_ANIMATE',easing:{type:'EASE_OUT'},duration},resetVideoPosition:false}]}]);}
async function family(id,name,w,h,states,build,actions=[],caps=[]){if(F[id])return F[id];const nodes=[],map={};for(const skin of ['Glass','Mechanical'])for(const state of states){const c=track(figma.createComponent());c.name=`Skin=${skin}, State=${state}`;c.resize(w,h);c.layoutMode='VERTICAL';c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.counterAxisAlignItems='CENTER';c.itemSpacing=8;bind(c,'itemSpacing','space/8');c.fills=[];page.appendChild(c);mode(c,skin);await build(c,skin,state);nodes.push(c);map[skin+'/'+state]=c.id;}
const set=track(figma.combineAsVariants(nodes,page));set.name='Adaptive / '+name;set.description=JSON.stringify({componentId:id,actions,capabilities:caps,skinIndependentOfTheme:true});set.x=9800;set.y=cy;const cols=states.length;nodes.forEach((n,i)=>{n.x=32+(i%cols)*(w+24);n.y=48+Math.floor(i/cols)*(h+40);});set.resize(cols*(w+24)+40,2*(h+40)+64);cy+=set.height+100;roots.push(set.id);F[id]={id:set.id,name,w,h,states,variants:map,actions,capabilities:caps};
return F[id];}
function result(extra={}){return{createdNodeIds:created,mutatedNodeIds:mutated,families:F,cursorY:cy,roots,...extra};}
