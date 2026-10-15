# Bilibili input — independent acceptance track

Status: accepted for the agreed local prototype on 2026-10-14. Native USB-free playback/speech/danmaku and cross-app capture are human-confirmed; the added 30-second clip is installed and natively played to its end. Recovery fault coverage is separately recorded in core/browser tests. See `adaptive-input-acceptance.md`.

Authority: Notion PRD section 5.5 (S21), retrieved 2026-10-14; Figma `ApFLno64NcMoA17MiPFfZh` frame `1358:12215`. Phone cold-white/pink glass, current video label, actions, sole composer and fixed dock. Existing Hover videos are permitted by the user; record exact source and hash before bundling.

## 当前验收入口

| 检查范围 | 既有证据 | 最终状态与边界 |
| --- | --- | --- |
| 本地视频、列表、九项应用轮换 | 浏览器实际播放与边界检查；授权 Hover 素材及哈希记录 | 已完成；另增 30 秒视频并在真机播放至结尾 |
| 点赞、收藏、单枚投币、弹幕 | 核心规则和浏览器回执检查；两台鸿蒙设备热点发送与暂停视频弹幕移动、消失截图 | 浏览器及真机动效检查通过；用户确认拔线后发送及飘动正常 |
| 断线与未知回执 | 命令丢失、回执丢失、重载后查询及迟到命令拒绝测试 | 浏览器／核心覆盖丢命令、丢回执和迟到命令；原生共享连接恢复另在 WorkBuddy 验收 |
| 手机布局与输入工具 | SUP-AL90 截图；共享原生剪贴板测试 | 用户独立确认 Bilibili 语音编辑发送及飘动弹幕正常 |
| 交付 | 前序完整 34/34；本轮核心 82/82、Bilibili 5/5、相关回归 9/9；两端签名 HAP 已安装 | 新视频核心 83/83、Bilibili 6/6；两端安装及真机播放通过 |

以下为分阶段历史记录；后面的通过记录只覆盖其明确写出的范围。

## Required evidence

- [x] Ninth desktop/cycle entry and usable hierarchical Back; existing eight scenes retained.
- [x] Real local video playback; current video/list identity; previous/next disable at boundaries; list appears on tablet.
- [x] Pink phone layout matches current Figma; list left, previous/next adjacent right; no phone result page/toast; content color independent of brand.
- [x] Like/favorite/local one-coin action, in-flight protection, authoritative receipt and no duplicate side effect/replay.
- [x] Editable danmaku, explicit send, text color/size/mode; restrictions validated on tablet; failed send preserves draft.
- [x] Switch video/reconnect preserves draft and requires target rebinding; old commands cannot hit new video.
- [x] Native human speech confirmation; shared clipboard evidence; input tools, stable voice dock, keyboard/trackpad; no image or file attachment sending.
- [x] Core protocol tests, paired browser flow, playback progression, layout screenshots, production build.
- [x] Signed HAP build/install and real two-device verification recorded separately from browser proof.

## Evidence log

2026-10-14: New tablet scene and pink phone controller implemented from the reviewed PRD/Figma. Two actual user-authorized Hover video clips are locally bundled; provenance and hashes are in `reference/bilibili-input.json`.

Browser evidence covers actual playback progression, one-coin action, tablet-only results, danmaku send and draft clear, emoji deletion/undo, per-video recovery, boundaries, list and hierarchical Back. `tests/bilibili-input.spec.ts` also drops the command or acknowledgement, reloads the phone, then checks explicit receipt reconciliation without another coin command. Core tests deliver sealed requests after Store restoration and confirm no side effect.

Current screenshots: `artifacts/adaptive-input/bilibili-phone.png` and `bilibili-tablet.png`. The ninth-entry FC/WeChat cycle regression expectations were updated and their targeted flows passed.

Outstanding: Bilibili-specific native speech and disconnected-from-computer dual-device acceptance. Final vector-logo phone check and both-device installation are recorded below. Phone safe-area and shared clipboard paths now have device evidence below. Capture chooser and explicit cross-app adoption have browser tests; native tablet capture remains outstanding. Bilibili does not send attachments. No real Bilibili account, coin spending or publishing occurs.


### Validation checkpoint — 2026-10-14

- `npm run check`: passed.
- `npm test`: 73/73 passed (`artifacts/adaptive-input/core-tests.log`).
- Full browser run: 23 passed / 1 failed; the WPS pointer instrument reported an undefined test counter. The source was being refreshed during that run. With source stable, `wechat-presentation.spec.ts` plus adaptive WorkBuddy passed 4/4 (`final-targeted-regression.json`). This does not erase the original failed run; perform a clean full terminal run at final delivery.
- Latest WorkBuddy color/sketch and running-A → materials/approval-B → A recovery tests: 2/2 passed after the fixed New-button layout (`material-tests.log`).
- Bilibili lost-command/lost-ack + page-reload reconciliation tests passed, alongside its playback/draft flow (`recovery-tests.log`).
- Native capture, native speech/clipboard acceptance and signed device delivery remain unverified for this revision. No Git push or Drive upload was performed.


