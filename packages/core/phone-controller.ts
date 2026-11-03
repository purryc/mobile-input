/** Destination-neutral presentation contract. Execution remains in the trusted adapter. */
export type ControllerDestination='demo'|'mac'|'harmony';
export interface ControllerTask {id:string;title:string;status?:string;}
export interface ControllerSnapshot {
 destination:ControllerDestination;scope:string;app:string;appName:string;subapp?:string;scene:string;
 device:string;connected:boolean;synced:boolean;connectionLabel:string;tasks:ControllerTask[];currentTask?:string;
 target?:{id:string;version:string;text:string;editable:boolean};capabilities:string[];
 materials:{id:string;name:string;kind:string}[];execution?:{status:string;stage?:string};
}
export interface ControllerResult {ok:boolean;error?:string;}
export interface ControllerActions {
 switchApp:()=>Promise<ControllerResult>;switchTask:(id:string)=>Promise<ControllerResult>;newTask:()=>Promise<ControllerResult>;
}
export function controllerScene(app:string,subapp:string|undefined,editable:boolean){return app==='workbuddy'?'agent':app==='codex'?'agent':app==='wps'?subapp||'unknown':editable?'text':app;}
export function controllerTasks(tasks:ControllerTask[],current:string|undefined,title:string):ControllerTask[]{
 const unique=Array.from(new Map(tasks.map(t=>[t.id,t])).values());
 if(current&&!unique.some(t=>t.id===current))unique.unshift({id:current,title:title||'当前任务'});
 return unique;
}
export const taskStatusLabels:Record<string,string>={draft:'草稿',running:'执行中',planned:'待审批',approval:'待批准','needs-materials':'待补材料','needs-type':'待澄清',paused:'已停止',complete:'已完成',error:'出错'};
