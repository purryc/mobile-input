# Inline recommendation reveal and desktop control restoration · 2026-11-11

final result: passed with documented visual/content gaps

Implemented the approved 1000 ms stability + 400 ms transient loading sequence, directly appended recommendations, contained independently focusable removal, source-based editing, and send isolation. Restored desktop geometry and live Figma 72%/30% material tokens across 14 controls. No deployment, push, native/mobile edits, real task/model or physical-device operations.

All 14 source/development images and five 1:1 comparison sheets were opened and inspected. Exact equality is not asserted: actual capability/file inventories, chosen values, camera/capture states and browser glass compositing differ from design examples. Photo empty state remains 2 px taller; screen capture retains its supported browser workflow and is 4 px taller. Full per-control status, source links and evidence are in [the current audit](artifacts/workbuddy-demo/visual-consistency-2026-11-11/qa/recommendation-report.md); [side-by-side gallery](artifacts/workbuddy-demo/visual-consistency-2026-11-11/qa/recommendation-comparison.html) and [short recording](artifacts/workbuddy-demo/visual-consistency-2026-11-11/after/recommendation-motion.mp4).

Validation: TypeScript and standalone production build passed; 264 core, 3 service and 65 browser cases passed, followed by 19 affected cases after final review fixes. Two Claude CLI read-only reviews; no blocking issue in closure review. Concrete low-priority fixes were completed and retested. Existing historical QA below remains unchanged and does not override the current evidence boundaries.

---

# In-chip stop and completed state · 2026-11-11

final result: passed

- Source truth: user-provided crops codex-clipboard-bdead5d3-26aa-4018-bf54-f42e74a5216c.png (615×250) and codex-clipboard-5dbb5e15-4962-46aa-b44b-e2c61756c9a1.png (748×154), with explicit requested changes: move Stop inside the active chip; after success retain only the restore arrow. These are enlarged row crops, not full-page viewport targets. Compare row anatomy and intentional changes, not literal full-page pixel alignment.
- Rendered evidence: docs/xiaoyi-work-polish.png (pending), docs/xiaoyi-work-polish-complete.png (completed), both 1280×800 at density 1. Full sets under artifacts/workbuddy-demo/evidence/polish-{pending,complete}-{1440,1280,1024}-{zh-CN,en}.png. Viewports 1440×960, 1280×800 and 1024×768. Source crops and rendered states were opened in the same comparison input, followed by the enabled completed arrow and English narrow state.
- Findings: no P0/P1/P2 visual mismatch. The processing chip retains spinner + progress text and contains a clear square Stop affordance. It is enabled while the other chip is disabled. The completed state has no polish title or suggestions and preserves the 48×48 trailing restore target. Typography, 14 px action text, palette, official imagery, footer and baseline spacing remain unchanged. Full-page layout stays stable; row content is legible in the focused comparison. No new image assets or hand-drawn icons.
- Behavior: Chinese/English Stop works by keyboard and click, cancellation preserves original text and rejects a delayed fixture response. Both post-polish restore and subsequent actual editing make recommendations available; moving the caret does not. No extra model calls are made by these transitions. Manual color/selection/material protections remain covered by existing regressions.
- Validation: 240 core checks, 3 service contracts, TypeScript and production build passed. All 32 browser scenarios passed across the full regression plus corrected state test. The initial new keyboard test pressed a temporarily disabled restore button during its selection debounce; the test now waits for enabled, then verifies exact restoration. No product change was needed for that test timing. In-app local preview console contained no errors/warnings. Paid inference was not repeated for this UI-only change.

---

# Compact restore icon follow-up · 2026-11-11

final result: passed

- Target: the existing Xiaoyi Work polish row, with the user's explicit replacement of the Undo polish chip by a trailing restore icon. Reuse the result editor's Undo2 library icon. Only a successful changed result exposes it; restore removes it. Tooltip/accessible name: 恢复原文 / Restore original.
- Source: artifacts/workbuddy-demo/evidence/polish-1024-en.png; implementation: artifacts/workbuddy-demo/evidence/polish-restore-1024-en.png and polish-restore-1280-zh-CN.png. Source and implementation compared in the same image input at 1024×768, density 1; the deliberate state difference is successful prose rewrite plus its new icon. The source is a pre-rewrite screen. Full composition and focused row remain aligned; no false claim of identical prose/state.
- Type, 14 px polish labels, brand colors, official imagery, composer padding and action geometry are unchanged. The icon has a 48×48 hit target, 18 px glyph and visible keyboard focus. No visible text label competes with the suggested actions. English and Chinese layouts were checked at 1440×960, 1280×800 and 1024×768.
- Iteration: found an inherited 8 px bottom padding in the no-icon state; scoped override fixes it. In-app browser readback verifies 48 px row height and 0 px wrapper bottom padding; the updated responsive regression also asserts this. Existing preview retained and console reports no errors/warnings.
- Verification: all 32 browser regressions passed; after the spacing correction the bilingual six-viewport case passed again. Tests cover exact restore, selection/manual color retention, icon removal after restore and no visible Undo polish chip. TypeScript, production build and three service contracts passed. This visual revision did not repeat paid Gemini calls; the preceding four live bilingual cases remain recorded separately.

