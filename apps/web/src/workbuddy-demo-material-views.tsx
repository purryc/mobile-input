import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import type { DemoMaterial } from "../../../packages/core/workbuddy-demo-state";
function useBlobUrl(blob: Blob) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}
export function MaterialImage({ material }: { material: DemoMaterial }) {
  const url = useBlobUrl(material.blob);
  return <img src={url || undefined} alt={material.name} />;
}
export function MaterialDownload({ material }: { material: DemoMaterial }) {
  const url = useBlobUrl(material.blob);
  return (
    <a href={url} download={material.name}>
      {material.kind === "document" ? (
        <FileText size={18} />
      ) : (
        <MaterialImage material={material} />
      )}
      <span>{material.name}</span>
    </a>
  );
}
