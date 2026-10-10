import type { WbApproval } from "../../../packages/core/workbuddy-approvals";
import { shareGroups } from "../../../packages/core/workbuddy-approvals";
export function WorkBuddyTaskApprovals({ requests }: { requests: WbApproval[] }) {
  if (!requests.length) return null;
  return <section className="wb-task-approvals" aria-label="任务审批状态">
    <h3>分享审批 · 本地模拟</h3>{requests.map(r => <article key={r.id}>
      <strong>{r.artifactName} · 审批版本 {r.revision}</strong>
      <span>{shareGroups[r.group]} · {{ pending: "待审批", approved: "已同意，已保存本地记录", rejected: "本次请求已拒绝，成果保留", superseded: "已更新，旧审批失效" }[r.status]}</span>
      {r.conditions && <p>{r.conditions}</p>}
    </article>)}
  </section>;
}
