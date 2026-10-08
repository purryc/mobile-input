import type { Message } from "../app/model";
export type Tool =
  "ask" | "translate" | "magnify" | "read" | "spotlight" | "kaleidoscope";
export type Stage =
  | "idle"
  | "focusing"
  | "focused"
  | "reading"
  | "listening"
  | "speaking"
  | "transcribing"
  | "processing"
  | "result"
  | "error";
export type Target = {
  kind?: "message" | "file" | "free";
  artifactId?: string;
  paragraphIndex?: number;
  lineRects?: Target["rect"][];
  id: string;
  messageId: string;
  text: string;
  rect: { x: number; y: number; width: number; height: number };
  messageRect?: Target["rect"];
};
export type Action = {
  recordKey?:string;
  destination?: { view: string; parameters?: Record<string, string> };
  id: string;
  label: string;
  app: string;
  title: string;
  cta: string;
  fields: [string, string][];
  sources: string[];
  fieldSources: { field: string; messageIds: string[]; note: string }[];
  missing: string[];
};
export type IntentResult = {
  title: string;
  text: string;
  actions: Action[];
  sources: string[];
  missing: string[];
  direction?: string;
  matched: boolean;
  directAction?: Action;
};
export type IntentRequest = {
  conversationId: string;
  target: Target;
  context: Message[];
  question: string;
  tool: Tool;
};
export interface IntentProvider {
  evaluate(request: IntentRequest): {
    eligible: boolean;
    focusable: boolean;
    actions: Action[];
    reason: "mapped" | "file" | "dummy" | "context-only" | "unmapped";
  };
  recommend(request: IntentRequest): Action[];
  resolve(request: IntentRequest, signal?: AbortSignal): Promise<IntentResult>;
  example(request: IntentRequest): string;
}
export type SpeechEvent =
  | { type: "started" | "speechstart" | "speechend" | "end" }
  | { type: "partial" | "final"; text: string }
  | { type: "error"; message: string };
export interface SpeechAdapter {
  readonly available: boolean;
  readonly mode: "microphone" | "preset";
  start(
    listener: (event: SpeechEvent) => void,
    options?: { text?: string; lang?: string },
  ): void;
  stop(): void;
  abort(): void;
}
