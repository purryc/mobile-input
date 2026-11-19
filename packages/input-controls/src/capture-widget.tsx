import { CapturePanel } from "./capture-panel";
import type { ComponentProps } from "react";
export type ScreenCaptureWidgetProps = Omit<
  ComponentProps<typeof CapturePanel>,
  "mode" | "initialCameraMode"
>;
export function ScreenCaptureWidget(props: ScreenCaptureWidgetProps) {
  return <CapturePanel {...props} mode="capture" />;
}
