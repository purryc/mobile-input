import type { DemoArtifact } from "./workbuddy-demo-generation";
import {
  resolveLiveParameters,
  projectTargetInput,
  workBuddyInputCapabilities,
  type LiveParameter,
  type TargetMaterial,
} from "./live-workbuddy";
export type Strokes = number[][][];
export interface DemoMaterial extends TargetMaterial {
  blob: Blob;
  size: number;
  strokes?: Strokes;
}
export interface DemoRequest {
  id: string;
  at: number;
  text: string;
  parameters: LiveParameter[];
  materials: DemoMaterial[];
  status?: "running" | "complete" | "failed" | "stopped";
  stage?: string;
  error?: string;
  artifacts?: DemoArtifact[];
}
export interface DemoDraft {
  id: string;
  text: string;
  parameters: LiveParameter[];
  materials: DemoMaterial[];
  pendingPhotos: DemoMaterial[];
  sketches: Record<string, Strokes>;
  requests: DemoRequest[];
}
export interface DemoState {
  version: 1;
  active: string;
  drafts: DemoDraft[];
}
export const newDemoDraft = (): DemoDraft => ({
  id: crypto.randomUUID(),
  text: "",
  parameters: [],
  materials: [],
  pendingPhotos: [],
  sketches: {},
  requests: [],
});
export function newDemoState(): DemoState {
  const draft = newDemoDraft();
  return { version: 1, active: draft.id, drafts: [draft] };
}
export function editDemoText(draft: DemoDraft, text: string): DemoDraft {
  return {
    ...draft,
    text,
    parameters: resolveLiveParameters(text, draft.parameters),
  };
}
export function demoSendError(draft: DemoDraft): string {
  if (draft.pendingPhotos.length)
    return "还有图片未确认，请打开图片选择，确认或移除后再发送。";
  if (Object.values(draft.sketches).some((lines) => lines.length))
    return "还有布局草图未确认，请确认或清空后再发送。";
  if (!draft.text.trim()) return "先描述你要完成的任务，再发送。";
  return "";
}
export function snapshotDemoRequest(draft: DemoDraft): DemoRequest {
  const error = demoSendError(draft);
  if (error) throw Error(error);
  const projected = projectTargetInput(
    draft.text,
    draft.parameters,
    draft.materials,
    workBuddyInputCapabilities,
  );
  return structuredClone({
    id: crypto.randomUUID(),
    at: Date.now(),
    text: projected.text,
    parameters: resolveLiveParameters(draft.text, draft.parameters),
    materials: draft.materials,
  });
}
