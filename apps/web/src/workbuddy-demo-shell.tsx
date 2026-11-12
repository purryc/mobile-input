import {
  Settings,
  PanelLeft,
  Search,
  CirclePlus,
  Bell,
  Trash2,
  X,
  FileText,
  LayoutTemplate,
  ImagePlus,
} from "lucide-react";
import { uiText } from "./i18n";
import type { ReactNode } from "react";
import type {
  DemoState,
  DemoDraft,
} from "../../../packages/core/workbuddy-demo-state";
interface SidebarProps {
  state: DemoState;
  draft: DemoDraft;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
  createDraft: () => void;
  switchDraft: (id: string) => void;
  busy: boolean;
  panel: { kind: string } | null;
  saving: boolean;
  saveFailed: boolean;
  report: (s: string) => void;
  onClear: () => void;
}
export function XiaoyiSidebar({
  state,
  draft,
  collapsed,
  setCollapsed,
  searchOpen,
  setSearchOpen,
  search,
  setSearch,
  createDraft,
  switchDraft,
  busy,
  panel,
  saving,
  saveFailed,
  report,
  onClear,
}: SidebarProps) {
  return (
    <aside className="wb-sidebar">
      <div className="wb-brand-row">
        <div className="xiaoyi-brand">
          <img src="./assets/xiaoyi-work/logo.png" alt="" />
          <b>{uiText("小艺Work")}</b>
        </div>
        <button
          aria-label={uiText(collapsed ? "展开侧栏" : "收起侧栏")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <PanelLeft size={17} />
        </button>
        <button
          aria-label={uiText("搜索任务")}
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search size={17} />
        </button>
      </div>
      <nav>
        <button
          className="active"
          aria-label={uiText("新建演示")}
          onClick={createDraft}
          disabled={
            busy && panel?.kind !== "scanner" && panel?.kind !== "capture"
          }
        >
          <CirclePlus size={17} />
          {uiText("新建任务")}
        </button>
      </nav>
      <div className="wb-history">
        {searchOpen && (
          <input
            autoFocus
            aria-label={uiText("搜索演示草稿")}
            placeholder={uiText("搜索任务")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        )}
        <small>
          {uiText("任务 (")}
          {state.drafts.length})
        </small>
        <div role="navigation" aria-label={uiText("演示草稿")}>
          {state.drafts
            .filter(
              (d) =>
                !search ||
                (d.text.trim() || d.requests[0]?.text || "").includes(search),
            )
            .map((d) => (
              <div
                className={
                  "wb-history-item " + (d.id === draft.id ? "active" : "")
                }
                key={d.id}
              >
                <button
                  aria-current={d.id === draft.id ? "page" : undefined}
                  onClick={() => switchDraft(d.id)}
                  disabled={
                    busy &&
                    panel?.kind !== "scanner" &&
                    panel?.kind !== "capture"
                  }
                >
                  <span>
                    {(d.text.trim() || d.requests[0]?.text?.trim() || "").slice(
                      0,
                      24,
                    ) || uiText("新建任务")}
                  </span>
                </button>
                <small>
                  {uiText(
                    d.requests[0]?.status === "running"
                      ? "生成中"
                      : d.requests[0]?.status === "complete"
                        ? "已完成"
                        : d.requests.length
                          ? "已发送"
                          : "草稿",
                  )}
                </small>
              </div>
            ))}
        </div>
      </div>
      <footer>
        <span className="wb-account">
          <img src="./assets/xiaoyi-work/logo.png" alt="" />
          {uiText("小艺Work")}
        </span>
        <button
          aria-label={uiText("消息中心")}
          onClick={() => report("当前没有新消息。")}
        >
          <Bell size={17} />
        </button>
        <button
          aria-label={uiText("清理演示")}
          onClick={() => {
            onClear();
          }}
        >
          <Trash2 size={17} />
        </button>
      </footer>
      <span
        className="demo-save-state"
        role="status"
        aria-label={uiText("保存状态")}
      >
        {uiText(
          saving ? "正在保存…" : saveFailed ? "尚未保存" : "保存在这台电脑",
        )}
      </span>
    </aside>
  );
}
interface SettingsProps {
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  language: string;
  onLanguage: (v: string) => void;
  showDebugControls: boolean;
  toggleDebugControls: () => void;
}
export function XiaoyiSettings({
  settingsOpen,
  setSettingsOpen,
  language,
  onLanguage,
  showDebugControls,
  toggleDebugControls,
}: SettingsProps) {
  return (
    <div className="demo-settings">
      <button
        aria-label={uiText("设置")}
        aria-expanded={settingsOpen}
        onClick={() => setSettingsOpen(!settingsOpen)}
      >
        <Settings size={19} />
      </button>
      {settingsOpen && (
        <section
          role="dialog"
          aria-label={uiText("设置")}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSettingsOpen(false);
          }}
        >
          <header>
            <b>{uiText("设置")}</b>
            <button
              aria-label={uiText("关闭设置")}
              onClick={() => setSettingsOpen(false)}
            >
              <X size={16} />
            </button>
          </header>
          <label>
            {uiText("界面与语音语言")}
            <select
              aria-label={uiText("界面与语音语言")}
              value={language}
              onChange={(e) => {
                onLanguage(e.target.value);
              }}
            >
              <option value="zh-CN">中文 · 普通话</option>
              <option value="en">English</option>
            </select>
          </label>
          <small>{uiText("切换语言不会改写你的内容。")}</small>
          <button
            className="demo-debug-switch"
            type="button"
            role="switch"
            aria-checked={showDebugControls}
            onClick={toggleDebugControls}
          >
            {uiText("显示调试控件")}
            <span aria-hidden="true" />
          </button>
        </section>
      )}
    </div>
  );
}
export function XiaoyiHome({
  panel,
  composer,
  onPrompt,
}: {
  panel: unknown;
  composer: ReactNode;
  onPrompt: (text: string) => void;
}) {
  return (
    <div className={"wb-home" + (panel ? " has-open-widget" : "")}>
      <div className="xiaoyi-mascot" role="img" aria-label={uiText("小艺形象")}>
        <img src="./assets/xiaoyi-work/client-poster.webp" alt="" />
      </div>
      <h1>{uiText("轻松工作，就用小艺Work")}</h1>
      <div className="wb-home-entry">
        <div className="wb-scenes" aria-label={uiText("快捷创作")}>
          {[
            { label: "文档生成", prompt: "帮我生成一份文档", Icon: FileText },
            {
              label: "演示文稿",
              prompt:
                "我想做一个简短的演示文稿，介绍今年的要发布的产品。背景用灰色，字体用黑色，主题色用红色。我有一些本地文档作为大纲参考，还有老板的写的一些重点我扫描给你，另外要添加一些产品照片。布局我画一下，左边是今年产品总览，右边是分产品的介绍。然后整体视觉风格参考我这个截屏的。",
              Icon: LayoutTemplate,
            },
            { label: "图片生成", prompt: "帮我生成一张图片", Icon: ImagePlus },
          ].map(({ label, prompt, Icon }) => (
            <button key={label} onClick={() => onPrompt(prompt)}>
              <Icon size={16} />
              {uiText(label)}
            </button>
          ))}
        </div>
        {composer}
      </div>
    </div>
  );
}
export function XiaoyiWorkShell({
  collapsed,
  sidebar,
  settings,
  children,
  overlays,
}: {
  collapsed: boolean;
  sidebar: ReactNode;
  settings: ReactNode;
  children: ReactNode;
  overlays: ReactNode;
}) {
  return (
    <div
      className={
        "workbuddy demo-app live-workbuddy input-controls-theme" +
        (collapsed ? " wb-collapsed" : "")
      }
    >
      {sidebar}
      <main className="wb-main">
        {settings}
        {children}
      </main>
      {overlays}
    </div>
  );
}
