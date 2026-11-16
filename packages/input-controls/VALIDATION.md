# Validation — 2026-11-16

This table identifies runtime checks, not additional design rules. All 13 widgets have three semantic chip states, independent provenance, open/close, keyboard operation, disabled/loading previews, reset, current values and local event output. Bilingual layouts were checked at widths 1440, 1280, 1024 and 800 px. Old catalog entries and A2UI availability are retained separately.

| Widget | Interactive checks |
|---|---|
| Duration | increment/decrement, controlled number, Done, second-instance isolation |
| Color | initial blue remains blue on opening; presets; HEX synchronization; red/blue/black/white/gray math |
| Font | candidate selection and visible font preview; controlled return value |
| Palette | actual swatches, controlled selection and Done |
| Reference files | real local bytes, long name, compact card, confirmation, preview/download and remove |
| Images | local selection, pending state survives close, explicit confirmation, preview and remove |
| Scanner | imported image, real-stream adapter preview, crop/review entry, confirmation, denied permissions and stream cleanup |
| Sketch | scaled coordinates, stroke drawing, undo, clear, adoption and reopening |
| Expert | original avatars, single choice, search/no-match and Done |
| Skills | original artwork, multiple choices and Done |
| Connectors | original logos, multiple choices and Done; no authorization/service calls |
| Output formats | seven original colored icons, multi-selection and Done; no export execution |
| Screen capture | real video-frame screenshot and MediaRecorder bytes using synthetic browser test streams, explicit start/stop, confirmation and stream cleanup |

Additional regressions cover non-submitting buttons inside form integrations, stable chip DOM while switching popovers, recommendation removal without opening, reduced motion, owner changes while a camera promise is pending, React StrictMode, and an external host portal with theme and focus return. Styles and assets are namespaced so the old Design System specimens remain unchanged. New previews were compared with standalone rendering and original source-panel captures; the original demo files were not modified.

Validation boundaries:

- Browser media tests inject canvas MediaStreams; real hardware, OS permission prompts and another user's camera are not claimed as tested.
- Native capture scope/freeform tools, microphone capture and agent/model execution are outside this package.
- File, capture and selection ownership/persistence are host responsibilities. Examples use isolated in-memory state and fictional catalog data.
- The extracted two-column capability presentation is preserved; a later three-column Figma revision is documented in DESIGN-SOURCES.md, not silently treated as implemented.
- Duration/color/choice/sketch core panel dimensions and styling are retained. File/scanner/capture example heights can differ with content and the standalone capture adapter; semantic chips intentionally use the new three-state contract.

Verification commands and test sources ship in this package. The repository also runs its core tests, existing Design System tests, browser visual-parity checks and production builds. Claude CLI performed read-only architecture reviews; issues found were fixed and checked with targeted regressions. Release commit and ZIP SHA-256 are supplied with the release.
