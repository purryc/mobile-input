# WorkBuddy adaptive input — independent acceptance track

Status: accepted for the agreed local two-device prototype on 2026-10-14. Browser/core verification, signed installation, native speech/object/capture interactions and human USB-free recovery confirmation are recorded separately. See `adaptive-input-acceptance.md` for the final scope audit; historical checkpoints below retain their original boundaries.

Authority: Notion PRD `3f9194db24c381bf8b76c804062303e3`, retrieved 2026-10-14; Figma `ApFLno64NcMoA17MiPFfZh`, section `109:5262` and capture section `1428:31567`. Latest PRD supersedes design-only disclaimers as implementation scope; all external service integrations remain local replicas.

## 当前验收入口

| 独立检查 | 当前证据 |
| --- | --- |
| 文字、颜色、手绘累积 → Roadmap | 核心／浏览器覆盖颜色否定、非法 HEX、手改优先、空画板、确认与发送分离；真机红色参数＋原始笔迹生成六页双栏 Roadmap |
| A 运行 → B 材料审批 → 回 A | 浏览器与真机运行 A 时切 B、批准后保留原行并追加三行；核心覆盖过期和重复审批；用户确认拔线后切换、重连及四行结果保留 |
| 指向对象 → 修改要求 → 预览 → 应用 | 浏览器版本／预览保护与真机标题修改；用户确认语音发送和应用成功；断线、乱序回执修复有重现及回归证据 |
| 截图、圈选、录屏与跨应用参考 | 浏览器像素／裁剪／录屏解码；原生截图采用；用户确认 Bilibili 圈选到 WorkBuddy 且弹幕不受影响、约五秒录屏可完整播放 |
| 手机拍照 → 返回原任务 | 用户确认真实拍照、明确采用、原草稿保留和发送正常，且两台 USB 拔掉；取消有真机证据，拒绝权限／目标变更有浏览器和核心检查 |
| 窄屏与固定输入区 | 浏览器缩短视口与原生软键盘布局检查；真实语音、中文／emoji、原生剪贴板分别留证 |
| 安装与独立运行 | 两端签名 HAP 已安装；热点直连，无电脑桥；用户确认拔线拍照发送及后台重连后草稿、参数、手绘与已批准结果保留 |

## 完成判定

本轮约定的 WorkBuddy 输入原型已验收。审批写入是本地演示数据；语音、相机、剪贴板、应用窗口采集及局域网通信使用实际设备能力。失败／过期／重复命令以核心和浏览器故障注入测试为依据，不宣称在真机上穷举所有网络故障。录屏约五秒完整播放由用户确认，不宣称逐帧或毫秒级计时测量。

## Required evidence

- [x] One composer, fixed voice/editing dock, exclusive keyboard/trackpad; compact browser and native-safe-area layouts.
- [x] Task cards and New; independent drafts, parameters, strokes, materials and objects; notification/focus isolation.
- [x] Color inference, negation/idioms, HEX validation and manual-value priority in core/browser; selected color affects native artifact.
- [x] Raw sketch, eraser/undo/clear and explicit confirmation; actual native raw-stroke attachment and resulting layout.
- [x] Roadmap text/color/layout affect tablet artifact; stop/continue tested against authoritative task state.
- [x] Running A → B material approval → A recovery; scoped approval and actual table result on native pair; stale/repeat rejection in core.
- [x] Object instruction → inert preview → explicit Apply, with native human speech confirmation and stale-version tests.
- [x] Screenshot/crop, recording and camera with explicit use; actual photo/cross-app acceptance and separate adapter/failure tests.
- [x] Native speech/editing/clipboard; cancellation and hold/toggle behavior covered by shared-input regression.
- [x] Deduplication, stale sequences, reconnect and draft persistence; native background disconnect/reconnect observed and USB-free recovery human-confirmed.
- [x] Typecheck/core/browser/build, source/Web packages, signed HAPs and separate installation/device evidence.

## Evidence log

2026-10-14 initial observation: PRD and compose/color/sketch Figma renders inspected. The old controller was the baseline; it has since been replaced for task-composer targets.

### Implemented and verified in the browser/core

