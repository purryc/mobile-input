import type {State} from '../../../packages/core/model';
import {money,totals} from '../../../packages/core/model';
import {BOSS_MESSAGE_ID} from '../../../packages/core/chat-scene';
import type {Action} from './hover/assist/types';
export function salesActions(s:State):Action[]{
 const m=s.chat.meeting,date=m.date.replaceAll('-','.'),t=totals(s.reportProducts);
 const create=(id:string,app:string,label:string,title:string,cta:string,view:string,fields:Action['fields']):Action=>({id,app,label,title,cta,fields,sources:[BOSS_MESSAGE_ID],missing:fields.filter(([,v])=>v.includes('待补充')).map(([k])=>k),fieldSources:fields.map(([field])=>({field,messageIds:[BOSS_MESSAGE_ID],note:'已确认销售演示场景'})),recordKey:`wx-boss:${BOSS_MESSAGE_ID}:${id}`,destination:{view,parameters:Object.fromEntries(fields)}});
 return [
 create('calendar-complete','calendar','安排日程','澄星设计采购会面','添加到日历','native-preview',[['日程','与澄星设计林经理会面'],['开始',`${date} 14:00`],['结束',`${date} 15:00`],['地点',m.location],['提醒','提前30分钟']]),
 create('meeting-route','gaode','高德导航','会议路线','查看路线','route',[['目的地',m.location],['出发地','待补充'],['会面时间',`${date} 14:00`]]),
 create('brief','feishu','飞书项目简报','澄星设计 · 项目简报','保存文档草稿','document',[['客户','澄星设计'],['项目背景','新办公室 30 套办公设备采购；每套含笔记本、显示器、扩展坞。'],['会议',`${date} 14:00–15:00 · ${m.location}`],['报价要点',`批量优惠 5%；确认报价 ${money(t.revenue)}，成本 ${money(t.cost)}，毛利 ${money(t.profit)}。`],['交付安排','10 月 24 日到货，10 月 28 日验收。'],['待确认','最终数量、报价与交付日期。']])];
}
