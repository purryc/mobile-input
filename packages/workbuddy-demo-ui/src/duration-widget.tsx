import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useWidgetEnvironment } from "./environment";
import { useWidgetText } from "./environment";
function DurationInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const uiText = useWidgetText();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="live-wb-duration">
      <button
        aria-label={uiText("减少一分钟")}
        disabled={!value || +value <= 1}
        onClick={() => onChange(String(+value - 1))}
      >
        −
      </button>
      <label>
        <input
          aria-label={uiText("演讲时长（分钟）")}
          type="number"
          inputMode="numeric"
          min="1"
          max="60"
          step="1"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (
              /^\d+$/.test(e.target.value) &&
              +e.target.value >= 1 &&
              +e.target.value <= 60
            )
              onChange(e.target.value);
          }}
          onBlur={() => setText(value)}
        />
        <span>{uiText("分钟")}</span>
      </label>
      <button
        aria-label={uiText("增加一分钟")}
        disabled={+value >= 60}
        onClick={() => onChange(String((+value || 0) + 1))}
      >
        ＋
      </button>
    </div>
  );
}

export interface DurationWidgetProps {
  value: string;
  onChange: (value: string) => void;
  onDone?: () => void;
}
export function DurationWidget({
  value,
  onChange,
  onDone,
}: DurationWidgetProps) {
  const { language } = useWidgetEnvironment();
  return (
    <div className="demo-duration-row">
      <DurationInput value={value} onChange={onChange} />
      {onDone && (
        <button
          type="button"
          className="demo-duration-done"
          aria-label={language === "en" ? "Done" : "完成选择"}
          onClick={onDone}
        >
          <Check size={24} />
        </button>
      )}
    </div>
  );
}