### Shared-input checkpoint — 2026-10-14

- Bilibili playback, danmaku/draft recovery and both lost-request receipt tests passed in the frozen-source **27/27** full browser run (`artifacts/adaptive-input/full-regression.log`). Core suite **80/80**, typecheck and production build passed.
- Shared capture now performs actual browser screenshot/crop and silent recording. Core verification confirms a Bilibili capture can be explicitly added to a WorkBuddy draft without altering danmaku state. Add the corresponding cross-app browser test before final acceptance.
- Both signed engineering HAPs rebuilt successfully (`hap-build.log`); no installation or native speech/camera/clipboard/device acceptance claimed. Only the Huawei phone was listed by HDC at this checkpoint; MRDI-W10 was absent.
- Still required: native camera, final safe-area/design comparison, installed-phone/tablet validation and USB-free two-device interaction. Goal remains in progress.


### Native phone and visual checkpoint — 2026-10-14

- Actual SUP-AL90 controller screenshot: `artifacts/adaptive-input/native-bilibili-phone.png` (1320×2760). One application row, current video, three media actions, list/previous/next, composer and full input dock remain visible above the real system gesture bar. With the keyboard open, the controller contracts; the send button remains reachable. No synthetic OS bars were added.
- A phone tap on 投币 produced `投币 1` on the browser tablet; the phone retained its input interface. HDC entered `原生弹幕测试🙂`, then the phone's actual Send button submitted exactly that text and cleared the editor. Receiver readback/screenshot: `native-bilibili-actions.json`, `native-bilibili-receiver.png`. This is a local demo action; no Bilibili account was accessed or coin spent.
- Transport was phone native TCP through a USB reverse-port diagnostic bridge to a browser authority. It does **not** prove tablet installation, USB-free LAN operation or real speech.
- Rechecked Figma `1358:12215`: cold-white/pink background, bottom-aligned controls, list at left, previous/next at right, editing dock, top-right app switching/connection match the intended arrangement. Actual clip title and boundary-disabled previous button differ intentionally from the sample's third-of-eight title.
- The original 54 px raster wordmark looked soft at native pixel density. It has been replaced by the exact 16 vector layers and mask from Figma `1374:24760`, retained at their exported dimensions and recorded with hashes in `reference/bilibili-input.json`. Browser geometry is 54×25.16 CSS px. Final installed visual check follows the new signed build.
- Native clipboard is shared with the WorkBuddy controller and was exercised there using Chinese plus emoji; Bilibili speech remains a separate human-verification item.
- Dedicated browser cross-app capture now confirms explicit adoption into WorkBuddy with no danmaku attachment. No Git push or Drive upload.


### Frozen-source regression — 2026-10-14, latest engineering build

- Typecheck and **81/81 core tests** passed. The full browser suite passed **30/30** with runtime source held stable; production Web and both signed HAP builds succeeded.
- The preceding full run was 29/30: a WeChat pairing assertion matched both the persistent status row and the closing connection dialog. It now explicitly waits for that dialog to close and checks the status row. The original failed log is retained as `full-regression-pre-locator-fix.log`; the successful terminal log is `full-regression.log`.
- Latest paths, sizes and SHA-256 values are recorded in ignored `artifacts/adaptive-input/checkpoint.json`. Native photo lifecycle/storage-denial coverage uses an adapter fixture; no artificial image or transcript is counted as real camera/speech evidence.
- The goal remains open for the device gates above. The signed build alone is not device acceptance.

Latest signed phone HAP was covered-installed successfully and reopened; bundle readback reports 1.3.0 with updateTime `1792011000270`. The installed vector wordmark and complete Bilibili controller were visually checked in `native-bilibili-vector-phone.jpeg`. Tablet HAP remains built but uninstalled in this checkpoint; HDC still lists only SUP-AL90.


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


### User-reported paused danmaku failure — 2026-10-14

The user reported that a sent danmaku did not appear on the video. MRDI-W10 accessibility readback showed `弹幕已发送`, two history entries, and playback paused at 0.0/5.0. The rendering code positioned scrolling comments at `left:100%` while also pausing their animation, freezing them outside the clipped video region. Prior checks of history text and DOM visibility were insufficient.