---

# Xiaoyi Work inline polish — design QA

final result: passed

## Source and comparison

- Source visual: Figma `ApFLno64NcMoA17MiPFfZh`, node `1591:39306`; screenshot `artifacts/workbuddy-demo/evidence/polish-reference.png` (1024×246, original contact sheet 1820×436). Behavior checked against current Notion Design G20 and Design System publication rules, plus the user's explicit inside-composer override.
- Implementation: `docs/xiaoyi-work-polish.png` (1280×800), and ignored `artifacts/workbuddy-demo/evidence/polish-{1024,1280,1440}-{zh-CN,en}.png` with result counterparts `polish-results-*`. Browser CSS viewports: 1024×768, 1280×800, 1440×960; density 1.
- Combined comparison input opened the Figma contact sheet alongside Chinese and English 1024×768 implementation screenshots. Source is a component contact sheet rendered at 1024/1820 scale, not a full-screen mockup; judge its row anatomy and normalized 14/22 text, 48 px actions, 8 px gaps. Full-page position follows the explicitly selected Web adaptation: prose → polish row → add/microphone/send.
- Direct in-app browser inspection confirmed the same row, two applicable actions, protected inline color chips and reachable microphone. No real model request was made during inspection.

## Findings

- No actionable P0/P1/P2 mismatch. Fixed smart-pencil/title, text-only action chips, neutral glass surfaces, rounded actions, loading/disabled states reuse the product components. Blue-purple accent is the approved Xiaoyi theme; user-selected color swatches retain their own values.
- Typography: system/PingFang fallback, 14 px/22 px polish title and action labels, weight 500, readable contrast. English title expands naturally; only the option region scrolls. No title wrapping or page overflow at the checked sizes.
- Layout: no group card/launcher. The row stays inside the composer above its footer; spacing is owned by its wrapper. Result view retains both columns and accessible footer controls. Narrow result composers intentionally scroll the actions rather than wrap the row.
- Assets: reuse existing Pencil/Sparkles library icons and Action Chip; no new generated or approximated brand assets. Existing official Xiaoyi assets are unchanged.
- Copy: “整理结构 / 精简表达” follows current Agent rules. Earlier contact-sheet examples with three options are not used to override the current content gates. English uses “Organize / Make concise”.

## Comparison history and verification

- Initial local visual inspection: row placement and icon/title/chip anatomy matched the approved adaptation. Labels were normalized from 13 to the existing 14 px design value before final combined comparison; recaptured bilingual screenshots above show the final size. No outstanding visual fixes.
- Automated browser scenarios verify idle/stable appearance, no automatic calls, selection-only replacement, independent manual color retention, protected-output rejection, undo, unchanged result, failure/retry, explicit cancellation, typing/owner/background invalidation, and confirmed/unconfirmed material preservation. Existing result editing, widget, camera and voice simulation regressions remain separate tests.
- API/model behavior is tested with fixtures. Real microphone/camera and paid Gemini inference were not repeated for this release.

## Follow-up

No blocking design follow-up. Real microphone and real Gemini response quality remain separately observable acceptance, not inferred from fixture success.

---

# Historical project QA (unchanged; outside this standalone release)

# Visual QA — recording-led revision, 2026-10-07

final result: blocked

This status refers to the requested zero-pixel visual equivalence. The interactive revision and builds work; zero-pixel equivalence has not been achieved or asserted.

## Desktop simplification (latest user revision)

The desktop now has seven direct entries: Mail, WPS, WeChat, Doubao, Notes, GoPaint and Mario. WPS groups sheet/word/slides. Removed recorded extra pages, the all-apps launcher and unavailable-app dialogs. Source widgets remain visually present; only Notes has a demo action. Earlier geometry evidence below describes the prior full desktop.

## Authority and sampling

- User recording: 2800 × 1840, 689.547 seconds, 38,627 timestamped frames (variable frame rate).
- Browser visual review: Codex in-app browser, 1400 × 920 viewport; phone check at 412 × 915.
- Stable desktop source is **608 seconds**, not 610 seconds. The latter contains transition blur and vertical displacement. Assets were re-extracted from 608 seconds after the first comparison.
- `reference/frame-map.json` identifies 15 scene checkpoints. Whole-recording PTS are available in the local-only frame review; this does not imply that 38,627 frames have been manually checked or individually implemented.
- User's linked HarmonyOS PC image is a small promotional image. Current default preserves the recorded tablet layout and omits the Dock. It is not a completed reconstruction of the PC reference's blue wallpaper/right-side widget composition.

