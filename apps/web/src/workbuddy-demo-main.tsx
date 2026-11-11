import {configureUILanguageStorage, setUILanguage} from "./i18n";
import "./workbuddy-demo-i18n";
import {uiText, useUILanguage} from "./i18n";
import { DemoTaskView } from "./workbuddy-demo-results";
import { runDemoGeneration } from "./workbuddy-demo-api";
import type { DemoRequest } from "../../../packages/core/workbuddy-demo-state";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  Settings,
  ArrowUp,
  PanelLeft,
  Search,
  CirclePlus,
  ChevronDown,
  ShieldCheck,
  Bell,
  Camera,
  Check,
  ChevronLeft,
  FileText,
  Folder,
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
import "./web-deck.css";
import "./workbuddy-demo.css";
import { WorkBuddyDemoPopover } from "./workbuddy-demo-popover";

configureUILanguageStorage("workbuddy-standalone-demo:language");
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
      aria-label={uiText("拍摄图片")}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <section>
        <header>
          <b>{uiText("拍摄图片")}</b>
          <button autoFocus aria-label={uiText("关闭摄像头")} onClick={onClose}>
            <X />
          </button>
        </header>
        <video ref={video} muted playsInline />
        <button
          className="demo-primary"
          disabled={!ready || taking}
          onClick={() => void capture()}
        >
          <Camera size={18} />{uiText("拍摄")}</button>
      </section>
    </div>
  );
}
function App() {
  const language = useUILanguage();
  useEffect(() => {
    document.title = uiText("小艺Work") + " · " + uiText("多模态输入");
    document.documentElement.lang = language;
  }, [language]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const jobs = useRef(new Map<string, AbortController>());
  const [state, setState] = useState<DemoState | null>(null),
    latest = useRef<DemoState | null>(null);
  const [collapsed, setCollapsed] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [search, setSearch] = useState("");
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
      for (const controller of jobs.current.values()) controller.abort();
      jobs.current.clear();
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
    speech.current?.start(language === "en" ? "en-US" : "zh-CN");
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
      const parameter = latest.current?.drafts
        .find((d) => d.id === latest.current?.active)
        ?.parameters.find(
          (p) => p.kind === next.kind && p.scope === next.scope,
        );
      setPanel({ ...next, id: next.id || parameter?.id });
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
        setPanel((current) =>
          current?.id === p.id
            ? null
            : { kind: p.kind, scope: p.scope, id: p.id, role: p.role },
        );
      }
    });
  }
  function pick(kind: "document" | "photo", scope = "全文") {
    void afterSpeech(() => {
      const owner = latest.current?.active;
      if (!owner || !picker.current) return;
      pickBinding.current = { owner, kind, scope };
      picker.current.accept =
        kind === "photo" ? "image/png,image/jpeg,image/webp" : ".pdf,.txt,.md";
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
    // Keep original-owner bytes local until explicit Send.
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
  function stopGeneration(owner: string, id: string) {
    jobs.current.get(id)?.abort();
    jobs.current.delete(id);
    update(owner, (d) => ({
      ...d,
      requests: d.requests.map((r) =>
        r.id === id && r.status === "running"
          ? {
              ...r,
              status: "stopped",
              error: "生成已停止，输入和已有成果已保留。",
            }
          : r,
      ),
    }));
  }
  function generate(owner: string, request: DemoRequest) {
    const controller = new AbortController();
    jobs.current.set(request.id, controller);
    const valid = () =>
      jobs.current.get(request.id) === controller && !controller.signal.aborted;
    const change = (fn: (r: DemoRequest) => DemoRequest) => {
      if (valid())
        update(owner, (d) => ({
          ...d,
          requests: d.requests.map((r) =>
            r.id === request.id && r.status === "running" ? fn(r) : r,
          ),
        }));
    };
    void runDemoGeneration(request, controller.signal, (event) => {
      if ("stage" in event) change((r) => ({ ...r, stage: event.stage }));
      if ("artifact" in event)
        change((r) => ({
          ...r,
          artifacts: [
            ...(r.artifacts || []).filter((a) => a.id !== event.artifact.id),
            event.artifact,
          ],
        }));
      if ("done" in event)
        change((r) => ({ ...r, status: "complete", stage: "已完成" }));
    })
      .catch((e) =>
        change((r) => ({
          ...r,
          status: "failed",
          error: e instanceof Error ? e.message : "生成失败，请重试",
        })),
      )
      .finally(() => {
        if (jobs.current.get(request.id) === controller)
          jobs.current.delete(request.id);
      });
  }
  function retryGeneration(owner: string, previous: DemoRequest) {
    const current = latest.current?.drafts.find((d) => d.id === owner);
    if (!current || current.requests.some((r) => r.status === "running"))
      return;
    const request: DemoRequest = {
      ...structuredClone(previous),
      id: crypto.randomUUID(),
      at: Date.now(),
      status: "running",
      stage: "准备材料",
      error: undefined,
      artifacts: [],
    };
    update(owner, (d) => ({ ...d, requests: [request, ...d.requests] }));
    generate(owner, request);
  }
  function send() {
    void afterSpeech(() => {
      const current = latest.current?.drafts.find(
        (d) => d.id === latest.current?.active,
      );
      if (!current || current.requests.some((r) => r.status === "running"))
        return;
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
      const request: DemoRequest = {
        ...snapshotDemoRequest(current),
        status: "running",
        stage: "准备材料",
        artifacts: [],
      };
      update(current.id, (d) => ({ ...d, requests: [request, ...d.requests] }));
      generate(current.id, request);
      setSent(true);
      setPanel(null);
      setError("");
    });
  }
  if (!draft || !state)
    return (
      <div className="demo-loading">
        {uiText(loadError || "正在打开小艺Work…")}
        {loadError && (
          <button onClick={() => location.reload()}>{uiText("重新加载")}</button>
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
          aria-label={uiText("查看 ") + material.name}
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
          aria-label={uiText("移除 ") + material.name}
          onClick={() => removeMaterial(material.id)}
        >
          <X size={14} />
        </button>
      </div>
    );
  }
  const composer = (
    <div className="demo-input-stack deck-compose-desktop">
      {panel && (
        <WorkBuddyDemoPopover
          key={panel.id || panel.kind + panel.scope}
          anchorId={panel.id}
          onClose={() => {
            setPanel(null);
            setDrawing(false);
          }}
        >
          <AgentAuxiliary
            title={uiText(
              panel.kind === "photo"
                ? "图片选择"
                : panel.kind === "color"
                  ? panel.role === "颜色"
                    ? "颜色选择"
                    : colorTitle(panel.role || "主题色")
                  : panel.kind === "duration"
                    ? "演讲时长"
                    : panel.kind === "document"
                      ? "参考资料"
                      : panel.scope === "全文"
                        ? "布局草图"
                        : `${panel.scope} · ${uiText("布局草图")}`
            )}
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
                  <Plus size={18} />{uiText("添加参考资料")}</button>
                <small>{uiText("PDF、TXT、Markdown · 单份最多 8 MB")}</small>
              </div>
            )}
          </AgentAuxiliary>
        </WorkBuddyDemoPopover>
      )}
      <AgentComposer
        className="deck-composer demo-composer"
        label={uiText("小艺Work 任务输入区")}
        footer={
          <>
            <div className="demo-add">
              <button
                aria-label={uiText("添加内容")}
                aria-expanded={addMenu}
                onClick={() => void afterSpeech(() => setAddMenu(!addMenu))}
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
                    <FileText size={17} />{uiText("参考文件")}</button>
                  <button
                    onClick={() => openPanel({ kind: "photo", scope: "全文" })}
                  >
                    <ImagePlus size={17} />{uiText("图片")}</button>
                  <button
                    onClick={() => openPanel({ kind: "sketch", scope: "全文" })}
                  >
                    <LayoutTemplate size={17} />{uiText("布局草图")}</button>
                </div>
              )}
            </div>
            <span className="demo-footer-space" />
            <button
              className="demo-voice"
              aria-label={uiText(phase === "idle" ? "开始语音输入" : "停止语音输入")}
              aria-pressed={phase !== "idle"}
              data-phase={phase}
              disabled={busy || drawing || phase === "stopping"}
              onClick={toggleVoice}
            >
              <Mic size={20} />
            </button>
            <button
              className="demo-send"
              aria-label={uiText("发送请求")}
              data-accepted={sent}
              disabled={
                busy ||
                draft.requests.some((r) => r.status === "running") ||
                drawing ||
                !draft.text.trim() ||
                phase !== "idle"
              }
              onClick={send}
            >
              <ArrowUp size={20} />
            </button>
          </>
        }
      >
        {draft.materials.length > 0 && (
          <div className="demo-attachments" aria-label={uiText("已确认的材料")}>
            {draft.materials.map((m) => materialTile(m))}
          </div>
        )}
        <div
          onPointerDownCapture={(event) => {
            if (
              (event.target as HTMLElement).closest(".wb-sentence-composer") &&
              !(event.target as HTMLElement).closest(".sentence-token")
            )
              stopForTyping();
          }}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              if (!busy && !drawing && phase === "idle") send();
            }
          }}
        >
          <SentenceComposer
            ref={area}
            label={uiText("小艺Work 任务输入")}
            inputMode="text"
            text={draft.text}
            parameters={[]}
            input={noInput}
            files={[]}
            active={null}
            disabled={busy}
            placeholder={uiText("今天帮你做些什么？")}
            onSelect={() => {}}
            onFocus={stopForTyping}
            onChange={(text) => {
              stopForTyping();
              update(draft.id, (d) => editDemoText(d, text));
            }}
            onOpen={() => {}}
            live={{
              controlsId: "demo-input-widget",
              parameters: draft.parameters.map((parameter) => {
                const file =
                  parameter.kind === "document"
                    ? draft.materials.find(
                        (material) =>
                          material.kind === "document" &&
                          material.scope === parameter.scope,
                      )
                    : undefined;
                return file ? { ...parameter, label: file.name } : parameter;
              }),
              active: panel?.id || null,
              open: openParameter,
            }}
          />
        </div>
      </AgentComposer>
      <div className="wb-composer-options">
        <button onClick={() => pick("document")}>
          <Folder size={16} />{uiText("选择工作空间")}<ChevronDown size={12} />
        </button>
        <button
          aria-disabled="true"
          onClick={() =>
            report("发送后使用 Gemini 生成成果，材料仅用于当前任务。")
          }
        >
          <ShieldCheck size={16} />{uiText("默认权限")}<ChevronDown size={12} />
        </button>
      </div>
      {
        <div className="demo-pending">
          {draft.pendingPhotos.length > 0 && (
            <button onClick={() => openPanel({ kind: "photo", scope: "全文" })}>
              {draft.pendingPhotos.length} {uiText("张图片待确认")}<ChevronLeft size={13} style={{ transform: "rotate(180deg)" }} />
            </button>
          )}
          {pendingSketch && (
            <button
              onClick={() =>
                openPanel({ kind: "sketch", scope: pendingSketch[0] })
              }
            >{uiText("布局草图待确认")}<ChevronLeft size={13} style={{ transform: "rotate(180deg)" }} />
            </button>
          )}
        </div>
      }
    </div>
  );
  return (
    <div
      className={
        "workbuddy demo-app live-workbuddy" + (collapsed ? " wb-collapsed" : "")
      }
    >
      <aside className="wb-sidebar">
        <div className="wb-brand-row">
          <div className="xiaoyi-brand"><img src="./assets/xiaoyi-work/logo.png" alt="" /><b>{uiText("小艺Work")}</b></div>
          <button
            aria-label={uiText(collapsed ? "展开侧栏" : "收起侧栏")}
            onClick={() => setCollapsed(!collapsed)}
          >
            <PanelLeft size={17} />
          </button>
          <button
            aria-label={uiText("搜索任务")}
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search size={17} />
          </button>
        </div>
        <nav>
          <button
            className="active"
            aria-label={uiText("新建演示")}
            onClick={createDraft}
            disabled={busy}
          >
            <CirclePlus size={17} />{uiText("新建任务")}</button>
        </nav>
        <div className="wb-history">
          {searchOpen && (
            <input
              autoFocus
              aria-label={uiText("搜索演示草稿")}
              placeholder={uiText("搜索任务")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          )}
          <small>{uiText("任务 (")}{state.drafts.length})</small>
          <div role="navigation" aria-label={uiText("演示草稿")}>
            {state.drafts
              .filter((d) => !search || d.text.includes(search))
              .map((d) => (
                <div
                  className={
                    "wb-history-item " + (d.id === draft.id ? "active" : "")
                  }
                  key={d.id}
                >
                  <button
                    aria-current={d.id === draft.id ? "page" : undefined}
                    onClick={() => switchDraft(d.id)}
                    disabled={busy}
                  >
                    <span>{d.text.trim().slice(0, 24) || uiText("新建任务")}</span>
                  </button>
                  <small>
                    {uiText(d.requests[0]?.status === "running"
                      ? "生成中"
                      : d.requests[0]?.status === "complete"
                        ? "已完成"
                        : d.requests.length
                          ? "已发送"
                          : "草稿")}
                  </small>
                </div>
              ))}
          </div>
        </div>
        <footer>
          <span className="wb-account">
            <img src="./assets/xiaoyi-work/logo.png" alt="" />{uiText("小艺Work")}</span>
          <button
            aria-label={uiText("消息中心")}
            onClick={() => report("当前没有新消息。")}
          >
            <Bell size={17} />
          </button>
          <button
            aria-label={uiText("清理演示")}
            onClick={() => {
              speech.current?.cancel();
              setClearOpen(true);
            }}
          >
            <Trash2 size={17} />
          </button>
        </footer>
        <span className="demo-save-state" role="status" aria-label={uiText("保存状态")}>
          {uiText(saving ? "正在保存…" : saveFailed ? "尚未保存" : "保存在这台电脑")}
        </span>
      </aside>
      <main className="wb-main">
        <div className="demo-settings">
          <button aria-label={uiText("设置")} aria-expanded={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)}><Settings size={19}/></button>
          {settingsOpen && <section role="dialog" aria-label={uiText("设置")} onKeyDown={e => {if(e.key === "Escape") setSettingsOpen(false);}}>
            <header><b>{uiText("设置")}</b><button aria-label={uiText("关闭设置")} onClick={() => setSettingsOpen(false)}><X size={16}/></button></header>
            <label>{uiText("界面与语音语言")}<select aria-label={uiText("界面与语音语言")} value={language} onChange={e => {speech.current?.cancel();speechBinding.current=null;setUILanguage(e.target.value === "en" ? "en" : "zh-CN");}}><option value="zh-CN">中文 · 普通话</option><option value="en">English</option></select></label>
            <small>{uiText("切换语言不会改写你的内容。")}</small>
          </section>}
        </div>
        {latestRequest ? (
          <DemoTaskView
            key={draft.id}
            draft={draft}
            composer={composer}
            onStop={(id) => stopGeneration(draft.id, id)}
            onRetry={(request) => retryGeneration(draft.id, request)}
            onArtifact={(request, artifact) =>
              update(draft.id, (d) => ({
                ...d,
                requests: d.requests.map((r) =>
                  r.id === request
                    ? {
                        ...r,
                        artifacts: r.artifacts?.map((a) =>
                          a.id === artifact.id ? artifact : a,
                        ),
                      }
                    : r,
                ),
              }))
            }
          />
        ) : (
          <div className={"wb-home" + (panel ? " has-open-widget" : "")}>
            <div className="xiaoyi-mascot" role="img" aria-label={uiText("小艺形象")}><img src="./assets/xiaoyi-work/client-poster.webp" alt="" /></div>
            <h1>{uiText("轻松工作，就用小艺Work")}</h1>
            <div className="wb-home-entry">
              <div className="wb-scenes" aria-label={uiText("快捷创作")}>
                {[
                  { label: "文档生成", prompt: "帮我生成一份文档", Icon: FileText },
                  { label: "演示文稿", prompt: "帮我制作一份演示文稿", Icon: LayoutTemplate },
                  { label: "图片生成", prompt: "帮我生成一张图片", Icon: ImagePlus },
                ].map(({ label, prompt, Icon }) => (
                  <button key={label} onClick={() => void afterSpeech(() => update(draft.id, d =>
                    editDemoText(d, d.text ? d.text + (language === "en" ? ", " : "，") + uiText(prompt) : uiText(prompt))
                  ))}><Icon size={16}/>{uiText(label)}</button>
                ))}
              </div>
              {composer}
            </div>
          </div>
        )}
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
          {uiText(error)}
          <button aria-label={uiText("关闭提示")} onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {saveFailed && (
        <div className="demo-save-error" role="alert">{uiText("本地保存失败，请释放浏览器存储后重试。当前输入仍保留。")}<button
            onClick={() => {
              if (latest.current) commit(latest.current);
            }}
          >{uiText("重试保存")}</button>
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
          aria-label={uiText("材料预览")}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPreview(null);
          }}
        >
          <section>
            <header>
              <b>{preview.name}</b>
              <button
                autoFocus
                aria-label={uiText("关闭预览")}
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
          aria-label={uiText("清理演示")}
        >
          <section className="demo-confirm">
            <h2>{uiText("清理这份演示？")}</h2>
            <p>{uiText("将删除本页的草稿、材料和发送记录。")}</p>
            <div>
              <button autoFocus onClick={() => setClearOpen(false)}>{uiText("保留")}</button>
              <button
                className="demo-primary"
                onClick={() => {
                  for (const controller of jobs.current.values())
                    controller.abort();
                  jobs.current.clear();
                  commit(newDemoState());
                  setPanel(null);
                  setPreview(null);
                  setCamera(null);
                  setClearOpen(false);
                  setAddMenu(false);
                }}
              >{uiText("清理演示数据")}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
