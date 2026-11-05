import {test,expect} from '@playwright/test';

test('attachment adoption waits for verified completion and never submits a prompt',async({page})=>{
 await page.goto('/?role=phone&bridge=5191');
 const result=await page.evaluate(async()=>{
  const {adoptAgentMaterials}=await import('/src/mac-attachment-adoption.ts');
  const target={app:'gemini',window:'w',target:'t'};const snap=()=>({connected:true,synced:true,session:'s',state:target});
  const calls:string[]=[];let time=0;
  const result=await adoptAgentMaterials(['file-id'],'虚构草稿',target as any,async(op:string)=>{
   calls.push(op);return calls.length<4?{ok:true,uploadStatus:'pending',uploadId:'job'}:{ok:true,outcome:'verified'};
  },snap as any,async()=>{time+=350},()=>time);
  return {result,calls};
 });
 expect(result.result).toMatchObject({ok:true,outcome:'verified'});
 expect(result.calls).toEqual(['agent-attach','agent-attach-status','agent-attach-status','agent-attach-status']);
});

test('upload failure, lost receipt, timeout and owner change never cause automatic submit or re-upload',async({page})=>{
 await page.goto('/?role=phone&bridge=5191');
 const outcomes=await page.evaluate(async()=>{
  const {adoptAgentMaterials}=await import('/src/mac-attachment-adoption.ts');const all=[];
  for(const scenario of ['failure','unknown','owner','timeout']){
   const target={app:'chatgpt',window:'w',target:'t'};let current=target,time=0;const calls:string[]=[];
   const result=await adoptAgentMaterials(['file-id'],'虚构草稿',target as any,async(op:string)=>{
    calls.push(op);
    if(scenario==='failure')return {ok:false,outcome:'rejected',error:'上传被目标拒绝'};
    if(scenario==='unknown')return {ok:true,outcome:'executed'};
    return {ok:true,uploadStatus:'pending',uploadId:'job'};
   },()=>({connected:true,synced:true,session:'s',state:current}) as any,async()=>{time+=91000;if(scenario==='owner')current={...target,target:'another'};},()=>time);
   all.push({scenario,result,calls});
  }return all;
 });
 for(const o of outcomes){expect(o.result.ok).toBe(false);expect(o.calls.filter(x=>x==='agent-attach')).toHaveLength(1);expect(o.calls).not.toContain('agent-submit');}
});

for(const app of ['codex','chatgpt','gemini'])test(`${app} shared panel transfers document, confirmed image and drawn sketch on confirmation before explicit send`,async({page})=>{
 const {createHash,randomUUID}=await import('node:crypto');
 let state:any={device:'Fixture Mac',permission:true,app,appName:app,taskId:'fictional',tasks:[{id:'fictional',title:'虚构附件验收'}],windowTitle:'Fixture',window:'w',target:'t',text:'请参考我的文件，添加产品图片，布局我画一下。',editable:true,textKnown:true,selection:[0,0],capabilities:['replace-text','agent-submit','agent-attach']};
 const ops:any[]=[],files=new Map<string,{name:string;size:number;sha256:string;data:Buffer[]}>();let polls=0,detachAttempts=0;
 await page.routeWebSocket('ws://127.0.0.1:39872/control',socket=>{const publish=()=>socket.send(JSON.stringify({kind:'state',session:'fixture-upload',state}));socket.onMessage(raw=>{
  const m=JSON.parse(String(raw));if(m.kind==='pair'){socket.send(JSON.stringify({kind:'connected',session:'fixture-upload',bridgeId:'fixture'}));publish();return;}if(m.kind!=='command')return;ops.push(m);let r:any={ok:true,outcome:'verified'};
  if(m.op==='replace-text')state={...state,text:m.text};
  if(m.op==='file-begin'){const id=randomUUID();files.set(id,{name:m.name,size:m.size,sha256:m.sha256,data:[]});r.fileId=id;}
  if(m.op==='file-chunk')files.get(m.fileId)!.data.push(Buffer.from(m.data,'base64'));
  if(m.op==='file-finish'){const f=files.get(m.fileId)!;r.file={id:m.fileId,name:f.name,size:f.size,sha256:f.sha256};}
  if(m.op==='agent-attach')r={ok:true,outcome:'executed',uploadStatus:'pending',uploadId:'b2693068-71c7-457c-83cb-a0fe5c2497aa'};
  if(m.op==='agent-attach-status'){polls++;r=polls<2?{ok:true,outcome:'executed',uploadStatus:'pending',uploadId:m.uploadId}:{ok:true,outcome:'verified',uploadStatus:'verified'};}
  if(m.op==='agent-detach'&&app==='gemini'&&++detachAttempts===1)r={ok:false,outcome:'rejected',error:'模拟删除失败，附件保留待重试'};
  if(m.op==='agent-submit')r={ok:false,outcome:'rejected',error:'模拟目标拒绝提交；没有真实任务'};
  socket.send(JSON.stringify({...r,kind:'ack',session:'fixture-upload',id:m.id,state}));publish();
 });});
 await page.setViewportSize({width:390,height:844});await page.goto('/?role=phone&bridge=5191');await page.getByRole('radio',{name:'Mac 应用'}).check();await page.getByLabel('Mac 地址',{exact:true}).fill('127.0.0.1');await page.getByLabel('Mac 配对码',{exact:true}).fill('123456');await page.getByRole('button',{name:'连接 Mac',exact:true}).click();
 const doc=Buffer.from('虚构材料：红色台灯，10 W。');let chooser=page.waitForEvent('filechooser');await page.locator('.sentence-token[data-kind="document"]').click();await (await chooser).setFiles({name:'fictional.txt',mimeType:'text/plain',buffer:doc});
 await expect.poll(()=>ops.filter(m=>m.op==='agent-attach-status').length).toBeGreaterThanOrEqual(2);expect(ops.filter(m=>m.op==='agent-submit')).toHaveLength(0);await page.locator('.sentence-token[data-kind="photo"]').click();chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'选择图片',exact:true}).click();const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j7xoAAAAASUVORK5CYII=','base64');await (await chooser).setFiles({name:'fictional.png',mimeType:'image/png',buffer:png});expect([...files.values()].some(f=>f.name==='fictional.png')).toBe(false);await page.getByRole('button',{name:'确认图片选择'}).click();await expect.poll(()=>files.size).toBe(2);await expect(page.getByText('正在同步附件',{exact:true})).toHaveCount(0);
 await page.locator('.sentence-token[data-kind="sketch"]').click();const rect=(await page.locator('.agent-sketch-surface').boundingBox())!;await page.mouse.move(rect.x+20,rect.y+20);await page.mouse.down();await page.mouse.move(rect.x+100,rect.y+80,{steps:8});await page.mouse.up();await page.getByRole('button',{name:'采用布局草图'}).click();
 await expect(page.locator('.live-wb-materials>.live-wb-material')).toHaveCount(3);await expect.poll(()=>files.size).toBe(3);await expect(page.getByText('正在同步附件',{exact:true})).toHaveCount(0);expect(ops.filter(m=>m.op==='agent-submit')).toHaveLength(0);
 await page.getByRole('button',{name:'删除 fictional.png',exact:true}).click();await expect.poll(()=>ops.filter(m=>m.op==='agent-detach').length).toBe(1);if(app==='gemini'){await expect(page.getByText('模拟删除失败，附件保留待重试',{exact:false})).toBeVisible();await page.waitForTimeout(450);expect(detachAttempts).toBe(1);await page.getByRole('button',{name:'重试',exact:true}).click();await expect.poll(()=>detachAttempts).toBe(2);}await expect(page.getByText('正在同步附件',{exact:true})).toHaveCount(0);expect(ops.filter(m=>m.op==='agent-submit')).toHaveLength(0);await page.waitForTimeout(250);await page.getByRole('button',{name:'发送到 '+app,exact:true}).click();await expect(page.getByText('模拟目标拒绝提交；没有真实任务')).toBeVisible();
 expect(files.size).toBe(3);for(const file of files.values()){const bytes=Buffer.concat(file.data);expect(bytes.length).toBe(file.size);expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);if(file.name==='fictional.txt')expect(bytes).toEqual(doc);if(file.name.endsWith('.png'))expect(bytes.subarray(0,8)).toEqual(Buffer.from([137,80,78,71,13,10,26,10]));}
 expect(ops.filter(m=>m.op==='agent-attach').length).toBeGreaterThanOrEqual(3);expect(polls).toBeGreaterThanOrEqual(2);expect(ops.filter(m=>m.op==='agent-submit')).toHaveLength(1);expect(ops.findIndex(m=>m.op==='agent-submit')).toBeGreaterThan(ops.findLastIndex(m=>m.op==='agent-attach-status'));await expect(page.locator('.live-wb-materials>.live-wb-material')).toHaveCount(2);expect(ops.find(m=>m.op==='agent-submit').files).toHaveLength(2);
});

