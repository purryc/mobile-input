import {audio} from '@kit.AudioKit';
import {speechRecognizer} from '@kit.CoreSpeechKit';
import {webview} from '@kit.ArkWeb';
import {common,abilityAccessCtrl,Permissions} from '@kit.AbilityKit';

class SpeechDetail {
 sessionId:string='';type:string='';text:string='';message:string='';energy:number=0;
}
export class Speech {
 private context:common.UIAbilityContext;
 private controller:webview.WebviewController;
 private engine:speechRecognizer.SpeechRecognitionEngine|null=null;
 private capturer:audio.AudioCapturer|null=null;
 private sessionId:string='';
 private remainder:Uint8Array=new Uint8Array(0);
 private speaking:boolean=false;
 private lastLoud:number=0;
 private lastEnergy:number=0;
 private finishing:boolean=false;
 private completedText:string='';
 private currentText:string='';
 constructor(context:common.UIAbilityContext,controller:webview.WebviewController){this.context=context;this.controller=controller;}
 private async permission(list:Permissions[]):Promise<void>{const result=await abilityAccessCtrl.createAtManager().requestPermissionsFromUser(this.context,list);if(result.authResults.some((value:number)=>value!==0))throw new Error('请在系统设置中允许所需权限');}
 startRecognition(id:string,online:boolean):string {this.cancelRecognition('');this.sessionId=id;this.finishing=false;this.speaking=false;this.lastLoud=0;this.completedText='';this.currentText='';this.start(id,online).catch((e:Error)=>{if(this.sessionId===id){this.emit('error','',e.message);this.release();}});return 'starting';}
 private async start(id:string,online:boolean):Promise<void>{
  await this.permission(['ohos.permission.MICROPHONE']);if(this.sessionId!==id)return;
  let engine:speechRecognizer.SpeechRecognitionEngine;
  engine=await speechRecognizer.createEngine({language:'zh-CN',online:online?0:1});
  if(this.sessionId!==id){engine.shutdown();return;}this.engine=engine;
  engine.setListener({
   onStart:(sessionId:string,eventMessage:string):void=>{if(sessionId===this.sessionId){this.emit('start');this.capturer?.start().catch(()=>{this.emit('error','','无法开始采音，请重试');this.release();});}},
   onEvent:(sessionId:string,eventCode:number,eventMessage:string):void=>{},
   onResult:(sessionId:string,result:speechRecognizer.SpeechRecognitionResult):void=>{if(sessionId!==this.sessionId)return;if(result.result&&!this.speaking){this.speaking=true;this.emit('speechstart');}this.currentText=this.completedText+result.result;this.emit(result.isLast||this.finishing?'final':'partial',this.currentText);if(result.isFinal)this.completedText=this.currentText;},
   onComplete:(sessionId:string,eventMessage:string):void=>{if(sessionId===this.sessionId){if(this.currentText)this.emit('final',this.currentText);this.emit('complete');this.release();}},
   onError:(sessionId:string,errorCode:number,errorMessage:string):void=>{if(sessionId===this.sessionId){this.emit('error','',`语音识别暂时不可用（${errorCode}），请重试`);this.release();}}
  });
  const capturer=await audio.createAudioCapturer({streamInfo:{samplingRate:audio.AudioSamplingRate.SAMPLE_RATE_16000,channels:audio.AudioChannel.CHANNEL_1,sampleFormat:audio.AudioSampleFormat.SAMPLE_FORMAT_S16LE,encodingType:audio.AudioEncodingType.ENCODING_TYPE_RAW},capturerInfo:{source:audio.SourceType.SOURCE_TYPE_VOICE_RECOGNITION,capturerFlags:0}});
  if(this.sessionId!==id){capturer.release();return;}this.capturer=capturer;this.remainder=new Uint8Array(0);
  capturer.on('readData',(buffer:ArrayBuffer):void=>{if(this.sessionId===id)this.writeAudio(buffer);});
  engine.startListening({sessionId:id,audioInfo:{audioType:'pcm',sampleRate:16000,soundChannel:1,sampleBit:16}});

 }
 private writeAudio(buffer:ArrayBuffer):void{
  if(!this.engine||this.finishing)return;const incoming=new Uint8Array(buffer),merged=new Uint8Array(this.remainder.length+incoming.length);merged.set(this.remainder);merged.set(incoming,this.remainder.length);
  let energy=0;const view=new DataView(buffer);for(let i=0;i+1<buffer.byteLength;i+=2){const value=view.getInt16(i,true)/32768;energy+=value*value;}energy=Math.sqrt(energy/Math.max(1,buffer.byteLength/2));const now=Date.now();
  if(now-this.lastEnergy>65){this.emit('energy','','',energy);this.lastEnergy=now;}
  if(energy>.025){this.lastLoud=now;if(!this.speaking){this.speaking=true;this.emit('speechstart');}}
  let offset=0;while(offset+640<=merged.length){try{this.engine.writeAudio(this.sessionId,merged.slice(offset,offset+640));}catch{this.emit('error','','音频传输中断，请重试');this.release();return;}offset+=640;}this.remainder=merged.slice(offset);
  if(this.speaking&&this.lastLoud>0&&now-this.lastLoud>=1500)this.stopRecognition(this.sessionId);
 }
 stopRecognition(id:string):string{if(id!==this.sessionId||this.finishing)return 'idle';if(!this.engine||!this.capturer){this.emit('complete');this.release();return 'stopped';}this.finishing=true;this.stopAudio().then(()=>{if(this.sessionId===id&&this.engine){try{this.engine.finish(id);}catch{this.emit('error','','未能结束转写，请重试');this.release();}}});return 'stopping';}
 cancelRecognition(id:string):string{if(id&&id!==this.sessionId)return 'idle';this.release();return 'cancelled';}
 private async stopAudio():Promise<void>{const capturer=this.capturer;this.capturer=null;if(!capturer)return;try{capturer.off('readData');await capturer.stop();}catch{}try{await capturer.release();}catch{}}
 private release():void{this.sessionId='';this.finishing=false;this.stopAudio();if(this.engine){try{this.engine.shutdown();}catch{}this.engine=null;}this.remainder=new Uint8Array(0);}
 private emit(type:string,text:string='',message:string='',energy:number=0):void{const detail:SpeechDetail={sessionId:this.sessionId,type,text,message,energy};this.controller.runJavaScript(`window.dispatchEvent(new CustomEvent('native-speech',{detail:${JSON.stringify(detail)}}));`).catch(()=>{});}
}
