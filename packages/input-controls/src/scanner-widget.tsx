import { CapturePanel } from "./capture-panel";
import type { ComponentProps } from "react";
export type ScannerWidgetProps = Omit<
  ComponentProps<typeof CapturePanel>,
  "mode"
>;
export function ScannerWidget(props: ScannerWidgetProps) {
  return <CapturePanel {...props} mode="scanner" />;
}
