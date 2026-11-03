# MateBook Fold product reference delivery

## Content and build

- Product: current official HUAWEI MateBook Fold 非凡大师, Kirin X90 Plus; sources checked 2026-11-02.
- Output: 15-page editable DOCX and searchable PDF, 9 tables, 8 official reference links, six-slide outline and conversational speaking notes.
- Editorial source: `matebook-fold-2026-11-02.md`; reproducible authoring: `build-matebook-fold-2026-11-02.py` using the bundled document Python runtime.
- Render with bundled `render_docx.py` / LibreOffice only. Set `FONTCONFIG_FILE` to a task-local config including the existing Microsoft YaHei font at `/Users/hmi/Library/Fonts/chinese.msyh.ttf` and the bundled LibreOffice font directory. Do not modify global fonts or ship font files.
- Explicitly remove template title borders, theme-font overrides and document grid snapping. The initial render exposed missing Chinese glyphs; the corrected final render has searchable Chinese and exactly 15 pages. All final page images inspected.
- Deliverables and evidence: ignored `artifacts/product-reference/2026-11-02/`. Final PDF is copied from `qa/final/`, not the superseded initial render.

## Phone delivery

- SUP-AL90 detected over HDC. Shell directory creation was denied; the two nested folders were created through the phone's File Manager interface.
- Visible path: 我的手机 → Documents → Input-Agent → 产品资料.
- Storage path: `/storage/media/100/local/files/Docs/Documents/Input-Agent/产品资料/`.
- Only the requested DOCX and PDF were transferred. Both were read back and compared byte-for-byte and by SHA-256 with the local final originals.
- Both filenames and sizes were observed in File Manager. DOCX and PDF were each opened in the native File Preview service; screenshots confirm readable Chinese title and first-page body. First-use File Preview service agreement required user permission; permission was explicitly received in this chat before acceptance.
- No application installation, reset, app-source change, Git commit/push or Drive upload.

## Acceptance boundaries

Current Input Agent `phone-workbuddy-adaptive.tsx` uses the demo `w.files` list in its document/reference picker. No native DocumentViewPicker was found in the inspected bridge. The plan for real Mac WorkBuddy includes this capability, but this document delivery does not implement it or claim that it is verified. Real reference selection remains pending that implementation.

Machine-readable checksums and the final device-preview result are recorded in `artifacts/product-reference/2026-11-02/delivery-receipt.json`.
