import { useId } from "react";
import { TRANSLATION_READ_MS } from "./session";
import type { Target } from "./types";
/** Stepped contour follows each Range line, including a short final line. */
export function envelope(rect: Target["rect"], lines?: Target["rect"][]) {
  const rows = (lines?.length ? lines : [rect])
    .reduce<Target["rect"][]>((all, r) => {
      const row = all.find((v) => Math.abs(v.y - r.y) < 3);
      if (row) {
        const right = Math.max(row.x + row.width, r.x + r.width);
        row.x = Math.min(row.x, r.x);
        row.width = right - row.x;
        row.height = Math.max(row.height, r.height);
      } else all.push({ ...r });
      return all;
    }, [])
    .sort((a, b) => a.y - b.y);
  const points: [number, number][] = [];
  rows.forEach((r, i) => {
    const y = i ? (r.y + rows[i - 1].y + rows[i - 1].height) / 2 : r.y;
    points.push([r.x + r.width, y]);
    points.push([
      r.x + r.width,
      i < rows.length - 1
        ? (r.y + r.height + rows[i + 1].y) / 2
        : r.y + r.height,
    ]);
  });
  [...rows].reverse().forEach((r, j) => {
    const i = rows.length - 1 - j;
    points.push([
      r.x,
      i < rows.length - 1
        ? (r.y + r.height + rows[i + 1].y) / 2
        : r.y + r.height,
    ]);
    points.push([
      r.x,
      i ? (r.y + rows[i - 1].y + rows[i - 1].height) / 2 : r.y,
    ]);
  });
  // Remove coincident/collinear row corners before rounding. Keep concave
  // steps, so short final lines do not gain a full-width bounding rectangle.
  const corners = points.filter((p, i) => {
    const previous = points[(i + points.length - 1) % points.length];
    return p[0] !== previous[0] || p[1] !== previous[1];
  });
  const polygon = corners.filter((p, i) => {
    const a = corners[(i + corners.length - 1) % corners.length];
    const b = corners[(i + 1) % corners.length];
    return (p[0] - a[0]) * (b[1] - p[1]) !== (p[1] - a[1]) * (b[0] - p[0]);
  });
  const rounded = polygon.map((p, i) => {
    const a = polygon[(i + polygon.length - 1) % polygon.length];
    const b = polygon[(i + 1) % polygon.length];
    const before = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const after = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const radius = Math.min(8, before / 2, after / 2);
    const toward = (q: typeof p, length: number) =>
      [
        p[0] + ((q[0] - p[0]) * radius) / length,
        p[1] + ((q[1] - p[1]) * radius) / length,
      ] as const;
    return { p, enter: toward(a, before), exit: toward(b, after) };
  });
  const xy = ([x, y]: readonly number[]) => `${x - rect.x},${y - rect.y}`;
  return `M${xy(rounded[0].enter)} ${rounded
    .map(({ p, enter, exit }) => `L${xy(enter)} Q${xy(p)} ${xy(exit)}`)
    .join(" ")} Z`;
}
export default function TranslationFocus({
  rect,
  lineRects,
  reading,
  semantic = false,
}: {
  rect: Target["rect"];
  lineRects?: Target["rect"][];
  reading: boolean;
  semantic?: boolean;
}) {
  const id = useId();
  const path = envelope(rect, lineRects);
  return (
    <div
      className={
        semantic ? "translation-focus semantic-focus" : "translation-focus"
      }
      data-reading={reading}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      }}
    >
      <svg
        width={rect.width}
        height={rect.height}
        style={{ overflow: "visible" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={id}>
            <stop stopColor="#42cce6" />
            <stop offset=".5" stopColor="#9a92ef" />
            <stop offset="1" stopColor="#e9a5df" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {reading && (
          <path
            className="translation-reading"
            d={path}
            fill="none"
            stroke={`url(#${id})`}
            strokeWidth="3"
            strokeLinejoin="round"
            pathLength="100"
            strokeDasharray="22 78"
            strokeLinecap="round"
            style={{ animationDuration: `${TRANSLATION_READ_MS}ms` }}
          />
        )}
      </svg>
    </div>
  );
}
