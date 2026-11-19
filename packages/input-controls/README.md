# Mobile Input Controls

13 standalone React input widgets, extracted from Xiaoyi Work. The package is available as a local-install npm tarball and as editable source. Text polishing is excluded. The existing application and its deployment are not included or changed.

## Run the standalone example

Use Node.js 22 LTS and npm 10 or later. No Gemini key, account, bridge, backend, or model is needed.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5199. Every widget has a direct URL, for example `/#/color` and `/#/scanner`. Click the inline chip to open its widget. The example keeps data in React memory; refresh resets it. Use the language button for Chinese/English. Reset affects only the current example.

```sh
npm run check
npm test
npm run build
npm run test:browser
```

The browser suite uses installed Google Chrome; if unavailable, install Chrome or change `channel` in `playwright.config.ts` to a locally installed Playwright browser. Build output is `dist/`. Any static HTTPS host can serve it. Camera/screen permissions require localhost or HTTPS; there is no server endpoint to configure. Deployment of this example does not deploy Xiaoyi Work.

## Install the npm tarball

Download the `.tgz` from the top of the compact gallery. Put it in the root
of your React 19 app and use its filename in the install command:

```sh
npm install ./mobile-input-controls-1.2.0.tgz
npx --no-install input-controls-assets ./public/input-controls
```

Install into a React app with React and React DOM 19 and Lucide 0.468.
npm resolves the package's declared peer requirements. Run the asset command
again when upgrading. It copies the bundled icons, artwork, fonts and notices to
`public/input-controls`. Set `WidgetProvider.assetBase` to the URL where your
app serves those copied files (for Vite, `import.meta.env.BASE_URL + 'input-controls'`).
Import `@mobile-input/controls/desktop.css` once. It contains the full
desktop chip, popup, attachment and widget styles, with relative font URLs.

Open **Integrate with React** in the gallery to copy a complete Vite
`App.tsx` with the time chip and its anchored widget. The same code ships in
`examples/react-integration.tsx` inside the installed package. Each of the
13 typed examples is also available under `examples/widgets/` and on the
corresponding gallery card. Use a direct subpath import such as
`@mobile-input/controls/duration-widget` to consume just one widget.
The host owns state, value callbacks, material confirmation and submission.
The shared CSS scopes component styles to `WidgetSurface` and the provided
popup container.

## Maintain the library

Make changes in `src/` and commit matching assets under `public/assets/` or
`public/reference-assets/`. Changes appear in the gallery from the same source.
For a new package release, bump the version (for example
`npm version patch --no-git-tag-version`), run type checks and regression
tests, then run `npm run build`. That build regenerates the tarball and
gallery together. To rebuild only the tarball, run `npm run pack:library`.

Component List uses `compact.html` as its public home. In a copy of `dist/`,
copy `compact.html` over `index.html`, then deploy that directory to the
existing `component-list` Vercel project. Set `VITE_INPUT_CONTROLS_RELEASE_URL`
only for a release page that already exists for the version being built.

Use `XIAOYI_DEMO_URL` with `npm run test:browser -- runtime-parity.browser.ts`
to compare the live desktop composer with the inline and anchored specimens.
The test captures all three for each widget and checks matching selection states.
Both dev and production gallery builds generate the download. Run
`npm run verify:package` to install the archive into a temporary Vite project
and verify the example in Chrome. Give consumers
the new versioned archive, then reinstall it and rerun the asset command.

## Integrate by copying source

Copy this entire folder, or `src/` plus `public/`, into your React project. Install the exact dependencies in `package.json`: React/React DOM 19.1 and lucide-react 0.468. Build with TypeScript 5.8 and a CSS-aware bundler such as Vite 6.3.

```tsx
import {useState} from 'react';
import {WidgetProvider, WidgetSurface, AuxiliaryPanel, DurationWidget} from './input-controls/src';
import './input-controls/src/desktop.css';

export function DurationExample() {
  const [minutes, setMinutes] = useState('10');
  return (
    <WidgetProvider language="en" translate={text => text}
      assetBase="/controls" theme={{accent: '#6266df'}}>
      <WidgetSurface>
        <AuxiliaryPanel title="Duration" onClose={() => console.log('close')}>
          <DurationWidget value={minutes} onChange={setMinutes}
            onDone={() => console.log('confirmed', minutes)} />
        </AuxiliaryPanel>
      </WidgetSurface>
    </WidgetProvider>
  );
}
```

This snippet is also available as a running composition in `example/minimal.tsx` (`?minimal=1`). Supply your translation dictionary: `translate` maps built-in Chinese action labels; `language` selects bilingual choice and capture labels. `example/widget-preview.tsx` contains a small English dictionary. Authored content and filenames are never automatically translated.

