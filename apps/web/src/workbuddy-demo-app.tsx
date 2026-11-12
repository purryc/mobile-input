import { X } from "lucide-react";
import {
  WidgetProvider,
  CameraCapture,
} from "../../../packages/input-controls/src";
import {
  newDemoState,
  editDemoText as parseDemoText,
} from "../../../packages/core/workbuddy-demo-state";
import { uiText, setUILanguage } from "./i18n";
import {
  XiaoyiWorkShell,
  XiaoyiSidebar,
  XiaoyiSettings,
  XiaoyiHome,
} from "./workbuddy-demo-shell";
import {
  MaterialImage,
  MaterialDownload,
} from "./workbuddy-demo-material-views";
import { DemoTaskView } from "./workbuddy-demo-results";
import { useWorkbuddyDemoController } from "./workbuddy-demo-controller";
import { WorkbuddyDemoComposer } from "./workbuddy-demo-composer";
const editDemoText = (
  draft: Parameters<typeof parseDemoText>[0],
  text: string,
) => parseDemoText(draft, text, true);
export function WorkbuddyDemoApp() {
  const model = useWorkbuddyDemoController();
  const {
    language,
    settingsOpen,
    setSettingsOpen,
    showDebugControls,
    toggleDebugControls,
    jobs,
    state,
    latest,
    collapsed,
    setCollapsed,
    searchOpen,
    setSearchOpen,
    search,
    setSearch,
    saving,
    loadError,
    error,
    setError,
    saveFailed,
    panel,
    setPanel,
    setAddMenu,
    camera,
    setCamera,
    preview,
    setPreview,
    clearOpen,
    setClearOpen,
    busy,
    picker,
    speech,
    pickBinding,
    speechBinding,
    draft,
    afterSpeech,
    switchDraft,
    createDraft,
    receiveFiles,
    stopGeneration,
    retryGeneration,
    report,
    commit,
    update,
  } = model;
  if (!draft || !state)
    return (
      <div className="demo-loading">
        {uiText(loadError || "正在打开小艺Work…")}
        {loadError && (
          <button onClick={() => location.reload()}>
            {uiText("重新加载")}
          </button>
        )}
      </div>
    );
  const composer = <WorkbuddyDemoComposer model={{ ...model, draft, state }} />;
  const latestRequest = draft.requests[0];

  return (
    <WidgetProvider language={language} translate={uiText} assetBase=".">
      <XiaoyiWorkShell
        collapsed={collapsed}
        sidebar={
          <XiaoyiSidebar
            state={state}
            draft={draft}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            search={search}
            setSearch={setSearch}
            createDraft={createDraft}
            switchDraft={switchDraft}
            busy={busy}
            panel={panel}
            saving={saving}
            saveFailed={saveFailed}
            report={report}
            onClear={() => {
              speech.current?.cancel();
              setClearOpen(true);
            }}
          />
        }
        settings={
          <XiaoyiSettings
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            language={language}
            onLanguage={(value) => {
              speech.current?.cancel();
              speechBinding.current = null;
              setUILanguage(value === "en" ? "en" : "zh-CN");
            }}
            showDebugControls={showDebugControls}
            toggleDebugControls={toggleDebugControls}
          />
        }
        overlays={
          <>
            <input
              hidden
              type="file"
              multiple
              ref={picker}
              onChange={(event) => {
                const binding = pickBinding.current,
                  files = Array.from(event.target.files || []);
                if (binding) void receiveFiles(files, binding);
                event.target.value = "";
              }}
            />
            {error && (
              <div className="demo-toast" role="alert">
                {uiText(error)}
                <button
                  aria-label={uiText("关闭提示")}
                  onClick={() => setError("")}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {saveFailed && (
              <div className="demo-save-error" role="alert">
                {uiText(
                  "本地保存失败，请释放浏览器存储后重试。当前输入仍保留。",
                )}
                <button
                  onClick={() => {
                    if (latest.current) commit(latest.current);
                  }}
                >
                  {uiText("重试保存")}
                </button>
              </div>
            )}
            {camera && (
              <CameraCapture
                key={camera.owner}
                onClose={() => setCamera(null)}
                onError={report}
                onCapture={(file) =>
                  void receiveFiles([file], { ...camera, kind: "photo" })
                }
              />
            )}
            {preview && (
              <div
                className="demo-modal"
                role="dialog"
                aria-modal="true"
                aria-label={uiText("材料预览")}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setPreview(null);
                }}
              >
                <section>
                  <header>
                    <b>{preview.name}</b>
                    <button
                      autoFocus
                      aria-label={uiText("关闭预览")}
                      onClick={() => setPreview(null)}
                    >
                      <X />
                    </button>
                  </header>
                  {preview.kind !== "document" && (
                    <MaterialImage material={preview} />
                  )}
                  <MaterialDownload material={preview} />
                </section>
              </div>
            )}
            {clearOpen && (
              <div
                className="demo-modal"
                role="dialog"
                aria-modal="true"
                aria-label={uiText("清理演示")}
              >
                <section className="demo-confirm">
                  <h2>{uiText("清理这份演示？")}</h2>
                  <p>{uiText("将删除本页的草稿、材料和发送记录。")}</p>
                  <div>
                    <button autoFocus onClick={() => setClearOpen(false)}>
                      {uiText("保留")}
                    </button>
                    <button
                      className="demo-primary"
                      onClick={() => {
                        for (const controller of jobs.current.values())
                          controller.abort();
                        jobs.current.clear();
                        commit(newDemoState());
                        setPanel(null);
                        setPreview(null);
                        setCamera(null);
                        setClearOpen(false);
                        setAddMenu(false);
                      }}
                    >
                      {uiText("清理演示数据")}
                    </button>
                  </div>
                </section>
              </div>
            )}
          </>
        }
      >
        {latestRequest ? (
          <DemoTaskView
            key={draft.id}
            draft={draft}
            composer={composer}
            onStop={(id) => stopGeneration(draft.id, id)}
            onRetry={(request) => retryGeneration(draft.id, request)}
            onArtifact={(request, artifact) =>
              update(draft.id, (d) => ({
                ...d,
                requests: d.requests.map((r) =>
                  r.id === request
                    ? {
                        ...r,
                        artifacts: r.artifacts?.map((a) =>
                          a.id === artifact.id ? artifact : a,
                        ),
                      }
                    : r,
                ),
              }))
            }
          />
        ) : (
          <XiaoyiHome
            panel={panel}
            composer={composer}
            onPrompt={(prompt) =>
              void afterSpeech(() =>
                update(draft.id, (d) =>
                  editDemoText(
                    d,
                    d.text
                      ? d.text +
                          (language === "en" ? ", " : "，") +
                          uiText(prompt)
                      : uiText(prompt),
                  ),
                ),
              )
            }
          />
        )}
      </XiaoyiWorkShell>
    </WidgetProvider>
  );
}
