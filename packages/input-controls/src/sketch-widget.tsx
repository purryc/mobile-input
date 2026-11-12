import { useRef, useState } from "react";
import { WidgetIcon } from "./widget-icon";
import { useWidgetText } from "./environment";
import {
  SKETCH_WIDTH,
  SKETCH_HEIGHT,
  eraseSketchAt,
} from "../../core/agent-sketch";
export function SketchWidget({
  strokes,
  onChange,
  onEnd,
  onActive,
  onAdopt,
  busy = false,
}: {
  strokes: number[][][];
  onChange: (strokes: number[][][]) => void;
  onEnd?: (strokes: number[][][]) => void;
  onActive: (active: boolean) => void;
  onAdopt: () => void;
  busy?: boolean;
}) {
  const uiText = useWidgetText();
  const lines = useRef(strokes),
    drawing = useRef(false),
    pointer = useRef<number | null>(null),
    history = useRef<number[][][][]>([]),
    before = useRef<number[][][]>([]);
  lines.current = strokes;
  const [tool, setTool] = useState<"pen" | "eraser">("pen"),
    [revision, setRevision] = useState(0);
  const point = (e: React.PointerEvent<SVGSVGElement>) => {
    const matrix = e.currentTarget.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      matrix.inverse(),
    );
    return [
      Math.max(0, Math.min(1, p.x / SKETCH_WIDTH)),
      Math.max(0, Math.min(1, p.y / SKETCH_HEIGHT)),
    ];
  };
  const update = (v: number[][][]) => {
    lines.current = v;
    onChange(v);
  };
  const remember = (v: number[][][]) => {
    history.current = [...history.current.slice(-49), v];
    setRevision((n) => n + 1);
  };
  const end = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing.current || e.pointerId !== pointer.current) return;
    drawing.current = false;
    pointer.current = null;
    onActive(false);
    if (lines.current !== before.current) remember(before.current);
    onEnd?.(lines.current);
  };
  return (
    <>
      <svg
        className="agent-sketch-surface"
        viewBox={`0 0 ${SKETCH_WIDTH} ${SKETCH_HEIGHT}`}
        preserveAspectRatio="none"
        aria-label={uiText("布局画板")}
        data-tool={tool}
        onPointerDown={(e) => {
          if (busy || drawing.current || !e.isPrimary) return;
          const p = point(e);
          if (!p) return;
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          pointer.current = e.pointerId;
          drawing.current = true;
          before.current = lines.current;
          onActive(true);
          update(
            tool === "eraser"
              ? eraseSketchAt(lines.current, p)
              : [...lines.current, [p]].slice(-100),
          );
        }}
        onPointerMove={(e) => {
          if (!drawing.current || e.pointerId !== pointer.current) return;
          const p = point(e);
          if (!p) return;
          update(
            tool === "eraser"
              ? eraseSketchAt(lines.current, p)
              : lines.current.map((s, i) =>
                  i === lines.current.length - 1 ? [...s, p].slice(-2000) : s,
                ),
          );
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
      >
        {strokes.map((s, i) => (
          <polyline
            key={i}
            points={s
              .map(([x, y]) => `${x * SKETCH_WIDTH},${y * SKETCH_HEIGHT}`)
              .join(" ")}
            fill="none"
            stroke="var(--dock-accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <footer className="live-wb-sketch-tools" data-history={revision}>
        <button
          aria-label={uiText("画笔")}
          aria-pressed={tool === "pen"}
          onClick={() => setTool("pen")}
        >
          <WidgetIcon name="pen" />
        </button>
        <button
          aria-label={uiText("橡皮")}
          aria-pressed={tool === "eraser"}
          onClick={() => setTool("eraser")}
        >
          <WidgetIcon name="eraser" />
        </button>
        <button
          aria-label={uiText("撤销笔迹")}
          disabled={busy || (!strokes.length && !history.current.length)}
          onClick={() => {
            const next = history.current.pop() ?? lines.current.slice(0, -1);
            update(next);
            setRevision((n) => n + 1);
            onEnd?.(next);
          }}
        >
          <WidgetIcon name="undo" />
        </button>
        <button
          aria-label={uiText("清空笔迹")}
          disabled={!strokes.length || busy}
          onClick={() => {
            remember(lines.current);
            update([]);
            onEnd?.([]);
          }}
        >
          <WidgetIcon name="clear" />
        </button>
        <span />
        <button
          aria-label={uiText("采用布局草图")}
          disabled={busy || !strokes.some((s) => s.length > 1)}
          onClick={onAdopt}
        >
          <WidgetIcon name="check" />
        </button>
      </footer>
    </>
  );
}
