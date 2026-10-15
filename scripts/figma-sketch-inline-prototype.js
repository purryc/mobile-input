await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const set=await figma.getNodeByIdAsync('1286:6160'),changed=[],created=[],removed=[];
const state=c=>c.name.match(/State=([^,]+)/)?.[1],mode=c=>c.name.match(/Input=([^,]+)/)?.[1];
const lookup=(s,m)=>set.children.find(c=>state(c)===s&&mode(c)===m);
async function link(n,dest,type='ON_CLICK'){if(!n||!dest)return;await n.setReactionsAsync([{trigger:{type},actions:[{type:'NODE',destinationId:dest.id,navigation:'CHANGE_TO',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_OUT'},duration:.22},resetVideoPosition:false}]}]);}
const composerMaster=await figma.getNodeByIdAsync('1401:45573');
for(const c of set.children){const s=state(c),m=mode(c);if(!['Sketch','SketchConfirmed','RecognizeLayout','Review'].includes(s))continue;
 const mid=c.children.find(n=>n.name.startsWith('02 ·')),scroll=mid.children.find(n=>n.name==='Adaptive / scrolling tools');
 if(s==='Sketch'||s==='RecognizeLayout'){
  const panel=c.findOne(n=>n.name==='layout-intent');await panel.setReactionsAsync([]);
  const board=panel.findOne(n=>n.name==='Layout / raw sketch'),check=panel.findOne(n=>n.name==='Layout / confirm sketch');
  if(s==='Sketch')await link(check,lookup('SketchConfirmed',m));else await link(board,lookup('Sketch',m),'ON_DRAG');
  if(m!=='Minimized'){
   panel.resize(354,s==='Sketch'?232:144);board.resize(330,s==='Sketch'?148:60);
   if(s==='RecognizeLayout')board.clipsContent=true;
  }
  changed.push(panel.id,board.id,check.id);
 }
 if(s==='SketchConfirmed'||s==='Review'){
  const old=mid.children.find(n=>n.name==='Adaptive / sole composer'),editor=composerMaster.createInstance();mid.appendChild(editor);editor.name='Adaptive / sole composer';editor.x=18;editor.y=s==='SketchConfirmed'?8:mid.height-238;
  const body=editor.children.find(n=>n.type==='TEXT');for(const f of body.getRangeAllFontNames(0,body.characters.length))await figma.loadFontAsync(f);body.characters='创建一份公司 Roadmap PPT，主色用红色。\n左侧是季度里程碑，右侧展示关键成果。';
  const attachment=editor.findOne(n=>n.name==='Composer / sketch attachment');await link(attachment,lookup('Sketch',m));
  const send=editor.findOne(n=>n.name==='Composer / send');if(s==='SketchConfirmed')await link(send,lookup('Review',m));else{send.setProperties({State:'Disabled'});await send.setReactionsAsync([]);}
  if(s==='SketchConfirmed'){scroll.visible=false;}else scroll.resize(354,Math.max(64,editor.y-12));
  removed.push(old.id);old.remove();created.push(editor.id);changed.push(c.id,scroll.id,body.id,attachment.id,send.id);
 }
}
return {changed,created,removed,confirmed:'1387:48245',before:'1286:3151'};