- Single composer, task cards and fixed voice/edit dock; raw sketch confirmation/reopening; Roadmap color/layout actually generate a six-slide tablet artifact. Screenshot evidence: `artifacts/adaptive-input/workbuddy-{color-phone,sketch-phone,roadmap-tablet}.png`.
- Inline saturation/brightness + hue + presets + HEX; keyboard adjustment, drag marker, invalid HEX protection and user override. Removed the native popup color input. Inference adds the chosen HEX; dismissed chips do not immediately reappear.
- Built-in fictional receipt pack, scope approval/rejection and actual four-row summary (one pre-existing + three new). Screenshots: `workbuddy-materials-phone.png`, `workbuddy-approval-phone.png`, `workbuddy-receipt-result.png` in the same evidence directory. This is local demo data, not OCR or a real photographed receipt.
- Core tests cover stale draft/file/scope approval, duplicate approval after restart and preserving original rows. Browser test exercises task switching and receipt output.
- WorkBuddy’s task/chat column remains left of its result/file panel. Narrow result previews now preserve the Roadmap slide ratio; receipt tables use the panel width.

### Still required

- Final object-controller visual audit in native safe areas; browser object/preview/apply and trackpad selection now pass.
- Actual photograph success/adoption and native app-window snapshot on MRDI-W10. Native picker opening, cancellation and foreground return are observed on the phone; browser screenshot/crop, silent recording, camera refusal and synthetic photo recovery pass.
- Remaining native object/capture layout checks and unplugged two-device verification. Both installations, native LAN draft sync and human WorkBuddy speech are now recorded below. Phone compose safe areas and native clipboard have device evidence; these do not satisfy the missing tablet gates.
- Final device acceptance requires real actions from both devices; current browser/build records are listed below.


### Validation checkpoint — 2026-10-14

- `npm run check`: passed.
- `npm test`: 73/73 passed (`artifacts/adaptive-input/core-tests.log`).
- Full browser run: 23 passed / 1 failed; the WPS pointer instrument reported an undefined test counter. The source was being refreshed during that run. With source stable, `wechat-presentation.spec.ts` plus adaptive WorkBuddy passed 4/4 (`final-targeted-regression.json`). This does not erase the original failed run; perform a clean full terminal run at final delivery.
- Latest WorkBuddy color/sketch and running-A → materials/approval-B → A recovery tests: 2/2 passed after the fixed New-button layout (`material-tests.log`).
- Bilibili lost-command/lost-ack + page-reload reconciliation tests passed, alongside its playback/draft flow (`recovery-tests.log`).
- Native capture, native speech/clipboard acceptance and signed device delivery remain unverified for this revision. No Git push or Drive upload was performed.


### Object and capture checkpoint — 2026-10-14

- Repaired the corrupted adaptive CSS source and release-state pointer cleanup. Object controls now retain a fixed voice dock, independent instruction draft, explicit before/after preview, and selected-object format changes. Captured screenshots: `workbuddy-object-{phone,preview,tablet}.png` under `artifacts/adaptive-input/`.
- Actual trackpad movement selects tablet slide objects through their current DOM identities. Synthetic native speech-adapter events exercise recording lifecycle and editable text; they do **not** prove device speech recognition.
- Added actual browser application-element screenshot, crop, explicit reference attachment, and MediaRecorder capture with explicit start/stop and playback verification. Recording is silent, at most 20 seconds, with a bounded payload. The screenshot comes from the current replica window, not a supplied picture or full desktop.
- Capture is scoped to request, application, task and target revision. Switching target, background/release, disconnect or reload invalidates pending work. Cropping and preview remain inert; explicit use adds a reference, preserving draft text. Duplicate use and late completion fail. Original new-task drafts are valid destinations; submitted tasks retain source-file identities.
- Bilibili's capture references can be directed to a WorkBuddy draft; no file is appended to a danmaku message. This isolation is core-tested; a dedicated browser cross-app acceptance check remains to add.
- Screenshot/recording/camera-refusal browser tests: **3/3 passed**, `artifacts/adaptive-input/capture-tests.log`. Camera refusal preserves the exact draft and adds no file. The native camera branch currently reports unavailable; implementing the system picker and its foreground lifecycle is still required.
- Core tests: **80/80 passed**. Typecheck and production build passed. The full frozen-source browser suite passed **27/27**; afterward only crop drag prevention/scroll visibility and Chinese camera errors changed, followed by the targeted **3/3** capture run. Do not describe this as a 28-test full run.
- Both signed HAPs built successfully, including the new own-window snapshot bridge. They are engineering builds, not final accepted release: native camera and capture device validation remain outstanding. No installation was performed at this checkpoint. HDC currently lists only phone `5ZFYD25B13000537`; tablet unavailable.
- Native speech/clipboard, MRDI-W10 capture, safe areas, actual camera success/cancel, and USB-free two-device checks are **not verified** for this revision. No Git push or Drive upload.


