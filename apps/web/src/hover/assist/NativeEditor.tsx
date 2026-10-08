import { ChevronLeft, Plus, Check } from "lucide-react";
import { Sheet } from "../app/Sheet";
export type CalendarPreferences = {
  全天: string;
  提醒: string;
  日历: string;
  重复: string;
  备注: string;
};
export default function NativeEditor({
  notes,
  fields,
  update,
  checked,
  onCheck,
  add,
  preferences,
  onPreferences,
  onClose,
  onSave,
  error,
}: {
  notes: boolean;
  fields: [string, string][];
  update: (i: number, v: string) => void;
  checked: number[];
  onCheck: (i: number) => void;
  add: () => void;
  preferences: CalendarPreferences;
  onPreferences: (key: keyof CalendarPreferences, v: string) => void;
  onClose: () => void;
  onSave: () => void;
  error: string;
}) {
  const field = (label: string) => fields.findIndex(([key]) => key === label);
  return (
    <Sheet
      title={notes ? "待办" : "新建日程"}
      className={`native-editor ${notes ? "notes-editor" : "calendar-editor"}`}
      onClose={onClose}
    >
      <div className="editor-status">
        <span>9:41</span>
        <img src="/assets/figma/imgIconMore.svg" alt="" />
        <i />
      </div>
      <div className="editor-top">
        <button aria-label="返回预览" onClick={onClose}>
          {notes ? <ChevronLeft size={23} /> : "取消"}
        </button>
        <strong>{notes ? "待办" : "新建日程"}</strong>
        {notes ? (
          <button aria-label="保存待办" onClick={onSave}>
            <img src="/assets/figma/imgIconMore.svg" alt="" />
          </button>
        ) : (
          <button onClick={onSave}>完成</button>
        )}
      </div>
      <h2>{notes ? preferences.备注 : fields.find(([k]) => /标题|主题|事项/.test(k))?.[1] || preferences.备注}</h2>
      <p className="editor-subtitle">
        {notes
          ? `${fields.length} 项待办 · 从消息添加`
          : fields.find(([k]) => k === "地点")?.[1]}
      </p>
      {notes ? (
        <div className="editor-rows">
          {fields.map(([key, value], i) => (
            <label key={key}>
              <button
                type="button"
                role="checkbox"
                aria-label={`${value}完成状态`}
                aria-checked={checked.includes(i)}
                onClick={() => onCheck(i)}
              >
                {checked.includes(i) && <Check size={16} />}
              </button>
              <div>
                <input
                  aria-label={key}
                  value={value}
                  onChange={(e) => update(i, e.target.value)}
                />
                <small>工作 · 上海出差</small>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <div className="calendar-form">
          {(["全天", "开始", "结束", "提醒", "日历", "重复"] as const).map(
            (key, i) => (
              <label
                key={key}
                style={{
                  top: `${(248 + [0, 68, 136, 218, 286, 354][i]) / 4.4}cqw`,
                }}
              >
                <span>{key}</span>
                {key === "开始" || key === "结束" ? (
                  <input
                    aria-label={key}
                    value={fields[field(key)]?.[1] || ""}
                    onChange={(e) => update(field(key), e.target.value)}
                    placeholder={key === "结束" ? "待补充结束时间" : ""}
                  />
                ) : (
                  <input
                    aria-label={key}
                    value={preferences[key]}
                    onChange={(e) => onPreferences(key, e.target.value)}
                  />
                )}
              </label>
            ),
          )}
          <label className="editor-memo">
            <span>备注</span>
            <textarea
              aria-label="备注"
              value={preferences.备注}
              onChange={(e) => onPreferences("备注", e.target.value)}
            />
          </label>
        </div>
      )}
      {notes && (
        <button className="editor-add" onClick={add}>
          <Plus size={18} />
          新建待办
        </button>
      )}
      {error && (
        <p className="editor-error" role="alert">
          {error}
        </p>
      )}
    </Sheet>
  );
}