Copy `public/assets/` and `public/reference-assets/` to the host's `/controls/` static directory when `assetBase="/controls"`. The two bundled font URLs are relative CSS imports handled by Vite. Original artwork retains its own colors. `public/ASSET-SOURCES.md` records provenance and licensing limits.

## Independent entries

Each entry has exported typed Props; the barrel is `src/index.ts`. You can import a single source file directly to edit one widget without traversing the demo application.

| Widget | Source | Controlled input / host callback |
|---|---|---|
| Duration | `src/duration-widget.tsx` | `value` (minutes, 1–60), `onChange`, `onDone` |
| Color | `src/color-widget.tsx` | six-digit HEX `value`, `label`, `onChange`, `onActive`, `onDone` |
| Font | `src/font-widget.tsx` | `binding`, `definition`, `owner`, `onEvent` |
| Palette | `src/palette-widget.tsx` | same choice contract |
| Reference files | `src/document-widget.tsx` | children or controlled choices; `onChoose`, `onDone` |
| Images | `src/image-widget.tsx` | existing images, pending children, `onChoose`, `onDone`; legacy `onCapture` is optional and ignored |
| Photo / Document Scan | `src/scanner-widget.tsx` | `items`, `onAdd`, `onRemove`, `onConfirm`, optional `adapter` |
| Sketch | `src/sketch-widget.tsx` | normalized `strokes`, `onChange`, `onActive`, `onAdopt` |
| Expert | `src/expert-widget.tsx` | choice contract, single-select definition |
| Skills | `src/skills-widget.tsx` | choice contract, multi-select definition |
| Connectors | `src/connectors-widget.tsx` | choice contract, multi-select definition |
| Output formats | `src/formats-widget.tsx` | choice contract, host-available formats only |
| Screenshot / recording | `src/capture-widget.tsx` | capture contract and injected adapter |

`ChoiceEvent` is `{type:'change'|'close'|'remove', owner, id, value?}`. Hosts validate both owner and binding ID before applying changes. A change callback contains the complete proposed selection, not a delta. `close` means the panel's Done action; it is never task submission. The root panel's close callback can preserve pending values. `ChoiceDefinition.options` is provided by the host; fixture experts, skills, and connectors do not install, authorize, connect, or execute services. `formats` is a preference picker, not an exporter.

## Chips and composition

`InlineChip` and `renderInlineChip` support controlled tokens. Semantic state is independent from origin:

- `needs-input`: no value/material has been bound; neutral dashed edge, entity icon, plus.
- `default-selected`: a concrete available value/name or selected acquisition method; neutral solid edge.
- `ambiguous-recommendation`: unresolved suggestion; blue-purple-pink border and sparkle.
- `object-bound`: an actual file or material is bound. Set the full name in `label` and the number of remaining materials in `additionalObjectCount`. The chip opens the widget and has a neutral solid edge. Manage deletion through the material UI.

`origin` is `explicit | recommended | manual`. It does not infer `semanticState`. Default semantic state is `default-selected` for compatibility; new hosts should always pass it. A selected acquisition method is **not proof that any attachment exists**. Opening a chip does not change its semantic state.

Set `token.removable` and supply `onRemove` to show a separate keyboard-focusable removal action. Per the approved extraction contract, a recommended-origin default value may retain a removal button even with neutral selected styling. This differs from the 2026-11-16 Notion selected-no-cross rule; the host can set `removable={false}` to follow that rule. No removal changes original text or deletes source files automatically.

`expanded`, `disabled`, and `token.preparing` are separate flags. Hover, pressed and focus-visible use CSS. Loading suppresses interaction and exposes `aria-busy`. `animate` plus stable `sweepKey` enables the existing recommendation sweep; reduced-motion disables animation. Retain the component instance/key to avoid replay. `renderInlineChip` can mount in an editor-owned DOM; the editor owns original-text offsets, copying and selection. `preserveSelection` is optional and prevents pointer focus only for that editor use case.

Use `useSinglePanel()` once per composition to keep one active ID, `AnchoredPanel` for positioning, and `AuxiliaryPanel` for chrome. The overlay anchors 8 px below the chip, clamps to viewport edges and scrolls if necessary. Escape closes and restores focus. `portalRoot` can target your overlay container. `WidgetSurface` applies scoped theme variables; `WidgetProvider.theme` also travels to portaled panels. Avoid transformed portal ancestors because fixed positioning follows their containing block.

See the executable composition in `example/widget-preview.tsx`, including a second isolated instance, pending/confirmed attachments, file selection, gallery selection, photo / document scan, sketch and screen material adoption.

## Materials and adapters

The library does not persist, upload, recommend, or Send. Hosts own draft identity, bytes, confirmation, deletion, upload permissions, and cross-draft synchronization. Keep pending captures in the owning draft when panels close, and pass them back on reopen. Discarding a component releases its streams; it does not delete host-owned materials.

