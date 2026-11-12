import { ChoiceWidget } from "./choice-widget";
import type { ComponentProps } from "react";
export type ConnectorsWidgetProps = ComponentProps<typeof ChoiceWidget>;
export function ConnectorsWidget(props: ConnectorsWidgetProps) {
  return (
    <ChoiceWidget
      {...props}
      binding={{ ...props.binding, kind: "connectors" }}
    />
  );
}