### Native phone checkpoint — 2026-10-14

This checkpoint uses **SUP-AL90 → USB reverse TCP → a browser tablet authority**, not a pair of Harmony devices. HDC lists only `5ZFYD25B13000537`; MRDI-W10 is still absent. All records below concern the isolated diagnostic session, not the user's persisted tablet tasks.

| Requirement | Observed evidence | Remaining boundary |
| --- | --- | --- |
| Phone compose safe area | `artifacts/adaptive-input/native-workbuddy-phone.png`: application status row, task cards, one editor, all eight editing tools and voice dock fit above the real gesture bar | Native object/color/sketch/capture states still require their own check |
| System camera | Real system camera picker opened; native accessibility tree includes 拍照 and 安全访问相机; Back returned `已取消拍照，原草稿已保留` and reconnect restored the original target | No shutter press or physical photograph was collected; no photographed-receipt OCR claim |
| Native clipboard | `原生剪贴板测试🙂`: Select All → Cut cleared the browser-authority draft; native PasteButton consent → Paste restored the exact Chinese/emoji string | This proves the shared clipboard path on this phone, not every OS/version |
| Camera lifecycle | Root-level pending preview survives controller unmount/reconnect; no image is transferred until explicit use; original identity is required | Browser adapter events are synthetic, separately covered in `tests/capture.spec.ts` |
| Storage failure | Camera metadata set/remove failures no longer stop live photo preview or adoption; browser test deliberately throws storage errors | A full WebView process loss cannot recover metadata that was never stored |
| Cross-app reference | Dedicated browser test captures Bilibili's active application area, adopts into the selected WorkBuddy draft and preserves both draft text and empty danmaku history | Native tablet capture still unverified |

Camera system layout/cancel evidence: `native-camera-layout.json`, `native-camera-cancel.json` in the evidence directory. Successful installation is confirmed by `phone-bundle-installed.json` and its updateTime; the earlier `phone-bundle.json` predates that install and is not the latest installation proof. Raw images/layouts are private ignored evidence, not bundled assets.

The earlier checkpoints above are historical. In particular, their “native camera unavailable” and “no installation” statements no longer describe the phone checkpoint; they remain relevant to the unverified tablet/photo-success scope. No Git push or Drive upload.


### Frozen-source regression — 2026-10-14, latest engineering build

- Typecheck and **81/81 core tests** passed. The full browser suite passed **30/30** with runtime source held stable; production Web and both signed HAP builds succeeded.
- The preceding full run was 29/30: a WeChat pairing assertion matched both the persistent status row and the closing connection dialog. It now explicitly waits for that dialog to close and checks the status row. The original failed log is retained as `full-regression-pre-locator-fix.log`; the successful terminal log is `full-regression.log`.
- Latest paths, sizes and SHA-256 values are recorded in ignored `artifacts/adaptive-input/checkpoint.json`. Native photo lifecycle/storage-denial coverage uses an adapter fixture; no artificial image or transcript is counted as real camera/speech evidence.
- The goal remains open for the device gates above. The signed build alone is not device acceptance.

Latest signed phone HAP was covered-installed successfully and reopened; bundle readback reports 1.3.0 with updateTime `1792011000270`. The installed vector wordmark and complete Bilibili controller were visually checked in `native-bilibili-vector-phone.jpeg`. Tablet HAP remains built but uninstalled in this checkpoint; HDC still lists only SUP-AL90.


### Compact-layout repair — 2026-10-14

A 360×460 available viewport reduced the capture panel to 52 px, making its actions impractical. Compact capture now overlays the middle editor while retaining its draft and fixed input dock; its own body scrolls. At 360×640, color tools scroll independently and the sketch canvas shrinks to keep the composer, Send and sketch confirmation reachable. Object keyboard mode now toggles off with a second press.

`tests/workbuddy-layout.spec.ts` covers viewport bounds, fixed dock position, the complete composer, sketch confirmation, screenshot adoption and unchanged draft/no task submission. `tests/workbuddy-object.spec.ts` verifies keyboard focus/off semantics. These are browser constraints, not a claim that a native keyboard was exercised. Evidence: `compact-color-phone.png`, `compact-sketch-phone.png` under `artifacts/adaptive-input/`.


### Native pair installation and LAN checkpoint — 2026-10-14

