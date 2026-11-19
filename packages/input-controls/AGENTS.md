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
- Opening a camera chip with known intent starts its viewfinder immediately. A passive catalog card waits for a mode selection. Switching photo/scan reuses the stream. Existing images enter through Gallery.
- A user-opened screen chip carries an optional explicit screenIntent (screenshot or recording). Resolved intent opens its workspace directly; an unspecified intent keeps the chooser. Starting a recording and adopting its result require separate user actions.
- In the document picker, adopted rows and attachment cards remove the same owner-scoped material ID. Removing a sketch attachment preserves the editable canvas.
