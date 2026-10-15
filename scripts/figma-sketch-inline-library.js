// Targeted hand-drawn attachment revision. Inspect live nodes before replay.
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('2:2'));
const get=id=>figma.getNodeByIdAsync(id),changed=[],created=[],removed=[];
const set=await get('1368:22768');
async function fonts(n){for(const t of n.findAllWithCriteria({types:['TEXT']}))for(const f of t.getRangeAllFontNames(0,t.characters.length))await figma.loadFontAsync(f);}
async function link(n,dest,type='ON_CLICK'){let p=n;while(p&&p.type!=='COMPONENT')p=p.parent;if(p?.id===dest)return;await n.setReactionsAsync([{trigger:{type},actions:[{type:'NODE',destinationId:dest,navigation:'CHANGE_TO',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_OUT'},duration:.2},resetVideoPosition:false}]}]);}
for(const c of set.children){
 await fonts(c);const row=c.findOne(n=>n.name==='Layout / tools'),board=c.findOne(n=>n.name==='Layout / raw sketch'),confirm=c.findOne(n=>n.name==='Layout / advance');
 confirm.swapComponent(await get(c.name==='State=Detected'?'270:3333':'270:3328'));confirm.name='Layout / confirm sketch';
 const prop=Object.keys(confirm.componentProperties).find(k=>k.startsWith('Icon#'));confirm.setProperties({[prop]:'4:133'});confirm.resize(48,48);
 const spacer=figma.createAutoLayout('HORIZONTAL');spacer.name='Layout / toolbar spacer';spacer.resize(50,48);spacer.fills=[];row.appendChild(spacer);row.appendChild(confirm);spacer.layoutSizingHorizontal='FILL';created.push(spacer.id);
 board.resize(330,244);await confirm.setReactionsAsync([]);
 if(c.name!=='State=Detected'&&c.name!=='State=Confirmed')await link(confirm,'1368:22720');
 if(c.name==='State=Detected')await link(board,'1368:22625','ON_DRAG');
 c.description='Top-right check confirms the sketch and inserts its thumbnail into the sole composer. Confirmation never submits the task. Empty canvas cannot confirm. Original strokes remain editable.';
 changed.push(c.id,row.id,board.id,confirm.id);
}
const source=await get('1387:49244');await fonts(source);const composer=source.clone(),host=source.parent;host.appendChild(composer);composer.name='State=SketchAttached';composer.resize(354,226);composer.x=Math.max(...host.children.filter(n=>n.id!==composer.id).map(n=>n.x+n.width))+24;composer.y=48;host.resize(composer.x+378,306);created.push(composer.id);
const body=composer.children.find(n=>n.type==='TEXT');body.characters='左侧是季度里程碑，右侧展示关键成果。';body.resize(326,52);body.textAutoResize='HEIGHT';
const chip=composer.children.find(n=>n.name==='inline-color');chip.y=166;
const send=composer.children.find(n=>n.name==='Composer / send');send.y=166;
const thumb=figma.createComponent();thumb.name='Input / Sketch attachment';thumb.resize(132,96);thumb.fills=[];thumb.cornerRadius=12;thumb.clipsContent=true;
const raw=(await get('1368:22754')).clone();thumb.appendChild(raw);raw.rescale(.36);raw.x=6;raw.y=4;raw.name='Sketch / original strokes and interpretation';
const masterHost=await get('277:15031');masterHost.appendChild(thumb);thumb.x=1840;thumb.y=host.y;created.push(thumb.id,...thumb.findAll(()=>true).map(n=>n.id));
const attachment=thumb.createInstance();attachment.name='Composer / sketch attachment';composer.appendChild(attachment);attachment.x=12;attachment.y=64;created.push(attachment.id);
composer.description='Text and sketch attachment share one composer. Clicking the sketch reopens editing; confirming replaces this attachment rather than duplicating it. Send remains a separate action.';
const showcase=await get('1368:22778'),sample=composer.createInstance();sample.name='Composer / confirmed sketch example';showcase.appendChild(sample);sample.x=2160;sample.y=660;created.push(sample.id);
changed.push(host.id,body.id,chip.id,send.id);
return {changed,created,removed,attachmentComponent:thumb.id,composerVariant:composer.id,showcase:sample.id};
