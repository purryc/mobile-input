import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUp,
  Camera,
  Check,
  ChevronLeft,
  FileText,
  ImagePlus,
  LayoutTemplate,
  Mic,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { SentenceComposer } from "./sentence-composer";
import {
  AgentComposer,
  AgentAuxiliary,
  AgentColorInput,
  AgentDurationInput,
  AgentPhotoInput,
  AgentSketchInput,
} from "./agent-input-view";
import { colorTitle } from "./agent-widget-color";
import { initialWbInput } from "../../../packages/core/workbuddy-input";
import {
  BrowserDictation,
  type RecognitionEngine,
  type SpeechPhase,
} from "../../../packages/core/workbuddy-demo-speech";
import {
  newDemoDraft,
  newDemoState,
  editDemoText,
  demoSendError,
  snapshotDemoRequest,
  type DemoDraft,
  type DemoMaterial,
  type DemoState,
  type Strokes,
} from "../../../packages/core/workbuddy-demo-state";
import type { LiveInputKind } from "../../../packages/core/live-workbuddy";
import type { TextInputHandle } from "./text-input-handle";
import { loadDemo, saveDemo } from "./workbuddy-demo-storage";
import "./workbuddy.css";
import "./phone-live-workbuddy.css";
import "./workbuddy-demo.css";

