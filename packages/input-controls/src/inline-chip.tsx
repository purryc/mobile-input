import type { ChipSemanticState } from "./types";
import { useLayoutEffect, useRef } from "react";
import { opticalIcon } from "./optical-icons";
import { useWidgetEnvironment } from "./environment";

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
  size?: "inline" | "specimen";
  surfaceContext?: "composer" | "artifact";
  language: string;
  uiText: (label: string) => string;
  assetBase: string;
  sweepStarts: Map<string, number>;
  onOpen: () => void;
  onRemove?: () => void;
  /** Removes only the material named by an object-bound chip. */
  onRemoveMaterial?: () => void;
  preserveSelection?: () => void;
}
function layer(name: string, decorative = true) {
  const el = document.createElement("span");
  el.className = name;
  if (decorative) el.setAttribute("aria-hidden", "true");
  return el;
}

let dashSequence = 0;
function dashedEdge() {
  const id = "ic-optical-dash-" + ++dashSequence;
  const template = document.createElement("template");
  // SVG geometry percentages resolve against the actual chip, including after a font loads.
  template.innerHTML = `<svg aria-hidden="true" class="ic-optical-dash" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%"/><stop offset="100%"/></linearGradient></defs><rect x=".75" y=".75" rx="11.25" ry="11.25" fill="none" stroke="url(#${id})" stroke-dasharray="4 3.2" stroke-linecap="round"/></svg>`;
  return template.content.firstElementChild!;
}

function leadingVisual(token: InlineChipToken) {
  if (token.kind === "color" && /^#[0-9a-f]{6}$/i.test(token.value)) {
    const swatch = layer("ic-optical-swatch");
    swatch.style.backgroundColor = token.value;
    return swatch;
  }
  if (token.iconSrc) {
    const image = document.createElement("img");
    image.src = token.iconSrc;
    image.alt = "";
    image.className = "ic-optical-entity";
    return image;
  }
  const kind = ({skills:"skill", connectors:"link", formats:"document", color:"palette"} as Record<string,string>)[token.kind] ?? token.kind;
  const icon = opticalIcon(kind, "ic-optical-entity");
  if (token.iconPath) {
    icon.replaceChildren();
    icon.setAttribute("viewBox","0 0 24 24");
    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d",token.iconPath);
    path.setAttribute("stroke","currentColor");
    path.setAttribute("stroke-width","1.7");
    icon.append(path);
  }
  return icon;
}

const graphemes = new Intl.Segmenter(undefined, {granularity: "grapheme"});

function materialLabel(name: string) {
  let count = 0;
  for (const {index} of graphemes.segment(name)) {
    if (count++ === 6) return name.slice(0, index) + "...";
  }
  return name;
}

