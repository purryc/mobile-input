import {isAgentApp,agentCapabilities} from '../../../packages/core/agent-controller';
import {apps} from '../../../packages/core/model';
import {useControlDestination,controlDestination} from './control-destination';
import {useRuntime,currentState,command} from './runtime';
import {useMacLink,macSnapshot,macCommand} from './mac-link';
import {controllerScene,controllerTasks,type ControllerSnapshot,type ControllerActions} from '../../../packages/core/phone-controller';
/** Readback adapters expose one view contract; they never copy real records into demo state. */
export function usePhoneControl():{snapshot:ControllerSnapshot;actions:ControllerActions}{
 const destination=useControlDestination(),demo=useRuntime(),mac=useMacLink(),s=demo.state,m=mac.state;
 let snapshot:ControllerSnapshot;
 if(destination==='demo'){
  const w=s.workbuddy,t=w.tasks.find(t=>t.id===w.task),d=w.drafts[w.task];
  snapshot={destination,scope:`demo/${s.demoGeneration}/${s.app}/${s.target?.id||''}`,app:s.app,appName:apps.find(a=>a[0]===s.app)?.[1]||s.app,scene:controllerScene(s.app,undefined,s.target?.kind==='text'),device:demo.distributed?.peer||'平板演示',connected:demo.connected,synced:demo.connected&&!demo.syncing,connectionLabel:demo.connected?'已连接':demo.status,tasks:s.app==='workbuddy'?controllerTasks(w.tasks,w.task,w.task==='new'?'新建任务':t?.title||'当前任务').map(t=>({...t,status:t.status||(t.id==='new'?'draft':undefined)})):[],currentTask:s.app==='workbuddy'?w.task:undefined,target:s.target?{id:s.target.id,version:String(s.target.revision),text:s.target.value||'',editable:s.target.kind==='text'}:undefined,capabilities:s.app==='workbuddy'?['task-list','new-task','switch-task','switch-app']:['switch-app'],materials:d?.deckInput?.assets.map(a=>({id:a.id,name:a.name,kind:a.kind}))||[],execution:t?{status:t.status,stage:t.deckJob?.stage}:undefined};
 }else if(destination==='mac'){
  const current=m?.taskId;
  snapshot={destination,scope:`mac/${mac.session}/${m?.window}/${m?.target}`,app:m?.app||'unknown',appName:m?.app==='workbuddy'?'WorkBuddy':m?.app==='codex'?'Codex':m?.app==='wps'?'WPS':m?.appName||'Mac 应用',subapp:m?.subapp,scene:controllerScene(m?.app||'unknown',m?.subapp,!!m?.editable),device:m?.device||'Mac',connected:mac.connected,synced:mac.synced,connectionLabel:mac.status,tasks:m&&isAgentApp(m.app)?controllerTasks(m.tasks||[],current,m.taskTitle||'当前会话').map(t=>({...t,...(t.id===current&&m.execution?{status:m.execution.status}:{})})):[],currentTask:current,target:m?{id:m.target,version:JSON.stringify([mac.session,m.window,m.target,m.text]),text:m.text,editable:m.editable}:undefined,execution:m?.execution,capabilities:m?agentCapabilities(m.app,m.capabilities):[],materials:(m?.attachments||[]).map((name,i)=>({id:String(i),name,kind:'document'}))};
 }else snapshot={destination,scope:'harmony/unavailable',app:'unknown',appName:'鸿蒙应用',scene:'unavailable',device:'鸿蒙设备',connected:false,synced:false,connectionLabel:'尚未接通',tasks:[],capabilities:[],materials:[]};
 const valid=()=>controlDestination()===destination&&(destination!=='mac'||macSnapshot().session===mac.session);
 const unavailable=()=>Promise.resolve({ok:false,error:'当前控制目标不可用'});
 const actions:ControllerActions={
  switchApp:()=>!valid()?unavailable():destination==='demo'?command('switch-step'):destination==='mac'?macCommand('app-switch',{action:'next'}):unavailable(),
  switchTask:id=>{if(!valid())return unavailable();if(destination==='mac')return macCommand('agent-task',{task:id},m);if(destination!=='demo'||currentState().app!=='workbuddy')return unavailable();return command('wb-input-task',{id});},
  newTask:()=>!valid()?unavailable():destination==='demo'&&currentState().app==='workbuddy'?command('wb-input-task',{action:'new'}):destination==='mac'?macCommand('agent-task',{task:'new'},m):unavailable(),
 };
 return {snapshot,actions};
}
