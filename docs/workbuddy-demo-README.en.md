# Xiaoyi Work standalone Web demo

A self-contained Web project for one computer or a Vercel deployment. It includes the Xiaoyi Work interface, bilingual multimodal composer, local draft storage, contextual prompt polishing, Gemini generation service, result editor, assets, tests and deployment configuration. No phone/tablet app, Mac bridge or original Mobile Input checkout is required.

## 1. Requirements

- Node.js 22 or newer and npm. Check with `node --version` and `npm --version`.
- Current desktop Google Chrome, an internet connection, and a microphone for voice input. Camera is optional.
- Your own Gemini API key for actual generation and prompt polishing. The UI, typed input, widgets and local drafts work without a key. Browser speech uses Chrome's online recognition service, not the Gemini key.
- Unzip the archive, then open a terminal **inside the `workbuddy-web-demo` folder containing `package.json`**. All commands below run there.

## 2. Install and open

```sh
npm ci
npm run dev:workbuddy-demo
```

Open **http://127.0.0.1:5198** in Chrome. Keep the terminal running; press Ctrl+C to stop. If the port is occupied:

```sh
npm run dev:workbuddy-demo -- --port 5208
```

Then open http://127.0.0.1:5208. Use the same hostname and port when returning: browser storage is separate for each address. Do not double-click an HTML file.

## 3. Configure Gemini privately

