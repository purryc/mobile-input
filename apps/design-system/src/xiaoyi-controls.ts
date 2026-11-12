import {
  controlKinds,
  widgetWidths,
} from "../../../packages/input-controls/src";
import { definition } from "../../../packages/core/workbuddy-demo-controls";

export * from "../../../packages/input-controls/src";

/** Catalog metadata for the standalone desktop variant. The main catalog owns its own navigation. */
export const xiaoyiControls = controlKinds.map((kind) => {
  const { zh, en } = definition(kind);
  return {
    kind,
    zh,
    en,
    width: widgetWidths[kind],
    preview: `widget-library.html?widget=${kind}`,
  };
});
