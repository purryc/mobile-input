import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateDemo,
  validateDemoGeneration,
  type DemoModels,
  type DemoGenerationInput,
} from "../packages/core/workbuddy-demo-generation";

const keyFile =
  process.env.WORKBUDDY_DEMO_KEY_FILE ||
  resolve(
    fileURLToPath(new URL("..", import.meta.url)),
    "artifacts/workbuddy-demo/google-api-key",
  );
const textModel = process.env.INPUT_AGENT_DECK_MODEL || "gemini-3.8-flash";
const imageModel =
  process.env.WORKBUDDY_DEMO_IMAGE_MODEL || "gemini-3.1-flash-image";
async function credential() {
  return process.env.GOOGLE_API_KEY || (await readFile(keyFile, "utf8")).trim();
}
async function google(
  parts: unknown[],
  config: object,
  model: string,
  signal: AbortSignal,
) {
  let key: string;
  try {
    key = await credential();
  } catch {
    throw Error("尚未配置生成服务，请设置 GOOGLE_API_KEY 后重新启动演示");
  }
  if (!key) throw Error("生成服务密钥为空，请配置后重试");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: config,
      }),
      signal,
    },
  );
  if (!response.ok)
    throw Error(
      `生成服务请求失败（${response.status}），请检查模型权限、配额或稍后重试`,
    );
  const data: any = await response.json();
  const candidate = data.candidates?.[0];
  if (candidate?.finishReason !== "STOP")
    throw Error("生成未完整结束，请调整请求或减少材料后重试");
  return candidate.content?.parts?.filter((p: any) => !p.thought) || [];
}
const models: DemoModels = {
  text: Object.assign(
    async (parts: unknown[], schema: unknown, signal: AbortSignal) => {
      const result = await google(
        parts,
        {
          responseMimeType: "application/json",
          responseSchema: schema,
          maxOutputTokens: 16384,
        },
        textModel,
        signal,
      );
      try {
        return JSON.parse(
          result
            .filter((p: any) => p.text)
            .map((p: any) => p.text)
            .join(""),
        );
      } catch {
        throw Error("模型返回的内容不完整，请重试");
      }
    },
    { model: textModel },
  ),
  imageName: imageModel,
  image: async (parts, signal) => {
    const result = await google(
      parts,
      { responseModalities: ["TEXT", "IMAGE"] },
      imageModel,
      signal,
    );
    const image = result.find((p: any) =>
      p.inlineData?.mimeType?.startsWith("image/"),
    )?.inlineData;
    if (!image) throw Error("模型未生成图片，请调整描述后重试");
    return { mime: image.mimeType, data: image.data };
  },
};
const requests = new Set<string>();
let active = 0;
export function workbuddyDemoMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  if (!req.url?.startsWith("/api/workbuddy-demo/")) {
    next();
    return;
  }
  void (async () => {
    const host = req.headers.host || "";
    if (
      !/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ||
      (req.headers.origin && new URL(req.headers.origin).host !== host)
    )
      throw Error("只允许本机演示页面访问");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method === "GET" && req.url === "/api/workbuddy-demo/status") {
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          configured: await credential().then(Boolean, () => false),
          textModel,
          imageModel,
        }),
      );
      return;
    }
    if (req.method !== "POST" || req.url !== "/api/workbuddy-demo/generate") {
      res.statusCode = 404;
      res.end();
      return;
    }
    if (active >= 2) throw Error("已有两个任务正在生成，请稍后重试");
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 35 * 1024 * 1024) throw Error("材料过大，请减少后重试");
      chunks.push(chunk);
    }
    let body: DemoGenerationInput;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      throw Error("请求格式无效");
    }
    validateDemoGeneration(body);
    for (const source of body.sources)
      source.text = source.asset.mime.startsWith("text/")
        ? Buffer.from(source.base64, "base64").toString("utf8")
        : undefined;
    if (active >= 2) throw Error("已有两个任务正在生成，请稍后重试");
    if (requests.has(body.id))
      throw Error("该请求已提交；需要重新生成时请点击重试");
    requests.add(body.id);
    if (requests.size > 1000) requests.delete(requests.values().next().value!);
    active++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 240000);
    res.on("close", () => controller.abort());
    res.setHeader("Content-Type", "application/x-ndjson");
    const emit = (event: unknown) => {
      if (!res.destroyed) res.write(JSON.stringify(event) + "\n");
    };
    try {
      await generateDemo(body, models, controller.signal, emit);
    } catch (e) {
      emit({
        error: controller.signal.aborted
          ? "生成已停止或超时，输入已保留，可重试"
          : e instanceof Error
            ? e.message
            : "生成失败，请重试",
      });
    } finally {
      active--;
      clearTimeout(timer);
      res.end();
    }
  })().catch((e) => {
    if (!res.headersSent) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
    }
    res.end(
      JSON.stringify({ error: e instanceof Error ? e.message : "请求失败" }),
    );
  });
}
