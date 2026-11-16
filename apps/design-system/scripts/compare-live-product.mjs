// Run from the repository root. Uses fresh fictional browser sessions and bridge 5291.
// Never connects to a native transport or submits an Agent task. Evidence remains ignored.
import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
const context=await browser.newContext(),tablet=await context.newPage(),phone=await context.newPage(),site=await context.newPage();
const product=process.env.PRODUCT_URL||'http://127.0.0.1:5282/',docs=process.env.DESIGN_SYSTEM_URL||'http://127.0.0.1:5281/mobile-input/';
for(const url of [product,docs])if(!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('QA requires an isolated local server.');
phone.setDefaultTimeout(4000);site.setDefaultTimeout(4000);
await phone.setViewportSize({width:390,height:844});await site.setViewportSize({width:1280,height:844});
await tablet.goto(product+'?bridge=5291');await tablet.getByRole('button',{name:'设置',exact:true}).click();await tablet.getByRole('radio',{name:/扫码网络建联/}).check();const pin=(await tablet.locator('.pair-code').innerText()).trim();await tablet.getByRole('button',{name:'关闭连接设置'}).click();
await phone.goto(product+'?role=phone&bridge=5291');await phone.getByLabel('平板地址').fill('127.0.0.1');await phone.getByLabel('配对码',{exact:true}).fill(pin);await phone.getByRole('button',{name:'连接',exact:true}).click();await phone.getByRole('dialog',{name:'设备连接'}).waitFor({state:'hidden'});
const cmd=async(type,value)=>tablet.evaluate(async({type,value})=>{const r=await import(performance.getEntriesByType('resource').find(e=>/\/src\/runtime\.ts(?:\?|$)/.test(e.name)).name);return r.command(type,type.startsWith('present-')?{...value,session:r.currentState().presentation.session,slide:r.currentState().slide}:value);},{type,value});
const fields=['fontFamily','fontSize','fontWeight','lineHeight','color','backgroundColor','backgroundImage','borderTopWidth','borderTopColor','borderRadius','padding','gap','display','alignItems','justifyContent','boxShadow','opacity','height','width'];
const sample=async(page,selector)=>page.locator(selector).first().evaluate((el,fields)=>{const style=getComputedStyle(el),rect=el.getBoundingClientRect();return {style:Object.fromEntries(fields.map(k=>[k,style[k]])),width:rect.width,height:rect.height};},fields);
const results=[],missing=[];
// A minified CSS gradient may omit an exactly interpolated midpoint stop.
const canonical=value=>typeof value==='string'?value.replace(/(rgba\(181, 43, 65, 0\.95\)) 49\.645%/g,'$1'):value;
async function compare(name,id,selectors,sourcePage=phone){
 await site.goto(docs+'#/components/'+id);await site.locator('.preview-host').waitFor();await sourcePage.evaluate(()=>document.fonts.ready);await site.evaluate(()=>document.fonts.ready);await site.waitForTimeout(650);
 for(const selector of selectors){try{const a=await sample(sourcePage,selector),b=await sample(site,'.preview-host '+selector);const diff=fields.filter(k=>canonical(a.style[k])!==canonical(b.style[k])).map(k=>[k,a.style[k],b.style[k]]);results.push({name,selector,diff,product:a,site:b});console.log(name,selector,JSON.stringify(diff));fs.writeFileSync('artifacts/design-system/actual-parity.json',JSON.stringify(results,null,2));}catch(e){missing.push({name,selector,error:e.message});console.log('MISSING',name,selector);}}
 await sourcePage.screenshot({path:`artifacts/design-system/parity-product-${name}.png`});await site.locator('.preview-viewport').screenshot({path:`artifacts/design-system/parity-site-${name}.png`});
}
await cmd('open','bilibili');await phone.locator('.bili-actions').waitFor();await compare('media','media-controls',['.bili-playback-row','.bili-play-toggle','.bili-speed button','.bili-volume','.bili-volume input']);
await cmd('open','paint');await phone.locator('.paint-console').waitFor();await compare('paint','painting-visual-brush-console',['.paint-console','.paint-brushes button','.paint-size input','.paint-hue','.paint-presets button']);
await cmd('open','workbuddy');await phone.locator('.input-dock').waitFor();await compare('dock','input-dock',['.input-dock','.input-edit-tools button','.input-mode-key','.input-voice']);
await compare('tasks','visible-task-navigation',['.controller-tasks','.controller-task-list button']);
await phone.getByLabel('手机 WorkBuddy 草稿').fill('做一份产品介绍，讲十分钟，主题色用红色，字体用黑色。添加实拍照片，产品展示页布局我画一下。');await phone.getByRole('button',{name:'主题色 红色',exact:true}).click();await compare('color','color-refinement',['.live-wb-aux','.agent-color-body','.agent-color-bottom input','.agent-tone-ramp','.agent-color-presets button']);

await phone.getByRole('button',{name:'图片 实拍照片',exact:true}).click();await compare('image','image-input',['.live-wb-aux','.agent-photo-actions','.agent-photo-source']);
await phone.getByRole('button',{name:'布局草图 我画一下',exact:true}).click();await compare('sketch','sketch',['.live-wb-aux','.agent-sketch-surface','.live-wb-sketch-tools','.live-wb-sketch-tools button']);
await cmd('open','paint');await tablet.setViewportSize({width:1280,height:844});await tablet.getByRole('button',{name:'颜色',exact:true}).click();await compare('tablet-color','paint-color-picker',['.gp-color-panel','.gp-segments button','.gp-color-plane','.gp-color-hex input','.gp-color-panel header','.gp-color-history','.gp-color-swatches','.gp-color-panel small','.gp-color-history>div','.gp-color-history button'],tablet);
await cmd('open','slides');await compare('notes','notes',['.present-notes','.present-notes>div']);
await cmd('present',true);await tablet.locator('.presentation').waitFor();await tablet.waitForTimeout(100);const ink=await cmd('present-mode',{mode:'ink'});if(!ink.ok)throw Error(ink.error);await compare('presentation','presentation-tools',['.present-tools','.present-tools button','.present-palette','.present-palette input','.present-colors button']);
await compare('hold','hold',['.present-hold','.present-hold button']);
await cmd('open','mario');await phone.setViewportSize({width:844,height:390});await compare('game','game',['.fc-dpad','.fc-action','.fc-action span']);await phone.setViewportSize({width:390,height:844});
await cmd('open','wechat');await phone.locator('.reply-options button').first().waitFor({timeout:10000});await compare('replies','reply',['.reply-options','.reply-options button']);
fs.writeFileSync('artifacts/design-system/actual-parity.json',JSON.stringify(results,null,2));if(missing.length||results.some(result=>result.diff.length))throw Error(JSON.stringify({missing,differences:results.filter(result=>result.diff.length)}));
console.log(`Matched ${results.length} selectors across ${new Set(results.map(result=>result.name)).size} live product families.`);
} finally {await browser.close();}
