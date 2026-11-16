# Shared presentation components

- `src/` holds extracted React views, their styles and small presentation helpers. Lowercase kebab-case names; `index.ts` is the public entry. Preserve original markup, accessibility and gestures during extraction.
- Dependencies point only toward React, icons, pure `packages/core` utilities and design tokens. Never import apps, runtime, transports, model services, storage, native bridges or product controllers.
- The host supplies translated UI labels through `UIProvider` and all consequential actions through props. User-authored text is never translated. No default network, device or persistence adapter.
- Product files remain compatibility wrappers. Business ownership, synchronization, speech and pointer lifecycles stay in the product. Documentation uses independent memory-only fixtures.
- `tests/` holds boundary and extraction contracts. QA evidence stays in ignored root `artifacts/design-system/`. Do not publish a package or change the running main worktree as part of extraction.
