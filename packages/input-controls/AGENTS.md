# Local scanner revision

- Develop local 1.8.3 from the released 1.8.2 controls. Keep live and frozen scanner frames in the same viewport. Retake replaces only the pending image after success; the host adopts on confirmation.

# Input controls source library

- `src/`: independent React views, props, geometry, styles and optional browser capture adapters. No imports outside this package.
- `public/`: original UI assets and font licenses; preserve artwork colors and source attribution.
- `example/`: executable local state adapters and fictional choices, never a production service.
- `tests/`: interaction and boundary contracts. Build output goes to ignored `dist/`; QA evidence stays in root artifacts.
- Exactly 13 widget kinds. No text polishing code, demo API, storage, bridge, model or task execution.
- The host owns values, adoption, owner identity, persistence and Send. Capture only on explicit action; stop all streams on close/unmount.

## Compact showcase
- example/compact-library.tsx and compact-library.css provide a single page of 13 independent live cards and shared panel coordination; intent-spec.json is a derived snapshot, not a new editable design authority.
- scripts/extract-intent-spec.py reproduces the snapshot from the final export path supplied as an argument. Preserve all 325 examples and support markers.
- Material examples use actual local bytes. Keep sample fixtures and typed integration examples under example/. The compact page labels the additive object-bound token as Selected and shows actual materials in its selected examples. Existing consumers keep their token contracts.
- Each compact card shows an expanded, operable widget beside its chip examples, with its own sample state. Offer a direct download of the displayed component file.
- Existing WidgetPreview defaults remain unchanged. Compact display options only affect the new host; runtime widgets remain controlled.

## Installable npm distribution
- The source of truth remains src/ and public/{assets,reference-assets}. Rebuild the versioned npm tarball from these directories when a widget, chip, stylesheet, or asset changes.
- The tarball includes compiled ESM, declaration files, editable sources, all desktop CSS, public artwork/fonts, and an asset-copy command. Keep React, React DOM and Lucide as host peers.
- Build artifacts go to public/generated/input-controls/ and are ignored; never recursively add generated downloads to the tarball. The compact page ships a download and copyable install and React examples.
- Verify the tarball by installing it in an isolated React host, importing its public entries, type checking and building the host.

## Xiaoyi desktop visual parity
- Keep readable widget descriptions in normal page flow. Clip the decorative composer backdrop to the live panel’s rounded bounds, including after responsive reflow.
- Compare Component List with the running Xiaoyi Work desktop composer using the same widget state, values and viewport. The translucent panel, its background context, and inner cards are separate parts of the comparison.
- Keep preview backdrop and sample data in `example/`. Shared panel, list, and canvas styles belong in `src/`. Use fictional local file bytes and keep attached-file actions in the example's owning draft.
- Keep parity screenshots and release checks under the existing ignored Design System artifacts. Publish the verified compact build and versioned tarball to the existing Component List Vercel project.

## Media acquisition
- Gallery selects existing images. Camera photos and document scans share one camera session with explicit modes. Screen capture uses a light top toolbar over the selected source; crop coordinates are relative to the displayed source frame. Acquisition, adoption and sending stay separate.
- Center the camera shutter below the viewfinder in both photo and scan modes. While waiting for the camera, center its status inside the viewfinder and show alignment guides when the frame is ready.
- Opening a camera chip with known intent starts its viewfinder immediately. A passive catalog card waits for a mode selection. Switching photo/scan reuses the stream. Existing images enter through Gallery.
- A user-opened screen chip carries an optional explicit screenIntent (screenshot or recording). Resolved intent opens its workspace directly; an unspecified intent keeps the chooser. Starting a recording and adopting its result require separate user actions.
- In the document picker, adopted rows and attachment cards remove the same owner-scoped material ID. Removing a sketch attachment preserves the editable canvas.
- Adopted materials expose a visible remove action with the picker closed. The named material chip and each attachment card remove only their displayed material; keep recommendation dismissal separate.
- The reference-file entry and standalone document example start empty. Only files the user adds appear in the document list. Each adopted file has its own always-visible trailing remove button. Keep media thumbnails for Gallery.
- FontWidget defaults to ten named Windows families. Keep family IDs usable in CSS and preserve host-defined choices. Store only rendered phrase specimens in public/assets/xiaoyi-work, with the samples and sources recorded in public/ASSET-SOURCES.md.

## Local Lumina review
- The local review skin uses Lumina morning-frost materials. Preserve desktop widget dimensions, source graphics, ownership and interaction contracts. Source-app parity covers structure and geometry. Compare the new materials between inline and anchored library instances.
- Use the supplied Lumina OpticalChip morning-frost implementation as the pixel and motion reference. Compare at 32 px inline and 38 px specimen sizes in both surface contexts. Match the original timelines, preserve host actions and editor selection, and honor reduced motion. Local reference code and review evidence belong in the existing QA directory.
- Store local before/after screenshots and the recorded flow in the existing compact QA directory. Keep the 1.7.1 production deployment separate from this local review.

## Mixed composer review
- Use the mixed product-introduction sentence at the top of the compact gallery. Place expert, skill and connector chips together below the prose, inside the same composer, preserving their individual selection states. Only simulated unresolved recommendations enter the replayable preparing animation. Fade recommendation pigments by 15%, preserving text contrast.
- Show a separate bound document specimen backed by real bytes. Empty document entry points stay empty.
- Use a common Reset / Confirm footer across the 13 controls. Reset is scoped to this control; confirmation follows the control's material/adoption contract. The duration control supports seconds, minutes and hours with a numeric stepper, slider and presets; minute-only callers retain their units.

## Compact Chip density
- Render inline and card chips at 32 px. Use six graphemes plus three dots for long bound material labels; retain full accessible names and attachment identities. Reserve the named recommendation's width through loading and its 650 ms entrance.
- Keep 32 px prose lines, 2 px side spacing, translucent white/pale violet widget glass and a 12 px backdrop blur. Compress backdrop contrast on the glass surface so dense text and artwork underneath cannot leave dark patches. Keep foreground swatches, media and text at their original contrast. Place sketch tools before the canvas in DOM order. Join Pen, Eraser, Undo and Clear into one compact segmented strip, with individual hit targets and persistent tool selection. Use four round ink swatches ordered black, red, yellow, blue, default to black, separate them from the joined tool buttons by 16 px (8 px between wrapped rows), and retain each stroke’s ink through erasing, undo and SVG adoption. Keep the optical reference internal.

## Shared glass interactions
- Scale recommendation pigment and colored glow alpha to 90% of the previous local skin. Preserve the 32 px inline silhouette and the 650 ms entrance.
- Use stationary, ice-blue hover feedback on discrete actions such as Chips, buttons and catalog links. Sliders, drawing surfaces and editable fields keep their own cursor, value and keyboard-focus feedback. Keep each selection visible, give keyboard focus its own outline and limit hover to fine pointing devices. Preserve the low-contrast 12 px panel backdrop.
- Fade in the recommendation shell before loading appears. On completion keep its surface visible while the loading mark gives way to the label. Chips use a subdued pointer-following reflection inside their stationary edge.

## File rows and inline Chip geometry
- Show the selected document list only inside its widget. The full row opens a preview, with an independent trailing remove button. A closed file Chip shows its bound name, additional count and remove action.
- Use the 1.7.0 inline metrics: 18 px leading icons and swatches, 14 px recommendation stars, 15/22 px labels, 6 px gaps and 8 px outer horizontal padding inside the 32 px surface.
