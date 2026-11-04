# Selection input, trackpad and send recovery · 2026-11-04

## Behavior

- Removed the persistent unknown-send warning and manual clear button. Unknown requests are never replayed. Their original text, parameters and material bytes remain owner-scoped in IndexedDB. When authoritative composer content changes, the phone advances to that content automatically; a subsequent user edit is distinct from the dispatched request. A still-identical uncertain payload cannot be submitted again.
- Shared InputDock recognizes tap, double tap, and tap followed by a second held/moving contact. The latter sends ordered down → move → up. Lift, cancellation, extra contacts, background, target changes and connection loss release buttons. Explicit left-button dragging remains supported.
- Mac pointer coordinates use the full current display (largest overlap with the controlled window), including its system Dock. Text/write permissions remain limited to registered application/editor targets. No arbitrary application text access is added.
- Added a shared selection action toolbar. The Codex adapter reads the observed two-button Add to chat / Edit toolbar only when a real non-prompt selected range exists. Commands bind the current editor, source element, selected range/content and menu identity; vanished/stale menus reject execution.
- Codex Edit uses the observed `Edit instruction` AXTextField with the sibling `Submit edit instruction` button. Its owner is separate from the conversation prompt. Voice uses the shared caret-aware dictation path; no direct artifact overwrite, automatic edit submission or model execution. Main prompt owner keys are unchanged to preserve existing stored materials.
- Menu activation success requires reading back the actual focused editor. Until action selection, the phone does not write through the source selection into an unrelated main prompt.
- WorkBuddy uses the shared phone components, but this revision does not invent native selection-menu selectors. WorkBuddy was not running during the passive check; its actual contextual menu still needs observation and adapter verification.

## Canonical rules

Updated the existing Notion Agent PRD feature card, Design G08/G09, and interaction chart; no local Design mirror was created:

- https://app.notion.com/p/402194db24c38158a6e0e1d7b6ab1a47
- https://app.notion.com/p/3f9194db24c38165996cf89b22e7d69e
- https://app.notion.com/p/402194db24c3812cad26faedb3cc98a5

## Validation and evidence

Ignored evidence directory: `artifacts/selection-input/`. AX snapshots and screenshots may contain private user interface content and must not be published.

- TypeScript and native Swift compilation passed.
- Core: 11 tests passed (tap/drag/cancel, owner isolation, caret mapping).
- Mac protocol/native simulations: 30 tests passed, including selection command identity validation.
- Browser: 9 Agent/caret/menu/drag tests passed plus 3 shared dock regression tests (12 distinct cases). Native speech is mocked in browser tests; these do not prove actual microphone recognition.
- Real Mac: observed Codex selection controls and source range. Opened Edit without typing, saving or submitting; read back its focused, empty, editable instruction field. No real task/Steer/model execution.
- Pending physical acceptance: phone touch drag feel, full-screen Dock targeting, speech into actual Add to chat/Edit editors; WorkBuddy native selection menu.

## Files

- `packages/core/trackpad-tap.ts` and tests: second-contact drag state machine.
- `apps/web/src/input-dock.tsx`: ordered gesture/button dispatch and release.
- `apps/web/src/phone-agent-editor.tsx`: automatic send recovery, selection actions, isolated instruction editor.
- `packages/core/agent-controller.ts`: optional editor context ownership, existing prompt keys retained.
- `apps/web/src/mac-link.ts`, `apps/web/src/phone-mac.css`: shared action/context model and layout.
- `scripts/mac-bridge/agent.swift`, `protocol.mjs`: full-display pointer, observed Codex toolbar/edit adapter, scoped action readback.
- `tests/mac-selection-trackpad.spec.ts`, `tests/generic-agent.spec.ts`, core/Mac tests: regression coverage.

## Release

Phone and Mac companion maintenance upgrade uses the existing demo generation. No uninstall, storage reset, tablet reinstall, Git push, or real task submission is needed. Installation receipt and package hash are recorded after installation below.

Phone installation/start succeeded; Mac companion restarted and local connection page returned HTTP 200. Tablet was not reinstalled.

- Package SHA-256: `5473eceb42b95c46ed52255bf3116f65b31a1a0687c4db51c44d37f968a7758b`
- Preserved generation: `1793741702534`
- Build timestamp: `1793831377549`
- Receipt: `artifacts/selection-input/installation.json`

Physical phone screenshot confirmed USB connection, Codex task strip and the real Edit instruction editor. A final localized Submit edit label/layout correction was built and installed; the selection browser test passed again.
