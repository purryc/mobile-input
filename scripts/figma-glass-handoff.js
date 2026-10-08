// Inputs: L and S ledgers. Organizes editable review boards and motion specifications.
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:L.font,style});
const page=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(page);
const created=[],mutated=[],extraScreens={},extraHotspots={};
const t=(value,size=16,color='#536C7B')=>{const n=figma.createText();n.fontName={family:L.font,style:size>=26?'Bold':'Regular'};n.fontSize=size;n.characters=value;n.fills=[{type:'SOLID',color:{r:parseInt(color.slice(1,3),16)/255,g:parseInt(color.slice(3,5),16)/255,b:parseInt(color.slice(5,7),16)/255}}];n.textAutoResize='WIDTH_AND_HEIGHT';created.push(n.id);return n;};
function at(p,n,x,y){p.appendChild(n);n.x=x;n.y=y;return n;}
function replace(f,a,b){for(const n of f.findAll(n=>n.type==='TEXT'&&n.characters===a))n.characters=b;}
async function copy(from,key){const src=await figma.getNodeByIdAsync(S.screens[from]),n=src.clone();n.name=key;page.appendChild(n);created.push(n.id);const map={};function pair(a,b){map[a.id]=b.id;if(a.children)for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i]);}pair(src,n);extraScreens[key]=n.id;extraHotspots[key]=Object.fromEntries(Object.entries(S.hotspots[from]).map(([k,v])=>[k,map[v]]));return n;}
const negative=await copy('wechat-quiet','wechat-negated');replace(negative,'哈哈，收到啦。','酒店先别订，我已经安排好了。');replace(negative,'随时开始回复','');
const newchat=await copy('wechat-quiet','wechat-new-chat');replace(newchat,'陈思 · 项目讨论','周宁 · 新会话');replace(newchat,'哈哈，收到啦。','明天的会面地点，我稍后发你。');replace(newchat,'随时开始回复','');
// Make handoff headers belong to the target application.
for(const [key,brand,name,title]of [['feishu-task','feishu','飞书','会议安排'],['gaode-route','gaode','高德地图','路线规划']]){const f=await figma.getNodeByIdAsync(S.screens[key]);const h=f.findOne(n=>n.name==='Context / active application');const icon=h.children.find(n=>n.type==='INSTANCE');icon.swapComponent(await figma.getNodeByIdAsync(L.brands[brand]));replace(h,'微信',name);replace(f,'陈思 · 项目讨论',title);}
const all={...S.screens,...extraScreens};
// Arrange main modes first, then clearly separated families. All prototype frames remain top-level.
for(const n of [...page.children])if(n.type==='TEXT')n.remove();
at(page,t('Mobile Input',46,'#122D39'),80,12);at(page,t('AI 键盘 · 固定输入 + 上下文生成',20),80,78);
const main=['wechat','email','workbuddy','word','sheet','presentation','game'];
for(let i=0;i<main.length;i++){const n=await figma.getNodeByIdAsync(all[main[i]]);n.x=80+i*470;n.y=190;at(page,t(main[i],16),n.x,n.y-32);mutated.push(n.id);}
let y=1250;
for(const [family,prefixes]of [['WeChat / 输入、编辑与跨应用',['wechat','feishu','gaode']],['Email / 邮件撰写',['email']],['WorkBuddy / 任务控制',['workbuddy']],['WPS Word / 选区编辑',['word']],['WPS Sheets / 公式与范围',['sheet']],['WPS Slides / 演讲工具',['presentation']],['FC / 游戏与连接',['game']],['切换入口',['chooser']]]){
 const entries=Object.entries(all).filter(([k])=>!main.includes(k)&&prefixes.some(p=>k===p||k.startsWith(p+'-')));if(!entries.length)continue;at(page,t(family,28,'#122D39'),80,y);y+=90;const landscape=prefixes[0]==='game',cols=landscape?3:7;
 for(let i=0;i<entries.length;i++){const [key,id]=entries[i],f=await figma.getNodeByIdAsync(id);f.x=80+(i%cols)*(landscape?924:470);f.y=y+Math.floor(i/cols)*(landscape?500:930);at(page,t(key,13),f.x,f.y-26);mutated.push(id);}y+=Math.ceil(entries.length/cols)*(landscape?500:930)+110;
}
for(const k of Object.keys(extraScreens)){const n=await figma.getNodeByIdAsync(extraHotspots[k].switch);await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:S.screens.chooser,navigation:'NAVIGATE',transition:{type:'SMART_ANIMATE',easing:{type:'EASE_IN_AND_OUT'},duration:.32}}]}]);}
page.flowStartingPoints=[...new Map([...page.flowStartingPoints,...Object.keys(extraScreens).map(k=>({nodeId:extraScreens[k],name:k}))].map(f=>[f.nodeId,f])).values()];
return {createdNodeIds:created,mutatedNodeIds:mutated,extraScreens,extraHotspots};
