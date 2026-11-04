import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { workbuddyDemoMiddleware } from "./workbuddy-demo-service";

test("loopback service calls real-shaped Google contracts, streams outputs, rejects duplicates/origins, aborts on disconnect", async () => {
  const originalFetch = globalThis.fetch,
    previousKey = process.env.GOOGLE_API_KEY;
  process.env.GOOGLE_API_KEY = "test-only-not-a-credential";
  const requests: any[] = [];
  let hold = false,
    aborted = false,
    googleStarted!: () => void;
  const started = new Promise<void>((resolve) => (googleStarted = resolve));
  globalThis.fetch = (async (input: any, init: any) => {
    if (!String(input).startsWith("https://generativelanguage.googleapis.com/"))
      return originalFetch(input, init);
    const request = JSON.parse(init.body);
    requests.push(request);
    assert.equal(init.headers["x-goog-api-key"], "test-only-not-a-credential");
    if (hold) {
      googleStarted();
      await new Promise((_resolve, reject) =>
        init.signal.addEventListener(
          "abort",
          () => {
            aborted = true;
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        ),
      );
    }
    let parts: any[];
    if (request.generationConfig.responseSchema?.properties.outputs)
      parts = [
        {
          text: JSON.stringify({
            outputs: [
              {
                kind: "document",
                title: "测试文档",
                instruction: "只用虚构材料",
              },
              { kind: "image", title: "测试图片", instruction: "画虚构物体" },
            ],
          }),
        },
      ];
    else if (request.generationConfig.responseModalities)
      parts = [
        {
          thought: true,
          inlineData: { mimeType: "image/png", data: "ignored" },
        },
        { inlineData: { mimeType: "image/png", data: "YWJj" } },
      ];
    else parts = [{ text: JSON.stringify({ markdown: "# 测试\n\n虚构文本" }) }];
    return new Response(
      JSON.stringify({
        candidates: [{ finishReason: "STOP", content: { parts } }],
      }),
      { headers: { "content-type": "application/json" } },
    );
  }) as typeof fetch;
  const server = createServer((req, res) =>
    workbuddyDemoMiddleware(req, res, () => {
      res.statusCode = 404;
      res.end();
    }),
  );
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number },
    url = `http://127.0.0.1:${address.port}`;
  const body = {
    id: crypto.randomUUID(),
    text: "生成虚构文档和图片",
    parameters: [],
    sources: [],
  };
  const post = (data = body, extra = {}) =>
    originalFetch(url + "/api/workbuddy-demo/generate?action=generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
      ...extra,
    });
  try {
    const status = (await (
      await originalFetch(url + "/api/workbuddy-demo/status?action=status")
    ).json()) as any;
    assert.equal(status.configured, true);
    assert.equal(JSON.stringify(status).includes("test-only"), false);
    const response = await post();
    assert.match(response.headers.get("content-type")!, /ndjson/);
    const events = (await response.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    assert.equal(events.at(-1).done, true);
    assert.deepEqual(
      events.filter((e) => e.artifact).map((e) => e.artifact.kind),
      ["document", "image"],
    );
    assert.equal(
      events.find((e) => e.artifact?.kind === "image").artifact.data,
      "YWJj",
    );
    assert.deepEqual(requests.at(-1).generationConfig.responseModalities, [
      "TEXT",
      "IMAGE",
    ]);
    assert.equal((await post()).status, 400);
    assert.equal(
      (
        await post(
          { ...body, id: crypto.randomUUID() },
          { headers: { origin: "https://untrusted.example" } },
        )
      ).status,
      400,
    );
    assert.equal(requests.length, 3);
    hold = true;
    const controller = new AbortController();
    const pending = post(
      { ...body, id: crypto.randomUUID() },
      { signal: controller.signal },
    )
      .then((r) => r.text())
      .catch(() => "aborted");
    await started;
    controller.abort();
    await pending;
    for (let i = 0; i < 50 && !aborted; i++)
      await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(aborted, true);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.GOOGLE_API_KEY;
    else process.env.GOOGLE_API_KEY = previousKey;
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
