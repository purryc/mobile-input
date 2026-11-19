import { createRoot } from "react-dom/client";
import { configureUILanguageStorage, setUILanguage } from "./i18n";
import "./workbuddy-demo-i18n";
import { WorkbuddyDemoApp } from "./workbuddy-demo-app";
import "./workbuddy.css";
import "./phone-live-workbuddy.css";
import "./web-deck.css";
import "./application-action-chip.css";
import "./workbuddy-demo.css";
import "./workbuddy-demo-controls.css";
import "./workbuddy-demo-visual.css";
configureUILanguageStorage("workbuddy-standalone-demo:language");
if (new URLSearchParams(location.search).get("language") === "en")
  setUILanguage("en");
else if (new URLSearchParams(location.search).get("language") === "zh")
  setUILanguage("zh-CN");
createRoot(document.getElementById("root")!).render(<WorkbuddyDemoApp />);
