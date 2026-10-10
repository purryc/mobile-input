import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import * as I from "lucide-react";
import {
  wbLabels,
  wbExperts,
  wbSkills,
  wbConnectors,
  resultLabels,
  type CatalogItem,
  type WorkBuddyPage,
  type WbFile,
  type WbTask,
  type ResultKind,
} from "../../../packages/core/workbuddy";
import type { State } from "../../../packages/core/model";
import { command, navigateBack, toast } from "./runtime";
import { useBack } from "./back";
import { useWorkBuddyInput } from "./workbuddy-input";
import "./workbuddy.css";
import { WorkBuddyTaskApprovals } from "./workbuddy-task-approvals";
const run = (type: string, value: Record<string, unknown> = {}) =>
  command("wb-" + type, value);
const go = (page: WorkBuddyPage, id?: string) => run("navigate", { page, id });
const logo = "./assets/apps/workbuddy.svg";
const icons: Partial<Record<WorkBuddyPage, typeof I.Plus>> = {
  home: I.CirclePlus,
  assistants: I.Bot,
  experts: I.GraduationCap,
  automation: I.AlarmClock,
  library: I.BookOpen,
  projects: I.Folder,
  settings: I.Settings,
  mailbox: I.Mail,
  documents: I.FileText,
  knowledge: I.BookMarked,
  inspiration: I.Lightbulb,
};
const modeLabels = { agent: "默认", plan: "计划", ask: "仅问答" };
const statusLabels = {
  running: "正在执行",
  paused: "已暂停",
  planned: "等待确认",
  complete: "已完成",
  "needs-type": "选择成果类型",
};
function Glyph({ item }: { item: CatalogItem }) {
  const color = ["#dcefe7", "#e4e8fb", "#f6e3d4", "#eeebd8"][
    item.name.length % 4
  ];
  return (
    <span className="wb-glyph" style={{ background: color }}>
      {item.symbol}
    </span>
  );
}
export function WorkBuddy({ s }: { s: State }) {
  const w = s.workbuddy;
  const [overlay, setOverlay] = useState<{ type: string; id?: string } | null>(
      null,
    ),
    [search, setSearch] = useState(""),
    [collapsed, setCollapsed] = useState(false),
    [more, setMore] = useState(false),
    [detail, setDetail] = useState(""),
    [formError, setFormError] = useState("");
  useEffect(() => {
    setSearch("");
    setDetail("");
    setOverlay(null);
    setMore(false);
  }, [w.page]);
  useBack(() => {
    if (overlay) {
      setOverlay(null);
      return true;
    }
    if (more) {
      setMore(false);
      return true;
    }
    if (w.previewActive || w.filePanel) return false;
    if (detail && w.page !== "home") {
      setDetail("");
      return true;
    }
    return false;
  }, 100);
  const task = w.tasks.find((x) => x.id === w.task),
    page = w.page;
  const [menuPosition, setMenuPosition] = useState<CSSProperties | null>(null);
  const open = (type: string, id?: string) => {
    setFormError("");
    const button = document.activeElement as HTMLElement,
      root = button.closest(".workbuddy");
    if (
      ["model", "mode", "permission", "workspace", "add"].includes(type) &&
      root
    ) {
      const b = button.getBoundingClientRect(),
        r = root.getBoundingClientRect();
      setMenuPosition({
        position: "absolute",
        left: Math.max(10, Math.min(b.left - r.left, r.width - 300)),
        bottom: Math.max(10, r.bottom - b.top + 6),
      });
    } else setMenuPosition(null);
    setOverlay({ type, id });
  };
  const closeOverlay = () => {
    setOverlay(null);
    if (s.target?.id.startsWith("wb:form:"))
      void run("unfocus", { id: s.target.id });
  };
  const filteredTasks = w.tasks.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );
  const catalogs =
    page === "skills"
      ? wbSkills
      : page === "connectors"
        ? wbConnectors
        : [...wbExperts, ...w.experts];
  const nav = w.settings.menu;
  return (
    <div className={"workbuddy" + (collapsed ? " wb-collapsed" : "")}>
      <aside className="wb-sidebar">
        <div className="wb-brand-row">
          <button className="wb-back" aria-label="返回" onClick={navigateBack}>
            <I.ChevronLeft />
          </button>
          <button
            aria-label="收起侧栏"
            onClick={() => setCollapsed(!collapsed)}
          >
            <I.PanelLeft size={17} />
          </button>
          <button aria-label="搜索任务" onClick={() => open("search")}>
            <I.Search size={17} />
          </button>
        </div>
        <div className="wb-brand">
          <div>
            <b>WorkBuddy</b>
            <small>5.7.7</small>
          </div>
          <button onClick={() => go("buddy")}>
            <I.Compass size={14} />
            发现应用
            <I.ChevronDown size={12} />
          </button>
        </div>
        <nav>
          {nav.map((p) => {
            const C = icons[p] || I.Square;
            return (
              <button
                key={p}
                className={
                  page === p ||
                  (["skills", "connectors"].includes(page) && p === "experts")
                    ? "active"
                    : ""
                }
                onClick={() => go(p)}
              >
                <C size={17} />
                {p === "experts" ? "专家·技能·连接器" : wbLabels[p]}
                {p === "assistants" && <small>BETA</small>}
              </button>
            );
          })}
          <button onClick={() => setMore(!more)}>
            <I.LayoutGrid size={17} />
            更多<span>管理</span>
          </button>
        </nav>
        {more && (
          <div className="wb-more">
            {(
              [
                "mailbox",
                "documents",
                "knowledge",
                "inspiration",
                "settings",
              ] as WorkBuddyPage[]
            ).map((p) => (
              <button
                key={p}
                onClick={() => {
                  go(p);
                  setMore(false);
                }}
              >
                {wbLabels[p]}
                <I.ChevronRight size={15} />
              </button>
            ))}
          </div>
        )}
        <div className="wb-history">
          <small>任务 ({w.tasks.length})</small>
          {filteredTasks.slice(0, 8).map((t) => (
            <div
              className={
                "wb-history-item " +
                (task?.id === t.id && page === "task" ? "active" : "")
              }
              key={t.id}
            >
              <button onClick={() => go("task", t.id)}>
                {t.favorite && <I.Star size={12} />}
                <span>{t.title}</span>
                <i className={t.status} />
              </button>
              <button
                aria-label={"操作 " + t.title}
                onClick={() => open("task", t.id)}
              >
                <I.MoreHorizontal size={15} />
              </button>
            </div>
          ))}
          {w.tasks.length > 8 && (
            <button onClick={() => open("search")}>查看更多</button>
          )}
          <small>空间 ({w.projects.length})</small>
          {w.projects.map((p) => (
            <div key={p.id}>
              <button
                className="wb-space"
                onClick={() => {
                  go("projects");
                  setTimeout(() => setDetail(p.id), 0);
                }}
              >
                <I.Folder size={15} />
                {p.name}
              </button>
              {w.tasks
                .filter((t) => t.project === p.id)
                .slice(0, 2)
                .map((t) => (
                  <button
                    className="wb-space-task"
                    key={t.id}
                    onClick={() => go("task", t.id)}
                  >
                    {t.title}
                  </button>
                ))}
            </div>
          ))}
        </div>
        <footer>
          <button className="wb-account" onClick={() => go("settings")}>
            <img src={logo} alt="" />
            陈朗
          </button>
          <button aria-label="消息中心" onClick={() => go("notifications")}>
            <I.Bell size={17} />
            {w.notices.some((n) => !n.read) && <i />}
          </button>
          <button
            aria-label="多端协同"
            onClick={() => {
              window.dispatchEvent(new Event("connection-open-request"));
              document
                .querySelector<HTMLButtonElement>(".agent-connection")
                ?.click();
            }}
          >
            <I.MonitorSmartphone size={17} />
          </button>
        </footer>
      </aside>
      <section className="wb-main">
        {page === "home" ? (
          <div className="wb-home">
            <h1>WorkBuddy, 我帮你</h1>
            <div className="wb-modes">
              {["日常办公", "代码开发", "设计创意"].map((x, i) => (
                <button
                  key={x}
                  className={
                    detail === String(i) || (!detail && i === 0) ? "active" : ""
                  }
                  onClick={() => setDetail(String(i))}
                >
                  {
                    [
                      <I.BriefcaseBusiness size={14} />,
                      <I.CodeXml size={14} />,
                      <I.Palette size={14} />,
                    ][i]
                  }
                  {x}
                </button>
              ))}
            </div>
            <div className="wb-home-entry">
              <div className="wb-scenes">
                {[
                  "文档处理",
                  "金融服务",
                  "数据分析及可视化",
                  "个人工作台",
                  "幻灯片",
                ].map((x, i) => (
                  <button key={x} onClick={() => open("templates", String(i))}>
                    {
                      [
                        <I.FileText />,
                        <I.Landmark />,
                        <I.ChartNoAxesCombined />,
                        <I.LayoutGrid />,
                        <I.Presentation />,
                      ][i]
                    }
                    {x}
                  </button>
                ))}
                <img
                  className="wb-mascot"
                  src="./assets/apps/workbuddy-mascot.png"
                  alt=""
                />
              </div>
              <Composer s={s} open={open} />
            </div>
          </div>
        ) : (
          <>
            <header className="wb-page-header">
              {["experts", "skills", "connectors"].includes(page) ? (
                <div className="wb-tabs">
                  {(["experts", "skills", "connectors"] as WorkBuddyPage[]).map(
                    (p) => (
                      <button
                        key={p}
                        className={page === p ? "active" : ""}
                        onClick={() => go(p)}
                      >
                        {p === "experts" ? (
                          <I.GraduationCap />
                        ) : p === "skills" ? (
                          <I.Puzzle />
                        ) : (
                          <I.Link />
                        )}
                        {wbLabels[p]}
                      </button>
                    ),
                  )}
                </div>
              ) : (
                <h2>{page === "task" ? task?.title : wbLabels[page]}</h2>
              )}
              <span />
              {page === "task" ? (
                <>
                  <button
                    aria-label="查看任务文件"
                    onClick={() => run("file-panel", { open: !w.filePanel })}
                  >
                    <I.PanelRight />
                  </button>
                  <button
                    aria-label="分享任务"
                    onClick={() => {
                      run("share", { name: task?.title });
                      toast("已保存本地分享记录");
                    }}
                  >
                    <I.Share2 />
                  </button>
                  <button
                    aria-label="任务设置"
                    onClick={() => open("task", task?.id)}
                  >
                    <I.MoreHorizontal />
                  </button>
                </>
              ) : (
                <>
                  <label className="wb-search">
                    <I.Search size={15} />
                    <input
                      aria-label="搜索 WorkBuddy 内容"
                      placeholder={"搜索" + wbLabels[page]}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  {page === "experts" && (
                    <button onClick={() => open("my-experts")}>我的专家</button>
                  )}
                  {page === "skills" && (
                    <>
                      <button
                        onClick={() =>
                          setDetail(detail === "installed" ? "" : "installed")
                        }
                      >
                        已安装 ({w.installed.length})
                      </button>
                      <button
                        className="wb-primary"
                        onClick={() => open("skills")}
                      >
                        ＋ 添加技能
                      </button>
                    </>
                  )}
                  {["projects", "assistants", "automation", "library"].includes(
                    page,
                  ) && (
                    <button className="wb-primary" onClick={() => open(page)}>
                      ＋{" "}
                      {page === "library"
                        ? "添加资料"
                        : page === "automation"
                          ? "新建定时任务"
                          : page === "projects"
                            ? "新建项目"
                            : "新建助理"}
                    </button>
                  )}
                </>
              )}
            </header>
            {page === "task" && task ? (
              <div className="wb-task-layout">
                <section className="wb-task-chat">
                  <div className="wb-messages">
                    {task.messages.map((m) => (
                      <div className={"wb-message " + m.role} key={m.id}>
                        {m.role === "assistant" && (
                          <strong>
                            <img src={logo} alt="" />
                            {task.expert
                              ? [...wbExperts, ...w.experts].find(
                                  (x) => x.id === task.expert,
                                )?.name
                              : "WorkBuddy"}
                          </strong>
                        )}
                        <div className="wb-message-text">{m.text}</div>
                      </div>
                    ))}
                    {task.status !== "complete" && (
                      <div className="wb-execution">
                        <strong>
                          <img src={logo} alt="" />
                          {statusLabels[task.status]}
                        </strong>
                        {task.status === "needs-type" ? (
                          <div className="wb-result-types">
                            {Object.entries(resultLabels).map(([k, v]) => (
                              <button
                                key={k}
                                onClick={() =>
                                  run("task", {
                                    id: task.id,
                                    action: "type",
                                    kind: k,
                                  })
                                }
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <>
                            <small>
                              已处理{" "}
                              {Math.round(
                                (task.elapsed +
                                  (task.status === "running"
                                    ? Date.now() - task.startedAt
                                    : 0)) /
                                  1000,
                              )}{" "}
                              秒
                            </small>
                            {[
                              "读取客户需求与项目资料",
                              "核对采购报价和交付节点",
                              "整理工作成果",
                            ].map((x, i) => (
                              <div
                                className={
                                  "wb-step " +
                                  (task.step === i && task.status === "running"
                                    ? "running"
                                    : "")
                                }
                                key={x}
                              >
                                {task.step > i ? (
                                  <I.CheckCircle2 size={15} />
                                ) : (
                                  <I.CircleDashed size={15} />
                                )}
                                <details>
                                  <summary>{x}</summary>
                                  <p>
                                    {
                                      [
                                        "读取已引用的客户需求与项目文件。缺失字段保留待确认。",
                                        "使用当前销售报价表计算采购成本、客户报价和毛利，交付节点来自销售样例。",
                                        "保存版本化成果，表格、方案和演示创建本地 WPS 文件。",
                                      ][i]
                                    }
                                  </p>
                                </details>
                                {task.step === i &&
                                  task.status === "running" && <i />}
                              </div>
                            ))}
                            <button
                              className="wb-primary"
                              onClick={() =>
                                run("task", {
                                  id: task.id,
                                  action:
                                    task.status === "running"
                                      ? "stop"
                                      : "confirm",
                                })
                              }
                            >
                              {task.status === "running"
                                ? "停止"
                                : task.status === "planned"
                                  ? "确认并开始执行"
                                  : "继续执行"}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    <WorkBuddyTaskApprovals requests={w.approvals.filter(r => r.taskId === task.id)} />
                    {task.files.map((id) => {
                      const f = w.files.find((x) => x.id === id);
                      return (
                        f && (
                          <button
                            key={id}
                            className="wb-file-card"
                            onClick={() => run("preview", { id })}
                          >
                            <FileSymbol file={f} />
                            <span>
                              {f.name}
                              <small>查看工作成果</small>
                            </span>
                            <I.PanelRightOpen size={18} />
                          </button>
                        )
                      );
                    })}
                    {task.status === "complete" && (
                      <div className="wb-result-footer">
                        <I.CheckCircle2 size={14} />
                        执行完成 · {Math.round(task.elapsed / 1000)} 秒
                        <button
                          onClick={() => run("share", { name: task.title })}
                        >
                          <I.Share2 size={14} />
                        </button>
                        <button onClick={() => open("task", task.id)}>
                          <I.MoreHorizontal size={17} />
                        </button>
                        <span>{task.model}</span>
                      </div>
                    )}
                  </div>
                  <Composer key={w.task} s={s} open={open} />
                </section>
                {(w.previewActive || w.filePanel) && <FilePanel s={s} />}
              </div>
            ) : null}
            {["experts", "skills", "connectors"].includes(page) && (
              <div className="wb-catalog wb-scroll">
                {page === "experts" && (
                  <div className="wb-expert-banners">
                    {["开学季", "内容创作", "投资分析", "法律咨询"].map(
                      (x, i) => (
                        <button
                          key={x}
                          onClick={() =>
                            setDetail(
                              ["产品运营", "内容创作", "财税工作", "企业管理"][
                                i
                              ],
                            )
                          }
                        >
                          <b>{x}</b>
                          <span>
                            {
                              [
                                "学习与资料整理",
                                "文案、简报与汇报",
                                "报价与成本分析",
                                "风险与文件评审",
                              ][i]
                            }
                          </span>
                          <I.UserRound size={42} />
                        </button>
                      ),
                    )}
                  </div>
                )}
                {page === "skills" && (
                  <>
                    <h3>精选技能</h3>
                    <div className="wb-card-grid">
                      {wbSkills
                        .filter((x) => x.category === "精选")
                        .map((x) => (
                          <CatalogCard
                            key={x.id}
                            item={x}
                            onClick={() => open("catalog", x.id)}
                            action={() =>
                              run("skill", {
                                id: x.id,
                                remove: w.installed.includes(x.id),
                              })
                            }
                            active={w.installed.includes(x.id)}
                          />
                        ))}
                    </div>
                  </>
                )}
                <div className="wb-filter-tabs">
                  {(page === "experts"
                    ? [
                        "全部",
                        "专家团",
                        "产品运营",
                        "内容创作",
                        "财税工作",
                        "营销专家",
                        "企业管理",
                        "设计创意",
                        "我的专家",
                      ]
                    : page === "skills"
                      ? ["推荐", "SkillHub", "套件", "已安装"]
                      : ["全部", "办公", "沟通", "资料", "项目"]
                  ).map((x) => (
                    <button
                      key={x}
                      className={
                        detail === x ||
                        (!detail && x === (page === "skills" ? "推荐" : "全部"))
                          ? "active"
                          : ""
                      }
                      onClick={() => setDetail(x)}
                    >
                      {x}
                    </button>
                  ))}
                </div>
                <div className="wb-card-grid">
                  {catalogs
                    .filter(
                      (x) =>
                        x.name.includes(search) &&
                        (!detail ||
                          detail === "全部" ||
                          detail === "推荐" ||
                          (detail === "专家团" && x.team) ||
                          (detail === "我的专家" &&
                            w.experts.some((i) => i.id === x.id)) ||
                          (["installed", "已安装"].includes(detail) &&
                            w.installed.includes(x.id)) ||
                          detail === x.category),
                    )
                    .map((x) => (
                      <CatalogCard
                        key={x.id}
                        item={x}
                        onClick={() => open("catalog", x.id)}
                        active={
                          page === "skills"
                            ? w.installed.includes(x.id)
                            : page === "connectors"
                              ? w.connectors[x.id]?.enabled
                              : false
                        }
                        action={() =>
                          page === "experts"
                            ? run("expert", { id: x.id, action: "summon" })
                            : page === "skills"
                              ? run("skill", {
                                  id: x.id,
                                  remove: w.installed.includes(x.id),
                                })
                              : open("connector", x.id)
                        }
                      />
                    ))}
                  {!catalogs.filter((x) => x.name.includes(search)).length && (
                    <Empty>没有找到匹配内容</Empty>
                  )}
                </div>
              </div>
            )}
            {page === "projects" && (
              <div className="wb-scroll wb-projects">
                {detail ? (
                  <ProjectDetail
                    s={s}
                    id={detail}
                    onEdit={() => open("project-edit", detail)}
                  />
                ) : (
                  w.projects
                    .filter((x) => x.name.includes(search))
                    .map((p) => (
                      <button
                        className="wb-project-card"
                        key={p.id}
                        onClick={() => setDetail(p.id)}
                      >
                        <I.Folder size={28} />
                        <h3>{p.name}</h3>
                        <p>{p.instructions}</p>
                        <footer>
                          {p.members.length} 位成员 ·{" "}
                          {w.tasks.filter((t) => t.project === p.id).length}{" "}
                          项任务
                          <I.ChevronRight />
                        </footer>
                      </button>
                    ))
                )}
              </div>
            )}
            {page === "assistants" && (
              <div className="wb-scroll">
                {detail ? (
                  <AssistantDetail s={s} id={detail} open={open} />
                ) : (
                  <div className="wb-card-grid">
                    {w.assistants
                      .filter((x) => x.name.includes(search))
                      .map((a) => (
                        <button
                          className="wb-project-card"
                          key={a.id}
                          onClick={() => setDetail(a.id)}
                        >
                          <I.Bot size={32} />
                          <h3>{a.name}</h3>
                          <p>{a.channel}</p>
                          <small>
                            {a.enabled ? "本地配置已启用" : "未配置渠道"}
                          </small>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
            {page === "automation" && (
              <div className="wb-scroll">
                <div className="wb-filter-tabs">
                  {["全部", "已启用", "已暂停", "运行记录"].map((x) => (
                    <button
                      key={x}
                      className={
                        detail === x || (!detail && x === "全部")
                          ? "active"
                          : ""
                      }
                      onClick={() => setDetail(x)}
                    >
                      {x}
                    </button>
                  ))}
                </div>
                {detail === "运行记录" ? (
                  w.automations.flatMap((a) =>
                    a.records.map((r) => (
                      <button
                        className="wb-list-row"
                        key={r.task}
                        onClick={() => go("task", r.task)}
                      >
                        {a.name}
                        <span>
                          {new Date(r.at).toLocaleString("zh-CN")} · {r.status}
                        </span>
                        <I.ChevronRight />
                      </button>
                    )),
                  )
                ) : (
                  <div className="wb-automation-grid">
                    {w.automations
                      .filter(
                        (a) =>
                          a.name.includes(search) &&
                          (detail !== "已启用" || a.enabled) &&
                          (detail !== "已暂停" || !a.enabled),
                      )
                      .map((a) => (
                        <article key={a.id} className="wb-automation-card">
                          <header>
                            <button
                              onClick={() => open("automation-edit", a.id)}
                            >
                              <b>{a.name}</b>
                            </button>
                            <button
                              className={"wb-toggle " + (a.enabled ? "on" : "")}
                              aria-label={"启停 " + a.name}
                              aria-pressed={a.enabled}
                              onClick={() =>
                                run("automation", {
                                  id: a.id,
                                  action: "toggle",
                                })
                              }
                            />
                          </header>
                          <p>{a.prompt}</p>
                          <footer>
                            {a.days
                              .map((d) => "周" + "日一二三四五六"[d])
                              .join("、")}{" "}
                            {a.time}
                            <button
                              onClick={() =>
                                run("automation", { id: a.id, action: "run" })
                              }
                            >
                              <I.Play size={14} />
                              试运行
                            </button>
                            <button
                              aria-label={"删除 " + a.name}
                              onClick={() => open("delete-automation", a.id)}
                            >
                              <I.Trash2 size={15} />
                            </button>
                          </footer>
                        </article>
                      ))}
                  </div>
                )}
                {detail === "运行记录" &&
                  !w.automations.some((a) => a.records.length) && (
                    <Empty>暂无运行记录</Empty>
                  )}
              </div>
            )}
            {["library", "documents", "knowledge"].includes(page) && (
              <Library
                s={s}
                search={search}
                page={page}
                detail={detail}
                setDetail={setDetail}
                open={open}
              />
            )}
            {page === "buddy" && (
              <div className="wb-scroll wb-buddy">
                <h1>发现 Buddy 应用</h1>
                <article>
                  <img src={logo} alt="" />
                  <h2>销售工作台</h2>
                  <p>客户需求、采购报价、交付安排与销售汇报</p>
                  <button
                    className="wb-primary"
                    onClick={async () => {
                      if (!w.settings.buddyAuthorized) open("authorize");
                      else await go("home");
                    }}
                  >
                    {w.settings.buddyAuthorized ? "进入工作台" : "查看并授权"}
                  </button>
                  {w.settings.buddyAuthorized && (
                    <button
                      onClick={() =>
                        run("config", { key: "buddyAuthorized", value: false })
                      }
                    >
                      撤销本地授权
                    </button>
                  )}
                </article>
                {w.settings.buddyAuthorized && (
                  <section className="wb-buddy-config">
                    <h3>工作台配置</h3>
                    <label>
                      默认专家
                      <select
                        value={w.settings.buddyExpert}
                        onChange={(e) =>
                          run("config", {
                            key: "buddyExpert",
                            value: e.target.value,
                          })
                        }
                      >
                        {[...wbExperts, ...w.experts].map((x) => (
                          <option value={x.id} key={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <h3>销售场景</h3>
                    <div className="wb-card-grid">
                      {Object.entries(resultLabels).map(([kind, name]) => (
                        <button
                          className="wb-project-card"
                          key={kind}
                          onClick={async () => {
                            await run("expert", {
                              id: w.settings.buddyExpert,
                              action: "summon",
                            });
                            await run("template", {
                              text: "帮我生成澄星设计的" + name,
                            });
                          }}
                        >
                          <I.BriefcaseBusiness />
                          <h3>{name}</h3>
                        </button>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
            {page === "mailbox" && (
              <div className="wb-scroll wb-mailbox">
                <div className="wb-mail-account">
                  <I.Mail size={25} />
                  <b>chen.lang@example.com</b>
                  <small>本地演示</small>
                  <button onClick={() => open("mail-write")}>写邮件</button>
                </div>
                {!detail &&
                  w.mailDrafts.map((m) => (
                    <article className="wb-mail-detail" key={m.id}>
                      <small>草稿 · {m.recipient}</small>
                      <h3>{m.subject}</h3>
                      <p>{m.body}</p>
                      <button
                        onClick={() => {
                          void go("home").then(() =>
                            run("reference", { text: m.body }),
                          );
                        }}
                      >
                        引用到新任务
                      </button>
                    </article>
                  ))}
                {detail
                  ? s.mails
                      .filter((m) => m.id === detail)
                      .map((m) => (
                        <article className="wb-mail-detail" key={m.id}>
                          <h2>{m.subject}</h2>
                          <small>
                            {m.from} · {m.address}
                          </small>
                          <p>{m.body}</p>
                          <button
                            onClick={() => {
                              void go("home").then(() =>
                                run("reference", { text: m.body }),
                              );
                            }}
                          >
                            引用到新任务
                          </button>
                          <button onClick={() => open("mail-write", m.id)}>
                            回复
                          </button>
                        </article>
                      ))
                  : s.mails
                      .filter((m) => m.subject.includes(search))
                      .map((m) => (
                        <button
                          className="wb-list-row"
                          key={m.id}
                          onClick={() => setDetail(m.id)}
                        >
                          <I.Mail size={18} />
                          <b>{m.subject}</b>
                          <span>{m.from}</span>
                          <I.ChevronRight />
                        </button>
                      ))}
              </div>
            )}
            {page === "inspiration" && (
              <div className="wb-scroll">
                <h3>销售工作灵感</h3>
                <div className="wb-card-grid">
                  {Object.entries(resultLabels).map(([kind, name]) => (
                    <button
                      className="wb-project-card"
                      key={kind}
                      onClick={async () => {
                        await go("home");
                        await run("template", {
                          text: "帮我生成澄星设计的" + name,
                        });
                      }}
                    >
                      <I.Sparkles />
                      <h3>{name}</h3>
                      <p>基于客户需求与现有项目资料</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {page === "settings" && <Settings s={s} open={open} />}
            {page === "notifications" && (
              <div className="wb-scroll">
                <button onClick={() => run("notice-read")}>全部标为已读</button>
                {w.notices.map((n) => (
                  <div className="wb-list-row" key={n.id}>
                    <I.Bell size={18} />
                    {n.text}
                    {!n.read && <i className="wb-unread" />}
                  </div>
                ))}
                {!w.notices.length && <Empty>暂无消息</Empty>}
              </div>
            )}
          </>
        )}
        {page !== "task" && w.previewActive && (
          <div className="wb-library-preview">
            <FilePanel s={s} />
          </div>
        )}
      </section>
      {overlay && (
        <div
          className={"wb-overlay" + (menuPosition ? " wb-popover-overlay" : "")}
          onClick={closeOverlay}
        >
          <section
            className={
              "wb-dialog " +
              (overlay.type === "search" ? "wb-search-dialog" : "")
            }
            style={menuPosition || undefined}
            role="dialog"
            aria-modal="true"
            aria-label="WorkBuddy 面板"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <h3>{overlayTitle(overlay.type)}</h3>
              <button aria-label="关闭 WorkBuddy 面板" onClick={closeOverlay}>
                <I.X />
              </button>
            </header>
            <Overlay
              key={overlay.type + ":" + overlay.id}
              s={s}
              overlay={overlay}
              error={formError}
              setError={setFormError}
              close={closeOverlay}
              open={open}
            />
          </section>
        </div>
      )}
    </div>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return <div className="wb-empty">{children}</div>;
}
function FileSymbol({ file }: { file: WbFile }) {
  return (
    <span className={"wb-file-symbol " + file.kind}>
      {file.kind === "sheet" ? (
        <I.Table2 />
      ) : file.kind === "slides" ? (
        <I.Presentation />
      ) : (
        <I.FileText />
      )}
    </span>
  );
}
function CatalogCard({
  item,
  onClick,
  action,
  active,
}: {
  item: CatalogItem;
  onClick: () => void;
  action: () => void;
  active?: boolean;
}) {
  return (
    <article className="wb-catalog-card">
      <button className="wb-card-content" onClick={onClick}>
        <Glyph item={item} />
        <div>
          <b>{item.name}</b>
          <p>{item.description}</p>
          <small>
            {item.category}
            {item.team ? " · 专家团" : ""}
          </small>
        </div>
      </button>
      <button aria-label={"选择 " + item.name} onClick={action}>
        {active ? <I.Check size={17} /> : <I.Plus size={17} />}
      </button>
    </article>
  );
}
function Composer({
  s,
  open,
}: {
  s: State;
  open: (type: string, id?: string) => void;
}) {
  const w = s.workbuddy,
    id = `wb:draft:${w.task}`,
    d = w.drafts[w.task],
    editor = useWorkBuddyInput(
      id,
      "WorkBuddy · " +
        (w.task === "new"
          ? "新建任务"
          : w.tasks.find((t) => t.id === w.task)?.title),
    );
  const task = w.tasks.find((t) => t.id === w.task);
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="wb-composer">
      <div
        className={
          "wb-composer-box " + (s.target?.id === id ? "wb-selected" : "")
        }
      >
        {d?.references.map((text, index) => (
          <div className="wb-reference-chip" key={index}>
            <I.TextQuote size={13} />
            <span>{text}</span>
            <button
              aria-label="删除引用"
              onClick={() => run("reference-remove", { index })}
            >
              <I.X size={12} />
            </button>
          </div>
        ))}
        {d?.attachments.map((id) => {
          const f = w.files.find((x) => x.id === id);
          return (
            f && (
              <div className="wb-reference-chip" key={id}>
                <I.Paperclip size={13} />
                {f.name}
                <button
                  aria-label={"移除 " + f.name}
                  onClick={() => run("attach", { id, remove: true })}
                >
                  <I.X size={12} />
                </button>
              </div>
            )
          );
        })}
        <textarea
          ref={ref}
          aria-label="WorkBuddy 任务输入"
          placeholder="今天帮你做些什么？ @ 添加上下文，/调用技能与指令"
          value={editor.text}
          onFocus={() => editor.focus()}
          onChange={(e) => editor.update(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              editor.submit();
            }
            if (e.key === "@") open("attachments");
            if (e.key === "/") open("skills");
          }}
        />
        <div className="wb-composer-tools">
          <button aria-label="添加内容" onClick={() => open("add")}>
            <I.Plus size={19} />
          </button>
          {w.entityDrafts["selected-expert"]?.text && (
            <button
              onClick={() =>
                open("catalog", w.entityDrafts["selected-expert"].text)
              }
            >
              <I.GraduationCap size={15} />
              {
                [...wbExperts, ...w.experts].find(
                  (x) => x.id === w.entityDrafts["selected-expert"].text,
                )?.name
              }
            </button>
          )}
          <span />
          <button onClick={() => open("model")}>
            {task?.model || w.settings.model}
            <I.ChevronDown size={12} />
          </button>
          <button
            aria-label="手机语音输入"
            onClick={() => {
              void editor.focus();
            }}
          >
            <I.Mic size={18} />
          </button>
          <button
            className="wb-send"
            aria-label="发送 WorkBuddy 任务"
            disabled={
              !editor.text.trim() ||
              editor.busy ||
              editor.blocked ||
              task?.status === "running"
            }
            onClick={() => editor.submit()}
          >
            <I.ArrowUp size={19} />
          </button>
        </div>
      </div>
      <div className="wb-composer-options">
        <button onClick={() => open("workspace")}>
          <I.Folder size={14} />
          {w.settings.workspace || "选择工作空间"}
          <I.ChevronDown size={12} />
        </button>
        <button onClick={() => open("permission")}>
          <I.ShieldCheck size={14} />
          {w.settings.permission}
          <I.ChevronDown size={12} />
        </button>
        {w.settings.mode !== "agent" && (
          <button onClick={() => open("mode")}>
            {modeLabels[w.settings.mode]}
          </button>
        )}
        <small>本地演示</small>
      </div>
      {editor.blocked && (
        <div className="wb-draft-warning">
          草稿已保留<button onClick={editor.recover}>恢复到当前输入框</button>
        </div>
      )}
    </div>
  );
}
function Markdown({ text }: { text: string }) {
  return (
    <div className="wb-markdown">
      {text.split("\n\n").map((block, i) => {
        if (block.startsWith("|"))
          return (
            <table key={i}>
              <tbody>
                {block
                  .split("\n")
                  .filter((x) => !/^\|[\s|:-]+$/.test(x))
                  .map((row, j) => (
                    <tr key={j}>
                      {row
                        .split("|")
                        .slice(1, -1)
                        .map((cell, k) =>
                          j === 0 ? (
                            <th key={k}>{cell.trim()}</th>
                          ) : (
                            <td key={k}>{cell.trim()}</td>
                          ),
                        )}
                    </tr>
                  ))}
              </tbody>
            </table>
          );
        if (block.startsWith("## ")) return <h3 key={i}>{block.slice(3)}</h3>;
        if (block.startsWith("# ")) return <h1 key={i}>{block.slice(2)}</h1>;
        return <p key={i}>{block}</p>;
      })}
    </div>
  );
}
function FilePanel({ s }: { s: State }) {
  const w = s.workbuddy,
    f = w.files.find((x) => x.id === w.previewActive);
  const [editing, setEditing] = useState(false),
    [selection, setSelection] = useState(""),
    [zoom, setZoom] = useState(100);
  useEffect(() => {
    setEditing(false);
    setSelection("");
  }, [f?.id]);
  return (
    <aside className="wb-file-panel">
      <header>
        <div className="wb-preview-tabs">
          {w.preview.map((id) => {
            const file = w.files.find((f) => f.id === id);
            return (
              file && (
                <div key={id}>
                  <button
                    className={w.previewActive === id ? "active" : ""}
                    onClick={() => run("preview", { id })}
                  >
                    <I.FileText size={13} />
                    {file.name}
                  </button>
                  <button
                    aria-label={"关闭 " + file.name}
                    onClick={() => run("preview-close", { id })}
                  >
                    <I.X size={12} />
                  </button>
                </div>
              )
            );
          })}
          <button
            aria-label="文件目录"
            onClick={() => run("file-panel", { open: !w.filePanel })}
          >
            <I.FolderTree size={17} />
          </button>
        </div>
      </header>
      {f ? (
        <>
          <div className="wb-file-toolbar">
            <strong>{f.name}</strong>
            <button onClick={() => setZoom(zoom === 100 ? 125 : 100)}>
              {zoom}%
            </button>
            <button aria-label="编辑文件" onClick={() => setEditing(!editing)}>
              <I.Pencil size={16} />
            </button>
            <button
              aria-label="刷新文件数据"
              onClick={() => run("file", { id: f.id, action: "refresh" })}
            >
              <I.RefreshCw size={16} />
            </button>
            <button
              aria-label="分享文件"
              onClick={() => {
                run("share", { name: f.name });
                toast("已保存本地分享记录");
              }}
            >
              <I.Share2 size={16} />
            </button>
          </div>
          {editing ? (
            <FileEditor key={f.id} file={f} />
          ) : (
            <div
              className="wb-preview-body"
              style={{ fontSize: `${zoom}%` }}
              onMouseUp={() =>
                setSelection(window.getSelection()?.toString() || "")
              }
              onTouchEnd={() =>
                setTimeout(
                  () => setSelection(window.getSelection()?.toString() || ""),
                  100,
                )
              }
            >
              <Markdown text={f.content} />
            </div>
          )}
          {selection && (
            <button
              className="wb-selection-action"
              onClick={() => {
                run("reference", { text: selection });
                setSelection("");
              }}
            >
              引用到任务
              <I.TextQuote size={16} />
            </button>
          )}
          <footer className="wb-file-footer">
            <span>
              数据版本 {f.dataVersion}
              {f.edited ? " · 已编辑" : ""}
            </span>
            {f.officeId && (
              <button
                onClick={() => command("office-open", { id: f.officeId })}
              >
                在 WPS 中打开
                <I.ArrowUpRight size={15} />
              </button>
            )}
          </footer>
        </>
      ) : (
        <Empty>选择文件以预览</Empty>
      )}
      {w.filePanel && (
        <div className="wb-directory">
          <h4>工作空间 · 澄星设计</h4>
          {w.files.map((file) => (
            <button
              key={file.id}
              onClick={() => run("preview", { id: file.id })}
            >
              <FileSymbol file={file} />
              <span>{file.name}</span>
              <I.ChevronRight size={13} />
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
function FileEditor({ file }: { file: WbFile }) {
  const editor = useWorkBuddyInput("wb:file:" + file.id, "编辑 · " + file.name);
  return (
    <div className="wb-file-editor">
      <textarea
        aria-label="WorkBuddy 文件正文"
        value={editor.text}
        onFocus={editor.focus}
        onChange={(e) => editor.update(e.target.value)}
      />
      <button
        className="wb-primary"
        disabled={editor.busy || editor.blocked}
        onClick={() => editor.submit()}
      >
        保存
      </button>
      {editor.blocked && <button onClick={editor.recover}>恢复本地草稿</button>}
    </div>
  );
}
function ProjectDetail({
  s,
  id,
  onEdit,
}: {
  s: State;
  id: string;
  onEdit: () => void;
}) {
  const p = s.workbuddy.projects.find((p) => p.id === id);
  return p ? (
    <>
      <header className="wb-detail-header">
        <I.Folder />
        <h2>{p.name}</h2>
        <button onClick={onEdit}>编辑项目</button>
      </header>
      <h3>项目指令</h3>
      <EditableText
        id={"wb:project:" + id + ":instructions"}
        label="项目指令"
        value={p.instructions}
      />
      <div className="wb-member-list">
        {p.members.map((m) => (
          <span key={m}>
            <I.UserRound size={16} />
            {m}
          </span>
        ))}
      </div>
      <h3>任务</h3>
      {s.workbuddy.tasks
        .filter((t) => t.project === id)
        .map((t) => (
          <button
            className="wb-list-row"
            key={t.id}
            onClick={() => go("task", t.id)}
          >
            {t.title}
            <span>{statusLabels[t.status]}</span>
            <I.ChevronRight />
          </button>
        ))}
    </>
  ) : (
    <Empty>项目不存在</Empty>
  );
}
function EditableText({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) {
  const editor = useWorkBuddyInput(id, label, value);
  return (
    <div className="wb-inline-editor">
      <textarea
        className="wb-editable-text"
        aria-label={label}
        value={editor.text}
        onFocus={editor.focus}
        onChange={(e) => editor.update(e.target.value)}
      />
      <button
        disabled={editor.busy || editor.blocked}
        onClick={() => editor.submit()}
      >
        保存修改
      </button>
      {editor.blocked && <button onClick={editor.recover}>恢复草稿</button>}
    </div>
  );
}
function AssistantDetail({
  s,
  id,
  open,
}: {
  s: State;
  id: string;
  open: (type: string, id?: string) => void;
}) {
  const a = s.workbuddy.assistants.find((a) => a.id === id);
  const editor = useWorkBuddyInput(
    "wb:assistant:" + id + ":message",
    "助理 · " + (a?.name || ""),
  );
  return a ? (
    <>
      <header className="wb-detail-header">
        <I.Bot />
        <h2>{a.name}</h2>
        <button onClick={() => open("assistant-edit", id)}>渠道配置</button>
        <small>{a.enabled ? "本地配置已启用" : "本地演示"}</small>
        {a.enabled && (
          <button
            onClick={() => run("assistant", { id: a.id, enabled: false })}
          >
            停用渠道
          </button>
        )}
      </header>
      <div className="wb-assistant-chat">
        {a.messages.map((m, i) => (
          <p key={i}>
            {m.role === "user" ? "陈朗" : "销售助理"}：{m.text}
          </p>
        ))}
      </div>
      <textarea
        aria-label="助理消息"
        placeholder="给助理发送需求…"
        value={editor.text}
        onFocus={editor.focus}
        onChange={(e) => editor.update(e.target.value)}
      />
      <button
        className="wb-primary"
        onClick={() => editor.submit()}
        disabled={!editor.text.trim()}
      >
        发送
      </button>
    </>
  ) : null;
}
function Library({
  s,
  search,
  page,
  detail,
  setDetail,
  open,
}: {
  s: State;
  search: string;
  page: WorkBuddyPage;
  detail: string;
  setDetail: (x: string) => void;
  open: (type: string, id?: string) => void;
}) {
  const w = s.workbuddy;
  return (
    <div className="wb-library">
      <aside>
        <button
          className={!detail ? "active" : ""}
          onClick={() => setDetail("")}
        >
          最近
        </button>
        <button
          className={detail === "澄星设计" ? "active" : ""}
          onClick={() => setDetail("澄星设计")}
        >
          本地文件
        </button>
        <h4>项目资料</h4>
        {[...new Set(w.files.map((f) => f.folder))].map((x) => (
          <button key={x} onClick={() => setDetail(x)}>
            <I.Folder size={15} />
            {x}
          </button>
        ))}
      </aside>
      <section>
        <h2>{detail || "最近"}</h2>
        <div className="wb-filter-tabs">
          <button>最近访问</button>
          <button onClick={() => open("library")}>添加资料</button>
        </div>
        <div className="wb-library-table">
          <header>
            <span>名称</span>
            <span>类型</span>
            <span>位置</span>
          </header>
          {w.files
            .filter(
              (f) =>
                f.name.includes(search) && (!detail || f.folder === detail),
            )
            .map((f) => (
              <div key={f.id}>
                <button onClick={() => run("preview", { id: f.id })}>
                  <FileSymbol file={f} />
                  {f.name}
                </button>
                <span>
                  {f.kind === "markdown"
                    ? "文档"
                    : f.kind === "sheet"
                      ? "表格"
                      : f.kind === "slides"
                        ? "演示"
                        : "文字"}
                </span>
                <span>{f.folder}</span>
                <button
                  aria-label={"引用 " + f.name}
                  onClick={async () => {
                    await go("home");
                    await run("attach", { id: f.id });
                  }}
                >
                  引用
                </button>
                <button
                  aria-label={"删除资料 " + f.name}
                  onClick={() => open("delete-file", f.id)}
                >
                  <I.Trash2 size={15} />
                </button>
              </div>
            ))}
        </div>
        <h3>{page === "knowledge" ? "知识复利" : "了解资料库"}</h3>
        <div className="wb-library-tips">
          <button onClick={() => open("library")}>
            <I.Files />
            <b>整理客户采购资料</b>
            <p>需求、产品、报价与交付安排</p>
          </button>
          <button
            onClick={() => {
              go("home");
              run("template", { text: "根据项目资料生成澄星设计客户方案" });
            }}
          >
            <I.BookOpen />
            <b>从资料到工作成果</b>
            <p>引用到任务，生成方案或汇报</p>
          </button>
        </div>
      </section>
    </div>
  );
}
function Settings({
  s,
  open,
}: {
  s: State;
  open: (type: string, id?: string) => void;
}) {
  const w = s.workbuddy;
  return (
    <div className="wb-scroll wb-settings">
      <div className="wb-profile">
        <img src={logo} alt="" />
        <div>
          <h2>陈朗</h2>
          <span>chen.lang@example.com</span>
        </div>
        <small>本地演示</small>
      </div>
      {[
        ["默认模型", w.settings.model, "model"],
        ["工作模式", modeLabels[w.settings.mode], "mode"],
        ["默认权限", w.settings.permission, "permission"],
        ["工作空间", w.settings.workspace, "workspace"],
      ].map(([title, value, type]) => (
        <button className="wb-list-row" key={type} onClick={() => open(type)}>
          {title}
          <span>{value}</span>
          <I.ChevronRight />
        </button>
      ))}
      <h3>记忆</h3>
      <EditableText
        id="wb:settings:memory:text"
        label="WorkBuddy 记忆"
        value={w.settings.memory}
      />
      <h3>菜单栏</h3>
      {w.settings.menu.map((p, i) => (
        <div className="wb-list-row" key={p}>
          {wbLabels[p]}
          <span />
          <button
            aria-label={"上移 " + wbLabels[p]}
            disabled={i <= 1}
            onClick={() => {
              const menu = [...w.settings.menu];
              [menu[i - 1], menu[i]] = [menu[i], menu[i - 1]];
              run("config", { key: "menu", value: menu });
            }}
          >
            <I.ArrowUp size={17} />
          </button>
          <button
            aria-label={"下移 " + wbLabels[p]}
            disabled={i === 0 || i === w.settings.menu.length - 1}
            onClick={() => {
              const menu = [...w.settings.menu];
              [menu[i], menu[i + 1]] = [menu[i + 1], menu[i]];
              run("config", { key: "menu", value: menu });
            }}
          >
            <I.ArrowDown size={17} />
          </button>
        </div>
      ))}
      <h3>数据管理</h3>
      <button
        onClick={() => {
          const blob = new Blob([JSON.stringify(w, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "workbuddy-demo-data.json";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      >
        导出本地数据
        <I.Download size={18} />
      </button>
      <h3>用量</h3>
      <p>
        本地任务 {w.tasks.length} 项 · 结果文件 {w.files.length} 个 ·
        本原型不消耗模型积分
      </p>
    </div>
  );
}
function overlayTitle(type: string) {
  return (
    (
      {
        search: "搜索任务",
        model: "选择模型",
        mode: "工作模式",
        permission: "权限",
        workspace: "工作空间",
        add: "添加内容",
        attachments: "项目文件",
        templates: "选择任务模板",
        task: "任务操作",
        catalog: "能力详情",
        connector: "连接器配置",
        skills: "选择技能",
        projects: "新建项目",
        "project-edit": "编辑项目",
        assistants: "新建助理",
        "assistant-edit": "渠道配置",
        automation: "新建定时任务",
        "automation-edit": "编辑定时任务",
        library: "添加资料",
        authorize: "销售工作台授权",
        "my-experts": "我的专家",
        "expert-create": "创建专家",
        "expert-edit": "修改专家",
        "mail-write": "邮件草稿",
        "delete-file": "删除资料",
        "delete-automation": "删除定时任务",
      } as Record<string, string>
    )[type] || "WorkBuddy"
  );
}
function Overlay({
  s,
  overlay,
  error,
  setError,
  close,
  open,
}: {
  s: State;
  overlay: { type: string; id?: string };
  error: string;
  setError: (v: string) => void;
  close: () => void;
  open: (t: string, id?: string) => void;
}) {
  const w = s.workbuddy,
    type = overlay.type,
    id = overlay.id;
  const project = w.projects.find((x) => x.id === id),
    auto = w.automations.find((x) => x.id === id),
    assistant = w.assistants.find((x) => x.id === id),
    expert = [...wbExperts, ...w.experts].find((x) => x.id === id),
    task = w.tasks.find((x) => x.id === id),
    connector = wbConnectors.find((x) => x.id === id),
    catalog = (
      w.page === "skills"
        ? wbSkills
        : w.page === "connectors"
          ? wbConnectors
          : [...wbExperts, ...w.experts]
    ).find((x) => x.id === id);
  const [name, setName] = useState(
      project?.name || auto?.name || assistant?.name || task?.title || "",
    ),
    [body, setBody] = useState(
      project?.instructions || auto?.prompt || expert?.description || "",
    ),
    [time, setTime] = useState(auto?.time || "09:00"),
    [days, setDays] = useState(auto?.days || [1, 2, 3, 4, 5]),
    [channel, setChannel] = useState(assistant?.channel || "企业微信"),
    [folder, setFolder] = useState("澄星设计"),
    [kind, setKind] = useState<ResultKind>("brief"),
    [recipient, setRecipient] = useState(
      s.mails.find((m) => m.id === id)?.address || "lin.yue@example.com",
    ),
    [team, setTeam] = useState(expert?.team || false);
  async function save(action: string, v: Record<string, unknown>) {
    const ack = await run(action, v);
    if (ack.ok) close();
    else setError(ack.error || "保存失败");
  }
  if (type === "search")
    return (
      <>
        <input
          autoFocus
          aria-label="搜索历史任务"
          placeholder="搜索任务…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {w.tasks
          .filter((t) => t.title.includes(name))
          .map((t) => (
            <button
              className="wb-menu-row"
              key={t.id}
              onClick={() => {
                go("task", t.id);
                close();
              }}
            >
              {t.title}
              <small>{statusLabels[t.status]}</small>
            </button>
          ))}
      </>
    );
  if (type === "model")
    return (
      <>
        {[
          "均衡",
          "极致",
          "Hy4 preview",
          "Hy3",
          "Space-Bunny",
          "DeepSeek-V4.1-Flash",
          "GLM-5.3",
          "GLM-5.3-Flash",
          "GLM-5.2",
          "Kimi",
          "MiniMax",
        ].map((x) => (
          <button
            className="wb-menu-row"
            key={x}
            onClick={() => save("config", { key: "model", value: x })}
          >
            <I.Sparkles size={16} />
            {x}
            <span />
            {w.settings.model === x && <I.Check size={15} />}
          </button>
        ))}
      </>
    );
  if (type === "mode")
    return (
      <>
        {Object.entries(modeLabels).map(([k, v]) => (
          <button
            className="wb-menu-row"
            key={k}
            onClick={() => save("config", { key: "mode", value: k })}
          >
            {v}
            <small>
              {k === "plan"
                ? "先审阅计划，再执行"
                : k === "ask"
                  ? "只回答，不生成文件"
                  : "直接执行任务"}
            </small>
          </button>
        ))}
      </>
    );
  if (type === "permission")
    return (
      <>
        {["默认权限", "完全访问权限"].map((x) => (
          <button
            className="wb-menu-row"
            key={x}
            onClick={() => save("config", { key: "permission", value: x })}
          >
            {x}
            <small>仅用于本地演示任务</small>
          </button>
        ))}
      </>
    );
  if (type === "workspace")
    return (
      <>
        {w.projects.map((p) => (
          <button
            className="wb-menu-row"
            key={p.id}
            onClick={() => save("config", { key: "workspace", value: p.name })}
          >
            <I.Folder />
            {p.name}
          </button>
        ))}
      </>
    );
  if (type === "add")
    return (
      <>
        {[
          ["attachments", "添加附件"],
          ["mode", "工作模式"],
          ["skills", "选择技能"],
          ["workspace", "选择工作空间"],
          ["permission", "权限"],
        ].map(([t, label]) => (
          <button className="wb-menu-row" key={t} onClick={() => open(t)}>
            {label}
            <I.ChevronRight />
          </button>
        ))}
      </>
    );
  if (type === "attachments")
    return (
      <>
        {w.files.map((f) => (
          <button
            className="wb-menu-row"
            key={f.id}
            onClick={() => save("attach", { id: f.id })}
          >
            <FileSymbol file={f} />
            {f.name}
          </button>
        ))}
      </>
    );
  if (type === "templates")
    return (
      <>
        {Object.entries(resultLabels).map(([k, v]) => (
          <button
            className="wb-menu-row"
            key={k}
            onClick={() =>
              save("template", {
                text: "帮我根据现有项目资料生成澄星设计的" + v,
              })
            }
          >
            {v}
            <I.ChevronRight />
          </button>
        ))}
      </>
    );
  if (type === "skills")
    return (
      <>
        {wbSkills.map((x) => (
          <button
            className="wb-menu-row"
            key={x.id}
            onClick={() =>
              save("skill", { id: x.id, remove: w.installed.includes(x.id) })
            }
          >
            <Glyph item={x} />
            {x.name}
            <small>{w.installed.includes(x.id) ? "已安装" : "安装"}</small>
          </button>
        ))}
      </>
    );
  if (type === "task" && task)
    return (
      <>
        <label>
          任务名称
          <input
            aria-label="任务名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button onClick={() => save("task", { id, action: "rename", name })}>
          保存名称
        </button>
        <button
          className="wb-menu-row"
          onClick={() => save("task", { id, action: "favorite" })}
        >
          <I.Star />
          {task.favorite ? "取消收藏" : "收藏任务"}
        </button>
        <label>
          项目
          <select
            aria-label="任务项目"
            defaultValue={task.project}
            onChange={(e) =>
              run("project", { id: e.target.value, task: id, action: "assign" })
            }
          >
            {w.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="wb-danger"
          onClick={() => save("task", { id, action: "delete" })}
        >
          删除任务
        </button>
      </>
    );
  if (type === "catalog" && catalog)
    return (
      <>
        <div className="wb-catalog-detail">
          <Glyph item={catalog} />
          <h2>{catalog.name}</h2>
          <small>{catalog.category}</small>
          <p>{catalog.description}</p>
        </div>
        {w.page !== "skills" && w.page !== "connectors" ? (
          <>
            <button
              className="wb-primary"
              onClick={() => save("expert", { id, action: "summon" })}
            >
              召唤{catalog.team ? "专家团" : "专家"}
            </button>
            {w.experts.some((x) => x.id === id) && (
              <>
                <button onClick={() => open("expert-edit", id)}>
                  修改专家
                </button>
                <button
                  className="wb-danger"
                  onClick={() => save("expert", { id, action: "delete" })}
                >
                  删除专家
                </button>
              </>
            )}
          </>
        ) : wbSkills.some((x) => x.id === id) ? (
          <button
            className="wb-primary"
            onClick={() =>
              save("skill", { id, remove: w.installed.includes(id!) })
            }
          >
            {w.installed.includes(id!) ? "移除技能" : "安装技能"}
          </button>
        ) : (
          <button onClick={() => open("connector", id)}>配置连接器</button>
        )}
      </>
    );
  if (type === "my-experts")
    return (
      <>
        <button className="wb-primary" onClick={() => open("expert-create")}>
          创建专家
        </button>
        {w.experts.map((x) => (
          <button
            className="wb-menu-row"
            key={x.id}
            onClick={() => open("catalog", x.id)}
          >
            <Glyph item={x} />
            {x.name}
          </button>
        ))}
        {!w.experts.length && <Empty>暂无自建专家</Empty>}
      </>
    );
  if (type === "authorize")
    return (
      <>
        <img className="wb-authorize-icon" src={logo} alt="" />
        <h2>销售工作台</h2>
        <p>将当前项目资料、销售任务和选定能力用于本地演示。</p>
        <button
          className="wb-primary"
          onClick={() =>
            save("config", { key: "buddyAuthorized", value: true })
          }
        >
          授权本地工作台
        </button>
      </>
    );
  if (type.startsWith("delete-"))
    return (
      <>
        <p>删除后将从本地列表移除。</p>
        <button
          className="wb-danger"
          onClick={() =>
            save(type === "delete-file" ? "file" : "automation", {
              id,
              action: "delete",
            })
          }
        >
          确认删除
        </button>
      </>
    );
  if (type === "mail-write") {
    const mail = s.mails.find((m) => m.id === id);
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await save("mail-draft", { recipient, subject: name, body });
          toast("已保存本地邮件草稿");
        }}
      >
        <label>
          收件人
          <FormInput
            id={`wb:form:mail-write-${id || "new"}:recipient`}
            label="收件人"
            value={recipient}
            onChange={setRecipient}
          />
        </label>
        <label>
          主题
          <FormInput
            id={`wb:form:${type}-${id || "new"}:name`}
            label="主题"
            value={name}
            onChange={setName}
          />
        </label>
        <label>
          正文
          <FormInput
            id={`wb:form:${type}-${id || "new"}:body`}
            label="正文"
            multiline
            value={body}
            onChange={setBody}
          />
        </label>
        <button className="wb-primary">保存草稿</button>
      </form>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (type === "connector")
          void save("connector", { id, enabled: true, workspace: folder });
        else if (type === "projects" || type === "project-edit")
          void save("project", {
            id,
            action: type === "projects" ? "create" : "save",
            name,
            instructions: body,
          });
        else if (type === "assistants")
          void save("assistant", { action: "create", name, channel });
        else if (type === "assistant-edit")
          void save("assistant", { id, enabled: true, channel });
        else if (type === "automation" || type === "automation-edit")
          void save("automation", {
            id,
            action: "save",
            name,
            prompt: body,
            time,
            days,
            enabled: auto?.enabled || false,
          });
        else if (type === "library")
          void save("library-add", {
            kind,
            name: name || resultLabels[kind] + ".md",
            folder,
          });
        else if (type === "expert-create" || type === "expert-edit")
          void save("expert", {
            id,
            action: type === "expert-create" ? "create" : "edit",
            name,
            description: body,
            team,
          });
      }}
    >
      {type === "connector" ? (
        <>
          <h2>{connector?.name}</h2>
          <p>{connector?.description}</p>
          <label>
            工作空间
            <input value={folder} onChange={(e) => setFolder(e.target.value)} />
          </label>
          {w.connectors[id!]?.enabled && (
            <button
              type="button"
              onClick={() => save("connector", { id, enabled: false })}
            >
              停用本地连接
            </button>
          )}
        </>
      ) : (
        <>
          {type !== "assistant-edit" && (
            <label>
              名称
              <FormInput
                id={`wb:form:${type}-${id || "new"}:name`}
                label="名称"
                value={name}
                onChange={setName}
              />
            </label>
          )}
          {[
            "projects",
            "project-edit",
            "automation",
            "automation-edit",
            "expert-create",
            "expert-edit",
          ].includes(type) && (
            <label>
              {type.includes("automation")
                ? "任务内容"
                : type.includes("expert")
                  ? "工作方法与能力"
                  : "项目指令"}
              <FormInput
                id={`wb:form:${type}-${id || "new"}:body`}
                label="配置内容"
                multiline
                value={body}
                onChange={setBody}
              />
            </label>
          )}
          {type === "expert-create" && (
            <label>
              <input
                type="checkbox"
                checked={team}
                onChange={(e) => setTeam(e.target.checked)}
              />
              创建专家团
            </label>
          )}
          {type.includes("assistant") && (
            <label>
              渠道
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                {["企业微信", "微信", "飞书", "QQ", "钉钉"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          )}
          {type.includes("automation") && (
            <>
              <label>
                时间
                <input
                  aria-label="执行时间"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </label>
              <div className="wb-weekdays">
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <button
                    type="button"
                    key={d}
                    className={days.includes(d) ? "active" : ""}
                    onClick={() =>
                      setDays(
                        days.includes(d)
                          ? days.filter((x) => x !== d)
                          : [...days, d],
                      )
                    }
                  >
                    {"日一二三四五六"[d]}
                  </button>
                ))}
              </div>
            </>
          )}
          {type === "library" && (
            <>
              <label>
                资料类型
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as ResultKind)}
                >
                  {Object.entries(resultLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                文件夹
                <input
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                />
              </label>
            </>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="wb-error">
          {error}
        </p>
      )}
      <button className="wb-primary" type="submit">
        {type === "connector" ? "保存本地配置" : "保存"}
      </button>
    </form>
  );
}

function FormInput({
  id,
  label,
  value,
  onChange,
  multiline = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (text: string) => void;
  multiline?: boolean;
}) {
  const editor = useWorkBuddyInput(id, label, value);
  useEffect(() => {
    onChange(editor.text);
  }, [editor.text]);
  const props = {
    "aria-label": label,
    value: editor.text,
    onFocus: editor.focus,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      onChange(e.target.value);
      editor.update(e.target.value);
    },
  };
  return multiline ? <textarea {...props} /> : <input {...props} />;
}
