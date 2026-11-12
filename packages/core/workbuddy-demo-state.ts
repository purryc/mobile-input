import {
  recommendControls,
  dismissalKey,
  sampleReference,
  valueLabel,
  type DemoControlBinding,
} from "./workbuddy-demo-controls";
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
export interface DemoCapture {
  id: string;
  kind: "scanner" | "screenshot" | "recording";
  name: string;
  blob: Blob;
  size: number;
  duration?: number;
  confirmed: boolean;
}
export interface DemoRequest {
  controls?: DemoControlBinding[];
  captures?: DemoCapture[];
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
  controls?: DemoControlBinding[];
  dismissedControls?: string[];
  captures?: DemoCapture[];
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
  controls: [],
  dismissedControls: [],
  captures: [],
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
/** Stable semantic identity survives offset changes and repeated transcripts. */
export function recommendationIdentity(c: DemoControlBinding): string {
  return JSON.stringify([c.id, c.kind, c.scope, c.role, c.value]);
}
export function pendingDemoRecommendations(draft: DemoDraft): DemoControlBinding[] {
  const visible = new Set((draft.controls || []).map(recommendationIdentity));
  return recommendControls(draft.text, {previous: draft.controls, dismissed: draft.dismissedControls})
    .filter(c => c.origin === "recommended" && !visible.has(recommendationIdentity(c)));
}
export function revealDemoRecommendations(draft: DemoDraft, ids?: readonly string[]): DemoDraft {
  return editDemoText(draft, draft.text, ids === undefined ? false : new Set(ids));
}
export function editDemoText(draft: DemoDraft, text: string, deferRecommendations: boolean | ReadonlySet<string> = false): DemoDraft {
  const visible = new Map((draft.controls || []).map(c => [recommendationIdentity(c), c]));
  const candidates = recommendControls(text, {
    previous: draft.controls,
    dismissed: draft.dismissedControls,
  });
  const controls = deferRecommendations
    ? candidates.filter(c => c.origin !== "recommended" || visible.has(recommendationIdentity(c)) || (typeof deferRecommendations !== "boolean" && deferRecommendations.has(c.id))).map(c => {const prior = visible.get(recommendationIdentity(c));return prior && c.origin === "recommended" ? {...c, seen: prior.seen} : c;})
    : candidates;
  const sampleControl = controls.find(c => c.kind === "document" && c.value.includes("product-brief"));
  const wantsSample = Boolean(sampleControl);
  const refId = "reference-example-" + draft.id;
  const materials = draft.materials.filter(
    (m) => m.id !== refId || wantsSample,
  ).map(m => m.id===refId && sampleControl ? {...m,scope:sampleControl.scope||'全文'} : m);
  if (wantsSample && !materials.some((m) => m.id === refId)) {
    const blob = new Blob([sampleReference], { type: "text/markdown" });
    materials.push({
      id: refId,
      name: "产品介绍 · Product brief.md",
      kind: "document",
      scope: sampleControl?.scope || "全文",
      blob,
      size: blob.size,
    });
  }
  return {
    ...draft,
    text,
    materials,
    controls,
    captures: draft.captures || [],
    dismissedControls: draft.dismissedControls || [],
    parameters: demoNativeParameters({...draft, text, controls}),
  };
}
export function demoSendError(draft: DemoDraft): string {
  if (draft.captures?.some((c) => !c.confirmed))
    return "还有扫描或屏幕材料未确认，请确认或移除后再发送。";
  if (draft.captures?.some((c) => c.kind === "recording" && c.confirmed))
    return "录像已保存在草稿中，当前生成不支持视频。请移除录像后发送。 / Video is saved in this draft; remove it before generation.";
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
    [
      ...draft.materials,
      ...(draft.captures || [])
        .filter((c) => c.confirmed && c.kind !== "recording")
        .map((c) => ({
          id: c.id,
          name: c.name,
          kind: "photo" as const,
          scope: "全文",
          blob: c.blob,
          size: c.size,
        })),
    ],
    workBuddyInputCapabilities,
  );
  return structuredClone({
    id: crypto.randomUUID(),
    at: Date.now(),
    text: projectControlValues(draft, projected) + controlRequestSuffix(draft),
    controls: draft.controls || [],
    captures: (draft.captures || []).filter((c) => c.confirmed),
    parameters: demoRequestParameters(draft),
    materials: [
      ...draft.materials,
      ...(draft.captures || [])
        .filter((c) => c.confirmed && c.kind !== "recording")
        .map((c) => ({
          id: c.id,
          name: c.name,
          kind: "photo" as const,
          scope: "全文",
          blob: c.blob,
          size: c.size,
        })),
    ],
  });
}

