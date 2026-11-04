# Input Agent Engineering Handoff (English)

Date: 2026-11-03, America/Toronto. This is a snapshot of the current working tree, including uncommitted changes, not a published GitHub release. Base commit: `4179e0ab78190afc6a9932088adf27eacb5b4730`. The delivery manifest and per-file SHA-256 hashes identify the actual snapshot.

## 1. Reading order

Read the newest entries in root `AGENTS.md`, then this document and its Chinese counterpart. Older README/acceptance notes describing immediate suggested-reply sending, a decorative phone home screen, or transfer-on-adoption have been superseded. Historical evidence is not current acceptance. Notion remains the behavioral source of truth; Figma defines visuals. Do not create another local design-rule mirror.

- Design: https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=2316-110521
- Rules: https://app.notion.com/p/3f9194db24c38165996cf89b22e7d69e
- PRD: https://app.notion.com/p/3f9194db24c381bf8b76c804062303e3
- Current implementation records: `docs/workbuddy-widget-fidelity-2026-11-03.md`, `docs/workbuddy-inline-input-2026-11-03.md`, `docs/workbuddy-send-repair-2026-11-03.md`.

## 2. Product boundaries and runtime architecture

The phone selects one destination: tablet demo, real Mac applications, or real Harmony applications via a Mac bridge. The same application shares its controller layout, Composer, parameter widgets, contextual polish, and InputDock; adapters supply authoritative state and capabilities. Real Harmony cross-application control is not connected and must not be simulated using demo data.

The tablet demo has nine entries: Mail, WPS, WeChat, Doubao, Notes, GoPaint, Mario, WorkBuddy, and Bilibili. These are interactive replicas, not control of their native counterparts. Hover third-party pages, mail sending, and approval flows are local demonstrations. Real Mac control is a separate branch with Codex, WorkBuddy, and WPS adapters; support for other applications requires independent validation.

The packaged tablet demo does not require a PC at runtime. The phone sends text/materials over paired LAN or Harmony distributed communication, and the tablet owns final state. Tablet native code calls Gemini for web-slide generation, sketch understanding, and AI edits; internet access to Gemini is required. Saved editing/playback uses local assets. Phone Gemini text polish is a separate integration. Mac control requires the Mac companion. Browser development uses a computer-hosted bridge and cannot establish PC-independent device acceptance.

## 3. Source map

| Path | Responsibility |
|---|---|
| `packages/core/` | Shared state, commands, deduplication, ownership, business/protocol tests |
| `packages/core/live-workbuddy.ts` | Shared demo/Mac grammar for five input types and target text projection |
| `packages/core/web-deck-generation.ts` | Gemini contracts, sketch interpretation, deck/page validation |
| `packages/core/polish-parameters.ts` | Protected parameter clauses and polish-result validation |
| `apps/web/src/phone-controller-frame.tsx` | Destination-neutral identity header and task strip |
| `apps/web/src/agent-input-view.tsx`, `agent-widget-color.tsx` | Shared Composer, photo, color, duration, and sketch controls |
| `apps/web/src/web-deck-composer.tsx` | Demo task input, local adoption, explicit submission |
| `apps/web/src/phone-live-workbuddy.tsx` | Real Mac WorkBuddy input adapter |
| `apps/web/src/web-deck-staging.ts` | Original-task phone-local attachments and frozen submission state |
| `apps/web/src/web-deck-device.ts` | IndexedDB, chunked material transport, hash verification, owner queues |
| `apps/web/src/runtime.ts` | Authority snapshots, receipts, synchronization, connection recovery |
| `apps/web/src/web-deck-native.ts`, `web-deck-runner.ts` | Native model bridge and tablet execution |
| `apps/harmony/shared/` | Networking, distributed transport, speech, pickers, Asset Store, Gemini |
| `scripts/mac-bridge/` | Mac Accessibility/pointer/task adapters, authentication, USB-first recovery |
| `reference/` | Reviewed asset provenance; original private recordings are excluded |

## 4. Current interaction contract

