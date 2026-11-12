import { test } from "node:test";
import assert from "node:assert/strict";
import {
  listControls,
  recommendControls,
  dismissalKey,
  mixedExample,
  openControl,
} from "./workbuddy-demo-controls";
import {
  newDemoDraft,
  editDemoText,
  snapshotDemoRequest,
  demoSendError,
} from "./workbuddy-demo-state";
import { protectDemoPolish, applyDemoPolish } from "./workbuddy-demo-polish";
test("14 registered controls invoke the host without executing services", () => {
  const calls: string[] = [];
  for (const c of listControls()) {
    const binding = openControl(c.kind, {
      owner: "demo",
      text: "hello",
      open: (b) => calls.push(b.kind),
    });
    assert.equal(binding.origin, "manual");
  }
  assert.equal(new Set(calls).size, 14);
});
test("explicit intent stays explicit even without a value; vague intent is recommended", () => {
  for (const text of [
    "请选专家和技能，连接器和字体也要选择",
    "Choose an expert, skills, connector and font",
  ]) {
    const controls = recommendControls(text);
    assert.equal(controls.length, 4);
    assert(controls.every((c) => c.origin === "explicit"));
  }
  for (const text of Object.values(mixedExample)) {
    const controls = recommendControls(text);
    assert.deepEqual(
      new Set(controls.map((c) => c.kind)),
      new Set(["palette", "document", "expert", "skills", "connectors"]),
    );
    assert(controls.every((c) => c.origin === "recommended"));
  }
});
test("explicit capability replaces an inference, regardless of occurrence order", () => {
  const controls = recommendControls("需要专业人士帮我，但请用内容创作专家。");
  const c = controls.find((c) => c.kind === "expert")!;
  assert.equal(c.origin, "explicit");
  assert.deepEqual(c.value, ["writer"]);
});
test("negation and unrelated generation do not invent controls", () => {
  assert.equal(
    recommendControls("不要专家，不要温暖自然，不需要团队协作").length,
    0,
  );
  assert.equal(
    recommendControls(
      "No expert, without a warm feeling, avoid team collaboration",
    ).length,
    0,
  );
  assert.equal(
    recommendControls("画图，图表。Generate an image of a tree.").length,
    0,
  );
});
test("progressive input, dismissal, shifting offsets and reload preserve decisions", () => {
  let previous: ReturnType<typeof recommendControls> = [];
  for (const text of ["整体温", "整体温暖", "整体温暖自然"])
    previous = recommendControls(text, { previous });
  const palette = previous[0];
  const dismissed = [dismissalKey(palette)];
  assert.equal(
    recommendControls("第一章：整体温暖自然", { previous, dismissed }).length,
    0,
  );
  const manual = {
    ...palette,
    origin: "manual" as const,
    value: ["fresh"],
    seen: true,
  };
  const next = recommendControls("整体温暖自然，再说明优势", {
    previous: [manual],
  });
  assert.equal(next[0].origin, "manual");
  assert.deepEqual(next[0].value, ["fresh"]);
});
test("mixed snapshot retains explicit colors duration, real reference bytes and recommendation metadata", () => {
  const d = editDemoText(newDemoDraft(), mixedExample.zh);
  assert(d.parameters.some((c) => c.kind === "duration"));
  assert(d.parameters.filter((c) => c.kind === "color").length >= 2);
  assert.equal(d.materials.length, 1);
  assert(d.materials[0].blob.size > 0);
  const request = snapshotDemoRequest(d);
  assert.equal(request.controls?.length, 5);
  d.controls![0].value = ["changed"];
  assert.notDeepEqual(request.controls![0].value, d.controls![0].value);
  assert.match(request.text, /Preserve every explicit color/);
});
test("pending capture blocks send; confirmed screenshot travels as bytes and unsupported video remains in draft", () => {
  const d = editDemoText(newDemoDraft(), "请说明产品。");
  d.captures = [
    {
      id: "capture",
      kind: "screenshot",
      name: "screen.png",
      blob: new Blob(["png"], { type: "image/png" }),
      size: 3,
      confirmed: false,
    },
  ];
  assert.match(demoSendError(d), /未确认/);
  d.captures[0].confirmed = true;
  assert.equal(snapshotDemoRequest(d).materials[0].id, "capture");
  d.captures[0].kind = "recording";
  assert.match(demoSendError(d), /不支持视频/);
  assert.throws(() => snapshotDemoRequest(d));
  assert.equal(d.captures.length, 1);
});
test("new parameter clauses are protected from polish in both languages", () => {
  for (const text of [
    "用内容创作专家，整体温暖自然一点。介绍产品。",
    "Use the content writer, make it warm and natural. Explain the product.",
  ]) {
    const p = protectDemoPolish(text);
    assert(p.protectedClauses.length >= 2);
    assert.equal(p.restore(p.text), text);
    assert.throws(() => p.restore(p.text.replace(/⟦[^⟧]+⟧/, "")));
  }
});

