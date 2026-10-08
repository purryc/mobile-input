from pathlib import Path
import json,sys
if '--regenerate' not in sys.argv:
 sys.exit('Bootstrap only: source already exists. Use build-hap.py; --regenerate overwrites shells.')
root=Path(__file__).resolve().parents[1]/'apps/harmony'
for role,name in [('tablet','Input Agent'),('phone','Input Agent')]:
 p=root/role
 files={
 'oh-package.json5':{'modelVersion':'6.0.2','name':f'mobile-input-{role}','version':'1.0.0','dependencies':{},'devDependencies':{}},
 'hvigor/hvigor-config.json5':{'modelVersion':'6.0.2','dependencies':{}},
 'build-profile.example.json5':{'app':{'signingConfigs':[],'products':[{'name':'default','compatibleSdkVersion':'6.0.2(22)','targetSdkVersion':'6.0.2(22)','runtimeOS':'HarmonyOS'}]},'modules':[{'name':'entry','srcPath':'./entry','targets':[{'name':'default','applyToProducts':['default']}]}]},
 'AppScope/app.json5':{'app':{'bundleName':f'com.hmilab.mobileinput.{role}','vendor':'hmilab','versionCode':1001001,'versionName':'1.1.1','icon':'$media:app_icon','label':'$string:app_name'}},
 'AppScope/resources/base/element/string.json':{'string':[{'name':'app_name','value':name}]},
 'entry/build-profile.json5':{'apiType':'stageMode','buildOption':{}},
 'entry/oh-package.json5':{'name':'entry','version':'1.0.0','dependencies':{}},
 'entry/src/main/resources/base/profile/main_pages.json':{'src':['pages/Index']},
 'entry/src/main/resources/base/element/string.json':{'string':[{'name':'app_name','value':name},{'name':'module_desc','value':'Input Agent'},{'name':'mic_reason','value':'将您说的话转成可编辑文字'},{'name':'camera_reason','value':'扫描平板配对码'}]},
 'entry/src/main/resources/base/element/color.json':{'color':[{'name':'start_window_background','value':'#F3F5F9'}]},
 'entry/src/main/module.json5':{'module':{'name':'entry','type':'entry','description':'$string:module_desc','mainElement':'EntryAbility','deviceTypes':['tablet','phone'],'deliveryWithInstall':True,'installationFree':False,'pages':'$profile:main_pages','abilities':[{'name':'EntryAbility','srcEntry':'./ets/entryability/EntryAbility.ets','icon':'$media:app_icon','label':'$string:app_name','startWindowIcon':'$media:app_icon','startWindowBackground':'$color:start_window_background','exported':True,'skills':[{'entities':['entity.system.home'],'actions':['action.system.home']}]}],'requestPermissions':[{'name':'ohos.permission.INTERNET'},{'name':'ohos.permission.GET_NETWORK_INFO'},{'name':'ohos.permission.MICROPHONE','reason':'$string:mic_reason','usedScene':{'abilities':['EntryAbility'],'when':'inuse'}},{'name':'ohos.permission.CAMERA','reason':'$string:camera_reason','usedScene':{'abilities':['EntryAbility'],'when':'inuse'}}]}}
 }
 for f,d in files.items():
  q=p/f;q.parent.mkdir(parents=True,exist_ok=True);q.write_text(json.dumps(d,ensure_ascii=False,indent=2))
 for f,kind in [('hvigorfile.ts','appTasks'),('entry/hvigorfile.ts','hapTasks')]:
  (p/f).write_text(f"import {{ {kind} }} from '@ohos/hvigor-ohos-plugin';\nexport default {{system: {kind},plugins:[]}};\n")
 svg='<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" rx="44" fill="#2563EB"/><rect x="38" y="40" width="78" height="100" rx="12" fill="white"/><rect x="122" y="70" width="34" height="70" rx="9" fill="#A5F3D0"/><circle cx="77" cy="118" r="6" fill="#2563EB"/></svg>'
 for pre in ['AppScope/resources','entry/src/main/resources']:
  q=p/pre/'base/media/app_icon.svg';q.parent.mkdir(parents=True,exist_ok=True);q.write_text(svg)
 q=p/'entry/src/main/ets';(q/'pages').mkdir(parents=True,exist_ok=True);(q/'entryability').mkdir(exist_ok=True)
 (q/'Config.ets').write_text(f"export const ROLE:string='{role}';\n")
 (q/'entryability/EntryAbility.ets').write_text('''import { UIAbility } from '@kit.AbilityKit';
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
''')
 (q/'pages/Index.ets').write_text('''import { webview } from '@kit.ArkWeb';
import { common } from '@kit.AbilityKit';
import { NativeBridge } from '../NativeBridge';
import { ROLE } from '../Config';
@Entry
@Component
struct Index {
 private controller:webview.WebviewController=new webview.WebviewController();
 private bridge:NativeBridge=new NativeBridge(this.getUIContext().getHostContext() as common.UIAbilityContext,this.controller);
 @StorageLink('foreground') @Watch('changed') foreground:boolean=true;
 changed():void {this.bridge.foreground(this.foreground);}
 aboutToDisappear():void {this.bridge.close();}
 build(){Stack(){Web({src:$rawfile('web/index.html'),controller:this.controller}).width('100%').height('100%').javaScriptAccess(true).domStorageAccess(true).fileAccess(true)
 .javaScriptProxy({object:this.bridge,name:'MobileNative',methodList:['role','host','connect','discover','send','scan','startRecognition','stopRecognition','cancelRecognition'],controller:this.controller})
 .onPageEnd(()=>{this.bridge.ready();})}.width('100%').height('100%')}
}
''')
