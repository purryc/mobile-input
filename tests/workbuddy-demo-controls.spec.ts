import { demoScenarios } from '../packages/core/workbuddy-demo-scenarios';
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  mixedExample,
  listControls,
} from "../packages/core/workbuddy-demo-controls";
const editor = (page: any) => page.locator(".wb-sentence-composer");
const chip = (page: any, kind: string) =>
  page.locator(`.sentence-token[data-kind="${kind}"]`).first();
for (const language of ["zh", "en"]) for (const [width, height] of [[1440, 960], [1280, 800], [1024, 768], [800, 800]]) {
  test(`desktop visual geometry and original assets ${language} ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page, language);
    const doc = readFileSync(new URL("../docs/workbuddy-demo-scenarios.zh.md", import.meta.url), "utf8");
    await editor(page).fill([...doc.matchAll(/```text\n([\s\S]*?)\n```/g)][2][1]);
    await expect(page.locator('.demo-polish-slot')).toBeVisible();
    await expect(page.locator('.sentence-token[data-origin="recommended"]')).toHaveCount(3);
    await expect(page.locator('[data-preparing="true"]')).toHaveCount(0);
    const faces = await page.locator('.sentence-token-face').evaluateAll(nodes => nodes.map(node => ({ height:node.getBoundingClientRect().height, font:getComputedStyle(node).fontSize })));
    expect(faces.length).toBeGreaterThan(12);
    expect(faces.every(face => face.height === 32 && face.font === '15px')).toBe(true);
    expect(await page.locator('.demo-polish-slot .application-action-chip').first().evaluate(node=>node.getBoundingClientRect().height)).toBe(36);
    const baseline = await editor(page).getAttribute('data-value');
    for (const control of listControls().filter(c => c.kind !== 'polish')) {
      await chip(page, control.kind).click();
      const panel = page.locator('.demo-widget-wrap');
      await expect(panel).toBeVisible();
      const expected = control.kind==='duration'?288:['expert','skills','connectors'].includes(control.kind)?432:320;
      await expect.poll(async () => Math.round((await panel.boundingBox())!.width)).toBe(expected);
      // ResizeObserver positions content after font/image layout and owner scrolling.
      // Wait for the settled constraint rather than measuring the intermediate frame.
      await expect.poll(async () => {
        const box = (await panel.boundingBox())!;
        return box.x >= 15 && box.x + box.width <= width - 15 &&
          box.y >= 15 && box.y + box.height <= height - 15;
      }).toBe(true);
      expect(await panel.locator('[aria-describedby]').evaluateAll(nodes => nodes.every(node => node.getAttribute('aria-describedby')!.split(/\s+/).every(id => document.getElementById(id))))).toBe(true);
      expect(await panel.locator('.live-wb-aux').evaluate(node=>getComputedStyle(node).padding)).toBe('16px');
      const images=panel.locator('img');
      await expect.poll(async()=>images.evaluateAll(nodes=>nodes.every(node=>(node as HTMLImageElement).complete&&(node as HTMLImageElement).naturalWidth>0))).toBe(true);
      await panel.screenshot({path:`artifacts/workbuddy-demo/visual-consistency-2026-11-11/after/${language}-${width}-${control.kind}.png`});
      await page.getByRole('button', {name:language==='en'?'Close input tool':'关闭辅助输入',exact:true}).click();
      await expect(editor(page)).toHaveAttribute('data-value',baseline!);
    }
    await page.screenshot({path:`artifacts/workbuddy-demo/visual-consistency-2026-11-11/after/${language}-${width}-all-controls.png`});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(await page.locator('.demo-polish-slot').evaluate(node=>getComputedStyle(node).paddingLeft)).toBe('18px');
    await page.route('**/api/workbuddy-demo/generate', route=>route.fulfill({contentType:'application/x-ndjson',body:JSON.stringify({artifact:{id:'fixture',kind:'document',title:'Fixture',model:'mock',markdown:'# Fixture\n\nTest only'}})+'\n'+JSON.stringify({done:true})+'\n'}));
    await page.locator('.demo-settings > button').click();await page.getByRole('switch').click();await page.locator('.demo-settings header button').click();
    await page.locator('.demo-send').click();
    await expect(page.locator('.demo-task-compose .demo-polish-slot')).toBeVisible();
    expect(await page.locator('.demo-task-compose .demo-polish-slot').evaluate(node=>getComputedStyle(node).paddingLeft)).toBe('12px');
    await expect(editor(page)).toHaveAttribute('data-value',baseline!);
    if(width===800)await page.locator('.wb-preview-tabs > button').click();
    await page.locator('.demo-task-compose .demo-polish-slot').scrollIntoViewIfNeeded();
    await expect(page.locator('.demo-task-compose .demo-polish-slot')).toBeInViewport();
    await expect(page.locator('.demo-voice')).toBeInViewport();
    await expect(page.locator('.demo-send')).toBeInViewport();
    await page.screenshot({path:`artifacts/workbuddy-demo/visual-consistency-2026-11-11/after/input-correction-result-${language}-${width}.png`});

  });
}
async function open(page: any, language = "zh") {
  await page.goto("/?controls=all&debug=1&language=" + language);
  await expect(editor(page)).toBeVisible();
}
test("documented scenarios expose all controls with captures as prompt references", async ({ page }) => {
  const doc = readFileSync(new URL("../docs/workbuddy-demo-scenarios.zh.md", import.meta.url), "utf8");
  const prompts = [...doc.matchAll(/```text\n([\s\S]*?)\n```/g)].map(match => match[1]);
  expect(prompts).toHaveLength(3);
  const recommended = [[], listControls().filter(c=>c.kind!=="polish").map(c=>c.kind), ["palette", "document", "connectors"]];
  await open(page);
  for (const [index, prompt] of prompts.entries()) {
    await page.getByRole("button", { name: "新建演示", exact: true }).click();
    await editor(page).fill(prompt);
    for (const control of listControls().filter(c => c.kind !== "polish")) {
      await expect(chip(page, control.kind)).toBeVisible();
    }
    await expect(page.locator(".demo-polish-slot")).toContainText("整理结构");
    const kinds = await page.locator('.sentence-token[data-origin="recommended"]').evaluateAll(nodes => [...new Set(nodes.map(node => (node as HTMLElement).dataset.kind))].sort());
    expect(kinds).toEqual([...recommended[index]].sort());
    await chip(page, "capture").click();
    await expect(page.getByText("添加参考素材：截图用于参考视觉效果，录屏用于参考操作流程与交互动画。确认后加入当前草稿。", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "关闭辅助输入", exact: true }).click();
  }
});
test("explicit user intent and inferred recommendations coexist, animate once and restore", async ({
  page,
}) => {
  await open(page);
  await editor(page).fill(mixedExample.zh);
  await expect(
    page.locator(".sentence-token[data-origin=recommended]"),
  ).toHaveCount(5);
  await expect(chip(page, "duration")).toHaveAttribute(
    "data-origin",
    "explicit",
  );
  await expect(
    page.locator(".sentence-token[data-kind=color][data-origin=explicit]"),
  ).toHaveCount(2);
  await expect(chip(page, "expert")).toHaveAttribute("data-sweep", "true");
  await expect(chip(page, "expert")).not.toHaveAttribute("data-sweep", "true", {
    timeout: 4000,
  });
  await editor(page).fill(mixedExample.zh + "再讲一下优势。");
  await expect(chip(page, "expert")).not.toHaveAttribute("data-sweep", "true");
  await chip(page, "expert").click();
  await expect(page.locator(".demo-control-grid").first()).toBeVisible();
  await expect(chip(page, "expert")).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "内容创作专家", exact: true }).click();
  await expect(chip(page, "expert")).toHaveAttribute("data-origin", "manual");
  await page.getByRole("button", { name: "关闭辅助输入" }).click();
  await page
    .getByRole("button", { name: "移除推荐 温暖自然", exact: true })
    .click();
  await expect(chip(page, "palette")).toHaveCount(0);
  await editor(page).fill(mixedExample.zh + "再讲一下优势。补充受众。");
  await expect(chip(page, "palette")).toHaveCount(0);
  await page.reload();
  await expect(chip(page, "palette")).toHaveCount(0);
  await expect(chip(page, "expert")).toContainText("内容创作专家");
  await expect(chip(page, "skills")).not.toHaveAttribute("data-sweep", "true");
});
test("all fourteen controls are reachable from the shared registry without starting capture", async ({
  page,
}) => {
  await open(page, "en");
  let permissionCalls = 0;
  await page.exposeFunction("permissionProbe", () => permissionCalls++);
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      (window as any).permissionProbe();
      throw Error("blocked");
    };
    navigator.mediaDevices.getDisplayMedia = async () => {
      (window as any).permissionProbe();
      throw Error("blocked");
    };
  });
  const index = page.getByRole("complementary", { name: "Input controls" });
  for (const control of listControls()) {
    await index.getByRole("button", { name: control.en, exact: true }).click();
    if (control.kind === "polish") {
      await expect(page.locator(".demo-polish-slot")).toBeVisible();
      continue;
    }
    await expect(page.locator("#demo-input-widget")).toBeVisible();
    await page
      .getByRole("button", { name: "Close input tool", exact: true })
      .click();
  }
  expect(permissionCalls).toBe(0);
});
test("explicit incomplete selectors remain normal; negation does not suggest; language preserves prose", async ({
  page,
}) => {
  await open(page, "en");
  const text =
    "Choose an expert and skills, a connector and a font. No warm palette.";
  await editor(page).fill(text);
  for (const kind of ["expert", "skills", "connectors", "font"])
    await expect(chip(page, kind)).toHaveAttribute("data-origin", "explicit");
  await expect(
    page.locator(".sentence-token[data-origin=recommended]"),
  ).toHaveCount(0);
  await page.locator(".demo-settings > button").click();
  await page.locator(".demo-settings select").selectOption("zh-CN");
  await page.locator(".demo-settings header button").click();
  await expect(editor(page)).toHaveAttribute("data-value", text);
});
test("capture permissions fail safely and repeated cancel keeps input", async ({
  page,
}) => {
  await open(page);
  await editor(page).fill("扫描文档，添加截图。");
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Denied", "NotAllowedError");
    };
    navigator.mediaDevices.getDisplayMedia = async () => {
      throw new DOMException("Denied", "NotAllowedError");
    };
  });
  for (const kind of ["scanner", "capture"]) {
    await chip(page, kind).click();
    await page
      .getByRole("button", {
        name: kind === "scanner" ? "打开摄像头" : "选择共享屏幕",
        exact: true,
      })
      .click();
    await expect(
      page.locator(".demo-capture-panel [role=alert]"),
    ).toBeVisible();
    await expect(page.locator(".demo-send")).toBeEnabled();
    await page.getByRole("button", { name: "关闭辅助输入" }).click();
  }
  await expect(editor(page)).toHaveAttribute(
    "data-value",
    "扫描文档，添加截图。",
  );
});
test("mock real media adapters produce owner-bound bytes and confirmed snapshots", async ({
  page,
}) => {
  await open(page, "en");
  await page.evaluate(() => {
    (window as any).testStreams = [];
    const stream = () => {
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = 360;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#cba5f4";
      ctx.fillRect(0, 0, 640, 360);
      const s = c.captureStream(24);
      (window as any).testStreams.push(s);
      return Promise.resolve(s);
    };
    navigator.mediaDevices.getUserMedia = stream;
    navigator.mediaDevices.getDisplayMedia = stream;
  });
  await editor(page).fill("Scan a document and record the screen.");
  await chip(page, "scanner").click();
  await page.getByRole("button", { name: "Open camera", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Capture", exact: true }),
  ).toBeEnabled();
  await page.screenshot({path:"artifacts/workbuddy-demo/visual-consistency-2026-11-11/after/scanner-live.png"});
  await page.getByRole("button", { name: "Capture", exact: true }).click();
  await expect(page.locator(".demo-capture-items img")).toHaveCount(1);
  await page.screenshot({path:"artifacts/workbuddy-demo/visual-consistency-2026-11-11/after/scanner-review.png"});
  await expect(
    page.getByRole("button", { name: "Confirm materials" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      (window as any).testStreams.every((s: MediaStream) =>
        s.getTracks().every((t) => t.readyState === "ended"),
      ),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Confirm materials" }).click();
  await expect(page.locator(".demo-attachments [data-capture-kind=scanner] img")).toHaveCount(1);
  await chip(page, "capture").click();
  await page.getByRole("button", { name: "Recording", exact: true }).click();
  await page.getByRole("button", { name: "Choose shared screen" }).click();
  await page
    .getByRole("button", { name: "Start recording", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /Stop ·/ })).toBeVisible();
  await page.screenshot({path:'artifacts/workbuddy-demo/visual-consistency-2026-11-11/after/capture-recording.png'});
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Stop ·/ }).click();
  await expect(page.locator(".demo-capture-items video")).toHaveCount(1);
  await page.screenshot({path:'artifacts/workbuddy-demo/visual-consistency-2026-11-11/after/capture-review.png'});
  await page.getByRole("button", { name: "Confirm materials" }).click();
  await page.reload();
  await expect(page.locator(".demo-attachments [data-capture-kind] video")).toHaveCount(1);
  const cards=page.locator('.demo-attachments .demo-material');await expect(cards).toHaveCount(2);
  const heights=await cards.locator('> button:first-child').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height));expect(new Set(heights).size).toBe(1);
  expect(await cards.locator('video').getAttribute('controls')).toBeNull();
  await cards.last().locator('> button:first-child').click();await expect(page.getByRole('dialog').locator('video[controls]')).toBeVisible();
  await page.getByRole('button',{name:'Close preview',exact:true}).click();
  await page.reload();await expect(cards).toHaveCount(2);
  await page.getByRole('button',{name:'New demo',exact:true}).click();await expect(cards).toHaveCount(0);
});
test("recommendation popovers fit bilingual large screens and reduced motion", async ({
  page,
}) => {
  await open(page);
  for (const language of ["zh", "en"]) {
    if (language === "en") {
      await page.locator(".demo-settings > button").click();
      await page.locator(".demo-settings select").selectOption("en");
      await page.locator(".demo-settings header button").click();
    }
    await editor(page).fill(mixedExample[language as "zh" | "en"]);
    for (const width of [1440, 1280, 1024]) {
      await page.setViewportSize({
        width,
        height: width === 1440 ? 960 : width === 1280 ? 800 : 768,
      });
      await chip(page, "expert").click();
      await expect(page.locator("#demo-input-widget")).toBeInViewport();
      const box = (await page.locator("#demo-input-widget").boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: `artifacts/workbuddy-demo/evidence/controls-${language}-${width}.png`,
      });
      await page
        .getByRole("button", {
          name: language === "en" ? "Close input tool" : "关闭辅助输入",
          exact: true,
        })
        .click();
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await editor(page).fill("Make it feel fresh and simple.");
  expect(
    await chip(page, "palette").evaluate(
      (e: Element) => getComputedStyle(e, "::after").animationName,
    ),
  ).toBe("none");
});
test("old drafts do not silently acquire recommended materials on upgrade", async ({
  page,
}) => {
  await open(page);
  await editor(page).fill("保留旧草稿");
  await expect(page.getByRole("status", { name: "保存状态" })).toContainText(
    "保存在这台电脑",
  );
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.open("workbuddy-standalone-controls-v1", 1);
      r.onsuccess = () => {
        const db = r.result,
          tx = db.transaction("state", "readwrite"),
          store = tx.objectStore("state"),
          get = store.get("current");
        get.onsuccess = () => {
          const state = get.result,
            d = state.drafts[0];
          d.text = "需要一些相关资料，专业人士帮我看看";
          delete d.controls;
          delete d.dismissedControls;
          store.put(state, "current");
        };
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      r.onerror = () => reject(r.error);
    });
  });
  await page.reload();
  await expect(editor(page)).toHaveAttribute(
    "data-value",
    "需要一些相关资料，专业人士帮我看看",
  );
  await expect(
    page.locator(".sentence-token[data-origin=recommended]"),
  ).toHaveCount(0);
  await expect(page.locator(".demo-attachments")).toHaveCount(0);
});
test("cancelling an asynchronous capture ignores late bytes", async ({
  page,
}) => {
  await open(page, "en");
  await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 180;
    c.getContext("2d")!.fillRect(0, 0, 320, 180);
    navigator.mediaDevices.getUserMedia = async () => {
      const s = c.captureStream(24);
      const tick = setInterval(() => {
        if (s.getVideoTracks()[0].readyState === "ended") clearInterval(tick);
        else c.getContext("2d")!.fillRect(0, 0, 320, 180);
      }, 30);
      return s;
    };
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      original.call(
        this,
        (blob) => {
          (window as any).finishCapture = () => callback(blob);
        },
        type,
        quality,
      );
    };
  });
  await editor(page).fill("Scan a document.");
  await chip(page, "scanner").click();
  await page.getByRole("button", { name: "Open camera", exact: true }).click();
  await page.getByRole("button", { name: "Capture", exact: true }).click();
  await page.waitForFunction(
    () => typeof (window as any).finishCapture === "function",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.evaluate(() => (window as any).finishCapture());
  await expect(page.locator(".demo-capture-items img")).toHaveCount(0);
  await expect(page.locator(".demo-send")).toBeEnabled();
});

for (const language of ["zh", "en"]) {
  test(`WorkBuddy original capability artwork ${language}`, async ({ page }) => {
    await open(page, language);
    for (const [kind, label, count] of [
      ["expert", language === "en" ? "Expert" : "专家", 6],
      ["skills", language === "en" ? "Skills" : "技能", 4],
    ] as const) {
      await page.locator(".demo-controls-index").getByRole("button", {name:label,exact:true}).click();
      const cards = page.locator(".demo-control-grid .demo-control-option");
      await expect(cards).toHaveCount(count);
      await expect(page.locator(".demo-control-grid .demo-choice-art")).toHaveCount(count);
      expect(await page.locator(".demo-choice-art").evaluateAll(nodes => nodes.every(node => {
        const img=node as HTMLImageElement;
        return img.complete && img.naturalWidth > 0 && img.getBoundingClientRect().width === 24 && img.getBoundingClientRect().height === 24;
      }))).toBe(true);
      await page.locator('.demo-widget-wrap').screenshot({path:`artifacts/workbuddy-demo/visual-consistency-2026-11-11/after/capability-artwork-${kind}-${language}.png`});
      // All original artwork cards retain their actual selection action.
      for(let i=0;i<count;i++) {
        await cards.nth(i).click();
        await expect(cards.nth(i)).toHaveAttribute('aria-pressed','true');
        if(kind==='skills' && i<count-1) await cards.nth(i).click();
      }
      const selectedName=await cards.last().getAttribute('aria-label');
      const source=await cards.last().locator('img.demo-choice-art').getAttribute('src');
      await page.getByRole('button',{name:language==='en'?'Done':'完成选择',exact:true}).click();
      await expect(chip(page,kind)).toContainText(selectedName!);
      await expect(chip(page,kind).locator('.sentence-icon')).toHaveAttribute('src',source!);
      expect(await chip(page,kind).locator('.sentence-icon').evaluate(node=>node.getBoundingClientRect().width)).toBe(18);
      expect(await chip(page,kind).locator('.sentence-icon').evaluate(node=>getComputedStyle(node).filter)).toBe('none');
      await page.reload();
      await expect(chip(page,kind).locator('.sentence-icon')).toHaveAttribute('src',source!);
    }
  });
}

test("debug controls are off by default and the settings switch remembers both states", async ({ page }) => {
  await page.goto("/?controls=all&language=en");
  const gallery = page.getByRole("complementary", { name: "Input controls" });
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  const toggle = page.getByRole("switch", { name: "Show debug controls" });
  await expect(editor(page)).toBeVisible();
  await expect(gallery).toHaveCount(0);

  await settings.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.press("Space");
  await expect(gallery).toBeVisible();
  await page.reload();
  await expect(gallery).toBeVisible();

  await settings.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(gallery).toHaveCount(0);
  await page.reload();
  await expect(editor(page)).toBeVisible();
  await expect(gallery).toHaveCount(0);
});

test('three debug examples create distinct drafts; paste, copy and edits retain source and ownership',async({page})=>{
 await open(page);
 await editor(page).fill('保留用户原来的草稿。');
 const sidebar=page.locator('.wb-sidebar');
 for(const scenario of demoScenarios){
   await page.getByRole('button',{name:scenario.zh,exact:true}).click();
   await expect(editor(page)).toHaveAttribute('data-value',scenario.text);
   await expect(chip(page,'font')).toBeVisible();
   if(scenario.id==='recommended'){expect(await editor(page).textContent()).toContain('简短的演讲报告10分钟');expect(await editor(page).textContent()).not.toContain('（推荐');}
   const copied=await editor(page).evaluate(node=>{
     (node as HTMLElement).focus();const range=document.createRange();range.selectNodeContents(node);const selection=getSelection()!;selection.removeAllRanges();selection.addRange(range);
     const data=new DataTransfer();node.dispatchEvent(new ClipboardEvent('copy',{clipboardData:data,bubbles:true,cancelable:true}));return data.getData('text/plain');
   });
   expect(copied).toBe(scenario.text);
   await editor(page).evaluate((node,text)=>{const data=new DataTransfer();data.setData('text/plain',text);node.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},scenario.text);
   await page.keyboard.type('!');
   await expect(editor(page)).toHaveAttribute('data-value',scenario.text+'!');
 }
 await page.reload();await expect(editor(page)).toHaveAttribute('data-value',demoScenarios[2].text+'!');
 await expect(page.getByText('保留用户原来的草稿。',{exact:true})).toBeVisible();
 await page.getByText('保留用户原来的草稿。',{exact:true}).click();
 await expect(editor(page)).toHaveAttribute('data-value','保留用户原来的草稿。');
 await expect(page.locator('.demo-attachment')).toHaveCount(0);
});

test('suggested values remain editable and reach a frozen mocked Send with actual reference bytes only',async({page})=>{
 await open(page);await page.getByRole('button',{name:'模糊推荐',exact:true}).click();
 await expect(page.locator('.sentence-token-capsule[data-origin=recommended]:not([data-preparing])')).toHaveCount(15);
 await chip(page,'duration').click();
 const number=page.locator('.demo-duration-row input');await number.fill('14');await number.blur();
 await page.getByRole('button',{name:'关闭辅助输入',exact:true}).click();
 await expect(chip(page,'duration')).toContainText('14分钟');
 await expect(chip(page,'duration')).toHaveAttribute('data-origin','manual');
 const payloads:any[]=[];
 await page.route('**/api/workbuddy-demo/generate',r=>{payloads.push(r.request().postDataJSON());return r.fulfill({contentType:'application/x-ndjson',body:JSON.stringify({artifact:{id:'doc',kind:'document',title:'Fixture',model:'mock',markdown:'# Fixture'}})+'\n'+JSON.stringify({done:true})+'\n'});});
 await page.locator('.demo-send').click();await expect.poll(()=>payloads.length).toBe(1);
 expect(payloads[0].parameters.filter((p:any)=>p.kind==='color').map((p:any)=>p.value)).toEqual(['#5267B2','#F4F6FC','#202637']);
 expect(payloads[0].parameters.find((p:any)=>p.kind==='duration').value).toBe('14');
 expect(payloads[0].sources).toHaveLength(1);
 await expect(editor(page)).toHaveAttribute('data-value',demoScenarios[1].text);
 await expect(chip(page,'duration')).toContainText('14分钟');
 await page.reload();await expect(chip(page,'duration')).toContainText('14分钟');
 await page.getByRole('button',{name:'移除推荐 手绘画板',exact:true}).click();
 await expect(chip(page,'sketch')).toHaveCount(0);
 await editor(page).press('End');await page.keyboard.type('补充说明。');
 await expect(chip(page,'sketch')).toHaveCount(0);
});

test('all official scenarios survive progressive and revised browser speech callbacks',async({page})=>{
 await page.addInitScript(()=>{
   (window as any).SpeechRecognition=class {
     onstart:any;onend:any;onresult:any;onerror:any;
     constructor(){(window as any).__scenarioSpeech=this;}
     start(){this.onstart?.();} stop(){this.onend?.();} abort(){}
   };
 });
 await open(page);
 for(const scenario of demoScenarios){
   await page.getByRole('button',{name:'新建演示',exact:true}).click();
   await page.getByRole('button',{name:'开始语音输入',exact:true}).click();
   for(let i=25;i<scenario.text.length+25;i+=25){
     await page.evaluate(text=>(window as any).__scenarioSpeech.onresult({resultIndex:0,results:[{isFinal:false,0:{transcript:text}}]}),scenario.text.slice(0,i));
   }
   await expect(editor(page)).toHaveAttribute('data-value',scenario.text);
   await expect(page.locator('.sentence-token[data-origin=recommended]')).toHaveCount(0);
   const revised=scenario.text.replace('客户成功团队','销售培训团队');
   for(let i=0;i<2;i++)await page.evaluate(text=>(window as any).__scenarioSpeech.onresult({resultIndex:0,results:[{isFinal:false,0:{transcript:text}}]}),revised);
   await expect(editor(page)).toHaveAttribute('data-value',revised);
   await page.getByRole('button',{name:'停止语音输入',exact:true}).click();
   for(const kind of listControls().filter(c=>c.kind!=='polish'))await expect(chip(page,kind.kind)).toBeVisible();
   await chip(page,'font').click();await expect(page.locator('.demo-widget-wrap')).toBeVisible();
   await page.getByRole('button',{name:'关闭辅助输入',exact:true}).click();
 }
});

test('removing an explicit built-in material keeps its input entry and no stale attachment',async({page})=>{
 await open(page);await page.getByRole('button',{name:'明确意图',exact:true}).click();
 await page.getByRole('button',{name:'移除 产品介绍 · Product brief.md',exact:true}).click();
 await expect(chip(page,'document')).toBeVisible();
 await expect(page.locator('.demo-attachment')).toHaveCount(0);
 await editor(page).press('End');await page.keyboard.type('继续。');
 await expect(page.locator('.demo-attachment')).toHaveCount(0);
 await chip(page,'document').click();
 const chooserPromise=page.waitForEvent('filechooser');
 await page.getByRole('button',{name:'选择本地文件',exact:true}).click();
 const chooser=await chooserPromise;await chooser.setFiles({name:'training-reference.md',mimeType:'text/markdown',buffer:Buffer.from('# Test reference')});
 await page.getByRole('button',{name:'关闭辅助输入',exact:true}).click();
 await expect(chip(page,'document')).toContainText('training-reference.md');
 await page.getByRole('button',{name:'移除 training-reference.md',exact:true}).click();
 await expect(chip(page,'document')).not.toContainText('training-reference.md');
});
