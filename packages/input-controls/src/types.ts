export const controlKinds = [
  "duration",
  "color",
  "font",
  "palette",
  "document",
  "photo",
  "scanner",
  "sketch",
  "expert",
  "skills",
  "connectors",
  "formats",
  "polish",
  "capture",
] as const;
export type WidgetKind = (typeof controlKinds)[number];
export type ControlOrigin = "explicit" | "recommended" | "manual";
export interface ChoiceBinding {
  id: string;
  kind: WidgetKind;
  origin: "explicit" | "recommended" | "manual";
  value: string[];
}
export interface ControlOption {
  id: string;
  zh: string;
  en: string;
  detail?: string;
  color?: string;
  swatches?: string[];
}
export interface ChoiceDefinition {
  kind: WidgetKind;
  zh: string;
  en: string;
  multiple?: boolean;
  demo?: boolean;
  options: ControlOption[];
}
export interface ChoiceEvent {
  type: "change" | "close" | "remove";
  owner: string;
  id: string;
  value?: string[];
}
export interface CaptureMaterial {
  id: string;
  kind: "scanner" | "screenshot" | "recording";
  name: string;
  blob: Blob;
  size: number;
  duration?: number;
  confirmed: boolean;
}

export const widgetWidths: Record<WidgetKind, number> = {
  duration: 288,
  color: 320,
  font: 320,
  palette: 320,
  document: 320,
  photo: 320,
  scanner: 320,
  sketch: 320,
  expert: 432,
  skills: 432,
  connectors: 432,
  formats: 320,
  polish: 432,
  capture: 320,
};
