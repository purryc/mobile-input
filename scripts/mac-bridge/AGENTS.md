# Mac companion bridge

- `agent.swift`: persistent macOS Accessibility/CGEvent helper; JSON lines over private stdio only.
- `server.mjs`: authenticated, bounded LAN transport; never expose shell, paths or arbitrary shortcuts.
- `protocol.mjs` and tests: destination/session/target guards, validation and deduplication.
- Generated helpers, pairing receipts and scratch validation documents live under ignored `artifacts/mac-bridge/`.
- No stored credentials or application content in logs. Read only the explicitly paired, allowlisted foreground app. Do not modify existing user documents for tests.
- User-authorized USB-first exception: usb-route.mjs may enumerate USB-connected phones, read device type and maintain this bridge reverse-port mapping. No UI actions, installs, resets or unrelated port changes. Real Harmony app control still requires separate enablement and validation.
- `file-store.mjs` accepts only bounded, hash-checked adopted files, scoped to connection/window/target. Private transfer files live under `artifacts/mac-bridge/materials/`; public commands carry opaque IDs, never local paths. Preserve completed files for task references; discard incomplete buffers on disconnect.

- `trust-store.mjs` persists only bridge identity and trust in the private user Application Support directory. `connection-page.mjs` renders the loopback QR page; `install-companion.mjs` installs this bridge login agent and the Mac connection launcher. No phone installation is part of companion setup.

- `app-switcher.swift` owns the bounded Command-Tab lifecycle and independent 1200 ms release watchdog. It exposes next/cancel only; tests inject key callbacks rather than affecting the Mac desktop.
