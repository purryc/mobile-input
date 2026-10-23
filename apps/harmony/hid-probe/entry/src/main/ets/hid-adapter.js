import hid from '@ohos.bluetooth.hid';
import connection from '@ohos.bluetooth.connection';
import { ProbeController } from './probe-controller';

const probe = new ProbeController(() => {
  if (typeof hid.createHidDeviceProfile !== 'function') return null;
  return hid.createHidDeviceProfile();
});
let paired = [];
export function snapshot() { return probe.snapshot(); }
export function begin() { probe.begin(); }
export function stop() { probe.stop(); }
export function foreground(value) { probe.setForeground(value); }
export function sendRea() { probe.sendRea(); }
export function release() { probe.release(); }
export function listHosts() {
  try {
    paired = connection.getPairedDevices();
    return JSON.stringify(paired.map((address, index) => ({ index, name: connection.getRemoteDeviceName(address) || `设备 ${index + 1}` })));
  } catch (error) {
    probe.fail('读取配对记录', error);
    return '[]';
  }
}
export function connectHost(index) {
  if (Number.isInteger(index) && index >= 0 && index < paired.length) probe.connect(paired[index]);
}
