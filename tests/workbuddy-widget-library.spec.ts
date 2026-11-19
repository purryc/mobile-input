import { expect, test } from "@playwright/test";
import { controlKinds } from "../packages/core/workbuddy-demo-controls";

const path = (widget: string) =>
  `/widget-library.html?widget=${widget}&language=en`;

test("all fourteen deep links render the real control without a draft or model request", async ({
  page,
}) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/")) requests.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  for (const kind of controlKinds) {
    await page.goto(path(kind));
    const example = page.locator(`.widget-example[data-widget="${kind}"]`);
    await expect(example).toBeVisible();
    await expect(
      example.locator(kind === "polish" ? ".demo-polish-slot" : ".live-wb-aux"),
    ).toBeVisible();
    await expect
      .poll(() =>
        example
          .locator("img")
          .evaluateAll((nodes) =>
            nodes.every(
              (node) =>
                (node as HTMLImageElement).complete &&
                (node as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    await expect(
      page.locator('nav[aria-label="Input controls"] button'),
    ).toHaveCount(14);
  }
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(async () =>
      (await indexedDB.databases()).map((db) => db.name),
    ),
  ).toEqual([]);
});

test("two duration and color specimens keep independent values and panel ids", async ({
  page,
}) => {
  await page.goto(path("duration"));
  await page.getByRole("button", { name: "Try two instances" }).click();
  const examples = page.locator(".widget-example");
  const first = examples.nth(0),
    second = examples.nth(1);
  const firstId = await first
    .locator(".sentence-token")
    .getAttribute("aria-controls");
  expect(firstId).toBeTruthy();
  expect(firstId).not.toBe(
    await second.locator(".sentence-token").getAttribute("aria-controls"),
  );
  const trigger = first.locator(".sentence-token");
  await trigger.press("Enter");
  await expect(trigger).toBeFocused();
  await expect(first.locator(".live-wb-aux")).toHaveCount(0);
  await trigger.press("Enter");
  await expect(trigger).toBeFocused();
  await expect(first.locator(".live-wb-aux")).toBeVisible();
  await first.locator("input[type=number]").fill("23");
  await expect(first.locator(".sentence-token")).toContainText("23");
  await expect(second.locator("input[type=number]")).toHaveValue("10");
  await first.getByRole("button", { name: "Done", exact: true }).click();
  await expect(first.locator(".live-wb-aux")).toHaveCount(0);
  await expect(second.locator(".live-wb-aux")).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Color", exact: true })
    .click();
  await first.locator('input[aria-label$="HEX"]').fill("#442288");
  await expect(first.locator(".sentence-token")).toContainText("#442288");
  await expect(second.locator('input[aria-label$="HEX"]')).toHaveValue(
    "#356FE4",
  );
  await page.getByLabel("State").selectOption("recommended");
  await first.getByRole("button", { name: /Remove recommendation/ }).click();
  await expect(first.locator(".live-wb-aux")).toHaveCount(0);
  await expect(second.locator(".sentence-token")).toHaveAttribute(
    "data-origin",
    "recommended",
  );
});

test("choice widgets write controlled selections and support searching", async ({
  page,
}) => {
  for (const kind of [
    "font",
    "palette",
    "expert",
    "skills",
    "connectors",
    "formats",
  ]) {
    await page.goto(path(kind));
    const panel = page.locator(".live-wb-aux");
    if (["font", "expert", "skills", "connectors"].includes(kind)) {
      await panel.locator("input").fill("zz no match");
      await expect(panel.locator("button.demo-control-option")).toHaveCount(0);
      await panel.locator("input").clear();
    }
    const option = panel.locator("button.demo-control-option").first();
    const label = await option.getAttribute("aria-label");
    await option.click();
    await expect(option).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".sentence-token")).toContainText(label!);
  }
});

test("file and image selection, sketch adoption, and capture confirmation update local previews", async ({
  page,
}) => {
  await page.goto(path("document"));
  await page.locator("input[type=file]").setInputFiles({
    name: "brief.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("# Brief"),
  });
  await expect(page.locator(".widget-example-files")).toContainText("brief.md");
  await page.goto(path("photo"));
  await page.evaluate(() =>
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: undefined,
      configurable: true,
    }),
  );
  await page.getByRole("button", { name: "Camera", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Camera is unavailable");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=",
    "base64",
  );
  await page.locator("input[type=file]").setInputFiles({
    name: "reference.png",
    mimeType: "image/png",
    buffer: png,
  });
  await page.locator(".agent-photo-actions button").last().click();
  await expect(page.locator(".widget-example-files")).toContainText(
    "reference.png",
  );
  await page.goto(path("sketch"));
  const sketch = page.locator(".agent-sketch-surface");
  const box = (await sketch.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 35, { steps: 4 });
  await page.mouse.up();
  await page.locator(".live-wb-sketch-tools button").last().click();
  await expect(page.locator(".widget-sketch-result polyline")).toHaveCount(1);
  for (const kind of ["scanner", "capture"]) {
    await page.goto(path(kind));
    if (kind === "capture") {
      await page
        .getByRole("button", { name: "Screenshot", exact: true })
        .click();
      const selector = page.locator(".demo-screen-selector-overlay");
      await expect(selector).toBeVisible();
      await expect(selector).toHaveAttribute(
        "data-capture-cursor",
        "screenshot",
      );
      await page.mouse.move(120, 140);
      await page.mouse.down();
      await page.mouse.move(380, 320, { steps: 4 });
      await page.mouse.up();
      await expect(selector).toHaveCount(0);
    } else {
      await page.getByRole("button", { name: "Use a sample image" }).click();
    }
    await expect(page.getByText("Awaiting confirmation")).toBeVisible();
    await page.getByRole("button", { name: "Confirm materials" }).click();
    await expect(page.locator(".demo-attachments .demo-material")).toHaveCount(
      1,
    );
    await page
      .locator(".demo-attachments .demo-material button")
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});

test("polish fixture can stop a request and restore the applied text", async ({
  page,
}) => {
  await page.goto(path("polish"));
  const original = await page
    .locator(".widget-polish-preview > p")
    .textContent();
  const action = page.locator(".application-action-chip").first();
  await action.click();
  await page.getByRole("button", { name: "Stop polishing" }).click();
  await expect(page.locator(".widget-polish-preview > p")).toHaveText(
    original!,
  );
  await action.click();
  await page.getByRole("button", { name: "Restore original" }).click();
  await expect(page.locator(".widget-polish-preview > p")).toHaveText(
    original!,
  );
});