- Frozen-source regression completed **31/31 browser checks**, **81/81 core tests**, typecheck, production Web and both signed HAP builds. These precede the additional native-keyboard/speech-inference refinements; targeted follow-up results are recorded separately below.
- Both SUP-AL90 and MRDI-W10 were identified by HDC and successfully cover-installed with 1.3.0 engineering builds. Bundle readbacks are `phone-bundle-installed.json` and `tablet-bundle-installed.json` under ignored `artifacts/adaptive-input/`.
- Company-network connection failed with native `Network unreachable`. After the user moved both devices to the same iPhone hotspot, discovery found the tablet and manual PIN pairing succeeded. The diagnostic TCP bridge and browser authority were stopped and `hdc fport ls` reported empty.
- With both real apps running, tablet WorkBuddy composer activation opened the phone controller. HDC entered `创建公司Roadmap演示，主色用蓝色` on the phone; tablet accessibility readback contained the identical draft plus inferred `#1971C2`. This verifies native LAN draft/parameter synchronization. USB remained attached for UI observation, so physical USB-disconnected acceptance is still separate.
- Native soft-keyboard contraction exposed a color-panel overflow below 600 CSS px. The browser regression now covers 404×540 and checks that Send stays above the dock. Automatic inference now waits for speech completion so partial transcripts are not rewritten with color parameters; this refinement requires the rebuilt phone.
- Physical-photo adoption, human ASR confirmation for both new controllers, and the unplugged end-to-end scenarios remain open. No Git push or Drive upload.


### Follow-up refinement and user verification — 2026-10-14

- Native-keyboard compact color layout and deferred speech inference passed **4/4 targeted browser checks**, including speech-adapter partial/final ordering and unchanged draft before explicit Send (`native-followup-tests.log`). Typecheck, production Web and both signed HAPs were rebuilt successfully and cover-installed on both devices again. The latest hotspot pair connected successfully.
- The user explicitly confirmed that `帮我做一个ppt。` was spoken in WorkBuddy, recognized correctly and remained editable. This is **human-confirmed native WorkBuddy ASR**, separate from synthetic adapter tests. Bilibili ASR and unplugged delivery remain pending their own confirmation.
- Pending external check: unplug both USB cables while retaining the hotspot, send a WorkBuddy task, then dictate/edit/send a Bilibili danmaku and observe each result on the tablet. Camera success/adoption and remaining advanced native controls are not implied by this check.

Final source-frozen browser rerun after the compact-keyboard and deferred-inference fixes: **32/32 passed** (`full-regression.log`). Both HAPs contain the same rebuilt Web assets; packaging verifies each asset byte against `dist/`. The device-install/ASR/LAN observations above remain separate from pending unplugged and advanced native acceptance.


### Native capture and touch-scroll repair — 2026-10-14

- MRDI-W10 own-window snapshot successfully reached SUP-AL90 over the hotspot. The 960×631 preview visibly contains the current WorkBuddy replica window (`wb-native-window-preview.jpeg`), rather than a seed image. Explicit adoption added `截图 · 17:21.jpg` to the current unsent draft; tablet readback showed the same attachment, with no new task. It survived a subsequent HAP cover-install/reopen.
- Explicit Start/Stop produced a recording preview labelled 4.8 seconds. Playback changed from Play to Pause and its elapsed-time accessibility value progressed from 0:00 to 0:01. This establishes a playable native-produced clip, not exact duration accuracy or moving-content fidelity. The snapshot source was a largely static task page. `native-recording-playback-layout.{json,txt}` retain the readback; no recording was adopted.
- On the phone, swiping directly on the image did not scroll because the preview always set `touch-action:none`; swiping the narrow outside margin worked. The new browser touch-input regression reproduced scrollTop=0 (`capture-touch-before.log`). Normal previews now use `pan-y`; explicit crop mode alone uses `none`. Seven capture/layout browser checks passed (`capture-touch-tests.log`).
- Production Web (including TypeScript check) and both signed HAP builds passed. Both revised HAPs were cover-installed, reopened and paired again. Native swipe through the center of the image now reveals the actual adoption controls. Evidence: `capture-touch-native-after.{txt,jpeg}`. This native check used HDC touch input with USB attached; it does not establish unplugged acceptance.
- The current draft retains the explicitly adopted test screenshot. The second preview was canceled without adding another reference. Existing authored drafts, tasks and files remain intact. Remaining gates include native task/approval/object chains, physical photo adoption, native crop/cross-app capture, and complete unplugged flows.


