# WorkBuddy accepted request generation repair — 2026-11-03

## Observed on devices

Phone first showed the accepted task running with 理解布局草图. Tablet progressed to 生成幻灯片, then failed with 请为草图明确目标页名（当前：全文）. This is a local post-generation guard, not evidence of a missing phone command or an API-key failure. Evidence preserved in ignored artifacts/deck-send-repair/; no duplicate Send issued.

## Correction

Generic sketch scopes (全文/整份/未指定) are valid contextual layout references. Gemini receives interpretation plus the user's full prompt and chooses suitable pages; no deterministic override to every slide. Explicit named-page sketch bindings still validate scope and registered layouts. Existing failure/shape/photo checks stay intact.

The phone 等待平板确认 footer is removed per user request. Send remains one action, with its existing disabled state until attachment verification and atomic submission finish. No extra confirmation, no autosend on adoption/reconnect.

Maintenance build flag --preserve-demo requires matching existing build generations and preserves current task/assets while producing new package hashes and builtAt. Default build reset behavior is unchanged. Both roles use the same snapshot; no key/pairing/uninstall/reset operation.

## Validation

211 core tests passed; TypeScript and production Web build passed. Added generic-scope generation and explicit-page isolation tests. Native mock browser happy path now uses an unscoped sketch and checks the generated model layout rather than forcing the layout-analysis result. Physical generation retry is recorded below independently from mocks.

## Installation and retry

Both roles installed and launched successfully; maintenance generation retained as 1793741702534, new build timestamp 1793742483348. Tablet startup preserved the original failed 11-minute task and its stored sketch. Clicked its existing 重新生成 once; did not create or submit another task.
- tablet SHA-256 `7ce19eca2bc2f91f187c694f91cefdafac69afda76db3d98fb0abe3bc0505e16`.
- phone SHA-256 `dc14e2ea87562093eb6b278f726b41e976a366d5e073f70ffc6e35d10560c640`.
Browser verification: six inline tests passed; four native-mock tests passed after updating the assertion to expect the model-selected layout for an unscoped sketch.

## Physical result

The existing task completed through tablet native Gemini after one explicit retry. Tablet displayed 已完成 and the saved artifact 华为 MateBook Fold 非凡大师产品介绍.html. Opened it in the existing editor: six pages, speaker notes, gray background and black/red text accents visible. UI execution duration displayed 38 seconds. Phone remained distributed-connected and mirrored generation state. Evidence: tablet-retry-result.json/.png, tablet-generated-open.json/.png, phone-generated-ready.json/.png.

No repeated Send, no new task, no reset, no credential provisioning. This proves the preserved failed request can generate a real saved deck after the scope fix. It does not newly verify a fresh phone upload, physical USB-unplugged playback, or all generated factual claims/layout fidelity. Native mock tests separately cover a fresh phone send with local materials and generic sketch.
