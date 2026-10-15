# Adaptive Input Design System

## Delivery

Editable design-only library in Figma file `ApFLno64NcMoA17MiPFfZh`, page `2:2`. The current scope uses one Liquid Glass skin, eight application themes, phone and fold-PC lower-screen layouts, component states, motion examples, and a future rendering contract. No application source, device protocol, real model connection or Code Connect implementation is included.

Page sections: foundations; actions and parameters; text and contextual controls; dedicated panels; game; phone recipes; fold-PC recipes; decision/rendering contract; transitions. Component masters and existing referenced sources occupy separate dependency sections. The main demo controllers and transition examples were aligned to the three-region hierarchy on 2026-10-14. The separately authored WorkBuddy page remains unchanged.

The component registry is `samples/adaptive-component-registry.json`; four fictional input-plan examples are in `samples/adaptive-ui-plan-examples.json`. The exact Figma construction ledger and validation artifacts are under ignored `artifacts/adaptive-design-system/`. Construction scripts use the `figma-adaptive-` and `figma-three-region-` prefixes under `scripts/` and are not runtime application code.

## Foundations and interaction

- Skin and application theme are independent. Figma retains `Skin=Glass` as the stable implementation key, displayed as Liquid Glass; the `Adaptive / Application` collection chooses accent and soft background. Theme order: WeChat, Email, WorkBuddy, Word, Sheet, Presentation, Doubao, Mario.
- Existing Mobile Input palette primitives, Noto Sans SC fonts, icon components and Glass effect style are reused. New semantic colors alias primitives. New spacing, radii, sizes and feedback variables have scoped properties and CSS code syntax.
- Ordinary touch controls have 48 px targets; primary controls 56 px; hold-to-draw 168 px square. Phone alphabet keys are the documented dense-layout exception (32 px nominal width, at least 48 px high); wide keyboards distribute additional width rather than scale height. The three-row compact pen panel exposes the complete color row as one 152 × 48 target; its expanded palette offers five separate 48 × 48 targets.
- Selected and pressed are distinct. Selecting a pen does not imply drawing. Only the held drawing state uses deep red `#A52D20`; release or pointer exit restores its light state. Runtime implementations must also cancel on background, disconnect, app/target/slide change.
- Composer belongs to its target. Inline AI polish stays within it; sketch input uses a compact single line. Keyboard and trackpad are exclusive modes on phone and fold PC. Voice controls retain their position across the recommendation/recording/polish sequence.
- Phone reference size: 390 × 844. Fold-PC lower-screen reference: 1280 × 480 logical pixels, not a claim about a specific device. Header, contextual area and input panel adapt their layout separately. Native safe areas are supplied by the implementation; no OS clock or gesture bar is drawn.

## Future model-to-UI contract

The registry is a design handoff contract, not an implemented renderer API.

Context contains application, task, source/target ID and revision, input phase, device posture, capabilities and an interaction lock. The decision result chooses task, input mode, component/template IDs, relative priority and whether to preserve the layout. A separate generation step supplies text, formula or summary values only when required.

The local renderer owns drafts, theme lookup, layout constraints, continuous touch, voice capture, files, camera, pointer/IMU and game state. It accepts registered component IDs, legal states and declared properties/actions only. A target-version mismatch discards a result. Missing capabilities hide or disable the corresponding action with a usable alternative. Failed, refused or uncertain decisions preserve the current working input surface. Confidence thresholds must be calibrated on representative Chinese tasks before runtime use; the design does not invent a universal threshold.

Interaction locks take precedence over a new UI plan. During drawing, dragging or held game input, new adaptive results are queued. Stable semantic recognition may update middle-region controls during recording, while fixed voice controls retain their position. Deferred updates apply after release and target/version validation. Suggestions never execute third-party operations merely because a model selected their controls.

Suggested replies follow the current WeChat demo contract: explicit tap sends the selected suggestion, while the independently owned draft remains. Ordinary draft send remains its own action. Attachment and external-service actions require host implementations and do not imply a live integration.

## Decision and UI API mapping

- Jev: `state` plus typed `questions`; Choice routes task/mode, Noul decides whether an adaptive affordance is relevant, Score ranks candidate utility. It supplies decisions rather than copy or layout code. Official reference: https://docs.typesafe.ai/introduction/quickstart
- OpenAI Decisions: typed questions over text/images; adapter maps its result to the same internal decision contract. Do not assume vendor confidence values are interchangeable. https://developers.openai.com/api/docs/guides/decisions
- Structured Outputs: schema-constrained reply text, draft edits, formulas and task fields. Schema conformance does not guarantee semantic correctness. https://developers.openai.com/api/docs/guides/structured-outputs
- ChatKit: cards, lists, buttons, date inputs, forms and actions map to recommendation and parameter controls. The mapping column indicates a conceptual counterpart, not a drop-in implementation. https://developers.openai.com/api/docs/guides/chatkit-widgets
- MCP Apps: a custom Web component can be hosted in supported clients; continuous input/device functions remain the host's responsibility. https://developers.openai.com/plugins/build/chatgpt-ui

## Prototype and motion boundaries

