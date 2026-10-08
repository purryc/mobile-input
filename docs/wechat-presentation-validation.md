# WeChat and WPS presentation revision

## Delivered behavior
- WeChat launches into 陈总. Scene v2 backs up the previous boss chat and draft before one-time reset; source meeting date is generated in China time and persists. Other conversations and business data survive the migration.
- Photographic avatars are keyed to identities; the family icon uses member portraits. Provenance: `reference/wechat-avatars.json`. The source Hover project was read and copied, never edited.
- Composer matches the inspected tablet WeChat narrow bar. It pulses twice for 240 ms, followed by a 700 ms message scan. Phone initially shows two replies, then three actions stagger by 110 ms. Source context and editing target are independent.
- Voice button stays fixed across starting, recording, completion, cancellation and errors. Polish chips live in a reserved editor footer. Recognition remains the existing real native speech pipeline; cancel restores the pre-recording draft. Quick replies preserve independent drafts.
- Calendar, route and Feishu reuse local Hover destinations, with new dated sales fields and a consistent sales summary. They never write to real third-party services.
- WPS launches the six-slide sales presentation. Re-entry resumes its slide; Back exits show, editor, home, desktop. Timer excludes inactive presentation and tablet-background intervals.
- Phone presentation uses Figma section 109:5269 / frames 5:9875, 5:10201, 5:10337. Original exported SVG assets and Noto Sans SC fonts are bundled locally; provenance and hashes: `reference/presentation-figma.json`. Phone native safe-area adjustment preserves the control geometry below system bars.
- Native ROTATION_VECTOR samples drive calibrated normalized laser/ink coordinates, at most 30 updates/s. One update is in flight, with only the latest position retained. Release, page/app changes, background and a 700 ms watchdog end pointer ownership. Ink belongs to a document and page; undo/clear are page-local.

## Interfaces and persistence
- Protocol version 3; `chat.context` stores conversation/message, source revision, epoch and read trigger independently from `target`. Quick replies carry the source message and context epoch. Repeated composer focus preserves target revision.
- `chat.sceneVersion` and `chat.meeting` persist source fixture identity and date. Tablet backup key: `mobile-input:backup:boss-scene-v1`. Phone backup key: `mobile-input:phone-draft:wx-boss:backup-v1`.
- `presentation` stores session, active elapsed duration, last sample slide, laser/ink style, active gesture/sequence, per-document/page ink and live stroke.
- Commands: `present-mode`, `present-style`, `present-start`, `present-point`, `present-stop`, `present-undo`, `present-clear`, and tablet `presentation-active`. Point commands validate session, slide, gesture and monotonic sequence; command IDs deduplicate delivery.
- Native bridge: `presentationMotion(id, 'start' | 'stop' | 'calibrate')`, events `native-motion`. Errors are reported explicitly; no fake motion fallback. Existing native clipboard/speech and TCP pairing stay intact.

## Verification evidence
- Typecheck and production build pass; 29 core tests pass. Core tests cover migrations, failed backup, stable dates, draft preservation, repeated focus, stale source rejection, session/page-scoped ink, out-of-order points, release and foreground timing.
- Seven browser E2E scenarios cover sales workflow, WeChat, FC controls, reconnect, input tools, mock destinations, Figma presentation states and pointer lifecycle. Voice and motion events in the added browser tests are explicit test adapters, not real speech or sensor evidence.
- Browser captures: `artifacts/visual-qa/wechat-revision-phone.png`, `wechat-revision-tablet.png`, `wechat-voice-polish-adapter.png`, `presentation-figma-phone.png`, `presentation-ink-phone.png`, `presentation-ink-adapter.png`.
- Both signed HAPs built successfully and installed on MRDI-W10 (tablet) and SUP-AL90 (phone). Device captures and layout dumps: `artifacts/device-wechat-presentation/`.
- Final rebuild was reinstalled on both devices and paired again. Reviewed `final-phone-wps.png` for system-bar clearance, `final-phone-wechat.png` for initial reply suggestions, and `final-phone-wechat-actions.png` / `final-tablet-wechat.png` for the three recommendations and composer-only outline. Existing sent replies survived reinstallation as intended.
- Observed direct native TCP session: tablet 172.20.10.2:39871 to phone 172.20.10.3, ESTABLISHED. This demonstrates native LAN pairing while USB remains attached; it does not by itself prove unplugged operation or physical pointer tracking.
- Real-device automated hold produced the laser dot after actual native sensor samples; release removed it (held capture: 243 red pixels; released capture: 0). No simulated sensor events were used on devices.
- Human physical pointer tracking and USB-unplugged checks: pending user observation. Current real speech pipeline was previously user-confirmed; browser regression checks in this revision do not replace a new spoken-input device check.

## Build and delivery
Run `npm run check`, `npm test`, `npm run build`, `npm run build:hap`, then `npm run package`. Production preview is `npx vite preview --host 127.0.0.1 --port 5188`; E2E runs `npx playwright test` and its own isolated bridge on 5191.

Signed outputs are under `artifacts/hap/{tablet,phone}/entry-default-signed.hap`. Delivery ZIPs and checksums are generated under `artifacts/delivery/`. Signing credentials remain outside source. No Git push is performed.
