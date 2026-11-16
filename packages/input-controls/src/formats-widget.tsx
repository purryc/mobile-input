import { ChoiceWidget } from "./choice-widget";
import type { ComponentProps } from "react";
export type FormatsWidgetProps = ComponentProps<typeof ChoiceWidget>;
export function FormatsWidget(props: FormatsWidgetProps) {
  return (
    <ChoiceWidget {...props} binding={{ ...props.binding, kind: "formats" }} />
  );
}
