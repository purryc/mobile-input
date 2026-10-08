import { pasteboard } from '@kit.BasicServicesKit';
import { socket, mdns, connection } from '@kit.NetworkKit';
import { util } from '@kit.ArkTS';
import { webview } from '@kit.ArkWeb';
import { common } from '@kit.AbilityKit';
import { scanBarcode } from '@kit.ScanKit';
import { Speech } from './Speech';
import { ROLE } from './Config';
import { LOCAL_ORIGIN } from './LocalAssets';
class ClipboardResult {id:string='';ok:boolean=false;text:string='';error:string='';}
class Envelope { kind:string=''; pin:string=''; payload:string=''; }
class Status {type:string=''; message:string=''; address:string=''; port:number=39871;}
export class NativeBridge {
 private server:socket.TCPSocketServer|null=null;
 private client:socket.TCPSocket|null=null;
 private peer:socket.TCPSocketConnection|null=null;
 private discovery:mdns.DiscoveryService|null=null;
 private speech:Speech;
 private active:boolean=true;
 private pin:string='';private authenticated:boolean=false;
 private buffer:Uint8Array=new Uint8Array(0);
 private encoder:util.TextEncoder=new util.TextEncoder();
 private decoder:util.TextDecoder=new util.TextDecoder('utf-8');
 private service:mdns.LocalServiceInfo={serviceType:'_mobileinput._tcp',serviceName:'Mobile Workbench',port:39871};
 private context:common.UIAbilityContext;
 private controller:webview.WebviewController;
 constructor(context:common.UIAbilityContext,controller:webview.WebviewController){AppStorage.setOrCreate<string>('pasteRequest','');this.context=context;this.controller=controller;this.speech=new Speech(context,controller);}
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
 role():string{return ROLE;}
 ready():void {this.emit('native-ready','{}');}
 private allowed():boolean {try{return this.controller.getUrl().startsWith(LOCAL_ORIGIN);}catch{return false;}}
 private emit(name:string,data:string):void {this.controller.runJavaScript(`window.dispatchEvent(new CustomEvent('${name}',{detail:JSON.parse(${JSON.stringify(data)})}));`).catch(()=>{});}
 private status(type:string,message:string='',address:string=''):void {const s:Status={type,message,address,port:39871};this.emit('native-status',JSON.stringify(s));}
 host(pin:string):string {if(!this.allowed()||ROLE!=='tablet')return 'unavailable';if(this.server)return 'hosting';this.pin=pin;this.startHost().catch((e:Error)=>{this.server=null;this.status('error',e.message);});return 'starting';}
 private async startHost():Promise<void>{
  const server=socket.constructTCPSocketServerInstance();this.server=server;
  server.on('connect',(peer:socket.TCPSocketConnection):void=>{
   if(!this.active||this.peer){peer.close();return;}this.peer=peer;this.authenticated=false;this.buffer=new Uint8Array(0);
   peer.on('message',(info:socket.SocketMessageInfo):void=>{if(this.active&&this.peer===peer)this.receive(info.message);});
   peer.on('close',():void=>{if(this.peer===peer){this.peer=null;this.authenticated=false;this.status('disconnected');}});
   peer.on('error',():void=>{peer.close();});
   setTimeout(()=>{if(this.peer===peer&&!this.authenticated)peer.close();},8000);
  });
  await server.listen({address:'0.0.0.0',port:39871,family:1});
  try{await mdns.addLocalService(this.context,this.service);}catch{}
  let address='';try{const net=await connection.getDefaultNet();const props=await connection.getConnectionProperties(net);const found=props.linkAddresses.find(a=>a.address.family===1);if(found)address=found.address.address;}catch{}
  this.status('hosting','',address);
 }
 discover():string{if(!this.allowed())return 'unavailable';try{this.discovery?.stopSearchingMDNS();this.discovery=mdns.createDiscoveryService(this.context,'_mobileinput._tcp');this.discovery.on('serviceFound',(s:mdns.LocalServiceInfo):void=>{mdns.resolveLocalService(this.context,s).then((r:mdns.LocalServiceInfo)=>{this.status('found',r.serviceName,r.host?.address??'');}).catch(()=>{});});this.discovery.startSearchingMDNS();return 'searching';}catch{return 'failed';}}
 connect(address:string,pin:string):string{if(!this.active)return 'background';if(!this.allowed()||ROLE!=='phone')return 'unavailable';this.client?.close();this.pin=pin;this.buffer=new Uint8Array(0);this.authenticated=false;
 const client=socket.constructTCPSocketInstance();this.client=client;
 client.on('message',(info:socket.SocketMessageInfo):void=>{if(this.client===client)this.receive(info.message);});
 client.on('close',():void=>{if(this.client===client){this.client=null;this.authenticated=false;this.status('disconnected');}});
 client.on('error',():void=>{if(this.client===client)this.disconnect();});
 client.connect({address:{address,port:39871,family:1},timeout:8000}).then(()=>{this.write({kind:'hello',pin,payload:''});}).catch((e:Error)=>{if(this.client===client)this.disconnect();});return 'connecting';
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
 private write(e:Envelope):void{const body=this.encoder.encodeInto(JSON.stringify(e));const packet=new Uint8Array(body.length+4);new DataView(packet.buffer).setUint32(0,body.length);packet.set(body,4);if(this.peer)this.peer.send({data:packet.buffer}).catch(()=>this.disconnect());else if(this.client)this.client.send({data:packet.buffer}).catch(()=>this.disconnect());}
 send(payload:string):string{if(!this.allowed()||!this.authenticated)return 'disconnected';this.write({kind:'data',pin:'',payload});return 'sent';}
 private disconnect():void{this.peer?.close();this.client?.close();this.peer=null;this.client=null;this.authenticated=false;this.buffer=new Uint8Array(0);this.status('disconnected');}
 scan():string{if(!this.allowed())return 'unavailable';scanBarcode.startScanForResult(this.context,{}).then((r:scanBarcode.ScanResult)=>{this.emit('native-scan',JSON.stringify(r.originalValue));}).catch(()=>this.status('error','未读取到配对码，可重新扫描'));return 'scanning';}
 startRecognition(id:string,online:boolean):string{if(!this.allowed())return 'unavailable';return this.speech.startRecognition(id,online);}
 stopRecognition(id:string):string{return this.speech.stopRecognition(id);}
 cancelRecognition(id:string):string{return this.speech.cancelRecognition(id);}
 foreground(value:boolean):void{this.active=value;this.emit('native-foreground',JSON.stringify(value));if(!value){this.speech.cancelRecognition('');this.disconnect();}}
 close():void{this.disconnect();this.server?.close();this.server=null;this.discovery?.stopSearchingMDNS();mdns.removeLocalService(this.context,this.service).catch(()=>{});this.speech.cancelRecognition('');}
}
