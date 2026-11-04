import test from 'node:test';import assert from 'node:assert/strict';
import {extractLiveParameters,resolveLiveParameters,livePrompt} from './live-workbuddy';
test('real prompt retains separately owned colors, time and source spans',()=>{const text='做一份产品介绍PPT，讲10分钟。参考产品资料，放入实拍照片。背景用灰色，主色用红色，字体用黑色。产品展示页的布局我画一下。';const p=resolveLiveParameters(text,[]);assert.equal(p.length,7);assert.equal(p.filter(x=>x.kind==='color').length,3);for(const x of p)assert.equal(text.slice(x.start,x.end),x.phrase);assert.equal(p.at(-1)?.scope,'产品展示页');});
test('ordinary descriptors, negations and vague duration never invent parameters',()=>{for(const text of ['产品是红色的','不要红色','背景不要红色','讲短一点'])assert.deepEqual(extractLiveParameters(text),[]);assert.equal(extractLiveParameters('背景用高级灰')[0].value,'');});
test('manual settings survive unchanged source and explicit corrections replace them',()=>{const text='主色用红色';const p=resolveLiveParameters(text,[]);p[0]={...p[0],manual:true,value:'#123456'};assert.equal(resolveLiveParameters(text,p)[0].value,'#123456');assert.equal(resolveLiveParameters('主色用蓝色',p)[0].value,'#356FE4');assert.deepEqual(resolveLiveParameters('不要红色',p),[]);});
test('separate page scope and last explicit correction are preserved',()=>{const p=extractLiveParameters('第一页背景用红色。第二页背景用蓝色。主色用红色，主色改为黑色');assert.equal(p.length,3);assert.equal(p[2].value,'#182431');});
test('submission preserves prose and only serializes actual edits/materials',()=>{const p=extractLiveParameters('讲10分钟');assert.equal(livePrompt('讲10分钟',p,[]),'讲10分钟');p[0].manual=true;p[0].value='11';assert.match(livePrompt('讲10分钟',p,[]),/讲11分钟/);});

test('explicit numeric and Chinese speech durations work before or after the task word',()=>{for(const text of ['做5分钟演讲','请做五分钟的演示','讲五分钟'])assert.equal(extractLiveParameters(text).find(p=>p.kind==='duration')?.value,'5');assert.equal(extractLiveParameters('演讲二十五分钟')[0].value,'25');assert.deepEqual(extractLiveParameters('不要五分钟演讲'),[]);assert.deepEqual(extractLiveParameters('讲90分钟'),[]);assert.equal(extractLiveParameters('讲60分钟')[0].value,'60');});

test('target projection replaces source values and retains page scope without an override appendix',async()=>{
 const {projectTargetInput,workBuddyInputCapabilities}=await import('./live-workbuddy');
 const text='第一页背景用红色。第二页背景用蓝色。讲三分钟。蓝色的天空。';const parameters=resolveLiveParameters(text);parameters[0]={...parameters[0],manual:true,value:'#123abc'};
 const projected=projectTargetInput(text,parameters,[],workBuddyInputCapabilities);
 assert.equal(projected.text,'第一页背景用#123ABC。第二页背景用#356FE4。讲3分钟。蓝色的天空。');
 assert.equal(projected.text.includes('用户调整'),false);assert.equal(projected.spans.length,3);
 assert.equal(projected.text.slice(projected.spans[0].targetStart,projected.spans[0].targetEnd),'#123ABC');
});
test('attachments are capability filtered; sketch purpose is scoped and idempotent',async()=>{
 const {projectTargetInput,workBuddyInputCapabilities}=await import('./live-workbuddy');const materials=[{id:'s',name:'布局.png',kind:'sketch' as const,scope:'第2页'},{id:'d',name:'资料.pdf',kind:'document' as const}];
 const unsupported=projectTargetInput('生成PPT',[],materials,{text:true,attachments:[]});assert.equal(unsupported.attachments.length,0);assert.equal(unsupported.unavailable.length,2);assert.equal(unsupported.text,'生成PPT');
 const accepted=projectTargetInput('生成PPT',[],materials,workBuddyInputCapabilities);assert.equal(accepted.attachments.length,2);assert.match(accepted.text,/按此图安排第2页布局/);assert.equal(projectTargetInput(accepted.text,[],materials,workBuddyInputCapabilities).text,accepted.text);
});
test('readback echoes preserve local widgets and genuine target edits invalidate overrides',async()=>{
 const {reconcileTargetInput,livePrompt}=await import('./live-workbuddy');const text='主色用红色',p=resolveLiveParameters(text);p[0]={...p[0],manual:true,value:'#123456'};const projection=livePrompt(text,p,[]);
 assert.deepEqual(reconcileTargetInput(text,p,projection,projection),{text,parameters:p});const edited=reconcileTargetInput(text,p,'主色用黑色',projection);assert.equal(edited.parameters[0].value,'#182431');assert.equal(edited.parameters[0].manual,false);
});

test('layout word suggests an optional sketch entry even when prose delegates layout',()=>{for(const text of ['布局你来排版','布局你来画一下'])assert.equal(extractLiveParameters(text).filter(p=>p.kind==='sketch').length,1);});
