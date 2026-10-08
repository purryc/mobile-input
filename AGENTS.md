# Mobile Input project rules

## Purpose and design context
- Build a local two-device HarmonyOS prototype for a sales professional: tablet is the primary visual/work surface; phone supplies contextual text, voice, tools and presentation controls.
- Desktop scope: one page with Mail, WPS (sheet/word/slides chooser), WeChat, Doubao, Notes, GoPaint and Mario only. Preserve source widgets visually; non-demo widgets are decorative, without misleading launch actions. No all-apps launcher or placeholder app entries.
- Visual revision: preserve original application logos, widget appearance and measured layout from the supplied recording; no bottom Dock. Use the linked HarmonyOS PC image only for the desktop/window treatment agreed in the current conversation. Do not claim pixel identity without same-state pixel comparisons.
- `reference/private/frames/` holds private frame extraction and comparison sources; app bundles receive only reviewed non-email assets under `apps/web/public/reference-assets/`. Keep frame timecodes, crop coordinates and hashes in `reference/asset-manifest.json`.
- Match the supplied tablet recording and installed WPS interface. Use restrained, familiar application UI. Phone controls must be immediately understandable.
- Prototype applications are internal replicas, not integrations with real mail, WPS accounts or AI services.

## Directory contract
- `apps/web/`: shared tablet and phone web UI.
- `apps/harmony/`: ArkTS shells and native network/speech integration.
- `packages/core/`: shared business data, state transitions and protocol.
- `scripts/`: reproducible development, packaging and checks.
- `reference/`: local reference index and source provenance; private recordings and captures are ignored.
- `samples/`: generated, editable fictional data exports; canonical seed is `packages/core/model.ts`.
- `docs/`: implementation, design and validation records.
- `artifacts/`: ignored builds, screenshots and test evidence.
- `vendor/`: pinned third-party source with provenance and modifications documented.
- New files use lowercase-kebab-case except platform-required names. Temporary inspections stay outside source; generated outputs may be recreated. Never delete source recordings.

## Privacy and integrity
- Never use recorded email bodies, subjects, senders, recipients, avatars, signatures, attachments or screenshots containing them in the product. All sales content is fictional with example.com addresses.
- No credentials, private signing profiles or passwords in source or Git. Local signing lives outside this project.
- Preserve unrelated work. No automatic Git push. No Spec Kit or OpenSpec initialization.
- UI contains necessary actions and status, not implementation explanations or tutorial copy. Put evidence boundaries in docs.
- Receiving a command is not completion: tablet state and execution acknowledgement are authoritative.
- Keep selected target/version stable during phone drafting. Release held game controls on disconnect/background.
- Preserve editable source and distinguish browser, build, signed-install and device-interaction verification.

## Verification and delivery
- Current implementation scope: WeChat message/composer targets, live per-conversation drafts, immediate suggested replies, functional phone editing tools, and imported Hover service sheets on the phone only. Source Hover project stays unchanged.
- All recommended services, including calendar, use imported Hover half sheets and full-screen mock destinations with local demo records. No native calendar or real third-party write integration.
- The phone app-switch control cycles seven demo entries on the tablet only; idle commit is 1200 ms. WPS always opens its home page before new/existing documents. All applications expose persistent hierarchical Back.
- Imported Hover code lives in apps/web/src/hover/ with its reviewed assets under public/assets/. Record provenance in reference/; namespace imported styles under .hover-services. Generated captures and private emails must not be copied.
- Use per-conversation/message/action keys for service records, versioned drafts, idempotent sends and local service record recovery. Desktop icons use clean master assets rather than damaged recording crops.
- Run typecheck, core/protocol tests, production build and relevant browser/device checks.
- Never report a simulated transcript as real speech recognition or a browser test as device proof.
- Document blockers accurately; do not replace failed integrations with success animations.
- Delivery includes Web build, two signed HAPs where signing is available, source and reproducible instructions.

## Source backup
- GitHub source backup uses the private `purryc/mobile-input` repository. Push only when the user explicitly requests backup or synchronization.
- Google Drive source archives go in the existing TEMP folder, named `mobile-input-source-YYYY-MM-DD-<short-commit>.zip`, generated from the same committed Git snapshot.
- Include editable code, reviewed runtime assets, samples, documentation and dependency lockfiles. Exclude raw/private recordings, signing material, installed dependencies, build output, caches and Git history.
- Keep upload receipts and archive checksums under ignored `artifacts/backup/`. Verify the remote commit and cloud archive metadata before reporting completion.
