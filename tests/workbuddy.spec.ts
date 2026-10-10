import { test, expect, type Page } from "@playwright/test";
async function openWb(page: Page) {
  await page.goto("/?bridge=5191");
  await page
    .locator(".demo-apps")
    .getByRole("button", { name: "WorkBuddy", exact: true })
    .click();
  await expect(page.locator(".wb-home h1")).toHaveText("WorkBuddy, 我帮你");
}
async function pair(tablet: Page, phone: Page) {
  await tablet.getByRole("button", { name: "连接设置", exact: true }).click();
  const pin = (await tablet.locator(".pair-code").innerText()).trim();
  await phone.setViewportSize({ width: 412, height: 915 });
  await phone.goto("/?role=phone&bridge=5191");
  await phone.getByLabel("平板地址").fill("localhost");
  await phone.getByLabel("配对码", { exact: true }).fill(pin);
  await phone.getByRole("button", { name: "连接", exact: true }).click();
  await expect(phone.getByText("已连接工作台")).toBeVisible();
  await tablet.getByRole("button", { name: "关闭连接设置" }).click();
}
test("WorkBuddy phone activates only on focus, syncs text, edits emoji and submits one task", async ({
  browser,
}) => {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const tablet = await context.newPage(),
    phone = await context.newPage();
  const errors: string[] = [];
  for (const p of [tablet, phone]) {
    p.on("pageerror", (e) => errors.push(e.message));
  }
  await openWb(tablet);
  await pair(tablet, phone);
  await expect(phone.locator(".phone-home")).toBeVisible();
  await tablet.getByLabel("WorkBuddy 任务输入").click();
  await expect(phone.getByLabel("手机 WorkBuddy 草稿")).toBeVisible();
  await expect(
    phone.getByRole("button", { name: "连接设置", exact: true }),
  ).toHaveCount(1);
  await phone.getByLabel("手机 WorkBuddy 草稿").fill("采购报价👨‍👩‍👧");
  await expect(tablet.getByLabel("WorkBuddy 任务输入")).toHaveValue(
    "采购报价👨‍👩‍👧",
  );
  await phone.getByRole("button", { name: "删除", exact: true }).click();
  await expect(phone.getByLabel("手机 WorkBuddy 草稿")).toHaveValue("采购报价");
  await expect(tablet.getByLabel("WorkBuddy 任务输入")).toHaveValue("采购报价");
  await phone.getByRole("button", { name: "撤销", exact: true }).click();
  await expect(phone.getByLabel("手机 WorkBuddy 草稿")).toHaveValue(
    "采购报价👨‍👩‍👧",
  );
  await phone.getByRole("button", { name: "全选", exact: true }).click();
  await phone.getByRole("button", { name: "剪切", exact: true }).click();
  await expect(phone.getByLabel("手机 WorkBuddy 草稿")).toHaveValue("");
  await phone.getByRole("button", { name: "粘贴", exact: true }).click();
  await expect(phone.getByLabel("手机 WorkBuddy 草稿")).toHaveValue(
    "采购报价👨‍👩‍👧",
  );
  await phone.screenshot({ path: "artifacts/workbuddy-phone.png" });
  await phone.getByRole("button", { name: "发送任务", exact: true }).click();
  await expect(tablet.locator(".wb-message.user")).toContainText("采购报价");
  await expect(tablet.locator(".wb-file-card")).toBeVisible({ timeout: 10000 });
  await tablet.locator(".wb-file-card").click();
  await expect(tablet.locator(".wb-preview-body")).toContainText("¥190,380.00");
  await expect(tablet.locator(".wb-preview-body")).toContainText("待补充");
  await tablet.screenshot({ path: "artifacts/workbuddy-quote.png" });
  expect(errors).toEqual([]);
  await context.close();
});
test("WorkBuddy four sales chains create previewable results and WPS launch remains editable", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openWb(page);
  await page.screenshot({ path: "artifacts/workbuddy-home.png" });
  for (const [prompt, expected] of [
    ["整理客户需求简报", "需求简报.md"],
    ["比较供应商采购报价", "采购报价.xlsx"],
    ["生成客户方案", "客户方案.docx"],
    ["生成六页销售汇报", "销售汇报.pptx"],
  ]) {
    await page.getByLabel("WorkBuddy 任务输入").fill(prompt);
    await page.getByRole("button", { name: "发送 WorkBuddy 任务" }).click();
    await expect(page.locator(".wb-file-card")).toContainText(expected, {
      timeout: 10000,
    });
    await page.locator(".wb-file-card").click();
    await expect(page.locator(".wb-preview-body")).toContainText("澄星设计");
    await expect(page.locator(".wb-preview-body")).toContainText("¥190,380.00");
    await page.getByRole("button", { name: "返回", exact: true }).click();
    await expect(page.locator(".wb-file-panel")).toHaveCount(0);
    if (expected.endsWith(".pptx")) {
      await page.locator(".wb-file-card").click();
      await page.getByRole("button", { name: "在 WPS 中打开" }).click();
      await expect(page.locator(".slides-editor")).toBeVisible();
      await expect(page.locator(".presentation")).toHaveCount(0);
      await page.getByRole("button", { name: "返回", exact: true }).click();
      await page.getByRole("button", { name: "返回", exact: true }).click();
    } else {
      await page.getByRole("button", { name: "返回", exact: true }).click();
      await expect(page.locator(".wb-home")).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});
test("WorkBuddy plan, stop/continue, local catalog and configuration flows", async ({
  page,
}) => {
  await openWb(page);
  await page.getByRole("button", { name: "添加内容", exact: true }).click();
  await page.getByRole("button", { name: "工作模式", exact: true }).click();
  await page.getByRole("button", { name: /计划.*先审阅/ }).click();
  await page.getByLabel("WorkBuddy 任务输入").fill("生成销售汇报");
  await page.getByRole("button", { name: "发送 WorkBuddy 任务" }).click();
  await expect(page.getByText("等待确认", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "确认并开始执行" }).click();
  await page.getByRole("button", { name: "停止", exact: true }).click();
  await expect(page.getByText("已暂停", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "继续执行" }).click();
  await expect(page.locator(".wb-file-card")).toBeVisible({ timeout: 10000 });
  await page
    .locator(".wb-sidebar nav")
    .getByRole("button", { name: "专家·技能·连接器", exact: true })
    .click();
  await page.getByRole("button", { name: "选择 采购分析专家" }).click();
  await expect(page.locator(".wb-home")).toBeVisible();
  await page
    .locator(".wb-sidebar nav")
    .getByRole("button", { name: "专家·技能·连接器", exact: true })
    .click();
  await page
    .locator(".wb-tabs")
    .getByRole("button", { name: "技能", exact: true })
    .click();
  await page.getByRole("button", { name: "选择 深度研究" }).click();
  await page.getByRole("button", { name: /已安装 \(/ }).click();
  await expect(page.locator(".wb-catalog")).toContainText("深度研究");
  await page
    .locator(".wb-tabs")
    .getByRole("button", { name: "连接器", exact: true })
    .click();
  await page.getByRole("button", { name: "选择 飞书" }).click();
  await page.getByRole("button", { name: "保存本地配置", exact: true }).click();
  await page.screenshot({ path: "artifacts/workbuddy-connectors.png" });
  await page
    .locator(".wb-sidebar nav")
    .getByRole("button", { name: "定时任务", exact: true })
    .click();
  await page
    .getByRole("button", { name: "＋ 新建定时任务", exact: true })
    .click();
  await page.getByLabel("名称", { exact: true }).fill("每日客户需求简报");
  await page.getByLabel("配置内容").fill("整理客户需求简报");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.locator(".wb-automation-grid")).toContainText(
    "每日客户需求简报",
  );
  await page
    .locator(".wb-automation-card")
    .last()
    .getByRole("button", { name: "试运行", exact: true })
    .click();
  await expect(page.locator(".wb-file-card")).toBeVisible({ timeout: 10000 });
});
test("WorkBuddy editable preview, project, assistant, library and settings remain local and persistent", async ({
  page,
}) => {
  await openWb(page);
  await page
    .locator(".wb-sidebar nav")
    .getByRole("button", { name: "资料库", exact: true })
    .click();
  await page
    .locator(".wb-library-table")
    .getByRole("button", { name: "需求简报.md", exact: true })
    .click();
  await page.getByRole("button", { name: "编辑文件", exact: true }).click();
  await page
    .getByLabel("WorkBuddy 文件正文")
    .fill("# 我的采购简报\n\n安装地址待确认。");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await page.getByRole("button", { name: "编辑文件", exact: true }).click();
  await expect(page.locator(".wb-preview-body")).toContainText("我的采购简报");
  await page.getByRole("button", { name: "返回", exact: true }).click();
  await page
    .locator(".wb-sidebar nav")
    .getByRole("button", { name: "项目", exact: true })
    .click();
  await page.getByRole("button", { name: "＋ 新建项目" }).click();
  await page.getByLabel("名称", { exact: true }).fill("客户采购评审");
  await page.getByLabel("配置内容").fill("先确认地址，再确认预算。");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await expect(page.locator(".wb-projects")).toContainText("客户采购评审");
  await page
    .locator(".wb-sidebar nav")
    .getByRole("button", { name: "助理", exact: false })
    .click();
  await page.getByRole("button", { name: "销售助理", exact: false }).click();
  await page.getByLabel("助理消息").fill("请记录明天的客户需求");
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.locator(".wb-assistant-chat")).toContainText(
    "已记录本次需求",
  );
  await page
    .locator(".wb-sidebar nav")
    .getByRole("button", { name: /更多/ })
    .click();
  await page
    .locator(".wb-more")
    .getByRole("button", { name: "设置", exact: true })
    .click();
  await page.getByLabel("WorkBuddy 记忆").fill("客户希望先核对安装地址");
  await page.getByRole("button", { name: "保存修改", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("WorkBuddy 记忆")).toHaveValue(
    "客户希望先核对安装地址",
  );
});

test('WorkBuddy recorded page states render at tablet size with one Back and intact assets',async({page})=>{
 await openWb(page);await expect(page.getByRole('button',{name:'返回',exact:true})).toHaveCount(1);
 await page.getByRole('button',{name:'Space-Bunny',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Space-Bunny');await page.screenshot({path:'artifacts/workbuddy-model.png'});await page.getByRole('button',{name:'关闭 WorkBuddy 面板'}).click();
 await page.locator('.wb-sidebar nav').getByRole('button',{name:'专家·技能·连接器',exact:true}).click();await page.screenshot({path:'artifacts/workbuddy-experts.png'});await page.locator('.wb-tabs').getByRole('button',{name:'技能',exact:true}).click();await page.screenshot({path:'artifacts/workbuddy-skills.png'});
 for(const [label,key] of [['定时任务','automation'],['资料库','library']]){await page.locator('.wb-sidebar nav').getByRole('button',{name:label,exact:true}).click();await page.screenshot({path:'artifacts/workbuddy-'+key+'.png'});}
 await page.locator('.wb-sidebar nav').getByRole('button',{name:'新建任务',exact:true}).click();await page.getByRole('button',{name:'搜索任务'}).click();await page.getByRole('button',{name:/采购报价.*已完成/}).click();await page.getByRole('button',{name:'查看任务文件'}).click();await expect(page.locator('.wb-directory')).toContainText('销售汇报.pptx');await page.locator('.wb-directory').getByRole('button',{name:/采购报价.xlsx/}).click();await page.locator('.wb-directory').getByRole('button',{name:/客户方案.docx/}).click();await expect(page.locator('.wb-preview-tabs>div')).toHaveCount(2);await page.screenshot({path:'artifacts/workbuddy-directory.png'});
 await page.getByRole('button',{name:'返回',exact:true}).click();await page.getByRole('button',{name:'返回',exact:true}).click();await page.getByRole('button',{name:'发现应用',exact:true}).click();await page.getByRole('button',{name:'查看并授权',exact:true}).click();await page.getByRole('button',{name:'授权本地工作台',exact:true}).click();await expect(page.locator('.wb-buddy-config')).toBeVisible();await page.locator('.wb-buddy-config').getByRole('button',{name:'需求简报',exact:true}).click();await expect(page.getByLabel('WorkBuddy 任务输入')).toHaveValue('帮我生成澄星设计的需求简报');
 expect(await page.locator('.workbuddy img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).naturalWidth>0))).toBe(true);
});