test("manual launcher values survive inferred intent and modified recommendations remain dismissible", () => {
  const previous = [
    {
      ...openControl("expert", { owner: "o", text: "", open: () => {} }),
      value: ["finance"],
    },
  ];
  const next = recommendControls("专业人士帮我看看", { previous });
  assert.deepEqual(next[0].value, ["finance"]);
  assert.equal(next[0].origin, "manual");
  assert.equal(
    recommendControls("专业人士帮我看看", {
      previous: next,
      dismissed: [dismissalKey(next[0])],
    }).length,
    0,
  );
});
test("negation is clause bounded and font colors are not font selections", () => {
  assert.equal(
    recommendControls("不要红色背景。整体温暖自然一点")[0].kind,
    "palette",
  );
  assert.equal(recommendControls("别太长，专家帮我看")[0].origin, "explicit");
  for (const text of [
    "字体颜色用黑色",
    "字体设为了黑色",
    "字体：黑色",
    "make the font black",
    "font color black",
  ])
    assert(!recommendControls(text).some((c) => c.kind === "font"));
});

test("polish cannot invent additional recommendation intent", () => {
  const text = "请整理产品介绍，说明目标用户与主要优势。然后介绍后续安排。";
  assert.throws(
    () =>
      applyDemoPolish(
        {
          id: "p",
          owner: "o",
          text,
          selection: { start: 0, end: 0 },
          action: "task-points",
        },
        text + "需要相关资料。",
      ),
    /输入意图/,
  );
});

test("standalone manual binding survives deletion of inferred prose, and ordinary 别 words are not negations", () => {
  const manual = {
    ...openControl("expert", { owner: "o", text: "", open: () => {} }),
    value: ["finance"],
  };
  const inferred = recommendControls("专业人士帮我看看", {
    previous: [manual],
  });
  assert.deepEqual(recommendControls("", { previous: inferred })[0].value, [
    "finance",
  ]);
  for (const text of ["特别需要内容创作专家", "分别选择专家", "区别在于专家"])
    assert.equal(recommendControls(text)[0].origin, "explicit");
  assert.equal(recommendControls("别用专家").length, 0);
});

