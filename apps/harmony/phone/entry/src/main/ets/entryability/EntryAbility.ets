import { UIAbility } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { ROLE } from '../Config';
export default class EntryAbility extends UIAbility {
 onCreate():void { AppStorage.setOrCreate('foreground',true); }
 onWindowStageCreate(stage:window.WindowStage):void {
  const w=stage.getMainWindowSync();w.setWindowLayoutFullScreen(true);
  w.setPreferredOrientation(ROLE==='tablet'?window.Orientation.LANDSCAPE:window.Orientation.AUTO_ROTATION);
  stage.loadContent('pages/Index');
 }
 onBackground():void {AppStorage.set('foreground',false);}
 onForeground():void {AppStorage.set('foreground',true);}
}
