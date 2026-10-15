await figma.setCurrentPageAsync(await figma.getNodeByIdAsync('0:1'));
const changed=[],removed=[],get=id=>figma.getNodeByIdAsync(id),set=await get('1286:6160');
const state=c=>c.name.match(/State=([^,]+)/)?.[1],mode=c=>c.name.match(/Input=([^,]+)/)?.[1];
const running=m=>set.children.find(c=>state(c)==='Running'&&mode(c)===m);
async function label(n,value){for(const f of n.getRangeAllFontNames(0,n.characters.length))await figma.loadFontAsync(f);n.characters=value;changed.push(n.id);}
const reviewIds=['1286:3334','1304:7360','1375:46465'];
for(const c of set.children){
 const m=mode(c),r=running(m);if(!r)continue;
 for(const n of c.findAll(n=>'reactions'in n)){
  const rs=n.reactions;if(!rs.some(x=>(x.actions||[]).some(a=>reviewIds.includes(a.destinationId))))continue;
  // A send is the explicit submit. Return/edit actions retain the editable draft destination.
  if(n.name!=='Composer / send')continue;
  await n.setReactionsAsync(rs.map(x=>({trigger:x.trigger,actions:(x.actions||[]).map(a=>reviewIds.includes(a.destinationId)?{...a,destinationId:r.id}:a)})));changed.push(n.id);
 }
 if(reviewIds.includes(c.id)){
  c.name=c.name.replace('State=Review','State=DraftReady');const mid=c.children.find(n=>n.name.startsWith('02 ·')),scroll=mid.children.find(n=>n.name==='Adaptive / scrolling tools');
  for(const n of [...scroll.children]){removed.push(n.id);n.remove();}scroll.visible=false;
  const composer=mid.children.find(n=>n.name==='Adaptive / sole composer');composer.y=8;
  const send=composer.findOne(n=>n.name==='Composer / send');send.setProperties({State:'Selected'});await send.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:r.id,navigation:'CHANGE_TO',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.2},resetVideoPosition:false}]}]);changed.push(c.id,scroll.id,composer.id,send.id);
 }
 if(state(c)==='TasksFromReview'){c.name=c.name.replace('TasksFromReview','TasksFromDraftReady');changed.push(c.id);}
}
const frame=await get('1286:6473');frame.name='workbuddy-07-draft-ready';changed.push(frame.id);
await label(await get('1372:26271'),'07 · 框内检查与发送');
await label(await get('1372:25301'),'颜色、文字与草图累积到同一文本框；检查后点击框内发送，直接发起任务。');
const bili=await get('1358:12211');
for(const n of bili.children.filter(n=>n.type==='FRAME'&&n.name.startsWith('BILI-'))){
 for(const t of n.findAllWithCriteria({types:['TEXT']}))if(!t.id.startsWith('I')&&/对当前视频操作|语音先进入|使用当前登录账号发布|提交中防重复|状态以回执|换视频后必须|停止录音不会/.test(t.characters)){removed.push(t.id);t.remove();}
 for(const i of n.findAllWithCriteria({types:['INSTANCE']}))if(i.name==='Adaptive / Media / MEDIA-01 Video controls'){i.resize(354,170);changed.push(i.id);}
}
return {changed,removed};