A new paired browser regression reproduced the failure using actual overlay bounds (`danmaku-before-fix.log`). Paused/ended scrolling comments now render centered inside the video; playback resumes scrolling. Timestamp eligibility is forward-only, so seeking earlier no longer displays future comments. The regression verifies paused sending, sending after actual video end, seeking away/back and clipped geometry. All four Bilibili tests passed (`danmaku-tests.log`), including existing delivery/recovery tests. Screenshots: `bilibili-danmaku-paused.png`, `bilibili-danmaku-ended.png`.

This fixes the observed rendering defect in the browser; native installation and on-video readback of this exact repair follow. The user's report is not counted as successful unplugged acceptance.


Native readback of the repair: both rebuilt HAPs cover-installed successfully and paired on the hotspot. `artifacts/adaptive-input/danmaku-repair-native.jpeg` (2800×1840 MRDI-W10 capture) visibly shows three comments inside the paused video, including a yellow comment. The native accessibility tree omitted the overlay spans despite their visible pixels, so the screenshot is the visual evidence. Phone/authority readback also showed a one-coin result and a cleared sent draft. Test input and the user's concurrent edits mixed in one comment; do not treat its exact text as an ASR accuracy sample. No new speech or USB-unplugged acceptance is inferred.

Latest verification for this rendering-only repair: typecheck, Web build, both signed HAP builds and all four Bilibili browser tests passed. The preceding full suite was 32/32; it predates this repair. Core code was unchanged (latest core suite 81/81).


### Requested motion refinement — 2026-10-14

After confirming sending worked, the user requested a natural “显示一下，然后飘走” effect. Scrolling comments now hold visibly for roughly 0.9 seconds, then drift out over the remaining six-second display lifecycle, independently of paused/ended playback. Explicit top/bottom modes remain fixed and fade out. Records and receipts remain unchanged. The native screenshot above proves the preceding static paused fix only; it does not prove the new movement.

All four Bilibili browser tests passed again, now checking actual displacement and complete exit from the clipped video while still paused, in addition to ended-video sending and seek behavior. The user said sending works; HDC also reported no attached devices during that feedback. This supports user-observed Bilibili sending without USB, but does not separately confirm the complete WorkBuddy task chain or ASR accuracy. The latest moving-overlay HAPs were subsequently installed and checked as recorded below.


### Moving-overlay native verification — 2026-10-14

Both current signed HAPs were successfully cover-installed on SUP-AL90 and MRDI-W10, reopened and paired on the iPhone hotspot. Installation logs and post-install bundle readbacks are retained under `artifacts/adaptive-input/`; exact HAP hashes are in `checkpoint.json`. No source changes were needed in this verification turn.

A controlled phone text submission, `弹幕动效测试`, appeared on the paused tablet video, moved left and fully disappeared while the playback position remained 0.0/5.0. The history incremented from four to five and the phone draft cleared. Actual native display captures, not accessibility visibility, establish the motion:

- `danmaku-motion-early.jpeg`: before delivery, draft still present.
- `danmaku-motion-middle.jpeg`: blue text visible near the middle of the video.
- `danmaku-motion-gone.jpeg`: despite its capture filename, this frame shows the text partially clipped at the left edge, not yet fully gone.
- `danmaku-motion-finished.jpeg`: text fully gone, history retained.

Capture offsets in `danmaku-motion-timing.json` are relative to the HDC click command, not delivery or animation start; they cannot establish exact native animation duration. The 0.9-second hold and six-second lifecycle are implementation/browser evidence. USB was attached for observation, and the input was automated text, so this check does not add native speech or unplugged acceptance. Earlier user-observed unplugged Bilibili sending remains separately recorded above.

### Latest Figma playback control audit — 2026-10-14

Live `get_design_context` for frame `1358:12215` confirmed controls absent from the prior build: play/pause, 1×/1.5×/2×, continuous volume with mute, and fullscreen/list switching. Added these controls above the single elastic composer, retaining the fixed dock and omitting phone seeking. The authoritative video identity/epoch guards every operation; invalid rate/volume is rejected. Playback parameters are applied to the tablet HTMLVideoElement and preserved across clips. Back exits fullscreen before leaving Bilibili. Existing saved drafts/reactions are retained when adding the new defaults.

The four new static assets were exported from their exact Figma nodes and bundled locally; source hashes/root dimensions are in `reference/bilibili-input.json`. The rendered phone was visually compared to the returned Figma screenshot (`bili-playback-figma-phone.png`). No pixel identity claim.

82 core checks, TypeScript/production build and all 5 Bilibili browser tests passed. The new paired browser test inspects actual media playbackRate/volume/muted/paused/currentTime, full-viewport video geometry, clip changes and native-inset compact layouts. This does not prove native sound output or real-device speed accuracy; installation and native observations follow separately.

### Native playback controller — 2026-10-14

