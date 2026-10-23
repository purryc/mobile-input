# WorkBuddy task paths and PPT selection editing

Status: design implementation, 2026-10-19. Figma `109:5262` is the editable delivery; application code and transport are outside this change. This document supersedes historical phone preview/review/apply branches for this flow.

## Structure and ownership

Organize the canvas as 00 application/task entry, 01 create Roadmap PPT, 02 edit that same PPT, and 03 receipt aggregation. Parameter editors are optional branches of task creation. They are not mandatory sequential steps. Use the same task name, 票据汇总, throughout; its only material actions are 拍摄票据 and 添加文档. Do not restore the deleted screenshot-flow frame.

Application → task → file → object/selection → operation is the navigation hierarchy. Application switching remains the existing top-right action beside connection: candidates appear on the large screen and commit after 1200 ms idle. Task cards directly select tasks; New creates a neutral draft. Entering WorkBuddy without an editable target does not activate a phone composer. Explicit large-screen focus activates the bound phone input. Switching retains task-owned drafts, parameters and materials and never sends them.

## PPT continuation

Open Roadmap.pptx from its large-screen result; the phone trackpad is already expanded. Point to slide 3, select its title or a text range, then edit that exact target. Manual editing leaves the Agent task completed; it is distinct from a new AI operation.

The phone selection toolbar contains bold, italic, underline, strikethrough and link, with 48 px hit targets and unselected/selected/mixed/unavailable states. There is no separate AI-edit button: the fixed smart-voice entry starts selection-bound instructions. Color displays the actual text swatch and opens the existing picker, updating immediately without Done. Size is an inline minus / current pt / plus stepper (32 pt demo, 1 pt per action; mixed values show an em dash). Left/center/right alignment is always visible, with left selected in the sample and real paragraph state authoritative. Color and size share one row; alignment has its own row. Picker temporarily replaces these controls, keeping the target and trackpad stable. Do not include inline code for PPT. Maintain the large-screen selection while using phone controls.

Deterministic formatting changes only the valid target style, is undoable, and does not send, execute or save automatically. Link has top-right Close and bottom-right Confirm; adoption changes the link only. Invalid, read-only or stale targets cannot fall back to all text. Ordinary text editing shares the active field and has no artificial Send.

Smart voice opens the sole compact composer for an instruction addressed to the pinned selection. The example instruction is 改成季度增长路线图，简洁一点. Explicit Send starts that operation; recording stop never submits. No permanent composer, phone review, before/after or Apply screen is generated. Input panel and voice position remain fixed; compact content scrolls before controls overlap. Alignment targets the paragraphs containing the selection, never the entire document.

### Selected-text view revision — 2026-10-19

Deliver two separately linkable 390×844 frames in the existing WorkBuddy section: 文本选区 · 常用格式 and 文本选区 · 颜色调整. The existing paired view shares their phone masters. Basic formatting, color entry, font stepper, alignment and picker each have a named Frame wrapper with editable component instances. Existing AI-instruction frames are renamed to voice-instruction states and their entry links move to the fixed voice button. Color/size/alignment and speech in Figma remain design simulations; native format readback, selection identity and real speech execution require separate development verification.

## Design and development evidence

- Figma covers entry, optional parameter branches, PPT selection formatting, AI instruction and independent receipt requests.
- Existing code has partial object pointing/style controls and large-screen text formatting; these do not prove complete phone selection editing.
- Development TODO: synchronize selection identity and versions, read native format/mixed states, dispatch selection-scoped formatting and undo, implement link editing, complete bound AI edit and cross-app return, then verify on both devices.
- Verify 390×844 and compact-height layout, only one composer, unchanged 288 px input panel, fixed voice, reachable Send/Close/Confirm, task isolation and valid prototype destinations. Figma simulates speech, pointer selection and Agent output.

## Delivery index

- Application switch / unfocused / new-task entry: `1801:13253`, `1801:13648`, `1801:13915`.
- Paired result / object / text selection / AI instruction: `1372:26398`, `5:8847`, `1801:15147`, `1801:15658`.
- Receipt request / recording supplement / ready supplement: `5:8710`, `1646:11984`, `1646:12329`.
- Format toolbar: `1794:47008`; link editor: `1794:47009`; paired interactive family: `1799:51154`; compact 390×700 AI layout: `1807:52735`.
- Selected-text standalone frames: `1862:23247` (常用格式), `1862:23839` (颜色调整), both 390×844. Their clipped phone viewports reuse the paired component family, retaining the same format, color, link and voice routes.
- Selected-text library section: `1857:87586`; common formatting: `1858:85046`; current-color entry: `1857:87603`; picker: `1857:87609`; font-size states: `1860:86948`; alignment states: `1857:87767`. Compact 390×700 sources: `1864:87382` / `1864:87856`; compact picker: `1864:87355`.
- Prototype coverage: preset color updates the bound swatch and HEX; size steps by 1 pt across the 24–40 pt demonstration states, with a separate mixed-value state. This sample range is not a product limit. Continuous custom color/HEX typing, native target readback and speech remain development work; the design does not claim working device behavior.
- Selection-format evidence: `artifacts/workbuddy-selection-format-2026-10-19/`. Standard and compact screenshots were inspected; the paired family’s 444 node destinations resolved at the time of this revision. Compact picker keeps its header/Close fixed while the color controls scroll; the 368 px dock remains unchanged.
- Design Skill and PRD each contain the matching “WorkBuddy · 应用、任务与 PPT 后续编辑（2026-10-19）” section. Old deleted compact-frame references were replaced with the current path.
- Evidence screenshots: ignored `artifacts/workbuddy-task-paths-2026-10-19/`. Main canvas remains at its original section position; Bilibili was moved below the taller section solely to avoid canvas overlap, without changing its contents.


### Result-entry trackpad correction — 2026-10-19

Opening a WorkBuddy task result on the large screen already expands the phone trackpad. `1372:26398` / phone source `1796:47111` uses the shared 368 px expanded dock at y476, including the current dotted gesture surface. The middle target region contracts to 320 px. No extra expand step precedes object selection; tapping a mode control must not select an object. Result opening itself does not submit or rerun a task.
