# Mobile Input project rules

## Purpose and design context
- Phone connection access shares each controller’s existing status/application row (WeChat, WPS and FC); do not add a second toolbar or subtract extra controller height. Standby and generic scenes retain a single connection row. WeChat highlight uses Hover-inspired cyan/blue/lilac pearlescent edges and a translucent glass sweep; preserve the 480 ms pulse / 2000 ms read protocol and readable text.
- Connection access is one persistent icon button at the top-right status area on both devices, including standby, presentation and game scenes. Pairing and live connection state share one panel; keep application switching separate. Opening the panel preserves drafts and releases active game/motion controls. Use the app status area adjacent to native system bars; never draw a second OS clock or gesture bar.
- Both installed applications and their launcher entries are named `Input Agent`. Keep existing bundle IDs so upgrades preserve data and permissions. The phone standby screen exposes an Input Agent connection/status entry; disconnected WeChat must expose pairing instead of trapping the user on a decorative screenshot.
- Build a local two-device HarmonyOS prototype for a sales professional: tablet is the primary visual/work surface; phone supplies contextual text, voice, tools and presentation controls.
- Desktop scope: one page with Mail, WPS (sales presentation editor at page one; office home remains reachable via Back), WeChat, Doubao, Notes, GoPaint, Mario and WorkBuddy. Preserve source widgets visually; non-demo widgets are decorative, without misleading launch actions. No all-apps launcher or placeholder app entries.
- Visual revision: preserve original application logos, widget appearance and measured layout from the supplied recording; no bottom Dock. Use the linked HarmonyOS PC image only for the desktop/window treatment agreed in the current conversation. Do not claim pixel identity without same-state pixel comparisons.
- `reference/private/frames/` holds private frame extraction and comparison sources; app bundles receive only reviewed non-email assets under `apps/web/public/reference-assets/`. Keep frame timecodes, crop coordinates and hashes in `reference/asset-manifest.json`.
- Match the supplied tablet recording and installed WPS interface. Use restrained, familiar application UI. Phone controls must be immediately understandable.
- Prototype applications are internal replicas, not integrations with real mail, WPS accounts or AI services.

## Directory contract
- `apps/web/`: shared tablet and phone web UI.
- `apps/harmony/`: ArkTS shells and native network/speech integration.
- `packages/core/`: shared business data, state transitions and protocol.
- `scripts/`: reproducible development, packaging and checks.
- `reference/`: local reference index and source provenance; private recordings and captures are ignored.
- `samples/`: generated, editable fictional data exports; canonical seed is `packages/core/model.ts`.
- `docs/`: implementation, design and validation records.
- `artifacts/`: ignored builds, screenshots and test evidence.
- `vendor/`: pinned third-party source with provenance and modifications documented.
- New files use lowercase-kebab-case except platform-required names. Temporary inspections stay outside source; generated outputs may be recreated. Never delete source recordings.

## Privacy and integrity
- Never use recorded email bodies, subjects, senders, recipients, avatars, signatures, attachments or screenshots containing them in the product. All sales content is fictional with example.com addresses.
- No credentials, private signing profiles or passwords in source or Git. Local signing lives outside this project.
- Preserve unrelated work. No automatic Git push. No Spec Kit or OpenSpec initialization.
- UI contains necessary actions and status, not implementation explanations or tutorial copy. Put evidence boundaries in docs.
- Receiving a command is not completion: tablet state and execution acknowledgement are authoritative.
- Keep selected target/version stable during phone drafting. Release held game controls on disconnect/background.
- Preserve editable source and distinguish browser, build, signed-install and device-interaction verification.

## Verification and delivery
- Current implementation scope: WeChat message/composer targets, live per-conversation drafts, immediate suggested replies, functional phone editing tools, and imported Hover service sheets on the phone only. Source Hover project stays unchanged.
- All recommended services, including calendar, use imported Hover half sheets and full-screen mock destinations with local demo records. No native calendar or real third-party write integration.
- The phone app-switch control cycles eight demo entries on the tablet only; idle commit is 1200 ms. WPS launch and app cycling always enter the sales presentation editor at page one; fullscreen starts playback; Back exits presentation, editor, office home, then desktop. All applications expose persistent hierarchical Back.
- Imported Hover code lives in apps/web/src/hover/ with its reviewed assets under public/assets/. Record provenance in reference/; namespace imported styles under .hover-services. Generated captures and private emails must not be copied.
- Use per-conversation/message/action keys for service records, versioned drafts, idempotent sends and local service record recovery. Desktop icons use clean master assets rather than damaged recording crops.
- Phone FC controller follows Figma `ApFLno64NcMoA17MiPFfZh`, section `109:5273`, game frame `5:10639` (844 × 390). Preserve the top-right app-switch control and the existing 1200 ms tablet-only app cycle. Mario requests native landscape; leaving it restores normal phone orientation. Keep controls usable together and release every held key before switching, rotating or leaving.
- Reviewed Figma FC assets live in `apps/web/public/assets/figma/fc/`; provenance goes in `reference/`. Comparison captures and device evidence stay under `artifacts/`.
- Run typecheck, core/protocol tests, production build and relevant browser/device checks.
- Never report a simulated transcript as real speech recognition or a browser test as device proof.
- Document blockers accurately; do not replace failed integrations with success animations.
- Delivery includes Web build, two signed HAPs where signing is available, source and reproducible instructions.

