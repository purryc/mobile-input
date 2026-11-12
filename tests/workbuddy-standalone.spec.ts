import { test, expect, type Page } from "@playwright/test";
// Input regressions never contact a paid model. Output flows have their own fixtures below.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/workbuddy-demo/generate", (route) =>
    route.fulfill({
      contentType: "application/x-ndjson",
      body: JSON.stringify({ error: "测试环境：生成服务未配置" }) + "\n",
    }),
  );
});
const prompt =
  "参考产品资料，主题色用红色，背景用灰色，字体用黑色，讲五分钟，加产品图片，布局我画一下。";
async function open(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("textbox", { name: "小艺Work 任务输入", exact: true }),
  ).toBeVisible();
}
const editor = (page: Page) =>
  page.getByRole("textbox", { name: "小艺Work 任务输入", exact: true });
async function mockSpeech(page: Page) {
  await page.addInitScript(() => {
    const engines: any[] = [];
    (window as any).__speech = engines;
    (window as any).SpeechRecognition = (
      window as any
    ).webkitSpeechRecognition = class {
      onstart: any;
      onresult: any;
      onend: any;
      onerror: any;
      aborted = false;
      constructor() {
        engines.push(this);
      }
      start() {
        this.onstart?.();
      }
      stop() {
        this.onend?.();
      }
      abort() {
        this.aborted = true;
      }
      emit(...text: string[]) {
        this.onresult?.({
          results: text.map((transcript, i) => ({
            isFinal: i < text.length - 1,
            0: { transcript },
          })),
        });
      }
    };
  });
}
async function emit(page: Page, ...text: string[]) {
  await page.evaluate(
    (words) => (window as any).__speech.at(-1).emit(...words),
    text,
  );
}
const image = {
  name: "product.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    "base64",
  ),
};
test("standalone entry renders all parameter types without bridge or model requests", async ({
  page,
}) => {
  const requests: string[] = [],
    sockets: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  page.on("websocket", (s) => sockets.push(s.url()));
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await editor(page).fill(prompt);
  for (const kind of ["document", "color", "duration", "photo", "sketch"])
    await expect(
      page.locator(`.sentence-token[data-kind=${kind}]`).first(),
    ).toBeVisible();
  await expect(page.locator(".live-wb-aux")).toHaveCount(0);
  await expect(page.locator(".sentence-token[data-kind=color]")).toHaveCount(3);
  expect(
    requests.filter((url) =>
      /\/api\/|5189|5191|runtime\.ts|mac-link/.test(url),
    ),
  ).toEqual([]);
  expect(sockets.filter((url) => !url.includes(":5298"))).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "artifacts/workbuddy-demo/evidence/desktop-parameters.png",
  });
});
test("browser speech adapter receives progressive/revised transcripts and stops before chip edits", async ({
  page,
}) => {
  await mockSpeech(page);
  await open(page);
  await page.getByRole("button", { name: "开始语音输入", exact: true }).click();
  await emit(page, "主题色用红");
  await emit(page, "主题色用红色，", "讲五分钟");
  await expect(page.locator(".sentence-token[data-kind=color]")).toHaveCount(1);
  await expect(page.locator(".sentence-token[data-kind=duration]")).toHaveCount(
    1,
  );
  await emit(page, "主题色用蓝色，讲六分钟");
  await expect(editor(page)).toHaveAttribute(
    "data-value",
    "主题色用蓝色，讲六分钟",
  );
  await page.locator(".sentence-token[data-kind=color]").click();
  await expect(
    page.getByRole("button", { name: "开始语音输入", exact: true }),
  ).toBeVisible();
  const hex = page.getByRole("textbox", { name: "主题色 HEX", exact: true });
  await hex.fill("#123456");
  await hex.blur();
  await page.getByRole("button", { name: "完成颜色选择" }).click();
  await editor(page).press("End");
  await editor(page).press("ArrowRight");
  await editor(page).press("ControlOrMeta+End");
  await editor(page).pressSequentially("，产品图片");
  await expect(editor(page)).toContainText("#123456");
  await page.getByRole("button", { name: "发送请求", exact: true }).click();
  await expect(page.getByRole("region", { name: "发送的请求" })).toContainText(
    "#123456",
  );
});
test("photos remain pending through close, switching and refresh; confirmed chip stays actionable", async ({
  page,
}) => {
  await open(page);
  await editor(page).fill("加入产品图片。");
  await page.locator(".sentence-token[data-kind=photo]").click();
  await expect(page.getByRole("button", { name: "确认图片选择" })).toHaveCount(
    0,
  );
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "选择图片", exact: true }).click();
  await (await chooser).setFiles(image);
  await expect(
    page.getByRole("button", { name: "确认图片选择" }),
  ).toBeVisible();
  await expect(page.getByLabel("已确认的材料")).toHaveCount(0);
  await page.getByRole("button", { name: "关闭辅助输入" }).click();
  await page.getByRole("button", { name: "新建演示", exact: true }).click();
  await expect(editor(page)).toHaveAttribute("data-value", "");
  await page
    .getByRole("navigation", { name: "演示草稿" })
    .getByRole("button")
    .filter({ hasText: "加入产品图片" })
    .click();
  await expect(page.getByLabel("保存状态")).toHaveText("保存在这台电脑");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "1 张图片待确认" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "发送请求", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("图片未确认");
  await page.getByRole("button", { name: "确认图片选择" }).click();
  await expect(page.getByLabel("已确认的材料")).toBeVisible();
  await expect(page.locator(".sentence-token[data-kind=photo]")).toBeVisible();
  await page.getByRole("button", { name: "发送请求", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "发送的请求" }).getByRole("link"),
  ).toContainText("product.png");
  await page.locator(".sentence-token[data-kind=photo]").click();
  await page
    .locator(".live-wb-aux")
    .getByRole("button", { name: "移除 product.png", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "确认图片选择" })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("region", { name: "发送的请求" }).getByRole("link"),
  ).toContainText("product.png");
  await expect(page.getByLabel("保存状态")).toHaveText("保存在这台电脑");
  await page.reload();
  await expect(
    page.getByRole("region", { name: "发送的请求" }).getByRole("link"),
  ).toContainText("product.png");
});
test("sketch coordinates, undo, confirmation, documents and stored snapshots", async ({
  page,
}) => {
  await open(page);
  await editor(page).fill(prompt);
  await page.locator(".sentence-token[data-kind=sketch]").click();
  const canvas = page.getByLabel("布局画板"),
    bounds = (await canvas.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width * 0.2,
    bounds.y + bounds.height * 0.2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * 0.8,
    bounds.y + bounds.height * 0.8,
    { steps: 5 },
  );
  await page.mouse.up();
  await expect(canvas.locator("polyline")).toHaveCount(1);
  const points = await canvas.locator("polyline").getAttribute("points");
  const [x, y] = points!.split(" ")[0].split(",").map(Number);
  expect(Math.abs(x - 65.6)).toBeLessThan(1.5);
  expect(Math.abs(y - 38.4)).toBeLessThan(1.5);
  await page.getByRole("button", { name: "撤销笔迹" }).click();
  await expect(canvas.locator("polyline")).toHaveCount(0);
  await page.mouse.move(bounds.x + 25, bounds.y + 25);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 125, bounds.y + 75, { steps: 5 });
  await page.mouse.up();
  await page.getByRole("button", { name: "关闭辅助输入" }).click();
  await page.getByRole("button", { name: "发送请求", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("草图未确认");
  await page.getByRole("button", { name: "采用布局草图" }).click();
  await expect(page.getByLabel("已确认的材料")).toContainText("布局草图.png");
  await page.locator(".sentence-token[data-kind=document]").click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "添加参考资料" }).click();
  await (
    await chooser
  ).setFiles({
    name: "brief.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Fictional product brief"),
  });
  await page.getByRole("button", { name: "关闭辅助输入" }).click();
  await page.getByRole("button", { name: "发送请求", exact: true }).click();
  const result = page.getByRole("region", { name: "发送的请求" });
  await expect(result).toContainText("brief.txt");
  await expect(result).toContainText("布局草图.png");
  await editor(page).fill("全新请求");
  await expect(result).toContainText("#C92A2A");
  await expect(page.getByLabel("保存状态")).toHaveText("保存在这台电脑");
  await page.reload();
  await expect(editor(page)).toHaveAttribute("data-value", "全新请求");
  await expect(result).toContainText("brief.txt");
});
test("speech errors retain text and late events never target a new draft", async ({
  page,
}) => {
  await mockSpeech(page);
  await open(page);
  await page.getByRole("button", { name: "开始语音输入", exact: true }).click();
  await emit(page, "保留这句话");
  await page.evaluate(() => {
    const old = (window as any).__speech.at(-1);
    (window as any).__late = old.onresult;
    old.onerror({ error: "network" });
  });
  await expect(page.getByRole("alert")).toContainText("语音连接中断");
  await expect(editor(page)).toHaveAttribute("data-value", "保留这句话");
  await page.getByRole("button", { name: "新建演示", exact: true }).click();
  await page.evaluate(() =>
    (window as any).__late({
      results: [{ isFinal: true, 0: { transcript: "不该出现" } }],
    }),
  );
  await expect(editor(page)).toHaveAttribute("data-value", "");
  await page.getByRole("button", { name: "开始语音输入", exact: true }).click();
  await page.evaluate(() =>
    (window as any).__speech.at(-1).onerror({ error: "not-allowed" }),
  );
  await expect(page.getByRole("alert")).toContainText("麦克风权限");
  await expect(
    page.getByRole("button", { name: "开始语音输入", exact: true }),
  ).toBeVisible();
});
test("clear is isolated; negative recognition and tablet-sized layout remain usable", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() =>
    localStorage.setItem("mobile-input-state-v1", "keep-original"),
  );
  await editor(page).fill("不要图片，不用布局，不要主题色用红色。图表和画图。");
  await expect(page.locator(".sentence-token")).toHaveCount(0);
  await editor(page).fill(prompt);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.locator(".sentence-token[data-kind=color]").first().click();
  await expect(
    page.getByRole("button", { name: "完成颜色选择" }),
  ).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "发送请求", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: "artifacts/workbuddy-demo/evidence/tablet-color.png",
  });
  await page.getByRole("button", { name: "清理演示", exact: true }).click();
  await page.getByRole("button", { name: "清理演示数据" }).click();
  await expect(editor(page)).toHaveAttribute("data-value", "");
  expect(
    await page.evaluate(() => localStorage.getItem("mobile-input-state-v1")),
  ).toBe("keep-original");
});

