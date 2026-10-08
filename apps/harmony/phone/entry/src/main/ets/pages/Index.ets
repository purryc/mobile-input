import { webview } from '@kit.ArkWeb';
import { common } from '@kit.AbilityKit';
import { NativeBridge } from '../NativeBridge';
import { localResponse, LOCAL_ORIGIN } from '../LocalAssets';
@Entry
@Component
struct Index {
 private controller:webview.WebviewController=new webview.WebviewController();
 private bridge:NativeBridge=new NativeBridge(this.getUIContext().getHostContext() as common.UIAbilityContext,this.controller);
 @StorageLink('pasteRequest') pasteRequest:string='';
 @StorageLink('foreground') @Watch('changed') foreground:boolean=true;
 changed():void {this.bridge.foreground(this.foreground);}
 onBackPress():boolean {if(this.pasteRequest){this.bridge.cancelPaste(this.pasteRequest);this.pasteRequest='';return true;}this.controller.runJavaScript("window.dispatchEvent(new Event('native-back'))");return true;}
 aboutToDisappear():void {this.bridge.close();}
 build(){Stack(){Web({src:LOCAL_ORIGIN+'index.html',controller:this.controller}).width('100%').height('100%').javaScriptAccess(true).domStorageAccess(true).fileAccess(false)
 .onInterceptRequest(event=>localResponse(event.request.getRequestUrl(),this.getUIContext().getHostContext() as common.UIAbilityContext))
 .javaScriptProxy({object:this.bridge,name:'MobileNative',methodList:['clipboard','role','host','connect','discover','send','scan','startRecognition','stopRecognition','cancelRecognition'],controller:this.controller})
 .onPageEnd(()=>{this.bridge.ready();})
 if(this.pasteRequest){
  Column({space:20}){
   PasteButton({icon:PasteIconStyle.LINES,text:PasteDescription.PASTE,buttonType:ButtonType.Capsule})
    .width(200).height(52)
    .onClick((event:ClickEvent,result:PasteButtonOnClickResult)=>{
     if(result===PasteButtonOnClickResult.SUCCESS){this.bridge.readPaste(this.pasteRequest);this.pasteRequest='';}
    })
   Button('取消').onClick(()=>{this.bridge.cancelPaste(this.pasteRequest);this.pasteRequest='';})
  }.padding(30).backgroundColor('#F3F6F7').borderRadius(26).shadow({radius:24,color:'#44000000'})
 }
 }.width('100%').height('100%')}
}