test('deleting while byte transfer is pending never adopts the removed file or submits',async({page})=>{
 const {randomUUID}=await import('node:crypto');const fileId=randomUUID();const ops:string[]=[];let finish:(()=>void)|undefined;
 const state={device:'Fixture Mac',permission:true,app:'codex',appName:'Codex',taskId:'race',tasks:[{id:'race',title:'虚构附件竞争测试'}],windowTitle:'Fixture',window:'w',target:'t',text:'请参考我的文件。',editable:true,textKnown:true,selection:[0,0],capabilities:['replace-text','agent-submit','agent-attach']};
 await page.routeWebSocket('ws://127.0.0.1:39872/control',socket=>{socket.onMessage(raw=>{
  const m=JSON.parse(String(raw));const publish=()=>socket.send(JSON.stringify({kind:'state',session:'race-session',state}));
  if(m.kind==='pair'){socket.send(JSON.stringify({kind:'connected',session:'race-session',bridgeId:'fixture'}));publish();return;}if(m.kind!=='command')return;ops.push(m.op);
  const ack=(extra={})=>{socket.send(JSON.stringify({kind:'ack',session:'race-session',id:m.id,ok:true,outcome:'verified',state,...extra}));publish();};
  if(m.op==='file-begin'){ack({fileId});return;}if(m.op==='file-finish'){finish=()=>ack({file:{id:fileId,name:'race.txt',size:4,sha256:'fixture'}});return;}ack();
 });});
 await page.goto('/?role=phone&bridge=5191');await page.getByRole('radio',{name:'Mac 应用'}).check();await page.getByLabel('Mac 地址',{exact:true}).fill('127.0.0.1');await page.getByLabel('Mac 配对码',{exact:true}).fill('123456');await page.getByRole('button',{name:'连接 Mac',exact:true}).click();
 const chooser=page.waitForEvent('filechooser');await page.locator('.sentence-token[data-kind="document"]').click();await (await chooser).setFiles({name:'race.txt',mimeType:'text/plain',buffer:Buffer.from('test')});await expect.poll(()=>!!finish).toBe(true);
 await page.getByRole('button',{name:'删除 race.txt',exact:true}).click();finish!();await expect(page.getByText('正在同步附件',{exact:true})).toHaveCount(0);await page.waitForTimeout(500);
 expect(ops).not.toContain('agent-attach');expect(ops).not.toContain('agent-detach');expect(ops).not.toContain('agent-submit');await expect(page.locator('.live-wb-materials>.live-wb-material')).toHaveCount(0);
});