Figma demonstrates component transitions, input switching, sample recording-to-polish, task switching, formula application feedback, tool selection, color selection and hold/release appearance. It does not capture audio, draw arbitrary paths, read screens, classify intent or operate devices. The slider and dial use discrete prototype samples; continuous drag and precise cancellation are runtime responsibilities.

Three transition families cover app theme, local generation and panel expansion. The normal previews use 320 / 180 / 320 ms total visual transition durations respectively; reduced-motion variants show the final arrangement without sweeps. WeChat's separate runtime reading contract remains 480 ms composer pulses → 2000 ms scan → recommendations at 110 ms intervals. These are protocol timings, not measured network latency.

## Verification

Validate component IDs, unique names, mode/alias bindings, all variant destinations and layout bounds; inspect rendered phone/PC and material boards. Allow out-of-bounds decorative light ellipses and the deliberately offscreen panel in the collapsed motion state, which are clipped by their parent. Runtime device, model accuracy, arbitrary text input and native accessibility testing are outside this Figma delivery.

## Three-region revision · 2026-10-14

- Top: current object and task state, plus the existing single app/connection row.
- Middle: contextual suggestions, canvas, camera, color/brush controls, task parameters and the sole composer. Text, transcription, attachments and inline AI polish share this editor. Its visible area grows when bottom tools are minimized.
- Bottom: a stable input dock containing editing tools, voice and mutually exclusive keyboard/trackpad. Expanded and minimized states preserve the target and middle-region draft. The minimized dock retains the two rows of editing tools, keyboard/trackpad selection and voice, without a duplicate draft summary. Sketch uses one compact composer in the adaptive region.
- The user owns expansion. The model can choose registered middle-region controls but cannot move fixed controls, erase drafts, override an active interaction lock or apply an old-target result.
- Presentation keeps notes and pen settings in the adaptive region and its dedicated tool row at the bottom. Game retains its fixed landscape buttons and suppresses adaptive content during play; no new text-input overlay is added.
- The material collection has exactly one mode, Liquid Glass. Existing Glass IDs remain stable; Mechanical instances were migrated before their variants were removed. Eight app theme modes remain independent.
- New reusable families: `target-header`, `adaptive-workspace`, `input-dock`. Their board is `1309:20534` on page `2:2`. Main demo frame IDs and incoming navigation destinations are preserved; collapse variants are components rather than extra overview screenshots.

Verified inventory: 51 registered families, 173 component variants, one material mode, eight app themes. Structural checks found no broken destinations across the four pages and no direct-child region overflow in the updated controllers. Render review covered the phone scenario board, reusable region board, Doubao sketch and WorkBuddy sketch, plus the PC arrangement. This is Figma structure and simulated interaction evidence; continuous touch, speech, model generation and device execution were not tested or implemented.

### Sole composer verification

The main demo and library were rechecked after moving the editor: 104 main controller variants (96 editors; presentation variants have none) and 50 library recipes (42 editors). No duplicate composer, bottom-region composer, direct dock-child overflow or broken prototype destination was found on either page. Render review included the region overview, WorkBuddy sketch and Email reply. That earlier revision used Expanded and Minimized variants; the current intent-input revision replaces them with Minimized, Keyboard and Trackpad. Compact text remains a composer property. These are editable design and structural checks, not runtime or device verification.

### Keyboard menu revision

The shared keyboard now includes Default, Symbols, SymbolsMore and Emoji variants. The 123 / Emoji / ABC controls switch content within the same 354 × 234 panel; backspace is visible in every mode. Space and voice keep their footer positions; the rightmost key inserts a newline. Send is inside the adaptive-region composer. The showcase at `274:10646` uses four component instances. Ten menu links resolve correctly and row bounds pass; the rendered emoji glyphs and backspace were reviewed. Actual character insertion, deletion and repeat-on-hold remain local renderer responsibilities.

### FC A/B reference alignment

The shared game component and existing FC demo states use red round buttons in a diagonal arrangement: B lower-left and A upper-right. Letter marks sit above the caps; a pale shared recessed cradle follows the diagonal. Existing touch sizes, fixed placement and press/release states are retained. The supplied controller photograph is the visual reference; unrelated controls are unchanged. Reviewed Figma renders: `271:4935` and `5:10639`.

### Context-derived action chips

Screen/message-derived next actions use a horizontal row of content-width Liquid Glass chips: icon and short action label, 48 px height, no trailing chevron. Longer sets scroll horizontally. The default three actions fit together at 336 px total width. Suggested replies keep their separate treatment. Main WeChat states, phone/fold-PC recipes and the region overview were updated without changing the single composer or bottom controls. Source cross-check: `apps/web/src/phone-wechat.tsx`, `phone-wechat-layout.css` and `interaction.css`; the current implementation already uses parallel action placement, while these Figma chips use inline icons and labels per the latest request. No runtime code was modified.

Service action chips use the destination application’s original color icon, resolved from the service mapping. Calendar, Gaode and Feishu reuse the same reviewed assets as the current development demo (`174:2874`–`174:2876`). Brand marks are not replaced by generic line icons or recolored to match the host theme. This rule applies to outgoing service entries; controls for an application’s own functions retain functional icons. Updated 62 registered service instances and all three app-action variants; reviewed `1309:20450`.

