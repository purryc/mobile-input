# Xiaoyi Work visual refresh / 小艺Work 视觉改造

The standalone demo now follows the official Xiaoyi Work client reference, with bundled logo/mascot imagery, a pale-gray sidebar, white workspace, supported document/presentation/image shortcuts, and blue-violet interface states. The Chinese and English names, favicon, browser title and assistant avatar are updated. The original command names, API paths, storage database and language key remain compatible.

精简版已换为小艺Work视觉，保留动态输入、语音、中英文切换、附件确认与成果编辑。main、手机和平板原生应用不受此次修改影响；用户选择的颜色、已存笔迹和成果配色不随界面换色。

## Validation

- TypeScript check and standalone production build passed.
- Core tests: 236 passed. Generation-service contract test: 1 passed.
- Chrome browser tests: 25 passed, including all existing input/result regressions and six new Chinese/English viewport cases at 1440×960, 1280×800 and 1024×768.
- Browser coverage includes all five widget types, microphone toggles and error/late-callback simulation, anchored popovers, black palettes, photo/camera confirmation, scaled sketch coordinates and undo, draft ownership, legacy draft restore, send snapshots, result editing, download and refresh.
- Viewport cases verify local assets, home/settings/attachments/popovers/result layout, no horizontal page overflow, persisted custom colors/materials, and preserved authored result colors. Screenshots are generated under ignored `artifacts/workbuddy-demo/evidence/`.
- Direct visual browser inspection confirmed the official mascot, homepage and black-color picker with chip anchoring. No requests to the Huawei image CDN are needed at runtime.
- Speech and camera regression evidence is automated simulation; no fresh physical microphone/camera acceptance is claimed. Model calls use fixtures in tests, not paid Gemini generation.

## Distribution

Use the included English README for installation, Gemini key configuration and deployment. The archive includes frontend, core contracts, local service, hosted API adapter, local assets, tests, lockfile and deployment configuration. Dependencies are restored with `npm ci`; credentials, installed dependencies, native apps and private data are excluded. Existing Vercel URL and Drive file identity are retained.
