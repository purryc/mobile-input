import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { BusinessError } from '@kit.BasicServicesKit';
import { foreground, stop } from '../hid-adapter';

export default class EntryAbility extends UIAbility {
  onCreate(): void { foreground(true); }
  onWindowStageCreate(stage: window.WindowStage): void {
    try {
      stage.loadContent('pages/Index', (error) => {
        if (error.code) {
          stop();
          hilog.error(0x0000, 'HidProbe', 'Page load failed: %{public}d', error.code);
        }
      });
    } catch (error) {
      stop();
      hilog.error(0x0000, 'HidProbe', 'Page load failed: %{public}d', (error as BusinessError).code);
    }
  }
  onForeground(): void { foreground(true); }
  onBackground(): void { foreground(false); }
  onDestroy(): void { stop(); }
}
