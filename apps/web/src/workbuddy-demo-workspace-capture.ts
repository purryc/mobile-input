import type {Crop} from "@mobile-input/controls";

function drawRegion(
  canvas: HTMLCanvasElement,
  region: Crop,
  elapsedSec = 0,
): boolean {
  const vw = Math.max(320, window.innerWidth || 1280);
  const vh = Math.max(240, window.innerHeight || 800);
  const sx = Math.round(region.x * vw);
  const sy = Math.round(region.y * vh);
  const sw = Math.max(24, Math.round(region.w * vw));
  const sh = Math.max(24, Math.round(region.h * vh));

  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const bgGrad = ctx.createLinearGradient(0, 0, sw, sh);
  bgGrad.addColorStop(0, "#f8f9fe");
  bgGrad.addColorStop(0.5, "#ffffff");
  bgGrad.addColorStop(1, "#f3f4fc");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, sw, sh);

  const elements = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".wb-sidebar, .wb-main, .demo-composer, .live-wb-composer, .ic-sentence-token-capsule, .ic-sentence-token, .wb-scenes button, .widget-example, .live-wb-aux, .demo-control-option, h1, h2, b, p, span, img",
    ),
  );

  for (const el of elements) {
    if (el.closest(".ic-demo-screen-selector-overlay")) continue;
    const rect = el.getBoundingClientRect();
    if (
      rect.width < 2 ||
      rect.height < 2 ||
      rect.right < sx ||
      rect.left > sx + sw ||
      rect.bottom < sy ||
      rect.top > sy + sh
    ) {
      continue;
    }
    const style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0
    ) {
      continue;
    }

    const dx = rect.left - sx;
    const dy = rect.top - sy;
    const dw = rect.width;
    const dh = rect.height;
    const radius = Math.min(
      dw / 2,
      dh / 2,
      parseFloat(style.borderTopLeftRadius) || 0,
    );

    const bg = style.backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      ctx.save();
      ctx.beginPath();
      if (radius > 0 && "roundRect" in ctx) {
        ctx.roundRect(dx, dy, dw, dh, radius);
      } else {
        ctx.rect(dx, dy, dw, dh);
      }
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.restore();
    }

    const borderW = parseFloat(style.borderTopWidth) || 0;
    const borderColor = style.borderTopColor;
    if (
      borderW > 0 &&
      borderColor &&
      borderColor !== "rgba(0, 0, 0, 0)" &&
      borderColor !== "transparent"
    ) {
      ctx.save();
      ctx.beginPath();
      if (radius > 0 && "roundRect" in ctx) {
        ctx.roundRect(dx, dy, dw, dh, radius);
      } else {
        ctx.rect(dx, dy, dw, dh);
      }
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = Math.min(2, borderW);
      ctx.stroke();
      ctx.restore();
    }

    if (el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0) {
      try {
        ctx.drawImage(el, dx, dy, dw, dh);
      } catch {
        // Ignore cross-origin image draw errors
      }
    }

    if (
      el.childNodes.length === 1 &&
      el.firstChild?.nodeType === Node.TEXT_NODE &&
      el.textContent?.trim()
    ) {
      const text = el.textContent.trim();
      const fontSize = parseFloat(style.fontSize) || 14;
      ctx.save();
      ctx.font = `${style.fontWeight || 400} ${fontSize}px ${style.fontFamily || "sans-serif"}`;
      ctx.fillStyle = style.color || "#182431";
      ctx.textBaseline = "middle";
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      ctx.fillText(
        text.slice(0, 48),
        dx + paddingLeft,
        dy + dh / 2,
        Math.max(16, dw - paddingLeft * 2),
      );
      ctx.restore();
    }
  }

  ctx.save();
  ctx.strokeStyle =
    elapsedSec > 0 ? "rgba(98, 102, 223, 0.45)" : "rgba(98, 102, 223, 0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, sw - 2, sh - 2);
  if (elapsedSec > 0) {
    const pulseX = 16 + ((elapsedSec * 48) % Math.max(24, sw - 32));
    ctx.fillStyle = "rgba(98, 102, 223, 0.18)";
    ctx.beginPath();
    ctx.arc(pulseX, sh - 10, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  return true;
}

interface WorkspaceCaptureAdapter {
  readonly useSystemToolbar: boolean;
  drawRegion(canvas: HTMLCanvasElement, region: Crop, elapsedSeconds?: number): boolean;
  requestSystemCapture(options?: {mode: 'screenshot' | 'recording'; language: 'en' | 'zh'}, signal?: AbortSignal): Promise<
    {kind: 'screenshot'; blob: Blob} | {kind: 'cancelled' | 'record' | 'unavailable'}
  >;
}

export const workspaceCapture: WorkspaceCaptureAdapter = {
  drawRegion,
  async requestSystemCapture(options, signal) {
    const response = await fetch("/api/workbuddy-demo/system-capture", {
      method: "POST", signal,
      ...(options && {headers: {"Content-Type": "application/json"}, body: JSON.stringify({mode:options.mode,lang:options.language,showTopBar:true})}),
    });
    if (!response.ok) return {kind:"unavailable"};
    const result = await response.json();
    if (result.cancelled) return {kind:"cancelled"};
    if (result.action === "record") return {kind:"record"};
    if (!result.ok || typeof result.data !== "string") return {kind:"unavailable"};
    const bytes = Uint8Array.from(atob(result.data), character => character.charCodeAt(0));
    return {kind:"screenshot", blob:new Blob([bytes], {type:"image/png"})};
  },
  get useSystemToolbar() { return !navigator.webdriver; },
};
