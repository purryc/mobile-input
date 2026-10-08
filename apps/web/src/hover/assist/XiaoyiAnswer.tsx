import { useState } from "react";
import { Sheet } from "../app/Sheet";
import type { Action, IntentResult } from "./types";

/** Xiaoyi Light ConversationDemo/UserMessage/AssistantMessage, in our half sheet.
 * Source: Reference/Huawei Reference/Xiaoyi Design System/src/components.jsx.
 * Follow-up input reuses the reference capsule; the provider is a local fixture.
 */
export default function XiaoyiAnswer({
  result,
  question,
  onClose,
  onAction,
  onFollowUp,
}: {
  result: IntentResult | null;
  question: string;
  onClose: () => void;
  onAction?: (action: Action) => void;
  onFollowUp: (question: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const canSubmit = !!result && /[\p{L}\p{N}]/u.test(draft);
  const text = result
    ? [
        result.text,
        result.missing.length ? `待补充：${result.missing.join("、")}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";
  return (
    <Sheet
      title="小艺"
      className="xiaoyi-qa"
      onClose={onClose}
      showCloseButton={false}
    >
      <div
        className="xy-conversation-scroll"
        data-design-system="xiaoyi-light-conversation"
        data-state={result ? "answer" : "processing"}
      >
        <div className="xy-user-message">{question}</div>
        {result ? (
          <div className="xy-assistant-message" aria-live="polite">
            <div className="xy-answer-text">{text}</div>
            {result.actions.length > 0 && (
              <div className="xy-answer-actions">
                {result.actions.map((action) => (
                  <button key={action.id} onClick={() => onAction?.(action)}>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="xy-thinking" role="status">
            <span />
            正在思考…
          </div>
        )}
      </div>
      <form
        className="xy-followup"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          onFollowUp(draft.trim());
          setDraft("");
        }}
      >
        <img src="/assets/figma/imgFrame.svg" alt="" />
        <input
          aria-label="继续问小艺"
          placeholder="继续问小艺"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!result}
        />
        <button type="submit" aria-label="发送" disabled={!canSubmit}>
          <img src="/assets/figma/imgFrame1.svg" alt="" />
        </button>
      </form>
    </Sheet>
  );
}
