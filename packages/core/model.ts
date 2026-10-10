import {initialWorkBuddy,seedWorkBuddy,workBuddyInteraction,pauseWorkBuddy,wbDraftFor,type WorkBuddyState} from './workbuddy';
import {salesSpeakerNotes} from './sales-speaker-notes';
import {presentationState,presentationInteraction,pausePresentation,beginPresentation,releasePointer,type PresentationState} from './presentation';
import {initialChats,interaction,activate,launch,type ChatState,type Switcher} from './interactions';
export const apps=[['wps','WPS','#e7434c','FileText'],['mail','邮件','#4388ef','Mail'],['sheet','WPS 表格','#1b9561','Table2'],['word','WPS 文字','#3474cb','FileText'],['slides','WPS 演示','#e56838','Presentation'],['wechat','微信','#24b55a','MessageCircle'],['notes','笔记','#d6a539','NotebookPen'],['paint','天生会画','#303039','Paintbrush'],['workbuddy','WorkBuddy','#222c36','Sparkles'],['doubao','豆包','#448ae3','Bot'],['xiaoyi','小艺','#b472d5','Orbit'],['bilibili','哔哩哔哩','#ec7198','Tv'],['douyin','抖音','#161921','Music2'],['red','小红书','#ef3f52','Heart'],['read','阅读','#4298d7','BookOpen'],['mario','Super Mario','#e35439','Gamepad2']] as const;
export type AppId=typeof apps[number][0]|'desktop';
export interface Product {id:string;name:string;quantity:number;cost:number;price:number;discount:number;}
export const initialProducts:Product[]=[{id:'p1',name:'轻舟 Pro 商务笔记本',quantity:30,cost:4200,price:5200,discount:5},{id:'p2',name:'明境 27 英寸显示器',quantity:30,cost:850,price:1200,discount:5},{id:'p3',name:'畅联 USB-C 扩展坞',quantity:30,cost:180,price:280,discount:5}];
export const totals=(p:Product[])=>{const cost=p.reduce((n,x)=>n+x.quantity*x.cost,0),revenue=p.reduce((n,x)=>n+x.quantity*x.price*(1-x.discount/100),0);return {cost,revenue,profit:revenue-cost,margin:revenue?(revenue-cost)/revenue*100:0};};
export const money=(n:number)=>'¥'+n.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
export interface Mail {id:string;from:string;address:string;subject:string;body:string;time:string;attachment?:'sheet'|'word'|'slides';sent?:boolean;to?:string;}
export const mails:Mail[]=[
{id:'m1',from:'林悦 · 澄星设计',address:'lin.yue@example.com',subject:'新办公室设备采购需求 · 30 套',time:'09:42',body:'陈朗，你好：\n\n我们计划为新办公室配置 30 套办公设备，每套包含商务笔记本、27 英寸显示器和 USB-C 扩展坞。\n\n请提供分项报价、交付周期及售后方案。预算希望控制在 20 万元以内，目标在 10 月 28 日前完成交付。\n\n期待你的方案。\n林悦\n澄星设计 · 行政采购'},
{id:'m2',from:'周宁 · 云帆供应',address:'zhou.ning@example.com',subject:'回复：商务设备采购询价与供货清单',time:'09:18',attachment:'sheet',body:'陈朗，你好：\n\n本次采购单价：轻舟 Pro 商务笔记本 ¥4,200；明境 27 英寸显示器 ¥850；畅联 USB-C 扩展坞 ¥180。\n\n按各 30 件备货，预计确认订单后 7 个工作日出库。请参考附件，具体交期需锁定库存后确认。\n\n周宁\n云帆供应 · 销售支持'},
{id:'m3',from:'周宁 · 云帆供应',address:'zhou.ning@example.com',subject:'交期确认：10 月 24 日前到货',time:'昨天',body:'陈朗，你好：\n\n30 套设备已确认可供，预计 10 月 24 日前到货，另预留 2 个工作日用于配置和验收。请在确认采购时一并提供收货地址。\n\n周宁'},
{id:'m4',from:'林悦 · 澄星设计',address:'lin.yue@example.com',subject:'报价反馈：请补充批量优惠与服务说明',time:'昨天',body:'陈朗，你好：\n\n请在标准报价基础上提供批量采购优惠，并说明设备安装、数据迁移和保修安排。我们将在本周评审最终方案。\n\n林悦'},
{id:'m5',from:'陈朗 · 锐行办公',address:'chen.lang@example.com',subject:'澄星设计采购方案 · 报价修订版',time:'昨天',attachment:'word',body:'林悦，你好：\n\n根据本次批量需求，方案提供 5% 优惠，设备清单及交付安排见附件。期待与你核对数量和到货时间。\n\n陈朗\n锐行办公 · 客户经理'},
{id:'m6',from:'许岚 · 销售主管',address:'xu.lan@example.com',subject:'周五销售汇报：澄星项目进展',time:'周一',attachment:'slides',body:'陈朗：\n\n请在周五汇报澄星设计项目的客户需求、供应商比较、报价毛利和交付风险，并列出下一步行动。汇报控制在 8 分钟。\n\n许岚'}];
export interface Target {id:string;label:string;kind:'text'|'number'|'drawing'|'slide'|'media'|'game'|'message';app:AppId;revision:number;value:string;}
export interface Slide {title:string;body:string;notes:string;}
export const initialSlides:Slide[]=[
{title:'让新办公室，准时开工',body:'澄星设计 · 办公设备采购项目\n销售进展汇报 / 陈朗 / 锐行办公',notes:salesSpeakerNotes[0]},
{title:'30 个工位，同一套体验',body:'30 台商务笔记本\n30 台 27 英寸显示器\n30 个 USB-C 扩展坞\n预算上限 20 万元 · 10 月 28 日前验收',notes:salesSpeakerNotes[1]},
{title:'供货确定性，优先于最低价',body:'云帆供应：7 个工作日，库存已确认\n远峰设备：10 个工作日，需二次确认\n建议：选择云帆，预留验收缓冲',notes:salesSpeakerNotes[2]},
{title:'报价可控，服务有余量',body:'批量采购优惠 5%\n设备配置与统一交付\n报价、成本和毛利按最新确认数据展示',notes:salesSpeakerNotes[3]},
{title:'把风险，留在交付之前',body:'10 月 17 日：锁定订单和库存\n10 月 24 日：设备到货\n10 月 26 日：配置与联调\n10 月 28 日：客户验收',notes:salesSpeakerNotes[4]},
{title:'下一步，推进确认',body:'陈朗 / 今天：发送修订报价\n林悦 / 周五：确认采购方案\n周宁 / 确认后：锁定库存\n交付团队 / 到货前：准备配置清单',notes:salesSpeakerNotes[5]}];
export interface Stroke {points:[number,number][];color:string;size:number;eraser:boolean;}
export interface OfficeFile{id:string;kind:'sheet'|'word'|'slides';name:string;products?:Product[];paragraphs?:string[];slides?:Slide[];}
export interface State {workbuddy:WorkBuddyState;presentation:PresentationState;officeFiles:OfficeFile[];officeFile:string|null;chat:ChatState;switcher:Switcher|null;app:AppId;recent:AppId[];revision:number;target:Target|null;products:Product[];reportProducts:Product[];reportRevision:number;paragraphs:string[];slides:Slide[];slide:number;presenting:boolean;startedAt:number;mailId:string;draft:string;recipient:string;subject:string;mails:Mail[];texts:Record<string,string>;color:string;brush:number;eraser:boolean;strokes:Stroke[];noteStrokes:Stroke[];playing:boolean;progress:number;mediaIndex:number;gamePaused:boolean;gameEpoch:number;gameKeys:string[];gameHeartbeat:number;}
export function initialState():State{const state:State={workbuddy:initialWorkBuddy(),presentation:presentationState(),officeFiles:[],officeFile:null,chat:initialChats(),switcher:null,app:'desktop',recent:[],revision:0,target:null,products:structuredClone(initialProducts),reportProducts:structuredClone(initialProducts),reportRevision:0,paragraphs:['澄星设计办公设备采购方案','项目目标：为新办公室配置 30 套一致的办公设备，在 10 月 28 日前完成交付与验收。','产品配置：轻舟 Pro 商务笔记本、明境 27 英寸显示器、畅联 USB-C 扩展坞，每种各 30 件。','服务安排：统一配置、现场安装与售后联络。客户确认方案后锁定库存，按阶段完成验收。','交付安排：10 月 24 日到货，10 月 26 日完成配置，10 月 28 日客户验收。'],slides:structuredClone(initialSlides),slide:0,presenting:false,startedAt:0,mailId:'m1',draft:'',recipient:'lin.yue@example.com',subject:'回复：新办公室设备采购需求 · 30 套',mails:structuredClone(mails),texts:{'speaker-notes-version':'2','wechat-draft':'','notes-text':'澄星项目会议记录\n确认 30 套设备数量与到货时间。','ai-draft':'','media-comment':''},color:'#ed5b94',brush:8,eraser:false,strokes:[],noteStrokes:[],playing:false,progress:0,mediaIndex:0,gamePaused:false,gameEpoch:0,gameKeys:[],gameHeartbeat:0};state.officeFiles=[{id:'sample-sheet',kind:'sheet',name:'采购与客户报价.xlsx',products:structuredClone(state.products)},{id:'sample-word',kind:'word',name:'澄星设计采购方案.docx',paragraphs:[...state.paragraphs]},{id:'sample-slides',kind:'slides',name:'销售进展汇报.pptx',slides:structuredClone(state.slides)} ];seedWorkBuddy(state);return state;}
export interface Command {id:string;type:string;app?:AppId;targetId?:string;targetRevision?:number;sessionId?:number;value?:unknown;}
export interface Ack {id:string;ok:boolean;error?:string;revision:number;}
export function select(s:State,id:string,label:string,kind:Target['kind'],value:string):State{return {...s,revision:s.revision+1,target:{id,label,kind,app:s.app,revision:s.revision+1,value}};}
const mutating=new Set(['input','format']);
export function apply(s:State,c:Command):{state:State;ack:Ack}{
 const fail=(error:string)=>({state:s,ack:{id:c.id,ok:false,error,revision:s.revision}});
 if(['slide','present'].includes(c.type)&&c.sessionId!==undefined&&c.sessionId!==s.startedAt)return fail('放映会话已变化，请同步后重试');
 if(mutating.has(c.type)&&(!s.target||c.targetId!==s.target.id||c.targetRevision!==s.target.revision||c.app!==s.app))return fail('目标已变化，请重新确认后提交');
 if(c.app&&c.app!==s.app&&!['open','switch-step','switch-cancel','switch-commit','release'].includes(c.type))return fail('应用已切换');
 const n=structuredClone(s);const v=c.value;
 const wbResult=workBuddyInteraction(n,c);
 const handled=wbResult===undefined?presentationInteraction(n,c):wbResult;
 const result=handled===undefined?interaction(n,c):handled;
 if(result!==undefined){if(result)return fail(result);n.revision=s.revision+1;return {state:n,ack:{id:c.id,ok:true,revision:n.revision}};}
 switch(c.type){
 case 'open':{if(!['desktop',...apps.map(a=>a[0])].includes(String(v)))return fail('应用不存在');launch(n,v as AppId);break;}
 case 'select':{const t=v as Target;if(!t?.id||!t.label||!['text','number','drawing','slide','media','game','message'].includes(t.kind))return fail('对象无效');n.target={...t,app:n.app,revision:s.revision+1};break;}
 case 'input':{
 const t=n.target!;const text=String(v??'');if(text.length>20000)return fail('内容过长');
 if(t.id.startsWith('cell:')){const [,row,field]=t.id.split(':');const p=n.products[Number(row)];const key=field as 'quantity'|'cost'|'price'|'discount';const x=Number(text);if(!p||!['quantity','cost','price','discount'].includes(key)||!text.trim()||!Number.isFinite(x)||x<0||(key==='discount'&&x>100)||(key==='quantity'&&!Number.isInteger(x)))return fail('请输入有效的数量或金额');p[key]=x;}
 else if(t.id.startsWith('paragraph:')){const i=Number(t.id.split(':')[1]);if(!Number.isInteger(i)||i<0||i>=n.paragraphs.length)return fail('段落对象无效');n.paragraphs[i]=text;}
 else if(t.id.startsWith('slide:')){const [,i,key]=t.id.split(':');if(!n.slides[Number(i)]||!['title','body','notes'].includes(key))return fail('幻灯片对象无效');n.slides[Number(i)][key as keyof Slide]=text;}
 else if(t.id==='mail-draft')n.draft=text;else if(t.id==='mail-to')n.recipient=text;else if(t.id==='mail-subject')n.subject=text;else n.texts[t.id]=text;
 if(t.id.startsWith('paragraph:')||t.id.startsWith('slide:'))n.texts['edited:'+t.id]='1';
 t.value=text;t.revision=s.revision+1;break;}
 case 'format':{const t=n.target!;if(!t.id.startsWith('paragraph:'))return fail('当前对象不支持格式');n.texts['format:'+t.id]=String(v);break;}
 case 'mail-open':n.mailId=String(v);n.target=null;n.texts['composing']='0';break;
 case 'mail-resume':n.texts['composing']='1';n.target={id:'mail-draft',app:n.app,kind:'text',label:'邮件正文',value:n.draft,revision:s.revision+1};break;
 case 'mail-star':n.texts['star:'+n.mailId]=n.texts['star:'+n.mailId]==='1'?'0':'1';break;
 case 'mail-compose':{n.texts['composing']='1';const m=n.mails.find(x=>x.id===n.mailId);n.recipient=v==='new'?'':(m?.sent?m.to:m?.address)??'';n.subject=v==='new'?'':'回复：'+(m?.subject??'');n.draft='';n.target={id:'mail-draft',app:n.app,kind:'text',label:'邮件正文',value:'',revision:s.revision+1};break;}
 case 'mail-send':if(!n.recipient.includes('@')||!n.draft.trim())return fail('请填写收件人和正文');n.mails.unshift({id:c.id,from:'陈朗 · 锐行办公',address:'chen.lang@example.com',to:n.recipient,subject:n.subject||'采购方案跟进',body:n.draft,time:'刚刚',sent:true});n.mailId=c.id;n.draft='';n.target=null;n.texts['composing']='0';break;
 case 'report-refresh':{
 n.reportProducts=structuredClone(n.products);n.reportRevision++;
 const inventory=n.products.map(p=>`${p.name} ${p.quantity} 件`).join('、');
 const updateParagraph=(i:number,value:string)=>{if(!n.texts[`edited:paragraph:${i}`])n.paragraphs[i]=value;};
 const updateSlide=(i:number,key:keyof Slide,value:string)=>{if(!n.texts[`edited:slide:${i}:${key}`])n.slides[i][key]=value;};
 updateParagraph(1,'项目目标：按已确认清单配置新办公室设备，在 10 月 28 日前完成交付与验收。');
 updateParagraph(2,'产品配置：'+inventory+'。');
 updateSlide(1,'title','办公设备，统一配置');
 updateSlide(1,'body',n.products.map(p=>`${p.quantity} 件 ${p.name}`).join('\n')+'\n预算上限 20 万元 · 10 月 28 日前验收');
 updateSlide(3,'body',n.products.map(p=>`${p.name} · 优惠 ${p.discount}%`).join('\n')+'\n设备配置与统一交付');
 for(const f of n.officeFiles){if(f.id==='sample-word')f.paragraphs=[...n.paragraphs];if(f.id==='sample-slides')f.slides=structuredClone(n.slides);}
 n.target=null;break;}

 case 'slide':if(typeof v!=='number'||!Number.isInteger(v))return fail('页码无效');releasePointer(n);n.slide=Math.max(0,Math.min(n.slides.length-1,v));if(n.officeFile==='sample-slides')n.presentation.lastSlide=n.slide;n.target=null;break;
 case 'presentation-active':if(n.app==='slides'&&n.presenting){if(v){if(!n.presentation.runningSince)n.presentation.runningSince=Date.now();}else pausePresentation(n);}break;
 case 'present':if(v){beginPresentation(n);}else{pausePresentation(n);n.presenting=false;n.target=null;}break;
 case 'color':if(!/^#[0-9a-f]{6}$/i.test(String(v)))return fail('颜色无效');n.color=String(v);n.eraser=false;break;
 case 'brush':if(!Number.isFinite(Number(v)))return fail('笔刷大小无效');n.brush=Math.max(1,Math.min(40,Number(v)));break;
 case 'eraser':n.eraser=Boolean(v);break;
 case 'stroke':{const st=v as Stroke;if(!Array.isArray(st?.points)||st.points.length>2000||st.points.some(p=>!Array.isArray(p)||p.length!==2||p.some(x=>!Number.isFinite(x)||x<0||x>1)))return fail('笔迹无效');(n.app==='notes'?n.noteStrokes:n.strokes).push(st);break;}
 case 'undo-stroke':(n.app==='notes'?n.noteStrokes:n.strokes).pop();break;
 case 'play':n.playing=Boolean(v);break;
 case 'seek':n.progress=Math.max(0,Math.min(100,Number(v)||0));break;
 case 'media-next':if(!Number.isInteger(v))return fail('内容编号无效');n.mediaIndex=Math.max(0,n.mediaIndex+Number(v));n.progress=0;n.playing=false;n.target=null;break;
 case 'chat-send':{const key=String(v);const draft=n.texts[key];if(!draft?.trim())return fail('请输入内容');n.texts['history:'+key]=(n.texts['history:'+key]||'')+'\n'+draft;n.texts[key]='';n.target=null;break;}
 case 'game-keys':if(n.app!=='mario')return fail('游戏未打开');if(!Array.isArray(v)||v.some(k=>!['ArrowLeft','ArrowRight','Space','Shift'].includes(k)))return fail('按键无效');n.gameKeys=v;n.gameHeartbeat=Date.now();break;
 case 'game-pause':n.gamePaused=Boolean(v);n.gameKeys=[];break;
 case 'game-reset':n.gameEpoch++;n.gamePaused=false;n.gameKeys=[];break;
 case 'release':if(n.app==='workbuddy')pauseWorkBuddy(n);n.presentation.captions={...n.presentation.captions,id:'',enabled:false,status:'off',text:'',error:''};n.chat.activation=null;n.gameKeys=[];n.switcher=null;releasePointer(n);if(n.chat.context?.readAt)n.chat.context.readAt=-Math.abs(n.chat.context.readAt);break;
 default:return fail('不支持的操作');
 }
 n.revision=s.revision+1;return {state:n,ack:{id:c.id,ok:true,revision:n.revision}};
}
export class Store {
 state:State;private seen=new Map<string,Ack>();private history:State[]=[];
 constructor(state=initialState()){this.state=state;}
 dispatch(c:Command):Ack {const old=this.seen.get(c.id);if(old)return old;let result:{state:State;ack:Ack};
 if(c.type==='undo'){const previous=this.history.pop();if(previous){previous.workbuddy=structuredClone(this.state.workbuddy);previous.officeFiles=[...previous.officeFiles.filter(f=>!f.id.startsWith('wb-office-')),...structuredClone(this.state.officeFiles.filter(f=>f.id.startsWith('wb-office-')))];previous.revision=this.state.revision+1;previous.target=null;previous.gameKeys=[];result={state:previous,ack:{id:c.id,ok:true,revision:previous.revision}};}else result={state:this.state,ack:{id:c.id,ok:false,error:'没有可撤销的修改',revision:this.state.revision}};}
 else {result=apply(this.state,c);if(result.ack.ok&&['input','format','mail-send','report-refresh'].includes(c.type)){this.history.push(structuredClone(this.state));if(this.history.length>30)this.history.shift();}}
 this.state=result.state;this.seen.set(c.id,result.ack);if(this.seen.size>1000)this.seen.delete(this.seen.keys().next().value!);return result.ack;}
}

export function describe(s:State){return {protocolVersion:5,app:s.app,workbuddy:s.app==='workbuddy'?{page:s.workbuddy.page,task:s.workbuddy.task,draftRevision:s.target?wbDraftFor(s,s.target.id)?.revision:undefined,capabilities:['task-input-v1','approval-v1'],pendingApprovals:s.workbuddy.approvals.filter(r=>r.status==='pending').map(r=>({id:r.id,taskId:r.taskId,revision:r.revision}))}:undefined,documentId:s.app==='workbuddy'?s.workbuddy.task:({sheet:'sales-quote',word:'customer-proposal',slides:'sales-update',mail:s.mailId} as Record<string,string>)[s.app]||s.app,worksheet:s.app==='sheet'?'采购报价':undefined,object:s.target,revision:s.revision,presentationSession:s.presenting?s.startedAt:null,slide:s.app==='slides'?s.slide:undefined,operations:s.app==='workbuddy'?(s.target?['wb-edit','wb-submit','wb-unfocus','wb-navigate']:['wb-focus','wb-navigate']):s.app==='mario'?['game-keys','game-pause','game-reset','release']:s.presenting?['slide','present']:s.target?['input','undo',...(s.app==='word'?['format']:[])]:['open','select']};}
