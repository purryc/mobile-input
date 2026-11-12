import { useEffect, useRef, useState } from "react";
import { uiText, useUILanguage } from "./i18n";
import { useDemoRecommendations } from "./workbuddy-demo-recommendations";
import { useDemoPolish } from "./workbuddy-demo-polish";
import { runDemoGeneration } from "./workbuddy-demo-api";
import { loadDemo, saveDemo } from "./workbuddy-demo-storage";
import type { TextInputHandle } from "./text-input-handle";
import {
  BrowserDictation,
  type RecognitionEngine,
  type SpeechPhase,
} from "../../../packages/core/workbuddy-demo-speech";
import {
  controlDefinitions,
  dismissalKey,
  openControl,
  type ControlEvent,
  type DemoControlKind,
} from "../../../packages/core/workbuddy-demo-controls";
import { demoPolishActions } from "../../../packages/core/workbuddy-demo-polish";
import { demoScenarios } from "../../../packages/core/workbuddy-demo-scenarios";
import {
  newDemoDraft,
  newDemoState,
  editDemoText as parseDemoText,
  demoSendError,
  snapshotDemoRequest,
  type DemoDraft,
  type DemoCapture,
  type DemoMaterial,
  type DemoRequest,
  type DemoState,
  type Strokes,
} from "../../../packages/core/workbuddy-demo-state";
import type { LiveInputKind } from "../../../packages/core/live-workbuddy";
const debugControlsStorageKey = "workbuddy-standalone-demo:debug-controls";
type Panel = {
  kind: DemoControlKind;
  scope: string;
  id?: string;
  role?: string;
};
const editDemoText = (draft: DemoDraft, text: string) =>
  parseDemoText(draft, text, true);
