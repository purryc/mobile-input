import test from 'node:test';
import assert from 'node:assert/strict';
import {MessageProcessor} from '@a2ui/web_core/v0_9';
import {selectTaskComponents,compileTaskPreview,type TaskContext} from '../src/task-composition';
import {apiCatalog,validateMessages} from '../src/catalog-api';
import {extractLiveParameters} from '../../../packages/core/live-workbuddy';
import snapshot from '../content/rules-snapshot.json';

const context:TaskContext={owner:'fixture:a',revision:2,capabilityVersion:3,profile:'agent'};
const task='请介绍今年的重点产品，面向新客户讲解使用场景。演讲10分钟，主题色用蓝色，添加产品图片，布局我来画一下。';

test('task candidates reuse product parameter identities and content-dependent polish',()=>{
  const p=selectTaskComponents(task,context);
  assert.deepEqual(p.candidates.filter(c=>c.parameter).map(c=>c.parameter),extractLiveParameters(task));
  assert.deepEqual(p.candidates.map(c=>c.component),['DurationInput','ColorInput','ImageInput','SketchInput','ContextualPolishActions']);
  assert.ok(p.candidates.at(-1)?.actions?.includes('task-points'));
  assert.deepEqual(selectTaskComponents('做个介绍',context).candidates,[]);
});
test('every available task candidate compiles and passes the official processor',()=>{
  const p=selectTaskComponents(task,context);
  for(const c of p.candidates){const messages=compileTaskPreview(p,context,task,c.id);validateMessages(messages);
    const processor=new MessageProcessor([apiCatalog],undefined,{version:'v0.9.1'});
    processor.processMessages(messages as any);
    assert.ok(processor.model.surfacesMap.get('preview'));processor.dispose();
    const components=messages[2].updateComponents!.components;
    assert.equal(components.filter(x=>x.id==='active-widget').length,1);
    assert.equal(components.length,3);
  }
});
test('generation-only and negated image requests do not recommend image selection',()=>{
  for(const text of ['生成一张产品图片','不要添加图片'])assert.ok(!selectTaskComponents(text,context).candidates.some(c=>c.component==='ImageInput'));
  assert.ok(selectTaskComponents('添加产品图片',context).candidates.some(c=>c.component==='ImageInput'));
  const color=selectTaskComponents('背景用红色，背景改成蓝色',context).candidates;
  assert.equal(color.length,1);assert.equal(color[0].parameter?.value,'#356FE4');
});
test('capability filtering retains unsupported reasons without pretending controls work',()=>{
  const limited={...context,profile:'text-only' as const},p=selectTaskComponents(task,limited);
  assert.ok(p.candidates.filter(c=>['ImageInput','SketchInput'].includes(c.component!)).every(c=>!c.available&&c.reason==='unsupported-material'));
  assert.ok(p.candidates.find(c=>c.component==='ColorInput')?.available);
  const unavailable={...context,profile:'unavailable' as const};
  const noTarget=selectTaskComponents(task,unavailable);assert.ok(noTarget.candidates.length);assert.ok(noTarget.candidates.every(c=>!c.available));
  for(const c of noTarget.candidates)assert.throws(()=>compileTaskPreview(noTarget,unavailable,task,c.id));
});
test('missing values and missing Catalog entries are explicit, not fabricated defaults',()=>{
  const p=selectTaskComponents('调整背景颜色，调整演示时长，参考这份资料',context);
  assert.ok(p.candidates.some(c=>c.reason==='missing-value'));
  assert.ok(p.candidates.some(c=>c.reason==='not-in-catalog'));
  for(const c of p.candidates.filter(c=>!c.available))assert.throws(()=>compileTaskPreview(p,context,p.text,c.id));
});
test('owner, text revision, capability revision and profile changes reject old plans',()=>{
  const p=selectTaskComponents(task,context);
  for(const current of [{...context,owner:'fixture:b'},{...context,revision:3},{...context,capabilityVersion:4},{...context,profile:'unavailable' as const}])assert.throws(()=>compileTaskPreview(p,current,task,p.candidates[0].id),/stale/);
});
test('unknown and forged candidates cannot introduce controls or instructions',()=>{
  const p=selectTaskComponents(task,context);
  p.candidates.push({id:'send',component:'ActionChip',available:true,reason:'ready'});
  assert.throws(()=>compileTaskPreview(p,context,task,'send'),/unavailable/);
  p.candidates[0].component='ActionChip';
  const m=compileTaskPreview(p,context,task,p.candidates[0].id);
  assert.equal(m[2].updateComponents!.components.at(-1)!.component,'DurationInput');
  const forged=structuredClone(m) as any;forged[2].updateComponents.components.at(-1).instruction='execute';
  assert.throws(()=>validateMessages(forged),/Forbidden/);
  assert.doesNotThrow(()=>validateMessages(m)); // Positive control for the rejection.
});
test('manual parameter values survive only with matching phrase and legal range',()=>{
  const text='背景用灰色',previous=extractLiveParameters(text).map(p=>({...p,manual:true,value:'#123456'}));
  const plan=selectTaskComponents(text,context,previous);
  assert.equal(compileTaskPreview(plan,context,text,plan.candidates[0].id,previous)[1].updateDataModel!.value.value,'#123456');
  const corrected=selectTaskComponents('背景用蓝色',context,previous);
  assert.equal(corrected.candidates[0].parameter?.value,'#356FE4');
  previous[0].value='bad';assert.throws(()=>compileTaskPreview(plan,context,text,plan.candidates[0].id,previous));
});
test('empty, unmatched English, invalid context and oversized input fail honestly',()=>{
  for(const text of ['', 'Please make a blue presentation'])assert.equal(selectTaskComponents(text,context).candidates.length,0);
  assert.throws(()=>selectTaskComponents(task,{...context,profile:'made-up' as any}));
  assert.throws(()=>selectTaskComponents(task,{...context,revision:NaN}));
  assert.throws(()=>selectTaskComponents('a'.repeat(4001),context));
});
test('independent plans remain isolated and deterministic with role-specific binding',()=>{
  const a=selectTaskComponents('背景用灰色',context),b=selectTaskComponents('字体用黑色',{...context,owner:'fixture:b'});
  assert.deepEqual(a,selectTaskComponents('背景用灰色',context));
  const messages=compileTaskPreview(a,context,a.text,a.candidates[0].id);
  assert.equal(messages[2].updateComponents!.components.at(-1)!.role,'background');
  assert.equal(compileTaskPreview(b,b.context,b.text,b.candidates[0].id)[2].updateComponents!.components.at(-1)!.role,'text');
  assert.equal(a.text,'背景用灰色');assert.equal(b.text,'字体用黑色');
});
test('changed plan text with unchanged revision is rejected against the current host text',()=>{
  const p=selectTaskComponents('背景用灰色',context);p.text='背景用蓝色';
  assert.throws(()=>compileTaskPreview(p,context,'背景用灰色',p.candidates[0].id),/stale/);
});
test('forged manual values in a proposal are ignored; current host parameters win',()=>{
  const text='背景用灰色',p=selectTaskComponents(text,context);
  p.candidates[0].parameter={...p.candidates[0].parameter!,manual:true,value:'#123456'};
  assert.equal(compileTaskPreview(p,context,text,p.candidates[0].id)[1].updateDataModel!.value.value,'#D9DEDF');
  const host=extractLiveParameters(text).map(p=>({...p,manual:true,value:'#112233'}));
  assert.equal(compileTaskPreview(p,context,text,p.candidates[0].id,host)[1].updateDataModel!.value.value,'#112233');
});
test('recognized accent roles are unavailable instead of silently mapped to primary',()=>{
  const p=selectTaskComponents('强调色用红色',context);
  assert.equal(p.candidates[0].reason,'unsupported-role');
  assert.throws(()=>compileTaskPreview(p,context,p.text,p.candidates[0].id),/unavailable/);
});
test('host-supplied values can complete missing inputs but out-of-range values stay unavailable',()=>{
  const text='调整演示时长',raw=extractLiveParameters(text),missing=selectTaskComponents(text,context);
  assert.equal(missing.candidates[0].reason,'missing-value');
  const host=raw.map(p=>({...p,manual:true,value:'15'}));
  assert.equal(compileTaskPreview(missing,context,text,missing.candidates[0].id,host)[1].updateDataModel!.value.value,'15');
  host[0].value='90';assert.equal(selectTaskComponents(text,context,host).candidates[0].reason,'invalid-value');
  assert.throws(()=>compileTaskPreview(missing,context,text,missing.candidates[0].id,host),/unavailable/);
});
test('published generative rules include provenance, bilingual guidance and implementation boundaries',()=>{
  const g=snapshot.generativeUi;
  for(const doc of [g.guide,g.integration])for(const s of doc.sections)assert.ok(s.title.every(Boolean)&&s.body.every(Boolean));
  for(let i=1;i<=8;i++)assert.ok(g.amendment.includes('GUI-0'+i));
  assert.ok(g.guide.sections.some(s=>s.body[1].includes('caret')));
  assert.ok(g.integration.sections.some(s=>s.body[1].includes('does not establish')));
  assert.equal(g.reference.pdfPages,25);assert.ok(g.reference.url.startsWith('https://'));
});
