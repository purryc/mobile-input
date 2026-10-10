import { useEffect, useRef, useState } from "react";
import * as I from "lucide-react";
import { command, useRuntime, uid } from "./runtime";
import { useWorkBuddyInput } from "./workbuddy-input";
import { clipboardRead, clipboardWrite } from "./phone-native";
import { ConnectionButton } from "./connection-access";
import { SwitchButton } from "./phone-wechat";
import { usePhoneInsets } from "./phone-insets";
import "./phone-workbuddy.css";
export function PhoneWorkBuddy({onOverview}:{onOverview?:()=>void}) {
  const r = useRuntime(),
    s = r.state,
    t = s.target!,
    w = s.workbuddy,
    task = w.tasks.find((x) => x.id === w.task);
  const editor = useWorkBuddyInput(t.id, t.label),
    area = useRef<HTMLTextAreaElement>(null),
    selection = useRef({ start: 0, end: 0 }),
    value = useRef(editor.text);
  value.current = editor.text;
  const [history, setHistory] = useState<string[]>([]),
    [future, setFuture] = useState<string[]>([]),
    [speech, setSpeech] = useState("idle"),
    [error, setError] = useState(""),
    [online, setOnline] = useState(false),
    [polish, setPolish] = useState(false);
  const speechId = useRef(""),
    speechBefore = useRef(""),
    speechSelection = useRef({ start: 0, end: 0 }),
    held = useRef(false),
    originalTarget = useRef(t.id);
  function update(text: string, remember = true) {
    const before = value.current;
    if (remember && text !== before) {
      setHistory((h) => [...h, before].slice(-40));
      setFuture([]);
    }
    value.current = text;
    editor.update(text);
  }
  function select() {
    if (area.current)
      selection.current = {
        start: area.current.selectionStart,
        end: area.current.selectionEnd,
      };
  }
  function replace(text: string) {
    const { start, end } = selection.current;
    update(value.current.slice(0, start) + text + value.current.slice(end));
    const at = start + text.length;
    requestAnimationFrame(() => {
      area.current?.focus();
      area.current?.setSelectionRange(at, at);
      selection.current = { start: at, end: at };
    });
  }
  async function edit(action: string) {
    void command("switch-cancel");
    const before = value.current,
      { start, end } = selection.current;
    try {
      if (action === "all") {
        area.current?.focus();
        area.current?.select();
        selection.current = { start: 0, end: before.length };
      }
      if (action === "copy" || action === "cut") {
        if (start === end) return;
        await clipboardWrite(before.slice(start, end));
        if (action === "cut" && before === value.current) {
          selection.current = { start, end };
          replace("");
        }
      }
      if (action === "paste") {
        const pasted = await clipboardRead();
        if (value.current !== before) {
          setError("草稿已变化，请重新粘贴");
          return;
        }
        selection.current = { start, end };
        replace(pasted);
      }
      if (action === "delete") {
        if (start === end && start > 0) {
          const segments = Array.from(
            new Intl.Segmenter("zh", { granularity: "grapheme" }).segment(
              before.slice(0, start),
            ),
          );
          selection.current = {
            start: segments.at(-1)?.index ?? start - 1,
            end,
          };
        }
        replace("");
      }
      if (action === "undo" && history.length) {
        const next = history.at(-1)!;
        setHistory((h) => h.slice(0, -1));
        setFuture((h) => [...h, before]);
        update(next, false);
      }
      if (action === "redo" && future.length) {
        const next = future.at(-1)!;
        setFuture((h) => h.slice(0, -1));
        setHistory((h) => [...h, before]);
        update(next, false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "剪贴板失败，请重试");
    }
  }
  async function start() {
    void command("switch-cancel");
    if (editor.blocked || speechId.current) return;
    if (!window.MobileNative) {
      setError("语音输入需要在手机应用中使用");
      return;
    }
    await editor.flush();
    if (!held.current || !(await editor.focus())) return;
    speechId.current = uid();
    speechBefore.current = value.current;
    speechSelection.current = { ...selection.current };
    setError("");
    setPolish(false);
    setSpeech("starting");
    window.MobileNative.startRecognition(speechId.current, online);
  }
  function stop() {
    held.current = false;
    if (!speechId.current) return;
    setSpeech("finishing");
    window.MobileNative?.stopRecognition(speechId.current);
  }
  function cancel() {
    held.current = false;
    if (!speechId.current) return;
    window.MobileNative?.cancelRecognition(speechId.current);
    speechId.current = "";
    setSpeech("idle");
    update(speechBefore.current, false);
  }
  useEffect(() => {
    const listener = (event: Event) => {
      const d = (event as CustomEvent).detail;
      if (!speechId.current || d.sessionId !== speechId.current) return;
      if (d.type === "start") setSpeech("recording");
      if (d.type === "partial" || d.type === "final") {
        const { start, end } = speechSelection.current;
        update(
          speechBefore.current.slice(0, start) +
            d.text +
            speechBefore.current.slice(end),
          false,
        );
      }
      if (d.type === "complete") {
        speechId.current = "";
        setSpeech("idle");
        if (value.current !== speechBefore.current)
          setHistory((h) => [...h, speechBefore.current].slice(-40));
        setFuture([]);
        setPolish(Boolean(value.current.trim()));
      }
      if (d.type === "error") {
        speechId.current = "";
        setSpeech("idle");
        setError(d.message || "识别失败，请重试");
      }
    };
    window.addEventListener("native-speech", listener);
    return () => window.removeEventListener("native-speech", listener);
  });
  useEffect(() => {
    const background = () => {
      if (document.hidden) cancel();
    };
    window.addEventListener("connection-open", cancel);
    document.addEventListener("visibilitychange", background);
    return () => {
      window.removeEventListener("connection-open", cancel);
      document.removeEventListener("visibilitychange", background);
      if (speechId.current)
        window.MobileNative?.cancelRecognition(speechId.current);
    };
  }, []);
  useEffect(() => {
    if (!r.connected || t.id !== originalTarget.current) cancel();
  }, [r.connected, t.id]);
  function refine(kind: string) {
    const text = value.current.trim();
    if (!text) return;
    update(
      kind === "简洁"
        ? text.replace(/(?:嗯|呃|那个)[，,、\s]*/g, "").replace(/\s+/g, " ")
        : kind === "礼貌"
          ? /^(请|麻烦)/.test(text)
            ? text
            : "请帮我" + text
          : text.replace(/咱们/g, "我们").replace(/麻烦你/g, "烦请您"),
    );
  }
  const isDraft = t.id.startsWith("wb:draft:"),
    draft = w.drafts[w.task];
  return (
    <main className="workbuddy-phone" style={usePhoneInsets()}>
      <header className="wb-phone-status">
        <span>
          <i className={r.connected ? "online-dot" : "offline-dot"} />
          {r.connected ? "已连接" : "未连接"} · WorkBuddy
        </span>
        <SwitchButton beforeSwitch={cancel} />
        <ConnectionButton />
      </header>
      {onOverview && <button onClick={() => {cancel(); onOverview();}}>任务总览</button>}
      <section className="wb-phone-context">
        <div>
          <img src="./assets/apps/workbuddy.svg" alt="" />
          <h1>{isDraft ? task?.title || "新建任务" : t.label}</h1>
        </div>
        <small>
          {isDraft
            ? "任务输入"
            : t.id.startsWith("wb:file:")
              ? "文件编辑"
              : "内容编辑"}
        </small>
        {task?.messages.at(-1) && (
          <blockquote>{task.messages.at(-1)!.text}</blockquote>
        )}
        {draft?.references.map((x, i) => (
          <p className="wb-phone-reference" key={i}>
            <I.TextQuote size={14} />
            {x}
          </p>
        ))}
        {draft?.attachments.length > 0 && (
          <p className="wb-phone-reference">
            <I.Paperclip size={14} />
            {draft.attachments
              .map((id) => w.files.find((f) => f.id === id)?.name)
              .join("、")}
          </p>
        )}
      </section>
      <section className="wb-phone-editor">
        <div className="wb-phone-tools">
          {[
            [I.TextSelect, "all", "全选"],
            [I.Copy, "copy", "复制"],
            [I.Scissors, "cut", "剪切"],
            [I.ClipboardPaste, "paste", "粘贴"],
            [I.Delete, "delete", "删除"],
            [I.Undo2, "undo", "撤销"],
            [I.Redo2, "redo", "重做"],
          ].map(([C, action, label]) => {
            const Icon = C as typeof I.Copy;
            return (
              <button
                key={String(action)}
                aria-label={String(label)}
                disabled={
                  (action === "undo" && !history.length) ||
                  (action === "redo" && !future.length)
                }
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => edit(String(action))}
              >
                <Icon size={19} />
              </button>
            );
          })}
        </div>
        {editor.blocked && (
          <div className="wb-phone-warning">
            草稿已保留<button onClick={editor.recover}>恢复到当前目标</button>
          </div>
        )}
        <div className="wb-phone-draft">
          <textarea
            ref={area}
            aria-label="手机 WorkBuddy 草稿"
            placeholder={isDraft ? "描述你要完成的任务…" : "编辑内容…"}
            value={editor.text}
            onChange={(e) => {
              selection.current = {
                start: e.target.selectionStart,
                end: e.target.selectionEnd,
              };
              update(e.target.value);
            }}
            onSelect={select}
            onKeyUp={select}
            onFocus={() => {
              command("switch-cancel");
              editor.focus();
            }}
          />
          <div className="wb-phone-polish">
            {polish && (
              <>
                <span>AI润色</span>
                {["简洁", "礼貌", "正式"].map((k) => (
                  <button key={k} onClick={() => refine(k)}>
                    {k}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="wb-phone-error">
          {error && (
            <span role="alert">
              {error}
              {window.MobileNative && !online && (
                <button
                  onClick={() => {
                    setOnline(true);
                    setError("已选择系统在线识别");
                  }}
                >
                  使用系统在线识别
                </button>
              )}
            </span>
          )}
          {speech !== "idle" && <button onClick={cancel}>取消录音</button>}
        </div>
        <footer>
          <button aria-label="键盘" onClick={() => area.current?.focus()}>
            <I.Keyboard />
          </button>
          <button
            className={
              "wb-phone-voice " + (speech !== "idle" ? "recording" : "")
            }
            disabled={editor.blocked || editor.busy}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              held.current = true;
              void start();
            }}
            onPointerUp={stop}
            onPointerCancel={cancel}
            onLostPointerCapture={() => {
              if (held.current) cancel();
            }}
          >
            <I.Mic size={22} />
            {speech === "idle"
              ? "按住说话"
              : speech === "recording"
                ? "松开结束"
                : "正在识别…"}
          </button>
          <button
            className="wb-phone-send"
            aria-label={isDraft ? "发送任务" : "保存修改"}
            disabled={
              !editor.text.trim() ||
              editor.blocked ||
              editor.busy ||
              speech !== "idle"
            }
            onClick={() => editor.submit()}
          >
            <I.ArrowUp />
          </button>
        </footer>
      </section>
      {r.toast && (
        <div className="toast" role="status">
          {r.toast}
        </div>
      )}
    </main>
  );
}