## Intent-input revision · 2026-10-14

This revision supersedes the earlier dock-state description. The current library has **57 registered families**, one Liquid Glass skin and eight app themes. The bottom dock states are Minimized, Keyboard and Trackpad. Minimized retains editing tools, the mutually exclusive input selector and voice. Clicking the active panel closes it. The sole draft-send action is a paper plane plus 发送 inside the middle-region composer; the keyboard return key inserts a newline.

New families: `agent-task-status`, `inline-color`, `color-refinement`, `layout-intent`, `parameter-composer`, `intent-recognition-sweep`. The intent board is `1368:22778`. Task-color variables alias existing semantic primitives independently of application themes and connection state. The registration contract now includes parameter source, last valid value, task/target ownership, confirmation and task state enums. This remains a design contract, with no new runtime API.

WorkBuddy section `109:5262` shows eight primary keyframes from red-theme dictation through precise color, sketch confirmation, inline checking and task completion. Existing materials, approval and object-editing branches remain. Recognition may update the middle while recording; fixed voice controls do not move. Dragging and drawing delay changes. A 550 ms cyan/lilac sweep provides recognition feedback; Settled supplies the reduced-motion state. Full details and counterexamples are in `docs/workbuddy-intent-keyframes.md`.

Structural validation covered 181 demo controller variants with 173 composers and 60 library recipe variants with 52 composers. There were no duplicate composers, missing/duplicate composer sends, send/text collisions, dock overflows or unresolved destinations in those checks. These counts include necessary interaction variants, not extra displayed storyboard frames. Visual review covered the nine-frame WorkBuddy sequence, intent component board, WeChat keyboard and inline polish. All speech, semantic recognition, arbitrary drawing and Agent execution remain simulated.

### Unified color input and task-tracking boundary

The color-refinement variants retain their component IDs and now share one 354 × 328 container: preset swatches, custom color field, hue slider and HEX. Picker is an interaction sample within that same layout, not a separate page. There is no open-picker or confirm-color action. Every valid edit immediately updates the draft and the composer HEX; invalid or incomplete HEX preserves the last valid value. A valid direct color edit requires no second confirmation, while interpreted layout confirmation and final task submission remain explicit.

The composer contains only text/input parameters and editing actions. Phone Agent state is limited to task identity, a semantic dot, a short status and necessary stop/resume actions in top task tracking. PC owns execution steps, logs, detailed progress and artifact details. Materials, answers, approvals and pre-submit input review remain phone input activities. Running, stopped and completed phone views no longer duplicate PC execution/result cards.

Notion PRD FR07/AC07, FR10/AC10, W05/W05b/W06 and related flow prose were updated and read back on 2026-10-14. Legacy embedded color wireframes are explicitly marked as reference only. Structural validation checked 21 affected WorkBuddy variants: one composer each, no task state inside it, no old picker/confirm entry and no execution detail cards; all 126 referenced prototype destinations resolved. Render review covered unified color input and the execution-state phone screen. Figma demonstrates discrete color samples; continuous input, live data binding and actual Agent execution are not runtime verification.

### Sketch confirmation and inline attachment

`layout-intent` uses a top-right close action and a 48 × 48 confirmation check at the panel bottom-right. The empty state disables confirmation. Confirming inserts the raw sketch as an editable thumbnail into the sole composer; re-edit replaces the same attachment without losing text or color. Confirmation does not send. The library Confirmed variant shows this inserted result; WorkBuddy supports confirm → inline thumbnail → reopen, with keyboard/trackpad mode preserved. `parameter-composer/SketchAttached` is `1401:45573`; reusable `sketch-attachment` is `1401:45584`. The current Notion PRD section 5.3 was synchronized after its concurrent restructuring, with FR09/AC09 references preserved. These are editable Figma samples, not arbitrary drawing or live attachment implementation.

### Direct send and media control cleanup

Latest rule supersedes the earlier Review-first flow: WorkBuddy text, color and sketch are checked in the sole composer. Its Send directly submits; no separate Review screen or Submit Task button. The old Review frame ID is retained as DraftReady for editable input continuity. Material requests and actual approval branches remain. Bilibili places List left and groups Previous/Next right. Instructional copy is removed from product frames and retained only in specifications. MEDIA-01 and VUI-03 library examples are synchronized. No runtime implementation changed.


## Bilibili input-only revision (2026-10-14)

The latest design keeps one phone frame (`1358:12215`) and MEDIA-01 (`1357:21822`). Duplicate draft and coin-result frames (`1358:12415`, `1358:12518`) and the unreferenced MEDIA-02 phone feedback component (`1357:21853`) were removed. List stays left; Previous and Next remain grouped. The sole composer owns Send. Phone actions keep their labels; execution results, errors and account restrictions belong to PC. No phone confirmation page, success card or result toast is generated.

Application mode `Bilibili` (`1414:0`) uses action pink `#D93674` and soft pink `#FCE4EE`, with the original wordmark and a cool-white/pink glass surface. The input dock explicitly follows that mode. Brand color never changes danmaku content color.

