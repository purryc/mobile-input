import { useCallback, useState, useEffect } from "react";
import { previewFields } from "./preview";
import NativeEditor, { type CalendarPreferences } from "./NativeEditor";
import { appNames } from "./intents";
import { Sheet, copyText } from "../app/Sheet";
import type { Action } from "./types";

const configs: Record<
  string,
  {
    kind: string;
    brand: string;
    title?: string;
    subtitle?: string;
    result: string;
    resultSubtitle: string;
    frame: string;
    resultFrame?: string;
  }
> = {
  contact: {
    kind: "contact",
    brand: "联系人",
    subtitle: "请确认提取的信息",
    result: "联系人已创建",
    resultSubtitle: "",
    frame: "3866:10238",
    resultFrame: "3866:10342",
  },
  "calendar-complete": {
    kind: "calendar",
    brand: "日历",
    subtitle: "请确认提取的信息",
    result: "日程已添加",
    resultSubtitle: "",
    frame: "3866:10447",
    resultFrame: "3866:10551",
  },
  event: {
    kind: "calendar compact",
    brand: "日历",
    result: "日程已添加",
    resultSubtitle: "已保存",
    frame: "3719:38359",
  },
  reminder: {
    kind: "calendar compact",
    brand: "日历",
    result: "提醒已添加",
    resultSubtitle: "",
    frame: "3719:64045",
  },
  notes: {
    kind: "notes",
    brand: "小艺",
    subtitle: "从选中消息提取，可继续编辑",
    result: "已添加 3 项待办",
    resultSubtitle: "",
    frame: "3900:12032",
    resultFrame: "3900:12115",
  },
};
export const isNativeAction = (action: Action) =>
  Boolean(configs[action.id]) ||
  ["calendar", "phone", "contacts", "notes", "xiaoyi", "mail"].includes(
    action.app,
  );
