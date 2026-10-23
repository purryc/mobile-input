# Input design contract documentation

- This directory consolidates existing Mobile Input design and implementation evidence; it does not add runtime features or replace higher-priority project rules.
- The canonical Notion Design page https://app.notion.com/p/3f9194db24c38165996cf89b22e7d69e is the only current rulebook. The user requested deletion of redundant `design.md` after consolidation on 2026-10-23. Do not recreate a standing local mirror; historical artifact snapshots are recovery evidence only.
- For subsequent generated panels, fetch the current Notion T01–T06 and P01–P07 first: ordinary applications derive themes from their desktop icon; WPS resolves the active writer/sheet/presentation subapplication and uses its W/S/P icon. The parent WPS icon is for confirmed home/workspace only. Preserve explicit user overrides, scoped fallbacks and evidence boundaries; existing icon-only previews are not a general subapplication implementation. If the source is unavailable, report it rather than silently treating an old snapshot as current.
- `icons.md`, `components.md`, and `functions.md` are the three human-readable definition tables.
- Matching `.csv` files and `definitions.json` hold the same rows for editing and validation; regenerate the views together from the reviewed data.
- `icons-preview.html` is a searchable local visual index derived from the same icon rows; embedded images are existing reviewed resources, not new designs.
- `README.md` records coverage, counts, reading order, validation and Notion delivery links.
- `design-consolidation-review.md` records the 2026-10-23 joint Codex / Claude CLI review and proposed source migration. It is a decision record, not another normative design source; raw review input and output stay in ignored `artifacts/design-consolidation-review-2026-10-23/`.
- Names use lowercase-kebab-case. The user authorized the reviewed consolidation on 2026-10-23: merge Design MD increments into the existing Design Skill page, preserve its ID and templates, and convert the old MD page to an asset index while preserving all children. Back up before edits; retain unrelated user content.
- Raw Notion source snapshots, inspection scripts and validation logs stay in ignored `artifacts/input-design-contract-2026-10-22/`; do not embed credentials, private recordings or real email content.
- Separate recorded Figma design, inspected runtime source, execution integration and test/device evidence. Lack of inspection is unverified, not missing. Missing implementation is not an implemented capability.
- Preserve the existing hierarchy: 原子控件 → 输入组合 → 场景组合. Provisional normalization IDs must be marked as proposals, not existing runtime commands.
- Preserve the PRD, Figma sources, definition-table IDs and images. G01–G25 remain rule IDs; imported definition gaps use GAP-01–14. Do not renumber existing rule IDs or treat design proposals as runtime contracts.
- `design-migration.md` records completed mappings, validation and outstanding design decisions; it does not define another normative rulebook. Backups, transformation scripts and Notion receipts for the merge stay under ignored `artifacts/design-consolidation-2026-10-23/`.

- `component-functions.md`, `.csv`, `.json`, and `.html` join the existing components and functions by component ID. The HTML is a self-contained illustrated index for Notion embedding; the Markdown/CSV retain editable text.
- `component-previews/` contains read-only PNG exports from existing Figma component variants, named by component ID; `manifest.json` records exact source nodes and provenance. No component redesign is implied.
- The combined view preserves every component and every function; unmatched components are marked as unbound, not silently removed.
