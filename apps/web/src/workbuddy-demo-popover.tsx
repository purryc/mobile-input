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
  } | null>(null);
  useLayoutEffect(() => {
    let frame = 0,
      alive = true,
      reveal = true, missing = 0;
    const getHost=()=>anchorRoot.current;
    const findAnchor = () =>
      anchorId
        ? Array.from(getHost()?.querySelectorAll<HTMLElement>(".sentence-token") ?? [])
            .find((el) => el.dataset.parameterId === anchorId)
            ?.querySelector<HTMLElement>(".sentence-token-face")
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
      const next = {
        left,
        top: Math.max(16,Math.min(rect.bottom + 8,innerHeight-root.current.getBoundingClientRect().height-16)),
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
      if (reveal) {
        const height = root.current.getBoundingClientRect().height;
        if (height > 0) {
          reveal = false;
          const overflow = rect.bottom + 8 + height - (innerHeight - 16);
          if (overflow > 0) {
            const scroller =
              getHost()?.closest<HTMLElement>(".wb-home, .demo-task-compose");
            scroller?.scrollBy({
              top: Math.min(overflow, Math.max(0, rect.top - 24)),
              behavior: "instant",
            });
          }
        }
      }
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    for (const node of [
      root.current,
      getHost()?.querySelector(".wb-sentence-composer"),
      getHost()?.closest(".wb-home-entry"),
    ])
      if (node) observer.observe(node);
    const mutations = new MutationObserver(schedule),
      composer = getHost()?.querySelector(".wb-sentence-composer");
    if (composer)
      mutations.observe(composer, { childList: true, subtree: true });
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
          visibility: position ? "visible" : "hidden",
          "--anchor-offset": `${position?.arrow ?? 18}px`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
