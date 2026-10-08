import type {Page} from '@playwright/test';
async function home(page:Page){for(let i=0;i<4&&!((await page.locator('.tablet').getAttribute('class'))||'').includes('scene-desktop');i++)await page.getByRole('button',{name:'返回',exact:true}).click();}
import {test,expect} from '@playwright/test';
import {apps} from '../packages/core/model';

test('desktop demo application surfaces open without script errors',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?bridge=5191');
 for(const a of apps.filter(a=>['mail','sheet','word','slides','wechat','doubao','notes','paint','mario'].includes(a[0]))){if(['sheet','word','slides'].includes(a[0]))await page.getByRole('button',{name:'WPS',exact:true}).click();await page.getByRole('button',{name:({sheet:'新建表格',word:'新建文字',slides:'新建演示'} as Record<string,string>)[a[0]]||a[1],exact:true}).click();await expect(page.locator('.tablet')).toHaveClass(new RegExp('scene-'+a[0]));await expect(page.locator('.application')).toBeVisible();
 await home(page);}
 expect(errors).toEqual([]);
});

test('phone re-pairs to authoritative presentation state and no browser speech is fabricated',async({browser})=>{
 const ctx=await browser.newContext();const tablet=await ctx.newPage(),phone=await ctx.newPage();await phone.setViewportSize({width:390,height:844});await tablet.goto('/?bridge=5191');await tablet.getByRole('button',{name:'连接手机',exact:true}).click();const pin=await tablet.locator('.pair-code').innerText();await tablet.locator('.scrim').click({position:{x:5,y:5}});
 async function pair(){await phone.goto('/?role=phone&bridge=5191');await phone.getByLabel('平板地址').fill('localhost');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await expect(phone.getByText('已连接工作台')).toBeVisible();}
 await pair();await tablet.getByRole('button',{name:'WPS',exact:true}).click();await tablet.getByRole('button',{name:/澄星设计采购方案.docx/}).click();await tablet.locator('.word-paragraph').nth(1).click();const previous=await phone.getByLabel('手机输入草稿').inputValue();await phone.getByRole('button',{name:'语音输入',exact:true}).click();await expect(phone.getByText('内置语音需在手机 HAP 中使用')).toBeVisible();await expect(phone.getByLabel('手机输入草稿')).toHaveValue(previous);
 await home(tablet);await tablet.getByRole('button',{name:'WPS',exact:true}).click();await tablet.getByRole('button',{name:/销售进展汇报.pptx/}).click();await tablet.getByRole('button',{name:'放映',exact:true}).click();await phone.getByRole('button',{name:'跳至第 4 页'}).click();await expect(tablet.locator('.presentation-controls')).toContainText('4 / 6');
 await pair();await expect(phone.locator('.slide-counter>span')).toHaveText('04');await expect(tablet.locator('.presentation-controls')).toContainText('4 / 6');expect(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await ctx.close();
});
