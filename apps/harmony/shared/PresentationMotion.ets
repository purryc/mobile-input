import { sensor } from '@kit.SensorServiceKit';
import { webview } from '@kit.ArkWeb';
class MotionEvent {id:string='';type:string='';x:number=0;y:number=0;z:number=0;w:number=1;message:string='';}
export class PresentationMotion {
 private controller:webview.WebviewController;
 private id:string='';private last:number=0;private received:boolean=false;private timer:number=-1;
 constructor(controller:webview.WebviewController){this.controller=controller;}
 private emit(e:MotionEvent):void {this.controller.runJavaScript(`window.dispatchEvent(new CustomEvent('native-motion',{detail:${JSON.stringify(e)}}))`).catch(()=>{});}
 private sample=(data:sensor.RotationVectorResponse):void=>{
  if(!this.id||Date.now()-this.last<34)return;this.last=Date.now();this.received=true;
  const e:MotionEvent={id:this.id,type:'sample',x:data.x,y:data.y,z:data.z,w:data.w,message:''};this.emit(e);
 };
 control(id:string,operation:string):string {
  if(operation==='stop'){if(!id||id===this.id)this.stop();return 'stopped';}
  if(operation==='calibrate'){const e:MotionEvent={id:this.id,type:'calibrate',x:0,y:0,z:0,w:1,message:''};this.emit(e);return 'calibrated';}
  this.stop();this.id=id;this.received=false;
  try {
   sensor.on(sensor.SensorId.ROTATION_VECTOR,this.sample,{interval:33333333});
   this.timer=setTimeout(()=>{if(this.id===id&&!this.received){this.emit({id,type:'error',x:0,y:0,z:0,w:1,message:'未收到姿态数据，请重新按住指向'});this.stop();}},2500);
   return 'starting';
  }catch{this.emit({id,type:'error',x:0,y:0,z:0,w:1,message:'姿态传感器不可用，请检查设备后重试'});this.stop();return 'unavailable';}
 }
 stop():void {if(this.timer!==-1){clearTimeout(this.timer);this.timer=-1;}try{sensor.off(sensor.SensorId.ROTATION_VECTOR,this.sample);}catch{}this.id='';this.last=0;}
}
