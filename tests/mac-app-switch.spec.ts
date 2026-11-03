import {test,expect} from '@playwright/test';
test('every Mac controller uses the native app-switch command without changing drafts or sending',async({page})=>{
 const sent:any[]=[];let connection:any;
 const state={device:'测试 Mac',permission:true,windowTitle:'保留的任务',window:'w',target:'t',text:'保留草稿',editable:true,textKnown:true,selection:[0,0],capabilities:['replace-text','pointer']};
 await page.addInitScript(()=>localStorage.setItem('input-agent-control-destination','mac'));
 await page.routeWebSocket('ws://127.0.0.1:39872/control',socket=>{connection=socket;socket.onMessage(raw=>{const m=JSON.parse(String(raw));sent.push(m);if(m.kind==='pair'){socket.send(JSON.stringify({kind:'connected',session:'test'}));socket.send(JSON.stringify({kind:'state',session:'test',state:{...state,app:'codex'}}));}if(m.kind==='command')socket.send(JSON.stringify({kind:'ack',session:'test',id:m.id,ok:true}));});});
 await page.goto('/?role=phone&bridge=5191');
 await page.getByLabel('Mac 地址',{exact:true}).fill('127.0.0.1');await page.getByLabel('Mac 配对码',{exact:true}).fill('123456');await page.getByRole('button',{name:'连接 Mac',exact:true}).click();
 for(const app of ['codex','workbuddy','wps','unknown']){
  connection.send(JSON.stringify({kind:'state',session:'test',state:{...state,app,editable:app!=='unknown',capabilities:app==='unknown'?[]:state.capabilities}}));
  await expect(page.locator('.mac-phone')).toBeVisible();
  await page.getByRole('button',{name:'切换 Mac 应用',exact:true}).click();
 }
 await expect.poll(()=>sent.filter(m=>m.op==='app-switch').length).toBe(4);
 expect(sent.filter(m=>m.op==='app-switch').every(m=>m.action==='next')).toBe(true);
 expect(sent.some(m=>['replace-text','insert-text','activate','workbuddy-submit'].includes(m.op)||m.action==='submit')).toBe(false);
});
