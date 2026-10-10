# Adaptive Input Design System

## Delivery

Editable design-only library in Figma file `ApFLno64NcMoA17MiPFfZh`, page `2:2`. The approved scope includes Glass and Mechanical skins, eight application themes, phone and fold-PC lower-screen layouts, component states, motion examples, and a future rendering contract. No application source, device protocol, real model connection or Code Connect implementation is included.

Page sections: foundations; actions and parameters; text and contextual controls; dedicated panels; game; phone recipes; fold-PC recipes; decision/rendering contract; transitions. Component masters and existing referenced sources occupy separate dependency sections. The original application screens on other pages remain unchanged.

The component registry is `samples/adaptive-component-registry.json`; four fictional input-plan examples are in `samples/adaptive-ui-plan-examples.json`. The exact Figma construction ledger and validation artifacts are under ignored `artifacts/adaptive-design-system/`. Construction scripts use the `figma-adaptive-` prefix under `scripts/` and are not runtime application code.

## Foundations and interaction

- Skin and application theme are independent. Figma `Skin` variants choose materials; the `Adaptive / Application` collection chooses accent and soft background. Theme order: WeChat, Email, WorkBuddy, Word, Sheet, Presentation, Doubao, Mario.
- Existing Mobile Input palette primitives, Noto Sans SC fonts, icon components and Glass effect style are reused. New semantic colors alias primitives. New spacing, radii, sizes and feedback variables have scoped properties and CSS code syntax.
- Ordinary touch controls have 48 px targets; primary controls 56 px; hold-to-draw 168 px square. Phone alphabet keys are the documented dense-layout exception (32 px nominal width, at least 48 px high); wide keyboards distribute additional width rather than scale height. The three-row compact pen panel exposes the complete color row as one 152 × 48 target; its expanded palette offers five separate 48 × 48 targets.
- Selected and pressed are distinct. Selecting a pen does not imply drawing. Only the held drawing state uses deep red `#A52D20`; release or pointer exit restores its light state. Runtime implementations must also cancel on background, disconnect, app/target/slide change.
- Composer belongs to its target. Inline AI polish stays within it; sketch input uses a compact single line. Keyboard and trackpad are exclusive modes on phone and fold PC. Voice controls retain their position across the recommendation/recording/polish sequence.
- Phone reference size: 390 × 844. Fold-PC lower-screen reference: 1280 × 480 logical pixels, not a claim about a specific device. Header, contextual area and input panel adapt their layout separately. Native safe areas are supplied by the implementation; no OS clock or gesture bar is drawn.

## Future model-to-UI contract

The registry is a design handoff contract, not an implemented renderer API.

Context contains application, task, source/target ID and revision, input phase, device posture, capabilities and an interaction lock. The decision result chooses task, input mode, component/template IDs, relative priority and whether to preserve the layout. A separate generation step supplies text, formula or summary values only when required.

The local renderer owns drafts, theme lookup, layout constraints, continuous touch, voice capture, files, camera, pointer/IMU and game state. It accepts registered component IDs, legal states and declared properties/actions only. A target-version mismatch discards a result. Missing capabilities hide or disable the corresponding action with a usable alternative. Failed, refused or uncertain decisions preserve the current working input surface. Confidence thresholds must be calibrated on representative Chinese tasks before runtime use; the design does not invent a universal threshold.

Interaction locks take precedence over a new UI plan. During recording, drawing, dragging or held game input, new adaptive results can be queued, but fixed controls cannot move. A layout update is applied only after release and after target/version validation. Suggestions never execute third-party operations merely because a model selected their controls.

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

Final review: 48 component sets, 270 variants, 8 application modes, 16 device examples and 6 supplemental editable icons. All prototype destinations resolved in the final link audit; all 10 original library roots remain preserved. Render review covered all boards, with final corrections to ambient light opacity, game keys, camera/editing icons and full trackpad preview bounds. These are Figma structural/render checks, not live device tests.
