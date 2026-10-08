import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  ChevronRight,
  MoreHorizontal,
  FileText,
  MapPin,
} from "lucide-react";
import DestinationView, { listViews } from "./DestinationView";
import { previewFields } from "./preview";
import { Sheet } from "../app/Sheet";
import AppIcon from "./AppIcon";
import { appNames } from "./intents";
import type { Action } from "./types";
import "./mock-app.css";

const brands: Record<string, string> = {
  gaode: "#1675f8",
  ctrip: "#0086f6",
  taobao: "#ff5400",
  jd: "#e92535",
  meituan: "#ffc800",
  damai: "#ff2869",
  sf: "#e41d25",
  feishu: "#3370ff",
  wechat: "#07c160",
};
const localKey = "wechat-point-and-ask:v1:mock-drafts";
const lockedField = (key: string) =>
  /状态|要求|下单|预订|发送|库存|配送/.test(key);

export default function MockApp({
  action,
  onClose,
}: {
  action: Action;
  onClose: () => void;
}) {
  const localKey='mobile-input:service:'+action.recordKey;
  const [stage, setStage] = useState<
    "processing" | "waiting" | "splash" | "app"
  >("processing");
  const [fields, setFields] = useState(()=>{try{return JSON.parse(localStorage.getItem(localKey+':draft')||'null')||previewFields(action);}catch{return previewFields(action);}}) as [Action['fields'], React.Dispatch<React.SetStateAction<Action['fields']>>];
  useEffect(()=>{localStorage.setItem(localKey+':draft',JSON.stringify(fields));},[fields,localKey]);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    if (stage !== "app") return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus({ preventScroll: true });
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>(
            "button,textarea,input,summary",
          ) || [],
        ),
        first = nodes[0],
        last = nodes.at(-1);
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialog.current)
      ) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus({ preventScroll: true });
    };
  }, [stage]);
  useEffect(() => {
    const timers = [
      setTimeout(() => setStage("waiting"), 850),
      setTimeout(() => setStage("splash"), 1900),
      setTimeout(() => setStage("app"), 2550),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    const back = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", back);
    return () => window.removeEventListener("keydown", back);
  }, [onClose]);
  const save = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(localKey) || "{}");
      const records =
        raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
      localStorage.setItem(
        localKey,
        JSON.stringify({
          ...records,
          [action.id]: {
            actionId: action.id,
            app: action.app,
            fields,
            extractedFields: action.fields,
            previewFixture: "src/data/preview-fixtures.json",
            fieldSources: action.fieldSources,
            savedAt: new Date().toISOString(),
          },
        }),
      );
      setSaved(true);
      setSaveError("");
    } catch {
      setSaved(false);
      setSaveError("暂时无法保存，请重试。");
    }
  };
  const isList = listViews.includes(action.destination?.view || "");
  const form = (
    <div className="mock-fields">
      {fields.map(([key, value], i) =>
        action.id.startsWith("image-") &&
        ["图片", "来源"].includes(key) ? null : (
          <label key={key}>
            <span>{key}</span>
            <textarea
              aria-label={key}
              readOnly={lockedField(key)}
              value={value}
              rows={value.length > 50 ? 3 : 2}
              onChange={(e) => {
                setSaved(false);
                setFields((values) =>
                  values.map((row, j) =>
                    j === i ? [key, e.target.value] : row,
                  ),
                );
              }}
            />
          </label>
        ),
      )}
    </div>
  );
  const field = (key: string) => fields.find(([k]) => k === key)?.[1];
  const destination =
    field("终点") ||
    field("目的地") ||
    field("中心位置") ||
    field("地址") ||
    "上海音乐厅";
  const origin = field("起点") || field("出发地") || "上海虹桥站";
  const toVenue = destination.includes("会展");
  const toConcert = destination.includes("音乐厅");
  const status = (
    <p className="mock-status" role="status">
      {saveError || (saved ? "已保存" : "")}
    </p>
  );
  const source = (
    <details className="mock-sources">
      <summary>查看来源</summary>
      {action.fieldSources.map((s) => (
        <p key={s.field}>
          {s.field}：{s.messageIds.join("、")} · {s.note}
        </p>
      ))}
    </details>
  );
  if (stage === "processing" || stage === "waiting")
    return (
      <Sheet
        title={action.title}
        onClose={onClose}
        className="mock-handoff-sheet"
      >
        <div className="mock-opening" data-mock-stage={stage}>
          <AppIcon app={action.app} />
          <h3>
            {stage === "processing" ? "正在整理" : "正在打开"}
            {appNames[action.app]}
          </h3>
          <p>{action.fields[0]?.[1]}</p>
        </div>
      </Sheet>
    );
  return (
    <section
      ref={dialog}
      tabIndex={-1}
      className={`mock-application modal mock-${action.app} ${stage === "splash" ? "is-splash" : "is-ready"}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${appNames[action.app]}预演`}
      data-mock-app={action.app}
      data-mock-stage={stage}
      data-action-id={action.id}
      style={
        { "--mock-brand": brands[action.app] || "#0a59f7" } as CSSProperties
      }
    >
      {stage === "splash" ? (
        <div className="mock-splash">
          <AppIcon app={action.app} />
        </div>
      ) : (
        <>
          <header className="mock-app-header">
            <button onClick={()=>window.dispatchEvent(new CustomEvent("app-back",{cancelable:true}))} aria-label="返回微信">
              <ArrowLeft size={23} />
            </button>
            <AppIcon app={action.app} />
            <strong>{appNames[action.app]}</strong>
            <MoreHorizontal size={23} />
          </header>
          <div className="mock-app-scroll">
            {action.id.startsWith("image-") && (
              <div className="native-source-image">
                <img
                  src={action.fields.find(([k]) => k === "图片")?.[1]}
                  alt="来自微信的图片"
                />
                <span>
                  来自{action.fields.find(([k]) => k === "来源")?.[1]}的图片
                </span>
              </div>
            )}
            {isList ? (
              <DestinationView action={action} />
            ) : (
              <>
                {action.app === "gaode" && (
                  <>
                    <div className="mock-map" aria-label="路线示意图">
                      <svg
                        viewBox="0 0 400 245"
                        role="img"
                        aria-label="上海路线"
                      >
                        <rect width="400" height="245" fill="#eaf1e9" />
                        <path
                          d="M0 54L400 142M70 0L158 245M297 0L230 245M0 216L400 40"
                          stroke="#fff"
                          strokeWidth="18"
                          fill="none"
                        />
                        <path
                          d="M76 186L142 184L247 85L320 88"
                          stroke="#297dff"
                          strokeWidth="6"
                          fill="none"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="76"
                          cy="186"
                          r="7"
                          fill="#fff"
                          stroke="#297dff"
                          strokeWidth="4"
                        />
                        <circle cx="320" cy="88" r="8" fill="#ff6b42" />
                      </svg>
                      <span>
                        <MapPin size={15} />
                        {origin} → {destination}
                      </span>
                    </div>
                    <nav className="mock-tabs">
                      <b>驾车</b>
                      <span>公交</span>
                      <span>步行</span>
                      <span>骑行</span>
                    </nav>
                  </>
                )}
                {action.app === "gaode" && (
                  <div className="mock-route-detail">
                    <strong>
                      {toVenue
                        ? "约 18 分钟"
                        : toConcert
                          ? "约 28 分钟"
                          : "约 32 分钟"}
                    </strong>
                    <p>
                      {toVenue
                        ? "7.2 公里 · 途经虹渝高架、诸光路"
                        : toConcert
                          ? "11.8 公里 · 途经延安高架路"
                          : "18.6 公里 · 途经虹渝高架、延安高架路"}
                    </p>
                    <div className="mock-detail-grid">
                      <span>
                        出发<b>{origin}</b>
                      </span>
                      <span>
                        到达<b>{destination}</b>
                      </span>
                    </div>
                  </div>
                )}
                {action.app === "damai" && (
                  <div className="mock-event">
                    <small>上海 · 演出</small>
                    <h2>城市回声</h2>
                    <p>周五 12:00 开票</p>
                    <span>
                      10月16日 19:30 · 上海音乐厅 · ¥180 / ¥280 / ¥380
                    </span>
                  </div>
                )}
                {action.app === "sf" && (
                  <div className="mock-shipment">
                    <h2>运单查询</h2>
                    <strong>SF-DEMO-0930</strong>
                    <div className="mock-timeline">
                      <i />
                      <p>
                        运单信息已录入
                        <small>
                          9月30日 09:20 · 上海虹桥营业点 · 等待寄件方确认揽收
                        </small>
                      </p>
                    </div>
                  </div>
                )}
                {action.app === "feishu" && (
                  <div className="mock-document-title">
                    <FileText size={26} />
                    <p>云文档 / 草稿</p>
                    <h2>{action.title}</h2>
                    <div className="mock-document-body">
                      {action.recordKey?.includes("boss-sales-meeting-v2") ? <>{fields.map(([key,value])=><p key={key}><strong>{key}</strong><br/>{value}</p>)}</> : action.id === "fee" ? (
                        <>
                          <strong>Sample cost breakdown</strong>
                          <p>Prepared for Alex Morgan · September 30</p>
                          <p>
                            Samples: CNY 300
                            <br />
                            Shipping: CNY 30
                            <br />
                            Total: CNY 330
                          </p>
                          <p>
                            Please review the breakdown. Payment details will
                            follow after confirmation.
                          </p>
                        </>
                      ) : (
                        <>
                          <strong>
                            {action.id === "brief"
                              ? "会前准备"
                              : "合作方案 · 讨论稿"}
                          </strong>
                          <p>
                            合作主题：汽车业务与体验设计。先整理客户背景，核对讨论范围，并将尚待确认的合作条件单独列出。
                          </p>
                          <p>
                            会议：10月6日 14:00—15:00
                            <br />
                            地点：国家会展中心洲际酒店
                            <br />
                            对接：王晨 · 商务经理
                          </p>
                          <p>
                            下一步：完成背景梳理与方案核对，交陈总审阅；报价确认后另附正式版本。
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {action.app === "wechat" && (
                  <div className="mock-chat-title">
                    <h2>{action.title}</h2>
                    <p>微信 · 待确认</p>
                  </div>
                )}
                {form}
                {status}
                {source}
              </>
            )}
          </div>
          {!isList && (
            <footer className="mock-app-footer">
              <button onClick={save}>
                {saved
                  ? "已保存"
                  : action.app === "wechat" || action.app === "feishu"
                    ? "保存草稿"
                    : "保存查看条件"}
                <ChevronRight size={18} />
              </button>
            </footer>
          )}
        </>
      )}
    </section>
  );
}
