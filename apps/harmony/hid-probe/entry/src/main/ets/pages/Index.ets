import { abilityAccessCtrl, common } from '@kit.AbilityKit';
import { snapshot, begin, stop, sendRea, release, listHosts, connectHost } from '../hid-adapter';

interface ProbeState {
  supported: boolean;
  registered: boolean;
  connected: boolean;
  busy: boolean;
  pending: boolean;
  host: string;
  status: string;
  error: string;
  log: string[];
}
interface Host { index: number; name: string; }

@Entry
@Component
struct Index {
  @State status: string = '点击检测并启用';
  @State registered: boolean = false;
  @State connected: boolean = false;
  @State busy: boolean = false;
  @State pending: boolean = false;
  @State hosts: Host[] = [];
  @State logs: string = '';
  private timer: number = -1;

  refresh(): void {
    const state: ProbeState = JSON.parse(snapshot()) as ProbeState;
    this.status = state.status;
    this.registered = state.registered;
    this.connected = state.connected;
    this.busy = state.busy;
    this.pending = state.pending;
    this.logs = state.log.join('\n');
  }
  async enable(): Promise<void> {
    const context = this.getUIContext().getHostContext() as common.UIAbilityContext;
    try {
      const result = await abilityAccessCtrl.createAtManager().requestPermissionsFromUser(context, ['ohos.permission.ACCESS_BLUETOOTH']);
      if (result.authResults.length === 0 || result.authResults[0] !== 0) {
        this.status = '需要蓝牙权限才能继续';
        return;
      }
      begin();
      this.hosts = JSON.parse(listHosts()) as Host[];
      this.refresh();
    } catch (_) { this.status = '蓝牙授权未完成，请重试'; }
  }
  aboutToAppear(): void { this.refresh(); this.timer = setInterval(() => this.refresh(), 200); }
  aboutToDisappear(): void { clearInterval(this.timer); stop(); }
  build() {
    Scroll() {
      Column({ space: 20 }) {
        Text('蓝牙键盘探针').fontSize(28).fontWeight(FontWeight.Bold).width('100%')
        Text(this.status).fontSize(20).fontColor(this.connected ? '#087C58' : '#35445C').width('100%')
        Button('检测并启用').width('100%').height(52).enabled(!this.registered && !this.pending)
          .onClick(() => this.enable())
        if (this.hosts.length > 0) {
          Text('连接到').width('100%').fontSize(16)
          ForEach(this.hosts, (host: Host) => {
            Button(host.name).width('100%').height(52).enabled(this.registered && !this.busy)
              .onClick(() => { connectHost(host.index); this.refresh(); })
          }, (host: Host) => `${host.index}`)
        }
        Button('发送 rea').width('100%').height(64).fontSize(24)
          .enabled(this.connected && !this.busy).onClick(() => { sendRea(); this.refresh(); })
        Row({ space: 12 }) {
          Button('松开按键').layoutWeight(1).height(52).onClick(() => { release(); this.refresh(); })
          Button('停止').layoutWeight(1).height(52).backgroundColor('#B43C4D').onClick(() => { stop(); this.refresh(); })
        }.width('100%')
        Text(this.logs).fontSize(13).fontColor('#5E6E85').width('100%')
      }.padding(24).width('100%').alignItems(HorizontalAlign.Start)
    }.width('100%').height('100%').backgroundColor('#F3F6FB')
  }
}
