import nativeApps from "../data/native-open-apps.json" with { type: "json" };
import icons from "../data/app-icons.json" with { type: "json" };
export default function AppIcon({ app }: { app: string }) {
  const file =
    (icons as Record<string, string>)[app] ||
    (nativeApps.some((a) => a[0] === app)
      ? `/assets/native-wechat/${app}.png`
      : undefined);
  return file ? <img src={file} alt="" data-app-icon={app} /> : null;
}