const noInput = initialWbInput();
type Panel = { kind: LiveInputKind; scope: string; id?: string; role?: string };
type SpeechWindow = Window & {
  SpeechRecognition?: new () => RecognitionEngine;
  webkitSpeechRecognition?: new () => RecognitionEngine;
};
function useBlobUrl(blob: Blob) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
function MaterialImage({ material }: { material: DemoMaterial }) {
  const url = useBlobUrl(material.blob);
  return <img src={url || undefined} alt={material.name} />;
}
function MaterialDownload({ material }: { material: DemoMaterial }) {
  const url = useBlobUrl(material.blob);
  return (
    <a href={url} download={material.name}>
      {material.kind === "document" ? (
        <FileText size={18} />
      ) : (
        <MaterialImage material={material} />
      )}
      <span>{material.name}</span>
    </a>
  );
}
function CameraCapture({
  onCapture,
  onClose,
  onError,
}: {
  onCapture: (file: File) => void;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false),
    [taking, setTaking] = useState(false);
  useEffect(() => {
    let alive = true;
    void navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: false })
      .then(async (next) => {
        if (!alive) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = next;
        if (video.current) {
          video.current.srcObject = next;
          try {
            await video.current.play();
            if (alive) setReady(true);
          } catch {
            if (alive) {
              onError("摄像头预览无法播放，请重试或选择本地图片。");
              onClose();
            }
          }
        }
      })
      .catch(() => {
        if (alive) {
          onError("无法打开摄像头，请允许摄像头权限，或选择本地图片。");
          onClose();
        }
      });
    if (!navigator.mediaDevices?.getUserMedia) {
      onError("当前浏览器无法打开摄像头，请选择本地图片。");
      onClose();
    }
    return () => {
      alive = false;
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
    };
  }, []);
  async function capture() {
    const element = video.current;
    if (!element?.videoWidth || taking) return;
    setTaking(true);
    const canvas = document.createElement("canvas");
    canvas.width = element.videoWidth;
    canvas.height = element.videoHeight;
    canvas.getContext("2d")!.drawImage(element, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (blob)
      onCapture(new File([blob], "拍摄图片.jpg", { type: "image/jpeg" }));
    else onError("图片保存失败，请重新拍摄。");
    onClose();
  }
  return (
    <div
      className="demo-modal"
      role="dialog"
      aria-modal="true"
      aria-label="拍摄图片"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <section>
        <header>
          <b>拍摄图片</b>
          <button autoFocus aria-label="关闭摄像头" onClick={onClose}>
            <X />
          </button>
        </header>
        <video ref={video} muted playsInline />
        <button
          className="demo-primary"
          disabled={!ready || taking}
          onClick={() => void capture()}
        >
          <Camera size={18} />
          拍摄
        </button>
      </section>
    </div>
  );
}
function App() {
  const [state, setState] = useState<DemoState | null>(null),
    latest = useRef<DemoState | null>(null);
  const pendingWrites = useRef(0),
    [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(""),
    [error, setError] = useState(""),
    [saveFailed, setSaveFailed] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null),
    [addMenu, setAddMenu] = useState(false),
    [phase, setPhase] = useState<SpeechPhase>("idle");
  const [camera, setCamera] = useState<{ owner: string; scope: string } | null>(
      null,
    ),
    [preview, setPreview] = useState<DemoMaterial | null>(null),
    [clearOpen, setClearOpen] = useState(false);
  const [drawing, setDrawing] = useState(false),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false);
  const area = useRef<TextInputHandle>(null),
    picker = useRef<HTMLInputElement>(null),
    speech = useRef<BrowserDictation | null>(null);
  const pickBinding = useRef<{
    owner: string;
    scope: string;
    kind: "document" | "photo";
  } | null>(null);
  const speechBinding = useRef<{
    owner: string;
    base: string;
    start: number;
    end: number;
  } | null>(null);
  const speechWords = useRef("");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const errorTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  function report(message: string) {
    setError(message);
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(""), 5500);
  }
  function commit(next: DemoState) {
    latest.current = next;
    setState(next);
    pendingWrites.current++;
    setSaving(true);
    void saveDemo(next)
      .then(() => setSaveFailed(false))
      .catch(() => setSaveFailed(true))
      .finally(() => {
        pendingWrites.current--;
        if (!pendingWrites.current) setSaving(false);
      });
  }
  function update(owner: string, change: (draft: DemoDraft) => DemoDraft) {
    const current = latest.current;
    if (!current || !current.drafts.some((d) => d.id === owner)) return;
    commit({
      ...current,
      drafts: current.drafts.map((d) => (d.id === owner ? change(d) : d)),
    });
  }
  useEffect(() => {
    let alive = true;
    void loadDemo()
      .then((value) => {
        if (alive) {
          latest.current = value;
          setState(value);
        }
      })
      .catch(() => {
        if (alive)
          setLoadError("无法读取本地演示，请允许浏览器存储后刷新页面。");
      });
    const browser = window as SpeechWindow;
    speech.current = new BrowserDictation(
      () => {
        const Engine =
          browser.SpeechRecognition || browser.webkitSpeechRecognition;
        if (!Engine) throw Error("unavailable");
        return new Engine();
      },
      {
        phase: (next) => {
          setPhase(next);
          const binding = speechBinding.current;
          if (next === "idle" && binding) {
            const offset = binding.start + speechWords.current.length;
            requestAnimationFrame(() => {
              if (
                speechBinding.current === binding &&
                latest.current?.active === binding.owner
              )
                area.current?.setSelectionRange(offset, offset);
            });
          }
        },
        error: report,
        text: (words) => {
          speechWords.current = words;
          const binding = speechBinding.current;
          if (!binding) return;
          update(binding.owner, (d) =>
            editDemoText(
              d,
              binding.base.slice(0, binding.start) +
                words +
                binding.base.slice(binding.end),
            ),
          );
        },
      },
    );
    const hide = () => {
      if (document.hidden) {
        speech.current?.cancel();
        speechBinding.current = null;
        setCamera(null);
      }
    };
    document.addEventListener("visibilitychange", hide);
    const leaving = (event: BeforeUnloadEvent) => {
      if (pendingWrites.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", leaving);
    return () => {
      alive = false;
      speech.current?.cancel();
      clearTimeout(errorTimer.current);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("beforeunload", leaving);
    };
  }, []);
  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => setSent(false), 180);
    return () => clearTimeout(timer);
  }, [sent]);
  const draft = state?.drafts.find((d) => d.id === state.active);
  async function afterSpeech(action: () => void) {
    const owner = latest.current?.active;
    const binding = speechBinding.current;
    await speech.current?.stop();
    if (binding && latest.current?.active === binding.owner) {
      const offset = binding.start + speechWords.current.length;
      area.current?.setSelectionRange(offset, offset);
    }
    speechBinding.current = null;
    if (latest.current?.active === owner) action();
  }
  function stopForTyping() {
    if (phaseRef.current !== "idle") {
      speech.current?.cancel();
      speechBinding.current = null;
    }
  }
  function toggleVoice() {
    if (phaseRef.current !== "idle") {
      void afterSpeech(() => {});
      return;
    }
    const current = latest.current?.drafts.find(
      (d) => d.id === latest.current?.active,
    );
    if (!current) return;
    setError("");
    setPanel(null);
    setAddMenu(false);
    speechWords.current = "";
    speechBinding.current = {
      owner: current.id,
      base: current.text,
      start: area.current?.selectionStart ?? current.text.length,
      end: area.current?.selectionEnd ?? current.text.length,
    };
    speech.current?.start();
  }
  function switchDraft(id: string) {
    speech.current?.cancel();
    speechBinding.current = null;
    setPanel(null);
    setCamera(null);
    setPreview(null);
    setAddMenu(false);
    setError("");
    setDrawing(false);
    const current = latest.current;
    if (current) commit({ ...current, active: id });
  }
  function createDraft() {
    const current = latest.current;
    if (!current) return;
    const fresh = newDemoDraft();
    commit({ ...current, drafts: [fresh, ...current.drafts] });
    switchDraft(fresh.id);
  }
  function openPanel(next: Panel) {
    void afterSpeech(() => {
      setAddMenu(false);
      setPanel(next);
    });
  }
  function openParameter(id: string) {
    void afterSpeech(() => {
      // A final recognition result can remove the provisional parameter that was clicked.
      const p = latest.current?.drafts
        .find((d) => d.id === latest.current?.active)
        ?.parameters.find((p) => p.id === id);
      if (p) {
        setAddMenu(false);
        setPanel({ kind: p.kind, scope: p.scope, id: p.id, role: p.role });
      }
    });
  }
  function pick(kind: "document" | "photo", scope = "全文") {
    void afterSpeech(() => {
      const owner = latest.current?.active;
      if (!owner || !picker.current) return;
      pickBinding.current = { owner, kind, scope };
      picker.current.accept =
        kind === "photo"
          ? "image/*"
          : ".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv,.xls,.xlsx";
      picker.current.value = "";
      picker.current.click();
    });
  }
  async function receiveFiles(
    files: File[],
    binding: { owner: string; scope: string; kind: "document" | "photo" },
  ) {
    if (!files.length) return;
    if (files.some((file) => file.size > 25 * 1024 * 1024)) {
      report("单个文件请控制在 25 MB 以内，再重新选择。");
      return;
    }
    if (
      binding.kind === "photo" &&
      files.some((file) => !file.type.startsWith("image/"))
    ) {
      report("请选择图片文件。");
      return;
    }
    // The browser File is the actual local byte source; it is never uploaded.
    const materials = files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      blob: file,
      kind: binding.kind,
      scope: binding.scope,
    }));
    update(binding.owner, (d) => ({
      ...d,
      [binding.kind === "photo" ? "pendingPhotos" : "materials"]: [
        ...d[binding.kind === "photo" ? "pendingPhotos" : "materials"],
        ...materials,
      ],
    }));
  }
  function removeMaterial(id: string) {
    if (draft)
      update(draft.id, (d) => ({
        ...d,
        materials: d.materials.filter((m) => m.id !== id),
        pendingPhotos: d.pendingPhotos.filter((m) => m.id !== id),
      }));
  }
  function changeParameter(value: string) {
    if (!draft || !panel?.id) return;
    update(draft.id, (d) => ({
      ...d,
      parameters: d.parameters.map((p) =>
        p.id === panel.id ? { ...p, value, label: value, manual: true } : p,
      ),
    }));
  }
  function changeSketch(lines: Strokes) {
    if (!draft || !panel) return;
    const scope = panel.scope;
    update(draft.id, (d) => ({
      ...d,
      sketches: { ...d.sketches, [scope]: lines },
      materials: lines.length
        ? d.materials
        : d.materials.filter((m) => m.kind !== "sketch" || m.scope !== scope),
    }));
  }
  async function adoptSketch() {
    if (!draft || !panel) return;
    const owner = draft.id,
      scope = panel.scope;
    const strokes =
      draft.sketches[scope] ??
      draft.materials.find((m) => m.kind === "sketch" && m.scope === scope)
        ?.strokes ??
      [];
    if (!strokes.some((stroke) => stroke.length > 1)) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 656;
      canvas.height = 384;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#146c64";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const stroke of strokes) {
        ctx.beginPath();
        stroke.forEach(([x, y], i) =>
          i
            ? ctx.lineTo(x * canvas.width, y * canvas.height)
            : ctx.moveTo(x * canvas.width, y * canvas.height),
        );
        ctx.stroke();
      }
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw Error("无法保存草图，请重试。");
      update(owner, (d) => {
        const sketches = { ...d.sketches };
        delete sketches[scope];
        return {
          ...d,
          sketches,
          materials: [
            ...d.materials.filter(
              (m) => m.kind !== "sketch" || m.scope !== scope,
            ),
            {
              id: crypto.randomUUID(),
              kind: "sketch",
              name: scope === "全文" ? "布局草图.png" : `${scope}布局.png`,
              scope,
              blob,
              size: blob.size,
              strokes: structuredClone(strokes),
            },
          ],
        };
      });
      if (latest.current?.active === owner) setPanel(null);
    } catch (e) {
      report((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function send() {
    void afterSpeech(() => {
      const current = latest.current?.drafts.find(
        (d) => d.id === latest.current?.active,
      );
      if (!current) return;
      const problem = demoSendError(current);
      if (problem) {
        report(problem);
        if (current.pendingPhotos.length)
          setPanel({
            kind: "photo",
            scope: current.pendingPhotos[0].scope || "全文",
          });
        else {
          const scope = Object.keys(current.sketches).find(
            (s) => current.sketches[s].length,
          );
          if (scope) setPanel({ kind: "sketch", scope });
        }
        return;
      }
      const request = snapshotDemoRequest(current);
      update(current.id, (d) => ({ ...d, requests: [request, ...d.requests] }));
      setSent(true);
      setPanel(null);
      setError("");
    });
  }
  if (!draft || !state)
    return (
      <div className="demo-loading">
        {loadError || "正在打开 WorkBuddy…"}
        {loadError && (
          <button onClick={() => location.reload()}>重新加载</button>
        )}
      </div>
    );
  const parameter = draft.parameters.find((p) => p.id === panel?.id);
  const sketches =
    draft.sketches[panel?.scope || "全文"] ??
    draft.materials.find((m) => m.kind === "sketch" && m.scope === panel?.scope)
      ?.strokes ??
    [];
  const photos = [
    ...draft.materials.filter((m) => m.kind === "photo"),
    ...draft.pendingPhotos,
  ];
  const latestRequest = draft.requests[0];
  const pendingSketch = Object.entries(draft.sketches).find(
    ([, lines]) => lines.length,
  );
  function materialTile(material: DemoMaterial, photoPanel = false): ReactNode {
    return (
      <div
        className="demo-material"
        key={material.id}
        data-pending={draft!.pendingPhotos.some((p) => p.id === material.id)}
      >
        <button
          title={material.name}
          aria-label={"查看 " + material.name}
          onClick={() => {
            if (material.kind === "sketch")
              openPanel({ kind: "sketch", scope: material.scope || "全文" });
            else if (material.kind === "photo" && !photoPanel)
              openPanel({ kind: "photo", scope: material.scope || "全文" });
            else setPreview(material);
          }}
        >
          {material.kind === "document" ? (
            <FileText size={25} />
          ) : (
            <MaterialImage material={material} />
          )}
          <span>{material.name}</span>
        </button>
        <button
          className="demo-remove"
          aria-label={"移除 " + material.name}
          onClick={() => removeMaterial(material.id)}
        >
          <X size={14} />
        </button>
      </div>
    );
  }
  return (
    <div className="workbuddy demo-app live-workbuddy">
      <aside className="demo-sidebar">
        <div className="demo-brand">
          <img src="./assets/apps/workbuddy.svg" alt="" />
          <strong>WorkBuddy</strong>
        </div>
        <button className="demo-new" onClick={createDraft} disabled={busy}>
          <Plus size={18} />
          新建演示
        </button>
        <div className="demo-history-label">最近的输入</div>
        <nav aria-label="演示草稿">
          {state.drafts.map((d) => (
            <button
              key={d.id}
              aria-current={d.id === draft.id ? "page" : undefined}
              onClick={() => switchDraft(d.id)}
              disabled={busy}
            >
              <span>{d.text.trim().slice(0, 24) || "新的想法"}</span>
              <small>{d.requests.length ? "已发送" : "草稿"}</small>
            </button>
          ))}
        </nav>
        <div className="demo-sidebar-bottom">
          <span role="status" aria-label="保存状态">
            <i />
            {saving ? "正在保存…" : saveFailed ? "尚未保存" : "保存在这台电脑"}
          </span>
          <button
            aria-label="清理演示"
            onClick={() => {
              speech.current?.cancel();
              setClearOpen(true);
            }}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </aside>
      <main className="demo-main">
        <header className="demo-topbar">
          <span>新建任务</span>
          <span className="demo-edition">多模态输入演示</span>
        </header>
        <div className={"demo-content" + (latestRequest ? " has-request" : "")}>
          <div className="demo-greeting">
            <img src="./assets/apps/workbuddy-mascot.png" alt="" />
            <h1>今天，想完成什么？</h1>
            <p>说出你的想法，边说边完善。</p>
          </div>
          <div className="demo-input-stack">
            {panel && (
              <div className="demo-widget-wrap">
                <AgentAuxiliary
                  title={
                    panel.kind === "photo"
                      ? "图片选择"
                      : panel.kind === "color"
                        ? colorTitle(panel.role || "主题色")
                        : panel.kind === "duration"
                          ? "演讲时长"
                          : panel.kind === "document"
                            ? "参考资料"
                            : panel.scope === "全文"
                              ? "布局草图"
                              : `${panel.scope} · 布局草图`
                  }
                  busy={busy}
                  onClose={() => {
                    setPanel(null);
                    setDrawing(false);
                  }}
                >
                  {panel.kind === "color" && (
                    <AgentColorInput
                      key={panel.id}
                      label={panel.role || "主题色"}
                      value={parameter?.value || "#146C64"}
                      onChange={changeParameter}
                      onActive={setDrawing}
                      onDone={() => setPanel(null)}
                    />
                  )}
                  {panel.kind === "duration" && (
                    <AgentDurationInput
                      value={parameter?.value || ""}
                      onChange={changeParameter}
                    />
                  )}
                  {panel.kind === "photo" && (
                    <AgentPhotoInput
                      onChoose={() => pick("photo", panel.scope)}
                      onCapture={() =>
                        setCamera({ owner: draft.id, scope: panel.scope })
                      }
                      onDone={() => {
                        update(draft.id, (d) => ({
                          ...d,
                          materials: [...d.materials, ...d.pendingPhotos],
                          pendingPhotos: [],
                        }));
                        setPanel(null);
                      }}
                    >
                      {photos.map((m) => materialTile(m, true))}
                    </AgentPhotoInput>
                  )}
                  {panel.kind === "sketch" && (
                    <AgentSketchInput
                      key={draft.id + panel.scope}
                      strokes={sketches}
                      onChange={changeSketch}
                      onActive={setDrawing}
                      onAdopt={() => void adoptSketch()}
                      busy={busy}
                    />
                  )}
                  {panel.kind === "document" && (
                    <div className="demo-documents">
                      {draft.materials
                        .filter((m) => m.kind === "document")
                        .map((m) => materialTile(m))}
                      <button onClick={() => pick("document", panel.scope)}>
                        <Plus size={18} />
                        添加参考资料
                      </button>
                    </div>
                  )}
                </AgentAuxiliary>
              </div>
            )}
            <AgentComposer
              className="demo-composer"
              label="WorkBuddy 任务输入区"
              footer={
                <>
                  <div className="demo-add">
                    <button
                      aria-label="添加内容"
                      aria-expanded={addMenu}
                      onClick={() =>
                        void afterSpeech(() => setAddMenu(!addMenu))
                      }
                      disabled={busy || drawing}
                    >
                      <Plus size={20} />
                    </button>
                    {addMenu && (
                      <div className="demo-add-menu">
                        <button
                          onClick={() => {
                            setAddMenu(false);
                            pick("document");
                          }}
                        >
                          <FileText size={17} />
                          参考文件
                        </button>
                        <button
                          onClick={() =>
                            openPanel({ kind: "photo", scope: "全文" })
                          }
                        >
                          <ImagePlus size={17} />
                          图片
                        </button>
                        <button
                          onClick={() =>
                            openPanel({ kind: "sketch", scope: "全文" })
                          }
                        >
                          <LayoutTemplate size={17} />
                          布局草图
                        </button>
                      </div>
                    )}
                  </div>
                  <span className="demo-footer-space" />
                  <button
                    className="demo-voice"
                    aria-label={
                      phase === "idle" ? "开始语音输入" : "停止语音输入"
                    }
                    aria-pressed={phase !== "idle"}
                    data-phase={phase}
                    disabled={busy || drawing || phase === "stopping"}
                    onClick={toggleVoice}
                  >
                    {phase === "idle" ? (
                      <Mic size={18} />
                    ) : (
                      <span className="demo-wave" aria-hidden>
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                    <span>语音输入</span>
                  </button>
                  <button
                    className="demo-send"
                    aria-label="发送请求"
                    data-accepted={sent}
                    disabled={
                      busy || drawing || !draft.text.trim() || phase !== "idle"
                    }
                    onClick={send}
                  >
                    <ArrowUp size={20} />
                  </button>
                </>
              }
            >
              {draft.materials.length > 0 && (
                <div className="demo-attachments" aria-label="已确认的材料">
                  {draft.materials.map((m) => materialTile(m))}
                </div>
              )}
              <div
                onPointerDownCapture={(event) => {
                  if (
                    (event.target as HTMLElement).closest(
                      ".wb-sentence-composer",
                    ) &&
                    !(event.target as HTMLElement).closest(".sentence-token")
                  )
                    stopForTyping();
                }}
                onKeyDown={(event) => {
                  if (
                    (event.ctrlKey || event.metaKey) &&
                    event.key === "Enter"
                  ) {
                    event.preventDefault();
                    if (!busy && !drawing && phase === "idle") send();
                  }
                }}
              >
                <SentenceComposer
                  ref={area}
                  label="WorkBuddy 任务输入"
                  inputMode="text"
                  text={draft.text}
                  parameters={[]}
                  input={noInput}
                  files={[]}
                  active={null}
                  disabled={busy}
                  placeholder="描述你的任务，或点击语音输入…"
                  onSelect={() => {}}
                  onFocus={stopForTyping}
                  onChange={(text) => {
                    stopForTyping();
                    update(draft.id, (d) => editDemoText(d, text));
                  }}
                  onOpen={() => {}}
                  live={{
                    parameters: draft.parameters.map((parameter) => {
                      const file =
                        parameter.kind === "document"
                          ? draft.materials.find(
                              (material) =>
                                material.kind === "document" &&
                                material.scope === parameter.scope,
                            )
                          : undefined;
                      return file
                        ? { ...parameter, label: file.name }
                        : parameter;
                    }),
                    active: panel?.id || null,
                    open: openParameter,
                  }}
                />
              </div>
            </AgentComposer>
            {
              <div className="demo-pending">
                {draft.pendingPhotos.length > 0 && (
                  <button
                    onClick={() => openPanel({ kind: "photo", scope: "全文" })}
                  >
                    {draft.pendingPhotos.length} 张图片待确认
                    <ChevronLeft
                      size={13}
                      style={{ transform: "rotate(180deg)" }}
                    />
                  </button>
                )}
                {pendingSketch && (
                  <button
                    onClick={() =>
                      openPanel({ kind: "sketch", scope: pendingSketch[0] })
                    }
                  >
                    布局草图待确认
                    <ChevronLeft
                      size={13}
                      style={{ transform: "rotate(180deg)" }}
                    />
                  </button>
                )}
              </div>
            }
            {!draft.text && !draft.materials.length && (
              <div className="demo-hints">
                <span>试着说</span>
                <p>
                  “做一份产品介绍，主题色用红色，背景用灰色，讲五分钟，再加几张产品图片。”
                </p>
              </div>
            )}
          </div>
          {latestRequest && (
            <section className="demo-result" aria-label="发送的请求">
              <header>
                <span>
                  <Check size={16} />
                  本次请求
                </span>
                <small>
                  已整理 ·{" "}
                  {new Date(latestRequest.at).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </header>
              <p>{latestRequest.text}</p>
              {latestRequest.materials.length > 0 && (
                <div className="demo-result-materials">
                  {latestRequest.materials.map((m) => (
                    <MaterialDownload key={m.id} material={m} />
                  ))}
                </div>
              )}
              <details>
                <summary>查看参数与发送记录（{draft.requests.length}）</summary>
                <dl>
                  {latestRequest.parameters.map((p) => (
                    <div key={p.id}>
                      <dt>
                        {p.scope} · {p.kind === "photo" ? "图片" : p.role}
                      </dt>
                      <dd>{p.value || p.label}</dd>
                    </div>
                  ))}
                </dl>
                {draft.requests.slice(1).map((r) => (
                  <article key={r.id}>
                    <small>{new Date(r.at).toLocaleTimeString("zh-CN")}</small>
                    <p>{r.text}</p>
                    <div className="demo-result-materials">
                      {r.materials.map((m) => (
                        <MaterialDownload key={m.id} material={m} />
                      ))}
                    </div>
                  </article>
                ))}
              </details>
            </section>
          )}
        </div>
        <footer className="demo-page-footer">
          WorkBuddy · Dynamic multimodal input
        </footer>
      </main>
      <input
        hidden
        type="file"
        multiple
        ref={picker}
        onChange={(event) => {
          const binding = pickBinding.current,
            files = Array.from(event.target.files || []);
          if (binding) void receiveFiles(files, binding);
          event.target.value = "";
        }}
      />
      {error && (
        <div className="demo-toast" role="alert">
          {error}
          <button aria-label="关闭提示" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {saveFailed && (
        <div className="demo-save-error" role="alert">
          本地保存失败，请释放浏览器存储后重试。当前输入仍保留。
          <button
            onClick={() => {
              if (latest.current) commit(latest.current);
            }}
          >
            重试保存
          </button>
        </div>
      )}
      {camera && (
        <CameraCapture
          key={camera.owner}
          onClose={() => setCamera(null)}
          onError={report}
          onCapture={(file) =>
            void receiveFiles([file], { ...camera, kind: "photo" })
          }
        />
      )}
      {preview && (
        <div
          className="demo-modal"
          role="dialog"
          aria-modal="true"
          aria-label="材料预览"
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreview(null);
          }}
        >
          <section>
            <header>
              <b>{preview.name}</b>
              <button
                autoFocus
                aria-label="关闭预览"
                onClick={() => setPreview(null)}
              >
                <X />
              </button>
            </header>
            {preview.kind !== "document" && (
              <MaterialImage material={preview} />
            )}
            <MaterialDownload material={preview} />
          </section>
        </div>
      )}
      {clearOpen && (
        <div
          className="demo-modal"
          role="dialog"
          aria-modal="true"
          aria-label="清理演示"
        >
          <section className="demo-confirm">
            <h2>清理这份演示？</h2>
            <p>将删除本页的草稿、材料和发送记录。</p>
            <div>
              <button autoFocus onClick={() => setClearOpen(false)}>
                保留
              </button>
              <button
                className="demo-primary"
                onClick={() => {
                  commit(newDemoState());
                  setPanel(null);
                  setPreview(null);
                  setCamera(null);
                  setClearOpen(false);
                  setAddMenu(false);
                }}
              >
                清理演示数据
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
