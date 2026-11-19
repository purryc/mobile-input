import {
  DocumentWidget,
  FontWidget,
  windowsFonts,
  PaletteWidget,
  ExpertWidget,
  SkillsWidget,
  ConnectorsWidget,
  FormatsWidget,
} from "@mobile-input/controls";
import { demoScenarios } from "../../../packages/core/workbuddy-demo-scenarios";
import {
  controlLabel,
  type DemoControlKind,
} from "../../../packages/core/workbuddy-demo-controls";
import {
  ChoiceWidget,
  ControlIcon as SharedIcon,
  controlOptionArtwork as artworkPath,
} from "@mobile-input/controls";
import { demoKinds as controlKinds } from "./workbuddy-demo-widget-catalog";
import {WandSparkles} from "lucide-react";
import type { ComponentProps, ComponentType } from "react";
export function controlOptionArtwork(...args: Parameters<typeof artworkPath>) {
  return artworkPath(...args)?.replace(/^\.\//, "./input-controls/");
}
export function ControlIcon({kind}: {kind: DemoControlKind}) {
  return kind === "polish" ? <WandSparkles size={18}/> : <SharedIcon kind={kind}/>;
}
export function DemoFontWidget({definition: _hostDefinition, binding, ...props}: ComponentProps<typeof ChoiceWidget>) {
  // Older drafts store Chinese family names; the shared font picker uses Windows IDs.
  const value = binding.value.map(name => windowsFonts.find(font => font.zh === name)?.id ?? name);
  return <FontWidget {...props} binding={{...binding, value}}/>;
}

const DocumentChoices = (props: ComponentProps<typeof ChoiceWidget>) => (
  <DocumentWidget choices={props} onChoose={props.onChooseFile ?? (() => {})} />
);
export const choiceViews: Partial<
  Record<DemoControlKind, ComponentType<ComponentProps<typeof ChoiceWidget>>>
> = {
  document: DocumentChoices,
  font: DemoFontWidget,
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