“One-way input” defines the device UI roles. It does not remove receiver acknowledgement, deduplication, draft preservation on failure or the prohibition on blind retries. Figma is a design simulation, not a live Bilibili integration. Validation: final phone and library screenshots, no links to removed nodes on the inspected pages, no confirmation/result text in the remaining phone frame, Notion old frame embeds removed. No application code changed.


## Reachable sparse layouts and visible tasks (2026-10-14)

Historical layout: sparse adaptive controls were bottom-aligned with blank space above. This rule is superseded by the elastic composer rule below for WorkBuddy and the shared layout contract. Bilibili remains at its previously reviewed position until its next layout migration. Recording, dragging and drawing continue to lock automatic reflow.

Task navigation master `1332:24359` is now on the component-library page and contains two directly visible task cards with semantic state dots and labels, plus a 48 × 64 New Task entry. All 110 WorkBuddy variants use it. List-icon task gates and six obsolete local overlays were removed. Task-specific return variants retain the originating draft stage; New Task opens the existing draft state without execution. Stop/resume and pinned object controls remain available. Phone task states remain brief; details belong to PC.

Figma-only update; no runtime code changed. Visual review covers minimized input, keyboard, second-task materials and running states. Registered destinations and task navigation structure were inspected.


## WorkBuddy canvas cleanup (2026-10-14)

Removed 22 historical phone frames and three old result dialogs from the legacy WorkBuddy page, plus three redundant current showcases. Section `109:5262` now contains eight primary frames and four necessary branches. Current interactive components remain editable on maintenance page `296:15707`; their master IDs and prototype destinations are preserved. The newly discovered screenshot candidate section is retained. Current PRD links to removed duplicate displays now point to the surviving flow.


## Elastic adaptive composer (2026-10-14)

The sole composer fills all available middle-region space when there are no supplemental input controls. Color, materials and other input controls take their required space above it; the composer fills the remainder. Sketch preserves a compact 64 px composer to prioritize drawing. The top task tracking and bottom input dock retain their bounds. Send stays at the bottom-right inside the composer; attachments and inline color values remain input content. Long tools scroll within their allocated region.

Updated all 110 WorkBuddy controller variants and their existing main-screen instances. Registered editable layout family `flexible-composer-region` (`1435:46489`) on the library page, with TextOnly and WithTools variants. Running uses a 484 px composer and Completed uses 540 px in minimized-input mode; the color example uses a 336 px tools region and a 192 px composer. These are examples, not fixed runtime heights.

Validation: no visible adaptive child exceeds its region in 110 variants; 126 prototype destination IDs resolve. Render review covered Running, color input and the two library layouts. Notion PRD layout guidance was replaced with the current elastic rule. This is Figma/design-contract work; no runtime UI code changed.


## Bilibili remote playback revision (2026-10-14)

MEDIA-01 `1357:21822` now contains explicit Play/Pause, speed selection, target-player mute and volume minus/plus, followed by existing social actions and playlist navigation. No timeline, seek, scrub or time-skip controls. Playback state drives the next explicit action; phone result pages remain absent. Rate values and volume levels are discrete Figma samples, not platform capability claims.

Shared component sets: playback `1451:30334`, speed `1451:30362`, volume `1451:30439`. The single main frame `1358:12215` uses a 304 px media panel plus 256 px elastic composer, with a 12 px gap; fixed dock remains at y708. Controls use app theme variables and existing icons/glass effects. The 18 prototype state links resolve and interactive targets are at least48 px. Main and library renders were inspected; the speed label line-height overflow was corrected. Design Skill APP-BILI-02 and PRD were synchronized. No application runtime code changed.


### Volume parameter correction (2026-10-14)

Supersedes the previous volume minus/plus layout: MEDIA volume now reuses the parameter slider visual with a 48 px touch track, speaker mute and numeric value. Four existing volume component IDs remain, as discrete Figma samples. Main media height is320 px and the elastic composer is240 px; dock remains at y708. Continuous bounded parameters favor sliders; discrete rate options retain selection controls and playback remains an action button. Design Skill G22 and PRD synchronized; continuous runtime drag remains outside this design-only change.

## Bilibili display mode correction (2026-10-14)

The left navigation action switches the PC between fullscreen playback and list mode. Use the fullscreen icon and 全屏 label for entry; previous/next remain adjacent on the right. This supersedes the separate open-playlist action. The shared MEDIA-01 component and its phone instance are updated; no runtime behavior is implemented by this design edit.

## GoPaint parameter-first companion (2026-10-14)

Current frames: 1443:16044 (drawing controls), 1443:16163 (voice command listening), and 1472:16901 (editable text target focused on the primary device). Pure drawing/command mode has no composer. Preserve the shared default two-row dock (390x136 at y708), its editing tools and keyboard/pointing entries. All voice entries use 智慧语音. Parameters remain visible and stable while listening. Opening an input panel does not create an editable target.