### Native Roadmap, material approval and object edit — 2026-10-14

Using SUP-AL90 and MRDI-W10 paired on the hotspot, with USB connected for HDC observations:

1. Created a separate `真机验收` Roadmap task, entered red/two-column instructions, drew a stroke and explicitly confirmed it. A native screenshot shows the color parameter `#E03131` and original-stroke thumbnail together before Send (`native-sketch-safearea.jpeg`; despite its name, the frame was captured after confirmation). The draft, color and raw stroke survived the layout-fix HAP upgrade.
2. Sent the task, then selected the receipt task while A was shown running. Chose the built-in three-receipt demo pack, sent the request and explicitly approved its scoped append. Tablet readback reported original one row preserved plus three appended. The fullscreen table contained 32.00, 68.00, 126.00 and 89.00 (`native-receipt-four-rows.json`). This is deterministic demo data, not real receipt OCR.
3. Returned to A and opened its six-slide Roadmap: red theme, left milestones and right key outcomes were visible. Selected its title, typed `把标题改为“季度增长路线图”` on the phone, then requested a preview. Tablet heading remained `公司 Roadmap` until explicit Apply. After Apply, the tablet heading, editable field and thumbnail showed the new title with saved status (`native-object-before-apply.txt`, `native-object-after-apply.txt`, `native-roadmap-applied.jpeg`). This was keyboard/HDC input, not additional speech evidence.
4. Native insets plus a multiline draft exposed sketch toolbar overlap and a keyboard-contracted Send overlap. A new safe-area regression reproduced the toolbar above its middle region (156 versus 207 CSS px). Sketch now yields space to the composer and scrolls its tools if needed. Both revised HAPs were installed; native toolbar bounds moved below the task cards, and confirmation/Send were usable.

The follow-up also exposed long object-preview and running-color overflow. These are being repaired with independently scrolling supplementary content while retaining the composer. Their final test/install result is recorded in the next checkpoint. No user-authored tasks were cleared; this session added one named test Roadmap and used the existing demo-receipt task. Remaining native speech/photo, crop/cross-app, reconnect and unplugged checks are not implied by these results.


### Final native layout follow-up — 2026-10-14

The object context, controls and before/after preview now share an independently scrolling region above the composer; color tools also shrink/scroll when the running-state row consumes space. Six targeted WorkBuddy tests passed (`native-safearea-regression.log`), followed by TypeScript/production build and both signed HAP builds. Both packages were cover-installed and paired again; post-install bundle readbacks and exact hashes are in `checkpoint.json`.

On SUP-AL90 with the real keyboard open, the object Send button now occupies y1163–1319, above the editing dock beginning y1429. Previously it extended to y1515. `native-object-keyboard-after.{txt,jpeg}` records this. Preview content can be swiped independently to reach Continue/Apply; a second test preview was canceled without changing the saved `季度增长路线图` title. Its test draft was cleared, leaving the selected title ready for human speech verification.

The first native Roadmap/approval/object chain used HDC input and attached USB; full speech-driven and unplugged acceptance remain outstanding. The full browser suite is being rerun after the shared controller-layout changes, with its terminal result recorded separately.

### Spoken object instruction / disabled Send repair — 2026-10-14

- Human feedback: `可以识别，但是无法发送，小飞机icon是灰的…鼠标是可以移动的`. Phone readback retained `把标题改为年度发展路线图。` with idle speech and a protected local draft. The exact original blocking event was not logged; do not assert its native cause from the UI alone.
- Re-selected the original title, explicitly recovered the retained draft, sent it, and reviewed/applied the preview through the real phone UI. MRDI-W10 readback confirms both heading and editable field are `年度发展路线图`, with `已保存`. Evidence: `recovered-human-voice-preview.txt`, `human-voice-apply.txt`, `human-voice-tablet-result.txt`. Recognition is user-confirmed; recovery, Send and Apply were operated by HDC, not claimed as an uninterrupted user-only success.
- A transport-order regression reproduced the same protected-draft symptom: delay state snapshots 180 ms while delivering acknowledgements immediately, then send progressive text edits 60 ms apart. Pre-fix `object-ack-order-before.log` fails with the restore button present. A successful receipt now resolves only after the corresponding tablet revision is available; late snapshots cannot regress the same session. Draft writes drain one queue, and leaving a target clears its unsent queue while retaining local text.
- Protected object drafts now show the actual failure reason and an enabled `确认目标` action at the send position. That action restores the draft only; Send still creates a preview and Apply remains explicit. The updated browser case covers delayed snapshots, interrupted draft restoration, no edit on confirmation, progressive input, preview/apply and stale object protection (`object-send-recovery.log`, passing).
- Native ASR needs one more uninterrupted try after this repair. Complete unplugged acceptance, physical photo adoption and remaining capture gates are still outstanding.

