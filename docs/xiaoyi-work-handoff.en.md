# Xiaoyi Work — Engineering Handoff

Release date: 2026-11-11. Current public app: https://xiaoyi-work.vercel.app.
Repository: https://github.com/purryc/mobile-input/tree/codex/workbuddy-web-demo.
The repository branch contains project history; the ZIP is the dependency-complete standalone Web subset. Do not merge or overwrite main as part of this handoff.

## Start from the ZIP

Use Node.js 22+ and npm. Extract `workbuddy-web-demo/`, open a terminal there, and run:

```sh
npm ci
npm run dev:workbuddy-demo
```

Open http://127.0.0.1:5198 in Chrome. Keep the process running. Use `-- --port 5208` if needed. Do not open HTML directly or symlink back to the original checkout. The archive includes source, local brand/widget assets, tests, serverless adapter, dependency lockfile and build configuration. It intentionally excludes node_modules, builds, credentials, local drafts, videos and machine-specific Vercel project links.

Read README.md for the complete English guide, including Windows environment syntax, key precedence, model overrides, file limits and troubleshooting.

## Gemini configuration

Create your own key in https://aistudio.google.com/apikey. For local use, save only the key into `artifacts/workbuddy-demo/google-api-key` with no extension; restrict permissions (`chmod 600` on macOS/Linux). Alternatively supply `GOOGLE_API_KEY` privately or set `WORKBUDDY_DEMO_KEY_FILE` to a private file. Restart the server. Do not put secrets in `VITE_` variables, source code, browser URLs or another ZIP.

Visit `/api/workbuddy-demo/status`. `configured:true` confirms a configured credential, not successful model access or quota. UI and local draft editing work without Gemini; speech relies on Chrome's online speech service. The server defaults currently use gemini-3.8-flash for text and gemini-3.1-flash-image for images; compatible accessible model names can be set through `INPUT_AGENT_DECK_MODEL` and `WORKBUDDY_DEMO_IMAGE_MODEL`. Availability is account-dependent.

## Build and verify

```sh
npm run check
npm test
npm run test:workbuddy-demo:service
npx playwright install chromium
npm run test:workbuddy-demo
npm run build:workbuddy-demo
npm run preview:workbuddy-demo
```

Browser tests use the installed Google Chrome channel; install desktop Chrome if missing. Preview serves both the built UI and the local API. A static-only host does not provide generation. Core and browser tests use isolated data/mocked services; they do not submit real tasks or charge the production Gemini key.

## Deploy to your own Vercel project

```sh
npx vercel login
npx vercel link
npx vercel env add GOOGLE_API_KEY production
npx vercel deploy --prod
```

Choose your own account/project and paste the key only into the interactive secret prompt. Add optional model variables separately. The included `vercel.json` defines install/build/output and API configuration. No Git push is needed. Disable Vercel Authentication for the intended shared production deployment, then check the root page and same-origin status endpoint from a fresh browser context. Never ship the author's `.vercel` folder.

Maintaining the current deployment requires authorized access to project `xiaoyi-work`. Its ID is unchanged from the previous workbuddy-web-demo project. The permanent public address is https://xiaoyi-work.vercel.app. A project/default-domain rename requires a fresh production deployment so `VERCEL_PROJECT_PRODUCTION_URL` matches the new host. Keep host/origin checks enabled. The newly deployed app was verified anonymously with HTTP200, configured status and correct blue presets; no live generation was submitted during release verification.

## Maintain safely

- Keep shared controls opt-in for desktop presentation; legacy phone rendering must remain unchanged.
- Keep original source offsets, manual priority, negative constraints, dismissed recommendations and owner-bound attachments.
- Recommendation timing: no new adoption while recording; stable 1000ms after stop, 400ms loading, 220ms stagger. Adopt each candidate only on reveal. Cancel unfinished work on editing/restart/draft change/Send.
- All six material types share compact display, while retaining separate persistence/confirmation lifecycles. Do not infer a real attachment from a spoken filename.
- Preserve IndexedDB and API identifiers. Browser storage is origin-specific; the new domain starts a separate store from the former domain.
- Keep generation keys on the server. Public visitors can consume your configured quota; this demo is not a multi-user billing or permission system.
- Before publishing changes, inspect the diff, run relevant tests and build, then explicitly deploy. Never auto-push, auto-submit Agent tasks, or reset user drafts.

## Known limitations and remaining work

- Seven output-format choices are constraints, not seven native exporters. Downloads are HTML slides, Markdown documents and actual returned image formats; native PPTX/DOCX is not implemented.
- Experts, skills and connectors are selectable demonstration metadata. No external skill installation, authentication or real knowledge-base retrieval is performed.
- Browser screen recording can be confirmed as an attachment but the generator rejects video; remove it before real generation. Recording has no audio.
- Speech requires supported online Chrome; system permission behavior is not proved by fixture tests.
- Pending recommendation visual semantics differ from the latest shared design's candidate-only wording. This Web release intentionally retains adoption at reveal. Coordinate a future behavior change explicitly instead of changing design or submission semantics during a visual fix.
- The final two videos use simulated transcription/local Kokoro and fictional capture sources with static result artwork. The final PPT cut removes the polish request and interaction, so it demonstrates 13 types across both videos while the app still supports 14.

## Recovery and evidence

Use the Git branch's release commit and the archive's SOURCE-MANIFEST.json plus ZIP SHA256 to identify exact source. Do not treat generated bundles as the editable source. Vercel rollback should target a previously verified deployment only after an explicit request. Preserve old media and drafts.

Repository validation and recorded evidence live under ignored `artifacts/workbuddy-demo/`; this is not required for running the extracted app. Local implementation specification is `docs/xiaoyi-work-specification.md`. The published Notion specification and handoff are release records, not replacements for canonical shared design rules.

Notion release records (access follows the owner’s sharing settings):
- Specification: https://app.notion.com/p/416194db24c3813c84a0e6d917c05c02
- Handoff: https://app.notion.com/p/416194db24c38126bfface646e98cbfe
