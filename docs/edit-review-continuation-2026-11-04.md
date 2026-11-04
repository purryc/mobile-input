# Codex Edit result continuation · 2026-11-04

## Implemented

The shared phone Agent scene now displays actual inline-edit proposals with before/after text and scoped Edit, Reject and Accept controls. No proposal is synthesized from chat prose. The native adapter recognizes the observed AX deletion group, insertion group and three-button toolbar under the document editor.

Every action includes proposal/action UUIDs and existing connection/window/editor ownership. Native execution re-reads the proposal, its document and content fingerprint before an observed-control hit-tested click. Stale proposals reject execution. Unknown outcomes do not retry. Only explicit user taps accept/reject; opening, reconnecting and dictation completion do not decide.

The observed result-card Edit behaves differently from selection-menu Edit: it removes the proposal and returns to direct editing of the original document, rather than opening another AI instruction prompt. The phone follows that actual editor with a separate owner, no Agent Send action and no prompt widgets. Native text updates replace only the changed UTF-16 span after verifying focus/selection, preserving surrounding rich content. Never select-all and paste an artifact. Normal task drafts/materials stay separate.

## Evidence and limits

- Real Codex AX: observed semantic deletion/insertion, actual Edit/Reject/Accept controls and their enabled states.
- Real Codex Edit: keyboard activation produced no transition; the observed-button hit-test click opened direct document editing. No text was entered. This operation withdrew the visible suggestion according to Codex's own behavior; Accept and Reject were not clicked.
- Browser: 9 tests passed across 390×700 and 390×844, keyboard/trackpad layouts, explicit accept/reject/edit dispatch, no auto-submit, correct document target and preservation of the main prompt. Existing Agent/task/caret-adjacent regressions remained green.
- Mac protocol/native simulations: 32 tests passed, including review UUID validation and minimal document patching with Chinese, emoji, newlines, insertion and deletion.
- TypeScript, Swift and Web/HAP build outcomes are recorded in ignored `artifacts/edit-review/`.
- Pending real acceptance: user clicks Accept/Reject on a newly generated proposal; phone dictation into the resulting direct document editor; server/model-generated transition into a new proposal. Automated tests do not prove these real operations.
- WorkBuddy has no observed matching native review selector in this revision. The presentation component is reusable; its adapter remains pending, not advertised as connected.

## Source changes

- `scripts/mac-bridge/agent.swift`: proposal readback, strict review handles, observed-control activation, result readback and direct-document editing scope.
- `scripts/mac-bridge/protocol.mjs`: `agent-review` command validation.
- `apps/web/src/agent-edit-review.tsx` / `.css`: reusable before/after card and actual actions.
- `apps/web/src/mac-link.ts`: proposal state types.
- `apps/web/src/phone-agent-editor.tsx`: review dispatch, separate document owner, no Agent submission/parameters in direct document mode.
- `apps/web/src/ui-labels.json`: interface labels only; proposal text is not translated.
- `tests/agent-edit-review.spec.ts`, `scripts/mac-bridge/generic-agent.test.mjs`: browser/protocol/native patch regression.

## Canonical PRD

Updated the existing Agent feature card: https://app.notion.com/p/402194db24c38158a6e0e1d7b6ab1a47. Project rules distinguish proposal instruction, proposal review and direct document editing; no Figma edits or local Design mirror.

## Maintenance installation

Preserve demo generation, native credentials, pairing, drafts and material ownership. Phone/Mac only; no tablet reinstall, app uninstall, data reset, Git push or actual model submission. Package hash and installation receipt are recorded below after completion.

- Phone: SUP-AL90, `com.hmilab.mobileinput.phone` 1.4.0; HDC upgrade and EntryAbility start both returned success.
- Signed HAP: `artifacts/hap/phone/entry-default-signed.hap`; SHA-256 `a9b7e7aab3487bc8c706b70c272d1347506657a657de2411370e12735bdabf74`.
- Preserved generation `1793741702534`; build timestamp `1793832998366`. No generation reset or uninstall.
- Mac companion reinstalled/restarted successfully; local connection page returned HTTP 200 and control port 39872 is listening.
- Installed-phone screenshot confirms Codex, the actual task strip and USB connection. At capture no verified editable target or review was active; this is installation/connection evidence only, not end-to-end review acceptance.
- TypeScript/Swift compilation, production Web and signed phone build passed. Existing bundle-size and ArkTS warnings remain; no build failure.
- Private receipts/screenshots/logs remain ignored in `artifacts/edit-review/`. Real Accept/Reject and subsequent phone document dictation remain user-validation items.
