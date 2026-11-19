import { useWidgetEnvironment, assetUrl } from "./environment";
export function WidgetIcon({
  name,
}: {
  name: "close" | "check" | "pen" | "eraser" | "undo" | "clear";
}) {
  const { assetBase } = useWidgetEnvironment();
  return (
    <img
      className="agent-widget-icon"
      src={assetUrl(
        assetBase,
        "reference-assets/workbuddy-widgets/" + name + ".svg",
      )}
      alt=""
      draggable={false}
    />
  );
}
