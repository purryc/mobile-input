import resources from "../data/resources.json" with { type: "json" };
import original from "../wechat/data/original.json" with { type: "json" };

export function filePreview(id?: string) {
  const artifact = [...original.artifacts, ...resources].find((a) => a.id === id);
  if (!artifact) return null;
  const summaries: Record<string, string> = {
    "wx-report":
      "报告整理了秋日社区读书会的活动目标、报名与场地准备、当天流程和人员分工，并列出费用、风险与后续复盘安排，便于筹备成员逐项确认执行。",
    "wx-book":
      "文章讲述社区书店如何通过读书会、邻里互助与清晰的参与边界，成为居民日常交流的空间，也讨论了分工、费用和个人隐私带来的挑战。",
    "wx-city":
      "记录一次与朋友放慢脚步的城市漫游，围绕路线、休息、预算与彼此偏好展开，强调事先沟通安排，给临时发现和日常生活留下空间。",
  };
  return { ...artifact, summary: String(("summary" in artifact ? artifact.summary : summaries[artifact.id]) || artifact.subtitle) };
}