export function controlRequestSuffix(draft: DemoDraft) {
  const lines = (draft.controls || [])
    .filter(
      (c) =>
        c.value.length &&
        ![
          "expert",
          "skills",
          "connectors",
          "document",
          "scanner",
          "capture",
          "polish",
        ].includes(c.kind),
    )
    .map((c) => {
      if (c.kind === "palette")
        return (
          "Palette mood: " +
          valueLabel(c, "en") +
          ". Preserve every explicit color specified above."
        );
      return (c.scope && c.scope!=="全文" ? c.scope+" / " : "")+(c.role || c.kind) + ": " + valueLabel(c, "en")+(c.kind === "duration" ? " minutes" : "");
    });
  return lines.length ? "\n\n" + lines.join("\n") : "";
}

/** Keep standalone suggested values out of the shared/native parser and protocol. */
export function demoRequestParameters(draft: DemoDraft): LiveParameter[] {
 const controls=draft.controls||[];
 const native=demoNativeParameters(draft);
 return [...native,...controls.filter(c=>(c.kind==='duration'&&/^\d+$/.test(c.value[0]||'')&&+c.value[0]>0&&+c.value[0]<=60)||(c.kind==='color'&&/^#[0-9a-f]{6}$/i.test(c.value[0]||''))).map(c=>({id:c.id,kind:c.kind as 'duration'|'color',start:c.start,end:c.end,phrase:c.phrase,label:c.value[0],role:c.role||(c.kind==='duration'?'演讲时长':'颜色'),scope:c.scope||'全文',value:c.value[0],manual:c.origin==='manual'}))];
}
function projectControlValues(draft:DemoDraft, projected:ReturnType<typeof projectTargetInput>) {
 const replacements=(draft.controls||[]).filter(c=>c.value.length&&!c.detached&&c.presentation!=='append'&&draft.text.slice(c.start,c.end)===c.phrase);
 const offset=(position:number)=>position+projected.spans.filter(s=>s.sourceEnd<=position).reduce((n,s)=>n+(s.targetEnd-s.targetStart)-(s.sourceEnd-s.sourceStart),0);
 let text=projected.text;
 for(const c of replacements.sort((a,b)=>b.start-a.start)) {
   // A native color/material may share a span. Its authoritative projection already owns it.
   if(projected.spans.some(s=>s.sourceStart<c.end&&s.sourceEnd>c.start))continue;
   text=text.slice(0,offset(c.start))+valueLabel(c,/\p{Script=Han}/u.test(draft.text)?'zh':'en')+text.slice(offset(c.end));
 }
 return text;
}

/** One scoped ownership rule for the editor and the sent parameters. Dismissed
 * inferred entries must not reappear as broad native keyword matches. */
export function demoNativeParameters(draft:DemoDraft):LiveParameter[] {
 const candidates=recommendControls(draft.text);
 const shadows=[...(draft.controls||[]),...candidates.filter(c=>draft.dismissedControls?.includes(dismissalKey(c)))];
 const nativeText=candidates.filter(c=>c.kind==='connectors').reduce((text,c)=>text.slice(0,c.start)+' '.repeat(c.end-c.start)+text.slice(c.end),draft.text);
 return resolveLiveParameters(nativeText,draft.parameters).filter(p=>!shadows.some(c=>
   !c.detached && (c.scope||'全文')===p.scope &&
   ((c.kind===p.kind&&(c.kind!=='color'||c.role===p.role)) ||
    (c.presentation!=='append'&&c.start<p.end&&c.end>p.start))));
}
/** An appended supplement must not disappear inside an unrelated value chip. */
export function demoControlAnchor(control:DemoControlBinding,draft:DemoDraft):number {
 let anchor=control.end;
 const replacements=[...demoNativeParameters(draft),...(draft.controls||[]).filter(c=>c.id!==control.id&&!c.detached&&c.presentation!=='append')];
 for(const range of replacements.sort((a,b)=>a.start-b.start))if(range.start<anchor&&range.end>anchor)anchor=range.end;
 return anchor;
}
