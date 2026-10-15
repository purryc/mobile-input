import { distributedLink } from './DistributedLink';
import { ChatGpt } from './ChatGpt';
import { photoCapture } from './PhotoCapture';
import { windowCapture } from './WindowCapture';
import { PresentationMotion } from './PresentationMotion';
import { pasteboard } from '@kit.BasicServicesKit';
import { socket, mdns, connection } from '@kit.NetworkKit';
import { util } from '@kit.ArkTS';
import { webview } from '@kit.ArkWeb';
import { common } from '@kit.AbilityKit';
import { scanBarcode } from '@kit.ScanKit';
import { window } from '@kit.ArkUI';
import { Speech } from './Speech';
import { ROLE } from './Config';
import { LOCAL_ORIGIN } from './LocalAssets';
class CaptureResult {id:string='';data:string='';error:string='';pending:boolean=false;}
class ClipboardResult {id:string='';ok:boolean=false;text:string='';error:string='';}
class Envelope { kind:string=''; pin:string=''; payload:string=''; }
class Status {type:string=''; message:string=''; address:string=''; port:number=39871;}
export class NativeBridge {
 private server:socket.TCPSocketServer|null=null;
 private client:socket.TCPSocket|null=null;
 private peer:socket.TCPSocketConnection|null=null;
 private discovery:mdns.DiscoveryService|null=null;
 private speech:Speech;
 private ai:ChatGpt;
 private motion:PresentationMotion;
 private active:boolean=true;
 private photo:CaptureResult=new CaptureResult();
 private layoutVersion:number=0;
 private pin:string='';private authenticated:boolean=false;
 private buffer:Uint8Array=new Uint8Array(0);
 private socketEpoch:number=0;
 private sendChain:Promise<void>=Promise.resolve();
 private encoder:util.TextEncoder=new util.TextEncoder();
 private decoder:util.TextDecoder=new util.TextDecoder('utf-8');
 private service:mdns.LocalServiceInfo={serviceType:'_mobileinput._tcp',serviceName:'Input Agent',port:39871};
 private context:common.UIAbilityContext;
 private controller:webview.WebviewController;
 constructor(context:common.UIAbilityContext,controller:webview.WebviewController){AppStorage.setOrCreate<string>('pasteRequest','');this.context=context;this.controller=controller;this.speech=new Speech(context,controller);this.ai=new ChatGpt(context,(name:string,data:string)=>this.emit(name,data));this.motion=new PresentationMotion(controller);distributedLink.configure(context);distributedLink.attach((name:string,data:string)=>this.emit(name,data));}
 clipboard(id:string,operation:string,text:string):string {
  if(!this.allowed())return 'unavailable';
  const result:ClipboardResult={id,ok:false,text:'',error:''};
  const board=pasteboard.getSystemPasteboard();
  if(operation==='write'){
   board.setData(pasteboard.createData(pasteboard.MIMETYPE_TEXT_PLAIN,text)).then(()=>{result.ok=true;this.emit('native-clipboard',JSON.stringify(result));}).catch(()=>{result.error='复制失败，请重试';this.emit('native-clipboard',JSON.stringify(result));});
  }else{
   AppStorage.setOrCreate<string>('pasteRequest',id);
  }
  return 'pending';
 }
 readPaste(id:string):void {
  const result:ClipboardResult={id,ok:false,text:'',error:''};
  pasteboard.getSystemPasteboard().getData().then((data:pasteboard.PasteData)=>{result.ok=true;result.text=data.getPrimaryText()||'';this.emit('native-clipboard',JSON.stringify(result));}).catch(()=>{result.error='无法读取剪贴板，请重新粘贴';this.emit('native-clipboard',JSON.stringify(result));});
 }
 cancelPaste(id:string):void {const result:ClipboardResult={id,ok:false,text:'',error:'已取消粘贴'};this.emit('native-clipboard',JSON.stringify(result));}
 capture(id:string,kind:string):string {
  if(!this.allowed()||!this.active)return 'unavailable';
  if(kind==='camera'&&ROLE==='phone'){
   if(this.photo.pending)return 'unavailable';
   this.photo={id,data:'',error:'',pending:true};
   photoCapture(this.context).then((data:string)=>{if(this.photo.id!==id)return;this.photo={id,data,error:'',pending:false};this.emit('native-capture',JSON.stringify(this.photo));}).catch((error:Error)=>{if(this.photo.id!==id)return;this.photo={id,data:'',error:error.message==='已取消拍照，原草稿已保留'?error.message:'相机未返回照片，请检查权限后重试；原草稿已保留',pending:false};this.emit('native-capture',JSON.stringify(this.photo));});
   return 'pending';
  }
  if(ROLE!=='tablet'||kind!=='window')return 'unavailable';
  windowCapture(this.context).then((data:string)=>{if(this.active)this.emit('native-capture',JSON.stringify({id,data,error:''}));}).catch(()=>{this.emit('native-capture',JSON.stringify({id,data:'',error:'无法截取当前应用窗口，请保持应用在前台后重试'}));});
  return 'pending';
 }
 captureResult(id:string):string{return this.allowed()&&ROLE==='phone'&&this.photo.id===id?JSON.stringify(this.photo):'';}
 clearCapture(id:string):string{if(!this.allowed())return 'unavailable';if(this.photo.id===id)this.photo=new CaptureResult();return 'cleared';}
 role():string{return ROLE;}
 private themeSerial:number=0;
 inputTheme(dark:boolean):string {
  if(!this.allowed()||ROLE!=='phone')return 'unavailable';
  const serial=++this.themeSerial;
  window.getLastWindow(this.context).then((w:window.Window)=>{
   if(serial!==this.themeSerial)return;
   w.setWindowSystemBarProperties({statusBarContentColor:dark?'#FFFFFF':'#18212B',navigationBarContentColor:dark?'#FFFFFF':'#18212B'}).catch(()=>{});
  }).catch(()=>{});
  return 'requested';
 }
 gameLayout(enabled:boolean):string {
  if(!this.allowed()||ROLE!=='phone')return 'unavailable';
  const version=++this.layoutVersion;
  window.getLastWindow(this.context).then((w:window.Window)=>{
   if(version!==this.layoutVersion)return;
   w.setPreferredOrientation(enabled?window.Orientation.LANDSCAPE:window.Orientation.AUTO_ROTATION).catch(()=>this.status('error','无法旋转屏幕，请横放手机'));
  }).catch(()=>this.status('error','无法旋转屏幕，请横放手机'));
  return 'requested';
 }
 layoutInsets():string {
  if(!this.allowed()||ROLE!=='phone')return 'unavailable';
  window.getLastWindow(this.context).then((w:window.Window)=>{
   const rect=w.getWindowProperties().windowRect;
   const system=w.getWindowAvoidArea(window.AvoidAreaType.TYPE_SYSTEM);
   const nav=w.getWindowAvoidArea(window.AvoidAreaType.TYPE_NAVIGATION_INDICATOR);
   const cutout=w.getWindowAvoidArea(window.AvoidAreaType.TYPE_CUTOUT);
   this.emit('native-insets',JSON.stringify({width:rect.width,height:rect.height,
    top:Math.max(system.topRect.height,nav.topRect.height,cutout.topRect.height),
    bottom:Math.max(system.bottomRect.height,nav.bottomRect.height,cutout.bottomRect.height),
    left:Math.max(system.leftRect.width,nav.leftRect.width,cutout.leftRect.width),
    right:Math.max(system.rightRect.width,nav.rightRect.width,cutout.rightRect.width)}));
  }).catch(()=>{});
  return 'requested';
 }
 presentationMotion(id:string,operation:string):string{if(!this.allowed()||ROLE!=='phone'||!this.active)return 'unavailable';return this.motion.control(id,operation);}
 aiControl(operation:string):string{if(!this.allowed()||ROLE!=='phone')return 'unavailable';if(operation==='status')this.ai.status();else if(operation==='login'&&this.active)void this.ai.login();else if(operation==='cancel')this.ai.cancelLogin();else if(operation==='logout')this.ai.logout();return 'requested';}
 polish(id:string,text:string,style:string):string{if(!this.allowed()||ROLE!=='phone'||!this.active)return 'unavailable';void this.ai.polish(id,text,style);return 'pending';}
 cancelPolish(id:string):string{if(!this.allowed())return 'unavailable';this.ai.cancel(id);return 'cancelled';}
 ready():void {this.emit('native-ready','{}');distributedLink.webReady();}
 transportMode():string{return distributedLink.getMode();}
 distributedStatus():string{return this.allowed()?distributedLink.snapshot():'{}';}
 selectTransport(mode:string):string{if(!this.allowed()||!['lan','distributed'].includes(mode))return 'unavailable';if(mode!==distributedLink.getMode()){this.disconnect();this.discovery?.stopSearchingMDNS();}distributedLink.select(mode);return mode;}
 distributedDiscover():string{if(!this.allowed()||!this.active)return 'unavailable';distributedLink.discover();return 'searching';}
 distributedConnect(id:string):string{if(!this.allowed()||!this.active)return 'unavailable';distributedLink.connect(id);return 'connecting';}
 private allowed():boolean {try{return this.controller.getUrl().startsWith(LOCAL_ORIGIN);}catch{return false;}}
 private emit(name:string,data:string):void {this.controller.runJavaScript(`window.dispatchEvent(new CustomEvent('${name}',{detail:JSON.parse(${JSON.stringify(data)})}));`).catch(()=>{});}
 private status(type:string,message:string='',address:string=''):void {const s:Status={type,message,address,port:39871};this.emit('native-status',JSON.stringify(s));}
 host(pin:string):string {if(distributedLink.getMode()==='distributed')return 'unavailable';if(!this.allowed()||ROLE!=='tablet')return 'unavailable';if(this.server){this.publishHostAddress();return 'hosting';}this.pin=pin;this.startHost().catch((e:Error)=>{this.server=null;this.status('error',e.message);});return 'starting';}
 private async startHost():Promise<void>{
  const server=socket.constructTCPSocketServerInstance();this.server=server;
  server.on('connect',(peer:socket.TCPSocketConnection):void=>{
   if(!this.active||this.peer||distributedLink.getMode()==='distributed'){peer.close();return;}this.peer=peer;this.socketEpoch++;this.sendChain=Promise.resolve();this.authenticated=false;this.buffer=new Uint8Array(0);
   peer.on('message',(info:socket.SocketMessageInfo):void=>{if(this.active&&this.peer===peer)this.receive(info.message);});
   peer.on('close',():void=>{if(this.peer===peer)this.disconnect();});
   peer.on('error',():void=>{if(this.peer===peer)this.disconnect();});
   setTimeout(()=>{if(this.peer===peer&&!this.authenticated)peer.close();},8000);
  });
  await server.listen({address:'0.0.0.0',port:39871,family:1});
  try{await mdns.addLocalService(this.context,this.service);}catch{}
  await this.publishHostAddress();
 }
 private async publishHostAddress():Promise<void>{
  if(distributedLink.getMode()==='distributed')return;
  let address='';try{const net=await connection.getDefaultNet();const props=await connection.getConnectionProperties(net);const found=props.linkAddresses.find(a=>a.address.family===1);if(found)address=found.address.address;}catch{}
  this.status('hosting','',address);
 }
 discover():string{if(distributedLink.getMode()==='distributed')return 'unavailable';if(!this.allowed())return 'unavailable';try{this.discovery?.stopSearchingMDNS();this.discovery=mdns.createDiscoveryService(this.context,'_mobileinput._tcp');this.discovery.on('serviceFound',(s:mdns.LocalServiceInfo):void=>{mdns.resolveLocalService(this.context,s).then((r:mdns.LocalServiceInfo)=>{if(distributedLink.getMode()!=='distributed')this.status('found',r.serviceName,r.host?.address??'');}).catch(()=>{});});this.discovery.startSearchingMDNS();return 'searching';}catch{return 'failed';}}
 connect(address:string,pin:string):string{if(distributedLink.getMode()==='distributed')return 'unavailable';if(!this.active)return 'background';if(!this.allowed()||ROLE!=='phone')return 'unavailable';const previous=this.client;this.client=null;this.socketEpoch++;this.sendChain=Promise.resolve();previous?.close();this.pin=pin;this.buffer=new Uint8Array(0);this.authenticated=false;
 const client=socket.constructTCPSocketInstance();this.client=client;
 client.on('message',(info:socket.SocketMessageInfo):void=>{if(this.client===client)this.receive(info.message);});
 client.on('close',():void=>{if(this.client===client)this.disconnect();});
 client.on('error',():void=>{if(this.client===client)this.disconnect();});
 client.connect({address:{address,port:39871,family:1},timeout:8000}).then(()=>{if(this.client===client&&this.active)this.write({kind:'hello',pin,payload:''});}).catch((e:Error)=>{if(this.client===client)this.disconnect();});return 'connecting';
 }
 private receive(bytes:ArrayBuffer):void{
  const incoming=new Uint8Array(bytes),merged=new Uint8Array(this.buffer.length+incoming.length);merged.set(this.buffer);merged.set(incoming,this.buffer.length);this.buffer=merged;
  while(this.buffer.length>=4){const n=new DataView(this.buffer.buffer).getUint32(0);if(n>2097152){this.disconnect();return;}if(this.buffer.length<n+4)return;const body=this.buffer.slice(4,n+4);this.buffer=this.buffer.slice(n+4);
   try{const e=JSON.parse(this.decoder.decodeWithStream(body,{stream:false})) as Envelope;
    if(e.kind==='hello'&&ROLE==='tablet'){if(e.pin!==this.pin){this.write({kind:'error',pin:'',payload:'配对码不正确'});this.disconnect();return;}this.authenticated=true;this.write({kind:'welcome',pin:'',payload:''});this.status('connected');}
    else if(e.kind==='welcome'&&ROLE==='phone'){this.authenticated=true;this.status('connected');}
    else if(e.kind==='error'){this.status('error',e.payload);}
    else if(e.kind==='data'&&this.authenticated)this.emit('native-message',e.payload);
   }catch{this.status('error','收到无效消息');}
  }
 }
 private write(e:Envelope):void{
  const endpoint=this.peer||this.client,epoch=this.socketEpoch;if(!endpoint)return;
  const body=this.encoder.encodeInto(JSON.stringify(e));const packet=new Uint8Array(body.length+4);new DataView(packet.buffer).setUint32(0,body.length);packet.set(body,4);
  this.sendChain=this.sendChain.then(async():Promise<void>=>{
   if(epoch!==this.socketEpoch||!this.active)return;
   try{await endpoint.send({data:packet.buffer});}catch{if(epoch===this.socketEpoch)this.disconnect();}
  });
 }
 send(payload:string):string{if(!this.allowed())return 'unavailable';if(distributedLink.getMode()==='distributed')return distributedLink.send(payload)?'sent':'disconnected';if(!this.authenticated)return 'disconnected';this.write({kind:'data',pin:'',payload});return 'sent';}
 private disconnect():void{this.motion.stop();const peer=this.peer,client=this.client;this.peer=null;this.client=null;this.socketEpoch++;this.sendChain=Promise.resolve();this.authenticated=false;this.buffer=new Uint8Array(0);peer?.close();client?.close();this.status('disconnected');}
 scan():string{if(!this.allowed())return 'unavailable';scanBarcode.startScanForResult(this.context,{}).then((r:scanBarcode.ScanResult)=>{this.emit('native-scan',JSON.stringify(r.originalValue));}).catch(()=>this.status('error','未读取到配对码，可重新扫描'));return 'scanning';}
 startRecognition(id:string,online:boolean,manual:boolean=false):string{if(!this.allowed())return 'unavailable';return this.speech.startRecognition(id,online,manual);}
 stopRecognition(id:string):string{return this.speech.stopRecognition(id);}
 cancelRecognition(id:string):string{return this.speech.cancelRecognition(id);}
 foreground(value:boolean):void{this.active=value;this.emit('native-foreground',JSON.stringify(value));if(value)this.ai.status();if(!value){this.ai.cancel('');this.motion.stop();this.speech.cancelRecognition('');distributedLink.stop();this.disconnect();}}
 close():void{distributedLink.stop();this.ai.close();this.photo=new CaptureResult();this.disconnect();this.server?.close();this.server=null;this.discovery?.stopSearchingMDNS();mdns.removeLocalService(this.context,this.service).catch(()=>{});this.speech.cancelRecognition('');}
}
