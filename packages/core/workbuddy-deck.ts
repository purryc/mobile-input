import {promptArtifactContext,promptContextMatches} from './workbuddy-prompt';
import type {State,Command} from './model';
import {emptyDeckInput,validateDeck,validAsset,validStrokes,type WebDeck} from './web-deck';
import {resolveLiveParameters,projectTargetInput,workBuddyInputCapabilities,isPresentationRequest} from './live-workbuddy';
import {browserState,findFileView,fileBody,working,editBody,fileReadOnly,fileConflict} from './workbuddy-files';
const draft=()=>({text:'',revision:0,sequence:0,session:'',attachments:[],references:[],deckInput:emptyDeckInput()});
export function workBuddyDeckInteraction(s:State,c:Command):string|null|undefined {
 if(!c.type.startsWith('wb-deck-'))return undefined;
 if(c.inputClient&&['wb-deck-stage','wb-deck-complete','wb-deck-failed'].includes(c.type))return '生成结果仅由执行端确认';
 const w=s.workbuddy,v=(c.value||{}) as Record<string,any>;
 if(c.type==='wb-deck-new'){const id=c.id;w.tasks.unshift({id,title:'产品介绍 · 网页演示',messages:[],status:'draft',kind:'slides',mode:'agent',model:'Gemini',expert:'',project:'',favorite:false,step:0,epoch:id,startedAt:0,elapsed:0,files:[],dataVersion:s.reportRevision,deckJob:{engine:'gemini-html',stage:'准备输入'}});w.drafts[id]={...draft(),owner:c.id};w.task=id;w.page='home';w.preview=[];w.previewActive=null;w.filePanel=false;w.fileBrowser!.visible=false;s.target={id:`wb:draft:${id}`,app:'workbuddy',kind:'text',label:'产品介绍需求',value:'',revision:s.revision+1};return null;}
 if(c.type==='wb-deck-prepare'){
  const taskId=w.page==='home'&&w.drafts[w.task]?w.task:'new';const d=w.drafts[taskId]??=draft();d.owner??=c.id;d.deckInput??=emptyDeckInput();
  if(!d.text.trim())d.text='做一份产品介绍PPT';else if(!isPresentationRequest(d.text))d.text+='\n请据此制作PPT。';d.revision++;w.task=taskId;w.page='home';
  s.target={id:`wb:draft:${taskId}`,app:'workbuddy',kind:'text',label:'WorkBuddy · 新建任务',value:projectTargetInput(d.text,d.deckInput.parameters,d.deckInput.assets,workBuddyInputCapabilities).text,revision:s.revision+1};return null;
 }
 let task=w.tasks.find(t=>t.id===v.task);const d=w.drafts[String(v.task)];
 let submittedTaskId=String(v.task);
 const promptValid=()=>v.prompt===true&&w.task===submittedTaskId&&!!d&&v.owner===(d.owner||'')&&v.revision===d.revision;
 const targetValid=()=>promptValid()||s.target?.id===`wb:draft:${submittedTaskId}`&&c.targetId===s.target.id&&c.targetRevision===s.target.revision;
 if(c.type==='wb-deck-prompt-edit'){
  if(w.task!==v.task||!d||v.owner!==(d.owner||'')||task?.status==='running'||v.revision!==d.revision)return '任务或草稿已变化';
  if(typeof v.text!=='string'||v.text.length>20000||typeof v.session!=='string'||!v.session||!Number.isInteger(v.sequence)||v.sequence<1)return '输入无效';
  if(d.session===v.session&&v.sequence<=d.sequence)return '已忽略过期编辑';
  d.text=v.text;d.revision++;d.sequence=v.sequence;d.session=v.session;d.deckInput??=emptyDeckInput();
  if(s.target?.id===`wb:draft:${v.task}`)s.target.value=projectTargetInput(d.text,d.deckInput.parameters,d.deckInput.assets,workBuddyInputCapabilities).text;
  return null;
 }
 if(c.type==='wb-deck-start'&&v.prompt&&!promptContextMatches(s,v.context))return '成果上下文已变化，请重新发送';
 const context=c.type==='wb-deck-start'?promptArtifactContext(s):undefined;

 // Confirmed attachments synchronize into the unsent draft. Explicit Send freezes
 // the verified manifest; neither adoption nor removal starts a task.
 if(c.type==='wb-deck-start'&&v.assets!==undefined){
  if(!d||(!task&&v.task!=='new')||!targetValid()||v.revision!==d.revision||v.inputRevision!==(d.deckInput?.revision||0)||v.owner!==(d.owner||''))return '任务或输入已变化，材料保留在手机';
  if(!Array.isArray(v.assets)||v.assets.length>12||!v.assets.every(validAsset)||new Set(v.assets.map((a:any)=>a.id)).size!==v.assets.length||v.assets.reduce((n:number,a:any)=>n+a.size,0)>24*1024*1024)return '材料清单无效';
  if(!d.text.trim()||task?.status==='running'||task?.receipts||task?.referenceRequest)return '当前任务不可提交';
  // All remaining start checks below are satisfied before changing the draft.
  d.deckInput={...(d.deckInput||emptyDeckInput()),assets:structuredClone(v.assets),sketchDrafts:[]};
 }
 if(c.type==='wb-deck-input'){
  if((!task&&v.task!=='new')||task?.receipts||task?.referenceRequest||!d||task?.status==='running')return '原任务不可编辑，材料尚未采用';
  if(v.owner!==undefined&&v.owner!==(d.owner||''))return '原输入已结束，材料已保留';
  const input=d.deckInput??=emptyDeckInput();if(v.revision!==input.revision)return '输入参数已更新，请重试';
  if(v.action==='asset'){if(!validAsset(v.asset))return '材料格式无效';const retained=input.assets.filter(a=>a.id!==v.replace&&a.id!==v.asset.id);if(retained.length>=12)return '最多采用 12 份材料';if(retained.reduce((sum,a)=>sum+a.size,0)+v.asset.size>24*1024*1024)return '总材料超过 24 MB';input.assets=[...retained,structuredClone(v.asset)];if(v.asset.kind==='sketch')input.sketchDrafts=input.sketchDrafts?.filter(a=>a.scope!==v.asset.scope);}
  else if(v.action==='sketch-draft'){if(typeof v.scope!=='string'||v.scope.length>80||typeof v.replace!=='string'||v.replace.length>100||!validStrokes(v.strokes))return '草图格式无效';input.sketchDrafts=(input.sketchDrafts||[]).filter(a=>a.scope!==v.scope);if(v.strokes.length){if(input.sketchDrafts.length>=12)return '草图过多';input.sketchDrafts.push({scope:v.scope,replace:v.replace,strokes:v.strokes});}}
  else if(v.action==='remove')input.assets=input.assets.filter(a=>a.id!==v.assetId);
  else if(v.action==='parameter'){if(v.sourceText!==undefined&&v.sourceText!==d.text)return '文字已更新，请重新选择参数';input.parameters=resolveLiveParameters(d.text,input.parameters);const p=input.parameters.find(p=>p.id===v.id);if(!p||typeof v.value!=='string'||p.kind==='color'&&!/^#[0-9a-f]{6}$/i.test(v.value)||p.kind==='duration'&&(!/^\d+$/.test(v.value)||+v.value<1||+v.value>60))return '参数已变化或格式无效';p.value=v.value;p.label=p.kind==='duration'?v.value:p.kind==='color'?'自选色':p.label;p.manual=true;}
  else return '未知参数操作';input.revision++;if(s.target?.id===`wb:draft:${v.task}`)s.target.value=projectTargetInput(d.text,input.parameters,input.assets,workBuddyInputCapabilities).text;return null;
 }
 if(['wb-deck-start','wb-deck-retry','wb-deck-stage','wb-deck-complete','wb-deck-failed','wb-deck-stop'].includes(c.type)){
  if(c.type==='wb-deck-start'&&v.task==='new'&&d){
   if(!targetValid()||v.revision!==d.revision)return '任务或文字已变化';
   if(!d.text.trim())return '请输入需求';if(d.deckInput?.sketchDrafts?.some(a=>a.strokes.length))return '请先采用或清空未完成的草图';
   task={id:c.id,title:'网页演示',messages:[],status:'draft',kind:'slides',mode:'agent',model:'Gemini',expert:'',project:'',favorite:false,step:0,epoch:c.id,startedAt:0,elapsed:0,files:[],dataVersion:s.reportRevision,deckJob:{engine:'gemini-html',stage:'准备输入'}};
   w.tasks.unshift(task);w.task=task.id;w.page='task';w.drafts[task.id]=d;w.drafts.new=draft();
   if(s.target?.id==='wb:draft:new'){s.target.id=`wb:draft:${task.id}`;c={...c,targetId:s.target.id};}submittedTaskId=task.id;
  }
  if(c.type==='wb-deck-start'&&task&&!task.deckJob&&d){
   if(task.receipts||task.referenceRequest)return '当前任务不支持网页演示';
   if(task.status==='running'||!targetValid()||v.revision!==d.revision)return '任务或文字已变化';
   task.deckJob={engine:'gemini-html',stage:'准备输入'};task.kind='slides';
  }
  if(!task?.deckJob||!d)return '任务不存在';const job=task.deckJob;
  if(c.type==='wb-deck-start'){
   if(task.status==='running'||!targetValid()||v.revision!==d.revision)return '任务或文字已变化';
   if(!d.text.trim())return '请输入需求';if(d.deckInput?.sketchDrafts?.some(a=>a.strokes.length))return '请先采用或清空未完成的草图';const input=d.deckInput??emptyDeckInput();input.parameters=resolveLiveParameters(d.text,input.parameters);const projected=projectTargetInput(d.text,input.parameters,input.assets,workBuddyInputCapabilities);job.request={text:projected.text,context,input:{...structuredClone(input),parameters:resolveLiveParameters(projected.text)}};task.title=projected.text.slice(0,28);task.messages.push({id:c.id,role:'user',text:projected.text});d.text='';d.revision++;d.deckInput=emptyDeckInput();if(s.target?.id===`wb:draft:${task.id}`)s.target.value='';w.lastSubmission={id:c.id,task:task.id,at:Date.now()};
  }else if(c.type==='wb-deck-retry'){if(task.status!=='paused'||!job.request)return '当前任务不能重试';}
  else if(c.type==='wb-deck-stop'){if(task.status!=='running')return '任务已停止';task.status='paused';task.epoch=c.id;job.stage='已停止';return null;}
  else {
   if(task.status!=='running'||task.epoch!==v.epoch)return '生成结果已过期';
   if(c.type==='wb-deck-stage'){job.stage=String(v.stage).slice(0,80);return null;}
   if(c.type==='wb-deck-failed'){task.status='paused';job.stage='生成未完成';job.error=String(v.error).slice(0,300);return null;}
   if(!validateDeck(v.deck))return '生成结果无效';const fileId='web-deck-'+c.id;const deck=structuredClone(v.deck as WebDeck);w.files.push({id:fileId,name:deck.title+'.html',kind:'slides',content:deck.pages.map(p=>p.title+'\n'+p.body).join('\n\n'),draft:draft(),folder:'网页演示',task:task.id,edited:false,dataVersion:s.reportRevision});browserState(s).docs[fileId]={revision:0,saved:{text:'',webDeck:deck},savedAt:Date.now(),changes:[]};task.files.push(fileId);task.elapsed+=Math.max(0,Date.now()-task.startedAt);task.startedAt=0;task.model=deck.model;task.status='complete';job.stage='已完成';task.messages.push({id:c.id,role:'assistant',text:'网页演示已生成，可打开编辑与播放。'});return null;
  }
  w.page='task';task.status='running';task.epoch=c.id;task.startedAt=Date.now();job.stage='准备生成';delete job.error;return null;
 }
 const view=findFileView(s,String(v.view||'panel')),file=String(v.file||'');
 if(c.type==='wb-deck-page'){if(!view||view.active!==file||!fileBody(s,view,file).webDeck?.pages.some(p=>p.id===v.page))return '页面不存在';view.promptPage={file,page:v.page};s.target=null;return null;}
 if(c.type==='wb-deck-playback'){
  const body=view&&fileBody(s,view,file);if(!body?.webDeck)return '文稿不存在';const page=body.webDeck.pages.find(p=>p.id===v.pageId)||body.webDeck.pages[0];w.deckPlayback=v.stop?undefined:{file,view:view!.id,pageId:page.id};if(!v.stop)s.target=null;return null;
 }
 if(c.type==='wb-deck-edit'){
  if(!view||view.active!==file||fileReadOnly(s,view,file)||fileConflict(s,view,file))return '文稿只读或已变化';
  const a=working(s,view,file);if(v.version!==a.version||v.base!==a.base)return '页面已更新，修改未覆盖';const body=structuredClone(a.body),deck=body.webDeck;if(!deck)return '文稿不存在';const page=deck.pages.find(p=>p.id===v.pageId);
  switch(v.action){
   case 'patch':if(!page||!v.patch||Object.keys(v.patch).some(k=>!['title','body','notes','background','primary','textColor','layout','photoIds','imageFit'].includes(k)))return '修改内容无效';Object.assign(page,v.patch);if(page.photoFits)page.photoFits=Object.fromEntries(Object.entries(page.photoFits).filter(([id])=>page.photoIds.includes(id)));break;
   case 'insert':if(deck.pages.length>=20)return '最多 20 页';deck.pages.splice(page?deck.pages.indexOf(page)+1:deck.pages.length,0,{id:c.id,label:'新页面',title:'新页面',body:'',notes:'',layout:'stack',photoIds:[],background:'#FFFFFF',primary:'#146C64',textColor:'#182431',imageFit:'contain'});break;
   case 'delete':if(!page||deck.pages.length===1)return '至少保留一页';deck.pages=deck.pages.filter(p=>p.id!==page.id);break;
   case 'move':{if(!page||![-1,1].includes(v.offset))return '页面顺序无效';const i=deck.pages.indexOf(page),j=i+v.offset;if(j<0||j>=deck.pages.length)return null;deck.pages.splice(i,1);deck.pages.splice(j,0,page);break;}
   case 'photo-fit':if(!page||!page.photoIds.includes(v.photoId)||!['contain','cover'].includes(v.fit))return '图片目标无效';page.photoFits={...page.photoFits,[v.photoId]:v.fit};break;
   case 'photo':if(!page||!validAsset(v.asset)||v.asset.kind!=='photo')return '照片无效';deck.assets=deck.assets.filter(a=>a.id!==v.asset.id);deck.assets.push(v.asset);if(page.photoFits&&v.replace){page.photoFits[v.asset.id]=page.photoFits[v.replace]||page.imageFit;delete page.photoFits[v.replace];}page.photoIds=v.replace&&page.photoIds.includes(v.replace)?page.photoIds.map(id=>id===v.replace?v.asset.id:id):[...page.photoIds,v.asset.id];break;
   default:return '未知编辑';
  }
  if(!validateDeck(deck))return '页面数据无效';return editBody(s,view,file,body,'网页演示编辑');
 }
 return '未知网页演示操作';
}
