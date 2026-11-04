# Settings, persistent WorkBuddy input, polish and image selection

Date: 2026-11-04. Maintenance release 1.4.0; identify this release by build timestamp, preserved generation and package hashes, not the version label alone.

## Changes

- Shared settings gear with connection status and Chinese/English UI labels. Demo language follows tablet authority; Mac control changes only the phone UI. Authored text, task names, materials and generated content remain unchanged.
- WorkBuddy retains its task prompt in new, conversation, completed and artifact preview/edit scenes. File/page/selection/version context is separate from task text and frozen on explicit Send. Dictation never overwrites artifact content. Fullscreen presentation retains dedicated controls. Completed status appears only in the phone task strip.
- Tablet acceptance produces one request-scoped 180 ms send animation and running/stop state. Rejected transfers and reconnects do not replay acceptance.
- Prompt polish offers up to two useful actions: organize structure and shorten wording. Minimal parameter anchors protect editable values/material identities while allowing prose changes. Results support target/version checks, undo, busy-state reset and honest unchanged feedback.
- Bilibili uses its pink theme and bottom safe area without changing shared InputDock geometry.
- Generic Image selection supports image/photo/local-image/product-image/camera phrases while excluding negations, charts and drawing requests. Legacy parameter IDs remain compatible.
- Empty image widget is 118 px with header/close and Choose images / Take photo only. With images it expands to 230 px with previews and a confirmation check. Removing the last image restores the compact state. Picker results remain original-task previews until confirmation; confirmed materials stay phone-local until explicit Send. The inline image chip remains actionable after adoption.

## Implementation and design references

Core changes: `workbuddy-prompt.ts`, `workbuddy-deck.ts`, `web-deck-generation.ts`, `polish-actions.ts`, `polish-parameters.ts`, `live-workbuddy.ts`, `model.ts`.

Shared Web changes: `i18n.ts`, `ui-labels.json`, `connection-access.tsx`, `workbuddy-input.ts`, `web-deck-composer.tsx`, `phone-workbuddy-object.tsx`, `use-phone-editing.ts`, `agent-input-view.tsx`, `phone-live-workbuddy.tsx/.css`, `sentence-composer.tsx`, Bilibili theme/layout and explicit UI translations across controllers.

Design provenance is recorded in `reference/workbuddy-widget-assets.json` and `samples/adaptive-component-registry.json`. References: [empty widget](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=1646-11696), [populated widget](https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=2164-58664). The requested generic title overrides the older design label. Reused local icons; no design sample photos or Figma mutations.

## Validation

- Typecheck passed; core tests 220/220 passed.
- Controller recovery, live WorkBuddy, settings/persistent prompt, native-deck mocks and widget fidelity: 18/18 browser tests passed at that test revision.
- Subsequent Bilibili, settings (including added English reload coverage) and trackpad regression: 11/11 passed. Suites overlap; these are not 29 unique tests.
- Continuous speech, Mac auto-connect and FC browser regressions passed separately. Browser proof is not physical-device proof.
- Production Web build and paired signed ArkTS build passed; existing large-chunk warning remains. Whitespace diff check passed.
- Viewports 390×844 and 390×700, collapsed/keyboard/trackpad layouts, theme, empty/populated images, English labels, context binding, mocked seven-parameter polish, undo and unchanged results covered.

Reproduction commands and the detailed coverage table are in [the Chinese record](settings-workbuddy-polish-2026-11-04-zh.md). Early selector/English ambiguity and a missing UI space were fixed before the final relevant passing runs.

## Installation and actual-device results

Both HAPs use build timestamp `1793810733947`, preserved generation `1793741702534`, version 1.4.0. Upgrade and launch succeeded for SUP-AL90 phone and MRDI-W10 tablet. No uninstall/reset; pairing, native secrets and real Mac records retained.

- Phone `com.hmilab.mobileinput.phone`: SHA-256 `b8fd555fdc1ef8c0534865ab1e287a033252a1130f71bb53ecb9c9d7964244cb`.
- Tablet `com.hmilab.mobileinput.tablet`: SHA-256 `c1f1c86080eed6bd4b98b95f584df9d3013ca2952a657a062ee6b1165ce1a5db`.

Observed distributed connection, two-device language synchronization, task strip, compact image widget and persistent task prompt while an existing fictional artifact was open. An actual phone Gemini polish call changed fictional prose, retained its image chip, and Undo restored the original. No task was submitted.

User confirmed the image workflow: preview/check first, insert into Composer only after confirmation, and compact two-button state after deleting the last image. This is user-reported acceptance; it does not establish separate instrumented coverage of both gallery and camera branches.

Private evidence: ignored `artifacts/settings-update/release.json`, `device/image-empty.jpeg`, `device/artifact-prompt.jpeg`, viewport screenshots and logs. HAPs, device state and screenshots are excluded from GitHub.

## Limits and remaining verification

No new tablet Gemini generation, physical send animation, unplug test, LAN device test, full seven-parameter live polish, real Mac submission/document change or comprehensive physical speech/clipboard/rotation/USB/Command-Tab regression was performed in this revision. Native mocks do not replace these checks.

Device checks encountered connection recovery and one unexpected Mario switch; reconnection allowed the reported checks to finish, but the cause was not established. Sustained transport reliability remains unverified. Specialized approval/material-request flows and some legacy drafts retain existing routes; unmapped external/native errors may remain Chinese.

## Source backup

Initial source backup: `purryc/mobile-input`, commit `63ecc4ffff3413c2fb00cd9257274e463fba0910`. This document is included in the final source update; final remote verification is recorded privately. No credentials, signing inputs, private media, device state, archives or HAP binaries are published.
