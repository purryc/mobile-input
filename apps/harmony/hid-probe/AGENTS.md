# Standalone HID probe

- Scope: an independent phone application to test public Bluetooth HID Device capability with a user-selected Mac. Bundle: `com.hmilab.hidprobe`. Never replace either Input Agent app.
- Source layout: `entry/src/main/ets/` holds the native UI and a JavaScript compatibility adapter; `tests/` holds isolated controller tests; `receiver/` holds the local blank Mac test page. Standard Harmony platform file names are allowed.
- Compile using the installed SDK without editing its API definitions. The JavaScript adapter feature-detects the newer public HID API on the actual device; absent APIs and errors are real failures. This compatibility experiment is not a substitute for validation with a matching SDK.
- Use only public Bluetooth APIs and normal user-granted permissions. No root, privileged injection, access-control bypass, SDK patching or app-data extraction.
- Inputs are limited to the explicit `rea` test. Never auto-send on connect, reconnect, foreground or registration. Stop/background/disconnect cancels queued work and releases held keys where transport permits. Failed release must remain visible.
- Require explicit selection of an already-paired host. Do not discover, pair or remove unrelated devices automatically. Never change the phone's Bluetooth name.
- Build/signing configuration with secrets remains ignored; use separate private signing for this bundle. Builds/evidence go to `artifacts/hid-probe/`; tools and logs must not expose credentials.
- Keep third-party captures separate from this independent source. Document local-send and receiver-observed evidence separately in `docs/hid-probe-validation.md`.
- Run meaningful controller lifecycle tests and build the HAP. Mark installation, capability, registration, connection and receiver input as separate gates. No automatic Git push.
