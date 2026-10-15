import { test, expect, type Page } from "@playwright/test";
test.use({ screenshot: "only-on-failure" });
async function home(p: Page) {
  await p.goto("/?bridge=5191");
  await p
    .locator(".demo-apps")
    .getByRole("button", { name: "WorkBuddy", exact: true })
    .click();
}
async function fileBrowser(p: Page, name = "客户方案.docx") {
  await p
    .locator(".wb-sidebar nav")
    .getByRole("button", { name: /更多/ })
    .click();
  await p.getByRole("button", { name: "文件浏览器", exact: true }).click();
  await p.getByRole("button", { name: "打开文件", exact: true }).click();
  await p
    .getByRole("dialog")
    .getByRole("button", { name, exact: true })
    .click();
}
async function openTab(p: Page, name: string) {
  await p.getByRole("button", { name: "新建或打开文件" }).click();
  await p.getByRole("button", { name: "打开文件", exact: true }).click();
  await p
    .getByRole("dialog")
    .getByRole("button", { name, exact: true })
    .click();
}
test("standalone file browser provides all formats, saved tabs, media and readable layouts", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await home(page);
  await fileBrowser(page);
  await expect(page.locator(".wb-sidebar")).toHaveCount(0);
  await expect(page.locator(".wbf-ai")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "连接设置", exact: true }),
  ).toHaveCount(1);
  await page.screenshot({ path: "artifacts/file-browser-word.png" });
  await page.getByRole("button", { name: "和 WorkBuddy 对话" }).click();
  await expect(page.locator(".wbf-ai")).toBeVisible();
  await page.screenshot({ path: "artifacts/file-browser-ai.png" });
  await openTab(page, "采购报价.xlsx");
  await expect(page.getByLabel(/B4 ·.*数量/)).toHaveValue("30");
  await page.getByLabel(/B4 ·.*数量/).fill("40");
  await page.getByRole("button", { name: "保存文件", exact: true }).click();
  await expect(page.locator(".wbf-file-meta")).toContainText("已保存");
  await page.screenshot({ path: "artifacts/file-browser-sheet.png" });
  await openTab(page, "销售汇报.pptx");
  await expect(page.locator(".wbf-slides aside button")).toHaveCount(6);
  await page.locator(".wbf-slides aside button").nth(3).click();
  await expect(page.locator(".slide-chart")).toContainText("¥190,380.00");
  await page.screenshot({ path: "artifacts/file-browser-slides.png" });
  await openTab(page, "客户需求确认.pdf");
  await page.getByRole("button", { name: "PDF 下一页" }).click();
  await expect(page.locator(".wbf-pdf")).toContainText("交付与服务");
  await expect(page.getByRole("button", { name: "保存文件" })).toBeDisabled();
  await openTab(page, "办公设备配置示意.svg");
  await expect(page.locator(".wbf-image-preview")).toBeVisible();
  expect(
    await page
      .locator(".wbf-image-preview")
      .evaluate((x: HTMLImageElement) => x.naturalWidth),
  ).toBeGreaterThan(0);
  await openTab(page, "会议开场提示.wav");
  await expect(page.locator("audio")).toBeVisible();
  await expect
    .poll(() =>
      page.locator("audio").evaluate((x: HTMLAudioElement) => x.duration),
    )
    .toBeCloseTo(1.2);
  await page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.play());
  await expect.poll(() => page.locator("audio").evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0);
  await openTab(page, "澄星项目工作台.html");
  await page.getByRole("button", { name: "编辑网页" }).click();
  await page.getByLabel("网页文本内容").fill("# 澄星设计\n\n客户已确认交期。");
  await page.getByRole("button", { name: "退出编辑" }).click();
  await expect(page.locator(".wbf-web-hero")).toContainText("客户已确认交期");
  await openTab(page, "会前准备清单.txt");
  await page.getByRole("button", { name: "源码编辑" }).click();
  await page.getByLabel("文件源码").fill("中文与 emoji 👨‍👩‍👧\n会前核对报价。");
  await expect(page.locator(".wbf-file-meta")).toContainText("已保存", {
    timeout: 3000,
  });
  await openTab(page, "需求简报.md");
  await page.getByRole("button", { name: "查找文件内容" }).click();
  await page.getByLabel("查找文字").fill("澄星");
  await expect(page.locator(".wbf-find")).toContainText("处");
  await page.locator(".wbf-visual-editor .wbf-block").nth(1).fill("可视编辑保留光标。");
  await page.locator(".wbf-visual-editor .wbf-block").nth(1).press("End");
  await page.locator(".wbf-visual-editor .wbf-block").nth(1).pressSequentially("ABCDE", {delay: 80});
  await expect(page.locator(".wbf-file-meta")).toContainText("已保存", {timeout:3000});
  await page.getByRole("button", {name:"源码编辑"}).click();
  await expect(page.getByLabel("文件源码")).toHaveValue(/可视编辑保留光标。ABCDE/);
  await page.getByRole("button", {name:"可视编辑"}).click();
  await page.screenshot({ path: "artifacts/file-browser-markdown.png" });
  expect(errors).toEqual([]);
});
test("dirty close, read-only second window, local AI edit and reopen retain file identity", async ({
  page,
}) => {
  await home(page);
  await fileBrowser(page);
  await page
    .locator(".wbf-word .word-paragraph")
    .nth(1)
    .fill("客户会前需要项目介绍。");
  await page
    .getByRole("button", { name: "关闭 客户方案.docx", exact: true })
    .click();
  await expect(page.getByRole("dialog", { name: "未保存修改" })).toBeVisible();
  await page.getByRole("button", { name: "取消", exact: true }).click();
  await expect(page.locator(".wbf-word")).toContainText(
    "客户会前需要项目介绍。",
  );
  await page.getByRole("button", { name: "标签菜单 客户方案.docx" }).click();
  await page.getByRole("button", { name: "在新窗口打开" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "保存", exact: true })
    .click();
  await expect(page.locator(".wbf-file-meta")).toContainText("只读");
  await page.getByRole("button", { name: "返回", exact: true }).click();
  await expect(page.locator(".wbf-file-meta")).not.toContainText("只读");
  await page.locator(".wbf-word .word-paragraph").nth(1).click();
  await page.getByRole("button", { name: "和 WorkBuddy 对话" }).click();
  await page
    .getByLabel("文件 AI 指令")
    .fill("替换为 客户已确认会前准备报价和项目介绍。");
  await page.getByRole("button", { name: "发送文件指令", exact: true }).click();
  await expect(page.locator(".wbf-ai-messages")).toContainText(
    "已修改所选内容",
    { timeout: 5000 },
  );
  await expect(page.locator(".wbf-word")).toContainText(
    "客户已确认会前准备报价和项目介绍。",
  );
  await page.getByRole("button", { name: "文件撤销" }).click();
  await expect(page.locator(".wbf-word")).toContainText(
    "客户会前需要项目介绍。",
  );
  await page.getByRole("button", { name: "文件重做" }).click();
  await page.getByRole("button", { name: "保存文件" }).click();
  await page
    .getByRole("button", { name: "关闭 客户方案.docx", exact: true })
    .click();
  await expect(page.locator(".wb-home")).toBeVisible();
  await fileBrowser(page);
  await page.getByRole("button", { name: "和 WorkBuddy 对话" }).click();
  await expect(page.locator(".wbf-ai-messages")).toContainText("替换为");
  await page.screenshot({ path: "artifacts/file-browser-session.png" });
});
test("phone edits file targets, sends AI instructions and WPS reads saved canonical content", async ({
  browser,
}) => {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const tablet = await context.newPage(),
    phone = await context.newPage();
  await home(tablet);
  await tablet.getByRole("button", { name: "连接设置" }).click();
  await tablet.getByRole("radio", { name: /扫码网络建联/ }).check();
  const pin = (await tablet.locator(".pair-code").innerText()).trim();
  await phone.setViewportSize({ width: 412, height: 915 });
  await phone.goto("/?role=phone&bridge=5191");
  await phone.getByLabel("平板地址").fill("localhost");
  await phone.getByLabel("配对码", { exact: true }).fill(pin);
  await phone.getByRole("button", { name: "连接", exact: true }).click();
  await expect(phone.getByRole("dialog", {name:"设备连接"})).toHaveCount(0);
  await tablet.getByRole("button", { name: "关闭连接设置" }).click();
  await fileBrowser(tablet);
  await expect(phone.locator(".generic-shortcuts")).toBeVisible();
  await tablet.locator(".wbf-word .word-paragraph").nth(1).click();
  await phone
    .getByLabel("手机 WorkBuddy 草稿")
    .fill("手机补充的会前采购方案。");
  await expect(tablet.locator(".wbf-word")).toContainText(
    "手机补充的会前采购方案。",
  );
  await expect(phone.getByRole("button", { name: "保存修改" })).toHaveCount(0);
  await tablet.getByRole("button", { name: "保存文件", exact: true }).click();
  await tablet.getByRole("button", { name: "和 WorkBuddy 对话" }).click();
  await tablet.getByLabel("文件 AI 指令").click();
  await phone.getByLabel("手机 WorkBuddy 草稿").fill("总结全文要点");
  await expect(tablet.getByLabel("文件 AI 指令")).toHaveValue("总结全文要点");
  await phone.screenshot({ path: "artifacts/file-browser-phone.png" });
  await phone
    .getByRole("button", { name: "发送文件指令", exact: true })
    .click();
  await expect(tablet.locator(".wbf-ai-messages")).toContainText(
    "当前文件要点",
    { timeout: 5000 },
  );
  await tablet.getByRole("button", { name: "在 WPS 中打开" }).click();
  await expect(tablet.locator(".word-page")).toContainText(
    "手机补充的会前采购方案。",
  );
  await context.close();
});
test("right result panel separates task artifacts, workspace changes and independent HTML navigation", async ({
  page,
}) => {
  await home(page);
  await page
    .locator(".wb-history > div")
    .filter({
      has: page.getByRole("button", {
        name: "操作 采购报价 · 澄星设计",
        exact: true,
      }),
    })
    .getByRole("button", { name: "采购报价 · 澄星设计", exact: true })
    .click();
  await page.getByRole("button", { name: "查看任务文件" }).click();
  await page
    .locator(".wbf-result-modes")
    .getByRole("button", { name: "产物", exact: true })
    .click();
  await expect(page.locator(".wbf-artifact-list")).toContainText(
    "采购报价.xlsx",
  );
  await expect(page.locator(".wbf-artifact-list")).not.toContainText(
    "销售汇报.pptx",
  );
  await page
    .locator(".wbf-result-modes")
    .getByRole("button", { name: "工作空间文件" })
    .click();
  await page
    .locator(".wb-directory")
    .getByRole("button", { name: "采购报价.xlsx", exact: true })
    .click();
  await page.getByLabel(/B4 ·.*数量/).fill("42");
  await page.getByRole("button", { name: "保存文件" }).click();
  await page
    .locator(".wbf-result-modes")
    .getByRole("button", { name: "变更", exact: true })
    .click();
  await page.locator(".wbf-changes summary").first().click();
  await expect(page.locator(".wbf-changes ins")).toContainText("42 件");
  await page.screenshot({ path: "artifacts/file-browser-changes.png" });
  await page
    .locator(".wbf-result-modes")
    .getByRole("button", { name: "浏览器", exact: true })
    .click();
  await page
    .locator(".wbf-local-browser article")
    .getByRole("button", { name: "设备配置", exact: true })
    .click();
  await expect(page.locator(".wbf-local-browser h1")).toHaveText("设备配置");
  await page.getByRole("button", { name: "网页后退" }).click();
  await expect(page.locator(".wbf-local-browser h1")).toHaveText("项目概览");
  await page.getByRole("button", { name: "新建网页标签" }).click();
  await expect(page.locator(".wbf-local-browser nav>div")).toHaveCount(2);
  await page.screenshot({ path: "artifacts/file-browser-local-web.png" });
});

