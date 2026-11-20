import {useEffect, useRef, useState} from 'react';
import {useWidgetEnvironment} from './environment';
import {WidgetFooter, type WidgetResetProps} from './widget-footer';

const units = {
  s: {zh:'秒', en:'sec', initial:15, max:120, ticks:[1,15,30,60,120]},
  m: {zh:'分钟', en:'min', initial:10, max:60, ticks:[1,10,20,30,60]},
  h: {zh:'小时', en:'hr', initial:1, max:24, ticks:[1,4,8,12,24]},
} as const;
export type DurationUnit = keyof typeof units;
export interface DurationWidgetProps extends WidgetResetProps {
  value: string;
  onChange: (value: string) => void;
  unit?: DurationUnit;
  /** Supply both unit and its setter to enable the multi-unit picker. */
  onUnitChange?: (unit: DurationUnit) => void;
  onDone?: () => void;
}
export function DurationWidget({value, unit = 'm', onUnitChange, onChange, onDone, onReset, canReset}: DurationWidgetProps) {
  const en = useWidgetEnvironment().language.startsWith('en');
  const spec = units[unit];
  const numericValue = Number(value);
  const n = value.trim() && Number.isFinite(numericValue) ? Math.max(1, Math.min(spec.max, Math.round(numericValue))) : spec.initial;
  const [draft,setDraft] = useState(String(n));
  const initial = useRef({value, unit}).current;
  useEffect(() => setDraft(String(n)), [value,unit,n]);
  const label = en ? spec.en : spec.zh;
  const select = (next: DurationUnit) => {
    if (unit === next) return;
    onUnitChange?.(next);
    onChange(String(units[next].initial));
  };
  const adjustLabel = (more: boolean) => {
    if (unit === 'm') return en ? (more ? 'Increase by one minute' : 'Decrease by one minute') : (more ? '增加一分钟' : '减少一分钟');
    return (en ? (more ? 'Increase by 1 ' : 'Decrease by 1 ') : (more ? '增加一' : '减少一')) + label;
  };
  return <div className="ic-duration-picker">
    <div className="ic-duration-top">
      <div className="ic-time-stepper">
        <button type="button" disabled={n<=1} aria-label={adjustLabel(false)} onClick={()=>onChange(String(n-1))}>−</button>
        <input type="number" inputMode="numeric" min={1} max={spec.max} value={draft}
          aria-label={en ? (unit==='m'?'Duration (minutes)':'Duration ('+label+')') : '演讲时长（'+label+'）'}
          onChange={e=>{const text=e.target.value;setDraft(text);if (/^\d+$/.test(text) && +text>=1 && +text<=spec.max) onChange(text);}}
          onBlur={()=>setDraft(String(n))}/>
        <button type="button" disabled={n>=spec.max} aria-label={adjustLabel(true)} onClick={()=>onChange(String(n+1))}>＋</button>
      </div>
      {onUnitChange ? <div className="ic-duration-units" role="group" aria-label={en?'Time unit':'时间单位'}>
        {(Object.keys(units) as DurationUnit[]).map(key=><button key={key} type="button" aria-pressed={unit===key} onClick={()=>select(key)}>{en?units[key].en:units[key].zh}</button>)}
      </div> : <span>{label}</span>}
    </div>
    <input className="ic-time-range" type="range" min={1} max={spec.max} value={n} aria-label={en?'Adjust duration':'调整时长'}
      style={{backgroundSize: (100*(n-1)/(spec.max-1))+'% 100%'}} onChange={e=>onChange(e.target.value)}/>
    <div className="ic-duration-ticks">{spec.ticks.map(tick=><button type="button" key={tick} aria-pressed={n===tick} onClick={()=>onChange(String(tick))}>{tick}{unit}</button>)}</div>
    <WidgetFooter onReset={onReset ?? (()=>{onUnitChange?.(initial.unit);onChange(initial.value);})} canReset={canReset ?? (unit!==initial.unit || value!==initial.value)}
      onConfirm={onDone} confirmLabel={en?'Done':'完成选择'}/>
  </div>;
}