type SpeechWindow = Window & {
  SpeechRecognition?: new () => RecognitionEngine;
  webkitSpeechRecognition?: new () => RecognitionEngine;
};
export function useWorkbuddyDemoController() {
  const language = useUILanguage();
  const gallery = new URLSearchParams(location.search).get("controls");
  useEffect(() => {
    document.title = uiText("小艺Work") + " · " + uiText("多模态输入");
    document.documentElement.lang = language;
  }, [language]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showDebugControls, setShowDebugControls] = useState(() => {
    const requested = new URLSearchParams(location.search).get("debug") === "1";
    try {
      const saved = localStorage.getItem(debugControlsStorageKey);
      return saved === null ? requested : saved === "true";
    } catch {
      return requested;
    }
  });

  function toggleDebugControls() {
    const next = !showDebugControls;
    setShowDebugControls(next);
    try {
      localStorage.setItem(debugControlsStorageKey, String(next));
    } catch {
      // The switch still works for this session if storage is unavailable.
    }
  }
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
        setPanel((current) =>
          current?.kind === "scanner" || current?.kind === "capture"
            ? null
            : current,
        );
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
  const recommendations = useDemoRecommendations(
    draft,
    update,
    phase !== "idle",
  );
  const polish = useDemoPolish({
    draft,
    phase,
    language,
    disabled: busy || drawing,
    area,
    current: () =>
      latest.current?.drafts.find((d) => d.id === latest.current?.active),
    update,
  });
  const openedShowcase = useRef(false);
  useEffect(() => {
    if (draft && gallery && gallery !== "all" && !openedShowcase.current) {
      openedShowcase.current = true;
      if (controlDefinitions.some((c) => c.kind === gallery))
        invokeControl(gallery as DemoControlKind);
    }
  }, [!!draft]);
  const controlRevision = JSON.stringify(
    draft?.controls?.map((c) => [c.id, c.revision, c.seen]),
  );
  useEffect(() => {
    if (!draft?.controls?.some((c) => c.origin === "recommended" && !c.seen))
      return;
    const owner = draft.id;
    const versions = new Map(draft.controls.map((c) => [c.id, c.revision]));
    const timer = setTimeout(
      () =>
        update(owner, (d) => ({
          ...d,
          controls: d.controls?.map((c) =>
            versions.get(c.id) === c.revision ? { ...c, seen: true } : c,
          ),
        })),
      1450,
    );
    return () => clearTimeout(timer);
  }, [draft?.id, controlRevision]);
  useEffect(() => {
    setPanel(null);
    setCamera(null);
  }, [language]);
  function removeControl(id: string) {
    const owner = latest.current?.active;
    if (!owner) return;
    update(owner, (d) => {
      const c = d.controls?.find((c) => c.id === id);
      if (!c) return d;
      return editDemoText(
        {
          ...d,
          controls: d.controls?.filter((x) => x.id !== id),
          dismissedControls: [...(d.dismissedControls || []), dismissalKey(c)],
        },
        d.text,
      );
    });
    if (panel?.id === id) setPanel(null);
  }
  function controlEvent(e: ControlEvent) {
    if (e.type === "remove") {
      removeControl(e.id);
      return;
    }
    if (e.type === "close") {
      setPanel(null);
      return;
    }
    polish.cancel();
    update(e.owner, (d) =>
      editDemoText(
        {
          ...d,
          controls: d.controls?.map((c) =>
            c.id === e.id
              ? {
                  ...c,
                  value: e.value || c.value,
                  origin: "manual",
                  seen: true,
                }
              : c,
          ),
        },
        d.text,
      ),
    );
  }
  function invokeControl(kind: DemoControlKind) {
    void afterSpeech(() => {
      if (kind === "polish") {
        const current = latest.current?.drafts.find(
          (d) => d.id === latest.current?.active,
        );
        if (current && !demoPolishActions(current.text).length) {
          if (showDebugControls || gallery === "polish") {
            const fresh = editDemoText(
              newDemoDraft(),
              language === "en"
                ? "Plan the product launch. Explain the audience and benefits, then then outline the next steps."
                : "帮我整理产品发布计划。介绍受众和优势，然后然后说明下一步安排。",
            );
            commit({
              ...latest.current!,
              drafts: [fresh, ...latest.current!.drafts],
            });
            switchDraft(fresh.id);
          } else
            report(
              language === "en"
                ? "Write a request first; relevant polishing options appear below it."
                : "先描述任务，适用的润色选项会出现在文字下方。",
            );
        }
        setPanel(null);
        setAddMenu(false);
        return;
      }
      if (["color", "duration", "document", "photo", "sketch"].includes(kind)) {
        const current = latest.current?.drafts.find(
          (d) => d.id === latest.current?.active,
        );
        const existing = current?.parameters.find((p) => p.kind === kind);
        if (existing) {
          setPanel({
            kind,
            scope: existing.scope,
            id: existing.id,
            role: existing.role,
          });
          setAddMenu(false);
          return;
        }
        if (kind === "color" || kind === "duration") {
          update(latest.current!.active, (d) =>
            editDemoText(
              d,
              d.text +
                (d.text ? "，" : "") +
                (kind === "color"
                  ? language === "en"
                    ? "theme color blue"
                    : "主题色蓝色"
                  : language === "en"
                    ? "10 minutes"
                    : "10分钟"),
            ),
          );
          const p = latest
            .current!.drafts.find((d) => d.id === latest.current!.active)!
            .parameters.find((p) => p.kind === kind);
          setPanel({
            kind,
            scope: p?.scope || "全文",
            id: p?.id,
            role: p?.role,
          });
          setAddMenu(false);
          return;
        }
        setPanel({ kind, scope: "全文" });
        setAddMenu(false);
        return;
      }
      const current = latest.current?.drafts.find(
        (d) => d.id === latest.current?.active,
      );
      if (!current) return;
      const existing = current.controls?.find((c) => c.kind === kind);
      if (existing) setPanel({ kind, scope: "全文", id: existing.id });
      else
        openControl(kind, {
          owner: current.id,
          text: current.text,
          open: (binding) => {
            update(current.id, (d) => ({
              ...d,
              controls: [...(d.controls || []), binding],
            }));
            setPanel({ kind, scope: "全文", id: binding.id });
          },
        });
      setAddMenu(false);
    });
  }
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
    polish.cancel();
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
    polish.cancel();
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
  function createExample(id: string) {
    void afterSpeech(() => {
      const current = latest.current;
      const example = demoScenarios.find((item) => item.id === id);
      if (!current || !example) return;
      const fresh = editDemoText(newDemoDraft(), example.text);
      commit({ ...current, drafts: [fresh, ...current.drafts] });
      switchDraft(fresh.id);
    });
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
      const extended = latest.current?.drafts
        .find((d) => d.id === latest.current?.active)
        ?.controls?.find((c) => c.id === id);
      if (extended) {
        setAddMenu(false);
        setPanel((current) =>
          current?.id === id
            ? null
            : {
                kind: extended.kind,
                scope: extended.scope || "全文",
                role: extended.role,
                id,
              },
        );
        return;
      }
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
      controls:
        binding.kind === "document"
          ? d.controls?.map((c) =>
              c.kind === "document" && (c.scope || "全文") === binding.scope
                ? {
                    ...c,
                    origin: "manual",
                    value: files.map((f) => f.name),
                    seen: true,
                  }
                : c,
            )
          : d.controls,
      [binding.kind === "photo" ? "pendingPhotos" : "materials"]: [
        ...d[binding.kind === "photo" ? "pendingPhotos" : "materials"].filter(
          (m) =>
            binding.kind !== "document" ||
            m.id !== "reference-example-" + d.id ||
            (m.scope || "全文") !== binding.scope,
        ),
        ...materials,
      ],
    }));
  }
  function removeMaterial(id: string) {
    if (
      draft &&
      id === "reference-example-" + draft.id &&
      draft.controls?.find((c) => c.kind === "document")?.reason ===
        "related-intent"
    ) {
      removeControl("control-document");
      return;
    }
    if (draft)
      update(draft.id, (d) => ({
        ...d,
        controls: d.controls?.map((c) => {
          const removed = d.materials.find((m) => m.id === id);
          if (
            c.kind !== "document" ||
            !removed ||
            (c.scope || "全文") !== (removed.scope || "全文")
          )
            return c;
          return {
            ...c,
            origin: "manual",
            value: c.value.filter(
              (v) =>
                v !== removed.name &&
                (v !== "product-brief" || id !== "reference-example-" + d.id),
            ),
          };
        }),
        materials: d.materials.filter((m) => m.id !== id),
        pendingPhotos: d.pendingPhotos.filter((m) => m.id !== id),
      }));
  }
  function changeParameter(value: string) {
    if (!draft || !panel?.id) return;
    update(draft.id, (d) => ({
      ...d,
      controls: d.controls?.map((c) =>
        c.id === panel.id
          ? { ...c, value: [value], origin: "manual", seen: true }
          : c,
      ),
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
    if (polish.pending) return;
    recommendations.pause();
    void afterSpeech(() => {
      const current = latest.current?.drafts.find(
        (d) => d.id === latest.current?.active,
      );
      if (
        !current ||
        busy ||
        drawing ||
        current.requests.some((r) => r.status === "running")
      ) {
        recommendations.resume();
        return;
      }
      const problem = demoSendError(current);
      if (problem) {
        recommendations.resume();
        report(problem);
        if (current.captures?.some((c) => !c.confirmed)) {
          invokeControl(
            current.captures.find((c) => !c.confirmed)!.kind === "scanner"
              ? "scanner"
              : "capture",
          );
        } else if (current.pendingPhotos.length)
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
      recommendations.cancel(current);
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

  function addCapture(owner: string, item: DemoCapture) {
    update(owner, (d) => ({ ...d, captures: [...(d.captures || []), item] }));
  }
  function removeCapture(owner: string, id: string) {
    update(owner, (d) => ({
      ...d,
      captures: d.captures?.filter((c) => c.id !== id),
    }));
  }
  function confirmCapture(owner: string, mode: "scanner" | "capture") {
    update(owner, (d) => ({
      ...d,
      captures: d.captures?.map((c) =>
        (mode === "scanner" ? c.kind === "scanner" : c.kind !== "scanner")
          ? { ...c, confirmed: true }
          : c,
      ),
    }));
    setPanel(null);
  }
  function confirmPhotos(owner: string) {
    update(owner, (d) => ({
      ...d,
      materials: [...d.materials, ...d.pendingPhotos],
      pendingPhotos: [],
    }));
    setPanel(null);
  }
  function editText(owner: string, text: string) {
    update(owner, (d) => editDemoText(d, text));
  }
  return {
    addCapture,
    removeCapture,
    confirmCapture,
    confirmPhotos,
    editText,
    language,
    gallery,
    settingsOpen,
    setSettingsOpen,
    showDebugControls,
    toggleDebugControls,
    jobs,
    state,
    latest,
    collapsed,
    setCollapsed,
    searchOpen,
    setSearchOpen,
    search,
    setSearch,
    saving,
    loadError,
    error,
    setError,
    saveFailed,
    panel,
    setPanel,
    addMenu,
    setAddMenu,
    phase,
    camera,
    setCamera,
    preview,
    setPreview,
    clearOpen,
    setClearOpen,
    drawing,
    setDrawing,
    busy,
    setBusy,
    sent,
    area,
    picker,
    speech,
    pickBinding,
    speechBinding,
    draft,
    recommendations,
    polish,
    removeControl,
    controlEvent,
    invokeControl,
    afterSpeech,
    stopForTyping,
    toggleVoice,
    switchDraft,
    createExample,
    createDraft,
    openPanel,
    openParameter,
    pick,
    receiveFiles,
    removeMaterial,
    changeParameter,
    changeSketch,
    adoptSketch,
    stopGeneration,
    retryGeneration,
    send,
    report,
    commit,
    update,
  };
}
export type DemoController = ReturnType<typeof useWorkbuddyDemoController>;
export type ReadyDemoController = DemoController & {
  draft: DemoDraft;
  state: DemoState;
};