test('touch tab drag and divider resizing preserve active file and recent-file menu', async ({browser}) => {
 const context=await browser.newContext({hasTouch:true,viewport:{width:1400,height:920}}),page=await context.newPage();
 await home(page);await fileBrowser(page);await openTab(page,'采购报价.xlsx');await openTab(page,'需求简报.md');
 const first=await page.locator('[data-file-tab="sales-proposal"]').boundingBox(),last=await page.locator('[data-file-tab="sales-brief"]').boundingBox();
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:first!.x+40,y:first!.y+20}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:last!.x+40,y:last!.y+20}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect.poll(()=>page.locator('[data-file-tab]').evaluateAll(nodes=>nodes.map(n=>(n as HTMLElement).dataset.fileTab))).toEqual(['sales-quote','sales-proposal','sales-brief']);
 await page.getByRole('button',{name:'和 WorkBuddy 对话'}).click();
 const divider=await page.locator('.wbf-divider').boundingBox(),before=await page.locator('.wbf-ai').boundingBox();
 await page.mouse.move(divider!.x+2,divider!.y+80);await page.mouse.down();await page.mouse.move(divider!.x-140,divider!.y+80);await page.mouse.up();
 await expect.poll(async()=> (await page.locator('.wbf-ai').boundingBox())!.width).toBeGreaterThan(before!.width+70);
 await page.getByRole('button',{name:'新建或打开文件'}).click();await expect(page.locator('.wbf-plus-menu')).toContainText('客户方案.docx');
 await context.close();
});

test('selected cell region survives pointer release and AI edits only the requested field',async({page})=>{
 await home(page);await fileBrowser(page,'采购报价.xlsx');const start=await page.getByLabel(/B4 ·.*数量/).boundingBox(),end=await page.getByLabel(/C5 ·.*采购单价/).boundingBox();
 await page.mouse.move(start!.x+10,start!.y+10);await page.mouse.down();await page.mouse.move(end!.x+10,end!.y+10);await page.mouse.up();
 await expect(page.locator('.wbf-selection')).toContainText('4 个对象');await expect(page.locator('td.cell-selected')).toHaveCount(4);
 await page.locator('.wbf-selection').click();await page.getByLabel('文件 AI 指令').fill('数量改为40');await page.getByRole('button',{name:'发送文件指令'}).click();
 await expect(page.getByLabel(/B4 ·.*数量/)).toHaveValue('40');await expect(page.getByLabel(/B5 ·.*数量/)).toHaveValue('40');await expect(page.getByLabel(/C4 ·.*采购单价/)).toHaveValue('4200');
});
