import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { money, totals, type Product } from "../../../packages/core/model";
function EditableParagraph({ text, onEdit, ...props }: { text: string; onEdit?: (text: string) => void } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (ref.current && ref.current.innerText !== text) ref.current.innerText = text;
  }, [text]);
  return <div {...props} ref={ref} contentEditable={!!onEdit} suppressContentEditableWarning onInput={(e) => onEdit?.(e.currentTarget.innerText)} onBlur={(e) => onEdit?.(e.currentTarget.innerText)} />;
}
export function OfficeParagraphs({
  paragraphs,
  selected,
  onSelect,
  onEdit,
  marks = {},
  styles = {},
}: {
  paragraphs: string[];
  selected?: number;
  onSelect: (i: number) => void;
  onEdit?: (i: number, text: string) => void;
  marks?: Record<string, string[]>;
  styles?: Record<number, CSSProperties>;
}) {
  return (
    <>
      {paragraphs.map((p, i) => {
        const m = marks["paragraph/" + i] || [];
        return (
          <EditableParagraph
            key={i}
            className={
              "word-paragraph " +
              (i === 0 ? "document-title " : "") +
              (selected === i ? "selected" : "")
            }
            style={{
              fontWeight: m.includes("bold") ? 700 : undefined,
              fontStyle: m.includes("italic") ? "italic" : undefined,
              textDecoration: [
                m.includes("underline") ? "underline" : "",
                m.includes("strike") ? "line-through" : "",
              ].join(" "),
              ...styles[i],
            }}
            onClick={() => onSelect(i)}
            text={p}
            onEdit={onEdit ? (text) => onEdit(i, text) : undefined}
          />
        );
      })}
    </>
  );
}
export const quoteColumns = [
  "产品名称",
  "数量",
  "采购单价",
  "销售单价",
  "折扣 %",
  "采购成本",
  "客户报价",
  "毛利",
];
export const quoteFields = ["quantity", "cost", "price", "discount"] as const;
export function OfficeQuoteRows({
  products,
  selected = "",
  selectedPaths = [],
  onSelect,
  onEdit,
  onRange,
}: {
  products: Product[];
  selected?: string;
  selectedPaths?: string[];
  onSelect: (row: number, field: string) => void;
  onEdit?: (row: number, field: string, text: string) => void;
  onRange?: (row: number, field: string, phase: "start" | "end") => void;
}) {
  const rangeStart = useRef<{row:number; field:string} | null>(null);
  const skipClick = useRef(false);
  return (
    <>
      {products.map((p, i) => {
        const t = totals([p]);
        return (
          <tr key={p.id}>
            <th>{i + 4}</th>
            <td>{p.name}</td>
            {quoteFields.map((field, j) => {
              const path = "cell/" + i + "/" + field;
              return (
                <td
                  key={field}
                  data-quote-row={i}
                  data-quote-field={field}
                  className={selected === path || selectedPaths.includes(path) ? "cell-selected" : ""}
                  onPointerDown={() => { rangeStart.current = {row:i,field}; skipClick.current = false; onRange?.(i, field, "start"); }}
                  onPointerUp={(event) => {
                    const cell = document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLElement>("[data-quote-row]");
                    const row = cell ? Number(cell.dataset.quoteRow) : i, endField = cell?.dataset.quoteField || field;
                    skipClick.current = !!rangeStart.current && (rangeStart.current.row !== row || rangeStart.current.field !== endField);
                    onRange?.(row,endField,"end"); rangeStart.current = null;
                  }}
                  onPointerCancel={() => { rangeStart.current = null; }}
                  onClick={() => { if (skipClick.current) { skipClick.current = false; return; } onSelect(i, field); }}
                >
                  <input
                    aria-label={
                      "BCDE"[j] +
                      (i + 4) +
                      " · " +
                      p.name +
                      " · " +
                      ["数量", "采购单价", "销售单价", "折扣"][j]
                    }
                    inputMode="decimal"
                    value={String(p[field])}
                    readOnly={!onEdit}
                    onFocus={() => onSelect(i, field)}
                    onChange={(e) => onEdit?.(i, field, e.target.value)}
                  />
                </td>
              );
            })}
            <td>{money(t.cost)}</td>
            <td>{money(t.revenue)}</td>
            <td>{money(t.profit)}</td>
          </tr>
        );
      })}
    </>
  );
}
