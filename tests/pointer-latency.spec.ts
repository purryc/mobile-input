import {test,expect} from '@playwright/test';
import {enableInput} from './enable-input';
test('a delayed link delivers the latest of 120 trackpad samples without replaying the backlog',async({browser})=>{
 const ctx=await browser.newContext(),tablet=await ctx.newPage(),phone=await ctx.newPage();
 await tablet.addInitScript(()=>{
  const original=WebSocket.prototype.send;
  (window as any).__outbound=[];
  WebSocket.prototype.send=function(data){if(typeof data==='string')(window as any).__outbound.push(JSON.parse(data));original.call(this,data);};
 });
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();
 const pin=(await tablet.locator('.pair-code').innerText()).trim();
 await phone.addInitScript(()=>{
  const original=WebSocket.prototype.send;
  (window as any).__pointerSent=[];
  WebSocket.prototype.send=function(data){
   const packet=typeof data==='string'?JSON.parse(data):null;
   if(packet?.command?.type==='input-pointer'){
    (window as any).__pointerSent.push(packet.command.value);
    setTimeout(()=>{if(this.readyState===1)original.call(this,data);},200);
   }else original.call(this,data);
  };
 });
 await phone.setViewportSize({width:390,height:844});await phone.goto('/?role=phone&bridge=5191');
 await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();
 await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);await tablet.getByRole('button',{name:'关闭连接设置'}).click();await enableInput(tablet,phone);
 const pad=phone.getByLabel('触控区域',{exact:true}),box=(await pad.boundingBox())!;
 await tablet.evaluate(()=>{(window as any).__outbound=[];});
 await phone.mouse.move(box.x+20,box.y+20);await phone.mouse.down();
 await pad.evaluate((el,{x,y})=>{for(let i=1;i<=120;i++)el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:1,clientX:x+i,clientY:y,buttons:1}));},{x:box.x+20,y:box.y+20});
 await phone.mouse.up();
 await expect.poll(()=>tablet.locator('.shared-input-pointer').evaluate(el=>parseFloat((el as HTMLElement).style.left)),{timeout:1500}).toBeCloseTo(74,1);
 const sent=await phone.evaluate(()=>(window as any).__pointerSent);
 expect(sent.length).toBeLessThanOrEqual(3);expect(sent.at(-1).x).toBeCloseTo(.74,4);
 const packets=await tablet.evaluate(()=>(window as any).__outbound);
 expect(packets.filter((p:any)=>p.kind==='pointer-ack').length).toBeGreaterThan(0);
 expect(packets.filter((p:any)=>p.kind==='snapshot'||p.kind==='snapshot-delta')).toHaveLength(0);
 // Two fresh gestures before the previous receipt must continue from the local endpoint.
 for(const delta of [-50,20]){
  await phone.mouse.move(box.x+100,box.y+50);await phone.mouse.down();
  await pad.evaluate((el,{x,y,delta})=>el.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:1,clientX:x+delta,clientY:y,buttons:1})),{x:box.x+100,y:box.y+50,delta});
  await phone.mouse.up();
 }
 await expect.poll(()=>tablet.locator('.shared-input-pointer').evaluate(el=>parseFloat((el as HTMLElement).style.left)),{timeout:1500}).toBeCloseTo(68,1);
 await ctx.close();
});
