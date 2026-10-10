import { test } from "node:test";
import assert from "node:assert/strict";
import { Store, initialState, totals, type Command } from "./model";
import { restoreWorkBuddy, wbDraftFor } from "./workbuddy";
const cmd = (type: string, value?: unknown): Command => ({
  id: crypto.randomUUID(),
  type,
  value,
});
const wb = () => {
  const s = new Store();
  s.dispatch(cmd("open", "workbuddy"));
  return s;
};
function focus(s: Store, id = "wb:draft:new") {
  assert.equal(s.dispatch(cmd("wb-focus", { id })).ok, true);
  const t = s.state.target!;
  return {
    app: "workbuddy" as const,
    targetId: t.id,
    targetRevision: t.revision,
  };
}
function submit(s: Store, text: string) {
  const a = focus(s, "wb:draft:" + s.state.workbuddy.task);
  const d = wbDraftFor(s.state, a.targetId)!;
  const c = { ...cmd("wb-submit", { text, revision: d.revision }), ...a };
  assert.equal(s.dispatch(c).ok, true);
  return c;
}
function finish(s: Store) {
  const t = s.state.workbuddy.tasks[0];
  t.startedAt = Date.now() - 1000;
  for (let i = 0; i < 3; i++)
    assert.equal(
      s.dispatch(cmd("wb-tick", { id: t.id, epoch: t.epoch })).ok,
      true,
    );
  return s.state.workbuddy.tasks[0];
}
test("WorkBuddy live edits are isolated, ordered, target locked and submit is atomic", () => {
  const s = wb(),
    a = focus(s);
  const oldAi = s.state.texts["ai-draft"];
  assert.equal(
    s.dispatch({
      ...cmd("wb-edit", {
        text: "草稿👨‍👩‍👧",
        revision: 0,
        session: "phone",
        sequence: 2,
      }),
      ...a,
    }).ok,
    true,
  );
  assert.equal(s.state.workbuddy.drafts.new.text, "草稿👨‍👩‍👧");
  assert.equal(s.state.workbuddy.tasks.length, 3);
  assert.equal(
    s.dispatch({
      ...cmd("wb-edit", {
        text: "过期",
        revision: 1,
        session: "phone",
        sequence: 1,
      }),
      ...a,
    }).ok,
    false,
  );
  const c = {
    ...cmd("wb-submit", { text: "生成客户需求简报", revision: 1 }),
    ...a,
  };
  s.dispatch(c);
  s.dispatch(c);
  assert.equal(s.state.workbuddy.tasks.length, 4);
  assert.equal(s.state.workbuddy.tasks[0].messages[0].text, "生成客户需求简报");
  assert.equal(s.state.workbuddy.drafts.new.text, "");
  assert.equal(s.state.texts["ai-draft"], oldAi);
  s.dispatch(cmd("wb-navigate", { page: "home" }));
  const b = focus(s);
  s.dispatch(cmd("wb-navigate", { page: "task", id: "sample-quote" }));
  assert.equal(
    s.dispatch({
      ...cmd("wb-edit", {
        text: "错误目标",
        revision: 2,
        sequence: 3,
        session: "phone",
      }),
      ...b,
    }).ok,
    false,
  );
});
test("default, plan, ask and unmapped requests have distinct truthful outcomes", () => {
  const s = wb();
  s.dispatch(cmd("wb-config", { key: "mode", value: "plan" }));
  submit(s, "生成销售汇报");
  assert.equal(s.state.workbuddy.tasks[0].status, "planned");
  const t = s.state.workbuddy.tasks[0];
  assert.equal(
    s.dispatch(cmd("wb-tick", { id: t.id, epoch: t.epoch })).ok,
    false,
  );
  s.dispatch(cmd("wb-task", { id: t.id, action: "confirm" }));
  assert.equal(finish(s).files.length, 1);
  s.dispatch(cmd("wb-navigate", { page: "home" }));
  s.dispatch(cmd("wb-config", { key: "mode", value: "ask" }));
  const before = s.state.workbuddy.files.length;
  submit(s, "请问采购预算");
  assert.equal(s.state.workbuddy.tasks[0].status, "complete");
  assert.equal(s.state.workbuddy.files.length, before);
  s.dispatch(cmd("wb-navigate", { page: "home" }));
  s.dispatch(cmd("wb-config", { key: "mode", value: "agent" }));
  submit(s, "帮我完成这件事");
  assert.equal(s.state.workbuddy.tasks[0].status, "needs-type");
  const unknown = s.state.workbuddy.tasks[0];
  assert.equal(
    s.dispatch(
      cmd("wb-task", { id: unknown.id, action: "type", kind: "unknown" }),
    ).ok,
    false,
  );
  s.dispatch(cmd("wb-task", { id: unknown.id, action: "type", kind: "brief" }));
  assert.equal(s.state.workbuddy.tasks[0].status, "running");
});
test("stop, background and restart invalidate execution epochs without replay", () => {
  const s = wb();
  submit(s, "整理采购报价");
  const t = s.state.workbuddy.tasks[0];
  const epoch = t.epoch;
  s.dispatch(cmd("wb-task", { id: t.id, action: "stop" }));
  assert.equal(s.dispatch(cmd("wb-tick", { id: t.id, epoch })).ok, false);
  s.dispatch(cmd("wb-task", { id: t.id, action: "continue" }));
  assert.equal(s.dispatch(cmd("wb-tick", { id: t.id, epoch })).ok, false);
  s.dispatch(cmd("release"));
  assert.equal(s.state.workbuddy.tasks[0].status, "paused");
  s.dispatch(cmd("wb-task", { id: t.id, action: "continue" }));
  restoreWorkBuddy(s.state, () => {});
  assert.equal(s.state.workbuddy.tasks[0].status, "paused");
  s.dispatch(cmd("wb-task", { id: t.id, action: "continue" }));
  s.dispatch(cmd("open", "wechat"));
  assert.equal(s.state.workbuddy.tasks[0].status, "paused");
  assert.equal(s.state.app, "wechat");
});
test("four sales result types create consistent versioned artifacts and real WPS files", () => {
  for (const [prompt, kind] of [
    ["整理客户需求简报", "markdown"],
    ["比较供应商采购报价", "sheet"],
    ["生成客户方案", "word"],
    ["生成六页销售汇报", "slides"],
  ]) {
    const s = wb();
    submit(s, prompt);
    const task = finish(s);
    const file = s.state.workbuddy.files.find((f) => f.id === task.files[0])!;
    assert.equal(file.kind, kind);
    assert.ok(file.content.includes("¥190,380.00"));
    assert.ok(/待.*?补充|待确认/.test(file.content) || kind === "slides");
    assert.equal(file.dataVersion, s.state.reportRevision);
    if (file.officeId) {
      const office = s.state.officeFiles.find((f) => f.id === file.officeId)!;
      assert.equal(office.kind, kind);
      if (office.products)
        assert.equal(totals(office.products).revenue, 190380);
      if (office.slides) assert.equal(office.slides.length, 6);
    }
  }
});
test("file edits preserve drafts, refresh does not erase authored text, back is hierarchical", () => {
  const s = wb();
  s.dispatch(cmd("wb-preview", { id: "sales-brief" }));
  const a = focus(s, "wb:file:sales-brief");
  assert.equal(
    s.dispatch({
      ...cmd("wb-edit", {
        text: "客户自写内容",
        revision: 0,
        session: "p",
        sequence: 1,
      }),
      ...a,
    }).ok,
    true,
  );
  assert.notEqual(s.state.workbuddy.files[0].content, "客户自写内容");
  assert.equal(
    s.dispatch({
      ...cmd("wb-submit", { text: "客户自写内容", revision: 1 }),
      ...a,
    }).ok,
    true,
  );
  assert.equal(s.state.workbuddy.files[0].content, "客户自写内容");
  assert.equal(
    s.dispatch(cmd("wb-file", { id: "sales-brief", action: "refresh" })).ok,
    false,
  );
  s.dispatch(cmd("back"));
  assert.equal(s.state.workbuddy.previewActive, null);
  assert.equal(s.state.app, "workbuddy");
  s.dispatch(cmd("wb-navigate", { page: "library" }));
  s.dispatch(cmd("back"));
  assert.equal(s.state.workbuddy.page, "home");
  s.dispatch(cmd("back"));
  assert.equal(s.state.app, "desktop");
});
test("upgrade backs up legacy shared draft before changing only WorkBuddy", () => {
  const s = initialState();
  s.app = "workbuddy";
  s.texts["ai-draft"] = "未发送旧草稿";
  const chats = structuredClone(s.chat),
    slides = structuredClone(s.slides);
  delete (s as Partial<typeof s>).workbuddy;
  const backups: string[] = [];
  restoreWorkBuddy(s, (key) => backups.push(key));
  assert.equal(s.workbuddy.drafts.new.text, "未发送旧草稿");
  assert.deepEqual(s.chat, chats);
  assert.deepEqual(s.slides, slides);
  restoreWorkBuddy(s, () => assert.fail("must migrate once"));
  assert.equal(backups.length, 1);
  const failure = initialState();
  delete (failure as Partial<typeof failure>).workbuddy;
  failure.texts["ai-draft"] = "保护内容";
  assert.throws(() =>
    restoreWorkBuddy(failure, () => {
      throw Error("storage full");
    }),
  );
  assert.equal(failure.workbuddy, undefined);
});
test("automation runs once per due date, validates fields, and never catches up missed times", () => {
  const s = wb();
  assert.equal(
    s.dispatch(
      cmd("wb-automation", {
        action: "save",
        name: "坏日期",
        prompt: "采购报价",
        time: "29:80",
        days: [],
      }),
    ).ok,
    false,
  );
  const now = new Date();
  const c = cmd("wb-automation", {
    action: "save",
    name: "今日简报",
    prompt: "生成客户需求简报",
    time: now.toTimeString().slice(0, 5),
    days: [now.getDay()],
    enabled: true,
  });
  s.dispatch(c);
  const a = s.state.workbuddy.automations.find((x) => x.id === c.id)!;
  const due = cmd("wb-automation", { id: a.id, action: "due" });
  assert.equal(s.dispatch(due).ok, true);
  s.dispatch(due);
  assert.equal(s.state.workbuddy.automations.at(-1)!.records.length, 1);
  assert.equal(
    s.dispatch(cmd("wb-automation", { id: a.id, action: "due" })).ok,
    false,
  );
  s.state.workbuddy.automations[0].time = "00:00";
  assert.equal(
    s.dispatch(cmd("wb-automation", { id: "weekly", action: "due" })).ok,
    false,
  );
});
test("catalog installs, mock configurations and menu order persist with validation", () => {
  const s = wb();
  const c = cmd("wb-project", {
    action: "create",
    name: "新客户",
    instructions: "需求待确认",
  });
  s.dispatch(c);
  s.dispatch(c);
  assert.equal(s.state.workbuddy.projects.length, 2);
  s.dispatch(cmd("wb-skill", { id: "deep-research" }));
  assert.ok(s.state.workbuddy.installed.includes("deep-research"));
  s.dispatch(cmd("wb-skill", { id: "deep-research", remove: true }));
  assert.ok(!s.state.workbuddy.installed.includes("deep-research"));
  assert.equal(
    s.dispatch(cmd("wb-connector", { id: "made-up", enabled: true })).ok,
    false,
  );
  s.dispatch(
    cmd("wb-connector", { id: "feishu", enabled: true, workspace: "新客户" }),
  );
  assert.equal(s.state.workbuddy.connectors.feishu.enabled, true);
  assert.equal(
    s.dispatch(cmd("wb-config", { key: "menu", value: ["projects", "home"] }))
      .ok,
    false,
  );
  s.dispatch(cmd("wb-expert", { id: "procurement", action: "summon" }));
  submit(s, "整理采购报价");
  assert.equal(s.state.workbuddy.tasks[0].expert, "procurement");
});
test("the eighth app participates in cyclic switching without changing WPS launch", () => {
  const s = new Store();
  s.dispatch(cmd("open", "mario"));
  const step = cmd("switch-step");
  s.dispatch(step);
  s.dispatch(cmd("switch-commit", { epoch: step.id }));
  assert.equal(s.state.app, "workbuddy");
  assert.equal(s.state.workbuddy.page, "home");
  const next = cmd("switch-step");
  s.dispatch(next);
  s.dispatch(cmd("switch-commit", { epoch: next.id }));
  assert.equal(s.state.app, "mail");
});

