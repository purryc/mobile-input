import {test,expect,type Page} from '@playwright/test';
async function pair(tablet:Page,phone:Page){await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接设置',exact:true}).click();await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();const pin=(await tablet.locator('.pair-code').innerText()).trim();await phone.setViewportSize({width:390,height:844});await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);await expect(phone.getByText('已连接工作台').first()).toBeVisible();await tablet.getByRole('button',{name:'关闭连接设置'}).click();await tablet.locator('.demo-apps').getByRole('button',{name:'哔哩哔哩',exact:true}).click();await tablet.getByLabel('平板弹幕输入').click();return pin;}
test('Bilibili phone inputs, tablet results, local playback and per-video draft recovery',async({browser})=>{const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});const tablet=await context.newPage(),phone=await context.newPage();const errors:string[]=[];for(const p of [tablet,phone])p.on('pageerror',e=>errors.push(e.message));await pair(tablet,phone);
 await expect(phone.locator('.bili-phone')).toBeVisible();await expect(phone.getByRole('button',{name:'上一条',exact:true})).toBeDisabled();await expect(phone.getByRole('button',{name:'连接设置',exact:true})).toHaveCount(1);
 await tablet.getByRole('button',{name:'播放',exact:true}).click();await expect.poll(()=>tablet.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.5);
 await phone.getByRole('button',{name:'投币',exact:true}).click();await expect(tablet.locator('.bili-feedback')).toContainText('1 枚');await expect(phone.locator('.toast')).toHaveCount(0);await expect(phone.getByText('已为当前视频投 1 枚硬币')).toHaveCount(0);
 const input=phone.getByLabel('手机弹幕草稿');await input.fill('这段讲得清楚👨‍👩‍👧');await expect(tablet.getByLabel('平板弹幕输入')).toHaveValue('这段讲得清楚👨‍👩‍👧');await phone.getByRole('button',{name:'删除',exact:true}).click();await expect(input).toHaveValue('这段讲得清楚');await phone.getByRole('button',{name:'撤销',exact:true}).click();await expect(input).toHaveValue('这段讲得清楚👨‍👩‍👧');await phone.getByRole('button',{name:'发送弹幕',exact:true}).click();await expect(input).toHaveValue('');await expect(tablet.locator('.bili-comment-history')).toContainText('这段讲得清楚👨‍👩‍👧');
 await input.fill('保留给这条视频');await expect(tablet.getByLabel('平板弹幕输入')).toHaveValue('保留给这条视频');await phone.getByRole('button',{name:'下一条',exact:true}).click();await expect(phone.getByRole('button',{name:'下一条',exact:true})).toBeEnabled();await expect(input).toHaveCount(0);await phone.getByRole('button',{name:'上一条',exact:true}).click();await tablet.getByLabel('平板弹幕输入').click();await expect(input).toHaveValue('保留给这条视频');await expect(phone.getByRole('button',{name:'发送弹幕',exact:true})).toBeEnabled();
 await tablet.getByRole('button',{name:'播放列表',exact:true}).click();await expect(tablet.getByRole('dialog',{name:'播放列表'})).toBeVisible();await tablet.getByRole('button',{name:'返回',exact:true}).click();await expect(tablet.getByRole('dialog',{name:'播放列表'})).toHaveCount(0);
 await phone.screenshot({path:'artifacts/adaptive-input/bilibili-phone.png'});await tablet.screenshot({path:'artifacts/adaptive-input/bilibili-tablet.png'});const geometry=await phone.locator('.input-voice').boundingBox();expect(geometry!.y+geometry!.height).toBeLessThanOrEqual(844);expect(errors).toEqual([]);await context.close();});

for(const fault of ['lost-ack','lost-command'] as const)test(`Bilibili coin ${fault}: reload reconciles without retrying the effect`,async({browser})=>{
 const context=await browser.newContext(),tablet=await context.newPage(),phone=await context.newPage();let lostId='',coinCommands=0;
 await phone.routeWebSocket(/:5191(?:\/|$)/,socket=>{const server=socket.connectToServer();socket.onMessage(raw=>{const message=JSON.parse(String(raw));if(message.command?.type==='bili-coin'){
  coinCommands++;if(!lostId){lostId=message.command.id;if(fault==='lost-command'){return;}}
 }server.send(raw);});server.onMessage(raw=>{const message=JSON.parse(String(raw));if(fault==='lost-ack'&&message.kind==='ack'&&message.ack?.id===lostId)return;socket.send(raw);});});
 const pin=await pair(tablet,phone);await phone.getByRole('button',{name:'投币',exact:true}).click();
 await expect.poll(()=>coinCommands).toBe(1);if(fault==='lost-ack')await expect(tablet.getByText('演示硬币余额 5')).toBeVisible();
 // Unmount before any receipt; persistent request must outlive the controller and page.
 await phone.reload();await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();
 await expect(phone.getByRole('button',{name:'核对投币',exact:true})).toBeEnabled();await phone.getByRole('button',{name:'核对投币',exact:true}).click();
 await expect(phone.getByRole('button',{name:'投币',exact:true})).toBeEnabled();expect(coinCommands).toBe(1);
 await expect(tablet.getByText(`演示硬币余额 ${fault==='lost-ack'?5:6}`)).toBeVisible();await expect(tablet.locator('.bili-feedback')).toContainText(fault==='lost-ack'?'1 枚':'未执行');
 expect(await phone.evaluate(()=>localStorage.getItem('mobile-input:bilibili:coin-request'))).toBeNull();
 // The core test also delivers the sealed request after restart; the UI never replays it.
 await expect(phone.locator('.toast')).toHaveCount(0);await context.close();
});


