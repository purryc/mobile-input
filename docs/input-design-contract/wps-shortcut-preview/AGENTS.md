# WPS shortcut design preview

- This is an isolated, editable design preview, not the production phone application or a real WPS adapter.
- `preview.tsx` defines OpenUI wrappers and local document interactions. `preview.css` styles the review stage and registered action-key design. Reuse the existing InputDock CSS and reviewed SVG assets; do not alter production source.
- `catalog.json` is generated from the parent definitions and project theme tokens by `build.mjs`. `panel.openui` records the initial generated program. `README.md` records provenance, commands and limitations.
- Build files and browser evidence belong in `artifacts/wps-shortcut-preview-2026-10-22/`; no credentials, external model calls or real device actions.
- Every action must reference a definition-table function; local capability parameters are explicit preview fixtures. Readback reflects only this preview document.
- Preserve 11 actions plus fixed More, shared dock geometry, theme roles, direct editing, and explicit save. No duplicated dock actions in the main grid.
