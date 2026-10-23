import {releasePointer} from './presentation';
import type {State,Command} from './model';
export interface InputSession {id:string;client:string;phase:'idle'|'pending'|'active'|'paused';source:string;app:string;operation?:{owner:string;action:string;label:string};}
const entries=new Set(['select','chat-focus','wb-focus','wb-fb-focus','wb-object-select','paint-focus','bili-focus','mail-compose','mail-resume']);
export function requestInput(s:State,source:string,id:string){const old=s.inputSession;if(source==='field'){s.inputSession={id:old?.phase==='active'?old.id:id,client:old?.client||'',phase:old?.client?'active':'pending',source,app:s.app};return;}if(old?.phase==='active'||old?.phase==='paused'||old?.phase==='pending'&&old.app===s.app)return;s.inputSession={id,client:old?.client||'',phase:'pending',source,app:s.app};}
export function inputSessionInteraction(s:State,c:Command):string|null|undefined{
 const p=(c.value||{}) as Record<string,unknown>;
 if(c.type==='input-service-open'){const a=s.inputSession,ctx=s.chat.context;if(a?.phase!=='active'||s.app!=='wechat'||!ctx||p.conversation!==ctx.conversation||p.message!==ctx.messageId||p.epoch!==ctx.epoch||typeof p.owner!=='string'||typeof p.action!=='string'||typeof p.label!=='string')return '推荐来源已变化';a.operation={owner:p.owner,action:p.action,label:p.label};return null;}
 if(c.type==='input-service-close'){if(s.inputSession&&s.inputSession.operation?.owner===p.owner)s.inputSession.operation=undefined;return null;}
 if(c.type==='input-session-client'){const client=String(p.client||'');if(!client)return '手机会话无效';if(s.inputSession?.client!==client){s.gameKeys=[];s.inputPointer=undefined;releasePointer(s);const old=s.inputSession;s.inputSession={id:old?.phase==='pending'?old.id:c.id,client,phase:old?.phase==='pending'?(old.source==='field'?'active':'pending'):'idle',source:old?.source||'',app:s.app};}return null;}
 if(c.type==='input-session-request'){requestInput(s,String(p.source||'explicit'),c.id);return null;}
 if(c.type==='input-session-confirm'||c.type==='input-session-dismiss'){const a=s.inputSession;if(!a||a.id!==p.id||a.phase!=='pending'||a.app!==s.app||c.inputClient!==undefined&&c.inputClient!==a.client)return '启用目标已变化，请重新选择';a.phase=c.type==='input-session-confirm'?'active':'idle';return null;}
 if(c.type==='input-session-pause'){if(c.inputClient!==undefined&&c.inputClient!==s.inputSession?.client)return '手机会话已变化';if(s.inputSession?.phase==='active')s.inputSession.phase='paused';s.inputPointer=undefined;s.gameKeys=[];releasePointer(s);return null;}
 if(c.type==='input-session-resume'){if(!s.inputSession||s.inputSession.client!==p.client)return '请重新启用手机输入';if(s.inputSession.phase==='paused'){s.inputSession.phase='active';s.inputSession.id=c.id;}return null;}
 return undefined;
}
export function reconcileInputSession(before:State,after:State,c:Command){
 if(entries.has(c.type)&&c.inputClient===undefined&&after.target&&['text','number'].includes(after.target.kind))requestInput(after,'field',c.id);
 if(before.app!==after.app&&after.inputSession)after.inputSession.operation=undefined;
 if(before.app!==after.app&&after.inputSession?.phase==='pending')after.inputSession={...after.inputSession,id:c.id,app:after.app};

}