test('summoning preserves draft, form saves are local, and authored Word text reaches WPS',()=>{
 const s=wb();const a=focus(s);s.dispatch({...cmd('wb-edit',{text:'未发送的需求',revision:0,session:'tablet',sequence:1}),...a});
 s.dispatch(cmd('wb-expert',{id:'team-sales',action:'summon'}));assert.equal(s.state.workbuddy.drafts.new.text,'未发送的需求');
 const mail=cmd('wb-mail-draft',{recipient:'lin.yue@example.com',subject:'采购方案',body:'请确认安装地址。'});s.dispatch(mail);s.dispatch(mail);assert.equal(s.state.workbuddy.mailDrafts.length,1);assert.equal(s.state.workbuddy.mailDrafts[0].recipient,'lin.yue@example.com');assert.equal(s.state.mails.filter(m=>m.subject==='采购方案').length,0);
 submit(s,'生成客户方案');const task=finish(s);const f=s.state.workbuddy.files.find(x=>x.id===task.files[0])!;const b=focus(s,'wb:file:'+f.id);s.dispatch({...cmd('wb-submit',{text:'# 客户方案\n\n客户补充了安装地址。',revision:0}),...b});assert.deepEqual(s.state.officeFiles.find(x=>x.id===f.officeId)!.paragraphs,['客户方案','客户补充了安装地址。']);
});
