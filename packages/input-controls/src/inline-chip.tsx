import { useLayoutEffect, useRef } from "react";
import { assetUrl, useWidgetEnvironment } from "./environment";

export interface InlineChipToken {
  id: string;
  kind: string;
  role: string;
  phrase: string;
  label: string;
  value: string;
  manual?: boolean;
  origin?: "explicit" | "recommended" | "manual";
  sweepKey?: string;
  animate?: boolean;
  iconSrc?: string;
  iconPath?: string;
  recommendationIconSrc?: string;
  removable?: boolean;
  preparing?: boolean;
  prefix?: string;
  suffix?: string;
}
export interface InlineChipOptions {
  token: InlineChipToken;
  disabled?: boolean;
  expanded: boolean;
  controlsId?: string;
  containedRemove?: boolean;
  language: string;
  uiText: (label: string) => string;
  assetBase: string;
  sweepStarts: Map<string, number>;
  onOpen: () => void;
  onRemove?: () => void;
  preserveSelection?: () => void;
}
/** Mount inside the editor-owned DOM without letting React rewrite selection offsets. */
export function renderInlineChip({
  token,
  disabled = false,
  expanded,
  controlsId,
  containedRemove = true,
  language,
  uiText,
  assetBase,
  sweepStarts,
  onOpen,
  onRemove,
  preserveSelection,
}: InlineChipOptions): HTMLSpanElement {
  const hit = document.createElement("span");
  hit.className = "sentence-token-hit";
  hit.dataset.source = token.phrase;
  hit.contentEditable = "false";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "sentence-token";
  button.disabled = disabled;
  button.dataset.kind = token.kind;
  button.dataset.parameterId = token.id;
  button.setAttribute("aria-expanded", String(expanded));
  if (expanded && controlsId) button.setAttribute("aria-controls", controlsId);
  button.dataset.state = token.manual ? "default" : "suggested";
  if (token.origin) button.dataset.origin = token.origin;
  button.setAttribute(
    "aria-label",
    `${uiText(token.kind === "photo" ? "图片" : token.role)} ${token.label}`,
  );
  button.setAttribute("aria-pressed", String(expanded));
  const face = document.createElement("span");
  face.className = "sentence-token-face";
  if (token.kind === "color" && /^#[0-9A-Fa-f]{6}$/.test(token.value)) {
    const swatch = document.createElement("i");
    swatch.className = "sentence-swatch";
    swatch.style.background = token.value;
    face.append(swatch);
  } else if (
    !token.iconSrc &&
    ["document", "photo", "sketch"].includes(token.kind)
  ) {
    const icon = document.createElement("img");
    icon.src = assetUrl(
      assetBase,
      `assets/figma/sentence-parameters/${token.kind === "document" ? "file" : token.kind === "photo" ? "photo" : "canvas"}.svg`,
    );
    icon.alt = "";
    icon.className = "sentence-icon";
    face.append(icon);
  }
  if (token.iconSrc) {
    const icon = document.createElement("img");
    icon.src = token.iconSrc;
    icon.alt = "";
    icon.className = "sentence-icon";
    face.prepend(icon);
  } else if (token.iconPath) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.7");
    svg.classList.add("demo-chip-icon");
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", token.iconPath);
    svg.append(path);
    face.prepend(svg);
  }
  const label = document.createElement("span");
  label.className = "demo-chip-label";
  label.textContent = token.label;
  face.append(label);
  if (token.origin === "recommended") {
    const star = document.createElement("span");
    star.className = "demo-chip-smart";
    if (token.recommendationIconSrc) {
      const icon = document.createElement("img");
      icon.src = token.recommendationIconSrc;
      icon.alt = "";
      star.append(icon);
    } else star.textContent = "✧";
    star.setAttribute("aria-hidden", "true");
    face.append(star);
  }
  button.append(face);
  button.title = containedRemove
    ? `${uiText(token.role)} ${token.label}`
    : token.label;
  if (!token.preparing && token.animate && token.sweepKey) {
    const key = token.sweepKey;
    let started = sweepStarts.get(key);
    if (started === undefined) {
      started = performance.now();
      sweepStarts.set(key, started);
    }
    const elapsed = performance.now() - started;
    if (elapsed < 1400) {
      button.dataset.sweep = "true";
      button.style.setProperty("--sweep-delay", `-${elapsed}ms`);
    }
  }
  button.onpointerdown = (e) => {
    e.preventDefault();
    preserveSelection?.();
  };
  button.onclick = () => onOpen();
  if (token.prefix) hit.append(document.createTextNode(token.prefix));
  const contained = containedRemove && (token.removable || token.preparing);
  const capsule = contained ? document.createElement("span") : hit;
  if (contained) {
    capsule.className = "sentence-token-capsule";
    if (token.origin) capsule.dataset.origin = token.origin;
    capsule.dataset.expanded = String(expanded);
    if (button.dataset.sweep) {
      capsule.dataset.sweep = "true";
      capsule.style.setProperty(
        "--sweep-delay",
        button.style.getPropertyValue("--sweep-delay"),
      );
    }
    hit.append(capsule);
  }
  capsule.append(button);
  if (token.removable && onRemove) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "demo-chip-remove";
    if (contained) {
      const icon = document.createElement("img");
      icon.src = assetUrl(
        assetBase,
        "reference-assets/workbuddy-widgets/close.svg",
      );
      icon.alt = "";
      remove.append(icon);
    } else remove.textContent = "×";
    remove.setAttribute(
      "aria-label",
      (language === "en" ? "Remove recommendation " : "移除推荐 ") +
        token.label,
    );
    if (contained) remove.disabled = disabled;
    remove.onpointerdown = (e) => e.preventDefault();
    remove.onclick = () => onRemove?.();
    capsule.append(remove);
  }
  if (token.preparing) {
    capsule.dataset.preparing = "true";
    capsule.setAttribute("role", "img");
    capsule.setAttribute(
      "aria-label",
      language === "en" ? "Preparing suggestion" : "正在整理建议",
    );
    capsule.setAttribute("aria-busy", "true");
    capsule.querySelectorAll("button").forEach((b) => {
      b.disabled = true;
      b.tabIndex = -1;
      b.setAttribute("aria-hidden", "true");
    });
  }
  if (token.suffix) hit.append(document.createTextNode(token.suffix));
  return hit;
}

/** Standalone React preview of the same chip renderer used in the editor. */
export function InlineChip(
  props: Omit<
    InlineChipOptions,
    "language" | "uiText" | "assetBase" | "sweepStarts"
  >,
) {
  const root = useRef<HTMLSpanElement>(null),
    sweepStarts = useRef(new Map<string, number>());
  const { language, translate, assetBase } = useWidgetEnvironment();
  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    const focused = node.contains(document.activeElement)
      ? document.activeElement
      : null;
    const focusSelector = focused?.matches(".demo-chip-remove")
      ? ".demo-chip-remove"
      : ".sentence-token";
    node.replaceChildren(
      renderInlineChip({
        ...props,
        language,
        uiText: translate,
        assetBase,
        sweepStarts: sweepStarts.current,
      }),
    );
    if (focused)
      node
        .querySelector<HTMLElement>(focusSelector)
        ?.focus({ preventScroll: true });
  });
  return <span ref={root} />;
}
