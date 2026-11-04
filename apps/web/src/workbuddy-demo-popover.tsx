import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Follow the rendered chip, not its source offset or a guessed line height. */
export function WorkBuddyDemoPopover({
  anchorId,
  children,
  onClose,
}: {
  anchorId?: string;
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
      reveal = true;
    const findAnchor = () =>
      anchorId
        ? Array.from(document.querySelectorAll<HTMLElement>(".sentence-token"))
            .find((el) => el.dataset.parameterId === anchorId)
            ?.querySelector<HTMLElement>(".sentence-token-face")
        : document.querySelector<HTMLElement>(".demo-add>button");
    const measure = () => {
      if (!alive || !root.current) return;
      const anchor = findAnchor();
      if (!anchor) {
        if (anchorId) close.current();
        return;
      }
      const rect = anchor.getBoundingClientRect(),
        width = Math.min(360, innerWidth - 32);
      const left = Math.max(16, Math.min(rect.left, innerWidth - width - 16));
      const next = {
        left,
        top: rect.bottom + 8,
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
          const overflow = next.top + height - (innerHeight - 16);
          if (overflow > 0) {
            const scroller =
              document.querySelector<HTMLElement>(".demo-app .wb-home");
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
      document.querySelector(".wb-sentence-composer"),
      document.querySelector(".wb-home-entry"),
    ])
      if (node) observer.observe(node);
    const mutations = new MutationObserver(schedule),
      composer = document.querySelector(".wb-sentence-composer");
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
  }, [anchorId]);
  return (
    <div
      ref={root}
      id="demo-input-widget"
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
