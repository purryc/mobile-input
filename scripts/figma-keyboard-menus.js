// One-time library revision: symbols, emoji and backspace in the shared keyboard.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('2:2'));
const base=await figma.getNodeByIdAsync('271:4109'),set=base.parent;
for(const t of base.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);
await figma.loadFontAsync({family:'Noto Color Emoji',style:'Regular'});
const created=[],mutated=[],removed=[];
const keyTemplate=base.children[0].children[0].clone();
const mark=n=>(created.push(n.id),n);
function key(row,label,width=48,emoji=false){const n=mark(keyTemplate.clone());row.appendChild(n);n.name=label==='⌫'?'Backspace':label==='☺'?'Emoji menu':label==='123'?'Symbols menu':'Key / '+label;n.setProperties({[Object.keys(n.componentProperties).find(k=>k.startsWith('Label#'))]:label});n.resize(width,48);n.layoutSizingHorizontal='FIXED';const t=n.findOne(n=>n.type==='TEXT');if(emoji){t.fontName={family:'Noto Sans SC',style:'Regular'};t.fontSize=24;}return n;}
function rowContent(row,labels,widths,emoji=false){for(const n of [...row.children]){removed.push(n.id);n.remove();}row.itemSpacing=2;row.primaryAxisAlignItems='CENTER';return labels.map((label,i)=>key(row,label,widths?.[i]??(336-(labels.length-1)*2)/labels.length,emoji&&label!=='⌫'));}
const defaultRows=base.children.slice(0,3);
rowContent(defaultRows[2],['↑','Z','X','C','V','B','N','M','⌫'],[48,32,32,32,32,32,32,32,48]);
const footer=base.children[3],oldMode=footer.children[0],space=footer.children[1];removed.push(oldMode.id);oldMode.remove();
const symbol=key(footer,'123'),emoji=key(footer,'☺');footer.insertChild(0,symbol);footer.insertChild(1,emoji);space.resize(128,56);space.layoutSizingHorizontal='FIXED';
mutated.push(base.id,defaultRows[2].id,footer.id,space.id);
const variants={Default:base};
for(const state of ['Symbols','SymbolsMore','Emoji']){const c=mark(base.clone());set.appendChild(c);c.name='Skin=Glass, State='+state;variants[state]=c;}
rowContent(variants.Symbols.children[0],Array.from('1234567890'));
rowContent(variants.Symbols.children[1],['@','#','¥','%','&','*','（','）','—']);
rowContent(variants.Symbols.children[2],['#+=','。','，','？','！','、','：','；','⌫'],[48,32,32,32,32,32,32,32,48]);
rowContent(variants.SymbolsMore.children[0],['[',']','{','}','<','>','+','=','×','÷']);
rowContent(variants.SymbolsMore.children[1],['$','€','£','₩','_','/','\\','|','~']);
rowContent(variants.SymbolsMore.children[2],['123','…','·','^','°','“','”','～','⌫'],[48,32,32,32,32,32,32,32,48]);
for(const [i,labels]of [['😀','😄','😂','🥰','😍','😎'],['😊','🤔','🥹','😭','😮','🙌'],['👍','👏','🙏','❤️','🎉','⌫']].entries())rowContent(variants.Emoji.children[i],labels,null,true);
async function go(n,target){await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:target.id,navigation:'CHANGE_TO',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.12},resetVideoPosition:false}]}]);mutated.push(n.id);}
function relabel(n,label){n.setProperties({[Object.keys(n.componentProperties).find(k=>k.startsWith('Label#'))]:label});n.name='Menu / '+label;}
for(const [state,c]of Object.entries(variants)){const f=c.children[3];if(state==='Default'){await go(f.children[0],variants.Symbols);await go(f.children[1],variants.Emoji);}else if(state==='Emoji'){relabel(f.children[0],'ABC');relabel(f.children[1],'123');await go(f.children[0],base);await go(f.children[1],variants.Symbols);}else{relabel(f.children[0],'ABC');await go(f.children[0],base);await go(f.children[1],variants.Emoji);await go(c.children[2].children[0],state==='Symbols'?variants.SymbolsMore:variants.Symbols);}c.x=32+Object.keys(variants).indexOf(state)*378;c.y=48;}
keyTemplate.remove();
set.resize(1544,322);set.description='Liquid Glass keyboard. Default / Symbols / SymbolsMore / Emoji share one 354×234 region. 123 and emoji menus replace only key content; ABC returns. Backspace appears in every mode. Voice and send stay on the space row. Text entry remains local runtime behavior.';mutated.push(set.id);
// Keep the existing reference URL and showcase all menu states as instances.
const gallery=await figma.getNodeByIdAsync('274:10646'),card=gallery.parent,board=card.parent;
const wrappers=[...gallery.children];gallery.layoutMode='VERTICAL';gallery.itemSpacing=16;gallery.resize(808,484);gallery.primaryAxisSizingMode='FIXED';
function layoutRow(){const r=mark(figma.createAutoLayout('HORIZONTAL'));r.fills=[];r.resize(808,234);r.primaryAxisSizingMode='FIXED';r.counterAxisSizingMode='FIXED';r.itemSpacing=48;gallery.appendChild(r);return r;}
const first=layoutRow();for(const w of wrappers)first.appendChild(w);wrappers[1].children[0].swapComponent(variants.Symbols);
const second=layoutRow();for(const state of ['Emoji','SymbolsMore']){const w=mark(wrappers[0].clone());second.appendChild(w);w.children[0].swapComponent(variants[state]);}
gallery.name='Liquid Glass / Letters · Symbols · Emoji';card.resize(856,700);
for(const n of board.children)if(n!==card&&n.y>=636){n.y+=224;mutated.push(n.id);}board.resizeWithoutConstraints(2800,1874);
const caption=await figma.getNodeByIdAsync('274:10805');await figma.loadFontAsync(caption.fontName);caption.characters='字母 / 符号 / Emoji · 菜单原位切换 · 退格键 · 语音与空格同排';
mutated.push(gallery.id,card.id,board.id,caption.id,wrappers[1].children[0].id);
const issues=[];for(const [state,c]of Object.entries(variants))for(const row of c.children)for(const n of row.children)if(n.x<-.5||n.x+n.width>row.width+.5||n.y+n.height>row.height+.5)issues.push([state,n.id]);
return {createdNodeIds:created,mutatedNodeIds:mutated,removedNodeIds:removed,variants:Object.fromEntries(Object.entries(variants).map(([s,c])=>['Glass/'+s,c.id])),issues};
