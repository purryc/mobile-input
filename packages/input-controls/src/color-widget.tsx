import {WidgetFooter, type WidgetResetProps} from "./widget-footer";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { fromHex, toHex } from "./color-math";
import { WidgetIcon } from "./widget-icon";
import { useWidgetText } from "./environment";
export interface ColorWidgetProps extends WidgetResetProps {
  ownerId?: string;
  value: string;
  label: string;
  onChange: (value: string) => void;
  onActive: (active: boolean) => void;
  onDone?: () => void;
}
const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) =>
  "#" +
  rgb(a)
    .map((v, i) =>
      Math.round(v + (rgb(b)[i] - v) * t)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase();
export function ColorWidget(props: ColorWidgetProps) {
  const t = useWidgetText();
  if (!/^#[0-9a-f]{6}$/i.test(props.value)) return <label role="alert">{t("请输入六位HEX颜色值")}<input aria-label={props.label} defaultValue={props.value} onChange={e=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value))props.onChange(e.target.value);}}/></label>;
  return <ColorSession key={props.ownerId} {...props}/>; }
function ColorSession({
  value,
  label,
  onChange,
  onActive,
  onDone, onReset, canReset,
}: ColorWidgetProps) {
  const uiText = useWidgetText();
  const initialValue = useRef(value).current;
  const [hex, setHex] = useState(value),
    [base, setBase] = useState(value);
  const [hue, setHue] = useState(() => fromHex(value).h);
  const neutralColor = (v: string) =>
    fromHex(v).s < 0.08 || v.toUpperCase() === "#182431";
  const positionFor = (v: string) =>
    neutralColor(v) ? 1 - Math.max(...rgb(v)) / 255 : 0.5;
  const [position, setPosition] = useState(() => positionFor(value));
  const held = useRef<number | null>(null),
    current = useRef(value),
    acknowledged = useRef(value),
    last = useRef(0);
  useEffect(() => {
    if (value === acknowledged.current) return;
    acknowledged.current = value;
    current.current = value;
    setHex(value);
    setBase(value);
    setHue(fromHex(value).h);
    setPosition(positionFor(value));
  }, [value]);
  const activeCallback = useRef(onActive);activeCallback.current=onActive;
  useEffect(()=>()=>{if(held.current!==null){held.current=null;activeCallback.current(false);}},[]);
  const neutral = neutralColor(base);
  const presets = neutral
    ? ["#FFFFFF", "#D9D9D9", "#919191", "#4A4A4A", "#000000"]
    : [
        mix("#FFFFFF", base, 0.25),
        mix("#FFFFFF", base, 0.55),
        base.toUpperCase(),
        mix(base, "#000000", 0.25),
        mix(base, "#000000", 0.5),
      ];
  if (neutral && !presets.includes(base.toUpperCase()))
    presets[2] = base.toUpperCase();
  if (neutral)
    presets.sort((a, b) => Math.max(...rgb(b)) - Math.max(...rgb(a)));
  const colorAt = (x: number) =>
    neutral
      ? mix("#FFFFFF", "#000000", x)
      : x <= 0.5
        ? mix("#FFFFFF", base, x * 2)
        : mix(base, "#000000", (x - 0.5) * 2);
  function publish(v: string, force = true) {
    current.current = v;
    setHex(v);
    if (force || performance.now() - last.current > 80) {
      last.current = performance.now();
      acknowledged.current = v;
      onChange(v);
    }
  }
  function choose(v: string) {
    setBase(v);
    setHue(fromHex(v).h);
    setPosition(positionFor(v));
    publish(v);
  }
  function finish() {
    if (held.current === null) return;
    held.current = null;
    onActive(false);
    publish(current.current);
  }
  function pick(e: PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect(),
      x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setPosition(x);
    publish(colorAt(x), false);
  }
  return (
    <div className="ic-agent-color-body">
      <div className="ic-agent-color-presets">
        {presets.map((v, i) => (
          <button type="button"
            key={i}
            aria-label={label + " " + v}
            aria-pressed={hex.toUpperCase() === v.toUpperCase()}
            onClick={() => {
              setPosition(
                neutral ? positionFor(v) : [0.125, 0.275, 0.5, 0.625, 0.75][i],
              );
              publish(v);
            }}
          >
            <i className="ic-agent-color-swatch" style={{ background: v }} />
          </button>
        ))}
      </div>
      <div
        className="ic-agent-tone-ramp"
        role="slider"
        aria-label={uiText("连续调色")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position * 100)}
        aria-valuetext={hex}
        tabIndex={0}
        style={{
          backgroundImage: neutral
            ? "linear-gradient(90deg,#FFFFFF,#000000)"
            : `linear-gradient(90deg,#FFFFFF,${base} 50%,#000000)`,
        }}
        onPointerDown={(e) => {
          if (!e.isPrimary || held.current !== null) return;
          e.preventDefault();
          held.current = e.pointerId;
          onActive(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e);
        }}
        onPointerMove={(e) => {
          if (held.current === e.pointerId) pick(e);
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
        onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
          e.preventDefault();
          const x = Math.max(
            0,
            Math.min(1, position + (e.key === "ArrowRight" ? 0.01 : -0.01)),
          );
          setPosition(x);
          publish(colorAt(x));
        }}
      >
        <i style={{ left: position * 100 + "%" }} />
      </div>
      <input
        aria-label={uiText("色相")}
        className="ic-agent-hue"
        type="range"
        min="0"
        max="359"
        value={Math.round(hue)}
        onPointerDown={(e) => {
          if (!e.isPrimary || held.current !== null) return;
          held.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          onActive(true);
        }}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
        onBlur={finish}
        onChange={(e) => {
          const h = +e.target.value,
            v = toHex({ h, s: 0.75, v: 0.8 });
          setHue(h);
          setBase(v);
          setPosition(0.5);
          publish(v, held.current === null);
        }}
      />
      <div className="ic-agent-color-bottom">
        <label>
          <input
            aria-label={label + " HEX"}
            value={hex}
            spellCheck={false}
            onChange={(e) => {
              setHex(e.target.value);
              if (/^#[0-9a-f]{6}$/i.test(e.target.value))
                choose(e.target.value.toUpperCase());
            }}
            onBlur={() => setHex(current.current)}
          />
          <i
            style={{
              background: /^#[0-9a-f]{6}$/i.test(hex) ? hex : current.current,
            }}
          />
        </label>
      </div>
      <WidgetFooter onReset={onReset ?? (() => choose(initialValue))} canReset={canReset ?? (initialValue !== value)} onConfirm={onDone} confirmLabel={uiText("完成颜色选择")}/>
    </div>
  );
}