GoPaint uses application mode 1459:0 and Liquid Glass Dark material mode 1471:0. Canvas #090A0C and primary #4D85FF are project design choices following the requested black/blue direction and the official dark toolbar/blue selection reference; they are not asserted official brand HEX values. Other applications retain their material modes. Artwork hue, saturation, value and presets remain independent of UI theme.

Voice commands and dictation are separate routes. G03 uses one Smart Voice button: click toggles, hold speaks, release ends recording. Ending recording does not submit or execute. New layer, liquify and smudge are command candidates; execution requires an explicit app action or an established command contract. Mixed toggle/hold details remain unresolved. Ambiguity needs clarification and destructive operations need confirmation. Bind commands to artwork/layer/version and validate capabilities. Cancel on target change/disconnect; never replay unresolved commands or infer success from animation.

A single elastic composer appears only after a valid editable text field on the primary device is focused. Speech then enters that text target and cannot invoke drawing commands. Text synchronizes to the focused primary-device field; Finish ends editing, without a second draft-send step. Blur restores painting controls and leaves text on its original target. Unknown focus protects unconfirmed input and blocks writes. A late transcript cannot move to another field or become a command. Selecting a layer or speaking alone does not open text input.

Design System sources: visual brush console 1466:31178, brush-size slider 1466:30573, color-wheel presets 1466:30744, voice-command dock 1471:46139 (Idle / Listening / Unavailable). Six visible tools remain pencil, watercolor, oil paint, airbrush, palette knife and eraser. Palette knife/native IDs require adapter validation; eraser preserves stored paint color. Size is a target-defined continuous parameter, with 12/32px as prototype samples. Color changes need no Done action. Preserve manual values and freeze layout while dragging.

No photo import or reference-window controller. Existing system tap-to-transfer is outside scope. Editable structure, Noto Sans SC text, theme scope, three key frames and prototype destinations were checked. Real ASR, arbitrary command resolution, continuous dragging, native text focus and cross-device writes remain runtime work. No application code changed.

Reference: https://consumer.huawei.com/cn/support/content/zh-cn16041995/ (official editor screenshot and tool semantics); https://consumer.huawei.com/cn/support/content/zh-cn16042020/ (color tools). Official local features do not establish a remote control API.

## Bottom-anchored input expansion (2026-10-14)

Default dock `1493:55578` now provides Minimized, Keyboard and Trackpad variants. Keyboard/trackpad open-close icons and the single 智慧语音 entry remain in the bottom row. A selected mode shows its panel above this row; selecting the other mode switches panels and selecting the active mode collapses it. No duplicate voice button appears inside the keyboard or trackpad.

On the 390 × 844 design baseline, both panels are 280 px high, keyboard rows use 56 px keys, and the bottom row remains at y776. The expanded dock is 428 px high at y416; minimized remains 136 px at y708. Target example `1304:10334` reduces its sole composer from 112 to 88 px and gives source context and recommendations independent scroll regions. Panel sizes are logical design baselines requiring target-device keyboard/safe-area calibration, not verified native measurements.

The three example states and the new library family have open/switch/collapse links; destination IDs resolve, each state has one voice entry, and footer positions match. The obsolete dock is retired; all designs use the current three-state input family `1493:55578`. The Notion Design Skill expansion rule and component registry were synchronized. Validation is Figma structure/render review only; no runtime app changes or device acceptance.

## Integrated panel last row correction (2026-10-14)

Supersedes the separate bottom footer above: `1493:55578` now integrates the mode controls and one 智慧语音 button into the keyboard/trackpad final row. Keyboard includes Space and Return in that row; ABC, symbols and emoji use the upper selection row. Trackpad includes two blank click buttons. Remove chevron badges and use app-theme selection feedback. Panels are 288 px high, letter keys 48 px, final row 56 px at global y776. The expanded dock is 368 px at y476, returning 60 px to the source context; composer remains 88 px. Minimized retains its existing two-row layout. Three-state open/switch/collapse destinations resolve; this is editable Figma simulation, not native verification. Notion Design Skill and registry reflect this correction.

## Transparent-glass atomic revision — agreed direction (2026-10-14)

The three flat concept images are rejected. Restore the originally approved transparent glass: visible background transmission, a fine bright edge, restrained refraction, and soft colored ambient light. Readable text surfaces stay denser. Reduce nested backing plates rather than removing glass itself. App theme and artwork color remain separate; preserve black/blue painting and matte game controls. Update canonical components in place and preserve referenced maintenance states. Horizontal/vertical sliders share semantic values and touch geometry, but vertical text stays upright. Pressing, selection, recording, focus and availability are independent states. This is Figma-only design work; document actual prototype coverage and remaining device/API gaps.


### Transparent-glass revision — implemented and checked

Updated 29 existing material families (80 existing variants), six referenced fixed-dock variants, capture/color/layout/media containers, and affected dark/Email/Word voice overrides. Added four material variables (`glass/control`, `glass/reading`, `glass/dock`, `glass/app-tint`) so paint alpha is part of the semantic color rather than an ineffective local override of an existing bound RGBA value. Reading remains denser than actions. Editing icons share one glass dock; nested opaque backing plates are removed. Main component identities, instance links and application-specific layouts remain editable.

