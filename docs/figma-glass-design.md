# AI keyboard glass controllers
- Game application switch: add a 48×48 glass application-switch button at the upper right of all nine current Mario controller states. Reuse the existing application chooser navigation; retain the single connection/app status row and game-control positions.
- Draft-above-switch revision: place the transcript/draft as a shared fixed field above the expandable input surface. Keep keyboard/trackpad switch at the top of that surface; changing input mode only replaces the region below the draft. Preserve existing key, gesture and bottom-control positions. Applied to both input states and the native trackpad opening transition; reviewed both exported screens and the transition contact sheet. Draft y=434 precedes mode surface y=482 and switch y=494.
- Consolidated input and canvas cleanup: keyboard bottom row is voice / space / send. Trackpad retains a visible transcript/draft field above its gesture area, shared with keyboard mode. Group current prototypes into application sections with functional subsections; group native transitions by purpose and library sources by role. Remove detached old labels and obsolete hidden input layers while preserving required linked interaction states and editable component sources. Completed: 8 application/global sections, 16 functional subsections, 3 motion sections and 6 component sections. Removed 124 obsolete objects; retained 73 necessary prototype frames. Audit: 67 destinations resolve, no overlapping application sections, no unsectioned main-canvas objects. Reviewed both input modes and the exported native motion.
- Fixed bottom voice correction: keep voice at x=166,y=754,58×58 in both keyboard and trackpad modes. Keyboard keys occupy y=552–746 above the voice/send row. Modes remain exclusive; the bottom voice anchor stays still during switching. Supersedes the preceding lifted voice layout.
- Exclusive input modes: keyboard and trackpad share the same 346×378 viewport. Selecting keyboard lifts draft/voice/send controls above a bottom-aligned keyboard; selecting trackpad restores the gesture surface and mouse buttons. Keep the upper-left segmented switch and editing toolbar anchored. Reuse existing roots and 320 ms bidirectional prototype links, with common layer names for motion matching. Verified keyboard y=608–808, controls above it at y=550, and one visible input mode per root; reviewed keyboard-exclusive.png.
- Compact trackpad workspace revision: reduce the target title to 20 px at y=74, tighten the selected-message/reply stack, and move the shared input section from y=474 to y=362. Editing tools stay above the expanded pad. Put a keyboard/trackpad segmented toggle at its upper left; keep unlabeled left/right mouse keys separate from a centered 58 px voice button. Synchronize the keyboard counterpart and native opening transition. Supersedes the embedded corner entries below. Exported both views and the native transition for visual inspection; the existing keyboard root remains 5:7589, with bidirectional mode switching. Prototype destination audit passed with no missing targets.
- Trackpad spacious-surface revision: editing tools return above the pad. Expand the pad to 346×266 and reserve its bottom 58 px for two unlabeled mouse-button areas, with keyboard on the left and voice on the right. Remove pointer and left/right labels, title/close overlay and the separate bottom input row. Preserve existing keyboard/voice prototype destinations; sync the native opening transition. This supersedes the compact-footer arrangement below. Verified the exported still and 5 fps transition contact sheet; the uninterrupted gesture height increased from 131 to 201 px. Keyboard and voice prototype destinations remain intact. No runtime/device claims.
- Trackpad compact-footer revision: merge six editing tools and the bottom input row into one two-row glass footer. Editing tools use 18 px icons in 48×48 targets without persistent labels. Preserve keyboard/trackpad/voice/send order and bottom-row y=754; increase the pad from 346×160 to 346×190 by reclaiming the separate upper toolbar. Scope is the trackpad view and its native opening transition.

