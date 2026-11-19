import test from "node:test";
import assert from "node:assert/strict";
import {
  generateDemo,
  validateDemoGeneration,
  type DemoModels,
  type DemoGenerationInput,
  type DemoGenerationEvent,
} from "./workbuddy-demo-generation";
import { resolveLiveParameters } from "./live-workbuddy";
const body = (
  text = "制作两页演示和一份文档及一张海报",
): DemoGenerationInput => ({
  id: crypto.randomUUID(),
  text,
  parameters: [],
  sources: [],
});
const page = {
  label: "封面",
  title: "测试成果",
  body: "测试正文",
  notes: "讲稿",
  layout: "cover",
  photoIds: [],
  background: "#FFFFFF",
  primary: "#146C64",
  textColor: "#222222",
};
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
function models(kinds = ["slides", "document", "image"]): DemoModels {
  return {
    text: Object.assign(
      async (_parts: unknown[], schema: any) =>
        schema.properties.outputs
          ? {
              outputs: kinds.map((kind) => ({
                kind,
                title: "测试" + kind,
                instruction: "按用户要求",
              })),
            }
          : schema.properties.markdown
            ? { markdown: "# 文档\n\n正文" }
            : {
                title: "测试成果",
                pages: [page, { ...page, label: "结尾", title: "结尾" }],
              },
      { model: "test-text" },
    ),
    imageName: "test-image",
    image: async () => ({ mime: "image/png", data: png }),
  };
}
test("standalone generation emits actual typed artifacts and completion, using shared slide color projection", async () => {
  const input = body("主题色用红色，做两页演示和文档及图片");
  input.parameters = resolveLiveParameters(input.text, []);
  const events: DemoGenerationEvent[] = [];
  await generateDemo(input, models(), new AbortController().signal, (e) =>
    events.push(e),
  );
  const artifacts = events.flatMap((e) =>
    "artifact" in e ? [e.artifact] : [],
  );
  assert.deepEqual(
    artifacts.map((a) => a.kind),
    ["slides", "document", "image"],
  );
  assert.equal(
    artifacts[0].kind === "slides" && artifacts[0].deck.pages[0].primary,
    "#C92A2A",
  );
  assert.equal(artifacts[2].model, "test-image");
  assert.deepEqual(events.at(-1), { done: true });
});
test("a document-only request does not run image or slide generation", async () => {
  const model = models(["document"]);
  model.image = async () => {
    throw Error("must not be called");
  };
  const events: DemoGenerationEvent[] = [];
  await generateDemo(
    body("写一份方案，参考产品照片"),
    model,
    new AbortController().signal,
    (e) => events.push(e),
  );
  assert.equal(events.filter((e) => "artifact" in e).length, 1);
  assert.equal(
    events.some((e) => "artifact" in e && e.artifact.kind === "document"),
    true,
  );
});
test("stop suppresses late model results and completion", async () => {
  const control = new AbortController(),
    model = models(["image"]),
    events: DemoGenerationEvent[] = [];
  model.image = async () => {
    control.abort();
    return { mime: "image/png", data: png };
  };
  await assert.rejects(
    generateDemo(body(), model, control.signal, (e) => events.push(e)),
    { name: "AbortError" },
  );
  assert.equal(
    events.some((e) => "artifact" in e || "done" in e),
    false,
  );
});
test("partial outputs survive later image failure, with no fake done event", async () => {
  const model = models(["document", "image"]),
    events: DemoGenerationEvent[] = [];
  model.image = async () => {
    throw Error("image quota");
  };
  await assert.rejects(
    generateDemo(body(), model, new AbortController().signal, (e) =>
      events.push(e),
    ),
    /quota/,
  );
  assert.equal(events.filter((e) => "artifact" in e).length, 1);
  assert.equal(
    events.some((e) => "done" in e),
    false,
  );
});
test("invalid plans, unsupported materials, mismatched bytes and duplicated assets fail closed", async () => {
  const input = body();
  input.sources = [
    {
      asset: {
        id: crypto.randomUUID(),
        name: "a.txt",
        kind: "document",
        scope: "全文",
        mime: "text/plain",
        size: 3,
      },
      base64: "YWJj",
    },
  ];
  assert.doesNotThrow(() => validateDemoGeneration(input));
  input.sources[0].asset.size = 4;
  assert.throws(() => validateDemoGeneration(input), /材料/);
  input.sources[0].asset.size = 3;
  input.sources.push(input.sources[0]);
  assert.throws(() => validateDemoGeneration(input), /材料/);
  await assert.rejects(
    generateDemo(
      body(),
      models(["slides", "slides"]),
      new AbortController().signal,
      () => {},
    ),
    /成果类型/,
  );
  const model = models(["document"]);
  model.text = async () => ({
    outputs: [{ kind: "execute", title: "x", instruction: "" }],
  });
  await assert.rejects(
    generateDemo(body(), model, new AbortController().signal, () => {}),
    /成果类型/,
  );
});
