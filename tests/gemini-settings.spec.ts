import {test,expect} from '@playwright/test';
test('Gemini setup clears transient key and distinguishes configured from verified',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/?role=phone&bridge=5191');
 await page.evaluate(()=>{const w=window as any;w.__aiOps=[];w.__aiConfig=[];w.MobileNative={aiControl:(op:string)=>{w.__aiOps.push(op);if(op==='logout')window.dispatchEvent(new CustomEvent('native-ai-status',{detail:{connected:false,pending:false,model:'gemini-3.8-flash',error:''}}));return 'requested';},aiConfigure:(key:string,model:string)=>{w.__aiConfig.push({key,model});window.dispatchEvent(new CustomEvent('native-ai-status',{detail:{connected:true,pending:false,model,error:''}}));return 'saved';}};});
 await page.locator('summary').filter({hasText:'Gemini API'}).click();
 const section=page.locator('.gemini-account');await expect(section).toContainText('未配置');
 await section.getByLabel('Gemini API 密钥').fill('test-key-not-a-real-credential-12345');
 await section.getByRole('button',{name:'保存密钥'}).click();await expect(section.getByLabel('Gemini API 密钥')).toHaveValue('');await expect(section).toContainText('已配置');await expect(section).not.toContainText('已验证');
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('test-key-not-a-real-credential');
 await section.getByRole('button',{name:'测试润色'}).click();expect(await page.evaluate(()=>(window as any).__aiOps)).toContain('verify');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('native-ai-status',{detail:{connected:true,pending:false,verified:true,model:'gemini-3.8-flash',error:''}})));await expect(section).toContainText('已验证');
 await section.getByRole('button',{name:'移除密钥'}).click();await expect(section).toContainText('未配置');
});
