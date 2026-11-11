import {test,expect,type Page} from '@playwright/test';
const source='请帮我整理一个完整的产品发布方案，重点说明目标用户的价值。';
const edited='整理产品发布方案，说明目标用户价值。';
const composer=(page:Page)=>page.locator('.wb-sentence-composer');
const action=(page:Page)=>page.getByRole('button',{name:'整理结构',exact:true});
async function open(page:Page){await page.goto('/');await expect(composer(page)).toBeVisible();}
test.beforeEach(async({page})=>{
 await page.route('**/api/workbuddy-demo/generate',r=>r.fulfill({status:400,json:{error:'No generation in polish tests'}}));
});
test('speech stays continuous until stopped; stable recommendations never call the model automatically',async({page})=>{
 let calls=0;await page.route('**/api/workbuddy-demo/polish',r=>{calls++;return r.fulfill({status:400,json:{error:'unexpected'}});});
 await page.addInitScript(()=>{
  (window as any).__engines=[];
  (window as any).SpeechRecognition=class {
   onstart:any;onend:any;onresult:any;
   constructor(){(window as any).__engines.push(this);}
   start(){this.onstart?.();}stop(){this.onend?.();}abort(){}
  };
 });
 await open(page);
 await page.locator('.demo-voice').click();
 await page.evaluate(text=>(window as any).__engines.at(-1).onresult({results:[{0:{transcript:text},isFinal:true}]}),source);
 await expect(composer(page)).toContainText('产品发布方案');
 await expect(page.locator('.demo-polish-slot')).toHaveCount(0);
 await page.evaluate(()=>(window as any).__engines.at(-1).onend());
 await expect.poll(()=>page.evaluate(()=>(window as any).__engines.length)).toBe(2);
 await expect(page.locator('.demo-polish-slot')).toHaveCount(0);
 await page.locator('.demo-voice').click();
 await expect(action(page)).toBeEnabled();
 expect(calls).toBe(0);
 await composer(page).fill('主题色用红色，字体用黑色。');
 await expect(page.locator('.demo-polish-slot')).toHaveCount(0);
});
test('explicit rewrite, undo, unchanged result and failure retry retain draft without send',async({page})=>{
 let calls=0,mode='rewrite',payload:any;
 await page.route('**/api/workbuddy-demo/polish',r=>{
  calls++;payload=r.request().postDataJSON();
  return mode==='fail'?r.fulfill({status:429,json:{error:'润色失败，原文已保留'}}):r.fulfill({json:{id:payload.id,text:mode==='same'?payload.text:edited}});
 });
 await open(page);await composer(page).fill(source);await expect(action(page)).toBeEnabled();await action(page).click();
 await expect(composer(page)).toHaveAttribute('data-value',edited);
 await expect(page.locator('.contextual-polish')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'恢复原文',exact:true})).toHaveText('');
 expect(Object.keys(payload).sort()).toEqual(['action','id','owner','selection','text']);
 await page.getByRole('button',{name:'恢复原文',exact:true}).click();await expect(composer(page)).toHaveAttribute('data-value',source);
 await expect(page.getByRole('button',{name:'恢复原文',exact:true})).toHaveCount(0);
 mode='same';await action(page).click();await expect(page.getByText('未产生文字修改',{exact:true})).toBeVisible();
 mode='fail';await action(page).click();await expect(page.getByRole('button',{name:'重试 整理结构',exact:true})).toBeEnabled();
 await expect(composer(page)).toHaveAttribute('data-value',source);
 mode='rewrite';await page.getByRole('button',{name:'重试 整理结构',exact:true}).click();await expect(composer(page)).toHaveAttribute('data-value',edited);
 expect(calls).toBe(4);await expect(page.locator('.wb-task-layout')).toHaveCount(0);
 await expect(page.locator('.demo-save-state')).toHaveText('保存在这台电脑');await page.reload();await expect(composer(page)).toHaveAttribute('data-value',edited);expect(calls).toBe(4);
});
test('selection-only polish and manual parameter values survive; changed parameters are rejected',async({page})=>{
 let mode='good';await page.route('**/api/workbuddy-demo/polish',r=>{const b=r.request().postDataJSON();const text=b.selection.end>b.selection.start?edited:b.text.replace('重点说明','着重说明').replace(mode==='bad'?'红色':'__never__','蓝色');return r.fulfill({json:{id:b.id,text}});});
 await open(page);await composer(page).fill('主题色用红色。'+source);
 await page.locator('.sentence-token[data-kind=color]').click();await page.locator('.agent-color-bottom input').fill('#A51124');await page.locator('.agent-color-bottom > button').click();
 await expect(action(page)).toBeEnabled();await action(page).click();await expect(composer(page)).toContainText('着重说明');await expect(page.locator('.sentence-token')).toContainText('#A51124');
 await page.getByRole('button',{name:'恢复原文',exact:true}).click();
 await expect(composer(page)).toHaveAttribute('data-value','主题色用红色。'+source);
 await expect.poll(()=>page.evaluate(()=>getSelection()?.toString())).toBe('');
 // Select the prose text node, leaving the preceding parameter and punctuation outside it.
 await composer(page).evaluate((el,text)=>{el.focus();const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let node:Node|null;while(node=walker.nextNode()){const at=(node.textContent||'').indexOf(text);if(at>=0){const range=document.createRange();range.setStart(node,at);range.setEnd(node,at+text.length);getSelection()!.removeAllRanges();getSelection()!.addRange(range);break;}}},source);
 await expect.poll(()=>page.evaluate(()=>getSelection()?.toString())).toBe(source);
 await expect(action(page)).toBeEnabled();await action(page).click();await expect(composer(page)).toContainText(edited);await expect(page.locator('.sentence-token')).toContainText('#A51124');
 await page.getByRole('button',{name:'恢复原文',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>getSelection()?.toString())).toBe(source);
 await composer(page).press('ArrowRight');await expect.poll(()=>page.evaluate(()=>getSelection()?.toString())).toBe('');mode='bad';await expect(action(page)).toBeEnabled();await action(page).click();await expect(page.locator('.polish-error')).toBeVisible();await expect(page.locator('.sentence-token')).toContainText('#A51124');
});
test('typing, draft switching, explicit cancel and page hiding invalidate pending responses',async({page})=>{
 let finish:()=>Promise<void>=async()=>{};
 await page.route('**/api/workbuddy-demo/polish',async r=>{const b=r.request().postDataJSON();await new Promise<void>(resolve=>{finish=async()=>{await r.fulfill({json:{id:b.id,text:edited}}).catch(()=>{});resolve();};});});
 await open(page);await composer(page).fill(source);await action(page).click();await expect(page.locator('.contextual-polish-options button[aria-busy=true]')).toBeVisible();await expect(page.locator('.demo-send')).toBeDisabled();
 await composer(page).fill('后续编辑必须保留。');await finish();await expect(composer(page)).toHaveAttribute('data-value','后续编辑必须保留。');
 await composer(page).fill(source);await action(page).click();await expect(page.getByRole('button',{name:'停止润色',exact:true})).toBeVisible();await page.getByRole('button',{name:'新建演示',exact:true}).click();await finish();await expect(composer(page)).toHaveAttribute('data-value','');
 await composer(page).fill(source);await action(page).click();await expect(page.getByRole('button',{name:'停止润色',exact:true})).toBeVisible();await page.getByRole('button',{name:'停止润色',exact:true}).click();await finish();await expect(composer(page)).toHaveAttribute('data-value',source);await expect(page.locator('.demo-send')).toBeEnabled();
 await action(page).click();await expect(page.getByRole('button',{name:'停止润色',exact:true})).toBeVisible();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await finish();await expect(composer(page)).toHaveAttribute('data-value',source);
});
test('pending chip stops and completed row only restores in both languages at three sizes',async({page})=>{
 let finish:()=>Promise<void>=async()=>{},calls=0;
 await page.route('**/api/workbuddy-demo/polish',async r=>{
  calls++;const b=r.request().postDataJSON();
  await new Promise<void>(resolve=>{finish=async()=>{await r.fulfill({json:{id:b.id,text:b.text.replace('然后然后','然后').replace('Please please','Please')}}).catch(()=>{});resolve();};});
 });
 await open(page);
 const sizes=[{width:1440,height:960},{width:1280,height:800},{width:1024,height:768}];
 for(const lang of ['zh-CN','en']){
  await page.locator('.demo-settings > button').click();await page.locator('.demo-settings select').selectOption(lang);await page.locator('.demo-settings header button').click();
  const original=lang==='en'?'Plan a product launch. Explain the audience and benefits. Please please keep the request focused.':source+'然后然后说明下一步安排。';
  await composer(page).fill(original);
  const organize=page.getByRole('button',{name:lang==='en'?'Organize':'整理结构',exact:true});
  const concise=page.getByRole('button',{name:lang==='en'?'Make concise':'精简表达',exact:true});
  const stop=page.getByRole('button',{name:lang==='en'?'Stop polishing':'停止润色',exact:true});
  const restore=page.getByRole('button',{name:lang==='en'?'Restore original':'恢复原文',exact:true});
  await expect(restore).toHaveCount(0);await expect(organize).toBeEnabled();
  await expect(page.locator('.demo-polish-row')).toHaveCSS('padding-bottom','0px');
  let expectedCalls=calls+1;await organize.click();await expect.poll(()=>calls).toBe(expectedCalls);
  for(const size of sizes){
   await page.setViewportSize(size);await expect(stop).toBeEnabled();await expect(stop).toHaveAttribute('aria-busy','true');await expect(concise).toBeDisabled();
   await expect(page.locator('.contextual-polish-options').getByRole('button',{name:lang==='en'?'Stop polishing':'停止润色',exact:true})).toBeVisible();
   await expect(page.locator('.demo-polish-cancel')).toHaveCount(0);await expect(page.locator('.demo-voice')).toBeInViewport();
   await page.screenshot({path:`artifacts/workbuddy-demo/evidence/polish-pending-${size.width}-${lang}.png`});
  }
  await stop.press('Enter');await finish();await expect(composer(page)).toHaveAttribute('data-value',original);await expect(restore).toHaveCount(0);await expect(organize).toBeEnabled();
  expectedCalls=calls+1;await organize.click();await expect.poll(()=>calls).toBe(expectedCalls);await finish();
  await expect(restore).toBeEnabled();await expect(restore).toHaveText('');
  await composer(page).press('ArrowRight'); // Moving the caret does not redisplay completed recommendations.
  await expect(restore).toBeEnabled();
  for(const size of sizes){
   await page.setViewportSize(size);await expect(page.locator('.contextual-polish')).toHaveCount(0);
   const row=page.locator('.demo-composer > .demo-polish-slot');await expect(row).toBeInViewport();await expect(page.locator('.demo-voice')).toBeInViewport();await expect(restore).toBeInViewport();
   const iconBox=(await restore.boundingBox())!;expect(iconBox.width).toBe(48);expect(iconBox.height).toBe(48);
   const rb=(await row.boundingBox())!,fb=(await page.locator('.demo-composer > footer').boundingBox())!;
   expect(rb.y+rb.height).toBeLessThanOrEqual(fb.y+1);expect(rb.x+rb.width).toBeLessThanOrEqual(size.width);
   await page.screenshot({path:`artifacts/workbuddy-demo/evidence/polish-complete-${size.width}-${lang}.png`});
  }
  await restore.press('Enter');await expect(composer(page)).toHaveAttribute('data-value',original);await expect(organize).toBeEnabled();await expect(restore).toHaveCount(0);
  expectedCalls=calls+1;await organize.click();await expect.poll(()=>calls).toBe(expectedCalls);await finish();await expect(restore).toBeEnabled();
  await composer(page).fill(original+' '+(lang==='en'?'Explain the next steps.':'补充下一步安排。'));
  await expect(organize).toBeEnabled();await expect(restore).toHaveCount(0);
 }
});
test('polish preserves confirmed files and unconfirmed photos on the original draft',async({page})=>{
 await page.route('**/api/workbuddy-demo/polish',r=>{const b=r.request().postDataJSON();return r.fulfill({json:{id:b.id,text:b.text.replace('重点说明','着重说明')}});});
 await open(page);await composer(page).fill(source+'添加产品图片。');
 await page.locator('.demo-add > button').click();let chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'参考文件',exact:true}).click();await (await chooser).setFiles({name:'reference.txt',mimeType:'text/plain',buffer:Buffer.from('Fictional file')});
 await page.locator('.sentence-token[data-kind=photo]').click();chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'选择图片',exact:true}).click();await (await chooser).setFiles({name:'pending.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
 await page.getByRole('button',{name:'关闭辅助输入'}).click();await action(page).click();await expect(composer(page)).toContainText('着重说明');
 await expect(page.locator('.demo-attachments')).toContainText('reference.txt');await expect(page.locator('.demo-attachments')).not.toContainText('pending.png');await expect(page.locator('.demo-pending')).toContainText('1 张图片待确认');
 await page.locator('.sentence-token[data-kind=photo]').click();await expect(page.locator('.live-wb-photo-body')).toContainText('pending.png');
});
