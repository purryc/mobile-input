import type {Command,State,DataTable} from './model';
import type {WbTask} from './workbuddy';
import {bodyText,ensureFileDocuments,fileDraft,browserState,type FileBody} from './workbuddy-files';
import {initialWbInput} from './workbuddy-input';
export interface ReceiptWorkflow {
 revision:number;materials:string[];rows:string[][];
 request:null|{id:string;version:number;scope:'demo-workspace';file:string;fileRevision:number;draftRevision:number;rows:string[][];status:'pending'|'approved'|'rejected'};
}
const fileId='receipt-summary',scope='demo-workspace' as const;
export const demoReceiptPack={id:'demo-receipts',name:'澄星拜访 · 3 张演示票据',columns:['日期','类型','金额（元）'],rows:[['2026-10-14','交通','68.00'],['2026-10-14','办公用品','126.00'],['2026-10-14','工作餐','89.00']]};
function ensureSummary(s:State){
 if(!s.workbuddy.files.some(f=>f.id===fileId)){
  const table:DataTable={columns:[...demoReceiptPack.columns],rows:[['2026-10-13','交通','32.00']]};
  const content=bodyText({text:'',table});
  s.officeFiles.push({id:'office-'+fileId,kind:'sheet',name:'票据汇总.xlsx',table});
  s.workbuddy.files.push({id:fileId,name:'票据汇总.xlsx',kind:'sheet',officeId:'office-'+fileId,content,draft:fileDraft(content),folder:'演示工作区',task:'',edited:false,dataVersion:s.reportRevision});
 }ensureFileDocuments(s);
}
export function submitMaterials(s:State,t:WbTask,text:string,id:string):string|null{
 const r=t.receipts!,d=s.workbuddy.drafts[t.id];
 if(r.request?.status==='approved')return '当前材料已经写入';
 if(!r.materials.length||!r.rows.length)return '请先添加要整理的票据';
 ensureSummary(s);const doc=browserState(s).docs[fileId];
 r.revision++;r.request={id,version:r.revision,scope,file:fileId,fileRevision:doc.revision,draftRevision:d.revision+1,rows:structuredClone(r.rows),status:'pending'};
 t.status='approval';t.messages.push({id:id+'-user',role:'user',text:text||'整理这些演示票据'},{id:id+'-scope',role:'assistant',text:`等待批准：向票据汇总.xlsx 追加 ${r.rows.length} 行，保留现有数据。范围：当前演示工作区。`});
 t.input=d.input?structuredClone(d.input):undefined;t.sourceFiles=[...new Set([...(t.sourceFiles||[]),...d.attachments])];d.attachments=[];d.references=[];d.input=initialWbInput();d.text='';d.revision++;if(s.target?.id===`wb:draft:${t.id}`)s.target.value='';return null;
}
export function materialsInteraction(s:State,c:Command):string|null|undefined{
 if(!['wb-reference-task','wb-material-task','wb-material','wb-approval'].includes(c.type))return undefined;
 const w=s.workbuddy,v=(c.value||{}) as Record<string,unknown>;
 if(c.type==='wb-reference-task'){
  if(s.app!=='workbuddy')return 'WorkBuddy 已退出';
  let task=w.tasks.find(t=>t.referenceRequest&&t.status==='needs-materials');
  if(!task){const id=c.id;task={id,title:'补充汇报材料',referenceRequest:true,messages:[{id:id+'-prompt',role:'assistant',text:'请补充客户资料和汇报参考。可以选择文件，或从视频中截取画面、录制片段，再补充需要强调的内容。'}],status:'needs-materials',kind:'slides',mode:'agent',model:w.settings.model,expert:'',project:'chengxing',favorite:false,step:0,epoch:id,startedAt:0,elapsed:0,files:[],dataVersion:s.reportRevision};w.tasks.unshift(task);w.drafts[id]={...fileDraft(),input:initialWbInput()};}
  w.task=task.id;w.page='task';w.preview=[];w.previewActive=null;w.filePanel=false;
  s.target={id:`wb:draft:${task.id}`,app:'workbuddy',kind:'text',label:task.title,revision:s.revision+1,value:w.drafts[task.id].text};return null;
 }

 if(c.type==='wb-material-task'){
  let task=w.tasks.find(t=>t.receipts);
  if(!task){const id=c.id;task={id,title:'票据汇总',messages:[{id:id+'-prompt',role:'assistant',text:'补充要整理的演示票据，核对后再批准写入。'}],status:'needs-materials',kind:null,mode:'agent',model:w.settings.model,expert:'',project:'chengxing',favorite:false,step:0,epoch:id,startedAt:0,elapsed:0,files:[],dataVersion:s.reportRevision,receipts:{revision:0,materials:[],rows:[],request:null}};w.tasks.unshift(task);w.drafts[id]={...fileDraft(),input:initialWbInput()};}
  w.task=task.id;w.page='task';w.preview=[];w.previewActive=null;w.filePanel=false;
  s.target={id:`wb:draft:${task.id}`,app:'workbuddy',kind:'text',label:task.title,revision:s.revision+1,value:w.drafts[task.id].text};return null;
 }
 const t=w.tasks.find(x=>x.id===w.task),r=t?.receipts,target=s.target;
 if(!t||!r||v.task!==t.id||!target||target.id!==`wb:draft:${t.id}`||c.targetId!==target.id||c.targetRevision!==target.revision)return '任务或输入对象已变化';
 if(v.revision!==r.revision)return '票据请求版本已变化';
 if(c.type==='wb-material'){
  if(r.request?.status==='approved')return '这些票据已经写入';
  if(v.action==='add'&&v.material===demoReceiptPack.id){r.materials=[demoReceiptPack.id];r.rows=structuredClone(demoReceiptPack.rows);}
  else if(v.action==='remove'){r.materials=[];r.rows=[];}
  else return '材料不存在';
  r.revision++;if(r.request?.status==='pending')r.request.status='rejected';t.status='needs-materials';return null;
 }
 const request=r.request,d=w.drafts[t.id];
 if(!request||v.request!==request.id||v.version!==request.version||v.scope!==request.scope||v.file!==request.file||v.fileRevision!==request.fileRevision)return '批准范围或版本已变化';
 if(request.status!=='pending')return '该请求已处理';
 if(d.revision!==request.draftRevision)return '补充条件已变化，请先发送新的请求';
 if(v.decision==='reject'){request.status='rejected';r.revision++;t.status='needs-materials';t.messages.push({id:c.id,role:'assistant',text:'已拒绝本次写入，材料与文件均已保留。'});return null;}
 if(v.decision!=='approve')return '请选择批准或拒绝';
 const doc=browserState(s).docs[request.file];
 if(!doc||doc.revision!==request.fileRevision||!doc.saved.table)return '汇总文件已变化，请重新发送并核对范围';
 const before=structuredClone(doc.saved),after:FileBody=structuredClone(before);after.table!.rows.push(...structuredClone(request.rows));
 doc.saved=after;doc.revision++;doc.savedAt=Date.now();doc.changes.push({id:c.id,at:doc.savedAt,source:'批准追加票据',before,after:structuredClone(after)});
 const file=w.files.find(f=>f.id===request.file)!;file.content=bodyText(after);file.draft=fileDraft(file.content);file.edited=true;
 s.officeFiles.find(f=>f.id===file.officeId)!.table=structuredClone(after.table!);
 request.status='approved';r.revision++;t.status='complete';t.files=[request.file];t.messages.push({id:c.id,role:'assistant',text:`已追加 ${request.rows.length} 行票据，原有 ${before.table!.rows.length} 行保持不变。`});
 return null;
}