- After connection and authority synchronization, the phone renders the relevant controller directly, without a decorative home screen. No valid text target means no blind write.
- Unsent WorkBuddy drafts remain on the centered-composer home page. Only accepted explicit submission opens the conversation with its bottom composer. Keep the task strip visible and retain manually opened keyboard/trackpad mode across task changes.
- Five fixed parameters: independently scoped colors, 1–60 minute duration, reference files, photos, and layout. Do not restore Laya or open widgets automatically on recognition.
- Layout-related Chinese phrases suggest the drawing entry. The observed ASR output `主题测试，红色` is recognized as a theme-color parameter without globally rewriting prose. Negation, corrections, manual priority, and original source offsets remain protected.
- The photo widget provides gallery, camera, previews, deletion, and confirmation. The 328×192 drawing surface has pen, eraser, undo, and clear below it. The 288 px color panel includes role-specific presets, tonal ramp, hue, HEX, and confirmation. See `reference/workbuddy-widget-assets.json` for exported assets.
- Documents/photos/adopted sketches appear above prose inside the phone Composer. Adoption, backgrounding, task changes, and reconnect do not send or immediately transfer attachments. Explicit Send freezes the request, transfers and verifies bytes, then submits atomically. Failures retain input; unknown outcomes are reconciled without replay.
- Ordinary text still synchronizes live. The phone displays tablet-authoritative execution state and Stop; presentation mode provides notes, previous/next, and exit.
- The “等待平板确认” footer has been removed. Busy-state protection remains; no extra confirmation step is introduced.
- A sketch without a named page is valid Gemini layout context. It no longer rejects a completed result because scope is 全文, nor is its layout forcibly applied to every slide. Explicit page bindings remain validated.
- Continuous speech: hold longer than 300 ms to start and release to stop; tap to start and press again to stop. Sentence/silence boundaries do not end the user's session. Capture open/close each emits one light haptic; errors use a bottom 3-second toast. Stopping never sends or polishes.
- Contextual polish invokes Gemini only on an explicit action. Its 48 px row sits outside Composer with 8 px above and below. Preserve parameters, materials, target identity/version, undo, and rejection of late results.

Chinese demo script:

> 我想做一个十分钟的演示文稿，介绍今年的产品。背景用灰色，字体用黑色，主题色用红色。请参考我的文件，添加一些产品照片。布局我画一下，左边是今年产品总览，右边是分产品的介绍。

Meaning: Create a ten-minute product presentation with a gray background, black text, red theme, reference files/photos, and a hand-drawn layout with an annual overview on the left and product details on the right. Recognition is currently designed for the Chinese wording; this translation is explanatory.

Materials: PDF/TXT/Markdown and PNG/JPEG/WebP, up to 8 MB each, 12 items, 24 MB total. DOCX/PPTX/XLSX parsing is not implemented. Outputs are editable web slides, not full Office-format compatibility.

## 5. Run, test, build, and install

Use Node.js 22+ and the dependency lockfile. Browser tests use local Chrome. HAP builds additionally require DevEco Studio, the appropriate SDK/JDK, HDC, and separate signing configuration.

```sh
npm ci
npm run bridge
# In another terminal:
npm run dev
```

Tablet: `http://localhost:5188/`; phone: `http://localhost:5188/?role=phone`. For browser pairing, select network mode and enter `localhost` plus the tablet code. Automated tests use bridge port 5191; the normal development bridge typically uses 5189.

```sh
npm run check
npm test
npx playwright test tests/inline-parameters.spec.ts tests/live-workbuddy.spec.ts tests/web-deck-native.spec.ts tests/workbuddy-widget-fidelity.spec.ts
npm run build
python3 scripts/build-hap.py tablet phone
```

`dist/` contains Web resources; HAPs are written to `artifacts/hap/{tablet,phone}/`. The script uses `/Applications/DevEco-Studio.app` and `~/.cache/mobile-input-{role}`. On a new development machine, configure signing for each cached project in DevEco. Example profiles contain no credentials; unsigned HAPs cannot be installed as signed apps. Included signed HAPs are debug distribution packages and may not authorize other devices. They are not store releases.

