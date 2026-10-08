import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalIntentProvider} from '../../apps/web/src/hover/assist/intents';
import {initialChats} from './interactions';
import cases from '../../apps/web/src/hover/data/intent-cases.json' with {type:'json'};
const provider=new LocalIntentProvider();
const chats=initialChats();
function recommend(conversationId:string,mid:string,context=chats.messages[conversationId]){const m=context.find(m=>m.id===mid)!;return provider.recommend({conversationId,context,question:'',tool:'ask',target:{id:mid,messageId:mid,text:m.text,kind:'message',rect:{x:0,y:0,width:0,height:0}}});}
test('all existing Hover action cases are reachable and capped at three',()=>{
 const apps=new Set<string>();for(const c of cases){const mid=c.targets[0],id=Object.keys(chats.messages).find(id=>chats.messages[id].some(m=>m.id===mid))!;assert.ok(id,c.id);const actions=recommend(id,mid);assert.ok(actions.length>0&&actions.length<=3);actions.forEach(a=>apps.add(a.app));}
 assert.deepEqual([...apps].sort(),['calendar','contacts','ctrip','damai','feishu','gaode','jd','mail','meituan','notes','sf','taobao','wechat','xiaoyi'].sort());
});
test('Hover hotel and mail constraints retain browsing and draft semantics',()=>{
 const hotel=recommend('wx-boss','b2');assert.ok(hotel.some(a=>a.id==='hotel'));assert.ok(hotel.every(a=>!['book-hotel','pay'].includes(a.id)));
 const mail=recommend('wx-boss','b5');assert.ok(mail.some(a=>a.id==='email'));assert.ok(mail.every(a=>a.id!=='send-email'));
});
test('missing source messages and new corrections never fill invented parameters',()=>{
 const missing=recommend('wx-boss','b1',chats.messages['wx-boss'].filter(m=>m.id!=='b0'));assert.ok(missing.some(a=>a.fields.some(([,v])=>v.includes('待补充'))));
 const corrected=recommend('wx-boss','b1',[...chats.messages['wx-boss'],{id:'new',text:'改到周三，先别安排。',me:false}]);assert.ok(corrected.every(a=>a.fields.every(([,v])=>v.includes('待确认'))));
});
