import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

/** Follow the rendered chip, not its source offset or a guessed line height. */
export function WorkBuddyDemoPopover({
  anchorId,
  anchorRoot,
  id,
  preferredWidth = 360,
  children,
  onClose,
}: {
  anchorId?: string;
  anchorRoot: RefObject<HTMLDivElement | null>;
  id: string;
  preferredWidth?: number;
  children: ReactNode;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
    arrow: number;
    maxHeight: number;
  } | null>(null);
  useLayoutEffect(() => {
    let frame = 0,
      alive = true,
      missing = 0;
    const getHost=()=>anchorRoot.current;
    const findAnchor = () =>
      anchorId
        ? Array.from(getHost()?.querySelectorAll<HTMLButtonElement>("button[data-parameter-id]") ?? [])
            .find((el) => el.dataset.parameterId === anchorId)
        : getHost()?.querySelector<HTMLElement>(".demo-add>button");
    const measure = () => {
      if (!alive || !root.current) return;
      const anchor = findAnchor();
      if (!anchor) {
        if (anchorId && ++missing > 1) close.current();
        return;
      }
      missing=0;
      const rect = anchor.getBoundingClientRect(),
        width = Math.min(preferredWidth, innerWidth - 32);
      const left = Math.max(16, Math.min(rect.left, innerWidth - width - 16));
      const below = Math.max(16, rect.bottom + 8);
      const roomBelow = innerHeight - below - 16;
      // At the bottom edge, keep the panel usable without scrolling the draft.
      const above = roomBelow < 120 && rect.top - 24 > roomBelow;
      const maxHeight = Math.max(0, above ? rect.top - 24 : roomBelow);
      const top = above ? Math.max(16, rect.top - 8 - Math.min(root.current.scrollHeight, maxHeight)) : below;
      const next = {
        left,
        top,
        maxHeight,
        width,
        arrow: Math.max(
          12,
          Math.min(width - 20, rect.left - left + Math.min(18, rect.width / 2)),
        ),
      };
      setPosition((previous) =>
        previous &&
        Object.keys(next).every(
          (key) =>
            Math.abs(
              previous[key as keyof typeof next] -
                next[key as keyof typeof next],
            ) < 0.5,
        )
          ? previous
          : next,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    for (const node of [
      root.current,
      getHost()?.querySelector(".wb-sentence-composer"),
      findAnchor(),
      getHost()?.querySelector(".demo-capabilities"),
      getHost()?.closest(".wb-home-entry"),
    ])
      if (node) observer.observe(node);
    const mutations = new MutationObserver(schedule),
      composer = getHost()?.querySelector(".wb-sentence-composer");
    if (composer)
      mutations.observe(composer, { childList: true, subtree: true });
    const trigger = findAnchor();
    const panelNode = root.current;
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
    };
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("keydown", key);
    measure();
    schedule();
    return () => {
      if (panelNode?.contains(document.activeElement)) trigger?.focus({preventScroll: true});
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("keydown", key);
    };
  }, [anchorId,anchorRoot,preferredWidth]);
  return (
    <div
      ref={root}
      id={id}
      className="demo-widget-wrap"
      role="region"
      aria-label="参数控件"
      data-anchor={anchorId || "add"}
      style={
        {
          left: position?.left ?? 0,
          top: position?.top ?? 0,
          width: position?.width ?? 360,
          maxHeight: position?.maxHeight,
          overflow: "auto",
          visibility: position ? "visible" : "hidden",
          "--anchor-offset": `${position?.arrow ?? 18}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
