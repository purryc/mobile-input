import {MacBluetooth} from './MacBluetooth';
import {common} from '@kit.AbilityKit';
import {MacTrust,MacTrustRecord} from './MacTrust';
import {webSocket} from '@kit.NetworkKit';
import {util} from '@kit.ArkTS';
class MacEvent {channel:string='';status:string='';message:string='';payload:string='';}
class MacPacket {kind:string='';id:string='';resumeToken:string='';bridgeId:string='';op:string='';action:string='';}
/** One explicit transport at a time. Cable changes never change the user's choice. */
export class MacLink {
 private clientId:string=util.generateRandomUUID();
 private trust:MacTrust=new MacTrust();
 private socket:webSocket.WebSocket|null=null;
 private bluetooth:MacBluetooth;
 private bluetoothLive:boolean=false;
 private channel:string='';private route:string='usb';private address:string='';private port:number=39872;
 private credential:string='';private bridgeId:string='';private expectedBridgeId:string='';private ready:boolean=false;private generation:number=0;
 private lastReceived:number=0;private timer:number=-1;private receiptTimer:number=-1;
 private pending:Map<string,number>=new Map();
 private emit:(name:string,data:string)=>void;
 constructor(context:common.UIAbilityContext,emit:(name:string,data:string)=>void){this.emit=emit;this.bluetooth=new MacBluetooth(context,emit);}
 hasTrust():boolean{return this.trust.read()!==null;}
 discoverBluetooth():void{this.bluetooth.discover();}
 private event(status:string,payload:string='',message:string=''):void{const e:MacEvent={channel:this.channel,status,payload,message};this.emit('native-mac',JSON.stringify(e));}
 private diagnostic(phase:string):void{console.info('InputAgent MacRoute phase='+phase);}
 private fail(message:string):void{this.close();this.event('error','',message);}
 private receiptWatch():void{
  clearTimeout(this.receiptTimer);if(!this.pending.size)return;let first=Date.now();this.pending.forEach((at:number)=>{first=Math.min(first,at);});const generation=this.generation;
  this.receiptTimer=setTimeout(()=>{if(generation===this.generation&&this.pending.size)this.fail('Mac 操作结果尚未确认，正在恢复连接；不会重复执行');},Math.max(1,5000-(Date.now()-first)));
 }
 connect(channel:string,address:string,port:number,pin:string,method:string='usb'):string{
  this.close();const saved=this.trust.read();
  if(pin===''){if(address===saved?.address||address===saved?.wifiAddress||address==='127.0.0.1'||/^bt-[a-fA-F0-9]{12}$/.test(address))pin=saved?.token||'';}
  if(!['usb','wifi','bluetooth'].includes(method)||!/^[a-zA-Z0-9.-]+$/.test(address)||!/^(\d{6}|[a-f0-9]{64})$/.test(pin)||port<1024||port>65535)return 'unavailable';
  if(method==='bluetooth'&&!/^bt-[a-fA-F0-9]{12}$/.test(address))return 'unavailable';
  if(method==='wifi'&&(address==='127.0.0.1'||address==='localhost'||address.startsWith('bt-')))return 'unavailable';
  this.channel=channel;this.route=method;this.address=method==='usb'?'127.0.0.1':address;this.port=port;this.credential=pin;this.bridgeId='';this.expectedBridgeId=/^[a-f0-9]{64}$/.test(pin)?saved?.bridgeId||'':'';
  const generation=this.generation;const failed=():void=>{if(generation!==this.generation)return;this.fail(method==='bluetooth'?'蓝牙通道未建立，请检查两端蓝牙及 Mac 连接服务':method==='usb'?'USB 连接已中断，请插入数据线并允许 USB 调试':'Wi-Fi 连接已中断，请检查两端网络');};
  const opened=():void=>{if(generation!==this.generation)return;this.write(JSON.stringify({kind:'pair',target:'mac',pin:this.credential,clientId:this.clientId}));};
  const received=(payload:string):void=>{if(generation!==this.generation||payload.length>262144)return;try{this.accept(JSON.parse(payload) as MacPacket,payload);}catch{}};
  this.diagnostic('connecting-'+method);this.timer=setTimeout(failed,method==='bluetooth'?20000:6500);
  if(method==='bluetooth'){this.bluetoothLive=true;this.diagnostic('bluetooth-peer-'+address.slice(-4));this.bluetooth.connect(address,opened,received,failed);}
  else{const socket=webSocket.createWebSocket();this.socket=socket;socket.on('open',opened);socket.on('message',(error:Error,value:string|ArrayBuffer)=>received(typeof value==='string'?value:new util.TextDecoder('utf-8').decodeWithStream(new Uint8Array(value))));socket.on('error',failed);socket.on('close',failed);socket.connect(`ws://${this.address}:${port}/control`,{header:{'X-Input-Agent-Client':'harmony-phone'}}).catch(failed);}
  return 'connecting';
 }
 resume(channel:string,method:string=''):string{
  const saved=this.trust.read();if(!saved)return 'unavailable';const selected=method||saved.method||(saved.address.startsWith('bt-')?'bluetooth':saved.address==='127.0.0.1'?'usb':'wifi');
  const address=selected==='usb'?'127.0.0.1':selected==='bluetooth'?(saved.bluetoothAddress||(saved.address.startsWith('bt-')?saved.address:'')):(saved.wifiAddress||(!saved.address.startsWith('bt-')&&saved.address!=='127.0.0.1'&&saved.address!=='localhost'?saved.address:''));
  if(!address)return 'unavailable';const result=this.connect(channel,address,saved.port,saved.token,selected);this.event('address','',address);return result;
 }
 private accept(packet:MacPacket,payload:string):void{
  this.lastReceived=Date.now();
  if(packet.kind==='connected'){if(this.expectedBridgeId&&packet.bridgeId!==this.expectedBridgeId){this.fail('连接的 Mac 身份不匹配，请重新选择设备');return;}clearTimeout(this.timer);this.ready=true;this.credential=packet.resumeToken||this.credential;this.bridgeId=packet.bridgeId||'';if(/^[a-f0-9]{64}$/.test(this.credential)){const saved:MacTrustRecord={method:this.route,wifiAddress:'',bluetoothAddress:'',address:this.address,port:this.port,token:this.credential,bridgeId:this.bridgeId};this.trust.save(saved);}this.diagnostic('authenticated-'+this.route);this.event('transport','',this.route==='wifi'?'wireless':this.route);packet.resumeToken='';this.event('message',JSON.stringify(packet));return;}
  if(packet.kind==='ack'){this.pending.delete(packet.id);this.receiptWatch();}
  this.event('message',payload);
 }
 private write(data:string):boolean{
  if(this.bluetoothLive)return this.bluetooth.send(data);const socket=this.socket;if(!socket)return false;const generation=this.generation;socket.send(data).catch(()=>{if(generation===this.generation)this.fail('Mac 连接已中断，输入已保留');});return true;
 }
 send(channel:string,data:string):string{
  if(!this.ready||channel!==this.channel||data.length>262144)return 'unavailable';let packet:MacPacket;try{packet=JSON.parse(data) as MacPacket;}catch{return 'unavailable';}
  if(Date.now()-this.lastReceived>10000){this.fail('Mac 连接已中断，输入已保留');return 'unavailable';}
  if(packet.kind==='command'){this.pending.set(packet.id,Date.now());this.receiptWatch();}return this.write(data)?'sent':'unavailable';
 }
 close():string{this.generation++;clearTimeout(this.timer);clearTimeout(this.receiptTimer);this.ready=false;this.pending.clear();this.bluetoothLive=false;this.bluetooth.close();const socket=this.socket;this.socket=null;socket?.close().catch(()=>{});return 'closed';}
}
