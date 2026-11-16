import { ChoiceWidget } from "./choice-widget";
import type { ComponentProps } from "react";
export type SkillsWidgetProps = ComponentProps<typeof ChoiceWidget>;
export function SkillsWidget(props: SkillsWidgetProps) {
  return (
    <ChoiceWidget {...props} binding={{ ...props.binding, kind: "skills" }} />
  );
}
