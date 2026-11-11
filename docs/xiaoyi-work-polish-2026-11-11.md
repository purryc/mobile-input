## Compact restore icon / 轻量回退图标

The user clarified that redo means restoring the original. A trailing icon with the label Restore original now replaces the Undo polish chip. It appears only after a changed result and disappears after restoration. Existing protected values and material ownership are unchanged.

# Inline contextual polish / 输入框内动态润色

小艺Work 精简版复用现有润色组件：正文下方、底部按钮上方显示“AI润色”与适用的“整理结构／精简表达”。停止录音、转写稳定约 400 ms 后推荐；键入、粘贴和选区稳定后同样适用。明确点击才调用 Gemini，直接回填，可撤销，不发送任务。

This release adds a same-origin polish endpoint using the existing server-only Gemini key and text model. It preserves parameter anchors, manual values, page scopes, negative constraints and attachment ownership. Selection-only requests rewrite the selected span. Pending requests are cancelled on text/parameter/selection changes, voice restart, draft switch, backgrounding or unmount. Late responses cannot overwrite a newer owner or draft.

The standalone dependency closure includes the browser lifecycle, shared presentation components, pure action/protection contracts, server route, tests and the English setup guide. No database migration, new credential, native bridge, Figma edit or change to main is required. Optional `AgentComposer.afterContent` defaults to no content, preserving other callers.

Validation: repository TypeScript/core tests, three service contracts (including emitted ESM import under plain Node), prior browser regressions and seven new polish/viewport cases. Chinese/English home and result views checked at 1440×960, 1280×800 and 1024×768. Browser tests use mock responses, not paid model calls. Physical microphone/camera and fresh real-model quality are not claimed. See `design-qa.md` for visual comparison and the English README for use and deployment.
