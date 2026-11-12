import {
  DocumentWidget,
  FontWidget,
  PaletteWidget,
  ExpertWidget,
  SkillsWidget,
  ConnectorsWidget,
  FormatsWidget,
} from "../../../packages/input-controls/src";
import { demoScenarios } from "../../../packages/core/workbuddy-demo-scenarios";
import {
  controlLabel,
  type DemoControlKind,
} from "../../../packages/core/workbuddy-demo-controls";
import {
  ChoiceWidget,
  ControlIcon,
  controlOptionArtwork,
} from "../../../packages/input-controls/src/choice-widget";
import { controlKinds } from "../../../packages/input-controls/src/types";
import type { ComponentProps, ComponentType } from "react";
export { ControlIcon, controlOptionArtwork };
const DocumentChoices = (props: ComponentProps<typeof ChoiceWidget>) => (
  <DocumentWidget choices={props} onChoose={props.onChooseFile ?? (() => {})} />
);
export const choiceViews: Partial<
  Record<DemoControlKind, ComponentType<ComponentProps<typeof ChoiceWidget>>>
> = {
  document: DocumentChoices,
  font: FontWidget,
  palette: PaletteWidget,
  expert: ExpertWidget,
  skills: SkillsWidget,
  connectors: ConnectorsWidget,
  formats: FormatsWidget,
};
export function ControlsIndex({
  language,
  onOpen,
  onExample,
}: {
  language: string;
  onOpen: (kind: DemoControlKind) => void;
  onExample: (id: string) => void;
}) {
  return (
    <aside className="demo-controls-index" aria-label="Input controls">
      <strong>
        {language === "en" ? "Interactive input controls" : "可交互输入控件"}
      </strong>
      <div>
        {controlKinds.map((kind) => (
          <button key={kind} onClick={() => onOpen(kind as DemoControlKind)}>
            <ControlIcon kind={kind as DemoControlKind} />
            {controlLabel(kind as DemoControlKind, language)}
          </button>
        ))}
      </div>
      <div>
        {demoScenarios.map((example) => (
          <button
            key={example.id}
            className="demo-control-example"
            onClick={() => onExample(example.id)}
          >
            {language === "en" ? example.en : example.zh}
          </button>
        ))}
      </div>
      <small>
        {language === "en"
          ? "Recommendations use local rules. Capability choices are demonstrations."
          : "推荐使用本地规则；专家、技能和连接器为演示选项。"}
      </small>
    </aside>
  );
}
