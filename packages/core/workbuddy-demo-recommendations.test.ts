import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newDemoDraft, editDemoText, revealDemoRecommendations, pendingDemoRecommendations, snapshotDemoRequest} from './workbuddy-demo-state';
import {demoScenarios} from './workbuddy-demo-scenarios';
import {dismissalKey} from './workbuddy-demo-controls';
for (const scenario of demoScenarios) test('deferred adoption and exact snapshot: '+scenario.id,()=>{
 const draft=editDemoText(newDemoDraft(),scenario.text,true);
 assert.ok(draft.controls?.every(c=>c.origin!=='recommended'));
 const pending=pendingDemoRecommendations(draft);
 const snapshot=snapshotDemoRequest(draft);
 assert.ok(snapshot.controls?.every(c=>c.origin!=='recommended'));
 if(scenario.id!=='explicit')assert.equal(snapshot.materials.length,0);
 const shown=revealDemoRecommendations(draft);
 assert.equal(pendingDemoRecommendations(shown).length,0);
 assert.ok(shown.materials[0]?.blob.size);
 assert.equal(shown.controls!.length,draft.controls!.length+pending.length);
 const duplicate=editDemoText(shown,shown.text,true);
 assert.equal(JSON.stringify(duplicate.controls),JSON.stringify(shown.controls));
 assert.deepEqual(duplicate.materials,shown.materials);
 const shifted=editDemoText(shown,'补充：'+shown.text,true);
 assert.equal(shifted.controls!.length,shown.controls!.length);
});
test('negation, dismissed recommendations and manual choices remain authoritative during settling',()=>{
 const text='请准备简短的演讲报告，整体希望沉静专业，内容需要可靠的产品资料支撑。';
 const shown=revealDemoRecommendations(editDemoText(newDemoDraft(),text,true));
 const duration=shown.controls!.find(c=>c.kind==='duration')!;
 const manual=editDemoText({...shown,controls:shown.controls!.map(c=>c.id===duration.id?{...c,origin:'manual',value:['14']}:c)},text+'最后总结。',true);
 assert.equal(manual.controls!.find(c=>c.id===duration.id)!.value[0],'14');
 const dismissed=editDemoText({...shown,controls:shown.controls!.filter(c=>c.id!==duration.id),dismissedControls:[dismissalKey(duration)]},text,true);
 assert.ok(!pendingDemoRecommendations(dismissed).some(c=>c.kind==='duration'));
 const revised=editDemoText(shown,'不要推荐配色，也不要参考文件。',true);
 assert.equal(revised.materials.length,0);
 assert.ok(!revised.controls!.some(c=>c.kind==='palette'));
});
test('semantic recommendation identity survives rephrasing and legacy revision metadata',()=>{
 const shown=revealDemoRecommendations(editDemoText(newDemoDraft(),'准备简短的演讲报告。',true));
 shown.controls=shown.controls!.map(c=>({...c,seen:true}));
 const rephrased=editDemoText(shown,'准备精炼的口头汇报。',true);
 assert.equal(rephrased.controls!.length,1);assert.equal(rephrased.controls![0].seen,true);
 assert.equal(pendingDemoRecommendations(rephrased).length,0);
 const legacy={...shown,controls:shown.controls!.map(c=>({...c,revision:undefined as unknown as string}))};
 assert.equal(editDemoText(legacy,legacy.text,true).controls!.length,1);
 const explicit=editDemoText(newDemoDraft(),'主题色用蓝色，10分钟演讲，整体温暖自然。',true);
 const snapshot=snapshotDemoRequest(explicit);
 assert.ok(snapshot.parameters.some(p=>p.kind==='color'&&p.value));
 assert.ok(snapshot.parameters.some(p=>p.kind==='duration'&&p.value==='10'));
});

test('individual reveal adopts only its own material and leaves later candidates out of Send',()=>{
 let d=editDemoText(newDemoDraft(),'准备简短的演讲报告，整体沉静专业，需要可靠的产品资料。',true);
 const pending=pendingDemoRecommendations(d);assert.equal(pending.length,3);
 d=revealDemoRecommendations(d,[pending[0].id]);assert.equal(d.controls!.length,1);assert.equal(d.materials.length,0);
 assert.equal(snapshotDemoRequest(d).controls!.length,1);
 d=revealDemoRecommendations(d,[pending[1].id]);assert.equal(d.controls!.length,2);assert.equal(d.materials.length,0);
 d=revealDemoRecommendations(d,[pending[2].id]);assert.ok(d.materials[0].blob.size);
});
test('natural workspace intents recommend HTML and analysis without format words',()=>{
 const zh='帮我做一个客户反馈工作台，打开就能按状态筛选问题、查看负责人和进度，字形清楚易读，希望能分析反馈。';
 const en='Build a customer feedback workspace to filter issues by status and view owners and progress, with clear readable type. Analyze feedback.';
 for(const text of [zh,en]){
 const c=revealDemoRecommendations(editDemoText(newDemoDraft(),text,true)).controls!;
 for(const [kind,value]of [['formats','html'],['skills','data'],['font','sans-serif']]){const x=c.find(c=>c.kind===kind)!;assert.equal(x.origin,'recommended');assert.ok(x.value.includes(value));}
 }
 for(const text of ['写一份工作台说明文档，介绍如何筛选问题。','不要做工作台，可以筛选问题。','Write a document about a workspace to filter issues.'])assert.ok(!revealDemoRecommendations(editDemoText(newDemoDraft(),text,true)).controls!.some(c=>c.kind==='formats'&&c.value.includes('html')));
 const explicit=revealDemoRecommendations(editDemoText(newDemoDraft(),zh+'输出格式选择PDF。',true));assert.deepEqual(explicit.controls!.find(c=>c.kind==='formats')!.value,['pdf']);
});
test('a connected reference source never becomes a spurious file chip while suggestions are pending',()=>{
 const d=editDemoText(newDemoDraft(),'参考需求说明文件，并参考已连接资料来源里的知识。',true);
 assert.equal(d.parameters.filter(p=>p.kind==='document').length,1);
 assert.equal(d.parameters.find(p=>p.kind==='document')!.phrase,'需求说明文件');
});
test('spoken training recommendation excludes written material and honors delivery and English negation',()=>{
 for(const text of ['简短的培训手册','简洁的培训文档','精炼的培训讲义'])assert.ok(!revealDemoRecommendations(editDemoText(newDemoDraft(),text,true)).controls!.some(c=>c.kind==='duration'));
 for(const text of ["Don't build a dashboard, just let me filter issues.",'帮我制作一份工作台说明文档，可以筛选问题。'])assert.ok(!revealDemoRecommendations(editDemoText(newDemoDraft(),text,true)).controls!.some(c=>c.kind==='formats'));
 const delivery=revealDemoRecommendations(editDemoText(newDemoDraft(),'给我一份可以继续编辑的演示稿，方便直接分发和阅读。',true));assert.deepEqual(delivery.controls!.find(c=>c.kind==='formats')!.value,['pptx','pdf']);
 const reverse=pendingDemoRecommendations(editDemoText(newDemoDraft(),'整体沉静专业，准备简短培训。',true));assert.deepEqual(reverse.map(c=>c.kind),['palette','duration']);
});
