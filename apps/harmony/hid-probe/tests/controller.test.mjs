import test from 'node:test';
import assert from 'node:assert/strict';
import { ProbeController, KEYBOARD_DESCRIPTOR } from '../entry/src/main/ets/probe-controller.js';

function setup() {
  let sequence = 0;
  const jobs = new Map(), reports = [], callbacks = {};
  const profile = {
    on: (_, callback) => { callbacks.connection = callback; },
    off: () => {},
    registerHidDevice: (_sdp, _in, _out, callback) => { callbacks.registration = callback; },
    unregisterHidDevice: () => {},
    connect: address => { callbacks.address = address; },
    disconnect: () => { callbacks.disconnected = true; },
    sendReport: (id, bytes) => { reports.push({ id, bytes: [...bytes] }); }
  };
  const probe = new ProbeController(() => profile, (run, time) => { jobs.set(++sequence, { run, time }); return sequence; }, id => jobs.delete(id));
  const tick = time => {
    for (const [id, job] of [...jobs].sort((a, b) => a[1].time - b[1].time)) {
      if (job.time <= time && jobs.has(id)) { jobs.delete(id); job.run(); }
    }
  };
  const ready = () => { probe.begin(); callbacks.registration(true); probe.connect('test-host'); callbacks.connection({ deviceId: 'test-host', state: 2 }); };
  return { probe, profile, jobs, reports, callbacks, tick, ready };
}

test('descriptor input/output sizes match an 8-byte keyboard report and 1-byte LEDs', () => {
  let size = 0, count = 0, inputBits = 0, outputBits = 0;
  for (let i = 0; i < KEYBOARD_DESCRIPTOR.length;) {
    const tag = KEYBOARD_DESCRIPTOR[i++], length = [0, 1, 2, 4][tag & 3];
    const value = KEYBOARD_DESCRIPTOR.slice(i, i + length).reduce((n, byte, j) => n + byte * 2 ** (8 * j), 0);
    i += length;
    if ((tag & 0xfc) === 0x74) size = value;
    if ((tag & 0xfc) === 0x94) count = value;
    if ((tag & 0xfc) === 0x80) inputBits += size * count;
    if ((tag & 0xfc) === 0x90) outputBits += size * count;
  }
  assert.equal(inputBits, 64); assert.equal(outputBits, 8);
});
test('no send before registration and connection; rea has paired down/up reports', () => {
  const s = setup(); s.probe.sendRea(); s.tick(999); assert.equal(s.reports.length, 0);
  s.ready(); assert.equal(s.reports.length, 0);
  assert.deepEqual(s.callbacks.address, { address: 'test-host', addressType: 1 });
  s.probe.sendRea(); s.probe.sendRea(); s.tick(999);
  assert.deepEqual(s.reports.map(x => x.bytes[2]), [0x15, 0, 0x08, 0, 0x04, 0]);
  assert(s.reports.every(x => x.id === 0 && x.bytes.length === 8));
  assert.equal(s.probe.state.busy, false);
  assert.match(s.probe.state.status, /Mac/);
});
test('background releases held key, cancels remaining input and ignores stale callbacks', () => {
  const s = setup(); s.ready(); const late = s.callbacks.connection;
  s.probe.sendRea(); s.tick(0); s.probe.setForeground(false); s.tick(999);
  late({ deviceId: 'test-host', state: 2 }); s.callbacks.registration(true);
  assert.deepEqual(s.reports.map(x => x.bytes[2]), [0x15, 0]);
  assert.equal(s.probe.state.registered, false); assert.equal(s.probe.state.connected, false);
  s.probe.setForeground(true); s.tick(999); assert.equal(s.reports.length, 2);
});
test('disconnect cancels queued input and reconnect never replays it', () => {
  const s = setup(); s.ready(); s.probe.sendRea(); s.tick(0);
  s.callbacks.connection({ deviceId: 'test-host', state: 0 }); s.tick(999);
  s.callbacks.connection({ deviceId: 'test-host', state: 2 }); s.tick(999);
  assert.equal(s.reports.length, 1); assert.equal(s.probe.state.busy, false);
});
test('a different inbound host is disconnected and never gains send access', () => {
  const s = setup(); s.ready(); s.callbacks.connection({ deviceId: 'other-host', state: 2 });
  s.probe.sendRea(); s.tick(999);
  assert.equal(s.callbacks.disconnected, true); assert.equal(s.reports.length, 0);
});
test('connecting notification preserves timeout and stop cancels it', () => {
  const s = setup(); s.probe.begin(); s.callbacks.registration(true); s.probe.connect('test-host');
  s.callbacks.connection({ deviceId: 'test-host', state: 1 }); s.tick(12000);
  assert.match(s.probe.state.status, /超时/);
  assert.equal(s.probe.state.connected, false);
  s.probe.connect('test-host'); s.probe.stop(); s.tick(24000);
  assert.equal(s.probe.state.status, '已停止');
  assert.equal(s.reports.length, 0);
});
test('unsupported devices and failed releases remain explicit failures', () => {
  const unsupported = new ProbeController(() => null); unsupported.begin();
  assert.equal(unsupported.state.supported, false);
  const s = setup(); s.ready(); s.profile.sendReport = () => { throw { code: 2903053 }; };
  s.probe.stop(); assert.match(s.probe.state.error, /2903053/);
  assert.equal(s.probe.state.connected, false);
});