Canonical page stays `2:2`; no page was created. Main library `277:15031` now contains categories `1512:25704` (19 atom entries), `1512:25705` (25 composition entries), and `1512:25706` (11 scenario/motion entries). Its inventory is 54 component sets / 212 components, including six existing icon masters. Four new components were added: three vertical Slider states and one Voice Recording state. Maintenance `1493:67375` remains on `296:15707` with 25 groups / 71 components intact. Integrated last-row geometry is the single current source for all layouts.

Slider `270:3678` has six variants: Horizontal/Vertical × Default/Adjusting/Disabled. Existing horizontal IDs and 280 × 64 bounds remain; the touch rail is now 280 × 48. Vertical components are 112 × 288 with a 48 × 200 touch rail, upright label/value/endpoints and value above the finger. Registry retains aliases from old Selected to Horizontal/Adjusting. Voice Recording is `1509:25682`, separate from transient Pressed and Recognizing. New variants are visual state definitions, not claims of interactive continuous dragging, ASR or device input. No error/restricted Slider variant is claimed; invalid/range handling remains a renderer contract.

Structural inspection covered 3,481 instances in the canonical master section and input-expansion example; all 127 referenced prototype destinations resolve. This is reference integrity, not a full manual interaction test. Existing links were retained. Render review covered action/voice/slider/composer/capture, WeChat three input modes, color refinement, Bilibili playback/text, GoPaint drawing/listening/text, Email default/edit, Word text/format and the matte FC controller. Readback and screenshots exposed and corrected horizontal Slider cached colors, deep-theme toolbar outlines, and inherited green Voice overrides in Email/Word. The remaining app-specific explicit overrides outside these samples were not exhaustively restyled. Native keyboard sizing, IMU, continuous drag and voice timing remain device/runtime acceptance work.

Evidence: `artifacts/design-system-glass-2026-10-14/` contains before/after PNGs where a baseline was available and the final inspected samples. This directory is ignored generated evidence. Notion Design Skill G15/G22 and section 2.3 were updated with targeted edits and read back. No application code, runtime protocol, PRD feature scope, Git commit or push was changed by this visual revision.


## Canvas cleanup — current page structure (2026-10-14)

Supersedes the separate maintenance-page arrangement above. Removed page `296:15707`; its referenced sources now live in section `1493:67375` on canonical page `2:2`. The file has three pages: current controllers/prototype, current transitions, and the Design System. Current prototype sources are grouped as components, not displayed as another WorkBuddy design version.

Removed 99 superseded/duplicate display items, 21 unreachable prototype variants and 22 unused legacy components. Seven redundant showcase sections and obsolete labels/empty containers were also removed. The latest three-mode input master `1493:55578` now sits within layout overview `1309:20534`; old standalone WeChat keyboard/trackpad display frames were removed. Current mode-switch paths remain through `1304:10334`. WorkBuddy retains 92 reachable variants; other applications retain 68, totaling 160 required prototype states. These are reachable state definitions, not 160 additional review screens.

After cleanup, all 360 distinct Figma reaction destinations resolve. IDs of retained components and current scene frames were preserved. Visual review covered the compacted library overview. The superseded task-list header and its registry entry were removed; the existing visible task-navigation master `1332:24359` now appears in the overview with separate task cards, status and New Task. Removed display links in Notion Design Skill were redirected to current component sources where present. Cleanup manifest and source redirect mapping: `artifacts/design-system-glass-2026-10-14/canvas-cleanup.json`. No application runtime changes were made.

## Removal of modification preview — 2026-10-14

Current user decision supersedes the early edit-preview component and WorkBuddy preview/application branch. Remove `271:4010` and its `diff` registry entry; generation scripts must not recreate it. Explicit polish updates the current text/valid selection directly, with undo. Object instructions are submitted from the sole composer; PC owns the detailed result. Do not generate a phone before/after card, Accept/Apply step, or separate modification-review screen. Capture-source previews and formula-range controls have separate purposes and are unchanged. This update covers Figma and design rules; prior runtime validation records remain historical evidence and do not imply that runtime migration has happened.

## Capture icon distinction — 2026-10-14

The final editing-toolbar action uses the shared `1438:45173` screen-capture icon: a monitor outline with capture corners (Google Material Design Icons `screenshot_monitor`, outlined, Apache-2.0). Select All keeps its selection-boundary icon `280:14601`; these actions must not share glyph geometry. The capture icon opens the existing screenshot/recording/camera selector. Update the shared icon source so all toolbar instances inherit it; retain 24 px art and 48 px touch targets.

## Dismissible auxiliary input — 2026-10-14

Generated auxiliary modules expose a 48 × 48 close action at top-right. When confirmation/adoption is required, place it at bottom-right in a reserved action area outside the scrolling/drawing content. Closing hides the module and yields middle-region space to the sole composer; it preserves task-owned text, parameters, attachments and unfinished raw strokes, without confirming, inserting or submitting anything. Sketch confirmation remains a separate check action.

