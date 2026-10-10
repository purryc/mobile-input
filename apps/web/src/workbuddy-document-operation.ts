import { command, role, uid } from "./runtime";
/** A lost acknowledgement retries the original action, even after the view remounts. */
export async function documentOperation(type: string, value: Record<string, unknown>) {
  const key = `mobile-input:wb-document-operation:${role}:${type}:${value.fileId || value.taskId || value.kind || "window"}`;
  let pending: Record<string, unknown> | null = null;
  try { pending = JSON.parse(localStorage.getItem(key) || "null"); } catch {}
  pending ||= { ...value, operationId: uid() };
  try { localStorage.setItem(key, JSON.stringify(pending)); } catch { return { id: "", ok: false, error: "操作恢复记录保存失败，请释放浏览器存储空间后重试", revision: 0 }; }
  const ack = await command(type, pending);
  if (ack.ok || !/连接|回执/.test(ack.error || "")) localStorage.removeItem(key);
  return ack;
}