import { demoScenarios } from './workbuddy-demo-scenarios';
import { demoPolishActions } from './workbuddy-demo-polish';
import { demoRequestParameters } from './workbuddy-demo-state';
const inlineKinds=listControls().filter(c=>c.kind!=='polish').map(c=>c.kind).sort();
for(const scenario of demoScenarios) test(`official ${scenario.id}: source, values, scopes, anchors, revisions and snapshots`,()=>{
 assert(!/\s/.test(scenario.text));
 let draft=editDemoText(newDemoDraft(),scenario.text);
 const bindings=[...draft.parameters.map(p=>({...p,origin:'explicit'})),...draft.controls!];
 assert.deepEqual([...new Set(bindings.map(c=>c.kind))].sort(),inlineKinds);
 for(const binding of bindings){
   assert.equal(scenario.text.slice(binding.start,binding.end),binding.phrase);
   assert(binding.phrase.length>0);
   assert(binding.end<scenario.text.length);
   const recommended=scenario.id==='recommended'||scenario.id==='mixed'&&['palette','document','connectors'].includes(binding.kind);
   assert.equal(binding.origin,recommended?'recommended':'explicit',binding.kind);
 }
 assert(demoPolishActions(draft.text).length>0);
 assert.equal(draft.controls!.find(c=>c.kind==='sketch')!.scope,'第二页');
 const values=Object.fromEntries(draft.controls!.map(c=>[c.kind,c.value]));
 assert.deepEqual(values.font,[scenario.id==='recommended'?'sans-serif':'微软雅黑']);
 assert.deepEqual(values.palette,['calm']);
 assert.deepEqual(values.connectors,['ima']);assert.deepEqual(values.document,['product-brief']);
 assert.deepEqual(values.expert,['ppt']);assert.deepEqual(values.skills,['ppt-implement']);assert.deepEqual(values.formats,['pptx','pdf']);
 const numeric=demoRequestParameters(draft);
 assert.equal(numeric.find(c=>c.kind==='duration')!.value,'10');
 const colors=numeric.filter(c=>c.kind==='color');assert.equal(colors.length,3);
 assert.deepEqual(colors.map(c=>c.value),scenario.id==='recommended'?['#5267B2','#F4F6FC','#202637']:['#356FE4','#FFFFFF','#182431']);
 assert.deepEqual(colors.map(c=>c.role),['主题色','背景','字体']);
 assert(colors.every(c=>c.scope==='全文'));
 assert.equal(draft.materials.length,1);assert.equal(draft.pendingPhotos.length,0);assert.deepEqual(draft.sketches,{});
 let partial=newDemoDraft();
 for(let i=1;i<=scenario.text.length;i++)partial=editDemoText(partial,scenario.text.slice(0,i));
 assert.deepEqual(partial.controls!.map(({seen,...c})=>c),draft.controls!.map(({seen,...c})=>c));assert.deepEqual(partial.parameters,draft.parameters);
 partial=editDemoText(partial,scenario.text.replace('10分钟','12分钟'));
 if(scenario.id!=='recommended')assert.equal(demoRequestParameters(partial).find(c=>c.kind==='duration')!.value,'12');
 const duration=draft.controls!.find(c=>c.kind==='duration')!;
 duration.value=['15'];duration.origin='manual';
 draft=editDemoText(structuredClone(draft),draft.text+'补充说明。');
 assert.equal(draft.controls!.find(c=>c.kind==='duration')!.value[0],'15');
 const request=snapshotDemoRequest(draft);
 assert.equal(request.parameters.find(c=>c.kind==='duration')!.value,'15');
 if(scenario.id!=='recommended')assert.match(request.text,/演讲时长设为15分钟/);
 assert.equal(request.materials.length,1);assert.equal(request.captures?.length,0);
 assert.equal(draft.text,scenario.text+'补充说明。');
});
test('vague timing is oral only, scopes and negation protect explicit intent',()=>{
 for(const text of ['简短的演讲报告','精炼的口头汇报','简短的培训介绍','a brief oral report'])assert.equal(recommendControls(text).find(c=>c.kind==='duration')!.value[0],'10');
 for(const text of ['简短的书面报告','精炼的研究报告','不要简短的演讲报告'])assert(!recommendControls(text).some(c=>c.kind==='duration'));
 assert.equal(editDemoText(newDemoDraft(),'10分钟的演讲报告').parameters.find(p=>p.kind==='duration')!.value,'10');
 assert.equal(recommendControls('请推荐配色方案')[0].origin,'recommended');
 assert.equal(recommendControls('请推荐上下文来源')[0].origin,'recommended');
 assert.equal(recommendControls('上下文来源选择ima知识库')[0].origin,'explicit');
 assert(!recommendControls('团队协作').some(c=>c.kind==='connectors'));
 assert.equal(recommendControls('主题色用红色。标题有重点。').filter(c=>c.kind==='color').length,0);
 assert.equal(recommendControls('第二页主题色用红色。标题有重点。').filter(c=>c.kind==='color').length,1);
});
test('dismissing every recommendation does not reveal a conflicting ordinary fallback',()=>{
 let draft=editDemoText(newDemoDraft(),demoScenarios[1].text);
 draft.dismissedControls=draft.controls!.map(dismissalKey);
 draft=editDemoText(draft,draft.text+'继续完善。');
 assert.equal(draft.controls!.length,0);assert.equal(draft.parameters.length,0);assert.equal(draft.materials.length,0);
});