test('danmaku drifts while paused and respects seeking within looping clips',async({browser})=>{
 const context=await browser.newContext(),tablet=await context.newPage(),phone=await context.newPage();await pair(tablet,phone);
 const input=phone.getByLabel('手机弹幕草稿');
 const assertInside=async(text:string)=>{
  const span=tablet.locator('.bili-danmaku span').filter({hasText:text});await expect(span).toBeVisible();
  await expect.poll(async()=>{const a=await span.boundingBox(),v=await tablet.locator('.bili-danmaku').boundingBox();return !!a&&!!v&&a.x>=v.x&&a.x+a.width<=v.x+v.width&&a.y>=v.y&&a.y+a.height<=v.y+v.height;}).toBe(true);
 };
 await input.fill('暂停也能看见这条弹幕');await phone.getByRole('button',{name:'发送弹幕',exact:true}).click();await assertInside('暂停也能看见这条弹幕');
 await tablet.screenshot({path:'artifacts/adaptive-input/bilibili-danmaku-paused.png'});
 const moving=tablet.locator('.bili-danmaku span').filter({hasText:'暂停也能看见这条弹幕'});
 const initial=(await moving.boundingBox())!;
 await expect.poll(async()=>(await moving.boundingBox())!.x,{timeout:5000}).toBeLessThan(initial.x-30);
 await expect.poll(async()=>{const a=(await moving.boundingBox())!,v=(await tablet.locator('.bili-danmaku').boundingBox())!;return a.x+a.width<=v.x+1;},{timeout:8000}).toBe(true);
 await expect(tablet.getByRole('button',{name:'播放',exact:true})).toBeVisible();
 await expect(tablet.locator('.bili-comment-history')).toContainText('暂停也能看见这条弹幕');
 await tablet.getByRole('slider',{name:'视频进度'}).fill('4.8');
 await input.fill('片尾暂停后发送的弹幕');await phone.getByRole('button',{name:'发送弹幕',exact:true}).click();await assertInside('片尾暂停后发送的弹幕');
 await tablet.screenshot({path:'artifacts/adaptive-input/bilibili-danmaku-ended.png'});
 await tablet.getByRole('slider',{name:'视频进度'}).fill('2');
 await expect(tablet.locator('.bili-danmaku')).not.toContainText('片尾暂停后发送的弹幕');
 await tablet.getByRole('slider',{name:'视频进度'}).fill('4.8');await assertInside('片尾暂停后发送的弹幕');
 await context.close();
});


test('phone playback panel controls actual media, volume, fullscreen and compact layouts',async({browser})=>{
 const context=await browser.newContext(),tablet=await context.newPage(),phone=await context.newPage();await pair(tablet,phone);
 const video=tablet.locator('video');await phone.getByRole('button',{name:'1.5倍速',exact:true}).click();
 await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.playbackRate)).toBe(1.5);
 await phone.getByLabel('播放音量',{exact:true}).fill('37');await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.volume)).toBeCloseTo(.37);
 await phone.getByRole('button',{name:'静音',exact:true}).click();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.muted)).toBe(true);
 await phone.getByRole('button',{name:'取消静音',exact:true}).click();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.muted)).toBe(false);
 await phone.getByRole('button',{name:'播放',exact:true}).click();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.4);
 await phone.getByRole('button',{name:'暂停',exact:true}).click();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
 const position=await video.evaluate((v:HTMLVideoElement)=>v.currentTime);await phone.waitForTimeout(350);expect(await video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBe(position);
 await phone.getByRole('button',{name:'全屏',exact:true}).click();await expect(tablet.locator('.bili-fullscreen')).toBeVisible();
 const recent=(await tablet.getByRole('button',{name:'最近应用',exact:true}).boundingBox())!,connection=(await tablet.getByRole('button',{name:'连接设置',exact:true}).boundingBox())!;expect(recent.x+recent.width).toBeLessThanOrEqual(connection.x);
 const box=(await tablet.locator('.bili-video').boundingBox())!;expect(box.width).toBe(1400);expect(box.height).toBe(920);
 await phone.getByRole('button',{name:'列表',exact:true}).click();await expect(tablet.locator('.bili-fullscreen')).toHaveCount(0);
 await phone.getByRole('button',{name:'下一条',exact:true}).click();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.playbackRate)).toBe(1.5);await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.volume)).toBeCloseTo(.37);
 await expect(phone.getByRole('slider',{name:'视频进度'})).toHaveCount(0);
 await phone.screenshot({path:'artifacts/adaptive-input/bili-playback-figma-phone.png'});
 await tablet.getByLabel('平板弹幕输入').click();
 for(const height of [846,584]){await phone.setViewportSize({width:404,height});await phone.addStyleTag({content:'.bili-controller{--native-top:45px;--native-bottom:34px}'});await phone.getByRole('button',{name:'发送弹幕',exact:true}).scrollIntoViewIfNeeded();const send=(await phone.getByRole('button',{name:'发送弹幕',exact:true}).boundingBox())!,dock=(await phone.locator('.input-dock').boundingBox())!;expect(send.y+send.height).toBeLessThanOrEqual(dock.y);}
 await context.close();
});

