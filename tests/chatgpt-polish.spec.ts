import {test,expect} from '@playwright/test';
test('real polish bridge replaces text only on success, preserves undo and rejects late or cancelled output',async({browser})=>{
 test.setTimeout(60000);
 const c=await browser.newContext(),tablet=await c.newPage(),phone=await c.newPage();
 await phone.addInitScript(()=>{const WS=window.WebSocket;window.WebSocket=class extends WS{constructor(url:string,protocols?:string|string[]){super(url,protocols);(window as any).__socket=this;}};});
 await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();const pin=(await tablet.locator('.pair-code').innerText()).trim();await phone.setViewportSize({width:390,height:844});await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);await tablet.getByRole('button',{name:'关闭连接设置'}).click();await tablet.locator('.demo-apps').getByRole('button',{name:'WorkBuddy',exact:true}).click();await tablet.getByLabel('WorkBuddy 任务输入',{exact:true}).click();
 await phone.evaluate(()=>{const w=window as any;w.__polish=[];w.__cancel=[];w.MobileNative={send:(data:string)=>{w.__socket.send(data);return 'sent';},polish:(id:string,text:string,style:string)=>{w.__polish.push({id,text,style});return 'pending';},cancelPolish:(id:string)=>{w.__cancel.push(id);return 'cancelled';}};});
 const draft=phone.getByLabel('手机 WorkBuddy 草稿'),polish=phone.locator('.contextual-polish');
 const finish=async(text:string,ok=true)=>phone.evaluate(({text,ok})=>{const w=window as any,r=w.__polish.at(-1);window.dispatchEvent(new CustomEvent('native-polish',{detail:{id:r.id,ok,text:ok?text:'',error:ok?'':text}}));},{text,ok});
 await draft.fill('嗯，明天下午两点请林经理看一下30套设备的报价。');await expect(tablet.getByLabel('WorkBuddy 任务输入',{exact:true})).toHaveValue((await draft.getAttribute('data-value'))!);

 await expect(polish).toBeVisible();expect(await polish.evaluate(el=>!!el.closest('.bili-phone-composer,.glass-input,.live-wb-composer'))).toBe(false);
 for(const height of [844,700]){await phone.setViewportSize({width:390,height});for(const mode of ['收起','键盘','触控板']){
  const active=phone.locator('.input-mode-key[aria-pressed=true]');if(mode==='收起'){if(await active.count())await active.click();}else await phone.getByRole('button',{name:mode,exact:true}).click();
  await expect(polish).toBeVisible();const box=await polish.boundingBox(),dock=await phone.locator('.input-dock').boundingBox(),voice=await phone.getByRole('button',{name:'智慧语音',exact:true}).boundingBox(),send=await phone.getByRole('button',{name:/^发送(?:任务|生成网页演示)$/,exact:false}).boundingBox();
  const composerBottom=await polish.evaluate(el=>el.previousElementSibling!.getBoundingClientRect().bottom);expect(box!.y-composerBottom).toBeCloseTo(8,0);expect(dock!.y-box!.y-box!.height).toBeCloseTo(8,0);expect(box!.y+box!.height).toBeLessThanOrEqual(dock!.y+1);expect(voice!.y+voice!.height).toBeLessThanOrEqual(height);expect(send!.y+send!.height).toBeLessThanOrEqual(box!.y+1);
  const sizes=await polish.locator('button').evaluateAll(a=>a.map(x=>({h:x.getBoundingClientRect().height,w:x.getBoundingClientRect().width})));expect(sizes.every(x=>x.h>=48&&x.w>=80)).toBe(true);
  await phone.screenshot({path:`artifacts/web-deck/polish-${height}-${mode}.png`});
 }}
 const activeMode=phone.locator('.input-mode-key[aria-pressed=true]');if(await activeMode.count())await activeMode.click();
 await polish.getByRole('button',{name:'精简指令',exact:true}).click();await expect(polish).toContainText('处理中');await expect(polish.getByRole('button',{name:'说清需求',exact:true})).toBeDisabled();expect(await phone.evaluate(()=>(window as any).__polish.at(-1).text)).toBe('嗯，明天下午两点请林经理看一下30套设备的报价。');
 await finish('请林经理明天下午两点审阅30套设备的报价。');await expect(draft).toHaveAttribute('data-value','请林经理明天下午两点审阅30套设备的报价。');await expect(tablet.getByLabel('WorkBuddy 任务输入',{exact:true})).toHaveValue((await draft.getAttribute('data-value'))!);await phone.getByRole('button',{name:'撤销',exact:true}).click();await expect(draft).toHaveAttribute('data-value','嗯，明天下午两点请林经理看一下30套设备的报价。');
 await draft.fill('项目：请快点回复。日期：明天。');await expect(tablet.getByLabel('WorkBuddy 任务输入',{exact:true})).toHaveValue((await draft.getAttribute('data-value'))!);
 await draft.evaluate((node:HTMLTextAreaElement)=>{node.focus();const range=document.createRange();range.setStart(node.firstChild!,3);range.setEnd(node.firstChild!,8);window.getSelection()!.removeAllRanges();window.getSelection()!.addRange(range);document.dispatchEvent(new Event('selectionchange'));});
 await polish.getByRole('button',{name:'整理要点',exact:true}).click();expect(await phone.evaluate(()=>(window as any).__polish.at(-1).text)).toBe('请快点回复');await finish('请您方便时回复');await expect(draft).toHaveAttribute('data-value','项目：请您方便时回复。日期：明天。');
 await polish.getByRole('button',{name:'说清需求',exact:true}).click();await draft.fill('我又补充了一句新的需求');await finish('过期结果');await expect(draft).toHaveAttribute('data-value','我又补充了一句新的需求');expect(await phone.evaluate(()=>(window as any).__cancel.length)).toBeGreaterThan(0);
 await polish.getByRole('button',{name:'整理要点',exact:true}).click();await draft.fill('我又补充了一句新的需求，保留日期。');await finish('已取消结果');await expect(draft).toHaveAttribute('data-value','我又补充了一句新的需求，保留日期。');
 await polish.getByRole('button',{name:'说清需求',exact:true}).click();await finish('授权已失效，请重新登录',false);await expect(polish.getByRole('alert')).toContainText('授权已失效');await expect(draft).toHaveAttribute('data-value','我又补充了一句新的需求，保留日期。');
 // A stale selection and a rewrite that removes explicit parameters never replace the draft.
 await draft.fill('主题用红色，讲五分钟，布局我画一下。请保留这些要求。');
 await polish.getByRole('button',{name:'说清需求',exact:true}).click();await finish('整理成一份简报。');await expect(polish.getByRole('alert')).toContainText('输入参数');await expect(draft).toHaveAttribute('data-value','主题用红色，讲五分钟，布局我画一下。请保留这些要求。');
 await polish.getByRole('button',{name:'重试说清需求',exact:true}).click();
 await draft.evaluate((node:HTMLElement)=>{const range=document.createRange();range.setStart(node.firstChild!,0);range.setEnd(node.firstChild!,2);window.getSelection()!.removeAllRanges();window.getSelection()!.addRange(range);document.dispatchEvent(new Event('selectionchange'));});await finish('旧选区结果');await expect(draft).toHaveAttribute('data-value','主题用红色，讲五分钟，布局我画一下。请保留这些要求。');
 await draft.fill('请整理这些需求，保留全部条件。');await polish.getByRole('button',{name:'说清需求',exact:true}).click();await finish('临时失败',false);
 await polish.getByRole('button',{name:'重试说清需求',exact:true}).click();await tablet.evaluate(async()=>{const {command}=await import(performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/\/src\/runtime\.ts(?:\?|$)/.test(n)).at(-1)!);await command('wb-deck-new');});await tablet.locator('.deck-composer textarea').click();await finish('旧目标结果');await expect(draft).toHaveAttribute('data-value','');await expect(tablet.locator('.wb-message.user')).toHaveCount(0);await expect(polish).toHaveCount(0);
 await c.close();
});
