// Inputs: L library ledger, S screen ledger. Correct material, add exact-result states.
const page=await figma.getNodeByIdAsync(L.pages.screens);await figma.setCurrentPageAsync(page);
for(const style of ['Regular','Medium','Bold'])await figma.loadFontAsync({family:L.font,style});
const mutated=[],created=[],screens={},hotspots={};
const material={toolbar:.4,circle:.3,button:.45,voice:.4,draft:.52,quote:.42,reply:.5,app:.45,key:.72};
const reverse=Object.fromEntries(Object.entries(L.components).map(([k,v])=>[v,k]));
for(const [key,opacity]of Object.entries(material)){const n=await figma.getNodeByIdAsync(L.components[key]);n.fills=n.fills.map((p,i)=>{const q={...p,opacity:key==='voice'?(i===0?.07:.36):opacity};delete q.boundVariables;return q;});n.strokes=n.strokes.map(p=>{const q={...p,opacity:.83};delete q.boundVariables;return q;});mutated.push(n.id);}
for(const n of page.findAll(n=>n.type==='INSTANCE')){const k=reverse[n.mainComponent?.id];if(k&&k in material){n.fills=n.fills.map((p,i)=>{const q={...p,opacity:n.fills.length>1?p.opacity:material[k]};delete q.boundVariables;return q;});n.strokes=n.strokes.map(p=>{const q={...p,opacity:.83};delete q.boundVariables;return q;});}}
// Update layout without moving any fixed input target.
const q=await figma.getNodeByIdAsync('4:487');q.clipsContent=false;q.resize(295,72);
const tb=await figma.getNodeByIdAsync(L.components.toolbar);tb.paddingTop=6;tb.paddingBottom=6;
const get=async k=>await figma.getNodeByIdAsync({...S.screens,...screens}[k]);
async function setDraft(key,value){const f=await get(key);const d=f.findOne(n=>n.name==='Input / Draft');if(d){const t=d.findOne(n=>n.type==='TEXT');t.characters=value;t.fills=[{type:'SOLID',color:{r:.07,g:.176,b:.224}}];}}
function replace(f,old,value){const t=f.findAll(n=>n.type==='TEXT'&&n.characters===old);for(const n of t)n.characters=value;}
let ix=0;
async function clone(from,key){const source=await get(from),n=source.clone();n.name=key;page.appendChild(n);n.x=80+(ix%7)*470;n.y=8450+Math.floor(ix/7)*980;ix++;created.push(n.id);screens[key]=n.id;const map={};function pair(a,b){map[a.id]=b.id;if(a.children)for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i]);}pair(source,n);hotspots[key]=Object.fromEntries(Object.entries({...S.hotspots,...hotspots}[from]).map(([k,id])=>[k,map[id]]));return n;}
for(const k of ['wechat-draft','wechat-return','wechat-locked'])await setDraft(k,'可以，我会准时参加。');
const reply2=await clone('wechat-draft','wechat-reply2');await setDraft('wechat-reply2','方便，期待当面聊聊。');
const applied=await clone('wechat-draft','wechat-applied');await setDraft('wechat-applied','没问题，周五两点见！');
const copied=await clone('wechat-draft','wechat-copied');replace(copied,'AI 编辑','已复制 · AI 编辑');
const pasted=await clone('wechat-draft','wechat-pasted');await setDraft('wechat-pasted','周五下午两点见。');
const selected=await clone('wechat-draft','wechat-selection');replace(selected,'AI 编辑','选中「准时参加」');replace(selected,'更自然','改为更正式');
const selectPreview=await clone('wechat-preview','wechat-selection-preview');replace(selectPreview,'修改预览 · 更自然','修改预览 · 仅选中片段');replace(selectPreview,'可以，周五两点见。','准时参加');replace(selectPreview,'没问题，周五两点见！\n我会提前把资料发给你。','按时出席');
const selectApplied=await clone('wechat-draft','wechat-selection-applied');await setDraft('wechat-selection-applied','可以，我会按时出席。');
const sendPreview=await clone('wechat-preview','wechat-send-preview');replace(sendPreview,'修改预览 · 更自然','发送预览');replace(sendPreview,'原文','收件人');replace(sendPreview,'可以，周五两点见。','陈思 · 项目讨论');replace(sendPreview,'修改后','回复内容');replace(sendPreview,'没问题，周五两点见！\n我会提前把资料发给你。','没问题，周五两点见！');replace(sendPreview,'接受修改','确认发送');replace(sendPreview,'保留原文','返回编辑');
const gaode=await clone('wechat-task','gaode-preview');replace(gaode,'会议预览','高德 · 路线预览');replace(gaode,'时间 · 来自所选消息','目的地 · 来自所选消息');replace(gaode,'周五 14:00','星海会议室');replace(gaode,'地点 · 来自所选消息','详细地址');replace(gaode,'星海会议室','待补充完整地址');replace(gaode,'参与人 · 来自当前聊天','出发地');replace(gaode,'陈思、我','当前位置');replace(gaode,'在飞书中继续','补充详细地址');replace(gaode,'修改地点','返回微信');
const route=await clone('gaode-preview','gaode-route');replace(route,'高德 · 路线预览','高德 · 路线任务');replace(route,'待补充完整地址','星海会议室 · 演示地点');replace(route,'补充详细地址','返回微信');
const attachment=await clone('email-preview','email-attachment');replace(attachment,'主题 · 方案确认','已添加附件');replace(attachment,'Re: 季度方案与交付计划','季度方案.pdf · 2.4 MB');replace(attachment,'确认发送','返回编辑');
const wordFormat=await clone('word-preview','word-format');replace(wordFormat,'改写预览 · 仅替换选区','格式预览 · 加粗');replace(wordFormat,'整合团队资源，加快客户交付。','提升团队在客户交付方面的效率。');
const avg=await clone('sheet-preview','sheet-average');replace(avg,'=SUM(C2:C8)','=AVERAGE(C2:C8)');replace(avg,'¥ 128,600','¥ 18,371.43');
const fill=await clone('sheet-preview','sheet-fill');replace(fill,'公式','填充来源 · D2');replace(fill,'=SUM(C2:C8)','=B2*C2');replace(fill,'写入单元格 · C9','填充范围');replace(fill,'¥ 128,600','D3:D8');
const penSettings=await clone('presentation-pen','presentation-settings');replace(penSettings,'演讲备注','画笔设置');replace(penSettings,'这一页重点介绍本季度的增长。\n\n先讲客户留存，再讲新业务机会。\n\n最后，说明下一季度的行动。','笔色 · 朱红\n\n粗细 · 3 px');replace(penSettings,'自动滚动备注','切换为蓝色 · 5 px');
const penBlue=await clone('presentation-pen','presentation-blue');replace(penBlue,'3 px','5 px');const swatch=await figma.getNodeByIdAsync(hotspots['presentation-blue'].color);swatch.fills=[{type:'SOLID',color:{r:.35,g:.58,b:.91},opacity:.25}];
const noteFast=await clone('presentation-notes','presentation-notes-fast');replace(noteFast,'滚动速度 · 1.0×','滚动速度 · 1.5×');replace(noteFast,'这一页重点介绍本季度的增长。\n\n先讲客户留存，再讲新业务机会。\n\n最后，说明下一季度的行动。','先讲客户留存，再讲新业务机会。\n\n最后，说明下一季度的行动。');
const cleared=await clone('presentation-pen','presentation-cleared');replace(cleared,'演讲备注','画布已清空 · 演讲备注');
// A waiting state keeps the draft pinned when an application changes during input.
const pending=await clone('wechat-draft','wechat-pending-app');replace(pending,'AI 编辑','演示已打开 · 完成输入后切换');replace(pending,'翻译为英文','保存草稿并切换演讲');
return {createdNodeIds:created,mutatedNodeIds:mutated,screens,hotspots};
