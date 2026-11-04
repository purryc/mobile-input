import { test, expect, type Page, type Route } from "@playwright/test";
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
const editor = (page: Page) =>
  page.getByRole("textbox", { name: "WorkBuddy 任务输入", exact: true });
const send = (page: Page) =>
  page.getByRole("button", { name: "发送请求", exact: true }).click();
function artifacts(body: any) {
  return [
    {
      id: "slides-result",
      title: "产品发布演示",
      kind: "slides",
      model: "mock-text",
      deck: {
        schemaVersion: 1,
        id: "deck",
        title: "产品发布演示",
        assets: body.sources.map((s: any) => s.asset),
        input: { text: body.text, parameters: body.parameters },
        layoutNotes: "",
        model: "mock-text",
        pages: ["新品亮相", "产品价值"].map((title, i) => ({
          id: "page-" + i,
          label: i ? "产品价值" : "封面",
          title,
          body: "虚构产品，为团队节省时间。",
          notes: "讲稿 " + i,
          layout: "cover",
          background: "#FFFFFF",
          primary: "#146C64",
          textColor: "#222222",
          photoIds: [],
          imageFit: "contain",
        })),
      },
    },
    {
      id: "document-result",
      title: "发布方案",
      kind: "document",
      model: "mock-text",
      markdown:
        "# 发布方案\n\n这是虚构产品的方案。\n\n## 下一步\n\n准备发布材料。",
    },
    {
      id: "image-result",
      title: "发布海报",
      kind: "image",
      model: "mock-image",
      mime: "image/png",
      data: png,
    },
  ];
}
async function result(route: Route, kinds = ["slides", "document", "image"]) {
  const body = route.request().postDataJSON();
  await route.fulfill({
    contentType: "application/x-ndjson",
    body:
      [
        { stage: "生成内容" },
        ...artifacts(body)
          .filter((a) => kinds.includes(a.kind))
          .map((artifact) => ({ artifact })),
        { done: true },
      ]
        .map((e) => JSON.stringify(e))
        .join("\n") + "\n",
  });
}
test("Send opens tablet task/results layout; slides, document and image edit, undo, playback, download and refresh", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/workbuddy-demo/generate", async (route) => {
    calls++;
    await result(route);
  });
  await page.goto("/");
  await editor(page).fill(
    "制作两页产品发布 PPT、一份发布方案和一张海报，主题色用绿色。",
  );
  await send(page);
  await expect(page.locator(".wb-task-layout")).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: "打开 发布海报" }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "成果预览", exact: true }),
  ).toBeVisible();
  await expect(editor(page)).toHaveAttribute("data-value", /制作两页/);
  const title = page.getByRole("textbox", {
    name: "网页幻灯片标题",
    exact: true,
  });
  await title.fill("新的产品标题");
  await title.blur();
  await expect(title).toHaveText("新的产品标题");
  await page.getByRole("button", { name: "撤销成果编辑" }).click();
  await expect(title).toHaveText("新品亮相");
  await page.getByRole("button", { name: "重做成果编辑" }).click();
  await expect(title).toHaveText("新的产品标题");
  await page.getByRole("button", { name: "页面设置", exact: true }).click();
  await page.getByRole("combobox", { name: "页面布局" }).selectOption("cards");
  await page.getByRole("button", { name: "放映", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "演示文稿放映" }),
  ).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("dialog")).toContainText("产品价值");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const htmlDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载成果" }).click();
  expect((await htmlDownload).suggestedFilename()).toMatch(/\.html$/);
  await page.getByRole("tab", { name: "发布方案", exact: true }).click();
  await page.getByRole("button", { name: "编辑 Markdown" }).click();
  await page
    .getByRole("textbox", { name: "Markdown 源文档" })
    .fill("# 修改后的方案\n\n这是编辑后的内容。");
  const mdDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载成果" }).click();
  expect((await mdDownload).suggestedFilename()).toMatch(/\.md$/);
  await page.getByRole("tab", { name: "发布海报", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "发布海报", exact: true }),
  ).toBeVisible();
  const imageDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载成果" }).click();
  expect((await imageDownload).suggestedFilename()).toMatch(/\.png$/);
  await page.getByRole("tab", { name: "产品发布演示", exact: true }).click();
  await page.screenshot({
    path: "artifacts/workbuddy-demo/evidence/generated-desktop.png",
  });
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.getByRole("button", { name: "下载成果" })).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "开始语音输入", exact: true }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/workbuddy-demo/evidence/generated-tablet.png",
  });
  // The accepted chip still toggles below itself in the task composer.
  await page.locator(".sentence-token[data-kind=color]").click();
  await expect(
    page.getByRole("button", { name: "完成颜色选择" }),
  ).toBeInViewport();
  const chip = (await page.locator(".sentence-token-face").boundingBox())!,
    widget = (await page.locator(".demo-widget-wrap").boundingBox())!;
  expect(Math.abs(widget.y - chip.y - chip.height - 8)).toBeLessThan(2);
  await page.getByRole("button", { name: "关闭辅助输入" }).click();
  await expect(page.getByLabel("保存状态")).toHaveText("保存在这台电脑");
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "网页幻灯片标题", exact: true }),
  ).toHaveText("新的产品标题");
  await page.getByRole("tab", { name: "发布方案", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "成果预览", exact: true }),
  ).toContainText("修改后的方案");
  expect(calls).toBe(1);
});
test("running results remain with original draft, Stop suppresses late result, retry is explicit", async ({
  page,
}) => {
  let release!: () => void,
    calls = 0;
  const delayed = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/workbuddy-demo/generate", async (route) => {
    calls++;
    if (calls === 1) await delayed;
    await result(route, ["document"]).catch(() => {});
  });
  await page.goto("/");
  await editor(page).fill("写一份原任务文档");
  await send(page);
  await expect(page.getByRole("button", { name: "停止生成" })).toBeVisible();
  await page.getByRole("button", { name: "新建演示", exact: true }).click();
  await editor(page).fill("另一个草稿");
  release();
  await expect(
    page.getByRole("complementary", { name: "成果预览", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "演示草稿" })
    .getByRole("button", { name: /写一份原任务文档/ })
    .click();
  await expect(
    page.getByRole("button", { name: "打开 发布方案" }),
  ).toBeVisible();
  expect(calls).toBe(1);
  await page.route("**/api/workbuddy-demo/generate", async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await result(route, ["image"]).catch(() => {});
  });
  await editor(page).fill("生成一张图片");
  await send(page);
  await page.getByRole("button", { name: "停止生成" }).click();
  await expect(page.getByRole("alert")).toContainText("生成已停止");
  await expect(page.getByRole("button", { name: "重试生成" })).toBeVisible();
  await page.waitForTimeout(950);
  await expect(page.getByRole("button", { name: "打开 发布海报" })).toHaveCount(
    0,
  );
  await page.route("**/api/workbuddy-demo/generate", (route) =>
    result(route, ["image"]),
  );
  await page.getByRole("button", { name: "重试生成" }).click();
  await expect(
    page.getByRole("button", { name: "打开 发布海报" }),
  ).toBeVisible();
  await expect(editor(page)).toHaveAttribute("data-value", "生成一张图片");
});
test("failure, partial success and interrupted refresh retain materials, outputs and original request without replay", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/workbuddy-demo/generate", async (route) => {
    calls++;
    const [artifact] = artifacts(route.request().postDataJSON()).filter(
      (a) => a.kind === "document",
    );
    await route.fulfill({
      contentType: "application/x-ndjson",
      body:
        JSON.stringify({ artifact }) +
        "\n" +
        JSON.stringify({ error: "图片生成配额不足，请重试" }) +
        "\n",
    });
  });
  await page.goto("/");
  await editor(page).fill("写方案并生成海报");
  await send(page);
  await expect(page.getByRole("alert")).toContainText("配额不足");
  await expect(
    page.getByRole("button", { name: "打开 发布方案" }),
  ).toBeVisible();
  await editor(page).fill("还没发送的修改");
  await expect(page.getByRole("region", { name: "发送的请求" })).toContainText(
    "写方案并生成海报",
  );
  await expect(page.getByLabel("保存状态")).toHaveText("保存在这台电脑");
  await page.reload();
  await expect(page.getByRole("alert")).toContainText("配额不足");
  expect(calls).toBe(1);
  await page.route("**/api/workbuddy-demo/generate", async (route) => {
    calls++;
    await new Promise((r) => setTimeout(r, 2000));
    await route.abort().catch(() => {});
  });
  await send(page);
  await expect(page.getByRole("button", { name: "停止生成" })).toBeVisible();
  await expect(page.getByLabel("保存状态")).toHaveText("保存在这台电脑");
  await expect.poll(() => calls).toBe(2);
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "上次生成已中断" }),
  ).toBeVisible();
  expect(calls).toBe(2);
  await expect(editor(page)).toHaveAttribute("data-value", "还没发送的修改");
});
test("unsupported attachments fail before network submission and can be removed from retained draft", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/workbuddy-demo/generate", async (route) => {
    calls++;
    await result(route, ["document"]);
  });
  await page.goto("/");
  await editor(page).fill("参考本地文件写一份方案");
  await page.locator(".sentence-token[data-kind=document]").click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "添加参考资料" }).click();
  await (
    await chooser
  ).setFiles({
    name: "unsupported.docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from("fictional unsupported file"),
  });
  await page.getByRole("button", { name: "关闭辅助输入" }).click();
  await send(page);
  await expect(page.getByRole("alert")).toContainText("支持 PDF");
  expect(calls).toBe(0);
  await expect(page.getByLabel("已确认的材料")).toContainText(
    "unsupported.docx",
  );
});

