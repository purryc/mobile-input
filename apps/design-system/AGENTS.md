# Mobile Input Design System

- Follow root AGENTS.md. This standalone React/Vite site uses the existing components and a local A2UI fixture transport; it must not import the product runtime, native bridge, credentials or private content.
- `src/` contains site views, catalog, bilingual copy, and deterministic fixtures. `content/` stores reviewed Notion release extracts/metadata (generated publication snapshots, not authoring sources). `scripts/` prepares public artifacts and validates provenance. `tests/` owns behavioral verification. `public/generated/` and `dist/` are regenerated and ignored. QA captures/logs belong to the root ignored artifacts/design-system/ directory.
- Navigation: Guides / Components / Scenarios / A2UI / Resources. Defaults: Chinese, light documentation chrome, product theme only inside specimens. Authored fixture text and internal prompt source are never translated automatically.
- Schema and renderer share component names and APIs. Catalog IDs are versioned. Display implementation, A2UI support and real destination verification independently. Legacy registry IDs remain stable.
- Run npm run check, npm test and npm run build in this directory. Root product checks remain required when shared source changes. Publish only via the explicitly dispatched design-system-pages workflow after checks.
