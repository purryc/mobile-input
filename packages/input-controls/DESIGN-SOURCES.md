# Sources and evidence boundary

Extracted source: `purryc/mobile-input`, `codex/workbuddy-web-demo`, commit `2c7c4282bf3bd9576773d4e7161fd0fb32999fe2`.
Retained older library/site baseline: `codex/design-system-components`, `5b32cf2` (packages/ui and apps/design-system only; no application caller refactors).
Integration baseline: `main`, `e386c725500f9dfe57feba2d50f59fa982b66e95`.

Live design references read on 2026-11-16:

- Canonical rules: https://app.notion.com/p/3f9194db24c38165996cf89b22e7d69e
- Three semantic chip states: https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=2732-138947
- Desktop Xiaoyi scene: https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=2609-121577
- Desktop composer master: https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=2607-117448
- Compact widget variants: https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=2632-129887

This release preserves the extracted widget look and adds explicit chip semantics. It is not a wholesale implementation of every subsequent Figma revision. Current extracted capability grids use two columns and compact descriptions; newer desktop design specifies three columns. Native capture presets/freeform scope/microphone are not implemented in the browser adapter. Existing design camera states are not proof of real hardware acceptance. Screenshot/recording here uses actual browser streams with rectangular crop; no Xiaoyi API and no synthesized screen output.

The Component List reference-file picker starts with a single local-file action. The original desktop demo also offers a built-in document. In the library showcase, selected files come from the user, and each occupies a removable list row.

Chip visual contract: 32 px height; 15/22 text; 8 px horizontal padding, 6 px gap; 18 px entity graphics and 14 px sparkle; 9 px radius; neutral #D5DAE1 edges; ambiguous gradient #6288F5 → #8C68E8 → #D878B6. Open/focus/pressed do not change semantic state. User-approved extraction retains an optional independent remove action for recommended-origin selected values; latest Notion selected-no-cross differs. The host controls `removable` explicitly.

Validation covers library behavior with fictional local material and browser-controlled synthetic media streams. It does not authorize or execute agents or prove real camera permissions on another machine. Browser native permission dialogs, OS capture choices, and camera hardware remain environment-dependent.
