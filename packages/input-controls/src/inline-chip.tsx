import type { ChipSemanticState } from "./types";
import { useLayoutEffect, useRef } from "react";
import { assetUrl, useWidgetEnvironment } from "./environment";

export interface InlineChipToken {
  semanticState?: ChipSemanticState;
  id: string;
  kind: string;
  role: string;
  phrase: string;
  label: string;
  value: string;
  /** Additional bound materials after the name displayed on the chip. */
  additionalObjectCount?: number;
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
  describedBy?: string;
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
  describedBy,
  containedRemove = true,
  language,
  uiText,
  assetBase,
  sweepStarts,
  onOpen,
  onRemove,
  preserveSelection,
}: InlineChipOptions): HTMLSpanElement {
  const semanticState = token.semanticState ?? "default-selected";
  const removable = semanticState !== "object-bound" && token.removable;
  const additionalCount = semanticState === "object-bound" ? token.additionalObjectCount ?? 0 : 0;
  const english = language.startsWith("en");
  const additionalLabel = additionalCount > 0
    ? english ? ` and ${additionalCount} more` : `，另有 ${additionalCount} 项`
    : "";
  const role = uiText(token.role);
  const description = (role && role !== token.label ? role + " " : "") + token.label + additionalLabel;
  const hit = document.createElement("span");
  hit.dataset.semanticState = semanticState;
  hit.className = "ic-sentence-token-hit";
  hit.dataset.source = token.phrase;
  hit.contentEditable = "false";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ic-sentence-token";
  button.disabled = disabled;
  button.dataset.kind = token.kind;
  button.dataset.parameterId = token.id;
  button.setAttribute("aria-expanded", String(expanded));
  if (expanded && controlsId) button.setAttribute("aria-controls", controlsId);
  button.dataset.state = semanticState;
  button.dataset.semanticState = semanticState;
  if (token.origin) button.dataset.origin = token.origin;
  button.setAttribute("aria-label", description);
  if (describedBy) button.setAttribute("aria-describedby", describedBy);
  const face = document.createElement("span");
  face.className = "ic-sentence-token-face";
  if (token.kind === "color" && /^#[0-9A-Fa-f]{6}$/.test(token.value)) {
    const swatch = document.createElement("i");
    swatch.className = "ic-sentence-swatch";
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
    icon.className = "ic-sentence-icon";
    face.append(icon);
  }
  if (token.iconSrc) {
    const icon = document.createElement("img");
    icon.src = token.iconSrc;
    icon.alt = "";
    icon.className = "ic-sentence-icon";
    face.prepend(icon);
  } else if (token.iconPath) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.7");
    svg.classList.add("ic-demo-chip-icon");
    const path = document.createElementNS(svg.namespaceURI, "path");
    path.setAttribute("d", token.iconPath);
    svg.append(path);
    face.prepend(svg);
  }
  const label = document.createElement("span");
  label.className = "ic-demo-chip-label";
  label.textContent = token.label;
  face.append(label);
  if (additionalCount > 0) {
    const count = document.createElement("span");
    count.className = "ic-chip-object-count";
    count.textContent = `+${additionalCount}`;
    count.setAttribute("aria-hidden", "true");
    face.append(count);
  }
  if (semanticState === "ambiguous-recommendation") {
    const star = document.createElement("span");
    star.className = "ic-demo-chip-smart";
    if (token.recommendationIconSrc) {
      const icon = document.createElement("img");
      icon.src = token.recommendationIconSrc;
      icon.alt = "";
      star.append(icon);
    } else star.textContent = "✧";
    star.setAttribute("aria-hidden", "true");
    face.append(star);
  }
  if (semanticState === "needs-input") {
    const plus = document.createElement("span"); plus.className = "ic-chip-needs-plus"; plus.textContent = "+"; plus.setAttribute("aria-hidden", "true"); face.append(plus);
  }
  button.append(face);
  button.title = semanticState === "object-bound" ? description : containedRemove
    ? `${uiText(token.role)} ${token.label}`
    : token.label;
  if (semanticState !== "object-bound" && !token.preparing && token.animate && token.sweepKey) {
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
    if (preserveSelection) { e.preventDefault(); preserveSelection(); }
  };
  button.onclick = () => onOpen();
  if (token.prefix) hit.append(document.createTextNode(token.prefix));
  const contained = containedRemove && (removable || token.preparing);
  const capsule = contained ? document.createElement("span") : hit;
  if (contained) {
    capsule.className = "ic-sentence-token-capsule";
    capsule.dataset.semanticState = semanticState;
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
  if (removable && onRemove) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ic-demo-chip-remove";
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
      (english ? "Remove " : "移除 ") +
        token.label,
    );
    remove.disabled = disabled;
    remove.onpointerdown = (e) => { if (preserveSelection) e.preventDefault(); };
    remove.onclick = () => onRemove?.();
    capsule.append(remove);
  }
  if (token.preparing) {
    capsule.dataset.preparing = "true";
    capsule.setAttribute("role", "img");
    capsule.setAttribute(
      "aria-label",
      english ? "Preparing suggestion" : "正在整理建议",
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
  const latest = useRef(props); latest.current = props;
  const visualKey = JSON.stringify([props.token, props.disabled, props.expanded, props.controlsId, props.describedBy, props.containedRemove, Boolean(props.onRemove), Boolean(props.preserveSelection), language, assetBase, translate(props.token.role)]);
  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    const focused = node.contains(document.activeElement)
      ? document.activeElement
      : null;
    const focusSelector = focused?.matches(".ic-demo-chip-remove")
      ? ".ic-demo-chip-remove"
      : ".ic-sentence-token";
    node.replaceChildren(
      renderInlineChip({
        ...latest.current,
        onOpen: () => latest.current.onOpen(),
        onRemove: latest.current.onRemove ? () => latest.current.onRemove?.() : undefined,
        preserveSelection: latest.current.preserveSelection ? () => latest.current.preserveSelection?.() : undefined,
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
  }, [visualKey]);
  return <span ref={root} />;
}