Record dismissal against app/task/target identity, input revision and processed intent. The same intent result, unrelated typing, draft synchronization, reconnect or late inference cannot reopen the module. A new explicit need identified from a completed voice result or stable typed intent creates or updates a composer intent chip; only explicit chip activation opens the module. Deliberate editing of an existing parameter chip or sketch attachment also reopens its editor. Restore the same task values. Never reopen a different task's module. Respect active drag/drawing/recording locks and discard stale results.

Fixed input docks and persistent application tools are not generated modules. Closing required parameter input does not waive missing values or approval. Figma provides simulated visibility and a compact Open → Dismissed → Reopened example; real recognition and per-target persistence are runtime responsibilities.

Figma G24 specimen: `1543:38028`; flexible-region Dismissed/Reopened variants: `1543:37959` / `1543:37970`. The color, layout, missing-parameter, formula, sketch and camera module families have close controls; 35 existing adaptive hosts bind module visibility. The example expands the sole composer from 192 to 540 px without changing its text/HEX. Prototype visibility is illustrative; per-task suppression and real intent recognition remain implementation requirements.

## Inline auxiliary-intent chips — 2026-10-14

Latest user refinement supersedes automatic reopening in G24: stable text/final voice recognition exposes a large icon-led intent chip **inside the sole composer**. Explicit tap opens the corresponding auxiliary control; closing retains the chip and task-owned values/strokes. The whole text area remains an editor, not a reopen hotspot. Examples: pencil + 画个布局; camera + 拍照补充; document + 添加文档. Show the recognized value directly when it is visual: a color intent uses its actual color swatch + 调整颜色, not a generic sliders/palette icon or a verbatim long phrase. Preserve the original expression in text and binding metadata, bind text range and target revision, and invalidate stale/negated suggestions. A new recognized need creates/updates its chip without forcing an already-dismissed panel open. Active state marks the currently open control. Keep ≥48 px height and permit wrapping within the composer without covering Send. Choosing a tool does not send, upload or create a task.

Implemented: shared glass intent-chip family `1550:37707` (Available / Active / Disabled, editable label and swappable control icon), plus Canvas / Camera / Document × Ready / Open composition family `1552:38906`. Compact examples: `1552:38914`. The prior whole-composer reopen hotspot was removed from `1543:37964`; explicit chip taps now own opening. Existing color lifecycle `1543:38028` also uses the same chip. Examples simulate recognition and retained sample content; actual camera access, document selection and live draft persistence are not implemented in this design-only change.