## Implemented and observed

- Three recorded desktop pages, source app icon crops, source photo/recommendation/calendar/memo widgets, notification badges, actual HarmonyOS Sans font files, no Dock.
- Home icon geometry checked through rendered DOM: x = 124, 245, 367, 488, 610, 731, 852, 973, 1094, 1215; y = 674; each 63 × 63 at 1400 × 920. These match the selected crop coordinates. This geometry check is not a whole-image equality check.
- WeChat uses a 40% left pane, contact list and bottom navigation; row height corrected after reference comparison.
- Mail uses 50/50 list/reader or compose layout, authored fictional sales content and example.com addresses throughout. Original mail frames are never included in runtime assets.
- Doubao, WorkBuddy and Xiaoyi now have separate structures. Xiaoyi avatar and background crops come from its actual frame.
- Notes has top document tabs, a thin tool row, cream canvas and overview. GoPaint has a floating dark top tool strip and left vertical brush controls; its original non-mail ink is a canvas background and new strokes remain interactive.
- Bilibili uses the original local video region and individual recommendation thumbnails. Douyin uses a separate portrait video crop and full-width bottom comment entry. Red uses its original notebook image with a separate comment pane. Reading is a two-page spread.
- All 15 app routes were opened in the in-app browser without console errors or horizontal overflow. Screenshots: `artifacts/visual-qa/`.

## Functional evidence for this revision

- `npm run check`: passed.
- `npm test`: 13/13 core/protocol tests passed.
- `npm run build`: passed; public font paths now resolve without Vite warnings.
- In-app-browser two-tab check on isolated bridge 5191: phone changed quote cell B4 from 30 to 40, tablet readback was 40; report refresh; Chinese phone draft appeared in mail; internal mail send; phone next slide yielded tablet page 2, tablet next slide yielded phone page 3; no speaker-note label in tablet presentation; phone brush color #356bd8 reached the tablet; original Bilibili clip advanced to >0.3s with paused=false.
- Browser speech reports that native HAP is required and leaves the draft intact. No real speech-recognition success is asserted.
- Existing Playwright scripts were updated for the all-apps launcher and revised media controls, but the Playwright CLI suite was not rerun in this turn. Browser interaction used the selected in-app browser.
- Tablet and phone HAP builds pass. Tablet is now signed and installed; the native desktop render was captured after fixing rawfile module/CSS CORS through a packaged same-origin resource interceptor. Phone remains unsigned. Real speech and computer-free LAN acceptance remain unverified.

## Remaining visual differences

| Priority | Difference | Evidence / next action |
| --- | --- | --- |
| P1 | Wallpaper is the same woven geometry but a green stock variant corrected with an SVG color matrix | It is not the original grey/gold source. The color fit on a clear work-desktop region averaged approximately 3.42/255 per RGB channel; that is a calibration statistic, not final screenshot equality. Original wallpaper export is needed for strict equality. |
| P1 | WPS has no usable matching recording frame in the supplied clip | Existing sheet/word/slides editing works, but their chrome remains an approximation. Need a clear recording or screenshots of the installed WPS sheet, document and slide edit/show states. |
| P1 | Exact scope of PC reference versus recorded tablet composition remains unresolved | Default uses the recorded 10:08 home page, with other recorded pages available. PC promotional image's composition is not reproduced. |
| P1 | App content and secondary surfaces differ | Mail is deliberately fictional. Chat/sample prose is authored; menus, transitions, selection overlays and all original content states are not fully replicated. System/third-party icons beyond the 15 prototype apps do not launch the actual installed apps. |
| P2 | Some in-app toolbar glyphs use Lucide approximations | Native source glyphs for all states are not available. Icon crops from the desktop are original, but this does not cover every toolbar symbol. |
| P2 | Font rasterization, status bar, clock/weather details, corner antialiasing and compression differ | Browser/macOS versus HarmonyOS renderers and compressed source frames differ. Live status/connection indicators are intentionally retained. |

## Local frame-review artifact

`reference/private/frame-review.html` loads only the original local recording and local implementation screenshots. It provides previous/next actual timestamped frame, a timeline and overlay comparison. It is excluded from app, HAP and source ZIP because the recording includes original mail. The in-app browser rejected `file://` navigation; the tool's UI has therefore not been browser-validated. Open the local file manually if desired. No alternative hosting or browser-policy bypass was attempted.

No global pixel-diff pass is claimed. Continue from the listed source and rendering gaps before marking this visual task complete.