**Data behavior:** normal builds create a new demo generation whose first launch resets demo records under project policy, while preserving native credentials, permissions, pairing, and real Mac data. This repair used `python3 scripts/build-hap.py --preserve-demo tablet phone`, allowed only when both cached projects already have the same valid generation. This explicit maintenance mode preserves an existing task; it is not a first-build option.

```sh
HDC=/Applications/DevEco-Studio.app/Contents/sdk/default/openharmony/toolchains/hdc
"$HDC" list targets
"$HDC" -t TABLET_ID install -r /absolute/path/input-agent-tablet-signed.hap
"$HDC" -t PHONE_ID install -r /absolute/path/input-agent-phone-signed.hap
"$HDC" -t TABLET_ID shell aa start -b com.hmilab.mobileinput.tablet -a EntryAbility
"$HDC" -t PHONE_ID shell aa start -b com.hmilab.mobileinput.phone -a EntryAbility
```

For real Mac control run `npm run mac:bridge` on the controlled Mac. The local connection page is `http://127.0.0.1:39873/`, with control port 39872. Follow `scripts/mac-bridge/AGENTS.md` and grant Accessibility access to the actual helper/host. `node scripts/mac-bridge/install-companion.mjs` installs a user-level persistent service and connection launcher; run it only when that mode is needed. Trusted sessions prefer USB and can fall back to the saved wireless route to the same Mac. Smooth pointer movement does not prove text/file submission.

## 6. Credentials and excluded data

Configure the generation API in tablet connection settings; it is stored in native Asset Store. The phone polish credential is stored separately. Delivery excludes `Google API.md`, API keys, OAuth tokens, signing private keys, pairing trust, real adopted files, device caches, and private recordings. Recipients must supply their own configuration. Never place credentials in Web assets, HAPs, Git, logs, or handoff notes. Packaged tablet generation does not need the Mac `/api/decks` service.

## 7. Evidence and remaining validation

Latest repair: 211 core tests passed; six inline-input browser tests passed and four native-mock browser tests passed. The earlier shared-widget revision checked 390×844 and 390×700 across collapsed/keyboard/trackpad states with 14 related browser tests passing. TypeScript, Web production build, and both signed native builds passed. Counts from separate revisions must not be added together as a single complete regression run.

Installed devices: SUP-AL90 phone and MRDI-W10 tablet, package version 1.4.0. Demo generation `1793741702534`; build timestamp `1793742483348`. Version name alone does not identify the code. Current SHA-256:

- Phone: `dc14e2ea87562093eb6b278f726b41e976a366d5e073f70ffc6e35d10560c640`
- Tablet: `7ce19eca2bc2f91f187c694f91cefdafac69afda76db3d98fb0abe3bc0505e16`

Physical verification: upgrade, launch, distributed reconnection, and retention of the failed task/sketch. One explicit retry of the original request produced and opened a real six-page `华为 MateBook Fold 非凡大师产品介绍.html` deck with speaker notes through tablet Gemini. The UI reported 38 seconds. The original failure was the local “sketch requires a named page” guard, which is now fixed. No duplicate Send or new task was created.

Earlier user acceptance confirmed both continuous-dictation gestures/haptics and USB-unplugged dual-device page control. Those are historical observations. This repair did not rerun full unplugged playback, all nine applications, real Mac control, native camera capture, or a two-minute dictation session. Generated facts and complete layout quality still require human review; model output is not a fact-checking report. Detailed local artifacts remain outside the archive; delivery includes engineering summaries, not private device screenshots.

## 8. Delivery and next steps

The source ZIP contains editable code, lockfile, tests, samples, provenance, and both handoff documents. A separate runtime ZIP contains the matching Web build, two signed HAPs, and release metadata. The manifest identifies deliverables and source files by hash. Both Markdown handoffs are also uploaded individually for easy review.

Start with one fictional-material flow: three scoped colors → duration → file/photo → draw an empty canvas → explicit Send → tablet generation → open/edit → phone notes/page control. Record browser, native mock, physical device, and USB-unplugged acceptance separately. Do not submit real Mac Agent tasks or clear user data without specific authorization. This handoff uploads only to Google Drive TEMP; it does not commit/push Git or change sharing permissions.