Create a key for your own project in [Google AI Studio](https://aistudio.google.com/apikey). Your account/project must have access and sufficient quota for the configured text and image models. Follow Google's current [API-key instructions](https://ai.google.dev/gemini-api/docs/api-key).

### Recommended local setup: private key file

1. Stop the app if it is running.
2. Create `artifacts/workbuddy-demo/` inside this extracted project.
3. With a plain-text editor, create a file named **`google-api-key` with no extension** inside that folder. Paste only your actual Gemini key, without quotes, `GOOGLE_API_KEY=`, Markdown or extra text. Save as plain text. Do not use a rich-text document.
4. On macOS/Linux, restrict the file to your account:

   ```sh
   chmod 600 artifacts/workbuddy-demo/google-api-key
   ```

   On Windows, keep the file in your own private user directory and restrict its file permissions to your account.
5. Start again with `npm run dev:workbuddy-demo`.
6. Open http://127.0.0.1:5198/api/workbuddy-demo/status. `configured: true` means a key was found; it does **not** validate model access or quota. Send a small fictional request to test generation using your account.

The key file and the entire `artifacts/` directory are ignored by Git and excluded from the source handoff. Never distribute that file or put a key in frontend code, a `VITE_` variable, a URL, a screenshot or a new ZIP.

### Alternative: environment variables

You can supply `GOOGLE_API_KEY` through your terminal's private environment or secret manager. It takes precedence over files. Alternatively, set `WORKBUDDY_DEMO_KEY_FILE` to the absolute path of a private key file outside the project.

macOS/Linux, using a file outside the project:

```sh
export WORKBUDDY_DEMO_KEY_FILE="$HOME/.config/workbuddy/google-api-key"
npm run dev:workbuddy-demo
```

Windows PowerShell, after creating the private file:

```powershell
$env:WORKBUDDY_DEMO_KEY_FILE = "$env:USERPROFILE\.config\workbuddy\google-api-key"
npm run dev:workbuddy-demo
```

This service reads the process environment and the documented private key file. A `.env` file alone is **not** the documented local configuration method.

| Variable | Purpose / project default |
| --- | --- |
| `GOOGLE_API_KEY` | Server-only Gemini key; first priority |
| `WORKBUDDY_DEMO_KEY_FILE` | Optional private key-file path; otherwise `artifacts/workbuddy-demo/google-api-key` |
| `INPUT_AGENT_DECK_MODEL` | Text/planning/slides model; default `gemini-3.8-flash` |
| `WORKBUDDY_DEMO_IMAGE_MODEL` | Image model; default `gemini-3.1-flash-image` |

These are this project's defaults, not a promise of access on every account. If a model is unavailable, set an accessible compatible Gemini model and restart/redeploy. Text models must support structured JSON generation; image models must support returning image bytes. Never put a secret into any variable prefixed `VITE_`.

## 4. Language and demo walkthrough

Open the **gear at the top right**, then select **English** or **中文 · 普通话**. This changes interface labels and the language used for the next voice session (English `en-US`, Mandarin `zh-CN`). The preference persists on this browser. Switching ends active dictation and preserves the text already received. It never translates existing drafts, filenames or results.

Typing and pasting accept both languages regardless of the interface setting. English examples:

> Create a five-minute product presentation. Use a red theme, a gray background and black text. Attach my product document, add product photos, and let me sketch the layout.

> Write an English product launch plan using the attached reference file.

> Generate an image of a minimalist green product poster with English text.

- Click the microphone to start; click again to stop. Allow microphone access. Stopping does not send.
- After you stop recording and the text settles for about 400 ms, relevant **AI polish** chips appear inside the input box above its bottom buttons. Stable typing, pasting and selection also qualify. **Organize** and **Make concise** depend on the content; short or parameter-only requests may show neither.
- Click a polish chip to rewrite only the selected text (or the full prompt if nothing is selected). It uses the same server-side Gemini key and text model as generation; no separate setup is needed. Parameters, manual values, negative constraints and attachments are preserved. Polishing never sends the task or generates an artifact.
- The small **Restore original** arrow appears at the right of the polish row only after a successful rewrite. It restores the latest rewrite until you edit the text or parameters again. Editing, moving the selection, restarting voice, changing drafts or hiding the page cancels a pending polish. Failures preserve your text and offer retry; unchanged output is reported honestly. Select at most 4,000 characters per polish request.
- Color, duration, file, reference-image and layout phrases become inline chips. Click a chip to toggle its panel below it. Recognition does not open panels automatically.
- Colors bind independently to theme, background and text, and may be scoped to a page, e.g. `On slide 2, use a blue background`. Durations accept explicit 1–60 minute values; ambiguous ranges remain prose.
- `add product photos` opens image input. `generate an image`, `draw a chart` and `create a graph` do not imply selecting reference photos.
- Select local files, choose images or capture a camera photo. Images and sketches enter attachments only after explicit confirmation. Unconfirmed material blocks Send until confirmed or removed.
- Send freezes the request and confirmed attachments, then opens the task/results view. Requests can produce editable Web slides, Markdown documents and/or actual generated images. Output language follows the request; ask explicitly for English if your input mixes languages.
- Stop cancels generation. Retry is explicit. Refresh preserves saved drafts/results and marks interrupted generation; it never resubmits automatically.
- Slides export as **HTML**, documents as **Markdown**, and images in their returned image format. This demo does not export native `.pptx` or `.docx` files.

## 5. Run a local production build

```sh
npm run build:workbuddy-demo
npm run preview:workbuddy-demo
```

Open http://127.0.0.1:5198. The preview command includes the local generation API and uses the same secret configuration. Keep the process running. Files are built under `artifacts/workbuddy-demo/dist/`. Serving only that directory as static files will display the UI but will **not** provide generation. This local server binds to loopback; use the Vercel route below to share with other people.

## 6. Deploy your own public Vercel app

You need your own Vercel account/project and Gemini key. The recipient does not need access to the original author's account. `vercel.json` already specifies install/build/output settings and the serverless API adapter.

From the extracted folder:

```sh
npx vercel login
npx vercel link
```

Choose **your own scope** and create or link **your own project**. Use this extracted folder as the project root. Do not link to the author's existing project. No Git push is required.

Add your key using Vercel's interactive secret prompt:

```sh
npx vercel env add GOOGLE_API_KEY production
```

Paste the key only at the prompt. Alternatively, use the project's **Settings → Environment Variables**, add `GOOGLE_API_KEY`, select Production and mark it sensitive/secret where available. Add the optional model variables there if needed. To use preview deployments too, add the corresponding variables to Preview separately. Local private files are not uploaded and do not configure Vercel.

Deploy:

```sh
npx vercel deploy --prod
```

Environment-variable changes require a new deployment. See Vercel's [environment-variable documentation](https://vercel.com/docs/environment-variables) and [deploy command](https://vercel.com/docs/cli/deploy).

For a demo that opens **without viewer login**, open project **Settings → Deployment Protection** and disable **Vercel Authentication** for the deployment you intend to share. Do not enable password protection or an application login gate. Share the production domain shown after deployment. Verify it in a private/incognito window without a Vercel session: both `/` and `/api/workbuddy-demo/status` must open without a login redirect. The status endpoint never returns the key.

The server keeps the key private, but public visitors can trigger generation against your configured quota when they press Send. Monitor usage in your own Google project. This demo has per-request limits; it is not a multi-user billing/access-control system.

## 7. Storage, attachments and troubleshooting

- Drafts, pending/confirmed materials and results stay in browser IndexedDB `workbuddy-standalone-demo-v1`. They are not shared across computers, browsers, origins or incognito sessions. The server does not persist generated documents.
- Clear demo affects only this demo's local data. Wait for the saved indicator before closing.
- Supported generation materials: PDF, TXT, Markdown, PNG, JPEG and WebP; up to 12 files. Local limits: 8 MB per file, 24 MB total. Hosted requests should stay under about 3 MB total due to encoded request limits.
- If microphone/camera is denied, allow it via Chrome's address-bar site controls and retry. Use HTTPS for a hosted deployment; localhost is supported. Online speech availability depends on browser/network service and is not promised offline.
- `configured: false`: check the key-file name/path or server environment, then restart. `configured: true` plus a generation error: check model access, quota, billing and internet access. Status alone does not test the API.
- Port busy: choose another port as shown above. A blank page or generation unavailable after static hosting: run the documented local server or deploy the included Vercel API.
- If an attachment blocks sending, confirm/remove pending images or confirm/clear sketch strokes. Unsupported file formats must be converted before generation.

## 8. Verification and package contents

```sh
npm run check
npm test
npm run test:workbuddy-demo:service
npm run test:workbuddy-demo
npm run build:workbuddy-demo
```

Browser regression tests use an installed Google Chrome. They mock speech, camera and model calls; they do not spend Gemini quota or establish real microphone recognition/model quality.

- `apps/web/src/`: standalone entry, shared composer/widgets, result views, styles and localization.
- `apps/web/public/`: required icons and visual assets.
- `packages/core/`: required shared types, parsers, speech/state and generation contracts.
- `scripts/`: local generation service, service test and source-packaging script.
- `api/`: Vercel generation/status adapter.
- `tests/`: standalone browser regressions.
- `docs/`: this English guide and Chinese engineering record.
- `package.json`, `package-lock.json`, TypeScript/Vite/Playwright/Vercel configuration: reproducible install/build/run setup.
- `SOURCE-MANIFEST.json`, `PACKAGE-MANIFEST.json`: source provenance and per-file checksums.

The ZIP contains the complete standalone source dependency closure. Node.js, downloaded `node_modules`, private keys, user drafts/photos, Git history, build caches, device binaries and other apps are intentionally excluded. `npm ci` installs pinned dependencies; the original repository is not needed.

## Visual reference and compatibility

![Xiaoyi Work desktop demo](docs/xiaoyi-work-preview.png)

The screenshot shows the Chinese home screen at 1440 × 960. Use the top-right settings gear to switch the interface and speech language to English.

The interface follows the client shown on [Huawei Xiaoyi Work](https://xiaoyi.huawei.com/work): a pale-gray sidebar, white workspace, centered official mascot and three supported creation shortcuts. The result screen retains conversation and editable artifact panes. Screenshots from older WorkBuddy releases no longer represent this appearance. Chinese uses 小艺Work; English uses Xiaoyi Work.

The official logo and client poster are bundled locally under `apps/web/public/assets/xiaoyi-work/`; `sources.json` records the source URLs and SHA-256 hashes. The mascot is framed from the unmodified official poster using CSS. These brand assets belong to Huawei; this demo does not connect to or represent the official Xiaoyi service. No runtime request to Huawei's image servers is required.

Existing command names, API paths, database name and language-preference key intentionally retain `workbuddy` for compatibility. Existing drafts, attachments, authored colors and generated outputs are preserved.

### Inline polish preview

![Inline contextual polish in Xiaoyi Work](docs/xiaoyi-work-polish.png)

The same row is available in the home and result composers. The UI language changes labels, not authored text; polishing preserves the language of the supplied text. The new `/api/workbuddy-demo/polish` route is included in both the local server and Vercel adapter. Refresh retains the rewritten draft, but not an in-flight request or the transient undo action.
