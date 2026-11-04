/** Browser-only adapter; no native or device runtime dependencies. */
export interface RecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
export interface RecognitionEvent {
  results: ArrayLike<RecognitionResult>;
}
export interface RecognitionEngine {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export type SpeechPhase = "idle" | "starting" | "listening" | "stopping";
export interface SpeechSink {
  text: (text: string) => void;
  phase: (phase: SpeechPhase) => void;
  error: (message: string) => void;
}
const errors: Record<string, string> = {
  "not-allowed":
    "麦克风权限未开启，请在地址栏允许麦克风后重试，也可以直接键入。",
  "service-not-allowed":
    "浏览器语音服务不可用，请使用 Chrome 重试，也可以直接键入。",
  "audio-capture": "无法使用麦克风，请检查设备连接和系统权限后重试。",
  network: "语音连接中断，文字已保留；请检查网络后重试，也可以直接键入。",
  "language-not-supported":
    "当前语音服务不支持所选语言，请检查 Chrome 语音设置。",
};
export class BrowserDictation {
  private engine: RecognitionEngine | null = null;
  private wanted = false;
  private token = 0;
  private prefix = "";
  private segment = "";
  private heard = false;
  private emptyEnds = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopTimer: ReturnType<typeof setTimeout> | undefined;
  private done: (() => void) | undefined;
  private stopping: Promise<void> | undefined;
  constructor(
    private factory: () => RecognitionEngine,
    private sink: SpeechSink,
  ) {}
  private language = "zh-CN";
  start(language = "zh-CN") {
    if (this.wanted || this.engine || this.stopping) return;
    this.language = language;
    this.wanted = true;
    this.prefix = "";
    this.segment = "";
    this.heard = false;
    this.emptyEnds = 0;
    this.sink.phase("starting");
    this.begin();
  }
  private begin() {
    if (!this.wanted) return;
    const token = ++this.token;
    let engine: RecognitionEngine;
    try {
      engine = this.factory();
    } catch {
      this.fail(
        "当前浏览器无法启动语音，请使用 Chrome 并允许麦克风，也可以直接键入。",
      );
      return;
    }
    this.engine = engine;
    this.segment = "";
    engine.lang = this.language;
    engine.continuous = true;
    engine.interimResults = true;
    const valid = () => token === this.token && this.engine === engine;
    engine.onstart = () => {
      if (valid()) this.sink.phase(this.wanted ? "listening" : "stopping");
    };
    engine.onresult = (event) => {
      if (!valid()) return;
      // Results are cumulative within one engine run; interim entries can shrink or change.
      this.segment = Array.from(
        event.results,
        (r) => this.language.startsWith("en") ? (r[0]?.transcript || "").trim() : r[0]?.transcript || "",
      ).join(this.language.startsWith("en") ? " " : "");
      if (this.segment.trim()) this.heard = true;
      this.sink.text(this.prefix + this.segment);
    };
    engine.onerror = (event) => {
      if (!valid()) return;
      if (event.error === "no-speech" && this.wanted) return;
      if (event.error === "aborted" && !this.wanted) {
        this.finish();
        return;
      }
      this.fail(
        errors[event.error] ||
          "语音暂时不可用，文字已保留；请重试，也可以直接键入。",
      );
    };
    engine.onend = () => {
      if (!valid()) return;
      this.engine = null;
      if (!this.wanted) {
        if (!this.heard) this.sink.error("未识别到文字，请重新说一次。");
        this.finish();
        return;
      }
      this.emptyEnds = this.segment.trim() ? 0 : this.emptyEnds + 1;
      if (this.emptyEnds >= 3) {
        this.fail("未收到语音，请检查麦克风后重试，也可以直接键入。");
        return;
      }
      this.prefix += this.segment;
      if (this.language.startsWith("en") && this.prefix && !/\s$/.test(this.prefix)) this.prefix += " ";
      this.segment = "";
      this.timer = setTimeout(() => this.begin(), 180);
    };
    try {
      engine.start();
    } catch {
      this.fail("语音启动失败，请检查麦克风权限后重试。");
    }
  }
  stop(): Promise<void> {
    if (this.stopping) return this.stopping;
    this.wanted = false;
    clearTimeout(this.timer);
    if (!this.engine) {
      this.finish();
      return Promise.resolve();
    }
    this.sink.phase("stopping");
    const promise = new Promise<void>((resolve) => {
      this.done = resolve;
    });
    this.stopping = promise;
    this.stopTimer = setTimeout(() => this.finish(true), 1800);
    try {
      this.engine.stop();
    } catch {
      this.finish(true);
    }
    return promise;
  }
  /** Keep the latest visible words, invalidate every callback and release capture. */
  cancel() {
    this.wanted = false;
    this.finish(true);
  }
  private fail(message: string) {
    this.sink.error(message);
    this.wanted = false;
    this.finish(true);
  }
  private finish(abort = false) {
    clearTimeout(this.timer);
    clearTimeout(this.stopTimer);
    this.wanted = false;
    ++this.token;
    const engine = this.engine;
    this.engine = null;
    if (engine) {
      engine.onstart = null;
      engine.onresult = null;
      engine.onerror = null;
      engine.onend = null;
      if (abort)
        try {
          engine.abort();
        } catch {}
    }
    this.sink.phase("idle");
    const done = this.done;
    this.done = undefined;
    this.stopping = undefined;
    done?.();
  }
}