## Current Figma organization — latest complete prototype only
- User chose to retain the complete latest prototype, including required interaction states. Remove duplicate overviews and obsolete views, not the recording/editing/paused/error states used by the prototype.
- Keep main controllers and flows on page 0:1, the three native generative transitions on page 21:6225, and editable component sources on page 2:2.
- Remove duplicate seven-controller overview 11:5506, old transition/handoff overview 11:6267 (their page 2:3), key-pose review board 23:6659, and duplicate final trackpad display 23:10109. The original current trackpad destination 5:7769 remains.
- Remove obsolete unreferenced locked state 5:7336 and generic held-game state 5:10728; six specific held-key states remain. Inspection found no incoming prototype actions to any deletion target.
- Historical URLs below describe prior deliveries; current entry is https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=5-2 and current transitions start at node 22:6227. Local scripts/exports remain provenance, outside the cleaned Figma presentation.
- Game background revision: extend the luminous glass material to cover the entire controller canvas, including the top status row; delete the gold horizontal trim. Applied to ten game states and two review copies; buttons retain their positions.
- Game label cleanup: remove WORLD 1–1 and MARIO × 03 from all game states and review copies; application display name is 超级玛丽 without the FC prefix. Retain pause/disconnect feedback and existing control positions.

## Unified top status and luminous FC material
- All controller views use one top row: status-colored dot, connection status and active application name. Remove the lock button and the separate application row; preserve the application's existing switch action on its name. Disconnected states remain truthful.
- FC retains ivory/charcoal/ruby retro colors and no popups, with translucent gradients, reflected light, glass edging and glossy button highlights. This supersedes the flatter matte treatment of the preceding retro revision.
- Editable revision source: `scripts/figma-glass-status-luminous.js`; exports and ledger: `artifacts/figma-glass/status-luminous-*`.
- Applied to 75 main states, 13 overview/transition copies and 21 motion-page controller copies. Removed all top lock instances and the duplicate standalone connection overlays in global transition frames. The reusable connection component now places its status dot before the text.
- FC luminous treatment is applied to all ten game states and two review copies: translucent warm charcoal plate, reflective directional keys, ruby-gradient A/B buttons and layered light highlights. Game popup removal remains in force.
- Main-state inspection confirms exactly one unified status row per controller and no top lock button. Reviewed WeChat, FC play and disconnected screenshots; strengthened disconnected caption contrast. Current Figma nodes and `status-luminous-*.png` supersede earlier screenshots/MP4s for header appearance. No runtime or hardware changes.

## FC retro revision
- FC uses warm ivory housing, charcoal inset and directional keys, lacquer-red A/B buttons and muted gold trim. Keep subtle specular edges while making the game palette substantially more retro than office controllers.
- No popup or suggestion card in game states. Pause is an inline status and START resumes. Connection loss retains an inline release status and a reconnect action. Existing held/release destinations and key positions remain unchanged.
- Source: `scripts/figma-glass-fc-retro.js`; evidence and node ledger: `artifacts/figma-glass/fc-retro-*`. This is editable Figma design/prototype work only.
- Applied to all ten game states and two overview/rotation copies, with nine editable material color variables. Removed paused suggestions and reconnect card containers. Reconnect remains an inline action; START resumes from pause. Original game key positions and press/release reactions are retained.
- Inspected play, paused and disconnected exports, checked script syntax and game reaction destinations. No popup containers or broken destinations remain in the ten game states. Disconnected indicator is red. No hardware behavior is asserted.

## Deliverable and directory rules
- Figma design file: https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh
- Selected visual: first direction, revised 2026-10-07. Header reads only 已连接; six editing tools sit above the draft field.
- `scripts/figma-glass-*.js` contains reproducible Figma Plugin API construction scripts, not runtime application code.
- `artifacts/figma-glass/` contains the selected visual, public brand assets, construction ledger, screenshot exports and QA records. All generated; keep sources and do not delete private recordings.
- Native Figma text, icon vectors, components and auto-layout must make up the UI. A full-screen raster is never the deliverable.

