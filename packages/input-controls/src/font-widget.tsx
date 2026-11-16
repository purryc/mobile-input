import { ChoiceWidget } from "./choice-widget";
import type { ComponentProps } from "react";
export type FontWidgetProps = ComponentProps<typeof ChoiceWidget>;
export function FontWidget(props: FontWidgetProps) {
  return (
    <ChoiceWidget {...props} binding={{ ...props.binding, kind: "font" }} />
  );
}