test('playlist loops short clips then final Yu Yan clip; applied reactions animate once',async({browser})=>{
 const context=await browser.newContext(),tablet=await context.newPage(),phone=await context.newPage();await pair(tablet,phone);
 const entries=tablet.locator('aside .bili-list-item');
 await expect(entries).toHaveCount(3);await expect(entries.nth(0)).toContainText('华妃');await expect(entries.nth(1)).toContainText('大雄兔');await expect(entries.nth(2)).toContainText('喻言');
 for(const name of ['华妃','大雄兔']){
  await entries.filter({hasText:name}).click();
  const short=tablet.locator('video');await expect.poll(()=>short.evaluate((v:HTMLVideoElement)=>v.duration)).toBeCloseTo(5,1);
  await expect(tablet.getByRole('slider',{name:'视频进度'})).toHaveAttribute('max','5');await tablet.getByRole('slider',{name:'视频进度'}).fill('4.3');await phone.getByRole('button',{name:'播放',exact:true}).click();
  await expect.poll(()=>short.evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:4000}).toBeLessThan(2);
  expect(await short.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(false);
 }
 await phone.getByRole('button',{name:'下一条',exact:true}).click();
 await expect(tablet.locator('.bili-main h1')).toContainText('喻言');
 const video=tablet.locator('video');await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.duration)).toBeCloseTo(30,1);
 await expect(phone.getByRole('button',{name:'下一条',exact:true})).toBeDisabled();
 await phone.getByRole('button',{name:'播放',exact:true}).click();
 await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:10000}).toBeGreaterThan(5.5);
 await phone.getByRole('button',{name:'暂停',exact:true}).click();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
 await tablet.getByLabel('平板弹幕输入').click();await phone.getByLabel('手机弹幕草稿').fill('30秒视频弹幕');await phone.getByRole('button',{name:'发送弹幕',exact:true}).click();await expect(tablet.locator('.bili-danmaku')).toContainText('30秒视频弹幕');
 await tablet.getByRole('slider',{name:'视频进度'}).fill('28');await phone.getByRole('button',{name:'播放',exact:true}).click();
 await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:5000}).toBeLessThan(2);
 expect(await video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(false);
 await phone.getByRole('button',{name:'暂停',exact:true}).click();
 for(const [label,action] of [['点赞','bili-like'],['收藏','bili-favorite'],['投币','bili-coin']]){
  await phone.getByRole('button',{name:label,exact:true}).click();
  const effect=tablet.locator('.bili-reaction-effect.'+action);await expect(effect).toBeVisible();
  await expect.poll(()=>effect.evaluate(e=>Number(getComputedStyle(e).opacity))).toBeGreaterThan(.9);
  await tablet.screenshot({path:'artifacts/bili-playlist/'+action+'.png'});
  await expect(effect).toHaveCount(0,{timeout:2500});
 }
 await expect(tablet.getByText('演示硬币余额 5')).toBeVisible();
 await phone.getByRole('button',{name:'上一条',exact:true}).click();await phone.getByRole('button',{name:'下一条',exact:true}).click();
 await expect(tablet.locator('.bili-reaction-effect')).toHaveCount(0);
 await tablet.reload();await expect(tablet.locator('.bili-tablet')).toBeVisible();await expect(tablet.locator('.bili-reaction-effect')).toHaveCount(0);
 await tablet.getByRole('button',{name:'播放列表',exact:true}).click();await tablet.getByRole('button',{name:'重置当前视频互动',exact:true}).click();await expect(tablet.getByText('演示硬币余额 6')).toBeVisible();await expect(tablet.locator('.bili-reactions button.active')).toHaveCount(0);
 await tablet.screenshot({path:'artifacts/adaptive-input/yuyan-loop-browser.png'});await context.close();
});