### Recognized-value chip refinement
Color chips display the current color swatch followed by 调整颜色. The icon represents the recognized/edited value (for example #E03131), independently of the app accent and active state. Keep color value, HEX and picker in sync; preserve the original color phrase as input provenance. Generic controls without a visual value retain their distinct control icon and concise action.

## Auxiliary panel action placement — 2026-10-14
All intent-generated panel shells use top-right Close and, when applicable, bottom-right Confirm (minimum 48 × 48). Replace the prior top-right confirmation layout. Keep the panel outer size and fixed input dock stable; reduce the content viewport to reserve the confirmation area, rather than overlaying editable content. Close preserves chips, parameters and unfinished strokes. Confirm only adopts the local input; it does not submit the task. Live color/HEX and deterministic formatting remain immediate with no added confirmation step.

Placement migration checked: five sketch/layout variants and two missing-parameter variants were updated in place. Existing sketch and layout instances inherit the reserved confirmation footer. Component-library audit covered 19 confirmation controls, with no top-right remnants or broken referenced destinations; screenshots reviewed the layout canvas, chip/canvas composition and missing-parameter panel. This remains design/prototype evidence, not a runtime implementation change.

## Retired dock removal — 2026-10-14
Removed the obsolete prior-geometry dock set and its three variants after migrating 176 live source instances (174 library/prototype sources, two application-page sources) to `1493:55578`; nested app instances inherit their source updates. Expanded states use 368px and preserve bottom anchoring. Three legacy cross-page voice navigation links were invalid and removed; no recording/runtime capability is claimed for these design samples. Notion Design Skill links and the painting voice-dock registry now point to the current family. Current master and migrated application screenshots were inspected; no application code changed.

## Professional input: selected glass direction — 2026-10-14

User selected visual direction 1 for section `1348:21713`. Replace the repeated specification-card grid with one editable specimen: three continuous faders, a large six-key action deck, and a single inline-intent composer. Preserve translucent white material, cyan/lilac background refraction, fine bright borders and restrained teal selection feedback. The specimen is a component demonstration, not a new application or an added phone dashboard. Keep the application-theme layer independent of the material.

### Rotary controls refinement

Size is an independent component property, not a proportional scale applied to the complete control. L uses a 354 × 430 panel and 240 px dial; M uses 280 × 352 and 184 px; S uses 224 × 280 and 144 px. L suits a primary precise-control task, M suits a standard adaptive panel, and S suits supplementary or grouped parameters. Preserve 48 px secondary actions across all sizes. Compact variants reduce tick density and redundant context before reducing primary-value legibility; adapt numeric/timecode typography separately. Size changes preserve target, values, mode and gesture semantics; never change size during a held gesture. Select size from available space and task priority, not from phone/PC labels alone. These are logical design dimensions to validate on actual devices.

Implemented L/M/S as a separate Figma variant property in all three families: 24 size/state combinations total, with the existing L component IDs preserved. Review `1578:39517` now shows the nine primary size examples instead of another duplicate large-only board. M/S use 36/24 ticks and 48 px secondary controls; S removes redundant context. Prototype destinations are remapped within the same size. The final comparison screenshot and text bounds were checked; real-device ergonomics remain unverified.

Replace the unfinished plain-circle PRO-08/09/10 sources in place. Rotary controls need an editable graduated rim, clear index, layered translucent face, readable current value/unit and direct manipulation feedback. Use a full circular scale for a relative encoder, with no misleading absolute minimum/maximum or progress fill; a short highlighted trail may indicate a gesture delta. The modifier control explicitly distinguishes the primary parameter from a held secondary parameter; release/cancel restores the primary mode without resetting either value. Jog displays timecode and frame rate; Shuttle displays signed playback speed, a neutral center and release-to-zero behavior. Do not use the same generic circle for these different semantics. Topic selection remains a discrete topic control, not an audio/parameter encoder.

The large rotary area is at least 200 px across, secondary actions at least 48 px high. Labels and values are editable; pale glass, subtle rim lighting and app-accent highlights remain consistent with the chosen direction. Do not add decorative screws, fake pressure capability, helper paragraphs inside the controls, or a new runtime route. Prototype press, modifier and mode-switch states are illustrative; real rotational gestures, frame navigation and hardware integration require implementation and separate verification.

Implemented in review frame `1578:39517`: relative encoder `1578:39146` (Default/Adjusting/Disabled), rotary modifier `1578:39301` (Default/ModifierHeld), Jog/Shuttle `1578:39508` (Jog/ShuttleNeutral/ShuttleActive). All three original source IDs remain the default variants. Each dial has a 240 px touch surface, a 48-mark scale, optical rim and editable value/unit. Modifier and Shuttle press feedback use reversible press transitions. Eight variants passed structural text-bounds and destination checks; final screenshots cover the main composition and both mode families. The section ends before the existing media section, with other sections left in place. Numerical +/- hit regions reserve 48 × 52 px; the prototype does not claim working value-step arithmetic.

Retain unique professional input masters as a compact source shelf. Retire duplicate long-task/workflow displays whose semantics are already served by the current composer, parameter input and task navigation. Do not reintroduce a separate Review, execution receipt, run-preview or Apply screen. Detailed execution feedback belongs on the PC. Parameter controls declare unit, minimum, maximum and neutral; pan is centered, volume uses dB, expression uses 0–100. Selected and actively pressed keys remain distinct states. Large touch rails reserve at least 48 px width.

Preserved interaction constraints: freeze app/object/session binding from down through up/cancel; distinguish absolute values from relative deltas; group one continuous gesture as one undo step. Jog uses frame-relative displacement, shuttle uses signed speed and returns to neutral on release. Piano note on/off is pointer-owned; cancellation, background, disconnect and target changes release all held controls. Never replay stale note-on, shortcut or relative-delta events on reconnect. Desired values and observed values remain distinct in implementation; this Figma example does not simulate verified hardware receipts.

The color intent appears inside the sole composer as its actual swatch plus 调整颜色. Explicit tap opens its auxiliary panel, top-right Close dismisses it while preserving the chip/value. Color changes are immediate and require no Done action. Any adoption-required input retains bottom-right confirmation. Prototype transitions demonstrate discrete visual states only; continuous gesture handling, pressure, MIDI/DAW adapters and external execution are unimplemented.

Implemented specimen `1568:38677` in the original section. Removed the 19 repeated display wrappers and six duplicate long-task/workflow component sources; retained all 11 unique professional source identities after confirming no external live instances of the retired sources. Shared fader family `1568:38793` has Volume/Pan/Expression and Default/Adjusting; action-key family `1568:38898` separates momentary press from toggle selection. Action deck retains `1348:21973`; composer is `1568:38979`, and its explicit color chip opens `1571:38384`. Text, icons, glass layers and component instances remain editable.

Visual readback checked the final 1480 × 1080 specimen and source arrangement; structural audit found no overflowing text, no retired Review/Run-preview/specification cards, and no missing destinations in the section's 33 referenced reactions after the final toggle refinement. No remaining page-level links target the retired VUI/WF display cards. Final refinement puts mute/solo transitions on separate toggle variants, preserving glyph/label overrides. Design Skill references were updated and read back; obsolete WF card IDs are absent. PRD section links still resolve to the retained section; scope and runtime protocols are unchanged. Registered the four current families in the design-contract JSON. Screenshots and mutation scripts remain under ignored artifacts; no application implementation or device acceptance is claimed.


## Runtime convergence — 2026-10-14

Updated the existing attachment and WorkBuddy sources, plus contextual polish and native-account state families. Review section `1598:44263` contains editable instances and simulated transitions. Current app implementations, design IDs and separate browser/device evidence are indexed in [runtime-design-sync-2026-10-14.md](runtime-design-sync-2026-10-14.md). Confirmed sketch attachments precede body text and have an independent remove action; removing a sketch preserves text, colors and unrelated materials.
