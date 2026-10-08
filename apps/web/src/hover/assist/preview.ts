import fixtures from "../data/preview-fixtures.json" with { type: "json" };
import type { Action } from "./types";
type Fixture = { field: string; original: string | null; value: string };
/** Authored screen content. Never feed these illustrative values into intent extraction. */
export function previewFields(action: Action): Action["fields"] {
  const entries = (fixtures as Record<string, Fixture[]>)[action.id] || [];
  const fields = action.fields.map(([key, value]): [string, string] => {
    const fixture = entries.find(
      (f) => f.field === key && f.original === value,
    );
    return [key, /待补充|待确认|待选择|请选择|to confirm/.test(value) ? value : fixture?.value ?? value];
  });
  if (
    !action.fields.some(([, value]) =>
      /来源消息缺失|聊天有新的更正/.test(value),
    )
  ) {
    entries
      .filter((f) => f.original === null)
      .forEach((f) => fields.push([f.field, f.value]));
  }
  return fields;
}
