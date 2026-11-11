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

test('standalone polish uses server credentials, registered actions and protected text without generation',async()=>{
 const original=globalThis.fetch, oldKey=process.env.GOOGLE_API_KEY;
 process.env.GOOGLE_API_KEY='test-only-polish-credential';
 let calls=0,fail=false;
 globalThis.fetch=(async(url:any,init:any)=>{
  if(!String(url).startsWith('https://generativelanguage.googleapis.com/'))return original(url,init);
  calls++;assert.equal(init.headers['x-goog-api-key'],'test-only-polish-credential');
  const body=JSON.parse(init.body),prompt=body.contents[0].parts[0].text;
  assert.ok(!prompt.includes('主题色用红色'));
  assert.ok(!body.generationConfig.responseModalities);
  if(fail)return new Response('',{status:429});
  const text=JSON.parse(prompt.split('Text (JSON encoded): ')[1]).replace('重点说明','着重说明');
  return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text}]}}]}));
 }) as typeof fetch;
 const server=createServer((req,res)=>workbuddyDemoMiddleware(req,res,()=>res.end()));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${(server.address() as {port:number}).port}/api/workbuddy-demo/polish`;
 const body={id:crypto.randomUUID(),owner:'draft-a',text:'请帮我整理一个完整的产品发布方案，重点说明目标用户的价值，主题色用红色。',selection:{start:0,end:0},action:'task-points'};
 const post=(data:any,headers={})=>original(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(data)});
 try{
  const response=await post(body),data=await response.json() as any;
  assert.equal(response.status,200);assert.match(data.text,/着重说明/);assert.match(data.text,/主题色用红色/);assert.equal(data.id,body.id);
  assert.ok(!JSON.stringify(data).includes('credential'));
  assert.equal((await post(body)).status,400);
  assert.equal((await post({...body,id:'unknown-action',action:'execute'})).status,400);
  assert.equal((await post({...body,id:'cross-origin'},{origin:'https://untrusted.example'})).status,400);
  assert.equal(calls,1);
  fail=true;assert.equal((await post({...body,id:'failed'})).status,400);
 }finally{
  globalThis.fetch=original;
  if(oldKey===undefined)delete process.env.GOOGLE_API_KEY;else process.env.GOOGLE_API_KEY=oldKey;
  server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));
 }
});

// Exercise emitted ESM with plain Node, without tsx's extension resolution.
test("hosted API dependency graph loads in plain Node ESM", async () => {
  const ts = await import("typescript");
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const { tmpdir } = await import("node:os");
  const { pathToFileURL } = await import("node:url");
  const { execFileSync } = await import("node:child_process");
  const root = process.cwd(), output = await fs.mkdtemp(path.join(tmpdir(), "xiaoyi-esm-"));
  const visited = new Set<string>();
  async function emit(source: string) {
    if (visited.has(source)) return;
    visited.add(source);
    const code = ts.transpileModule(await fs.readFile(source, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    }).outputText;
    const dest = path.join(output, path.relative(root, source)).replace(/\.ts$/, ".js");
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, code);
    for (const item of ts.preProcessFile(code, true, true).importedFiles) {
      if (!item.fileName.startsWith(".")) continue;
      const resolved = ts.resolveModuleName(item.fileName, source, { moduleResolution: ts.ModuleResolutionKind.Bundler }, ts.sys).resolvedModule;
      assert.ok(resolved, item.fileName);
      await emit(resolved.resolvedFileName);
    }
  }
  try {
    await fs.writeFile(path.join(output, "package.json"), '{"type":"module"}');
    await emit(path.join(root, "api/workbuddy-demo/[action].ts"));
    const env = { ...process.env };
    delete env.NODE_OPTIONS;
    const url = pathToFileURL(path.join(output, "api/workbuddy-demo/[action].js")).href;
    execFileSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(url)})`], { env, stdio: "pipe" });
  } finally { await fs.rm(output, { recursive: true, force: true }); }
});
