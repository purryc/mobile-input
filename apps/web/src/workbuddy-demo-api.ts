import type { DemoRequest } from "../../../packages/core/workbuddy-demo-state";
import type {
  DemoGenerationEvent,
  DemoGenerationInput,
} from "../../../packages/core/workbuddy-demo-generation";
import { validateDemoGeneration } from "../../../packages/core/workbuddy-demo-generation";

function base64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(Error("材料读取失败，请重新选择"));
    reader.readAsDataURL(blob);
  });
}
export async function runDemoGeneration(
  request: DemoRequest,
  signal: AbortSignal,
  onEvent: (event: DemoGenerationEvent) => void,
) {
  if(request.captures?.some(c=>c.kind==='recording'))throw Error("录像已保存在请求快照中；当前生成服务不处理视频，请移除录像后发送新的请求。 / Video saved in request; generation does not process videos.");
  if (request.materials.length > 12)
    throw Error("最多使用 12 份材料，请减少后重试");
  if (request.materials.some((m) => m.blob.size > 8 * 1024 * 1024))
    throw Error("单份材料最多 8 MB，请压缩后重新选择");
  if (
    request.materials.reduce((size, m) => size + m.blob.size, 0) >
    24 * 1024 * 1024
  )
    throw Error("总材料超过 24 MB，请减少后重试");
  const sources = await Promise.all(
    request.materials.map(async (m) => ({
      asset: {
        // Legacy built-in references keep their owner-bound storage ID. The
        // existing generation API requires UUID asset IDs; normalize only here.
        id: /^reference-example-([a-f0-9-]{36})$/.exec(m.id)?.[1] || m.id,
        name: m.name,
        mime:
          m.blob.type ||
          (/\.md$/i.test(m.name)
            ? "text/markdown"
            : /\.txt$/i.test(m.name)
              ? "text/plain"
              : ""),
        size: m.blob.size,
        kind: m.kind,
        scope: m.scope || "全文",
        strokes: m.strokes,
      },
      base64: await base64(m.blob),
    })),
  );
  const input: DemoGenerationInput = {
    id: request.id,
    text: request.text,
    parameters: request.parameters,
    sources,
  };
  validateDemoGeneration(input);
  signal.throwIfAborted();
  const payload = JSON.stringify(input);
  const hosted = !["localhost", "127.0.0.1", "[::1]"].includes(
    location.hostname,
  );
  if (hosted && new Blob([payload]).size > 4300000)
    throw Error("线上版材料总量请控制在 3 MB 内；较大材料请使用本机版");
  const response = await fetch("/api/workbuddy-demo/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    signal,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw Error(body?.error || "生成服务未连接，请重新启动演示后重试");
  }
  if (
    !response.body ||
    !response.headers.get("content-type")?.includes("application/x-ndjson")
  )
    throw Error("生成服务不可用，请通过演示启动命令打开");
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "",
    done = false;
  const consume = (line: string) => {
    if (!line.trim()) return;
    signal.throwIfAborted();
    const event = JSON.parse(line) as DemoGenerationEvent;
    if ("error" in event) throw Error(event.error);
    if ("done" in event) done = true;
    onEvent(event);
  };
  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      let split: number;
      while ((split = buffer.indexOf("\n")) >= 0) {
        consume(buffer.slice(0, split));
        buffer = buffer.slice(split + 1);
      }
      if (buffer.length > 36 * 1024 * 1024)
        throw Error("生成结果过大，请减少内容后重试");
      if (chunk.done) break;
    }
    consume(buffer);
    if (!done) throw Error("连接中断，已保留收到的成果。请重试");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
