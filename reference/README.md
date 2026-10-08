# Visual authority and local assets

- Tablet MRDI-W10 (API 24), phone SUP-AL90 (API 26) were observed over HDC on 2026-10-07. Device connectivity is separate from app installation/acceptance.
- Original recording: VID_1791414349_032.mp4, 501890970 bytes, 689.547 s, 2800 × 1840. Inspection copy: `/tmp/mobile-input-inspection-VID_1791414349_032.mp4`.
- Stable home reference: 608 seconds. The blurred transition at 610 seconds is not the icon authority.
- `asset-manifest.json`: reviewed non-mail crop coordinates, timestamps and hashes; external wallpaper/font provenance and local video excerpt ranges.
- `frame-map.json`: selected scene checkpoints. `private/frame-review.html`: local-only frame viewer using all 38,627 actual PTS entries. Run `python3 scripts/build-frame-review.py` to recreate it. No private source files enter app/HAP/source ZIP.
- `python3 scripts/extract-reference-assets.py` recreates reviewed crop files; it refuses mail-range timecodes. It requires the original local recording at the inspection path.
- Mail identities, subjects, bodies, signatures and attachments are authored fictional sales examples. Non-mail visual assets may retain user-supplied original widget or media content.
- Wallpaper provenance: https://club.honor.com/cn/thread-29588741-1-1.html . Same woven geometry, different color variant; a runtime color matrix approximates the grey/gold reference. This is a documented fidelity gap.
- Font provenance: https://developer.huawei.com/images/download/general/HarmonyOS-Sans.zip . Unmodified regular/medium/bold SC font files and license are bundled. Copyright © 2021 Huawei Device Co., Ltd. Notice is accessible from desktop Settings.
- Research authority: `/Users/hmi/Documents/input agent/Survey/mobile-input-agent-unified-2026-10-06/index.html`. Stable target, context-specific tools, actual readback, private notes, explicit recovery.
- Installed WPS package: `cn.wps.office.hap`. Its screenshot capture was not usable for full-fidelity reconstruction. See `design-qa.md` and `docs/validation.md`.