## Design source and scope
- Seven controller modes and their interaction states; no change to existing Web/Harmony runtime in this task.
- Reuse Hover intent catalog and handoff semantics: `/Users/hmi/Documents/input agent/wechat-point-and-ask/docs/intent-mapping.md` and `app-handoff-logic.md`.
- Material refs: https://dribbble.com/shots/27637405-AI-Phone-OS-thinking-mode and https://dribbble.com/shots/27462283-Generative-Interface-design-for-Agentic-OS.
- Office 390×844; FC 844×390. Voice first; optional keyboard and touchpad; no touchpad in presentation or game.
- Main components: connection, target header, quote, recommendation row, app action, fixed input tools, draft field, voice controls, contextual actions, presentation controls, game controls.
- Shared editable colors, text styles and effects. Discover/reuse existing glass materials; custom control geometry follows the selected design.
- Source font is HarmonyOS Sans SC; unavailable through this Figma connection. Use Noto Sans SC Regular/Medium/Bold as the explicit editable Chinese design fallback. This is not pixel-identical HarmonyOS typography.

## Acceptance
- Every fixed input toolbar remains above its draft, with stable positions across text states.
- Selected-message reply suggestions and contextual app actions; speech/transcript/edit/submit; clipboard/keyboard/trackpad; lock, target change, failure and reconnection.
- PPT: IMU pointing, laser/pen, recalibration, notes, scroll speed, slide navigation. FC: held/paused/released states.
- Prototype links and 320 ms transitions; no private content; fictional example.com contacts.
- Figma actions simulate behavior; they do not prove real speech, AI integration, IMU precision or cross-device execution.

## Delivered 2026-10-07
- Editable overview: https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=11-5506
- WeChat prototype entry: https://www.figma.com/proto/ApFLno64NcMoA17MiPFfZh?node-id=5-2&starting-point-node-id=5%3A2
- Page 01: seven main controllers and 75 total state frames, 390×844 or 844×390.
- Page 02: 82 components, four component sets, semantic colors, text styles and glass effects. Raster images are limited to small original brand assets; no flattened screen images.
- Page 03: seven-mode overview, 0/120/320 ms transition storyboard, portrait-to-landscape storyboard, handoff contract and simulation boundary.
- The first visual direction is applied. Header contains connection status without a device name. All 51 text states keep tools at y=608 and the draft at y=692. Presentation and game have dedicated controls.
- Native prototype contains 596 configured reactions and 15 scenario starting points. Hold/release paths cover laser, pen and all six game buttons. Automatic notes retain a laser-held state and return to their prior speed.
- Handoff draft and formula-result variables keep the selected demo paths consistent. This is a scenario prototype; it is not a freeform text editor or an implemented inference engine.

## Verification evidence
- `artifacts/figma-glass/validation-final.json`: final native Figma structural inspection. Zero clipped texts, broken prototype destinations, interactive targets smaller than 48 px, or large raster UI images were found.
- `artifacts/figma-glass/delivery-state.json`: authoritative screen and hotspot IDs. Earlier ledger files are intermediate construction snapshots.
- `artifacts/figma-glass/overview.png`, `wechat-figma.png`, `motion.png`: visual-review exports. Other screenshots are intermediate evidence.
- Syntax validation passed for all 11 construction scripts. Scripts require the documented Figma Plugin API inputs and saved ledgers; they are source records, not an app runtime or a one-command clean-file installer.
- Verification covers native node geometry, configured reactions and exported visuals. It does not claim every branch was manually clicked in a browser. AI, speech, IMU, messages, third-party tasks and send acknowledgements are simulated.
- No Web/Harmony runtime code was changed; no app build, signed installation or hardware test was performed for this Figma-only task. This workspace currently has no Git repository at its root; no commit or push was performed.

## Toolbar revision
- Trackpad now sits immediately after the keyboard at the bottom: Keyboard 52 px, Trackpad 52 px, Voice 166 px, Send 52 px, with 8 px gaps.
- The sixth top-toolbar slot is now 切换应用, alongside clipboard/copy/paste/undo/redo. It follows each state’s existing application-switch route and input guards.
- Updated all 51 text states, eight review copies and the shared toolbar component. Final visual: `artifacts/figma-glass/wechat-toolbar-v2.png`; current node IDs: `toolbar-update.json` and updated `delivery-state.json`.

