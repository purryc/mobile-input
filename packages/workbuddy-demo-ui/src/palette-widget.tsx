import { ChoiceWidget } from "./choice-widget";
import type { ComponentProps } from "react";
export type PaletteWidgetProps = ComponentProps<typeof ChoiceWidget>;
export function PaletteWidget(props: PaletteWidgetProps) {
  return (
    <ChoiceWidget {...props} binding={{ ...props.binding, kind: "palette" }} />
  );
}
