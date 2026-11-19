import { CapturePanel } from "./capture-panel";
import type { ComponentProps } from "react";
export type ScannerWidgetProps = Omit<
  ComponentProps<typeof CapturePanel>,
  "mode" | "screenIntent"
>;
export function ScannerWidget(props: ScannerWidgetProps) {
  return <CapturePanel {...props} mode="scanner" />;
}
