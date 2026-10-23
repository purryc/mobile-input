import { abilityConnectionManager as acm, distributedDeviceManager as dm } from '@kit.DistributedServiceKit';
import { common, abilityAccessCtrl } from '@kit.AbilityKit';
import { preferences } from '@kit.ArkData';
import { BusinessError } from '@kit.BasicServicesKit';
import { DistributedReader, DistributedWriter } from './DistributedWire';
import { ROLE } from './Config';
class Device {id:string='';name:string='';type:string='';}
class LinkState {phase:string='idle';message:string='';devices:Device[]=[];peer:string='';}
class Hello {kind:string='';protocol:string='';role:string='';}
const SERVICE='input-agent-v1';
/** One native session survives Web controller construction and rejects unrelated peers. */
class DistributedLink {
 private context:common.UIAbilityContext|null=null;
 private settings:preferences.Preferences|null=null;
 private mode:string='';private sid:number=-1;private generation:number=0;private available:boolean=false;
 private manager:dm.DeviceManager|null=null;
 private state:LinkState=new LinkState();
 private reader:DistributedReader=new DistributedReader();private writer:DistributedWriter=new DistributedWriter();
 private chain:Promise<void>=Promise.resolve();private timer:number=-1;
 private ready:boolean=false;private helloSent:boolean=false;private queue:string[]=[];
 private emit:(name:string,data:string)=>void=()=>{};
 configure(context:common.UIAbilityContext):void{
  this.context=context;if(this.settings)return;
  try{this.settings=preferences.getPreferencesSync(context,{name:'input-agent-connection'});this.mode=this.settings.getSync('method','') as string;}catch{}
 }
 attach(emit:(name:string,data:string)=>void):void{this.emit=emit;}
 webReady():void {this.ready=true;this.report();if(this.available)this.emit('native-status',JSON.stringify({type:'connected',transport:'distributed'}));for(const data of this.queue)this.emit('native-message',data);this.queue=[];}
 getMode():string{return this.mode;}
 select(mode:string):void{
  if(mode!==this.mode)this.stop();this.mode=mode;
  try{this.settings?.putSync('method',mode);this.settings?.flush().catch(()=>{});}catch{}
  this.state.phase='idle';this.state.message=mode==='distributed'?'请在另一台设备也选择鸿蒙分布式':'';this.report();
 }
 snapshot():string{return JSON.stringify(this.state);}
 private report():void{this.emit('native-distributed',JSON.stringify(this.state));}
 private async permission():Promise<void>{
  if(!this.context)throw new Error('应用尚未就绪');
  const r=await abilityAccessCtrl.createAtManager().requestPermissionsFromUser(this.context,['ohos.permission.DISTRIBUTED_DATASYNC']);
  if(r.authResults.some((v:number)=>v!==0))throw new Error('请在系统设置中允许多设备协同权限，再重试');
 }
 discover():void{if(this.mode!=='distributed')return;const epoch=this.generation;this.state.phase='searching';this.state.message='正在查找同账号设备';this.report();
  this.find(epoch).catch((e:Error)=>{if(epoch===this.generation)this.fail(e);});
 }
 private async find(epoch:number):Promise<void>{
  await this.permission();if(epoch!==this.generation||this.mode!=='distributed')return;
  if(!this.manager)this.manager=dm.createDeviceManager('com.hmilab.mobileinput.'+ROLE);
  const devices=this.manager.getAvailableDeviceListSync();
  this.state.devices=devices.filter((d:dm.DeviceBasicInfo)=>!!d.networkId).map((d:dm.DeviceBasicInfo):Device=>({id:d.networkId||'',name:d.deviceName,type:d.deviceType}));
  this.state.phase=this.available?'connected':'idle';this.state.message=this.available?'鸿蒙分布式已连接':this.state.devices.length?'选择要连接的设备':'暂未发现设备，请确认同一华为账号，并开启两端 Wi-Fi 和蓝牙';this.report();
 }
 connect(id:string):void{
  if(this.mode!=='distributed'||!this.context)return;
  const device=this.state.devices.find((d:Device)=>d.id===id);if(!device){this.discover();return;}
  this.stop();this.state.peer=device.name;this.state.phase='connecting';this.state.message='正在连接 '+device.name;this.report();
  const epoch=this.generation;
  this.begin(id,epoch).catch((e:Error)=>{if(epoch===this.generation)this.fail(e);});
 }
 private async begin(id:string,epoch:number):Promise<void>{
  await this.permission();if(epoch!==this.generation||!this.context)return;
  const peer:acm.PeerInfo={deviceId:id,bundleName:this.otherBundle(),moduleName:'entry',abilityName:'EntryAbility'};
  const options:acm.ConnectOptions={needSendData:true,startOptions:acm.StartOptionParams.START_IN_FOREGROUND,parameters:{protocol:SERVICE}};
  const sid=acm.createAbilityConnectionSession(SERVICE,this.context,peer,options);this.listen(sid);
  const result=await acm.connect(sid);if(sid!==this.sid)return;
  if(!result.isConnected)throw new Error('连接未建立'+(result.errorCode!==undefined?'（'+result.errorCode+'）':'')+'，请确认另一端也已选择鸿蒙分布式');
 }
 private otherBundle():string{return 'com.hmilab.mobileinput.'+(ROLE==='phone'?'tablet':'phone');}
 accept(want:Record<string,Object>):number{
  const params=(want['ohos.extra.param.key.supportCollaborateIndex']||want) as Record<string,Object>;
  const peer=(params['PeerInfo']||params[acm.CollaborationKeys.PEER_INFO]) as acm.PeerInfo;
  const options=(params['ConnectOption']||params[acm.CollaborationKeys.CONNECT_OPTIONS]) as acm.ConnectOptions;
  const token=params['ohos.dms.collabToken'] as string;
  if(!token)return 1;
  if(this.mode!=='distributed'||!this.context||!peer||peer.bundleName!==this.otherBundle()||peer.moduleName!=='entry'||peer.abilityName!=='EntryAbility'||options?.parameters?.['protocol']!==SERVICE){try{acm.reject(token,'请先在两端选择鸿蒙分布式');}catch{}return 1;}
  if(this.sid>=0){try{acm.reject(token,'已有连接，请先断开');}catch{}return 1;}
  try{
   const sid=acm.createAbilityConnectionSession(SERVICE,this.context,peer,options);this.state.phase='connecting';this.state.message='正在建立协同连接';this.listen(sid);this.report();
   acm.acceptConnect(sid,token).catch((e:Error)=>{if(this.sid===sid)this.fail(e);});return 0;
  }catch(e){this.fail(e as Error);return 1;}
 }
 private listen(sid:number):void{
  this.sid=sid;this.reader=new DistributedReader();this.writer=new DistributedWriter();this.helloSent=false;this.available=false;
  acm.on('connect',sid,()=>{if(this.sid===sid)this.hello();});
  acm.on('disconnect',sid,()=>{if(this.sid===sid){this.stop();this.state.phase='idle';this.state.message='协同连接已断开，点击设备重新连接';this.report();}});
  acm.on('receiveMessage',sid,(event:acm.EventCallbackInfo)=>{if(this.sid!==sid||!event.msg)return;try{
   const text=this.reader.read(event.msg);if(text===null)return;
   const msg=JSON.parse(text) as Hello;
   if(msg.kind==='agent-hello'){
    if(msg.protocol!==SERVICE||msg.role===ROLE)throw new Error('两端应用版本不兼容');
    this.hello();if(!this.available){this.available=true;clearTimeout(this.timer);this.state.phase='connected';this.state.message='鸿蒙分布式已连接';this.report();if(this.ready)this.emit('native-status',JSON.stringify({type:'connected',transport:'distributed'}));}
   }else if(this.available){if(this.ready)this.emit('native-message',text);else if(this.queue.length<8)this.queue.push(text);else throw new Error('界面尚未准备完成，请重连');}
  }catch(e){this.fail(e as Error);}});
  this.timer=setTimeout(()=>{if(this.sid===sid&&!this.available)this.fail(new Error('连接超时，请在两端保持 Input Agent 前台后重试'));},20000);
 }
 private hello():void{if(this.helloSent)return;this.helloSent=true;this.write(JSON.stringify({kind:'agent-hello',protocol:SERVICE,role:ROLE}));}
 send(text:string):boolean {if(!this.available||this.mode!=='distributed')return false;this.write(text);return true;}
 private write(text:string):void{
  const sid=this.sid,epoch=this.generation,queuedAt=Date.now();let frames:string[];
  try{frames=this.writer.frames(text);}catch(e){this.fail(e as Error);return;}
  this.chain=this.chain.then(async():Promise<void>=>{const startedAt=Date.now();for(const frame of frames){if(this.sid!==sid||this.generation!==epoch)return;await acm.sendMessage(sid,frame);}const elapsed=Date.now()-startedAt,wait=startedAt-queuedAt;if(elapsed>250||wait>250)console.info('InputAgent transport timing frames='+frames.length+' waitMs='+wait+' sendMs='+elapsed);}).catch((e:Error)=>{if(this.sid===sid&&this.generation===epoch)this.fail(e);});
 }
 stop():void{
  const sid=this.sid,hadSession=sid>=0;this.sid=-1;this.generation++;this.available=false;this.queue=[];this.chain=Promise.resolve();clearTimeout(this.timer);
  if(sid>=0){try{acm.off('connect',sid);acm.off('disconnect',sid);acm.off('receiveMessage',sid);acm.disconnect(sid);}catch{}try{acm.destroyAbilityConnectionSession(sid);}catch{}}
  if(hadSession){this.state.phase='idle';this.state.message='协同连接已断开，请重新连接';this.report();}if(hadSession)this.emit('native-status',JSON.stringify({type:'disconnected',transport:'distributed'}));
 }
 private fail(error:Error):void{
  this.stop();const code=Number((error as BusinessError).code);
  console.warn('InputAgent distributed failure code='+code+' phase='+this.state.phase);
  this.state.phase='error';this.state.message=Number.isFinite(code)?'鸿蒙协同暂不可用（'+code+'），请检查协同权限或切换扫码网络':/^[A-Za-z]/.test(error.message)?'协同连接未完成，请重试或切换扫码网络':error.message;this.report();
 }
}
export const distributedLink:DistributedLink=new DistributedLink();
