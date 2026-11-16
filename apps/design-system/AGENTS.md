# Mobile Input Design System

- Follow root AGENTS.md. This standalone React/Vite site uses the existing components and a local A2UI fixture transport; it must not import the product runtime, native bridge, credentials or private content.
- `src/` contains site views, catalog, bilingual copy, and deterministic fixtures. `content/` stores reviewed Notion release extracts/metadata (generated publication snapshots, not authoring sources). `scripts/` prepares public artifacts and validates provenance. `tests/` owns behavioral verification. `public/generated/` and `dist/` are regenerated and ignored. QA captures/logs belong to the root ignored artifacts/design-system/ directory.
- Navigation: Guides / Components / Scenarios / A2UI / Resources. Defaults: Chinese, light documentation chrome, product theme only inside specimens. Authored fixture text and internal prompt source are never translated automatically.
- Schema and renderer share component names and APIs. Catalog IDs are versioned. Display implementation, A2UI support and real destination verification independently. Legacy registry IDs remain stable.
- Component galleries and detail pages must not display screenshots as component specimens. Render existing shared React controls with isolated local state; list design-only, retired or runtime-coupled entries honestly with direct Figma links. React specimen availability and A2UI registration are separate capabilities. Keep original design evidence in its owning registry, without copying component screenshots into the website build.
- Run npm run check, npm test and npm run build in this directory. Root product checks remain required when shared source changes. Publish only via the explicitly dispatched design-system-pages workflow after checks.

## Generative UI publication and task-composition demo
- `content/rules-snapshot.json` carries the reviewed Notion generative-UI excerpt, bilingual guide and integration explanation, with PDF page references. Source advice, project adaptations and implementation evidence must remain distinct; do not distribute the reference PDF.
- `src/task-composition.ts` is a local deterministic demonstrator, not a product planner or authority provider. Reuse pure core parameter/polish rules; intersect candidates with explicitly fictional host profiles and this Catalog. Recognition suggests entries; only a user-selected entry opens an auxiliary widget.
- Keep task text, simulated capability revision and plan ownership together. Invalidate old previews after input/context changes. Export only validated A2UI messages, never arbitrary instructions/actions. Missing values stay unresolved, not fabricated defaults.
- `src/task-composition-demo.tsx` connects the selection explanation to the existing isolated sandbox. It may initialize a copied demo editor; edits remain local and are not applied to the task or a real destination. Reset/selection changes start fresh fixtures and must be labelled.

## Reusable component cleanup
- Consume `packages/ui/src/index.ts`; do not import product React views or override product language modules with Vite aliases.
- Playground renders on entry and on example selection. Valid JSON edits automatically update; invalid descriptions have no active preview. Run/step controls are removed. Preview is primary; code/data/events are progressive details.
- Account for every design registry ID in generated extraction coverage. Shared implementation, embedded variants, business recipes, design-only and retired entries are distinct; do not advertise a recipe or a native service as an extracted control.
- Work on `codex/design-system-components` from 9772a5f. Main's uncommitted runtime/transport changes are outside this branch; review those differences before a future merge. No merge, push or deployment in this cleanup.

## Prototype visual parity
- Reuse includes the product's base CSS, ancestor selectors, theme tokens, fonts and layout slots, not only JSX. Isolate documentation styles from preview descendants with CSS scope boundaries.
- Never override a product control's type size, radii, spacing, colors, layout or scale to make a specimen fit. Use its native layout width and allow the surrounding viewport to scroll.
- Record comparison evidence at matching widths/states, including actual product screenshots/computed styles and checks that detect documentation-CSS leakage. Functional tests alone do not establish visual parity.
- Generated preview reset CSS names and hashes its owning product stylesheet. Do not maintain a hand-copied alternative reset or theme map.

## Approved 13-control integration · 2026-11-16
- This scoped integration supersedes the old cleanup no-merge/no-push rule: user authorized main integration and manual Pages publication after validation.
- New desktop controls live in packages/input-controls. Its 13 standalone widgets exclude text polish; existing catalog and A2UI entries retain their actual status.
- New previews import the package and its isolated example host; never the Xiaoyi runtime. Do not infer A2UI support from React availability.
