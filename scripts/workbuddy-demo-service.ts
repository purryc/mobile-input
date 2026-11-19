import { polishDemo, validateDemoPolish, type DemoPolishInput } from "../packages/core/workbuddy-demo-polish.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import { readFile, unlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateDemo,
  validateDemoGeneration,
  type DemoModels,
  type DemoGenerationInput,
} from "../packages/core/workbuddy-demo-generation.js";

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
let activeCaptureChild: ReturnType<typeof execFile> | null = null;

/**
 * Builds the JXA (JavaScript for Automation) Cocoa script that renders an
 * always-on-top macOS floating capture bar at the top center of the screen.
 * Because `hidesOnDeactivate` is false and `level` is `NSStatusWindowLevel`,
 * the bar remains visible when switching between any Chrome tabs or desktop apps.
 * @param initialMode Initial capture mode ("screenshot" | "recording").
 * @param isEn Whether to render English labels.
 */
function buildMacFloatingCaptureBarJxa(
  initialMode: "screenshot" | "recording",
  isEn: boolean,
): string {
  return `
ObjC.import("Cocoa");
ObjC.import("stdlib");

let mode = ${JSON.stringify(initialMode)};
const isEn = ${JSON.stringify(isEn)};

function finish(msg) {
  $.NSFileHandle.fileHandleWithStandardOutput.writeData(
    $(msg + "\\n").dataUsingEncoding($.NSUTF8StringEncoding)
  );
  $.exit(0);
}

const app = $.NSApplication.sharedApplication;
app.setActivationPolicy($.NSApplicationActivationPolicyAccessory);

const screen = $.NSScreen.mainScreen.visibleFrame;
const w = 368, h = 50;
const x = screen.origin.x + (screen.size.width - w) / 2;
const y = screen.origin.y + screen.size.height - h - 12;

const panel = $.NSPanel.alloc.initWithContentRectStyleMaskBackingDefer(
  $.NSMakeRect(x, y, w, h),
  1 << 7,
  $.NSBackingStoreBuffered,
  false
);
panel.setFloatingPanel(true);
panel.setHidesOnDeactivate(false);
panel.setBecomesKeyOnlyIfNeeded(false);
panel.setLevel($.NSStatusWindowLevel);
panel.setCollectionBehavior((1 << 0) | (1 << 8) | (1 << 4));
panel.setOpaque(false);
panel.setBackgroundColor($.NSColor.clearColor);
panel.setHasShadow(true);
panel.setMovableByWindowBackground(true);

const root = panel.contentView;
const bgBox = $.NSBox.alloc.initWithFrame($.NSMakeRect(0, 0, w, h));
bgBox.setBoxType(4);
bgBox.setBorderType(1);
bgBox.setCornerRadius(25);
bgBox.setBorderWidth(1);
bgBox.setContentViewMargins($.NSMakeSize(0, 0));
bgBox.setFillColor($.NSColor.colorWithSRGBRedGreenBlueAlpha(0.98, 0.98, 1.0, 0.96));
bgBox.setBorderColor($.NSColor.colorWithSRGBRedGreenBlueAlpha(0.38, 0.40, 0.87, 0.28));
root.addSubview(bgBox);

function makePill(rx, ry, rw, rh, radius) {
  const b = $.NSBox.alloc.initWithFrame($.NSMakeRect(rx, ry, rw, rh));
  b.setBoxType(4);
  b.setBorderType(1);
  b.setCornerRadius(radius);
  b.setBorderWidth(1);
  b.setContentViewMargins($.NSMakeSize(0, 0));
  root.addSubview(b);
  return b;
}

function makeButton(rx, ry, rw, rh, title, actionName, handler) {
  const btn = $.NSButton.alloc.initWithFrame($.NSMakeRect(rx, ry, rw, rh));
  btn.setTitle(title);
  btn.setBordered(false);
  btn.setFont($.NSFont.systemFontOfSizeWeight(13, 0.23));
  btn.target = handler;
  btn.action = actionName;
  root.addSubview(btn);
  return btn;
}

const segBg = makePill(8, 7, 140, 36, 18);
segBg.setFillColor($.NSColor.colorWithSRGBRedGreenBlueAlpha(0.94, 0.95, 0.98, 1.0));
segBg.setBorderColor($.NSColor.colorWithSRGBRedGreenBlueAlpha(0.38, 0.40, 0.87, 0.12));

const snapPill = makePill(11, 10, 65, 30, 15);
const recPill = makePill(79, 10, 65, 30, 15);
const startPill = makePill(158, 8, 122, 34, 17);
startPill.setFillColor($.NSColor.colorWithSRGBRedGreenBlueAlpha(0.38, 0.40, 0.87, 1.0));
startPill.setBorderColor($.NSColor.colorWithSRGBRedGreenBlueAlpha(0.38, 0.40, 0.87, 1.0));

const cancelPill = makePill(288, 8, 72, 34, 17);
cancelPill.setFillColor($.NSColor.colorWithSRGBRedGreenBlueAlpha(0.95, 0.96, 0.98, 1.0));
cancelPill.setBorderColor($.NSColor.colorWithSRGBRedGreenBlueAlpha(0.09, 0.14, 0.19, 0.12));

let snapBtn, recBtn, startBtn;

function syncStyles() {
  const activeFill = $.NSColor.colorWithSRGBRedGreenBlueAlpha(0.38, 0.40, 0.87, 0.16);
  const activeBorder = $.NSColor.colorWithSRGBRedGreenBlueAlpha(0.38, 0.40, 0.87, 0.45);
  const clear = $.NSColor.clearColor;
  const activeText = $.NSColor.colorWithSRGBRedGreenBlueAlpha(0.29, 0.31, 0.78, 1.0);
  const idleText = $.NSColor.colorWithSRGBRedGreenBlueAlpha(0.25, 0.30, 0.38, 1.0);

  if (mode === "screenshot") {
    snapPill.setFillColor(activeFill);
    snapPill.setBorderColor(activeBorder);
    recPill.setFillColor(clear);
    recPill.setBorderColor(clear);
    if (snapBtn) snapBtn.setContentTintColor(activeText);
    if (recBtn) recBtn.setContentTintColor(idleText);
    if (startBtn) startBtn.setTitle(isEn ? "Capture" : "开始截屏");
  } else {
    recPill.setFillColor(activeFill);
    recPill.setBorderColor(activeBorder);
    snapPill.setFillColor(clear);
    snapPill.setBorderColor(clear);
    if (recBtn) recBtn.setContentTintColor(activeText);
    if (snapBtn) snapBtn.setContentTintColor(idleText);
    if (startBtn) startBtn.setTitle(isEn ? "Record" : "开始录屏");
  }
}

ObjC.registerSubclass({
  name: "XiaoyiCaptureHudController",
  methods: {
    "onSelectSnap:": {
      types: ["void", ["id"]],
      implementation: function() {
        mode = "screenshot";
        syncStyles();
      }
    },
    "onSelectRec:": {
      types: ["void", ["id"]],
      implementation: function() {
        mode = "recording";
        syncStyles();
      }
    },
    "onStart:": {
      types: ["void", ["id"]],
      implementation: function() {
        panel.orderOut(null);
        finish("START:" + mode);
      }
    },
    "onCancel:": {
      types: ["void", ["id"]],
      implementation: function() {
        panel.orderOut(null);
        finish("CANCEL");
      }
    }
  }
});

const handler = $.XiaoyiCaptureHudController.alloc.init;
snapBtn = makeButton(11, 10, 65, 30, isEn ? "Screenshot" : "截图", "onSelectSnap:", handler);
recBtn = makeButton(79, 10, 65, 30, isEn ? "Record" : "录屏", "onSelectRec:", handler);
startBtn = makeButton(158, 8, 122, 34, isEn ? "Capture" : "开始截屏", "onStart:", handler);
startBtn.setContentTintColor($.NSColor.whiteColor);
const cancelBtn = makeButton(288, 8, 72, 34, isEn ? "Cancel" : "取消", "onCancel:", handler);
cancelBtn.setContentTintColor($.NSColor.colorWithSRGBRedGreenBlueAlpha(0.22, 0.26, 0.33, 1.0));

syncStyles();
panel.makeKeyAndOrderFront(null);
panel.orderFrontRegardless;
app.run;
`;
}
export function workbuddyDemoMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  const path = new URL(req.url || "/", "http://localhost").pathname;
  if (!path.startsWith("/api/workbuddy-demo/")) {
    next();
    return;
  }
  return (async () => {
    const host = req.headers.host || "";
    const hosted = process.env.VERCEL === "1";
    const allowedHosts = [
      process.env.VERCEL_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ].filter(Boolean);
    const allowedHost = hosted
      ? allowedHosts.includes(host)
      : /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
    if (
      !allowedHost ||
      (req.headers.origin && new URL(req.headers.origin).host !== host)
    )
      throw Error("只允许当前演示页面同源访问");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method === "GET" && path === "/api/workbuddy-demo/status") {
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
    if (req.method === "POST" && path === "/api/workbuddy-demo/system-capture" && !hosted && process.platform === "darwin") {
      res.setHeader("Content-Type", "application/json");
      const reqChunks: Buffer[] = [];
      for await (const chunk of req) {
        reqChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      let payload: {
        mode?: "screenshot" | "recording";
        lang?: string;
        showTopBar?: boolean;
      } = {};
      try {
        const raw = Buffer.concat(reqChunks).toString("utf8").trim();
        if (raw) payload = JSON.parse(raw);
      } catch {
        // Ignore malformed optional body
      }

      if (activeCaptureChild) {
        try {
          activeCaptureChild.kill();
        } catch {
          // Ignore kill errors
        }
        activeCaptureChild = null;
      }

      const tmpPath = resolve(tmpdir(), `xiaoyi-snip-${crypto.randomUUID()}.png`);
      try {
        if (payload.showTopBar) {
          const jxa = buildMacFloatingCaptureBarJxa(
            payload.mode === "recording" ? "recording" : "screenshot",
            payload.lang === "en",
          );
          const barDecision = await new Promise<string>((resolveHud) => {
            const hudChild = execFile(
              "/usr/bin/osascript",
              ["-l", "JavaScript", "-e", jxa],
              (err, stdout) => {
                if (activeCaptureChild === hudChild) activeCaptureChild = null;
                if (err) {
                  resolveHud("CANCEL");
                  return;
                }
                resolveHud(String(stdout || "").trim() || "CANCEL");
              },
            );
            activeCaptureChild = hudChild;
            res.on("close", () => {
              if (!res.writableEnded) {
                try {
                  hudChild.kill();
                } catch {
                  // Ignore
                }
              }
            });
          });

          if (!barDecision.startsWith("START:")) {
            res.end(JSON.stringify({ ok: false, cancelled: true }));
            return;
          }
          const chosenMode = barDecision.split(":")[1];
          if (chosenMode === "recording") {
            res.end(JSON.stringify({ ok: true, action: "record" }));
            return;
          }
          await new Promise((r) => setTimeout(r, 120));
        }

        await new Promise<void>((resolveExec, rejectExec) => {
          const child = execFile("/usr/sbin/screencapture", ["-i", "-x", tmpPath], (err) => {
            if (activeCaptureChild === child) activeCaptureChild = null;
            if (err) rejectExec(err);
            else resolveExec();
          });
          activeCaptureChild = child;
          res.on("close", () => {
            if (!res.writableEnded) {
              try {
                child.kill();
              } catch {
                // Ignore
              }
            }
          });
        });
        const buf = await readFile(tmpPath).catch(() => null);
        await unlink(tmpPath).catch(() => {});
        if (!buf || buf.length === 0) {
          res.end(JSON.stringify({ ok: false, cancelled: true }));
          return;
        }
        res.end(
          JSON.stringify({
            ok: true,
            kind: "screenshot",
            mime: "image/png",
            data: buf.toString("base64"),
          }),
        );
      } catch {
        await unlink(tmpPath).catch(() => {});
        res.end(JSON.stringify({ ok: false, cancelled: true }));
      }
      return;
    }
    if (req.method !== "POST" || !["/api/workbuddy-demo/generate", "/api/workbuddy-demo/polish"].includes(path)) {
      res.statusCode = 404;
      res.end();
      return;
    }
    if (active >= 2) throw Error("已有两个任务正在生成，请稍后重试");
    // Vercel may supply an already parsed body; local Vite supplies the raw stream.
    const polishing = path.endsWith("/polish");
    const limit = polishing ? 100000 : hosted ? 4300000 : 35 * 1024 * 1024;
    const parsedBody = (req as IncomingMessage & { body?: unknown }).body;
    const chunks: Buffer[] = [];
    let size = 0;
    if (parsedBody !== undefined) {
      const data = Buffer.isBuffer(parsedBody)
        ? parsedBody
        : Buffer.from(
            typeof parsedBody === "string"
              ? parsedBody
              : JSON.stringify(parsedBody),
          );
      chunks.push(data);
      size = data.length;
    } else
      for await (const chunk of req) {
        size += chunk.length;
        if (size > limit)
          throw Error("材料过大，请减少后重试");
        chunks.push(chunk);
      }
    if (size > limit && polishing) throw Error("润色请求过大，请选择较短文字");
    if (hosted && size > 4300000)
      throw Error("线上版材料总量请控制在 3 MB 内；较大材料请使用本机版");
    let body: DemoGenerationInput;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString());
    } catch {
      throw Error("请求格式无效");
    }
    if (polishing) {
      if (active >= 2) throw Error("已有两个任务正在生成，请稍后重试");
      const input = body as unknown as DemoPolishInput;
      validateDemoPolish(input);
      if (requests.has('polish:' + input.id)) throw Error("该请求已提交；需要重新生成时请点击重试");
      active++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 90000);
      res.on("close", () => controller.abort());
      try {
        const result = await polishDemo(input, async (prompt, signal) => {
          requests.add('polish:' + input.id);
          if(requests.size>1000) requests.delete(requests.values().next().value!);
          const parts = await google([{text:prompt}], {maxOutputTokens:8192}, textModel, signal);
          return parts.map((p: {text?:string}) => p.text || '').join('');
        }, controller.signal);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(result));
      } catch (error) {
        if(controller.signal.aborted) throw Error("润色已取消或超时，原文已保留");
        const message=error instanceof Error?error.message:'';
        if(/（(?:401|403)）/.test(message)) throw Error("润色服务密钥或权限不可用，请检查服务器配置");
        if(message.includes('（429）')) throw Error("润色服务额度暂不可用，请稍后重试");
        if(/（\d+）/.test(message)||error instanceof TypeError) throw Error("润色连接失败，请检查网络后重试");
        throw error;
      } finally { clearTimeout(timer); active--; }
      return;
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
