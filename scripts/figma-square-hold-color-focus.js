// Figma-only correction: concentric color focus and square hold control.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const get=id=>figma.getNodeByIdAsync(id),changed=[],created=[],removed=[];
for(const id of ['178:2667','178:2674']){
 const n=await get(id);for(const t of n.findAll(n=>n.type==='TEXT'))for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);
 n.resize(168,168);n.cornerRadius=24;changed.push(id);
}
const hold=await get('142:5447');hold.x=200;hold.y=576;hold.resize(168,168);hold.cornerRadius=24;changed.push(hold.id);
const instance=await get('178:2682');instance.resize(168,168);instance.cornerRadius=24;changed.push(instance.id);
const button=await get('165:6081'),dot=await get('165:6082'),ring=await get('188:2436');
const focus=figma.createAutoLayout('HORIZONTAL');button.appendChild(focus);focus.name='Color / concentric focus';focus.resize(28,28);focus.primaryAxisSizingMode='FIXED';focus.counterAxisSizingMode='FIXED';focus.primaryAxisAlignItems='CENTER';focus.counterAxisAlignItems='CENTER';focus.paddingLeft=0;focus.paddingRight=0;focus.paddingTop=0;focus.paddingBottom=0;focus.itemSpacing=0;focus.cornerRadius=14;focus.fills=[];focus.strokes=JSON.parse(JSON.stringify(ring.strokes));focus.strokeWeight=1.5;focus.strokeAlign='INSIDE';created.push(focus.id);
focus.appendChild(dot);dot.layoutPositioning='AUTO';dot.resize(18,18);changed.push(dot.id);
removed.push(ring.id);ring.remove();button.primaryAxisAlignItems='CENTER';button.counterAxisAlignItems='CENTER';button.paddingLeft=0;button.paddingRight=0;button.paddingTop=0;button.paddingBottom=0;button.itemSpacing=0;changed.push(button.id);
const center=n=>{const b=n.absoluteBoundingBox;return {x:b.x+b.width/2,y:b.y+b.height/2};};
return{createdNodeIds:created,mutatedNodeIds:changed,removedNodeIds:removed,focusCenter:center(focus),dotCenter:center(dot),hold:{size:168,radius:24,x:hold.x,y:hold.y},states:['178:2667','178:2674']};
