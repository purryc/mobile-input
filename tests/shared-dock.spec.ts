import {test,expect,type Page} from '@playwright/test';
import {enableInput} from './enable-input';
async function pair(tablet:Page,phone:Page){
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();const pin=(await tablet.locator('.pair-code').innerText()).trim();await tablet.getByRole('button',{name:'关闭连接设置'}).click();
 await phone.setViewportSize({width:390,height:844});await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);await enableInput(tablet,phone);
}
async function command(page:Page,type:string,value:unknown={}){return page.evaluate(async({type,value})=>{const r=await import(performance.getEntriesByType('resource').find(e=>/\/src\/runtime\.ts(?:\?|$)/.test(e.name))!.name);return r.command(type,value);},{type,value});}
async function layout(page:Page){return page.locator('.input-dock').evaluate(el=>{
 const d=el.getBoundingClientRect(),v=el.querySelector('.input-voice')!,r=v.getBoundingClientRect(),label=v.querySelector('span')!,l=label.getBoundingClientRect(),s=getComputedStyle(label);
 return {x:r.x-d.x,y:r.y-d.bottom,width:r.width,height:r.height,clip:s.clipPath,visible:s.display!=='none'&&s.visibility!=='hidden'&&l.width>30&&l.height>10,fits:l.left>=r.left&&l.right<=r.right&&l.top>=r.top&&l.bottom<=r.bottom,text:label.textContent};
});}
test('all shared scenes keep labeled voice and fixed footer geometry in every mode',async({browser})=>{
 const ctx=await browser.newContext(),tablet=await ctx.newPage(),phone=await ctx.newPage();await pair(tablet,phone);
 for(const [width,height] of [[390,844],[390,700],[360,700]]){
  await phone.setViewportSize({width,height});let baseline:Awaited<ReturnType<typeof layout>>|undefined;
  for(const app of ['desktop','workbuddy','wechat','mail','notes','doubao','paint','bilibili']){
   await command(tablet,'open',app);
   if(app==='workbuddy')await command(tablet,'wb-focus',{id:'wb:draft:new'});
   if(app==='wechat'){await command(tablet,'chat-focus',{conversation:'wx-boss'});await expect(phone.locator('.wechat-phone')).toBeVisible({timeout:8000});}
   await expect(phone.locator('.input-dock')).toHaveCount(1);
   for(const mode of ['keyboard','trackpad','collapsed']){
    if(mode==='collapsed'){const active=phone.locator('.input-mode-key[aria-pressed=true]');if(await active.count())await active.click();}
    else{const button=phone.getByRole('button',{name:mode==='keyboard'?'键盘':'触控板',exact:true});if(await button.getAttribute('aria-pressed')!=='true')await button.click();}
    const g=await layout(phone);expect(g.visible,app+'/'+mode).toBe(true);expect(g.fits,app+'/'+mode).toBe(true);expect(g.clip).toBe('none');expect(g.text).toBe('智慧语音');expect(g.width).toBe(96);expect(g.height).toBe(56);
    if(!baseline)baseline=g;else expect(g,app+'/'+mode).toEqual(baseline);
    const d=(await phone.locator('.input-dock').boundingBox())!;expect(d.x).toBeGreaterThanOrEqual(0);expect(d.x+d.width).toBeLessThanOrEqual(width+.5);expect(d.y+d.height).toBeLessThanOrEqual(height+.5);
    if(width===390&&mode==='keyboard')await phone.locator('.input-dock').screenshot({path:`artifacts/shared-dock/${app}-keyboard.png`});
   }
  }
 }
 await ctx.close();
});
test('manual dock mode survives task remounts, object revisions and explicit collapse wins over defaults',async({browser})=>{
 const ctx=await browser.newContext(),tablet=await ctx.newPage(),phone=await ctx.newPage();await pair(tablet,phone);
 await command(tablet,'open','workbuddy');await command(tablet,'wb-focus',{id:'wb:draft:new'});
 await phone.getByRole('button',{name:'触控板',exact:true}).click();
 for(const action of ['wb-reference-task','wb-material-task','wb-input-task']){
  await command(tablet,action,action==='wb-input-task'?{action:'new'}:{});
  await expect(phone.getByLabel('展开触控板')).toBeVisible();
 }
 await phone.getByRole('button',{name:'键盘',exact:true}).click();
 await phone.getByRole('button',{name:'新建输入任务',exact:true}).click();
 await expect(phone.getByLabel('展开键盘')).toBeVisible();
 await command(tablet,'wb-fb-open',{file:'sales-slides'});
 const view=await tablet.evaluate(async()=>{const r=await import(performance.getEntriesByType('resource').find(e=>/\/src\/runtime\.ts(?:\?|$)/.test(e.name))!.name);return r.currentState().workbuddy.fileBrowser.windows.at(-1).id;});
 for(const end of [2,3]){
  await command(tablet,'wb-object-select',{view,file:'sales-slides',path:'slide/0/title',start:0,end});
  await expect(phone.getByLabel('展开键盘')).toBeVisible();
 }
 await phone.getByRole('button',{name:'键盘',exact:true}).click();
 await command(tablet,'wb-object-select',{view,file:'sales-slides',path:'slide/0/title',start:0,end:4});
 await expect(phone.locator('.input-dock.expanded')).toHaveCount(0);
 await command(tablet,'open','desktop');await expect(phone.locator('.input-dock.expanded')).toHaveCount(0);
 await ctx.close();
});
test('trackpad taps click, double taps dispatch double-click, motion and cancellation do not click',async({browser})=>{
 const ctx=await browser.newContext({hasTouch:true}),tablet=await ctx.newPage(),phone=await ctx.newPage();await pair(tablet,phone);
 await tablet.evaluate(()=>{const b=document.createElement('button');b.id='tap-probe';b.textContent='Pointer test';b.style.cssText='position:fixed;left:45vw;top:45vh;width:10vw;height:10vh;z-index:8000';document.body.append(b);(window as any).tapEvents=[];for(const kind of ['click','dblclick'])b.addEventListener(kind,e=>(window as any).tapEvents.push({kind,detail:(e as MouseEvent).detail}));});
 const pad=phone.getByLabel('触控区域',{exact:true});await pad.tap();await expect.poll(()=>tablet.evaluate(()=>(window as any).tapEvents)).toEqual([{kind:'click',detail:1}]);
 // Wait beyond the pair window, then issue one intentional double tap.
 await phone.waitForTimeout(400);const box=(await pad.boundingBox())!;await phone.mouse.dblclick(box.x+box.width/2,box.y+box.height/2,{delay:90});
 await expect.poll(()=>tablet.evaluate(()=>(window as any).tapEvents)).toEqual([{kind:'click',detail:1},{kind:'click',detail:1},{kind:'click',detail:2},{kind:'dblclick',detail:2}]);
 await phone.mouse.move(box.x+30,box.y+30);await phone.mouse.down();await phone.mouse.move(box.x+70,box.y+30);await phone.mouse.move(box.x+30,box.y+30);await phone.mouse.up();
 await pad.dispatchEvent('pointerdown',{pointerId:7,clientX:box.x+10,clientY:box.y+10});await pad.dispatchEvent('pointercancel',{pointerId:7});await pad.dispatchEvent('pointerup',{pointerId:7,clientX:box.x+10,clientY:box.y+10});
 await phone.waitForTimeout(400);expect(await tablet.evaluate(()=>(window as any).tapEvents.length)).toBe(4);await tablet.evaluate(()=>document.querySelector('#tap-probe')?.remove());
 // Actual app action via a tap at the remote cursor.
 const icon=(await tablet.locator('.demo-apps').getByRole('button',{name:'WorkBuddy',exact:true}).boundingBox())!,size=tablet.viewportSize()!,center={x:box.x+box.width/2,y:box.y+box.height/2};
 await phone.mouse.move(center.x,center.y);await phone.mouse.down();await phone.mouse.move(center.x+((icon.x+icon.width/2)/size.width-.5)*500,center.y+((icon.y+icon.height/2)/size.height-.5)*500,{steps:8});await phone.mouse.up();await pad.tap();await expect(tablet.getByLabel('WorkBuddy 任务输入')).toBeVisible();
 await ctx.close();
});