export type NativeRecord = {
  action: Action;
  savedAt: string;
  extractedFields?: Action["fields"];
  previewFixture?: string;
  checked?: number[];
  preferences?: CalendarPreferences;
};
const storageKey = "wechat-point-and-ask:v1:native-records";
export function nativeRecords(key=storageKey): NativeRecord[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
export function NativeService({
  action,
  onClose,
  editorInitially = false,
}: {
  action: Action;
  onClose: () => void;
  editorInitially?: boolean;
}) {
  const recordKey='mobile-input:service:'+action.recordKey;
  const formKey=recordKey+':draft';
  const config = configs[action.id] || {
    kind:
      action.app === "notes"
        ? "notes"
        : action.app === "calendar"
          ? "calendar"
          : "xiaoyi",
    brand: appNames[action.app],
    subtitle: "信息已整理，可直接修改",
    result:
      action.app === "mail"
        ? "已发送"
        : action.app === "notes"
          ? "已记下"
          : "已保存",
    resultSubtitle: "",
    frame: "3900:12032",
    resultFrame: "3900:12115",
  };
  const [fields, setFields] = useState<Action['fields']>(()=>{try{return JSON.parse(localStorage.getItem(formKey)||'null')||previewFields(action);}catch{return previewFields(action);}});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(editorInitially);
  const closeEditor = useCallback(() => setEditor(false), []);
  const [checked, setChecked] = useState<number[]>(
    (()=>{try{return JSON.parse(localStorage.getItem(formKey+':options')||'null')?.checked;}catch{return null;}})() || nativeRecords(recordKey).find((r) => r.action.id === action.id)?.checked || [],
  );
  const [preferences, setPreferences] = useState<CalendarPreferences>(
    (()=>{try{return JSON.parse(localStorage.getItem(formKey+':options')||'null')?.preferences;}catch{return null;}})() || nativeRecords(recordKey).find((r) => r.action.id === action.id)?.preferences || {
      全天: "关闭",
      提醒: "开始前 30 分钟",
      日历: "我的日历",
      重复: "不重复",
      备注: action.title,
    },
  );
  useEffect(()=>{localStorage.setItem(formKey,JSON.stringify(fields));},[fields,formKey]);
  useEffect(()=>{localStorage.setItem(formKey+':options',JSON.stringify({preferences,checked}));},[preferences,checked,formKey]);
  const update = (i: number, value: string) =>
    setFields((rows) => rows.map((r, j) => (j === i ? [r[0], value] : r)));
  const save = async () => {
    if (action.id === "contact-copy") {
      try {
        await copyText(fields[0]?.[1] || "");
        setSaved(true);
      } catch {
        setError("复制失败，请重试。");
      }
      return;
    }
    const incomplete = fields.filter(
      ([, value]) => !value.trim() || /待补充|待确认|请选择/.test(value),
    );
    if (incomplete.length) {
      setError(`请补充${incomplete.map(([key]) => key).join("、")}`);
      return;
    }
    try {
      const record: NativeRecord = {
        action: { ...action, fields, missing: [] },
        extractedFields: action.fields,
        previewFixture: "src/data/preview-fixtures.json",
        savedAt: new Date().toISOString(),
        checked,
        preferences,
      };
      localStorage.setItem(
        recordKey,
        JSON.stringify([
          ...nativeRecords(recordKey).filter((r) => r.action.id !== action.id),
          record,
        ]),
      );
      setError("");
      setEditor(false);
      setSaved(true);
    } catch {
      setError("暂时未能保存，请重试。");
    }
  };
  if (editor)
    return (
      <NativeEditor
        notes={action.id === "notes"}
        fields={fields}
        update={update}
        checked={checked}
        onCheck={(i) =>
          setChecked((v) =>
            v.includes(i) ? v.filter((n) => n !== i) : [...v, i],
          )
        }
        add={() => setFields((v) => [...v, [`待办 ${v.length + 1}`, ""]])}
        preferences={preferences}
        onPreferences={(key, value) =>
          setPreferences((v) => ({ ...v, [key]: value }))
        }
        onClose={closeEditor}
        onSave={save}
        error={error}
      />
    );
  return (
    <Sheet
      title={config.brand}
      className={`native-service app-${action.app} ${config.kind} ${saved ? "is-saved" : ""}`}
      onClose={onClose}
    >
      <div
        className="native-frame"
        data-figma-frame={
          saved ? config.resultFrame || config.frame : config.frame
        }
      >
        <h3>
          <button
            className="native-title"
            disabled={
              !configs[action.id] ||
              saved ||
              action.id === "contact" ||
              action.id === "reminder" ||
              action.id === "calendar-complete"
            }
            onClick={() => setEditor(true)}
            title="打开编辑页"
          >
            {saved
              ? action.id === "notes"
                ? `已添加 ${fields.length} 项待办`
                : config.result
              : action.title}
          </button>
        </h3>
        {(config.subtitle || saved) && (
          <p className="native-subtitle">
            {saved
              ? JSON.stringify(fields) === JSON.stringify(action.fields)
                ? config.resultSubtitle
                : action.app === "mail"
                  ? ""
                  : "已保存修改后的信息"
              : config.subtitle}
          </p>
        )}
        {saved && !config.kind.includes("notes") && (
          <span className="native-success">✓</span>
        )}
        <div className="native-fields">
          {fields.map(([key, value], i) => (
            <label key={key}>
              <span>
                {config.kind === "notes" ? <i className="todo-check" /> : key}
              </span>
              {saved ? (
                <p>{value}</p>
              ) : (
                <textarea
                  rows={Math.min(
                    5,
                    Math.max(
                      1,
                      Math.ceil(value.replace(/[ -~]{2}/g, "x").length / 18),
                    ),
                  )}
                  aria-label={key}
                  value={value}
                  onChange={(e) => {
                    update(i, e.target.value);
                    setError("");
                  }}
                />
              )}
            </label>
          ))}
        </div>
        {config.kind === "notes" && (
          <p className="native-source">来源：当前选中的消息</p>
        )}
        {error && (
          <p className="native-error" role="alert">
            {error}
          </p>
        )}
        <button className="native-cta" onClick={saved ? onClose : save}>
          {saved
            ? "完成"
            : action.id === "contact-copy"
              ? "复制号码"
              : action.cta.replace(/本地|本机/g, "")}
        </button>
      </div>
    </Sheet>
  );
}

export { default as NativeAnswer } from "./XiaoyiAnswer";
