import { test, expect, type Browser, type Page } from "@playwright/test";
import type { WorkBuddyState } from "../packages/core/workbuddy";
async function read(page: Page): Promise<WorkBuddyState> { return page.evaluate(() => JSON.parse(localStorage.getItem("mobile-input-state-v1")!).workbuddy); }
async function pair(browser: Browser, dropSaveAck = false) {
  const context = await browser.newContext(), tablet = await context.newPage(), phone = await context.newPage(), errors: string[] = [];
  for (const page of [tablet, phone]) page.on("pageerror", e => errors.push(e.message));
  if (dropSaveAck) await phone.addInitScript(() => {
    const NativeSocket = window.WebSocket;
    window.WebSocket = class extends NativeSocket {
      lostId = ""; dropped = false;
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        this.addEventListener("message", e => { const m = JSON.parse(String(e.data)); if (!this.dropped && m.kind === "ack" && m.ack.id === this.lostId) { this.dropped = true; e.stopImmediatePropagation(); } });
      }
      send(data: string | ArrayBufferLike | Blob | ArrayBufferView) { if (typeof data === "string") { const m = JSON.parse(data); if (!this.dropped && m.kind === "command" && m.command.type === "wb-doc-save") this.lostId = m.command.id; } super.send(data); }
    };
  });
  await tablet.goto("/?bridge=5191"); await tablet.getByRole("button", { name: "连接设置", exact: true }).click();
  const pin = (await tablet.locator(".pair-code").innerText()).trim(); await tablet.getByRole("button", { name: "关闭连接设置" }).click();
  await phone.setViewportSize({ width: 390, height: 844 }); await phone.goto("/?role=phone&bridge=5191");
  await phone.getByLabel("平板地址").fill("localhost"); await phone.getByLabel("配对码", { exact: true }).fill(pin); await phone.getByRole("button", { name: "连接", exact: true }).click();
  await expect(phone.getByRole("dialog", { name: "设备连接" })).toHaveCount(0); await phone.getByRole("button", { name: "在工作台打开 WorkBuddy", exact: true }).click();
  await phone.getByRole("button", { name: "新建任务", exact: true }).click();
  return { context, tablet, phone, errors };
}
async function create(phone: Page, result = "ppt-demo", title = "客户项目汇报") {
  await phone.getByLabel("手机新建任务草稿").fill(`标题：${title}`); await phone.getByLabel("新建任务成果类型").selectOption(result);
  if (result === "roadmap-demo") {
    await phone.getByRole("button", { name: "读取示例手绘节点（模拟）", exact: true }).click(); await phone.getByLabel("阶段 2 名称").fill("交付评审");
    await phone.getByRole("button", { name: "返回任务总览" }).click(); await phone.getByRole("region", { name: "未提交草稿" }).getByRole("button").filter({ hasText: title }).click();
    await expect(phone.getByLabel("新建任务成果类型")).toHaveValue("roadmap-demo"); await expect(phone.getByLabel("阶段 2 名称")).toHaveValue("交付评审");
    await phone.getByLabel("已核对手绘节点").check();
  }
  await phone.getByRole("button", { name: "提交新任务", exact: true }).dblclick();
  await expect(phone.getByRole("heading", { name: title, exact: true })).toBeVisible(); await phone.getByRole("button", { name: "编辑此 PPT", exact: true }).click();
  await expect(phone.getByRole("application", { name: "PPT 触控板" })).toBeVisible();
}
test("phone creates PPT, points with touchpad, freezes voice target, previews, applies, saves and locally undoes", async ({ browser }) => {
  const { context, tablet, phone, errors } = await pair(browser); await create(phone);
  await expect(tablet.getByRole("main", { name: "WorkBuddy 文件窗口" })).toBeVisible();
  const pad = phone.getByRole("application", { name: "PPT 触控板" }), box = (await pad.boundingBox())!;
  await pad.click({ position: { x: box.width * .2, y: box.height * .2 } });
  await expect(phone.getByRole("status").filter({ hasText: "已选择：标题" })).toBeVisible();
  await phone.getByRole("button", { name: "演示语音", exact: true }).click();
  await phone.getByRole("button", { name: "填入演示转写：改成蓝色", exact: true }).click();
  await phone.getByRole("region", { name: "页面对象" }).getByRole("button", { name: "副标题", exact: true }).click();
  await expect(phone.locator(".wb-binding")).toContainText("标题 · v0");
  await phone.getByRole("button", { name: "预览修改", exact: true }).click(); await expect(phone.getByLabel("修改前后预览")).toBeVisible();
  await expect(phone.getByRole("button", { name: "确认应用修改", exact: true })).toBeInViewport({ ratio: 1 });
  let wb = await read(tablet), id = wb.fileWorkspace.active!; expect(wb.fileWorkspace.documents[id].revision).toBe(0);
  await phone.screenshot({ path: "artifacts/cloud/second-slice/phone-ppt-preview.png" });
  await phone.getByRole("button", { name: "确认应用修改", exact: true }).dblclick();
  await expect(phone.getByText("修改已应用，当前文档可保存或撤销", { exact: true })).toBeVisible();
  await phone.getByRole("button", { name: "保存文档", exact: true }).click();
  await expect.poll(async () => (await read(tablet)).fileWorkspace.documents[id].saved.pages[0].objects[0].color).toBe("#2563eb");
  await phone.getByRole("button", { name: "撤销此文档", exact: true }).click();
  await expect.poll(async () => (await read(tablet)).fileWorkspace.documents[id].pages[0].objects[0].color).toBe("#20304a");
  wb = await read(tablet); expect(wb.fileWorkspace.documents[id].revision).toBe(2); expect(wb.fileWorkspace.documents[id].pages[0].objects[1].color).toBe("#20304a");
  expect(wb.tasks.filter(t => t.title === "客户项目汇报")).toHaveLength(1); await tablet.screenshot({ path: "artifacts/cloud/second-slice/tablet-ppt-window.png" });
  expect(errors).toEqual([]); await context.close();
});
test("attached independent window keeps the phone pairing, multi tabs and save-close warning", async ({ browser }) => {
  const { context, tablet, phone, errors } = await pair(browser); await create(phone);
  const popupPromise = tablet.waitForEvent("popup"); await tablet.getByRole("button", { name: "在独立浏览器窗口打开" }).click(); const popup = await popupPromise;
  popup.on("pageerror", e => errors.push(e.message)); await expect(popup.getByRole("main", { name: "WorkBuddy 文件窗口" })).toBeVisible();
  await popup.getByRole("button", { name: "新建或打开文件" }).click(); await popup.getByRole("button", { name: "新建文档（纯文本）", exact: true }).click();
  await popup.getByLabel("文件正文").fill("需要显式保存的文字"); await expect(popup.getByRole("status", { exact: true }).filter({ hasText: "未保存" })).toBeVisible();
  await popup.locator(".wb-window-tabs").getByRole("button", { name: "未命名.docx", exact: false }).first().click({ button: "right" });
  await popup.getByRole("menuitem", { name: "向左移动标签", exact: true }).click();
  await expect.poll(async () => (await read(tablet)).fileWorkspace.tabs[0]).toMatch(/^doc-/);
  await popup.getByRole("button", { name: "关闭标签 未命名.docx", exact: true }).click(); await expect(popup.getByRole("dialog", { name: "保存文件改动" })).toBeVisible();
  await popup.getByRole("button", { name: "取消关闭", exact: true }).click(); await popup.getByRole("button", { name: "保存", exact: true }).click();
  await expect(popup.getByRole("status").filter({ hasText: "已保存到本地演示" })).toBeVisible();
  await popup.getByRole("button", { name: "关闭标签 未命名.docx", exact: true }).click();
  await expect(phone.getByText("已连接 · WorkBuddy", { exact: true })).toBeVisible();
  await popup.getByRole("button", { name: "和 WorkBuddy 对话", exact: true }).click();
  const resizer = (await popup.locator(".wb-ai-resizer").boundingBox())!, oldWidth = (await popup.locator(".wb-window-ai").boundingBox())!.width;
  await popup.mouse.move(resizer.x + 2, resizer.y + 80); await popup.mouse.down(); await popup.mouse.move(resizer.x - 78, resizer.y + 80); await popup.mouse.up();
  expect((await popup.locator(".wb-window-ai").boundingBox())!.width).toBeGreaterThan(oldWidth + 60);
  await expect(popup.getByLabel("页面缩略图")).toBeVisible(); await popup.screenshot({ path: "artifacts/cloud/second-slice/independent-file-window.png" });
  expect(errors).toEqual([]); await context.close();
});
test("hand drawn roadmap confirms edited nodes then allows geometry changes on the same object model", async ({ browser }) => {
  const { context, tablet, phone, errors } = await pair(browser); await create(phone, "roadmap-demo", "项目路线图");
  let wb = await read(tablet), id = wb.fileWorkspace.active!; expect(wb.fileWorkspace.documents[id].pages[0].objects[2].text).toContain("交付评审");
  await phone.getByRole("region", { name: "页面对象" }).getByRole("button", { name: "阶段 2", exact: true }).click();
  await phone.getByRole("button", { name: "文字修改", exact: true }).click(); await phone.getByLabel("选区修改草稿").fill("向右移动 40");
  await phone.getByRole("button", { name: "预览修改", exact: true }).click(); await phone.getByRole("button", { name: "确认应用修改", exact: true }).click();
  await expect.poll(async () => (await read(tablet)).fileWorkspace.documents[id].pages[0].objects[2].x).toBe(315);
  await phone.getByRole("button", { name: "重置此 PPT 演示", exact: true }).click();
  await expect.poll(async () => (await read(tablet)).fileWorkspace.documents[id].pages[0].objects[2].x).toBe(275);
  await tablet.screenshot({ path: "artifacts/cloud/second-slice/roadmap-window.png" }); expect(errors).toEqual([]); await context.close();
});
test("missing receipt notice supplements its existing task then returns to frozen PPT draft and can reset", async ({ browser }) => {
  const { context, tablet, phone, errors } = await pair(browser); await create(phone);
  await phone.getByRole("region", { name: "页面对象" }).getByRole("button", { name: "标题", exact: true }).click();
  await phone.getByRole("button", { name: "文字修改", exact: true }).click(); await phone.getByLabel("选区修改草稿").fill("改为：回来继续的标题");
  await phone.getByRole("button", { name: "票据任务缺少材料 · 去补充", exact: true }).click();
  await phone.getByRole("button", { name: "拍照（示例）", exact: true }).click(); await phone.getByLabel("票据金额").fill("56.70");
  await phone.getByRole("button", { name: "演示语音修正项目", exact: true }).click(); await phone.getByLabel("已核对票据字段").check();
  await phone.getByRole("button", { name: "确认整理到原任务", exact: true }).dblclick();
  await expect(phone.getByLabel("已整理票据")).toContainText("56.70");
  let wb = await read(tablet); expect(wb.fileWorkspace.receipts.rows).toHaveLength(1); expect(wb.tasks.filter(t => t.id === "receipt-year-demo")).toHaveLength(1);
  await phone.screenshot({ path: "artifacts/cloud/second-slice/receipt-supplement.png" });
  await phone.getByRole("button", { name: "返回原 PPT", exact: true }).click(); await expect(phone.getByLabel("选区修改草稿")).toHaveValue("改为：回来继续的标题");
  await expect(phone.getByText("已恢复原 PPT 草稿，请核对锁定对象与当前版本", { exact: true })).toBeVisible();
  await expect(phone.locator(".wb-binding")).toContainText("标题 · v0");
  await phone.getByRole("button", { name: "票据任务缺少材料 · 去补充", exact: true }).click(); await phone.getByRole("button", { name: "重置票据示例", exact: true }).click();
  wb = await read(tablet); expect(wb.fileWorkspace.receipts.rows).toHaveLength(0); expect(wb.fileWorkspace.receipts.missingMonths).toEqual([2, 5, 9]);
  expect(errors).toEqual([]); await context.close();
});
test("desktop updates block the old phone preview; explicit re-selection keeps text and cancel applies nothing", async ({ browser }) => {
  const { context, tablet, phone, errors } = await pair(browser); await create(phone);
  await phone.getByLabel("页面对象").getByRole("button", { name: "标题", exact: true }).click(); await phone.getByRole("button", { name: "文字修改", exact: true }).click();
  await phone.getByLabel("选区修改草稿").fill("改为：保留手机草稿"); await phone.getByRole("button", { name: "预览修改", exact: true }).click();
  await tablet.getByRole("button", { name: "AI 编辑", exact: true }).click(); await tablet.getByLabel("选区修改草稿").fill("字号 32");
  await tablet.getByRole("button", { name: "预览修改", exact: true }).click(); await tablet.getByRole("button", { name: "确认应用修改", exact: true }).click();
  await expect(phone.getByRole("button", { name: "确认应用修改", exact: true })).toBeDisabled(); await expect(phone.getByText("文档版本已变化，请重新选择并确认", { exact: true })).toBeVisible();
  await phone.getByLabel("页面对象").getByRole("button", { name: "标题", exact: true }).click(); await phone.getByRole("button", { name: "按当前选区重新锁定并保留文字", exact: true }).click();
  await expect(phone.getByLabel("选区修改草稿")).toHaveValue("改为：保留手机草稿"); await expect(phone.locator(".wb-binding")).toContainText("标题 · v1");
  await phone.getByRole("button", { name: "预览修改", exact: true }).click(); await phone.getByRole("button", { name: "取消修改", exact: true }).click();
  await phone.getByRole("button", { name: "恢复上次取消的文字", exact: true }).click(); await expect(phone.getByLabel("选区修改草稿")).toHaveValue("改为：保留手机草稿");
  await phone.getByRole("button", { name: "预览修改", exact: true }).click(); await phone.getByRole("button", { name: "返回", exact: true }).click();
  await expect(phone.getByRole("button", { name: "恢复上次取消的文字", exact: true })).toBeVisible();
  const wb = await read(tablet), d = wb.fileWorkspace.documents[wb.fileWorkspace.active!]; expect(d.revision).toBe(1); expect(d.pages[0].objects[0].text).toBe("客户项目汇报"); expect(d.pages[0].objects[0].fontSize).toBe(32);
  expect(errors).toEqual([]); await context.close();
});
test("preview confirmation stays visible within a small portrait native safe area", async ({ browser }) => {
  const { context, phone, errors } = await pair(browser); await create(phone);
  await phone.setViewportSize({ width: 320, height: 740 }); await phone.evaluate(() => window.dispatchEvent(new CustomEvent("native-insets", { detail: { width: 320, height: 740, top: 24, bottom: 34, left: 0, right: 0 } })));
  await phone.getByLabel("页面对象").getByRole("button", { name: "标题", exact: true }).click(); await phone.getByRole("button", { name: "文字修改", exact: true }).click(); await phone.getByLabel("选区修改草稿").fill("改为：小屏预览");
  const before = (await phone.getByRole("button", { name: "预览修改", exact: true }).boundingBox())!;
  await phone.getByRole("button", { name: "预览修改", exact: true }).click(); const apply = phone.getByRole("button", { name: "确认应用修改", exact: true });
  await expect(apply).toBeInViewport({ ratio: 1 }); const after = (await apply.boundingBox())!; expect(Math.abs(before.y - after.y)).toBeLessThan(2); expect(after.y + after.height).toBeLessThanOrEqual(740 - 34); expect(after.height).toBeGreaterThanOrEqual(48);
  expect(errors).toEqual([]); await context.close();
});
test("document text stays local through disconnect and recovery without applying or losing the frozen target", async ({ browser }) => {
  const { context, tablet, phone, errors } = await pair(browser); await create(phone);
  await phone.getByRole("region", { name: "页面对象" }).getByRole("button", { name: "标题", exact: true }).click(); await phone.getByRole("button", { name: "文字修改", exact: true }).click();
  await context.setOffline(true); await phone.evaluate(() => window.dispatchEvent(new CustomEvent("native-message", { detail: { kind: "disconnected" } })));
  await phone.getByLabel("选区修改草稿").fill("改为：离线保留标题"); await expect(phone.getByRole("button", { name: "恢复原选区草稿", exact: true })).toBeVisible();
  await context.setOffline(false); await phone.getByRole("button", { name: "连接设置", exact: true }).click(); await phone.getByRole("button", { name: "连接", exact: true }).click(); await expect(phone.getByRole("dialog", { name: "设备连接" })).toHaveCount(0);
  await phone.getByRole("button", { name: "恢复原选区草稿", exact: true }).click(); await phone.getByRole("button", { name: "预览修改", exact: true }).click();
  const wb = await read(tablet), d = wb.fileWorkspace.documents[wb.fileWorkspace.active!]; expect(d.revision).toBe(0); expect(d.proposals.at(-1)?.patches[0].after.text).toBe("离线保留标题");
  expect(errors).toEqual([]); await context.close();
});
test("a lost save acknowledgement retries the durable original operation without a second file revision", async ({ browser }) => {
  const { context, tablet, phone, errors } = await pair(browser, true); await create(phone);
  await phone.getByLabel("页面对象").getByRole("button", { name: "标题", exact: true }).click(); await phone.getByRole("button", { name: "文字修改", exact: true }).click(); await phone.getByLabel("选区修改草稿").fill("改为：回执丢失仍只保存一次");
  await phone.getByRole("button", { name: "预览修改", exact: true }).click(); await phone.getByRole("button", { name: "确认应用修改", exact: true }).click();
  await phone.getByRole("button", { name: "保存文档", exact: true }).click(); await expect(phone.getByRole("button", { name: "重试原操作", exact: true })).toBeVisible({ timeout: 7000 });
  const before = await read(tablet), id = before.fileWorkspace.active!, revision = before.files.find(f => f.id === id)!.contentRevision;
  await phone.getByRole("button", { name: "重试原操作", exact: true }).click(); await expect(phone.getByRole("button", { name: "保存文档", exact: true })).toBeVisible();
  const after = await read(tablet); expect(after.files.find(f => f.id === id)!.contentRevision).toBe(revision); expect(Object.values(after.operations).filter(o => o.type === "wb-doc-save")).toHaveLength(1);
  expect(errors).toEqual([]); await context.close();
});
