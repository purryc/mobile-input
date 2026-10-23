import {test,expect,type Page} from '@playwright/test';

async function geometry(page:Page){
 return page.locator('.input-dock').evaluate(dock=>{
  const rect=(selector:string)=>{
   const el=dock.querySelector(selector)! as HTMLElement,r=el.getBoundingClientRect();
   return {x:r.x,y:r.y,w:r.width,h:r.height};
  };
  const r=dock.getBoundingClientRect(),label=dock.querySelector('.input-voice span')!;
  return {dock:{x:r.x,y:r.y,w:r.width,h:r.height},surface:rect('.input-track-surface'),
   modes:rect('.input-mode-pair'),mouse:rect('.input-mouse-pair'),voice:rect('.input-voice'),
   label:label.textContent,clip:getComputedStyle(label).clipPath};
 });
}

test('desktop and WorkBuddy share expanded trackpad and labeled voice geometry',async({browser})=>{
 const ctx=await browser.newContext(),tablet=await ctx.newPage(),phone=await ctx.newPage();
 await tablet.goto('/?bridge=5191');
 await tablet.getByRole('button',{name:'连接设置',exact:true}).click();
 await tablet.getByRole('radio',{name:'扫码网络建联',exact:false}).check();
 const pin=(await tablet.locator('.pair-code').innerText()).trim();
 await phone.setViewportSize({width:390,height:844});
 await phone.goto('/?role=phone&bridge=5191');
 await phone.getByLabel('平板地址').fill('localhost');
 await phone.getByLabel('配对码',{exact:true}).fill(pin);
 await phone.getByRole('button',{name:'连接',exact:true}).click();
 await expect(phone.getByRole('dialog',{name:'设备连接'})).toHaveCount(0);
 await tablet.getByRole('button',{name:'关闭连接设置'}).click();
 await tablet.getByRole('button',{name:'虚拟键盘',exact:true}).click();
 await tablet.getByRole('button',{name:'手机输入',exact:true}).click();
 await phone.getByRole('button',{name:'开始使用',exact:true}).click();
 await tablet.getByRole('button',{name:'收起虚拟键盘',exact:true}).click();
 const sizes=[{width:390,height:844},{width:360,height:700}],defaults=[];
 for(const size of sizes){
  await phone.setViewportSize(size);
  await expect(phone.getByLabel('展开触控板')).toBeVisible();
  const g=await geometry(phone);defaults.push(g);
  expect(g.dock.h).toBe(368);expect(g.surface.h).toBe(222);
  expect(g.label).toBe('智慧语音');expect(g.clip).toBe('none');
  expect(g.dock.y+g.dock.h).toBe(size.height);
  expect(g.mouse.x+g.mouse.w/2).toBeCloseTo(size.width/2,1);
  await phone.screenshot({path:`artifacts/trackpad-parity/default-${size.width}.png`});
 }
 await phone.getByRole('button',{name:'WorkBuddy',exact:true}).click();
 await tablet.getByLabel('WorkBuddy 任务输入').click();
 const draft=phone.getByLabel('手机 WorkBuddy 草稿');
 await expect(draft).toBeVisible();
 await draft.fill('保留当前任务输入');
 await phone.getByRole('button',{name:'触控板',exact:true}).click();
 for(const [i,size] of sizes.entries()){
  await phone.setViewportSize(size);
  await expect(phone.getByLabel('展开触控板')).toBeVisible();
  const g=await geometry(phone);
  expect(g).toEqual(defaults[i]);
  const send=await phone.getByRole('button',{name:'发送任务',exact:true}).boundingBox();
  expect(send!.y+send!.height).toBeLessThanOrEqual(g.dock.y);
  await phone.screenshot({path:`artifacts/trackpad-parity/workbuddy-${size.width}.png`});
  await phone.getByRole('button',{name:'键盘',exact:true}).click();
  await expect(phone.getByLabel('展开键盘')).toBeVisible();
  await expect(phone.getByLabel('展开触控板')).toHaveCount(0);
  await phone.getByRole('button',{name:'触控板',exact:true}).click();
  expect(await geometry(phone)).toEqual(g);
  await expect(draft).toHaveAttribute('data-value','保留当前任务输入');
 }
 await ctx.close();
});