## Source backup
- GitHub source backup uses the public `purryc/mobile-input` repository, as requested on 2026-10-08. Push only when the user explicitly requests backup or synchronization. Check source and Git history for credentials and unreviewed private material before public publication.
- Google Drive source archives go in the existing TEMP folder, named `mobile-input-source-YYYY-MM-DD-<short-commit>.zip`, generated from the same committed Git snapshot.
- Include editable code, reviewed runtime assets, samples, documentation and dependency lockfiles. Exclude raw/private recordings, signing material, installed dependencies, build output, caches and Git history.
- Keep upload receipts and archive checksums under ignored `artifacts/backup/`. Verify the remote commit and cloud archive metadata before reporting completion.

## WeChat and presentation revision
- While connected with an active composer/source, keep a gentle orbiting cyan/lilac light around that target until selection or connection ends. Phone WeChat must fit its default message, both replies, all three “推荐下一步” actions and input controls within the real portrait safe area; reduce redundant labels and decorative gaps, not essential touch targets. Reserve polish/recording space so the voice button never jumps.
- WeChat has no empty conversation level: entry selects Chen immediately and Back returns to desktop. Composer reads the latest actionable incoming message visible in the current conversation; never use an offscreen message as the recommendation target. All four conversations reuse Hover actions and mock destinations, with source-specific fields and no invented missing values.
- Presentation pen state classes must be scoped to the cursor, avoiding global canvas styles. A rejected or ended motion gesture stops its native subscription and outgoing samples; one gesture reports its failure only once. Pointer release events are idempotent.
- WeChat launches into Chen's conversation with four casual messages followed by the sole business message. Back up the prior scene once per version before updating; preserve the existing meeting date, unsent drafts and other conversations. Use identity-owned photographic Hover avatars including self and group members.
- Phone waits on the reviewed screenshot-style home view until the tablet composer is explicitly activated. Message selection only highlights the tablet bubble. Composer activation pulses its border twice (240 ms each), then surrounds and scans the last meaningful incoming message for 2000 ms. A tablet-authoritative completion opens the phone editor: two replies then three actions appear at 110 ms intervals. Cancel pending reads on conversation/app change or disconnect; drafts and reconnect never replay old animations.
- Source context, editing target and phone activation are independent. Voice controls stay fixed; AI润色 chips occupy the reserved editor footer. Runtime action/status copy is Chinese. Captured home imagery excludes baked system bars; raw screenshots stay private, reviewed assets and provenance are bundled.
- FC is centered in the usable native landscape area, with no synthetic gesture bar. Mario fills the tablet viewport with an aspect-preserving game canvas and black letterboxing; only a persistent 48 px Back overlay remains outside the game. Keep app cycling and held-key release behavior intact.
- WPS phone follows latest Figma 109:5269 / 5:9875 / 5:10065: 536 px manual notes (360 px in ink), ink navigation at y512; two 168 px square panels at y576 (pen settings left, hold-to-draw right), five concentric color controls, 1–12 px slider, undo and clear. Hold state uses deep red with a white pen and unchanged label; four fixed tools stay y756. Native system bars replace Figma's decorative home indicator. Every WPS/app-switch entry opens editor page one with timer reset; only explicit fullscreen starts playback. Phone controller is available in editor mode. Back exits playback, editor, WPS home, then desktop.
- Six sales slides have substantial, conversational, paragraph-based speaker notes shown only on the phone. Upgrade only known default notes, back up the prior notes once and preserve user-written notes, slide content and files. Refreshing quote data must not replace long speaker notes with the old one-line prompts.
- Pen mode tracks a visible pen hover cursor before touch. Press begins an independent stroke at that position; release finishes the stroke while preserving hover and calibration. Slide, app, background and disconnect stop both hover and ink; restarting requires fresh sensor events. Native rotation maps the phone's top-edge ray with the screen facing up, phone pointing at tablet; clockwise yaw moves right, raising the top moves up. Use 1.30× angular gain compared with the original 60-degree full span. Do not derive translational position from IMU. Laser and ink share calibration; normal drawing presses never recenter. Keep 30 Hz limit, ordered gesture/ink events and per-page ink.
- Keep native safe areas without synthetic system bars. Notes remain phone-only, real captions preserve ordered events and explicit failures. No sample transcript fallbacks. Fullscreen exit keeps controller available; presentation time excludes editor/inactive intervals.
- All new service pages remain local Hover mocks. No live calendar, navigation, booking or AI integration. Preserve existing FC implementation and unrelated edits.

## WorkBuddy replica
- WorkBuddy uses the supplied private `Work Buddy.mov` (5.7.7) as its visual baseline. Official desktop documentation supplements office flows; mobile, mini-program, open platform, development and enterprise products are indexed in IA with evidence boundaries. Do not restore Fold PC support or posture diagnostics.
- WorkBuddy owns independent routes, task drafts, projects, files, experts, skills, connector configurations, automation and settings. Styles are scoped under `.workbuddy` / `.workbuddy-phone`; do not modify Doubao or reuse its shared draft.
- WorkBuddy launch opens New Task. Back closes overlays, preview and details, then returns home and desktop. Phone remains on standby until a tablet editable target is selected. Real native speech and clipboard reuse existing bridges; text/voice/editing synchronizes drafts without sending.
- Task execution is deterministic and local: default executes, plan waits for confirmation, ask creates no files. Unknown requests need an explicit result type. Sales artifacts use canonical products and record their data version; refresh preserves edited text. All connectors, assistants, sharing and mailbox actions are local mocks.
- Foreground automation checks due schedules only while WorkBuddy is active. Do not catch up offline runs. Stop/continue and stale execution epochs are enforced on the tablet; unfinished tasks restore paused and never silently rerun.
- Private recording and frame comparisons stay ignored. Reviewed brand assets have source URLs and hashes in `reference/`; IA, interaction coverage and layered validation records live in `docs/`. Source samples remain editable. No automatic Git push or Drive upload.
