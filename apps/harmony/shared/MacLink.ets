import {MacTrust,MacTrustRecord} from './MacTrust';
import { webSocket } from '@kit.NetworkKit';
import { util } from '@kit.ArkTS';
class MacEvent { channel:string='';status:string='';message:string='';payload:string=''; }
class MacPacket { kind:string='';id:string='';resumeToken:string='';bridgeId:string='';op:string='';action:string=''; }
export class MacLink {
 private clientId:string=util.generateRandomUUID();
 private trust:MacTrust=new MacTrust();
 private socket:webSocket.WebSocket|null=null;
 private probe:webSocket.WebSocket|null=null;
 private channel:string='';
 private ready:boolean=false;
 private promoting:boolean=false;
 private usb:boolean=false;
 private address:string='';
 private port:number=39872;
 private credential:string='';
 private bridgeId:string='';
 private pending:Map<string,number>=new Map();
 private receiptTimer:number=-1;
 private diagnostics:Map<string,number>=new Map();
 private diagnosticCount:number=0;
 private diagnostic(code:string):void {const now=Date.now();if(this.diagnosticCount>=128||now-(this.diagnostics.get(code) ?? -30000)<30000)return;this.diagnostics.set(code,now);this.diagnosticCount++;console.info('InputAgent MacRoute phase='+code+' time='+now);}
 private receiptWatch():void {
  clearTimeout(this.receiptTimer);if(!this.pending.size)return;
  let first=Date.now();this.pending.forEach((at:number)=>{first=Math.min(first,at);});const current=this.socket;
  this.receiptTimer=setTimeout(()=>{if(current!==this.socket||!this.pending.size)return;this.diagnostic('receipt-timeout');this.close();this.event('error','','Mac 操作结果尚未确认，正在恢复连接；不会重复执行');},Math.max(1,5000-(Date.now()-first)));
 }
 private lastCommand:number=0;
 private lastReceived:number=0;
 private pointerHeld:boolean=false;
 private lastProbe:number=0;
 private timer:number=-1;
 private probeTimer:number=-1;
 private emit:(name:string,data:string)=>void;
 constructor(emit:(name:string,data:string)=>void){this.emit=emit;}
 private event(status:string,payload:string='',message:string=''):void {const e:MacEvent={channel:this.channel,status,payload,message};this.emit('native-mac',JSON.stringify(e));}
 private decode(value:string|ArrayBuffer):string {return typeof value==='string'?value:new util.TextDecoder('utf-8').decodeWithStream(new Uint8Array(value));}
 private wireless():boolean {return this.address!=='127.0.0.1'&&this.address!=='localhost';}
 connect(channel:string,address:string,port:number,pin:string):string {
  this.close();if(!/^[a-zA-Z0-9.-]+$/.test(address)||!(/^(\d{6}|[a-f0-9]{64})$/.test(pin))||port<1024||port>65535)return 'unavailable';
  this.channel=channel;this.address=address;this.port=port;this.credential=pin;this.bridgeId='';this.attempt(true);return 'connecting';
 }
 resume(channel:string):string {const saved=this.trust.read();if(!saved)return 'unavailable';const result=this.connect(channel,saved.address,saved.port,saved.token);this.event('address','',saved.address);this.bridgeId=saved.bridgeId;return result;}
 private attempt(usb:boolean):void {
  clearTimeout(this.timer);const old=this.socket;this.socket=null;old?.close().catch(()=>{});this.ready=false;this.usb=usb;this.diagnostic(usb?'connecting-usb':'connecting-wireless');
  const socket=webSocket.createWebSocket();this.socket=socket;
  const fail=():void=>{if(this.socket!==socket)return;if(this.promoting&&this.probe)return;clearTimeout(this.timer);this.socket=null;socket.close().catch(()=>{});this.ready=false;this.pending.clear();
   if(usb&&this.wireless()){this.event('reconnecting','','正在连接 Mac 无线通道');this.attempt(false);}else this.event('error','','Mac 连接已中断，输入已保留');};
  socket.on('open',()=>{if(this.socket!==socket)return;socket.send(JSON.stringify({kind:'pair',target:'mac',pin:this.credential,clientId:this.clientId})).catch(fail);});
  socket.on('message',(error:Error,value:string|ArrayBuffer)=>{if(this.socket!==socket)return;const payload=this.decode(value);if(payload.length>262144)return;
   let packet:MacPacket;try{packet=JSON.parse(payload) as MacPacket;}catch{return;}
   if(packet.kind==='error'&&!this.ready&&usb&&this.wireless()){fail();return;}
   this.accept(packet,payload);
  });
  socket.on('close',fail);socket.on('error',fail);
  this.timer=setTimeout(fail,usb?1200:6500);
  socket.connect(`ws://${usb?'127.0.0.1':this.address}:${this.port}/control`,{header:{'X-Input-Agent-Client':'harmony-phone'}}).catch(fail);
 }
 private accept(packet:MacPacket,payload:string):void {
  this.lastReceived=Date.now();
  if(packet.kind==='connected'){clearTimeout(this.timer);this.ready=true;this.credential=packet.resumeToken||this.credential;this.bridgeId=packet.bridgeId||'';if(/^[a-f0-9]{64}$/.test(this.credential)){const saved:MacTrustRecord={address:this.address,port:this.port,token:this.credential,bridgeId:this.bridgeId};this.trust.save(saved);}this.diagnostic(this.usb?'authenticated-usb':'authenticated-wireless');this.event('transport','',this.usb?'usb':'wireless');}
  if(packet.kind==='ack'){this.pending.delete(packet.id);this.receiptWatch();}
  if(packet.kind==='connected'){packet.resumeToken='';this.event('message',JSON.stringify(packet));}else this.event('message',payload);
 }
 // Probe is read-only; only the same authenticated companion can take over a live route.
 private probeUsb():void {
  if(this.usb||this.probe||!this.ready||!this.bridgeId||this.pointerHeld||this.pending.size||Date.now()-this.lastCommand<350||Date.now()-this.lastProbe<1500)return;
  this.lastProbe=Date.now();this.diagnostic('probing-usb');const candidate=webSocket.createWebSocket();this.probe=candidate;
  const discard=():void=>{if(this.probe!==candidate)return;clearTimeout(this.probeTimer);this.probe=null;candidate.close().catch(()=>{});if(this.promoting){this.promoting=false;this.event('reconnecting','','正在恢复 Mac 无线连接');this.attempt(false);}};
  const failed=():void=>{this.diagnostic('usb-probe-or-route-closed');if(this.socket===candidate){this.ready=false;this.socket=null;this.pending.clear();this.event('reconnecting','','USB 已断开，正在恢复无线连接');this.attempt(false);}else discard();};
  candidate.on('open',()=>{if(this.probe===candidate)candidate.send(JSON.stringify({kind:'probe'})).catch(discard);});
  candidate.on('message',(error:Error,value:string|ArrayBuffer)=>{const payload=this.decode(value);if(payload.length>262144)return;let packet:MacPacket;try{packet=JSON.parse(payload) as MacPacket;}catch{return;}
   if(this.socket===candidate){this.accept(packet,payload);return;}
   if(this.probe!==candidate)return;
   if(packet.kind==='route'){
    if(packet.bridgeId!==this.bridgeId){this.diagnostic('usb-identity-mismatch');discard();return;}
    if(this.pointerHeld||this.pending.size||Date.now()-this.lastCommand<350){discard();return;}
    // Prevent new writes while the authenticated handover is in flight.
    this.diagnostic('promoting-usb');this.promoting=true;this.ready=false;this.event('reconnecting','','正在切换到 USB');candidate.send(JSON.stringify({kind:'pair',target:'mac',pin:this.credential,clientId:this.clientId})).catch(()=>{this.ready=true;discard();});
   }else if(packet.kind==='connected'&&packet.bridgeId===this.bridgeId){
    clearTimeout(this.probeTimer);this.probe=null;this.promoting=false;const old=this.socket;this.socket=candidate;this.usb=true;this.accept(packet,payload);old?.close().catch(()=>{});
   }else {this.ready=true;discard();}
  });
  candidate.on('close',failed);candidate.on('error',failed);
  this.probeTimer=setTimeout(()=>{if(this.probe===candidate){this.diagnostic('usb-probe-timeout');this.ready=!!this.socket;discard();}},1200);
  candidate.connect(`ws://127.0.0.1:${this.port}/control`,{header:{'X-Input-Agent-Client':'harmony-phone'}}).catch(discard);
 }
 send(channel:string,data:string):string {
  if(!this.socket||!this.ready||channel!==this.channel||data.length>262144)return 'unavailable';let packet:MacPacket;try{packet=JSON.parse(data) as MacPacket;}catch{return 'unavailable';}
  if(packet.kind==='ping'&&this.usb&&this.wireless()&&Date.now()-this.lastReceived>6500){this.pending.clear();this.pointerHeld=false;this.event('reconnecting','','USB 未响应，正在恢复无线连接');this.attempt(false);return 'sent';}
  if(packet.kind==='command'){if(packet.op==='pointer'){if(packet.action==='down')this.pointerHeld=true;if(['up','cancel'].includes(packet.action))this.pointerHeld=false;}this.pending.set(packet.id,Date.now());this.receiptWatch();this.lastCommand=Date.now();}
  const socket=this.socket;socket.send(data).catch(()=>{if(this.socket!==socket)return;if(this.usb&&this.wireless()){this.pending.clear();this.pointerHeld=false;this.event('reconnecting','','USB 已断开，正在恢复无线连接');this.attempt(false);}else this.event('error','','Mac 连接已中断');});
  if(packet.kind==='ping')this.probeUsb();return 'sent';
 }
 close():string {clearTimeout(this.receiptTimer);clearTimeout(this.timer);clearTimeout(this.probeTimer);const socket=this.socket,probe=this.probe;this.socket=null;this.probe=null;this.promoting=false;this.ready=false;this.pointerHeld=false;this.pending.clear();socket?.close().catch(()=>{});probe?.close().catch(()=>{});return 'closed';}
}
