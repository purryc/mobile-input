import test from "node:test";
import assert from "node:assert/strict";
import {
  BrowserDictation,
  type RecognitionEngine,
  type RecognitionEvent,
} from "./workbuddy-demo-speech";
import {
  newDemoState,
  editDemoText,
  demoSendError,
  snapshotDemoRequest,
} from "./workbuddy-demo-state";
class Engine implements RecognitionEngine {
  lang = "";
  continuous = false;
  interimResults = false;
  onstart: (() => void) | null = null;
  onresult: ((event: RecognitionEvent) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  aborted = false;
  start() {
    this.onstart?.();
  }
  stop() {
    this.onend?.();
  }
  abort() {
    this.aborted = true;
  }
  emit(...words: string[]) {
    this.onresult?.({
      results: words.map((transcript, i) => ({
        isFinal: i < words.length - 1,
        0: { transcript },
      })),
    });
  }
}
function fixture() {
  const engines: Engine[] = [],
    words: string[] = [],
    phases: string[] = [],
    errors: string[] = [];
  const speech = new BrowserDictation(
    () => {
      const engine = new Engine();
      engines.push(engine);
      return engine;
    },
    {
      text: (t) => words.push(t),
      phase: (p) => phases.push(p),
      error: (e) => errors.push(e),
    },
  );
  return { speech, engines, words, phases, errors };
}
test("speech replaces cumulative interim results without duplication and handles shrinking results", async () => {
  const f = fixture();
  f.speech.start();
  const e = f.engines[0];
  e.emit("主题色用红");
  e.emit("主题色用红色，", "讲五");
  e.emit("主题色用蓝色，");
  e.emit("主题色用蓝色，", "讲五分钟");
  assert.deepEqual(f.words, [
    "主题色用红",
    "主题色用红色，讲五",
    "主题色用蓝色，",
    "主题色用蓝色，讲五分钟",
  ]);
  await f.speech.stop();
  assert.equal(f.phases.at(-1), "idle");
  assert.deepEqual(f.errors, []);
  assert.equal(e.lang, "zh-CN");
  assert.ok(e.continuous && e.interimResults);
});
test("natural end resumes same session, stale previous-engine callbacks are ignored", async () => {
  const f = fixture();
  f.speech.start();
  const old = f.engines[0],
    stale = old.onresult!;
  old.emit("第一句。");
  old.onend?.();
  await new Promise((r) => setTimeout(r, 210));
  assert.equal(f.engines.length, 2);
  stale({ results: [{ isFinal: true, 0: { transcript: "迟到" } }] });
  f.engines[1].emit("第二句");
  assert.equal(f.words.at(-1), "第一句。第二句");
  await f.speech.stop();
});
test("cancel invalidates callbacks, preserves latest text and permits next toggle", () => {
  const f = fixture();
  f.speech.start();
  const e = f.engines[0],
    late = e.onresult!;
  e.emit("保留");
  f.speech.cancel();
  late({ results: [{ isFinal: true, 0: { transcript: "覆盖" } }] });
  assert.equal(f.words.at(-1), "保留");
  assert.ok(e.aborted);
  f.speech.start();
  f.engines[1].emit("新会话");
  assert.equal(f.words.at(-1), "新会话");
  f.speech.cancel();
});
test("permission and network failures release capture without retry loops", () => {
  for (const code of ["not-allowed", "network"]) {
    const f = fixture();
    f.speech.start();
    f.engines[0].emit("已有内容");
    f.engines[0].onerror?.({ error: code });
    assert.equal(f.phases.at(-1), "idle");
    assert.equal(f.words.at(-1), "已有内容");
    assert.equal(f.engines.length, 1);
    assert.equal(f.errors.length, 1);
    assert.ok(f.engines[0].aborted);
  }
});
test("stop timeout releases an unresponsive recognition engine", async () => {
  const f = fixture();
  f.speech.start();
  const e = f.engines[0];
  e.stop = () => {};
  await f.speech.stop();
  assert.equal(f.phases.at(-1), "idle");
  assert.ok(e.aborted);
});
test("five shared parameter kinds, manual priority and negative requests", () => {
  let d = editDemoText(
    newDemoState().drafts[0],
    "参考产品资料，主题色用红色，背景用灰色，讲五分钟，加产品图片，布局我画一下。",
  );
  assert.deepEqual(
    new Set(d.parameters.map((p) => p.kind)),
    new Set(["document", "color", "duration", "photo", "sketch"]),
  );
  d = {
    ...d,
    parameters: d.parameters.map((p) =>
      p.role === "主题色"
        ? { ...p, manual: true, value: "#123456", label: "#123456" }
        : p,
    ),
  };
  d = editDemoText(d, d.text + "重点介绍性能。");
  assert.equal(d.parameters.find((p) => p.role === "主题色")?.value, "#123456");
  assert.equal(
    editDemoText(d, "不要图片，不用布局，不要背景用红色，图表和画图。")
      .parameters.length,
    0,
  );
});
test("pending materials block send; snapshots preserve bytes and parameters after edits", async () => {
  let d = editDemoText(
    newDemoState().drafts[0],
    "主题色用红色，讲五分钟，产品图片。",
  );
  const material = {
    id: "m",
    name: "产品.png",
    kind: "photo" as const,
    scope: "全文",
    blob: new Blob(["bytes"], { type: "image/png" }),
    size: 5,
  };
  d = { ...d, pendingPhotos: [material] };
  assert.match(demoSendError(d), /图片未确认/);
  assert.throws(() => snapshotDemoRequest(d));
  d = {
    ...d,
    pendingPhotos: [],
    materials: [material],
    sketches: {
      全文: [
        [
          [0, 0],
          [1, 1],
        ],
      ],
    },
  };
  assert.match(demoSendError(d), /草图未确认/);
  d = { ...d, sketches: {} };
  const request = snapshotDemoRequest(d);
  assert.match(request.text, /#C92A2A/);
  assert.match(request.text, /5分钟/);
  d.parameters[0].value = "#000000";
  d.materials = [];
  assert.equal(request.parameters[0].value, "#C92A2A");
  assert.equal(await request.materials[0].blob.text(), "bytes");
});

test("unpunctuated colloquial ASR keeps independent colors and minimal document spans", () => {
  const text =
    "哈啰哈啰哈啰我想做一个11分钟的演讲稿可以请呢用灰色字体呢用黑色主题色呢是用红色需要参考一个我的一个本地的文件然后还想添加一些产品照片不取那我会画一下";
  const d = editDemoText(newDemoState().drafts[0], text);
  assert.deepEqual(
    d.parameters
      .filter((p) => p.kind === "color")
      .map((p) => [p.role, p.value]),
    [
      ["颜色", "#D9DEDF"],
      ["字体", "#182431"],
      ["主题色", "#C92A2A"],
    ],
  );
  // Without an actual 背景 role, the explicit color stays generic; no role is invented.
  assert.equal(
    d.parameters.find((p) => p.kind === "document")?.phrase,
    "本地的文件",
  );
  for (const p of d.parameters)
    assert.equal(text.slice(p.start, p.end), p.phrase);
  const explicit = editDemoText(
    d,
    "背景呢用灰色字体呢用黑色主题色呢是用红色需要参考一个我的一个本地的文件",
  );
  assert.deepEqual(
    explicit.parameters
      .filter((p) => p.kind === "color")
      .map((p) => [p.role, p.value]),
    [
      ["背景", "#D9DEDF"],
      ["字体", "#182431"],
      ["主题色", "#C92A2A"],
    ],
  );
  assert.equal(
    explicit.parameters.find((p) => p.kind === "document")?.phrase,
    "本地的文件",
  );
  assert.equal(
    editDemoText(
      d,
      "不要背景呢用灰色，不要字体呢用黑色，不要主题色呢是用红色。",
    ).parameters.length,
    0,
  );
  assert.equal(
    editDemoText(
      d,
      "主题呢用红利，背景呢用一个文件，字体呢用于资料。",
    ).parameters.filter((p) => p.kind === "color").length,
    0,
  );
});
