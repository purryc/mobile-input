import test from 'node:test';
import assert from 'node:assert/strict';
import {demoPolishActions,protectDemoPolish,polishDemo,applyDemoPolish,validateDemoPolish,type DemoPolishInput} from './workbuddy-demo-polish';
const input=(text='请帮我整理一个完整的产品发布方案，重点说明目标用户的价值。'):DemoPolishInput=>({id:'test',owner:'draft-a',text,selection:{start:0,end:0},action:'task-points'});
test('contextual Agent actions filter bilingual short, identifier and parameter-only content',()=>{
 for(const value of ['', '你好', 'Make slides', 'https://example.com', '#ABCDEF','12345','主题色用红色，字体用黑色，时长五分钟。','Use a red theme, black text, add product photos.'])assert.deepEqual(demoPolishActions(value),[],value);
 assert.deepEqual(demoPolishActions(input().text).map(a=>a.id),['task-points']);
 assert.ok(demoPolishActions('Plan a launch. Explain the audience.').some(a=>a.id==='task-points'));
 assert.ok(demoPolishActions('Please please describe the product').some(a=>a.id==='task-short'));
 assert.deepEqual(demoPolishActions('Assess the best case'),[],'repeated letters inside words are not repetition');
});
test('Chinese and English parameter roles, page scopes and negative constraints survive prose edits',()=>{
 for(const source of [
  '请帮我整理一个完整的产品发布方案，重点说明目标用户的价值，主题色用红色，字体用黑色，不要添加图片。',
  'Plan a launch. Explain the audience. On slide two use a red theme, black text. Do not add photos.',
 ]){
  const p=protectDemoPolish(source);
  const result=p.restore(p.text.replace('重点说明','着重说明').replace('Explain the audience','Describe the audience'));
  assert.ok(result.includes(source.includes('主题色')?'主题色用红色':'On slide two use a red theme'));
  assert.throws(()=>p.restore(p.text.replace(/⟦[^⟧]+⟧/,'')));
  assert.doesNotThrow(()=>applyDemoPolish(input(source),result));
  assert.throws(()=>applyDemoPolish(input(source),result.replace(/不要添加图片|Do not add photos/,'')));
  assert.throws(()=>applyDemoPolish(input(source),result.replace(/红色|red/,'blue')));
 }
});
test('selected-only rewrite keeps surrounding context and rejects modified parameter scope',()=>{
 const source='主题色用红色。请帮我整理一个完整的产品发布方案，重点说明目标用户的价值。背景用黑色。';
 const request=input(source);request.selection={start:source.indexOf('请'),end:source.indexOf('背景')};
 const next=applyDemoPolish(request,'整理产品发布方案，说明目标用户价值。');
 assert.equal(next.text,'主题色用红色。整理产品发布方案，说明目标用户价值。背景用黑色。');
 assert.equal(next.selection.start,request.selection.start);
});
test('server uses only registered actions and masked text, supports unchanged output and abort',async()=>{
 const request=input(input().text+'主题色用红色。');
 let prompt='';
 const result=await polishDemo(request,async p=>{prompt=p;return JSON.parse(p.split('Text (JSON encoded): ')[1]);},new AbortController().signal);
 assert.equal(result.text,request.text);
 assert.ok(!prompt.includes('主题色用红色'));
 assert.match(prompt,/never answer or execute/);
 for(const change of [{action:'run-agent'},{selection:{start:-1,end:2}},{text:'make slides'},{text:'很'.repeat(16001)}])assert.throws(()=>validateDemoPolish({...request,...change}));
 const controller=new AbortController();
 await assert.rejects(polishDemo(request,async()=>{controller.abort();return 'changed';},controller.signal));
});