test("two voice toggles append correctly; typing cancels late speech and hidden pages release capture", async ({
  page,
}) => {
  await mockSpeech(page);
  await open(page);
  await page.getByRole("button", { name: "开始语音输入", exact: true }).click();
  await emit(page, "第一句。");
  await page.getByRole("button", { name: "停止语音输入", exact: true }).click();
  await page.getByRole("button", { name: "开始语音输入", exact: true }).click();
  await emit(page, "第二句。");
  await page.getByRole("button", { name: "停止语音输入", exact: true }).click();
  await expect(editor(page)).toHaveAttribute("data-value", "第一句。第二句。");
  await page.getByRole("button", { name: "开始语音输入", exact: true }).click();
  await emit(page, "第三句");
  await page.evaluate(() => {
    (window as any).__late = (window as any).__speech.at(-1).onresult;
  });
  await editor(page).click();
  await editor(page).fill("人工编辑");
  await page.evaluate(() =>
    (window as any).__late({
      results: [{ isFinal: true, 0: { transcript: "错误覆盖" } }],
    }),
  );
  await expect(editor(page)).toHaveAttribute("data-value", "人工编辑");
  await page.getByRole("button", { name: "开始语音输入", exact: true }).click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("button", { name: "开始语音输入", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => (window as any).__speech.at(-1).aborted),
  ).toBe(true);
});
test("camera permission failure preserves pending photos and allows local selection", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("Denied", "NotAllowedError"));
  });
  await open(page);
  await editor(page).fill("加产品图片");
  await page.locator(".sentence-token[data-kind=photo]").click();
  await page.getByRole("button", { name: "拍摄", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("无法打开摄像头");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "选择图片", exact: true }),
  ).toBeVisible();
});
test("camera capture stays pending, persists and releases video tracks", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).__cameraStops = 0;
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#79a78e";
      ctx.fillRect(0, 0, 320, 240);
      const stream = canvas.captureStream(10);
      const timer = setInterval(() => ctx.fillRect(0, 0, 320, 240), 80);
      for (const track of stream.getTracks()) {
        const stop = track.stop.bind(track);
        track.stop = () => {
          (window as any).__cameraStops++;
          clearInterval(timer);
          stop();
        };
      }
      return stream;
    };
  });
  await open(page);
  await editor(page).fill("加产品图片");
  await page.locator(".sentence-token[data-kind=photo]").click();
  await page.getByRole("button", { name: "拍摄", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "拍摄图片" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "拍摄", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "1 张图片待确认" }),
  ).toBeVisible();
  expect(await page.evaluate(() => (window as any).__cameraStops)).toBe(1);
  await page.getByRole("button", { name: "确认图片选择" }).click();
  await expect(page.getByLabel("保存状态")).toHaveText("保存在这台电脑");
  await page.reload();
  await expect(page.getByLabel("已确认的材料")).toContainText("拍摄图片.jpg");
});

