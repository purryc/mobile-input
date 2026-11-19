import {controlKinds, widgetWidths} from "@mobile-input/controls";
import {definition} from "../../../packages/core/workbuddy-demo-controls";
export * from "@mobile-input/controls";
export {PolishWidget} from "./workbuddy-demo-polish-widget";
export const demoKinds = [...controlKinds.slice(0,-1), "polish", "capture"] as const;
export type DemoWidgetKind = typeof demoKinds[number];
export const xiaoyiControls = demoKinds.map(kind => {
  const {zh,en} = definition(kind);
  return {kind, zh, en, width:kind === "polish" ? 432 : widgetWidths[kind], preview:"widget-library.html?widget="+kind};
});
