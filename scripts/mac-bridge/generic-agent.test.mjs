import {test} from 'node:test';import assert from 'node:assert/strict';import {validateCommand,Receipts} from './protocol.mjs';
const m={kind:'command',id:'request-1',seq:1,session:'s',window:'w',target:'t'};
test('generic agent operations require target and bounded manifest; legacy remains accepted',()=>{for(const op of ['agent-task','workbuddy-task'])assert.equal(validateCommand({...m,op,task:'new'},'s'),'');for(const op of ['agent-submit','agent-attach','workbuddy-submit']){assert.equal(validateCommand({...m,op,files:[],base:'test'},'s'),'');assert.notEqual(validateCommand({...m,op,files:['/tmp/private'],base:'test'},'s'),'');}assert.notEqual(validateCommand({...m,op:'agent-task',task:'same title'},'s'),'');assert.notEqual(validateCommand({...m,op:'agent-stop',target:''},'s'),'');});
test('unknown agent submit is deduplicated rather than repeated',async()=>{let n=0;const r=new Receipts();const f=()=>{n++;return {ok:false,outcome:'unknown'};};await r.run('send',1,f);await r.run('send',1,f);assert.equal(n,1);});

test('native website policy rejects address bar, lookalike hosts and non-conversation paths',async()=>{
 const {readFileSync,mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {execFileSync}=await import('node:child_process');
 if(process.platform!=='darwin')return;
 const source=readFileSync(new URL('./agent.swift',import.meta.url),'utf8');const start=source.indexOf('func registeredWebApp('),end=source.indexOf('\nfunc labels(',start);const dir=mkdtempSync(tmpdir()+'/agent-web-policy-');
 try{writeFileSync(dir+'/main.swift','import Foundation\n'+source.slice(start,end)+`\nprecondition(registeredWebApp("https://chatgpt.com/")=="chatgpt")\nprecondition(registeredWebApp("https://gemini.google.com/app/abc")=="gemini")\nfor value in ["https://chatgpt.com.evil.invalid/", "http://chatgpt.com/", "https://evil.invalid/?url=https://chatgpt.com/", "https://chatgpt.com/auth/login", "https://gemini.google.com/library", "https://user:secret@chatgpt.com/", "chrome://newtab/", "http://127.0.0.1:5208/"] {precondition(registeredWebApp(value)==nil)}\n`);execFileSync('/usr/bin/swift',[dir+'/main.swift'],{timeout:10000});}finally{rmSync(dir,{recursive:true,force:true});}
});

test('attachment polling validates owner and job identity; foreign cards cannot disappear from the manifest',async()=>{
 assert.equal(validateCommand({...m,op:'agent-attach-status',uploadId:'12df4a26-1d97-43dc-a0fa-d8e2754c45c3'},'s'),'');
 for(const patch of [{uploadId:'../file'},{target:''},{session:'other'}])assert.notEqual(validateCommand({...m,op:'agent-attach-status',uploadId:'12df4a26-1d97-43dc-a0fa-d8e2754c45c3',...patch},'s'),'');
 if(process.platform!=='darwin')return;
 const {readFileSync,mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {execFileSync}=await import('node:child_process');
 const source=readFileSync(new URL('./agent.swift',import.meta.url),'utf8'),start=source.indexOf('func resolvedAttachmentNames('),end=source.indexOf('\nfunc transportFilenameMatches(',start),dir=mkdtempSync(tmpdir()+'/agent-attachment-policy-');
 try{writeFileSync(dir+'/main.swift','import Foundation\n'+source.slice(start,end)+`\nlet aliases=["原始文件.txt":"ia12345678.txt"]
precondition(resolvedAttachmentNames(["ia12345678"],aliases)==["原始文件.txt"])
precondition(resolvedAttachmentNames(["ia12345678.txt"],aliases)==["原始文件.txt"])
precondition(resolvedAttachmentNames(["ia12345678","other"],aliases)==["原始文件.txt","unverified:other"])
precondition(resolvedAttachmentNames(["truncated..."],aliases)==["unverified:truncated..."])
precondition(resolvedAttachmentNames([],aliases).isEmpty)
`);execFileSync('/usr/bin/swift',[dir+'/main.swift'],{timeout:10000});}finally{rmSync(dir,{recursive:true,force:true});}
});


test('platform numeric attachment renaming remains bounded to the selected transport file',async()=>{
 if(process.platform!=='darwin')return;
 const {readFileSync,mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {execFileSync}=await import('node:child_process');
 const source=readFileSync(new URL('./agent.swift',import.meta.url),'utf8'),start=source.indexOf('func transportFilenameMatches('),end=source.indexOf('\nfunc uploadCardIdentity(',start),dir=mkdtempSync(tmpdir()+'/agent-filename-policy-');
 try{writeFileSync(dir+'/main.swift','import Foundation\n'+source.slice(start,end)+`\nlet url=URL(fileURLWithPath:"/private/ia12345678.txt")
for value in ["ia12345678.txt","ia12345678","ia12345678(2).txt","ia12345678 (12).txt"]{precondition(transportFilenameMatches(value,url))}
for value in ["ia12345678(2).png","other.txt","ia12345678evil.txt","ia12345678(abc).txt","prefixia12345678.txt"]{precondition(!transportFilenameMatches(value,url))}
`);execFileSync('/usr/bin/swift',[dir+'/main.swift'],{timeout:10000});}finally{rmSync(dir,{recursive:true,force:true});}
});

test('bounded conversation list retains a unique current task beyond the first page without choosing an ambiguous title',async()=>{
 if(process.platform!=='darwin')return;
 const {readFileSync,mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {execFileSync}=await import('node:child_process');
 const source=readFileSync(new URL('./agent.swift',import.meta.url),'utf8'),start=source.indexOf('func boundedTaskIndexes('),end=source.indexOf('\nfunc ',start+5),dir=mkdtempSync(tmpdir()+'/agent-task-policy-');
 try{writeFileSync(dir+'/main.swift','import Foundation\n'+source.slice(start,end)+`\nlet titles=(0..<90).map{"task-"+String($0)}
let bounded=boundedTaskIndexes(titles,"task-85")
precondition(bounded.count==60 && bounded.contains(85) && Set(bounded).count==60)
precondition(boundedTaskIndexes(titles,"task-3")==Array(0..<60))
precondition(boundedTaskIndexes(titles,"missing")==Array(0..<60))
precondition(boundedTaskIndexes([],"missing").isEmpty)
precondition(boundedTaskIndexes(titles,"task-85",0).isEmpty)
var ambiguous=titles;ambiguous[80]="task-85"
precondition(!boundedTaskIndexes(ambiguous,"task-85").contains(85))
`);execFileSync('/usr/bin/swift',[dir+'/main.swift'],{timeout:10000});}finally{rmSync(dir,{recursive:true,force:true});}
});

test('Codex row status reports observed work/unread only and never assumes completion',async()=>{
 if(process.platform!=='darwin')return;
 const {readFileSync,mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {execFileSync}=await import('node:child_process');
 const s=readFileSync(new URL('./agent.swift',import.meta.url),'utf8'),start=s.indexOf('func codexRowStatus('),end=s.indexOf('\nfunc codexTaskStatus(',start),dir=mkdtempSync(tmpdir()+'/codex-status-policy-');
 try{writeFileSync(dir+'/main.swift','import Foundation\n'+s.slice(start,end)+`\nprecondition(codexRowStatus(["Working"])=="running")
precondition(codexRowStatus(["Unread"])=="unread")
for label in ["Need input","Needs input","Waiting for input","需要输入"] {precondition(codexRowStatus([label])=="needs-input")}
precondition(codexRowStatus(["Working","Need input"])=="needs-input")
precondition(codexRowStatus(["View activity, needs attention","Please discuss need input"])=="unknown")
precondition(codexRowStatus(["Unread","Working"])=="running")
precondition(codexRowStatus([])=="unknown")
precondition(codexRowStatus(["Created by your dot","Scheduled task run"])=="unknown")
precondition(codexRowStatus(["Discuss working policy","unreadable"])=="unknown")
`);execFileSync('/usr/bin/swift',[dir+'/main.swift'],{timeout:10000});}finally{rmSync(dir,{recursive:true,force:true});}
});

test('live composer actions require opaque identity and reject old sessions',()=>{
 const actionId='b65e6f70-49cd-4fc8-b42c-c79ade76139d';
 assert.equal(validateCommand({...m,op:'agent-action',actionId},'s'),'');
 for(const patch of [{actionId:''},{actionId:'Steer'},{session:'old'},{target:''}])assert.notEqual(validateCommand({...m,op:'agent-action',actionId,...patch},'s'),'');
 assert.equal(validateCommand({...m,op:'agent-submit',actionId,files:[],base:'test'},'s'),'');
});

test('composer submission labels never interpret stop or steer as sending',async()=>{
 if(process.platform!=='darwin')return;
 const {readFileSync,mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {execFileSync}=await import('node:child_process');
 const s=readFileSync(new URL('./agent.swift',import.meta.url),'utf8'),start=s.indexOf('func composerSubmissionKind('),end=s.indexOf('\nfunc submitButton(',start),dir=mkdtempSync(tmpdir()+'/composer-actions-');
 try{writeFileSync(dir+'/main.swift','import Foundation\n'+s.slice(start,end)+`\nprecondition(composerSubmissionKind("Send")=="send")
precondition(composerSubmissionKind("Queue message")=="queue")
precondition(composerSubmissionKind("Queue")=="queue")
for label in ["Stop","Steer","Stop generating","Discuss send message","Resend"] {precondition(composerSubmissionKind(label)==nil)}
`);execFileSync('/usr/bin/swift',[dir+'/main.swift'],{timeout:10000});}finally{rmSync(dir,{recursive:true,force:true});}
});

test('text synchronization validates UTF-16 caret and selected range',()=>{
 const text='甲😀乙';for(const selection of [[0,0],[3,0],[1,2],[text.length,0]])assert.equal(validateCommand({...m,op:'replace-text',base:'',text,selection},'s'),'');
 for(const selection of [[-1,0],[1,5],[0.5,0],[0],['1',0],[0,NaN]])assert.notEqual(validateCommand({...m,op:'replace-text',base:'',text,selection},'s'),'');
});

test('selection actions require a bound current control identity',()=>{assert.equal(validateCommand({...m,op:'agent-selection',actionId:'11111111-1111-4111-8111-111111111111'},'s'),'');for(const patch of [{actionId:'Edit'},{target:''},{session:'other'}])assert.notEqual(validateCommand({...m,op:'agent-selection',actionId:'11111111-1111-4111-8111-111111111111',...patch},'s'),'');});
test('review actions require separate proposal and action identities',()=>{const good={...m,op:'agent-review',reviewId:'11111111-1111-4111-8111-111111111111',actionId:'22222222-2222-4222-8222-222222222222'};assert.equal(validateCommand(good,'s'),'');for(const patch of [{reviewId:'Accept'},{actionId:'Accept'},{target:''},{session:'other'}])assert.notEqual(validateCommand({...good,...patch},'s'),'');});
test('direct document edits replace only the changed UTF16 span and preserve surrounding content',async()=>{
 if(process.platform!=='darwin')return;
 const {readFileSync,mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {execFileSync}=await import('node:child_process');
 const source=readFileSync(new URL('./agent.swift',import.meta.url),'utf8'),start=source.indexOf('func documentTextPatch('),end=source.indexOf('\nfunc fail(',start),dir=mkdtempSync(tmpdir()+'/agent-document-patch-');
 try{writeFileSync(dir+'/main.swift','import Foundation\n'+source.slice(start,end)+`\nfor pair in [("甲乙丙","甲新增乙丙"),("甲😀乙","甲😄乙"),("前\\n正文\\n后","前\\n新正文\\n后"),("测试",""),("","输入"),("相同","相同")] {let (range,value)=documentTextPatch(pair.0,pair.1);let restored=(pair.0 as NSString).replacingCharacters(in:NSRange(location:range.location,length:range.length),with:value);precondition(restored==pair.1)}\nlet (range,value)=documentTextPatch("甲乙丙","甲新增乙丙");precondition(range.location==1 && range.length==0 && value=="新增")\n`);execFileSync('/usr/bin/swift',[dir+'/main.swift'],{timeout:10000});}finally{rmSync(dir,{recursive:true,force:true});}
});

test('observed WorkBuddy canvas fields and pending menus cannot match transcript edit buttons or canvas clipboard proxies',async()=>{
 if(process.platform!=='darwin')return;
 const {readFileSync,mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {execFileSync}=await import('node:child_process');
 const source=readFileSync(new URL('./agent.swift',import.meta.url),'utf8'),start=source.indexOf('func workbuddyFieldRole('),end=source.indexOf('func workbuddyInstructionButton(',start),dir=mkdtempSync(tmpdir()+'/workbuddy-context-policy-');
 try{writeFileSync(dir+'/main.swift','import Foundation\n'+source.slice(start,end)+`
precondition(workbuddyFieldRole("AXTextArea",["index-aiInput-aRwru"],"说说你想怎么修改",true)=="instruction")
precondition(workbuddyFieldRole("AXTextArea",["_editable_1cxd2_1"],"",false)=="prompt")
precondition(workbuddyFieldRole("AXTextArea",["CopyPasteAssist"],"",true)==nil)
precondition(workbuddyFieldRole("AXTextField",["style_hidden-editor-input__d1UFL"],"",true)==nil)
precondition(workbuddyFieldRole("AXTextArea",["index-aiInput-aRwru"],"说说你想怎么修改",false)==nil)
precondition(workbuddyPendingActions(["pending-edit-confirm-toast"],["取消","发送"]))
precondition(workbuddyPendingActions(["pending-edit-confirm-toast"],["取消"]))
precondition(!workbuddyPendingActions(["pending-edit-confirm-toast"],[]))
precondition(!workbuddyPendingActions(["transcript"],["取消","发送"]))
precondition(!workbuddyPendingActions(["pending-edit-confirm-toast"],["取消","发送","删除"]))
precondition(!workbuddyPendingActions(["pending-edit-confirm-toast"],["发送","发送"]))
`);execFileSync('/usr/bin/swift',[dir+'/main.swift'],{timeout:10000});}finally{rmSync(dir,{recursive:true,force:true});}
});

test('attachment deletion is scoped to exactly one owned file and never accepts a path or task deletion',()=>{const good={...m,op:'agent-detach',files:['11111111-1111-4111-8111-111111111111'],base:'fictional'};assert.equal(validateCommand(good,'s'),'');for(const patch of [{files:[]},{files:['../private']},{files:[...good.files,...good.files]},{session:'other'},{target:''}])assert.notEqual(validateCommand({...good,...patch},'s'),'');});