/** Synchronous editor DOM and standalone React share this optical surface. */
export function renderInlineChip(options: InlineChipOptions): HTMLSpanElement {
  const {token, expanded, disabled = false, language, uiText, sweepStarts, containedRemove = true} = options;
  const semantic = token.semanticState ?? "default-selected";
  const state = token.preparing ? "preparing" : expanded ? "expanded" : semantic;
  const english = language.startsWith("en");
  const remove = semantic === "object-bound" ? options.onRemoveMaterial : token.removable ? options.onRemove : undefined;
  const hit = layer("ic-sentence-token-hit", false);
  hit.contentEditable = "false";
  hit.dataset.semanticState = semantic;
  hit.dataset.source = token.phrase;
  if (token.prefix) hit.append(token.prefix);

  const surface = layer("ic-chip-surface ic-sentence-token-capsule", false);
  surface.dataset.optical = state;
  surface.dataset.semanticState = semantic;
  surface.dataset.expanded = String(expanded);
  surface.dataset.size = options.size ?? "inline";
  surface.dataset.context = options.surfaceContext ?? "composer";
  surface.dataset.motion = String(token.animate !== false);
  hit.append(surface);
  const key = token.sweepKey ?? token.id;
  const preparingKey = "preparing:" + key;
  if (state === "preparing" || state === "ambiguous-recommendation") {
    const now = performance.now();
    if (state === "preparing" && sweepStarts.delete(key)) sweepStarts.delete(preparingKey);
    const clock = state === "preparing" ? preparingKey : key;
    const start = sweepStarts.get(clock) ?? now;
    sweepStarts.set(clock, start);
    surface.style.setProperty("--ic-phase", (start - now) + "ms");
    const preparingStart = sweepStarts.get(preparingKey);
    if (preparingStart !== undefined) {
      surface.style.setProperty("--ic-shell-phase", (preparingStart - now) + "ms");
      if (state === "ambiguous-recommendation") {
        surface.dataset.fromLoading = "true";
        surface.style.setProperty("--ic-loading-phase", (preparingStart - start) + "ms");
      }
    }
  } else if (state !== "expanded") {
    sweepStarts.delete(preparingKey);
  }

  const core = layer("ic-optical-core", false);
  surface.append(core);
  if (state === "needs-input") core.append(dashedEdge());
  if (state === "default-selected" || state === "object-bound" || state === "ambiguous-recommendation") {
    core.append(layer("ic-optical-fresnel"));
  }
  if (state === "ambiguous-recommendation") core.append(layer("ic-optical-well"),layer("ic-optical-mist"),layer("ic-optical-drift"));

  const button = document.createElement("button");
  button.type = "button";
  button.className = "ic-sentence-token";
  button.dataset.kind = token.kind;
  button.dataset.parameterId = token.id;
  button.dataset.state = button.dataset.semanticState = semantic;
  if (token.origin) button.dataset.origin = surface.dataset.origin = token.origin;
  button.disabled = disabled || Boolean(token.preparing);
  button.setAttribute("aria-expanded", String(expanded));
  if (expanded && options.controlsId) button.setAttribute("aria-controls", options.controlsId);
  if (options.describedBy) button.setAttribute("aria-describedby", options.describedBy);
  const role = uiText(token.role);
  const count = semantic === "object-bound" ? token.additionalObjectCount ?? 0 : 0;
  const description = (role && role !== token.label ? role + " " : "") + token.label +
    (count > 0 ? english ? " and " + count + " more" : "，另有 " + count + " 项" : "");
  button.setAttribute("aria-label", description);
  button.title = description;
  button.onpointerdown = event => {
    if (options.preserveSelection) {event.preventDefault(); options.preserveSelection();}
  };
  if (!button.disabled && state !== "expanded") {
    button.onpointermove = event => {
      if (event.pointerType !== "mouse") return;
      const bounds = core.getBoundingClientRect();
      core.style.setProperty("--ic-light-x", (event.clientX - bounds.left) + "px");
      core.style.setProperty("--ic-light-y", (event.clientY - bounds.top) + "px");
      core.dataset.pointerLight = "true";
    };
    button.onpointerleave = () => { delete core.dataset.pointerLight; };
  }
  button.onclick = options.onOpen;
  const face = layer("ic-sentence-token-face", false);
  const label = layer("ic-demo-chip-label", false);
  label.textContent = semantic === "object-bound" ? materialLabel(token.label) : token.label;
  face.append(leadingVisual(token),label);
  if (count > 0) {
    const badge = layer("ic-chip-object-count");
    badge.textContent = "+" + count;
    face.append(badge);
  }
  if (state === "needs-input" || (token.preparing && semantic === "needs-input")) face.append(opticalIcon("plus", "ic-chip-needs-plus"));
  if (semantic === "ambiguous-recommendation") {
    const star = layer("ic-demo-chip-smart");
    if (token.recommendationIconSrc) {
      const image = document.createElement("img");
      image.alt = ""; image.src = token.recommendationIconSrc; star.append(image);
    } else star.append(opticalIcon("star","ic-optical-star"));
    face.append(star);
  }
  button.append(face);
  core.append(button);
  if (token.preparing) {
    surface.dataset.preparing = "true";
    surface.setAttribute("role","status");
    surface.setAttribute("aria-busy","true");
    surface.setAttribute("aria-label",english ? "Preparing suggestion" : "正在整理建议");
    button.setAttribute("aria-hidden", "true");
  }
  if (token.preparing || surface.dataset.fromLoading) {
    const loading = layer("ic-optical-loading");
    const envelope = layer("ic-optical-envelope");
    envelope.append(layer("ic-optical-beam"));
    const skeleton = layer("ic-optical-skeleton");
    skeleton.append(layer("ic-optical-dot"),layer("ic-optical-bar"),opticalIcon("star","ic-optical-prep-star"));
    loading.append(envelope, skeleton);
    core.append(loading);
  }
  if (remove) {
    const close = document.createElement("button");
    close.type = "button";
    close.className = "ic-demo-chip-remove";
    close.disabled = disabled || Boolean(token.preparing);
    if (token.preparing) close.setAttribute("aria-hidden","true");
    close.setAttribute("aria-label",(english ? "Remove " : "移除 ") + token.label);
    close.append(opticalIcon("close","ic-optical-close"));
    close.onpointerdown = event => {if (options.preserveSelection) event.preventDefault();};
    close.onclick = event => {event.stopPropagation(); remove();};
    if (containedRemove) {
      surface.dataset.dismiss = "true";
      core.append(layer("ic-optical-divider"),close);
    } else hit.append(close);
  }
  if (token.suffix) hit.append(token.suffix);
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
  const visualKey = JSON.stringify([props.token, props.disabled, props.expanded, props.controlsId, props.describedBy, props.containedRemove, props.size, props.surfaceContext, Boolean(props.onRemove), Boolean(props.onRemoveMaterial), Boolean(props.preserveSelection), language, assetBase, translate(props.token.role)]);
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
        onRemoveMaterial: latest.current.onRemoveMaterial ? () => latest.current.onRemoveMaterial?.() : undefined,
        preserveSelection: latest.current.preserveSelection ? () => latest.current.preserveSelection?.() : undefined,
        language,
        uiText: translate,
        assetBase,
        sweepStarts: sweepStarts.current,
      }),
    );
    if (focused)
      (node.querySelector<HTMLElement>(focusSelector) ?? node.querySelector<HTMLElement>(".ic-sentence-token"))
        ?.focus({ preventScroll: true });
  }, [visualKey]);
  return <span ref={root} />;
}
