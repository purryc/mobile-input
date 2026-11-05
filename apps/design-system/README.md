# Mobile Input Design System

Bilingual, designer-first documentation with real shared React specimens and an isolated A2UI playground.

```sh
npm ci --prefix apps/design-system --ignore-scripts
npm run dev --prefix apps/design-system
npm test --prefix apps/design-system
npm run build --prefix apps/design-system
```

The preview uses `/mobile-input/` and hash routes so component deep links survive GitHub Pages refreshes. `src/components.ts` is the public display export entry. `ImageInput` maps to product `AgentImageInput`; legacy photo parameter, protocol and storage identities remain unchanged.

## Source ownership

- Notion is the sole authoring source for design rules. `content/rules-snapshot.json` is a reviewed publication excerpt with source edit time, not a second rulebook. Update Notion first, then replace the release excerpt and version.
- `docs/input-design-contract/definitions.json` owns existing stable IDs. `content/component-bindings.json` connects those IDs to the live examples and registers three newly exposed entries. `scripts/prepare.mjs` combines them; the website does not maintain a duplicate catalog list.
- `src/catalog-api.ts` owns the executable A2UI APIs; renderer, schema downloads and examples use it. Official protocol v0.9.1, `@a2ui/react` and `@a2ui/web_core` 0.15.0 are pinned. Zod 3 is isolated from product Zod 4; React and icon dependencies resolve through the site.
- `public/generated/`, `public/reference-assets/`, `src/generated.json`, `src/prompts.json` and `dist/` are reproducible build output. Do not edit them. Generated assets contain only widget SVGs, public metadata and fictional examples.

## Honest capability boundaries

91 registry entries are covered, including historical entries. Nine entries have real interactive specimens; seven have A2UI bindings. The remaining entries link to Figma and source, with explicit specimen and A2UI status. Component screenshots are not shipped or used as substitutes for live controls. Registry evidence is not real-device acceptance.

`ContextualPolishActions` reuses real presentation, `contextualPolishActions` and parameter protection. The independent `DemoEditor` mirrors product text-history semantics without importing `usePhoneEditing`. Results are fixed fixture transformations, never model generation; custom text can evaluate actions but receives no fabricated output. Original internal model instructions remain untranslated and read-only.

The site never imports native/runtime modules, opens devices, sends model requests, or writes product storage. Locale is memory-only. Attachment examples operate on fictional state; confirmation and removal demonstrate synchronization to the original unsent draft. This does not submit real tasks.

## Release and rollback

Only `.github/workflows/design-system-pages.yml` publishes. It has `workflow_dispatch` and no automatic push trigger. Enable GitHub Pages with the Actions build type, then:

```sh
gh workflow run design-system-pages.yml --ref main -f source_ref=main
```

For rollback, dispatch the same workflow with `source_ref=<previous-release-commit>`. The version page and `generated/release.json` identify the actual source commit, registry hash and rule hash. Keep the previous successful workflow/artifact and release SHA in the release record. First release has no previous website version.

## Validation

Run site tests/build and affected root checks for shared-source changes. Manually verify photo search, confirmation/sync failures, Prompt search, selection/undo/stale polish, A2UI run/step/reset/errors, CN/EN, keyboard access and 390px mobile layout. Save private QA logs/screenshots under ignored `artifacts/design-system/`.

The fixture host accepts static child ID lists, one-level data bindings and complete reachable component trees. Send data before components that bind it. These are deliberate sandbox restrictions, not claims about the full A2UI protocol. Editing a message invalidates its prior preview; stepping rebuilds the selected prefix with a fresh host.

## Generative UI method and task composition

The canonical Notion section “生成式 UI：规则与接入流程 · 2026-11-05” is published in `content/rules-snapshot.json` with bilingual explanations and page references to the user-provided 25-page PDF. The PDF is a method reference, not the A2UI protocol or evidence of product performance; the original PDF is not redistributed.

Routes:
- `#/guides/generative-ui`: method, project adaptations, state/authority and publication rules.
- `#/a2ui/task-composition`: deterministic task → candidates → explicit entry → fixed template → validated A2UI → shared component demo.
- `#/a2ui/task-integration`: source connections, the proposed host contract and remaining production work.

`task-composition.ts` reuses the product's bounded Chinese parameter parser and contextual polish selector. Fictional target profiles demonstrate capability filtering, missing values and missing Catalog bindings. Selecting an entry initializes a fresh isolated sandbox; parameter changes stay in its copy and do not rewrite the original task. English chrome does not imply English semantic parsing. The generated `task-composition.json` contains source metadata, a local plan and validated messages for each available candidate. Plans are illustrative internal contracts, not official A2UI messages.

Production still needs a unified context/capability provider, constrained plan compiler with stable interaction lifecycle, and events bound to the existing editing session and verified adapters. The website neither imports a device controller nor establishes model planning or phone A2UI integration. Start product integration with the existing Agent draft's color, duration and image entries; retain explicit attachment confirmation/sync and Send.
