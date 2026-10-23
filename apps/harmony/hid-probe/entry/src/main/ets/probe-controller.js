// Independent public HID experiment. No third-party application code.
export const KEYBOARD_DESCRIPTOR = [
  0x05, 0x01, 0x09, 0x06, 0xa1, 0x01,
  0x05, 0x07, 0x19, 0xe0, 0x29, 0xe7, 0x15, 0x00, 0x25, 0x01,
  0x75, 0x01, 0x95, 0x08, 0x81, 0x02,
  0x95, 0x01, 0x75, 0x08, 0x81, 0x01,
  0x95, 0x05, 0x75, 0x01, 0x05, 0x08, 0x19, 0x01, 0x29, 0x05, 0x91, 0x02,
  0x95, 0x01, 0x75, 0x03, 0x91, 0x01,
  0x95, 0x06, 0x75, 0x08, 0x15, 0x00, 0x25, 0x65,
  0x05, 0x07, 0x19, 0x00, 0x29, 0x65, 0x81, 0x00, 0xc0
];
export const emptyReport = () => new Uint8Array(8);
const keyReport = key => new Uint8Array([0, 0, key, 0, 0, 0, 0, 0]);
const codeOf = error => String(error && error.code !== undefined ? error.code : 'unknown');

export class ProbeController {
  constructor(factory, schedule = setTimeout, cancel = clearTimeout) {
    this.factory = factory;
    this.schedule = schedule;
    this.cancelTimer = cancel;
    this.profile = null;
    this.timers = [];
    this.epoch = 0;
    this.foreground = true;
    this.currentReport = emptyReport();
    this.state = { supported: false, registered: false, connected: false, busy: false,
      pending: false, host: '', status: '点击检测并启用', error: '', log: [] };
  }
  note(message) {
    this.state.log = [...this.state.log.slice(-19), message];
  }
  fail(stage, error) {
    this.state.error = `${stage}失败 (${codeOf(error)})`;
    this.state.status = this.state.error;
    this.note(this.state.error);
  }
  snapshot() { return JSON.stringify(this.state); }
  begin() {
    if (!this.foreground || this.state.pending || this.state.registered) return;
    this.stop();
    const epoch = ++this.epoch;
    this.state.error = '';
    this.state.supported = false;
    try {
      const profile = this.factory();
      if (!profile) {
        this.state.status = '手机未提供 HID Device 接口';
        this.note(this.state.status);
        return;
      }
      this.state.supported = true;
      this.profile = profile;
      profile.on('connectionStateChange', event => {
        if (epoch !== this.epoch || !this.foreground) return;
        const address = typeof event.deviceId === 'string' ? event.deviceId : event.deviceId?.address;
        this.note(`Profile 状态 ${event.state}，原因 ${event.cause ?? '-'}，目标匹配 ${address === this.state.host}`);
        if (!this.state.host || address !== this.state.host) {
          if (event.state === 2) {
            this.clearWork();
            this.state.connected = false;
            try { profile.disconnect(); } catch (error) { this.fail('拒绝其他目标', error); }
            this.state.status = '连接目标不匹配，已断开';
          }
          return;
        }
        this.state.connected = event.state === 2 && this.state.registered;
        if (this.state.connected) {
          this.clearWork();
          this.state.status = '输入通道已连接';
        } else if (event.state === 1) {
          this.state.status = '正在连接';
        } else {
          this.clearWork();
          this.currentReport = emptyReport();
          this.state.status = '连接未完成，请检查 Mac 蓝牙后重试';
        }
      });
      if (typeof profile.onGetReport === 'function') {
        profile.onGetReport(request => {
          if (epoch !== this.epoch || !this.foreground || !this.state.registered) return;
          try {
            if (request.id !== 0 || (request.type !== 1 && request.type !== 2)) {
              profile.reportError(2);
              return;
            }
            profile.replyReport(request.type, 0, request.type === 1 ? this.currentReport : new Uint8Array([0]));
          } catch (error) { this.fail('应答报告', error); }
        });
      }
      this.state.pending = true;
      this.state.status = '正在注册键盘';
      profile.registerHidDevice({ name: 'Input Agent HID Probe', description: 'Independent keyboard test',
        provider: 'hmilab', subclass: 64, descriptors: new Uint8Array(KEYBOARD_DESCRIPTOR) }, {}, {}, registered => {
        if (epoch !== this.epoch || !this.foreground) return;
        this.state.pending = false;
        this.state.registered = registered === true;
        this.state.status = registered ? '键盘已注册，请选择 Mac' : '键盘已解除注册';
        this.note(`注册回调 ${registered}`);
        if (!registered) {
          this.state.connected = false;
          this.clearWork();
        }
      });
    } catch (error) {
      this.state.pending = false;
      this.fail('注册', error);
    }
  }
  connect(host) {
    if (!this.foreground || !this.state.registered || !host || !this.profile) return;
    this.clearWork();
    if (this.state.connected) {
      this.release();
      try { this.profile.disconnect(); } catch (error) { this.fail('断开旧连接', error); return; }
    }
    this.state.host = host;
    this.state.connected = false;
    this.state.status = '正在连接';
    // getPairedDevices returns virtual addresses; REAL would address the wrong peer.
    try {
      this.profile.connect({ address: host, addressType: 1 });
      const epoch = this.epoch;
      this.timers.push(this.schedule(() => {
        if (epoch !== this.epoch || this.state.connected) return;
        this.state.status = '连接超时，可在 Mac 蓝牙设置中重试';
        this.note('12 秒内未收到连接成功事件');
      }, 12000));
    }
    catch (error) { this.fail('连接', error); }
  }
  clearWork() {
    this.timers.forEach(timer => this.cancelTimer(timer));
    this.timers = [];
    this.state.busy = false;
  }
  release() {
    this.clearWork();
    if (!this.profile || !this.state.connected) return;
    try {
      this.profile.sendReport(0, emptyReport());
      this.currentReport = emptyReport();
      this.note('已发送全部松开报告');
    } catch (error) { this.fail('松开按键', error); }
  }
  sendRea() {
    if (!this.foreground || !this.state.connected || !this.state.registered || this.state.busy) return;
    this.state.busy = true;
    this.state.error = '';
    this.state.status = '正在发送 rea';
    const epoch = this.epoch;
    const frames = [keyReport(0x15), emptyReport(), keyReport(0x08), emptyReport(), keyReport(0x04), emptyReport()];
    frames.forEach((frame, index) => {
      const timer = this.schedule(() => {
        if (epoch !== this.epoch || !this.foreground || !this.state.connected || !this.state.registered) return;
        try {
          this.profile.sendReport(0, frame);
          this.currentReport = frame;
          this.note(`报告 ${index + 1}/6：${frame[2] ? '按下' : '松开'}`);
          if (index === frames.length - 1) {
            this.clearWork();
            this.state.status = '已发送，请在 Mac 核对';
          }
        } catch (error) {
          this.clearWork();
          this.release();
          this.fail('发送', error);
        }
      }, index * 120);
      this.timers.push(timer);
    });
  }
  stop() {
    this.release();
    this.epoch++;
    const profile = this.profile;
    this.profile = null;
    if (profile) {
      try { profile.off('connectionStateChange'); } catch (error) { this.note(`取消监听 (${codeOf(error)})`); }
      if (typeof profile.offGetReport === 'function') {
        try { profile.offGetReport(); } catch (error) { this.note(`取消报告监听 (${codeOf(error)})`); }
      }
      try { profile.unregisterHidDevice(); } catch (error) { this.fail('解除注册', error); }
    }
    this.state.registered = false;
    this.state.connected = false;
    this.state.pending = false;
    this.currentReport = emptyReport();
    if (!this.state.error) this.state.status = '已停止';
  }
  setForeground(value) {
    this.foreground = value;
    if (!value) this.stop();
  }
}