### Post-fix human confirmation — 2026-10-14

The user retried native speech on the updated HAPs and confirmed: `可以发送，平板标题也更新了`. This passes the human speech → Send → preview → Apply → tablet-title chain. USB was still available for installation/inspection; this confirmation does not establish unplugged acceptance. The final full browser run passed 34/34 (`object-send-full-regression.log`), core tests passed 81/81, TypeScript/production and both signed HAP builds passed, both installs succeeded and packaged Web bytes match `dist`. Remaining gates are the independently documented capture/photo fidelity and complete unplugged scenarios.

A subsequent read-only tablet dump (`human-object-postfix-success.txt`) shows the page later at `季度增长路线图` with an unsaved marker. It is not evidence of the exact title or saved state at the moment of the user confirmation; no automatic save or overwrite was performed. The post-fix human chain result is explicitly user-reported.


### Capture playback duration check — 2026-10-14

The browser recording test now waits until the decoder reaches the end, checks that the playable output exceeds 1.2 seconds for the controlled recording, and compares its decoded end with the preview label within 0.75 seconds (capture runs at 4 fps). The targeted test passes (`recording-duration-browser.log`). The first attempt used an incorrect descendant selector for the adjacent duration label; the retained failure is a test locator timeout, not a product playback failure. This strengthens browser duration evidence only; the native 4.8-second clip is still not fully timed. No runtime code or installed HAP changed in this check.


### Human photo adoption and USB-free task delivery — 2026-10-14

The user kept both USB cables unplugged and the same hotspot, entered WorkBuddy, activated its composer, took a physical object photo through the phone capture menu, explicitly selected “作为任务参考”, then entered and sent an instruction. The user confirmed: `照片采用、草稿保留和发送都正常`. This confirms successful native camera return, explicit adoption into the original task, preserved draft and phone-to-tablet task/reference delivery without USB. It is independent from the earlier synthetic camera-adapter test. No new HAP was installed between the Bilibili unplugged confirmation and this check. Forced network loss, target-switch interruption, original-photo fidelity and OCR are not implied.


### Human cross-app crop and recording confirmation — 2026-10-14

With the same unplugged device setup, the user confirmed the Bilibili → screenshot → crop → selected WorkBuddy task chain: `圈选参考正确，弹幕未受影响`. The user also confirmed the complete approximately five-second native recording preview: `可以播放5s`. This establishes approximate duration/playability, not frame-by-frame recording fidelity or exact timing. The request following that confirmation is to lengthen the Bilibili source videos, separate from the capture recording limit.

The current complete browser suite passed **35/35** (`current-full-regression.log`), including decoded recording-end/preview-duration comparison. This run precedes the subsequent 30-second source-clip replacement.


### Final native task recovery and human unplugged confirmation — 2026-10-14

On the existing named `真机验收…` Roadmap task, an initially empty follow-up draft was populated with `恢复验收：保留这条备注。`; its existing red parameter and confirmed raw sketch were preserved. Phone Home caused the tablet connection panel to show `连接已断开，正在重新连接`; reopening Input Agent restored `手机已连接` and the exact draft/parameter/sketch. Selecting the existing approved receipt task restored its pre-existing `12345。` draft and the single earlier append receipt. The result still had exactly four data rows (row headers 2–5). Returning to Roadmap restored its independent follow-up. No task was cleared, no approval was repeated, and the test note remained unsent. Evidence: `final-recovery-link-{down,up}.txt`, `final-recovery-returned-phone.txt`, `final-recovery-receipts-{phone,tablet}.txt`, `final-recovery-receipt-result.txt`, `final-recovery-phone-final.txt`.

The user then unplugged both USB cables, switched between the receipt and Roadmap tasks and backgrounded/reopened the phone. They explicitly confirmed: `都保留，重连正常，票据仍是4行`. This closes the outstanding USB-free multi-task recovery check. The initial approval execution is independently evidenced by the earlier native chain; this final check verifies persistence/no replay, not a second approval.
