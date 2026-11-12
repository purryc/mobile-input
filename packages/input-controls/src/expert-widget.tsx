import { ChoiceWidget } from "./choice-widget";
import type { ComponentProps } from "react";
export type ExpertWidgetProps = ComponentProps<typeof ChoiceWidget>;
export function ExpertWidget(props: ExpertWidgetProps) {
  return (
    <ChoiceWidget {...props} binding={{ ...props.binding, kind: "expert" }} />
  );
}