import { demoNativeParameters } from './workbuddy-demo-state';
import { recommendationPrefix } from './workbuddy-demo-controls';
test('review regressions: filenames, verbs, scoped materials and reference-only connectors',()=>{
 for(const text of ['参考文件用报价.pdf','参考index.html','帮我导出一份报告','the exporter is ready'])assert(!recommendControls(text).some(c=>c.kind==='formats'));
 assert(editDemoText(newDemoDraft(),'参考报价.pdf').parameters.some(c=>c.kind==='document'));
 for(const text of ['做完发到企业微信群','用飞书通知团队','send to WeCom'])assert(!recommendControls(text).some(c=>c.kind==='connectors'));
 assert.equal(recommendControls('参考飞书中的产品资料')[0].kind,'connectors');
 const scoped=editDemoText(newDemoDraft(),'参考内置产品介绍。第二页添加我的本地文件。');
 assert(demoNativeParameters(scoped).some(p=>p.kind==='document'&&p.scope==='第二页'));
 const recommended=editDemoText(newDemoDraft(),demoScenarios[1].text);
 const dismissed=editDemoText({...recommended,dismissedControls:recommended.controls!.map(dismissalKey)},recommended.text);
 assert.equal(demoRequestParameters(dismissed).length,0);
 assert.equal(recommendationPrefix(recommended.controls!.find(c=>c.kind==='color')!,'en'),' (Suggested theme color: ');
 const manual={...openControl('expert',{owner:'a',text:'',open:()=>{}}),value:['writer']};
 const attached=editDemoText({...newDemoDraft(),controls:[manual]},'使用演示设计专家。');
 assert.equal(attached.controls![0].detached,false);
 assert.match(snapshotDemoRequest(attached).text,/使用内容创作专家/);
 const emptyColor={...openControl('color',{owner:'a',text:'',open:()=>{}}),value:['#123456']};
 assert.equal(demoRequestParameters({...newDemoDraft(),controls:[emptyColor]})[0].role,'颜色');
});

test('explicit native materials and spoken lengths outrank ambiguous context, including later corrections',()=>{
 for(const [text,kind] of [['加几张图片，让人直观看到产品实际的样子','photo'],['我画一下布局，排版想法用文字不容易说清','sketch'],['上传参考文件，需要相关资料','document'],['简短的演讲，控制在两分钟','duration'],['a short speech, 10-minute presentation','duration'],['a short speech, two minutes','duration']] as const){
   const draft=editDemoText(newDemoDraft(),text);
   assert(!draft.controls?.some(c=>c.kind===kind&&c.origin==='recommended'),text);
   assert(demoNativeParameters(draft).some(c=>c.kind===kind),text);
 }
 for(const text of ['建议使用演示设计专家','推荐用飞书里的资料','我建议输出PDF','I suggest Arial'])assert.equal(recommendControls(text)[0].origin,'explicit',text);
 for(const text of ['expertise','skilled','storefront','a concise presentation','简洁的演示','简短的演讲，控制在半小时','写一份简短的演讲稿','a short speech script','keep it lukewarm'])assert.equal(recommendControls(text).length,0,text);
 let draft=editDemoText(newDemoDraft(),'参考内置产品介绍。');
 draft=editDemoText(draft,'第二页参考内置产品介绍。');assert.equal(draft.materials[0].scope,'第二页');
});

test('user product launch presentation sample prompt exposes all expected explicit and recommended chips',()=>{
 const text='我想做一个简短的演示文稿，介绍今年的要发布的产品。背景用灰色，字体用黑色，主题色用红色。我有一些本地文档作为大纲参考，还有老板的写的一些重点我扫描给你，另外要添加一些产品照片。布局我画一下，左边是今年产品总览，右边是分产品的介绍。然后整体视觉风格参考我这个截屏的。';
 const draft=editDemoText(newDemoDraft(),text);
 const controls=draft.controls||[];
 const native=draft.parameters;
 assert.equal(controls.find(c=>c.kind==='duration')?.value[0],'10');
 assert.deepEqual(controls.find(c=>c.kind==='skills')?.value,['ppt-implement']);
 assert.deepEqual(controls.find(c=>c.kind==='expert')?.value,['ppt']);
 assert.equal(controls.find(c=>c.kind==='scanner')?.origin,'explicit');
 assert.equal(controls.find(c=>c.kind==='capture')?.origin,'explicit');
 assert.equal(native.filter(p=>p.kind==='color').length,3);
 assert.equal(native.find(p=>p.kind==='document')?.phrase,'本地文档');
 assert.equal(native.find(p=>p.kind==='photo')?.phrase,'产品照片');
 assert.equal(native.find(p=>p.kind==='sketch')?.phrase,'我画一下');

 const spoken='我想做一个简短的演示文稿介绍今年要发布的产品佩景吗用灰色然后字体用黑色主题色是用红色的然后我有一些本地文档作为大纲参考';
 const spokenDraft=editDemoText(newDemoDraft(),spoken);
 assert.equal(spokenDraft.parameters.filter(p=>p.kind==='color').length,3);
 assert.equal(spokenDraft.parameters.find(p=>p.kind==='document')?.phrase,'本地文档');
});