test('English result workspace translates controls without rewriting authored content', async ({page}) => {
  await page.addInitScript(()=>localStorage.setItem('workbuddy-standalone-demo:language','en'));
  await page.route('**/api/workbuddy-demo/generate',route=>{
    const outputs=artifacts(route.request().postDataJSON());
    outputs[0].title='Product launch';
    return route.fulfill({contentType:'application/x-ndjson',body:[...outputs.map(artifact=>({artifact})),{done:true}].map(e=>JSON.stringify(e)).join('\n')+'\n'});
  });
  await page.goto('/');
  await page.getByRole('textbox',{name:'WorkBuddy task input',exact:true}).fill('Create an English product presentation with a blue theme.');
  await page.getByRole('button',{name:'Send request',exact:true}).click();
  await expect(page.getByRole('button',{name:'Download result'})).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Slide title',exact:true})).toHaveText('新品亮相');
  await page.screenshot({path:'artifacts/workbuddy-demo/evidence/english-results.png'});
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByRole('combobox',{name:'Interface and speech language'}).selectOption('zh-CN');
  await page.getByRole('button',{name:'关闭设置'}).click();
  await expect(page.getByRole('textbox',{name:'网页幻灯片标题',exact:true})).toHaveText('新品亮相');
  await expect(page.getByRole('button',{name:'下载成果'})).toBeVisible();
});