test("final speech correction cannot open an obsolete provisional widget", async ({
  page,
}) => {
  await mockSpeech(page);
  await open(page);
  await page.getByRole("button", { name: "开始语音输入", exact: true }).click();
  await emit(page, "主题色用红色");
  await page.evaluate(() => {
    const engine = (window as any).__speech.at(-1);
    engine.stop = () => {
      engine.emit("不要主题色用红色");
      engine.onend?.();
    };
  });
  await page.locator(".sentence-token[data-kind=color]").click();
  await expect(editor(page)).toHaveAttribute("data-value", "不要主题色用红色");
  await expect(page.locator(".live-wb-aux")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "开始语音输入", exact: true }),
  ).toBeVisible();
});

test("tablet shell and icon-only microphone; each chip toggles its own anchored widget", async ({
  page,
}) => {
  await open(page);
  await expect(
    page.getByRole("heading", { name: "轻松工作，就用小艺Work" }),
  ).toBeVisible();
  await expect(page.locator(".wb-sidebar")).toBeVisible();
  await expect(page.locator(".wb-modes, .wb-home-suggestions")).toHaveCount(0);
  await expect(page.locator(".wb-scenes button")).toHaveCount(3);
  const mic = page.getByRole("button", { name: "开始语音输入", exact: true });
  await expect(mic).toHaveText("");
  const voiceBox = (await mic.boundingBox())!;
  expect(voiceBox.width).toBe(40);
  expect(voiceBox.height).toBe(40);
  expect(
    await page
      .locator(".demo-add>button")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgba(0, 0, 0, 0)");
  await editor(page).fill(
    "背景呢用灰色字体呢用黑色主题色呢是用红色需要参考一个我的一个本地的文件",
  );
  const chips = page.locator(".sentence-token[data-kind=color]");
  await expect(chips).toHaveCount(3);
  const first = chips.first();
  await first.click();
  await expect(first).toHaveAttribute("aria-expanded", "true");
  const popup = page.locator(".demo-widget-wrap");
  await expect(popup).toHaveAttribute("id", /.+/);
  await expect(first).toHaveAttribute("aria-controls", (await popup.getAttribute("id"))!);
  await expect(popup).toBeVisible();
  async function aligned() {
    const chip = (await first.locator(".sentence-token-face").boundingBox())!,
      box = (await popup.boundingBox())!;
    expect(Math.abs(box.x - chip.x)).toBeLessThan(1);
    expect(Math.abs(box.y - (chip.y + chip.height + 8))).toBeLessThan(1);
  }
  await expect
    .poll(async () => {
      const chip = await first.boundingBox(),
        box = await popup.boundingBox();
      return !!chip && !!box && Math.abs(box.x - chip.x) < 1;
    })
    .toBe(true);
  await aligned();
  await first.click();
  await expect(popup).toHaveCount(0);
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await chips.nth(1).click();
  await expect(popup).toHaveCount(1);
  await expect(page.getByText("文字颜色", { exact: true })).toBeVisible();
  await first.click();
  await expect(popup).toHaveCount(1);
  await expect(page.getByText("背景颜色", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect
    .poll(async () => {
      const chip = (await first.locator(".sentence-token-face").boundingBox())!,
        box = (await popup.boundingBox())!;
      return (
        Math.abs(box.x - chip.x) < 1 &&
        Math.abs(box.y - chip.y - chip.height - 8) < 1
      );
    })
    .toBe(true);
  await page.locator(".wb-home").evaluate((el) => (el.scrollTop += 60));
  await expect
    .poll(async () => {
      const chip = (await first.locator(".sentence-token-face").boundingBox())!,
        box = (await popup.boundingBox())!;
      return Math.abs(box.y - chip.y - chip.height - 8) < 1;
    })
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(popup).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.locator(".wb-home").evaluate((el) => (el.scrollTop = 0));
  await first.click();
  await page.screenshot({
    path: "artifacts/workbuddy-demo/evidence/chip-anchored-color.png",
  });
});

test("existing saved ASR draft reparses colors without losing materials or source text", async ({
  page,
}) => {
  await open(page);
  const text =
    "我想做一个11分钟的演讲稿可以请呢用灰色字体呢用黑色主题色呢是用红色需要参考一个我的一个本地的文件然后还想添加一些产品照片我会画一下";
  await editor(page).fill(text);
  await expect(page.getByLabel("保存状态")).toHaveText("保存在这台电脑");
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("workbuddy-standalone-demo-v1");
      request.onsuccess = () => {
        const db = request.result,
          tx = db.transaction("state", "readwrite"),
          store = tx.objectStore("state"),
          read = store.get("current");
        read.onsuccess = () => {
          const state = read.result,
            draft = state.drafts.find((d: any) => d.id === state.active);
          draft.parameters = [];
          draft.pendingPhotos = [
            {
              id: "retained-photo",
              name: "保留图片.png",
              kind: "photo",
              scope: "全文",
              blob: new Blob(["test bytes"], { type: "image/png" }),
              size: 10,
            },
          ];
          store.put(state, "current");
        };
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
  await page.reload();
  await expect(editor(page)).toHaveAttribute("data-value", text);
  await expect(page.locator(".sentence-token[data-kind=color]")).toHaveCount(3);
  await expect(page.locator(".sentence-token[data-kind=document]")).toHaveText(
    "本地的文件",
  );
  await expect(
    page.getByRole("button", { name: "1 张图片待确认" }),
  ).toBeVisible();
});

test("black font and generic black chips open neutral palettes and keep independent roles", async ({
  page,
}) => {
  await open(page);
  await editor(page).fill("主题色是用红色，字体适用黑色的微软雅黑");
  const chips = page.locator(".sentence-token[data-kind=color]");
  await expect(chips).toHaveCount(2);
  await chips.last().click();
  await expect(
    page.getByRole("button", { name: "字体 #000000", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("slider", { name: "连续调色", exact: true }),
  ).toHaveCSS(
    "background-image",
    "linear-gradient(90deg, rgb(255, 255, 255), rgb(0, 0, 0))",
  );
  await page.getByRole("button", { name: "字体 #000000", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "字体 HEX" })).toHaveValue(
    "#000000",
  );
  await page.getByRole("button", { name: "关闭辅助输入" }).click();
  await chips.first().click();
  await expect(
    page.getByRole("button", { name: "主题色 #C92A2A", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "关闭辅助输入" }).click();
  await editor(page).fill("用黑色");
  await page.locator(".sentence-token[data-kind=color]").click();
  await expect(
    page.getByRole("button", { name: "颜色 #000000", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/workbuddy-demo/evidence/black-color-picker.png",
  });
});

test('top-right language settings preserve content, isolate preferences and use English speech/widgets', async ({page}) => {
  await mockSpeech(page);
  await page.addInitScript(()=>localStorage.setItem('input-agent:ui-language','zh-CN'));
  await open(page);
  await editor(page).fill('保留这段文字。');
  await page.getByRole('button',{name:'设置',exact:true}).click();
  await page.getByRole('combobox',{name:'界面与语音语言'}).selectOption('en');
  await expect(page.getByRole('heading',{name:"Work made easy with Xiaoyi Work"})).toBeVisible();
  await page.getByRole('button',{name:'Close settings'}).click();
  const input=page.getByRole('textbox',{name:'Xiaoyi Work task input',exact:true});
  await expect(input).toContainText('保留这段文字。');
  expect(await page.evaluate(()=>localStorage.getItem('input-agent:ui-language'))).toBe('zh-CN');
  await input.fill('Create a five-minute presentation. Use a red theme, a gray background and black text. Attach my product document, add product photos, and sketch the layout.');
  for(const kind of ['color','duration','document','photo','sketch'])await expect(page.locator(`.sentence-token[data-kind=${kind}]`).first()).toBeVisible();
  await page.locator('.sentence-token[data-kind=photo]').click();
  await expect(page.getByRole('button',{name:'Choose images',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close input tool'}).click();
  await input.fill('');
  await page.getByRole('button',{name:'Start voice input'}).click();
  expect(await page.evaluate(()=>(window as any).__speech.at(-1).lang)).toBe('en-US');
  await emit(page,'Use a red theme');
  await emit(page,'Use a blue theme, add product photos');
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByRole('combobox',{name:'Interface and speech language'}).selectOption('zh-CN');
  await emit(page,'Late callback must be ignored');
  await expect(editor(page)).toContainText('blue');
  await expect(editor(page)).not.toContainText('Late callback');
  await page.getByRole('combobox',{name:'界面与语音语言'}).selectOption('en');
  await page.getByRole('button',{name:'Close settings'}).click();
  await expect(page.getByRole('status',{name:'Save status'})).toHaveText('Saved on this computer');
  await page.reload();
  await expect(input).toContainText('blue');
  await expect(page.getByRole('button',{name:'Settings',exact:true})).toBeVisible();
  await page.screenshot({path:'artifacts/workbuddy-demo/evidence/english-desktop.png'});
  await page.setViewportSize({width:1024,height:768});
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Interface and speech language'})).toBeVisible();
  await page.screenshot({path:'artifacts/workbuddy-demo/evidence/english-tablet.png'});
});
