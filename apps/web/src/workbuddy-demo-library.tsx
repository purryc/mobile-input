import { createRoot } from "react-dom/client";
import { XiaoyiControlsPreview } from "../../design-system/src/xiaoyi-controls-preview";
import { uiText, configureUILanguageStorage, setUILanguage } from "./i18n";
import "./workbuddy-demo-i18n";
import "../../../packages/input-controls/src/desktop.css";
import "./workbuddy-demo-library.css";

configureUILanguageStorage("xiaoyi-widget-library:language");
const params = new URLSearchParams(location.search);
const language = params.get("language") === "en" ? "en" : "zh-CN";
setUILanguage(language);
createRoot(document.getElementById("root")!).render(
  <XiaoyiControlsPreview
    language={language}
    translate={uiText}
    initialWidget={params.get("widget")}
  />,
);