```tsx
import {ScannerWidget, browserCaptureAdapter, type CaptureAdapter} from './input-controls/src';
const adapter: CaptureAdapter = browserCaptureAdapter;
// For an authenticated native host, replace openCamera/openScreen with your bridge.
// Each promise must resolve to a real MediaStream; the widget owns and stops it.
<ScannerWidget language="en" adapter={adapter} items={pendingAndConfirmed}
  onAdd={appendPending} onRemove={removeOnlyThisDraftItem}
  onConfirm={confirmPending} onBusy={setCapturing} />;
```

Photo and scan share one camera. Pass `initialCameraMode="scan"` for a scan request. New camera materials record `cameraMode`; older scanner materials are scans. Screen capture opens a light top toolbar. Pass `onCancel` to dismiss the owning popover and restore focus.

Browser adapter uses `getUserMedia` and `getDisplayMedia` only. The browser chooses tab/window/screen; rectangular crop is applied to the returned stream, not to a fake DOM screenshot. Native/freeform system selection is not implemented. Audio is off. Recording is explicit start/stop, maximum 60 seconds, and requires MediaRecorder/canvas capture support. A cancelled or failed acquisition yields no material. Closing or navigating away releases all streams and aborts pending acquisitions; hiding the page releases camera streams, while explicitly shared screen streams remain active so switching to the captured tab works; a late stream is stopped before use. Use `ScannerWidget` in photo mode for new photographs.

Pass a stable `ownerId` to capture, camera, color and sketch widgets, changing it whenever the draft/target changes. These components remount their acquisition/drag/history session on that change. For any composite host state, also use `key={draftId}` and keep pending arrays scoped to that draft. The package cannot infer a new owner from changed callback functions.

`CaptureMaterial` carries `id`, `kind`, `name`, `blob`, `size`, optional `duration`, and `confirmed`. `onAdd` emits actual bytes with `confirmed:false`; `onConfirm` asks the host to adopt. `AttachmentCard` and `CaptureTile compact` display compact removable materials. `SketchWidget` uses normalized points in [0,1]; geometry helpers preserve scale and bounded undo. Hosts choose their final image format.

## UI-only handoff for Gemini

1. Read this README and `AGENTS.md`. Start with the widget source listed above and `src/desktop-visual.css`; use `src/library.css` for the new chip states and package-level presentation.
2. Preserve controlled values, owner/ID callbacks, pending versus confirmed materials, stream cleanup, keyboard behavior, and `semanticState`/`origin` separation.
3. Keep CSS under `.input-controls-theme`. Do not edit application directories, network APIs, parsers, storage, task execution, or the old `packages/ui` library to restyle these widgets.
4. Preserve original logos, avatars, artwork and user-selected colors. Theme settings affect control accents, not content pixels.
5. Try each change in the per-widget preview. Check both languages, narrow windows, keyboard focus, long names, open/close, reset, confirmation and cancellation. Run check, tests, browser suite and build.
6. Consult `DESIGN-SOURCES.md` for authoritative references and known differences. Do not invent missing product capabilities from a Figma state.

The library has no Gemini integration to configure. If the host uses Gemini, keep its key and service calls in the host/backend; never add credentials to this package or public browser assets.

## Single-page Xiaoyi Work library

Run `npm ci && npm run dev`, then open **http://127.0.0.1:5199/compact.html**.
All 13 interactive widgets are on one page. Direct links such as
`/compact.html#/duration` scroll to that card. The same showcase builds at
`apps/design-system/xiaoyi-controls.html`.

Each card has a standalone widget expanded by default and independent chip
examples for Needs input, Selected, and Recommendation. Selected shows the
resolved value or the name of the confirmed material. The prefilled material
examples include local files. Selecting a document updates the chip immediately.
Photos, scans, drawings, and screen materials update it on confirmation.
Opening a different chip closes the previous floating panel.

Expand **Source & usage** to download the exact component TSX file, view its
source, or copy its typed example. The TSX file uses the library's shared code,
stylesheet, and assets.
The snippets under `example/integration/` are checked by TypeScript. They use the
package's direct subpath exports. Install the tarball as described above to use
the `@mobile-input/controls` imports. For a
source-copy integration, replace those imports with the corresponding local
`src/` paths. Import the desktop stylesheet, configure WidgetProvider with
your language and assetBase, and use WidgetSurface for the theme scope.
The earlier developer playground remains at `/` with its original state tools.

`example/intent-spec.json` remains the derived source snapshot of the
[GenUI specification](https://www.figma.com/slides/ANhVxJPGEgYRcISFmQmgyg),
including all 325 bilingual intent examples. It can be regenerated with
`python3 scripts/extract-intent-spec.py /path/to/alignment-final-export-text.json`.