Both updated 1.3.0 HAPs were installed on SUP-AL90 and MRDI-W10 and paired over the iPhone hotspot. Phone UI inspection and `bili-native-playback-phone.jpeg` show every new control, composer and fixed dock within one native portrait screen. Actual tablet video events report 1.1/5.0 while playing and 2.3/5.0 after phone Pause (`bili-native-playing-tablet.txt`, `bili-native-paused-tablet.txt`). This is native media progression, beyond a button-state check.

The phone switched to clip 2 and back to clip 1; slider drag changed the authoritative display from 60% to 35%; mute/unmute changed its action; 1.5× remained selected. Fullscreen expanded the video area across the tablet, preserving aspect ratio, and local Back returned to the list layout. Native captures/readbacks are `bili-native-{next,previous,volume,muted,unmuted,full-tablet,full-back}.txt` and `bili-native-playback-tablet.jpeg`. Native audibility and precise speed timing were not measured: actual HTML media property checks are browser evidence only. A final follow-up reserves space between the tablet Recent and Connection buttons; its geometry regression passed after catching the overlap.

5 Bilibili tests, 9 related capture/FC/WeChat/object regressions, and the final playback geometry case pass. Current full-suite baseline is the preceding 34/34 run; this change adds a fifth Bilibili test, and is not reported as a new full 35/35 run. Core 82/82 and signed builds pass. Human Bilibili speech, audible volume and complete unplugged flow remain a distinct final gate.

Final header follow-up: both signed HAPs cover-installed and hotspot re-paired. Native tablet readback separates Recent at x2554–2657 from Connection at x2682–2784 (`bili-playback-final-tablet.txt`); phone retains the full controller (`bili-playback-final-phone.txt`). No HDC forwards or diagnostic TCP bridge are active. A human question for unplugged playback/audio and native speech/danmaku is pending; no implied pass.


### Human USB-free playback and speech acceptance — 2026-10-14

After installing the current playback-controller HAPs, the user was asked to unplug both USB cables, retain the same hotspot, use phone play/pause and volume, then dictate/edit/send “这段视频不错” and observe the moving comment. The user answered: `都正常，拔 USB 后也能用`. This is human-confirmed native, computer-independent playback control, audible volume change, editable speech submission and visible/drifting danmaku. It does not claim precise rate timing, forced network-loss recovery, native crop/cross-app capture or WorkBuddy photo adoption. No further Bilibili speech or basic unplugged retest is required for this build.


### Human cross-app crop and recording confirmation — 2026-10-14

With the same unplugged device setup, the user confirmed the Bilibili → screenshot → crop → selected WorkBuddy task chain: `圈选参考正确，弹幕未受影响`. The user also confirmed the complete approximately five-second native recording preview: `可以播放5s`. This establishes approximate duration/playability, not frame-by-frame recording fidelity or exact timing. The request following that confirmation is to lengthen the Bilibili source videos, separate from the capture recording limit.

The current complete browser suite passed **35/35** (`current-full-regression.log`), including decoded recording-end/preview-duration comparison. This run precedes the subsequent 30-second source-clip replacement.


### Longer local video — 2026-10-14

The user requested an original/30-second video after confirming recording preview playback. Both Hover source URLs were located; unauthenticated YouTube retrieval requested sign-in, so neither browser cookies nor credentials were exported. Both existing clips remain. A new third entry uses Big Buck Bunny 01:00–01:30 from Blender Foundation's official 720p download, under CC BY 3.0. Credit appears below the player; original URLs, edit interval and hashes are in `reference/bilibili-input.json`. The full original stays in ignored artifacts; only the reviewed 30-second excerpt and poster are bundled.

FFprobe confirms 30.000 seconds, 1280×720 H.264 and 48 kHz AAC; full FFmpeg decode succeeds. The continuous excerpt is 5,662,870 bytes. A catalog migration merges new per-video defaults without replacing earlier drafts, reactions, balances or receipts (83/83 core checks). Typecheck/Web build and both signed HAP builds pass. All 6 Bilibili browser checks pass, including playback beyond the former five-second length, actual pause, danmaku, reaching the 30-second end and list boundaries. The preceding full suite passed 35/35; no new full 36/36 claim.

Both longer-media HAPs cover-installed successfully and were re-paired over the hotspot. Phone installation initially returned `Connect server failed`; the sequential retry succeeded (`phone-long-video-install-retry.log`). Current bundle readbacks confirm both 1.3.0 updates. MRDI-W10 reported 0.0/30.0, then 6.9/30.0 after phone Play, and finally 30.0/30.0 with Play restored. `bunny-native.jpeg` shows the animated source at 26.6 seconds; `long-video-native-{ready,progress,ended}.txt` retain the authoritative media readbacks. Both devices are left on the third video. This final check used USB for observation; the earlier unplugged control/speech confirmations remain separate.
