# WorkBuddy auxiliary widget fidelity — 2026-11-03

Implementation/verification record; Figma remains the visual source, Notion the behavior-rule source. No standing local Design mirror.

## Reference and changes

Source: https://www.figma.com/design/ApFLno64NcMoA17MiPFfZh?node-id=2316-110521

Read current section and child frames 1372:25571, 2164:57048, 2164:57530, 1646:11696, 1372:25846, 15:5743. Read canonical Notion Design. No Figma modification.

- Shared color widget: 288 px panel, five role-specific exported swatches, 72 px horizontal tonal ramp, 48 px hue hit target, HEX/current color and 48 px confirmation. Theme/background/text are separate roles; content colors never change interface theme.
- Photo widget: 230 px panel, 100×96 preview tiles, horizontal overflow, local removal, album/camera/confirm footer. Actual user assets remain dynamic; reference example pictures are not injected into drafts.
- Layout widget: normalized 328×192 surface with pen, eraser, undo, clear, confirmation below. Exact exported tool icons, 1.5 px theme strokes. Eraser splits intersected strokes; undo restores a whole gesture. Preview/export uses the same aspect ratio. Initial canvas stays empty.
- Shared demo/Mac components; native gallery/camera use existing bounded picker. Selected attachments stay local until explicit Send.
- Removed legacy expanded-dock 170 px flex override that compressed widgets and caused overlap. Short screens scroll the middle workspace without moving the fixed dock.
- Composer thumbnails retain local removal and common sizing. No change to AI-polish actions or InputDock internals.

Assets: reference/workbuddy-widget-assets.json records 21 exported SVG sources and hashes. Source lives in apps/web/public/reference-assets/workbuddy-widgets/. Private reference captures and device evidence live under ignored artifacts/figma-widget-fidelity/.

## Changed implementation files

AGENTS.md; apps/web/src/agent-input-view.tsx; agent-widget-color.tsx; phone-live-workbuddy.css; phone-live-workbuddy.tsx; web-deck-composer.tsx; mac-materials.ts; apps/harmony/shared/NativeBridge.ets; packages/core/agent-sketch.ts and agent-sketch.test.ts; tests/workbuddy-widget-fidelity.spec.ts; tests/inline-parameters.spec.ts (await editor readiness rather than race staging).

## Verification

- TypeScript check and production Web build passed. Existing bundle-size warning remains.
- Core suite: 208 passed.
- Browser suites: inline parameters, live WorkBuddy, native deck mocks and widget fidelity: 14 passed. Final visual retest recorded separately after thumbnail polish.
- Viewports 390×844 / 390×700: collapsed, keyboard and trackpad; exact dimensions, all palette images load, colors isolated, album/camera picker branches, erase/undo, no attachment transfer before Send, no widget/composer overlap, confirmation/voice/send reachable by middle scrolling.
- Inspected screenshots against reference: primary/background/text, photos, blank/drawn canvas. Browser photos use existing non-private product fixtures. No claim of whole-screen pixel identity: task names, draft, selected images and strokes are live content; native typography/safe areas require device observation.
- Native compilation and installation results appended below. No real Gemini invocation or Mac task submission in this visual revision; browser native mocks do not prove camera capture, physical stylus latency or disconnected generation.

## Signed build and installation

- tablet: MRDI-W10; generation `1793741444330`; SHA-256 `c514387194e432dce4c8d27c7645b2c85d710f23d1bdf1bd58b4999f1d96e67c`. Upgrade and EntryAbility launch succeeded. Package: `artifacts/hap/tablet/entry-default-signed.hap`.
- phone: SUP-AL90; generation `1793741444330`; SHA-256 `84b9f0990753805df627dd0530d8d2d2dc67f74d768b6f93a2c26e72de7c9ee3`. Upgrade and EntryAbility launch succeeded. Package: `artifacts/hap/phone/entry-default-signed.hap`.

Both roles built from the same Web snapshot/generation. No uninstall or native credential reset. Startup screenshots and install/launch logs saved in `artifacts/figma-widget-fidelity/device/`.

Device observation: distributed discovery found the installed tablet; reconnect succeeded. Phone authority shows WorkBuddy, connected Shino-MatePad Pro and current draft/task strip; tablet shows WorkBuddy new-task home. Evidence: device/phone-ready.json and .png, tablet-workbuddy.json and .png. Stopped without entering user text or submitting. Actual native camera capture, continuous touch drawing and Gemini generation remain unverified in this visual revision.
