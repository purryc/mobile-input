import { ble, connection, access } from '@kit.ConnectivityKit';
import { common, abilityAccessCtrl } from '@kit.AbilityKit';
import { util } from '@kit.ArkTS';
import {BusinessError} from '@kit.BasicServicesKit';
const SERVICE='f468b188-20d3-4b47-a4bd-8e573840a070';
const RX='f468b188-20d3-4b47-a4bd-8e573840a071';
const TX='f468b188-20d3-4b47-a4bd-8e573840a072';
class BluetoothWrite {data:Uint8Array=new Uint8Array(0);fast:boolean=false;}
class BluetoothDevice {id:string='';name:string='';paired:boolean=false;}
class BluetoothStatus {phase:string='idle';message:string='';devices:BluetoothDevice[]=[];}
/** Encrypted GATT transport; MacLink retains the existing application authentication. */
export class MacBluetooth {
 private context:common.UIAbilityContext;private emit:(name:string,data:string)=>void;
 private state:BluetoothStatus=new BluetoothStatus();private epoch:number=0;private timer:number=-1;private scanning:boolean=false;
 private client:ble.GattClientDevice|null=null;private rx:ble.BLECharacteristic|null=null;
 private mtuReady:((ok:boolean)=>void)|null=null;private mtuTimer:number=-1;private mtu:number=20;private writing:boolean=false;private ready:boolean=false;private preparing:boolean=false;private phase:string='idle';
 private compactPointer:boolean=false;private fastPointer:boolean=false;
 private buffer:Uint8Array=new Uint8Array(0);private queue:BluetoothWrite[]=[];private queued:number=0;
 private onData:(data:string)=>void=()=>{};private onError:()=>void=()=>{};
 constructor(context:common.UIAbilityContext,emit:(name:string,data:string)=>void){this.context=context;this.emit=emit;}
 private publish():void{this.emit('native-mac-bluetooth',JSON.stringify(this.state));}
 private found=(rows:ble.ScanResult[]):void=>{rows.forEach((row:ble.ScanResult)=>{const id='bt-'+row.deviceId.replace(/:/g,'');let name=row.deviceName||'Input Agent Mac';let paired=false;try{name=connection.getRemoteDeviceName(row.deviceId)||name;paired=connection.getPairedDevices().includes(row.deviceId);}catch{}const item:BluetoothDevice={id,name,paired};const index=this.state.devices.findIndex((d:BluetoothDevice)=>d.id===id);if(index<0)this.state.devices.push(item);else this.state.devices[index]=item;});this.publish();};
 async discover():Promise<void>{
  this.stopDiscovery();this.state={phase:'searching',message:'',devices:[]};this.publish();
  try{const result=await abilityAccessCtrl.createAtManager().requestPermissionsFromUser(this.context,['ohos.permission.ACCESS_BLUETOOTH']);if(result.authResults.some((r:number)=>r!==0)||access.getState()!==access.BluetoothState.STATE_ON)throw new Error('permission-or-radio');ble.on('BLEDeviceFind',this.found);this.scanning=true;ble.startBLEScan([{serviceUuid:SERVICE}]);this.timer=setTimeout(()=>{this.stopDiscovery();this.state.phase='idle';this.publish();},15000);}
  catch{this.stopDiscovery();this.state.phase='error';this.state.message='请开启蓝牙并允许 Input Agent 访问，然后重新查找';this.publish();}
 }
 private stopDiscovery():void{clearTimeout(this.timer);if(this.scanning){try{ble.off('BLEDeviceFind',this.found);ble.stopBLEScan();}catch{}this.scanning=false;}}
 connect(address:string,onOpen:()=>void,onData:(data:string)=>void,onError:()=>void):void{
  this.close();const generation=this.epoch;this.onData=onData;this.onError=onError;const device=address.slice(3).match(/.{2}/g)?.join(':')||'';
  if(!/^([\da-fA-F]{2}:){5}[\da-fA-F]{2}$/.test(device)){onError();return;}
  try{const client=ble.createGattClientDevice(device);this.client=client;
   client.on('BLEMtuChange',(mtu:number)=>{if(generation===this.epoch){this.mtu=Math.max(20,Math.min(512,mtu-3));const done=this.mtuReady;this.mtuReady=null;clearTimeout(this.mtuTimer);done?.(true);}});
   client.on('BLECharacteristicChange',(value:ble.BLECharacteristic)=>{if(value.characteristicUuid.toLowerCase()===TX)this.receive(value.characteristicValue,generation);});
   client.on('BLEConnectionStateChange',(state:ble.BLEConnectionChangeState)=>{if(generation!==this.epoch)return;if(state.state===2&&!this.preparing){this.preparing=true;void this.prepare(client,generation,onOpen);}else if(state.state===0){console.info('InputAgent Bluetooth gatt-disconnected phase='+this.phase+' reason='+String(state.reason));this.fail();}});client.connect();
  }catch(error){console.info('InputAgent Bluetooth gatt-start-error code='+String((error as BusinessError).code));this.fail();}
 }
 private async prepare(client:ble.GattClientDevice,generation:number,onOpen:()=>void):Promise<void>{
  try{this.phase='discovery';const services=await client.getServices();if(generation!==this.epoch)return;const service=services.find((item:ble.GattService)=>item.serviceUuid.toLowerCase()===SERVICE);const rx=service?.characteristics.find((item:ble.BLECharacteristic)=>item.characteristicUuid.toLowerCase()===RX);const tx=service?.characteristics.find((item:ble.BLECharacteristic)=>item.characteristicUuid.toLowerCase()===TX);if(!rx||!tx)throw new Error('service');this.rx=rx;
   // Mac requires encrypted notifications and writes; subscription triggers OS pairing.
   this.phase='subscription';await client.setCharacteristicChangeNotification(tx,true);if(generation!==this.epoch)return;this.phase='mtu';const negotiated=await new Promise<boolean>((resolve)=>{this.mtuReady=resolve;this.mtuTimer=setTimeout(()=>{this.mtuReady=null;resolve(false);},2500);try{client.setBLEMtuSize(247);}catch{this.mtuReady=null;clearTimeout(this.mtuTimer);resolve(true);}});if(generation!==this.epoch)return;if(!negotiated)throw new Error('mtu-timeout');this.phase='ready';this.ready=true;console.info('InputAgent Bluetooth gatt-subscribed payload='+String(this.mtu));onOpen();
  }catch(error){if(generation!==this.epoch)return;console.info('InputAgent Bluetooth gatt-prepare-error code='+String((error as BusinessError).code));this.fail();}
 }
 private receive(bytes:ArrayBuffer,generation:number):void{
  if(generation!==this.epoch)return;const next=new Uint8Array(this.buffer.length+bytes.byteLength);next.set(this.buffer);next.set(new Uint8Array(bytes),this.buffer.length);this.buffer=next;
  let end=this.buffer.indexOf(10);while(end>=0){if(end>262144){this.fail();return;}const line=this.buffer.slice(0,end);this.buffer=this.buffer.slice(end+1);try{const text=new util.TextDecoder('utf-8').decodeWithStream(line,{stream:false});const packet=JSON.parse(text) as Record<string,Object>;if(packet.kind==='connected'){const features=packet.bluetoothFeatures as string[]|undefined;this.compactPointer=!!features?.includes('compact-pointer-v1');this.fastPointer=!!features?.includes('pointer-write-command-v1');}this.onData(text);}catch{this.fail();return;}end=this.buffer.indexOf(10);}if(this.buffer.length>262144)this.fail();
 }
 send(text:string):boolean{if(!this.ready)return false;let wire=text;let fast=false;if(this.compactPointer){try{const packet=JSON.parse(text) as Record<string,Object>;if(packet.kind==='command'&&packet.op==='pointer'&&packet.relative===true){wire=JSON.stringify(['p1',packet.id,packet.seq,packet.session,packet.window,packet.target,packet.action,packet.deltaX,packet.deltaY,packet.dy]);fast=this.fastPointer&&packet.action==='move';}}catch{}}const data=new util.TextEncoder().encodeInto(wire+'\n');if(data.length>262145||this.queued+data.length>1048576){this.fail();return false;}this.queue.push({data,fast:fast&&data.length<=this.mtu});this.queued+=data.length;void this.pump();return true;}
 private async pump():Promise<void>{
  const client=this.client,rx=this.rx,generation=this.epoch;if(this.writing||!client||!rx||!this.ready)return;this.writing=true;
  try{while(this.queue.length&&generation===this.epoch){const first=this.queue[0];const part=first.data.slice(0,this.mtu);rx.characteristicValue=part.buffer as ArrayBuffer;await client.writeCharacteristicValue(rx,first.fast?ble.GattWriteType.WRITE_NO_RESPONSE:ble.GattWriteType.WRITE);if(generation!==this.epoch)return;this.queued-=part.length;if(part.length===first.data.length)this.queue.shift();else first.data=first.data.slice(part.length);}}
  catch(error){if(generation===this.epoch){console.info('InputAgent Bluetooth gatt-write-error code='+String((error as BusinessError).code));this.fail();}}
  finally{if(generation===this.epoch)this.writing=false;}
 }
 private fail():void{const callback=this.onError;this.close();callback();}
 close():void{this.epoch++;this.preparing=false;this.phase='idle';const mtuDone=this.mtuReady;this.mtuReady=null;clearTimeout(this.mtuTimer);mtuDone?.(false);this.stopDiscovery();this.ready=false;this.compactPointer=false;this.fastPointer=false;this.writing=false;this.mtu=20;this.rx=null;this.queue=[];this.queued=0;this.buffer=new Uint8Array(0);const client=this.client;this.client=null;if(client){try{client.off('BLEConnectionStateChange');client.off('BLECharacteristicChange');client.off('BLEMtuChange');client.disconnect();client.close();}catch{}}}
}
