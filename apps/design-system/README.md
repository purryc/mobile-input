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
- `docs/input-design-contract/definitions.json` owns existing stable IDs. `content/component-bindings.json` connects those IDs to the seven live examples and registers three newly exposed entries. `scripts/prepare.mjs` combines them; the website does not maintain a duplicate catalog list.
- `src/catalog-api.ts` owns the executable A2UI APIs; renderer, schema downloads and examples use it. Official protocol v0.9.1, `@a2ui/react` and `@a2ui/web_core` 0.15.0 are pinned. Zod 3 is isolated from product Zod 4; React and icon dependencies resolve through the site.
- `public/generated/`, `public/reference-assets/`, `src/generated.json`, `src/prompts.json` and `dist/` are reproducible build output. Do not edit them. Generated assets contain only reviewed design previews, widget SVGs, public metadata and fictional examples.

## Honest capability boundaries

91 registry entries are covered, including historical entries. Seven components have real interactive specimens and A2UI bindings. The remaining entries show design/source evidence and explicitly state that isolated interactive specimens and A2UI integration are not available. Registry evidence is not real-device acceptance.

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
