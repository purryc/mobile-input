export const CHAT_SCENE_VERSION=3;
export const BOSS_MESSAGE_ID='boss-sales-meeting-v2';
export function salesMeeting(now=new Date()){
 const china=new Date(now.getTime()+8*3600000);china.setUTCDate(china.getUTCDate()+1);
 const date=china.toISOString().slice(0,10);
 return {date,start:`${date}T14:00:00+08:00`,end:`${date}T15:00:00+08:00`,location:'上海国家会展中心洲际酒店',customer:'澄星设计',contact:'林悦',text:bossMessage()};
}
export type SalesMeeting=ReturnType<typeof salesMeeting>;

export function bossMessage(){return '小李，明天下午两点，咱们去上海国家会展中心洲际酒店见一下澄星设计的林经理，聊聊他们新办公室那 30 套设备，估计聊一个小时。你记下日程，提前半小时提醒我，出发前看看怎么走。会前帮我准备好报价和项目介绍。';}
export function bossMessages(text=bossMessage()){return [
 {id:'boss-smalltalk-1',text:'早啊',me:false},
 {id:'boss-smalltalk-2',text:'早，陈总',me:true},
 {id:'boss-smalltalk-3',text:'今天路上还顺吧',me:false},
 {id:'boss-smalltalk-4',text:'挺顺的，已经到了',me:true},
 {id:BOSS_MESSAGE_ID,text,me:false},
];}
