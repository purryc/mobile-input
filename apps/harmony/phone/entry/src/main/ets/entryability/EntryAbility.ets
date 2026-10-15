import { distributedLink } from '../DistributedLink';
import { UIAbility, AbilityConstant } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { ROLE } from '../Config';
export default class EntryAbility extends UIAbility {
 onCreate():void { distributedLink.configure(this.context); AppStorage.setOrCreate('foreground',true); }
 onCollaborate(params:Record<string,Object>):AbilityConstant.CollaborateResult {distributedLink.configure(this.context);return distributedLink.accept(params) as AbilityConstant.CollaborateResult;}
 onWindowStageCreate(stage:window.WindowStage):void {
  const w=stage.getMainWindowSync();w.setWindowLayoutFullScreen(true);
  w.setPreferredOrientation(ROLE==='tablet'?window.Orientation.LANDSCAPE:window.Orientation.AUTO_ROTATION);
  stage.loadContent('pages/Index');
 }
 onBackground():void {AppStorage.set('foreground',false);}
 onForeground():void {AppStorage.set('foreground',true);}
}
