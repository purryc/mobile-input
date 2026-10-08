import type {State} from '../../../packages/core/model';
import {BOSS_MESSAGE_ID} from '../../../packages/core/chat-scene';
import {LocalIntentProvider} from './hover/assist/intents';
import type {Action} from './hover/assist/types';
import {salesActions} from './sales-actions';

const provider=new LocalIntentProvider();
const supported=new Set(['calendar','phone','contacts','notes','xiaoyi','mail','feishu','gaode','ctrip','meituan','taobao','jd','sf','damai','wechat']);
export function messageActions(s:State,id:string,mid:string):Action[]{
 const message=s.chat.messages[id]?.find(m=>m.id===mid);if(!message)return [];
 if(id==='wx-boss'&&mid===BOSS_MESSAGE_ID)return salesActions(s);
 const mapped=provider.recommend({conversationId:id,context:s.chat.messages[id],question:'',tool:'ask',target:{id:mid,messageId:mid,text:message.text,kind:'message',rect:{x:0,y:0,width:0,height:0}}}).filter(a=>supported.has(a.app));
 // Family history has no fixture intent cases. Preserve its actual words in the
 // existing Hover notes sheet, without inferring dates, addresses or bookings.
 if(!mapped.length&&id==='wx-family'&&!message.me&&message.text.length>=12){
  const fields:Action['fields']=[['内容',message.text]];
  mapped.push({id:'visible-message-note',app:'notes',label:'记备忘',title:'家庭备忘',cta:'保存笔记',fields,sources:[mid],fieldSources:[{field:'内容',messageIds:[mid],note:'当前屏幕消息原文'}],missing:[]});
 }
 return mapped.map(a=>({...a,recordKey:`${id}:${mid}:${a.id}`}));
}
export function recommendations(s:State):Action[]{const ctx=s.chat.context;return ctx&&ctx.conversation===s.chat.conversation?messageActions(s,ctx.conversation,ctx.messageId):[];}
export function visibleMessageSource(s:State,id:string,visibleIds:string[]):string|undefined{
 const incoming=(s.chat.messages[id]||[]).filter(m=>!m.me&&visibleIds.includes(m.id));
 const selected=incoming.find(m=>s.target?.id===`message:${id}:${m.id}`);
 if(selected&&messageActions(s,id,selected.id).length)return selected.id;
 return [...incoming].reverse().find(m=>messageActions(s,id,m.id).length)?.id||incoming.at(-1)?.id||(s.chat.messages[id]||[]).filter(m=>visibleIds.includes(m.id)).at(-1)?.id;
}
