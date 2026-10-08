// Inputs: S = merged screen ledger. Native Figma prototype, all integrations simulated.
const page=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(page);
const links=[],missing=[];
async function link(from,key,to,type='ON_CLICK',duration=.32){if(from===to)return;const id=S.hotspots[from]?.[key];if(!id||!S.screens[to]){missing.push({from,key,to});return;}const n=await figma.getNodeByIdAsync(id);const trigger=['MOUSE_DOWN','MOUSE_UP'].includes(type)?{type,delay:0}:{type};await n.setReactionsAsync([{trigger,actions:[{type:'NODE',destinationId:S.screens[to],navigation:'NAVIGATE',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_IN_AND_OUT'},duration},resetScrollPosition:false}]}]);links.push({from,key,to,nodeId:id,type});}
for(const [s,h]of Object.entries(S.hotspots)){
 if(h.switch)await link(s,'switch',s==='wechat-record'?'wechat-record':s==='wechat-draft'?'wechat-pending-app':'chooser');
 if(s.startsWith('wechat')||s==='feishu-task'||s.startsWith('gaode')){
  if(h.lock)await link(s,'lock',s==='wechat-locked'?'wechat-return':'wechat-locked');
  if(h.voice)await link(s,'voice',s==='wechat-record'?'wechat-edit':'wechat-record');
  if(h.keyboard)await link(s,'keyboard',s==='wechat-keyboard'?'wechat-draft':'wechat-keyboard');
  if(h.draft)await link(s,'draft',s==='wechat-draft'?'wechat-selection':'wechat-draft');
  if(h['tool/ClipboardList'])await link(s,'tool/ClipboardList','wechat-clipboard');
  if(h['tool/Touchpad'])await link(s,'tool/Touchpad','wechat-trackpad');
  if(h['tool/Copy'])await link(s,'tool/Copy','wechat-copied');
  if(h['tool/ClipboardPaste'])await link(s,'tool/ClipboardPaste','wechat-pasted');
  if(h['tool/Undo2']&&s!=='wechat')await link(s,'tool/Undo2','wechat-draft');
  if(h['tool/Redo2']&&s!=='wechat')await link(s,'tool/Redo2','wechat-applied');
  for(const key of ['polish','shorten','translate'])if(h[key])await link(s,key,s==='wechat-selection'?'wechat-selection-preview':'wechat-preview');
  if(h.send&&s!=='wechat')await link(s,'send',s==='wechat-record'?'wechat-edit':'wechat-send-preview');
 }
 if(s.startsWith('presentation')){
  for(const [key,to]of Object.entries({laser:'presentation',pen:'presentation-pen',notes:'presentation-notes',next:'presentation-next',previous:'presentation',center:'presentation-center',speed:s==='presentation-notes-fast'?'presentation-notes':'presentation-notes-fast',manual:'presentation',color:'presentation-settings',width:'presentation-settings',undo:'presentation-pen',clear:'presentation-cleared'}))if(h[key])await link(s,key,to);
  if(h.hold)await link(s,'hold',s==='presentation-pen'||s==='presentation-blue'?'presentation-ink':'presentation-held','MOUSE_DOWN',.08);
 }
 if(s.startsWith('game')){
  if(h.START)await link(s,'START',s==='game-paused'?'game':'game-paused');
  if(h.SELECT)await link(s,'SELECT','game-paused');
  if(s==='game'){await link(s,'right','game-held','MOUSE_DOWN',.08);await link(s,'A','game-held','MOUSE_DOWN',.08);}
 }
}
const explicit=[
 ['wechat','reply1','wechat-draft'],['wechat','reply2','wechat-reply2'],['wechat','task','wechat-task'],['wechat','map','gaode-preview'],
 ['wechat-return','reply1','wechat-draft'],['wechat-return','reply2','wechat-reply2'],['wechat-return','task','wechat-task'],['wechat-return','map','gaode-preview'],
 ['wechat-locked','reply1','wechat-draft'],['wechat-locked','reply2','wechat-reply2'],['wechat-locked','task','wechat-task'],['wechat-locked','map','gaode-preview'],
 ['wechat-preview','apply','wechat-applied'],['wechat-preview','cancel','wechat-edit'],['wechat-selection-preview','apply','wechat-selection-applied'],['wechat-selection-preview','cancel','wechat-selection'],
 ['wechat-send-preview','apply','wechat-sent'],['wechat-send-preview','cancel','wechat-applied'],['wechat-sent','return','wechat'],
 ['wechat-task','open','feishu-task'],['wechat-task','missing','wechat-missing'],['wechat-missing','fill','wechat-task'],['feishu-task','return','wechat-return'],
 ['gaode-preview','open','gaode-route'],['gaode-preview','missing','wechat'],['gaode-route','open','wechat-return'],['gaode-route','missing','wechat-return'],
 ['wechat-target','keep','wechat-draft'],['wechat-target','new','wechat-quiet'],['wechat-disconnect','retry','wechat-draft'],['wechat-failed','retry','wechat-sent'],
 ['wechat-clipboard','paste','wechat-pasted'],['wechat-clipboard','paste2','wechat-pasted'],['wechat-clipboard','return','wechat-draft'],['wechat-trackpad','return','wechat-draft'],['wechat-keyboard','return','wechat-draft'],
 ['wechat-pending-app','translate','presentation'],
 ['email','reply1','email-edit'],['email','reply2','email-edit'],['email','tone','email-edit'],['email','attach','email-attachment'],['email-edit','polish','email-preview'],['email-edit','shorten','email-preview'],['email-edit','translate','email-preview'],['email-edit','preview','email-preview'],['email-edit','send','email-preview'],['email-preview','confirm','email-sent'],['email-sent','return','email'],['email-attachment','confirm','email-edit'],
 ['workbuddy','start','workbuddy-running'],['workbuddy','start2','workbuddy-running'],['workbuddy','requirements','workbuddy-running'],['workbuddy-running','approval','workbuddy-approval'],['workbuddy-running','stop','workbuddy-stop'],['workbuddy-approval','confirm','workbuddy-done'],['workbuddy-approval','stop','workbuddy-stop'],['workbuddy-done','return','workbuddy'],['workbuddy-stop','return','workbuddy'],
 ['word','rewrite','word-preview'],['word','rewrite2','word-preview'],['word','format','word-format'],['word','format2','word-format'],['word-preview','apply','word-applied'],['word-preview','cancel','word'],['word-applied','undo','word'],['word-format','apply','word-applied'],['word-format','cancel','word'],
 ['sheet','sum','sheet-preview'],['sheet','average','sheet-average'],['sheet','fill','sheet-fill'],['sheet-preview','apply','sheet-applied'],['sheet-average','apply','sheet-applied'],['sheet-fill','apply','sheet-applied'],['sheet-applied','undo','sheet'],
 ['presentation-settings','notes','presentation-blue'],['game-paused','resume','game'],['game-disconnect','reconnect','game-paused']
];for(const [s,k,to]of explicit)await link(s,k,to);
for(const key of ['wechat','email','workbuddy','word','sheet','presentation','game'])await link('chooser',key,key);
for(const [state,to]of [['presentation-held','presentation'],['presentation-ink','presentation-pen'],['game-held','game']]){const root=await figma.getNodeByIdAsync(S.screens[state]);await root.setReactionsAsync([{trigger:{type:'MOUSE_UP',delay:0},actions:[{type:'NODE',destinationId:S.screens[to],navigation:'NAVIGATE',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.08}}]}]);links.push({from:state,key:'release-anywhere',to,type:'MOUSE_UP',nodeId:root.id});}
page.flowStartingPoints=[...['wechat','email','workbuddy','word','sheet','presentation','game','wechat-quiet','wechat-target','wechat-disconnect','wechat-failed','wechat-pending-app','game-disconnect'].map(k=>({nodeId:S.screens[k],name:({'wechat':'01 微信 · 回复与跨应用','email':'02 Email','workbuddy':'03 WorkBuddy','word':'04 WPS 文字','sheet':'05 WPS 表格','presentation':'06 演讲 · 指向与提词','game':'07 FC 游戏'})[k]||k}))];
return {linkCount:links.length,mutatedNodeIds:[...new Set(links.map(l=>l.nodeId))],missing,flowCount:page.flowStartingPoints.length};
