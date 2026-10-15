// One-time in-place design migration; re-read target nodes before replaying.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('2:2'));
const get=id=>figma.getNodeByIdAsync(id), changed=[],removed=[];
const defs=await Promise.all(['1368:22480','1368:22510','1368:22530','1368:22560'].map(get));
for(const c of defs)for(const t of c.findAllWithCriteria({types:['TEXT']}))for(const f of t.getRangeAllFontNames(0,t.characters.length))await figma.loadFontAsync(f);
const title=(await get('1368:22481')).clone(),swatches=(await get('1368:22482')).clone(),area=(await get('1368:22512')).clone(),hue=(await get('1369:23595')).clone(),hex=(await get('1368:22523')).clone(),error=(await get('1368:22580')).clone();
const color=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
async function link(n,dest,type='ON_CLICK'){let owner=n;while(owner&&owner.type!=='COMPONENT')owner=owner.parent;if(owner?.id===dest)return;await n.setReactionsAsync([{trigger:{type},actions:[{type:'NODE',destinationId:dest,navigation:'CHANGE_TO',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_OUT'},duration:.16},resetVideoPosition:false}]}]);}
for(const [i,c]of defs.entries()){
 for(const n of [...c.children]){removed.push(n.id);n.remove();}c.layoutMode='NONE';c.resize(354,328);
 const value=i===0?'#E03131':'#C92A2A';
 function put(source,x,y,w,h){const n=source.clone();c.appendChild(n);n.x=x;n.y=y;if(w)n.resize(w,h);return n;}
 put(title,16,14);const row=put(swatches,16,50,322,48);const sv=put(area,16,106,322,72);put(hue,16,182,322,48);const field=put(hex,16,234,322,48);
 field.name='Color / live HEX';const text=field.findOne(n=>n.type==='TEXT');text.characters=i===3?'#C92A2Z':value;
 const dot=figma.createEllipse();dot.resize(20,20);dot.fills=[{type:'SOLID',color:color(value)}];field.appendChild(dot);dot.layoutPositioning='ABSOLUTE';dot.x=286;dot.y=14;
 const cursor=sv.findOne(n=>n.type==='ELLIPSE');cursor.x=i===0?225:245;cursor.y=i===0?22:36;
 for(const b of row.children){const selected=b.name.endsWith(value),d=b.findOne(n=>n.type==='ELLIPSE');d.strokes=selected?[{type:'SOLID',color:{r:1,g:1,b:1}}]:[];d.strokeWeight=3;if(b.name.endsWith('#C92A2A'))await link(b,defs[2].id);if(b.name.endsWith('#E03131'))await link(b,defs[0].id);}
 await link(sv,defs[2].id,'ON_DRAG');await link(c.findOne(n=>n.name==='Color / hue'),defs[2].id,'ON_DRAG');
 if(i===3)put(error,16,292);c.description='Preset swatches, custom color and HEX share one persistent input container. Valid edits immediately update the draft HEX; no completion step. Invalid HEX preserves the last valid value. Figma simulates discrete values.';changed.push(c.id);
}
for(const n of [title,swatches,area,hue,hex,error])n.remove();
const set=await get('1368:22581');set.resize(set.width,408);
for(const id of ['1368:22814','1368:22842','1368:22862','1368:22890']){const n=await get(id);n.resize(354,328);changed.push(id);}
const note=await get('1387:49296');for(const f of note.getRangeAllFontNames(0,note.characters.length))await figma.loadFontAsync(f);note.characters='颜色值：system_default → user_edit\n预设色、调色与 HEX 同区；合法值实时回写\n选色无需完成，不提交任务\n手动值优先；非法 HEX 保留最后合法值\n提交：框内发送 → 核对 → 提交任务\n手机顶部：任务色点＋简要状态\nPC：执行步骤、日志和成果详情\n文本框仅承载输入，不放 Agent 状态';changed.push(note.id);
return {changed,removed};
