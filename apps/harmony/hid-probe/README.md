# HID Probe

Independent HarmonyOS keyboard experiment, bundle `com.hmilab.hidprobe`.

Current device result: registration and a connected Profile are observed on Mate 70 Air. The user confirmed `rea` arrived in another Mac application. Two receiver runs confirm complete R/E/A down/up events without repeat. The Mac input method produced composition text `re a`; exact committed text and interruption/reconnect behavior remain unverified. The Mac Bluetooth daemon was running at the last service check; earlier crash records remain historical evidence.

Run from the repository root:

```sh
node --test apps/harmony/hid-probe/tests/controller.test.mjs
python3 scripts/build-hid-probe.py
python3 scripts/hid-probe-receiver.py
```

Open `http://127.0.0.1:8768/` for the blank receiving surface. The phone sends only an explicitly requested `rea` sequence after registration and connection. Keep the Mac input field in the foreground; do not synthesize input to validate Bluetooth delivery.

The build copies source to `~/.cache/input-agent-hid-probe/` for DevEco path compatibility and preserves its private signing configuration. Output goes to ignored `artifacts/hid-probe/`. Configure your own local development signature in DevEco before installing on another device.

The installed API 22 SDK builds the ArkUI shell; an isolated JavaScript adapter detects the newer public HID Device methods at runtime. This is a compatibility experiment, not matching-SDK or distribution certification.

Read [the validation record](../../../docs/hid-probe-validation.md) for evidence, limitations, signing details and recovery steps. Follow [AGENTS.md](AGENTS.md) before changing the test scope.