## Transition view extension
- Correction from the supplied reference: the trackpad belongs to the bottom input section. In expanded trackpad mode the section begins at y=474, tools move to y=490, and a 346×160 pad replaces the draft area at y=578. The bottom input row stays at y=754. Selected message and two replies remain visible; related app actions are temporarily occluded by the expanded section. Collapsed text mode has an explicit glass section boundary at y=592. This supersedes the earlier middle-screen 346×346 pad.
- Add a dedicated Figma motion page with three original, editable sequences: global app re-materialization, object-scoped generative controls, and a square trackpad opening from its bottom-row entry.
- References are the two supplied Dribbble videos. Reference samples stay in `artifacts/figma-glass/`; they are analysis evidence and are not embedded into the deliverable.
- Source scripts use `scripts/figma-glass-transition-*.js`. Node ledgers, sampled exports and MP4 previews use `artifacts/figma-glass/transition-*`.
- Preserve current keyboard/trackpad/voice/send order. Local generation must not move the fixed input zone. The trackpad settles to a 346×346 glass surface; effects settle before touch interaction.
- Motion timings are original adaptations, not measured copies of the reference. Native Figma keyframes and rendered motion are separate evidence from actual device behavior.

### Delivered transition views
- Page 04: https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=23-6659. Three native Motion frames retain editable layers, material effects and keyframes. Twelve editable key poses summarize the sequences below them.
- Global: WeChat → Email, iridescent caustic glow, expanding refractive glass and theme reconstruction; target settles at about 1.6 s.
- Local: selected spreadsheet chart replaces formula candidates with chart title, chart type, palette and data-range controls; fixed input zone stays at y=608. Controls settle at about 1.3 s.
- Trackpad: bottom-entry light seed grows into a 346×346 glass square with pointer, left/right click and close. Settles at about 1.4 s. Original prototype destination 5:7769 now uses the new completed view; close uses BACK to restore the invoking state. The original prototype navigation retains its 320 ms Smart Animate; the full generation choreography is provided separately in the native Motion timeline and MP4.
- Reference observations: Gleb Kuznetsov’s thinking-mode video around 21–31 s informed the seed-to-tile growth; the Agentic OS video around 31–37 s informed the iridescent refractive material. These sources are referenced, not copied into the design.
- All three native timelines are 2.4 s, including hold time. Final exports are 390×844 at 30 fps; combined `transition-preview.mp4` is 1170×844. The combined file fully decodes without errors. Visual inspection covered diagnostic frame sequences, the final editable storyboard and the updated trackpad view.
- Structural inspection confirmed no animation tracks on the local/trackpad fixed input zones, a 346×346 pad, a 52×52 close target and the retained entry destination. Figma script syntax is checked as async function bodies, matching the tool execution environment.
- Ledgers: `transition-state.json`, `transition-storyboard-state.json`, `transition-integration.json`. Preview exports, diagnostics and reference contact sheets remain in ignored artifacts. This is design/motion evidence only; no device input or AI generation integration was added.

### Bottom-section correction
- Restored the enclosing glass section in all 51 text states and eight overview copies. Keyboard/trackpad/voice/send retain their global y=754 position. Tool order is unchanged; the toolbar rises only during explicit trackpad-mode expansion. Contextual recommendation updates do not move it.
- The trackpad is a child of `Input / bottom section`, below the toolbar. Its 346×160 final shape fits the lower panel. The light seed grows within that panel; the selected quote and both reply suggestions stay visible throughout. Draft is hidden while using the trackpad and the prototype close/toggle uses BACK.
- Updated native Motion root 22:6772, storyboard 23:6659, ready view 23:10109 and original prototype destination 5:7769. `trackpad-bottom-state.json` supersedes earlier trackpad child IDs. Original storyboard root and prototype entry remain valid.
- Current preview: `trackpad-bottom.mp4`; still: `trackpad-bottom-integrated.png`. The earlier combined `transition-preview.mp4` is a historical export containing the superseded middle-screen trackpad. Current Figma page and new trackpad export are authoritative.
- Verified 12 diagnostic frames, the updated prototype screenshot and storyboard. The 30 fps final MP4 fully decodes. Three new Figma script bodies pass syntax checks. No Web/Harmony code, hardware test, or AI integration change is part of this correction.
