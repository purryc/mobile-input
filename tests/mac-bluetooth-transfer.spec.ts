import {test,expect} from '@playwright/test';
test('Bluetooth attachment chunks stay bounded, preserve bytes and never submit a task',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('input-agent-control-destination','mac');localStorage.setItem('input-agent:mac-method','bluetooth');localStorage.setItem('input-agent-mac-auto-connect','true');const w=window as any;w.uploads=[];w.nativeChannel='';
 const emit=(payload:any)=>window.dispatchEvent(new CustomEvent('native-mac',{detail:{channel:w.nativeChannel,payload:JSON.stringify(payload)}}));
 w.MobileNative={role:()=> 'phone',transportMode:()=> 'lan',discover:()=>'',layoutInsets:()=>'',macClose:()=>'',macConnect:()=>'',macResume:(channel:string)=>{w.nativeChannel=channel;setTimeout(()=>{window.dispatchEvent(new CustomEvent('native-mac',{detail:{channel,status:'transport',message:'bluetooth'}}));emit({kind:'connected',session:'test-session'});emit({kind:'state',session:'test-session',state:{app:'codex',appName:'Codex',device:'Test Mac',window:'test-window',target:'test-field',text:'',textKnown:true,editable:true,permission:true,capabilities:[]}});},10);return 'connecting';},macSend:(channel:string,data:string)=>{const m=JSON.parse(data);if(m.kind==='command'){w.uploads.push(m);setTimeout(()=>window.dispatchEvent(new CustomEvent('native-mac',{detail:{channel,payload:JSON.stringify({kind:'ack',session:'test-session',id:m.id,ok:true,fileId:'test-file',file:{id:'test-file',name:'fictional.txt'}})}})),0);}return 'sent';}};
 });
 await page.goto('/?role=phone&bridge=5191');await expect.poll(()=>page.evaluate(()=>(window as any).nativeChannel)).not.toBe('');
 const result=await page.evaluate(async()=>{
  const {macSnapshot}=await import('/src/mac-link.ts');const {uploadMacMaterial}=await import('/src/mac-materials.ts');while(!macSnapshot().synced)await new Promise(r=>setTimeout(r,10));
  const bytes=new Uint8Array(65537);for(let i=0;i<bytes.length;i++)bytes[i]=i%251;
  await uploadMacMaterial(new File([bytes],'fictional.txt',{type:'text/plain'}),'document',macSnapshot().state!);
  const ops=(window as any).uploads;const chunks=ops.filter((m:any)=>m.op==='file-chunk');let offset=0,correct=true;for(const chunk of chunks){const data=atob(chunk.data);if(chunk.offset!==offset)correct=false;for(let i=0;i<data.length;i++)if(data.charCodeAt(i)!==bytes[offset+i])correct=false;offset+=data.length;}
  return {correct,offset,max:Math.max(...chunks.map((m:any)=>atob(m.data).length)),ops:ops.map((m:any)=>m.op)};
 });
 expect(result.correct).toBe(true);expect(result.offset).toBe(65537);expect(result.max).toBe(2048);expect(result.ops).toHaveLength(35);expect(result.ops.at(-1)).toBe('file-finish');expect(result.ops).not.toContain('agent-submit');
});
