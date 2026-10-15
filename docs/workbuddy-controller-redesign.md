# WorkBuddy controller redesign · 2026-10-14

Current rule: no phone modification-preview or Apply screen. Text polish changes the bound text directly and supports Undo; object instructions use the sole composer and explicit submission, with results on PC. The original screen counts and layout below are historical delivery evidence, not the current generation contract. Current rules are in `adaptive-input-design-system.md` and the Notion Design Skill.

## Scope and file convention

Design-only revision of Figma page 0:1 / section 109:5262, grounded in the linked Mobile Input Agent PRD (page 3f9194db24c381bf8b76c804062303e3, edited 2026-10-14). Scripts use `scripts/figma-workbuddy-*.js`; generated evidence and node ledgers use ignored `artifacts/workbuddy-design/`. No application source, protocol, native capability or cloud integration changes.

## Source interpretation

The PRD is a working draft. Its explicit Roadmap PPT story drives the design: voice requirements, red theme, left/right sketch, cumulative review and submission, task switching, explicit approval, return to the original artifact, point-and-speak modification. This design chooses a single adaptive workspace with a persistent input dock. Detailed controls and the fictional invoice branch are design proposals, not newly approved runtime requirements.

Task identity, focused field and selected object remain independent. Application switching is separate from task switching. Background requests do not steal the active task. Text, theme and sketch accumulate into one request. Direct field input, local draft insertion and Agent requests have distinct submission semantics. Drafts belong to their task; drawing, voice and drag lock their target. A result is applied only to its source target/version, and an approval request is consumed once.

## Composition

Phone size 390 × 844. Reuse Noto Sans SC, existing glass effects, WorkBuddy teal and input components. Keep one status/application row. A compact task title doubles as the task-list entry. Contextual cards occupy the upper region; normal editing tools, draft and voice remain anchored in the lower region. Expanded keyboard and trackpad occupy the same slot; composer stays above the input-mode selector. Sketch has a compact composer and large canvas. Approval/material states prioritize their required controls. No Fold PC samples in this revision.

Original key-view categories (superseded by the latest canvas): task composition, sketch, accumulated review, running, task switcher, requested material, approval, object/trackpad, keyboard. Recording, paused, completion and unavailable states are component variants, not duplicate presentation screens. Existing six WorkBuddy frame IDs are retained for incoming prototype links; other application sections are unchanged.

All camera, voice, gestures, Agent processing, task routing and approval results are Figma simulations. Drawn sample layout and invoice data are fictional. Real file upload, external writes and dynamic model behavior are not claimed. No automatic Notion write, Git commit, push or deployment.

## Historical delivery evidence (superseded layout)

- Figma key-view section: `109:5262`, moved to x6400/y100 to give 10 phone screens room without moving other app sections.
- Existing entry frame: `5:8435`. All six original WorkBuddy frame IDs remain.
- Component set: `1286:6160`, 29 task/input/support variants. Ten visible key views; auxiliary states stay in the variant set.
- Prototype wiring covers cumulative task review, submit/running, pause/continue, explicit task switch, sample material selection, approval/rejection, return to object editing, keyboard/trackpad switching, and explicit object-instruction submission. Attachment selection retains PPT task ownership; invoice material belongs to its separate task.
- Rendering inspection fixed the task-list return action's overlap with the dock. Fonts read back as Noto Sans SC. Final structural audit: 10 main frames, 29 variants, 544 reactions including inherited primitive feedback, zero missing destinations and zero reported layout overflows. Eight neighboring application sections retain their original bounds.
- Prototype data are fixed samples. Component switching does not prove persisted multi-task drafts, real execution acknowledgments, arbitrary drawing, native input, automatic target locking or device behavior. Continuous sliders, text editing and backend actions require runtime implementation. Full interactive playback/device acceptance has not been performed in this design revision.
