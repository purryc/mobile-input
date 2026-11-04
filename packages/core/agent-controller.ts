/** Shared scene identity; capability evidence remains in each destination adapter. */
export const agentApps=['workbuddy','codex','chatgpt','gemini'] as const;
export function isAgentApp(app:string):boolean{return (agentApps as readonly string[]).includes(app);}
export function agentCapabilities(app:string,caps:readonly string[]):string[]{
 const result=new Set(caps);
 if(app==='workbuddy')for(const [old,next] of [['workbuddy-submit','agent-submit'],['workbuddy-attach','agent-attach'],['workbuddy-task','switch-task']] as const)if(result.has(old))result.add(next);
 return [...result];
}
export function agentDraftOwner(bridge:string,session:string,s:{app:string;window:string;target:string;taskId?:string;pageIdentity?:string;editorContext?:string}):string{
 return JSON.stringify(['agent',bridge||session,s.app,s.pageIdentity||'',s.taskId||`${s.window}/${s.target}`,...(s.editorContext?[s.editorContext]:[])]);
}
