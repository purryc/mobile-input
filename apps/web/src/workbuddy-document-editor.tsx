import { useRuntime, command } from "./runtime";
import { selectionAvailable, type WbPage, type WbProposal } from "../../../packages/core/workbuddy-documents";
import { useDocumentDraft } from "./workbuddy-document-input";
import { WorkBuddyCanvas } from "./workbuddy-canvas";

export function WorkBuddyDocumentEditor({ fileId, draftId, onCanceled, onRebind }: { fileId: string; draftId: string; onCanceled?: () => void; onRebind?: (text: string) => void }) {
  const r = useRuntime(), s = r.state, d = s.workbuddy.fileWorkspace.documents[fileId], draft = d?.drafts[draftId];
  const e = useDocumentDraft(fileId, draftId);
  if (!draft) return <p>草稿已不存在</p>;
  const page = d.pages.find(p => p.id === draft.selection.pageId)!, proposal = [...d.proposals].reverse().find(p => p.draftId === draftId && p.status === "pending");
  const unavailable = selectionAvailable(s, draft.selection), ended = draft.status === "applied" || draft.status === "canceled";
  async function cancel() { const ack = await command("wb-doc-cancel", { fileId, draftId, documentRevision: d.revision }); if (ack.ok) onCanceled?.(); }
  return <section className="wb-document-editor">
    <p className="wb-binding" title={`${fileId}/${draft.selection.pageId}/${draft.selection.objectIds.join(",")}`}>已锁定：{s.workbuddy.files.find(f => f.id === fileId)?.name} / {page?.title || "原页面"} · {draft.selection.objectIds.map(id => page?.objects.find(o => o.id === id)?.role || id).join("、")} · v{draft.selection.documentRevision}</p>
    {draft.source === "voice-demo" && <small className="wb-demo-label">演示语音转写 · 未调用麦克风或识别服务</small>}
    {ended ? <p role="status">{draft.status === "applied" ? d.revision === draft.selection.documentRevision + 1 ? "修改已应用，记得保存文档" : "该编辑已完成，当前文档又有后续变更" : "编辑已取消，原文字保留"}</p> : <>
      <div className="wb-document-editor-scroll"><label>修改要求<textarea aria-label="选区修改草稿" value={e.text} disabled={e.busy || e.hasPending} onChange={ev => e.update(ev.target.value)} placeholder="改为：新的标题 / 改成蓝色 / 向右移动 40" /></label>
      {draft.source === "voice-demo" && <button disabled={e.busy || e.hasPending} onClick={() => e.update("改成蓝色")}>填入演示转写：改成蓝色</button>}
      {unavailable && <p role="status">{unavailable}</p>}
      {e.blocked && !e.hasPending && <button disabled={!r.connected} onClick={e.recover}>恢复原选区草稿</button>}
      {proposal && <ProposalPreview page={page} proposal={proposal} />}
      {onRebind && <button disabled={e.busy || e.hasPending || !d.selection || !!unavailable && d.selection.documentRevision !== d.revision} onClick={() => onRebind(e.text)}>按当前选区重新锁定并保留文字</button>}
      </div>
      <div className="wb-document-confirm">
        <button disabled={e.busy} onClick={cancel}>取消修改</button>
        <button className="wb-green" disabled={e.busy || !!unavailable || (!e.hasPending && (e.blocked || !e.text.trim()))} onClick={() => e.perform((e.pendingType as "wb-doc-preview" | "wb-doc-apply" | undefined) || (proposal ? "wb-doc-apply" : "wb-doc-preview"), proposal ? { proposalId: proposal.id } : {})}>{e.busy ? "等待回执…" : e.hasPending ? "核对并重试原操作" : proposal ? "确认应用修改" : "预览修改"}</button>
      </div>
    </>}
    {e.error && <p role="alert">{e.error}</p>}
  </section>;
}
export function ProposalPreview({ page, proposal }: { page: WbPage; proposal: WbProposal }) {
  const after = { ...page, objects: page.objects.map(o => proposal.patches.find(p => p.objectId === o.id)?.after || o) };
  return <div className="wb-proposal-preview" aria-label="修改前后预览"><figure><figcaption>修改前</figcaption><WorkBuddyCanvas page={page} /></figure><figure><figcaption>修改后 · 尚未应用</figcaption><WorkBuddyCanvas page={after} /></figure>
    <ul>{proposal.patches.map(p => <li key={p.objectId}>{p.before.role}：{p.before.text !== p.after.text ? `${p.before.text} → ${p.after.text}` : p.before.color !== p.after.color ? `颜色 ${p.before.color} → ${p.after.color}` : p.before.fontSize !== p.after.fontSize ? `字号 ${p.before.fontSize} → ${p.after.fontSize}` : `位置 (${p.before.x}, ${p.before.y}) → (${p.after.x}, ${p.after.y})`}</li>)}</ul>
  </div>;
}
