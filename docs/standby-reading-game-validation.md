# Standby home, contextual reading and fullscreen game

## Changes
- Scene v3 backs up the prior boss scene under its own version key, preserves its fixed China-time date and all unsent drafts, and installs four casual messages followed by the conversational sales request. Subsequent launches preserve messages. Hover source is unchanged.
- WeChat phone waits on a static reviewed launcher image inside the connected app. Raw device capture is private; crop and edge-extension provenance are in `reference/phone-home.json`. No screenshot icon launches real applications. Native status/gesture bars remain single.
- Only composer activation starts a read. Message taps highlight a bubble without opening the phone editor. The composer pulses twice at 240 ms; the business message receives a complete halo and 700 ms scan. Tablet completion reveals two replies then calendar, route and Feishu actions, each 110 ms apart. Voice geometry, draft tools and local mock services remain intact. The label is AI润色.
- FC is centered inside native system/cutout/navigation insets and has no synthetic gesture line. Action/state copy is Chinese; A/B and brand imagery remain. Mario fills the tablet with a 760:600 canvas scaled uniformly, black letterboxing and a persistent 48 px Back button.

## State and compatibility
- Protocol version 4; `chat.activation` owns epoch, conversation, business message, start time and pulse/scan/ready phase independently of source context and editing target.
- `chat-read-stage` is tablet-local. Phase, epoch, elapsed-time and target validation reject early, repeated and late completion. Network-delivered read-stage commands cannot advance it. Quick replies require a completed read.
- Conversation/app changes and release/disconnect cancel activation. Reconnect requires a fresh composer tap; editing and state snapshots cannot restart the animation. Existing idempotent command IDs and draft revision protection remain.
- `layoutInsets()` reports native window size and system/cutout/navigation insets; phone converts physical pixels to current CSS viewport units and recalculates on rotation. Both HAP bridge lists include it.

## Verification
- 30 core tests cover migration date/draft preservation, backup failure, composer-only activation, early/out-of-order/stale completion, disconnect cancellation and existing business/protocol behavior.
- Seven browser E2E cases cover standby gating, message-only selection, scan-before-recommendation, ordered delays, clipboard/voice adapter regression, WPS, fullscreen geometry, FC centering, multi-touch and switch release. Browser speech/motion adapters are not evidence of a new real speech or sensor trial.
- Signed HAP build and installation on tablet MRDI-W10 and phone SUP-AL90 pass. Native direct TCP pairing observed at 172.20.10.2:39871 ↔ 172.20.10.3; no desktop bridge participates.
- Final signed packages were reinstalled and paired. With computer ports 5188/5189/5191 all closed, tapping the tablet composer still opened 陈总 and the three phone actions (see `ready-final-layout.json`). Final home edge blending was visually reviewed in `phone-standby-v3-final.png`.
- Device screenshots in `artifacts/device-wechat-presentation/`: `phone-standby-v3.png`, `phone-read-ready-v3.png`, `phone-fc-v3.png`, `tablet-mario-v3.png`. The existing user draft remained after migration. One actual system gesture bar remains on FC; the application bar was removed.
- USB remains attached during automated device verification. Unplugged operation and a new spoken-input trial require user observation and are not claimed as passed.

## Delivery
`npm run check`, `npm test`, `npm run build`, `npm run test:browser`, `npm run build:hap`, `npm run package` reproduce checks and packages. ZIPs are in `artifacts/delivery/`; signed HAPs are in `artifacts/hap/{tablet,phone}/`. Packaging verifies embedded Web bytes and excludes private captures/signing credentials. No Git push.
