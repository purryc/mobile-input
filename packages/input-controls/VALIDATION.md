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

## Compact Xiaoyi host follow-up

The separate `compact.html` host follows the final 31-page spec's 13-control order
and 325 bilingual examples. Its selected chips have no ×; unresolved recommendations
have a sparkle and independent remove button. Materials require real confirmed
content before the compact preview can show Selected; empty materials return to
Needs input. Example text is reference content, not recognition coverage.

Validated: all 13 entries in Chinese and English, state switching and keyboard
removal, local file bytes/last-file removal, choice clearing, duration changes/reset,
single preview after navigation, widths 1440/1280/1024/800/390, independent website
entry and full-site preservation. Original 28 widget browser regressions passed.
Claude CLI read-only review identified two host state bugs, both corrected; follow-up
reported no remaining blockers. No new camera/hardware acceptance is claimed.

Current implementation limits (media videos, file sources/types, camera-video,
duration units and font availability) are disclosed per entry. This follow-up does
not add automatic intent matching, model calls, generation or publication.

## Actual desktop-host parity correction

The first extraction missed the host's `.workbuddy` button/input foundation.
The source's standalone widget showcase also missed that dependency, so comparing
to that showcase did not catch native outset button borders. Acceptance now uses
the **actual Xiaoyi composer** at the original demo entry, not its widget gallery.

`desktop-foundation.css` carries the scoped host baseline before specific widget
rules. It restores borderless duration actions and control typography. Follow-up
checks covered all 13 initial popovers and their descendant controls; header
centering, sketch toolbar alignment, empty image height and empty capture-action
spacing were corrected. Heading widths may differ with the spec's labels, and
CSS `rgba` / `color(srgb ...)` strings may express the same themed color.
The bundled font bytes were checked identical to the source demo (aliases differ).

`XIAOYI_DEMO_URL=http://127.0.0.1:5298/ npm run test:browser` adds a direct
source-vs-library duration regression for internal button, input, unit and confirm
styles plus increment/decrement/confirmation. Run the original demo read-only in
an isolated browser context; no task submission is needed. Evidence is kept in
`artifacts/design-system/xiaoyi-controls-lite-2026-11-16/qa/runtime-parity.json`.

## Single-page component showcase

- Package and Design System type checks, core tests, and production builds passed.
- Browser checks cover all 13 live cards and per-widget source snippets, legacy
  playground compatibility, bilingual accessible names, four material chip
  states, singleton positioning, long filenames, and 390–1440px layouts.
- File selection and previews used real local bytes. Scanner import and sketch
  adoption were exercised in the browser. Camera and screen capture regression
  used injected browser streams; physical capture was not part of this check.
- The time stepper's computed styles match the actual independent Xiaoyi Work
  demo. Current compact page captures are under the existing lite QA directory
  in `single-page-acceptance/`.
- Claude CLI reviewed the change read-only. Follow-up fixes covered announced
  chip states, translated accessible names, self-contained typed examples,
  transient-material cleanup and sample-byte integrity.
