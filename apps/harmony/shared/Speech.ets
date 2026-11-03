import {audio} from '@kit.AudioKit';
import {speechRecognizer} from '@kit.CoreSpeechKit';
import {webview} from '@kit.ArkWeb';
import {common,abilityAccessCtrl,Permissions} from '@kit.AbilityKit';
import {BusinessError} from '@kit.BasicServicesKit';
import {vibrator} from '@kit.SensorServiceKit';

class SpeechDetail {
 sessionId:string='';segmentId:string='';sequence:number=0;type:string='';text:string='';message:string='';energy:number=0;
}
/** One user capture session can contain many recognizer segments. Only explicit stop completes manual dictation. */
export class Speech {
 private context:common.UIAbilityContext;
 private controller:webview.WebviewController;
 private engine:speechRecognizer.SpeechRecognitionEngine|null=null;
 private capturer:audio.AudioCapturer|null=null;
 private sessionId:string='';
 private segmentId:string='';
 private segmentNumber:number=0;
 private sequence:number=0;
 private ready:boolean=false;
 private remainder:Uint8Array=new Uint8Array(0);
 private pending:Uint8Array=new Uint8Array(0);
 private speaking:boolean=false;
 private lastLoud:number=0;
 private lastEnergy:number=0;
 private finishing:boolean=false;
 private manual:boolean=false;
 private completedText:string='';
 private partialText:string='';
 private lastFinal:string='';
 private microphoneOpen:boolean=false;
 private deadline:number=-1;
 private releasing:Promise<void>=Promise.resolve();
 constructor(context:common.UIAbilityContext,controller:webview.WebviewController){this.context=context;this.controller=controller;}
 private async permission(list:Permissions[]):Promise<void>{const result=await abilityAccessCtrl.createAtManager().requestPermissionsFromUser(this.context,list);if(result.authResults.some((value:number)=>value!==0))throw new Error('请在系统设置中允许所需权限');}
 startRecognition(id:string,_legacyOnline:boolean,manual:boolean=false):string {
  this.release();this.manual=manual;this.sessionId=id;this.segmentNumber=0;this.sequence=0;this.finishing=false;this.speaking=false;this.lastLoud=0;this.completedText='';this.partialText='';this.lastFinal='';
  this.start(id).catch((e:Error)=>{if(this.sessionId!==id)return;const code=(e as BusinessError).code;this.fail(e.message==='请在系统设置中允许所需权限'||code===201?'请在系统设置中允许麦克风权限':code===1002200006||code===1002200008?'语音服务正在释放，请稍后重试':`语音引擎暂不可用${Number.isFinite(code)?`（${code}）`:''}，请重试`);});return 'starting';
 }
 private async start(id:string):Promise<void>{
  await this.releasing;if(this.sessionId!==id)return;
  await this.permission(['ohos.permission.MICROPHONE']);if(this.sessionId!==id)return;
  let engine:speechRecognizer.SpeechRecognitionEngine;
  try{engine=await speechRecognizer.createEngine({language:'zh-CN',online:1,extraParams:{locate:'CN',recognizerMode:this.manual?'long':'short'}});}
  catch(e){
   // Older on-device engines can reject long mode. Continue the same user session with short segments.
   if(this.sessionId!==id)return;
   if(!this.manual||(e as BusinessError).code!==1002200001)throw e;
   engine=await speechRecognizer.createEngine({language:'zh-CN',online:1,extraParams:{locate:'CN',recognizerMode:'short'}});
  }
  if(this.sessionId!==id){engine.shutdown();return;}this.engine=engine;
  engine.setListener({
   onStart:(segment:string,_message:string):void=>{
    if(!this.matches(id,segment))return;
    this.clearDeadline();this.ready=true;
    if(this.finishing){this.finishEngine();return;}
    if(this.microphoneOpen){this.flushPending();return;}
    const capturer=this.capturer;
    capturer?.start().then(()=>{
     if(!this.matches(id,segment)||this.finishing||this.capturer!==capturer)return;
     this.setMicrophoneOpen(true);this.emit('start');this.flushPending();
    }).catch(()=>{if(this.matches(id,segment))this.fail('无法开始采音，请重试');});
   },
   onEvent:(_segment:string,_code:number,_message:string):void=>{},
   onResult:(segment:string,result:speechRecognizer.SpeechRecognitionResult):void=>{
    if(!this.matches(id,segment))return;
    if(result.result&&!this.speaking){this.speaking=true;this.emit('speechstart');}
    if(result.isFinal){
     if(result.result!==this.lastFinal||this.partialText){this.completedText+=result.result;this.lastFinal=result.result;}
     this.partialText='';
    }else{this.partialText=result.result;this.lastFinal='';}
    this.emit(result.isFinal||result.isLast?'final':'partial',this.text());
   },
   onComplete:(segment:string,_message:string):void=>{
    if(!this.matches(id,segment))return;
    this.clearDeadline();this.ready=false;this.commitPartial();this.emit('segment-complete',this.text());
    if(this.finishing||!this.manual){this.complete();return;}
    this.beginSegment();
   },
   onError:(segment:string,code:number,_message:string):void=>{if(this.matches(id,segment))this.fail(`语音识别暂时不可用（${code}），请重试`);}
  });
  const capturer=await audio.createAudioCapturer({streamInfo:{samplingRate:audio.AudioSamplingRate.SAMPLE_RATE_16000,channels:audio.AudioChannel.CHANNEL_1,sampleFormat:audio.AudioSampleFormat.SAMPLE_FORMAT_S16LE,encodingType:audio.AudioEncodingType.ENCODING_TYPE_RAW},capturerInfo:{source:audio.SourceType.SOURCE_TYPE_VOICE_RECOGNITION,capturerFlags:0}});
  if(this.sessionId!==id){await capturer.release();return;}this.capturer=capturer;
  capturer.on('readData',(buffer:ArrayBuffer):void=>{if(this.sessionId===id&&!this.finishing)this.writeAudio(buffer);});
  this.beginSegment();
 }
 private matches(id:string,segment:string):boolean{return this.sessionId===id&&this.segmentId===segment;}
 private text():string{return this.completedText+this.partialText;}
 private commitPartial():void{this.completedText+=this.partialText;this.partialText='';this.lastFinal='';}
 private clearDeadline():void{if(this.deadline!==-1)clearTimeout(this.deadline);this.deadline=-1;}
 private armDeadline():void{this.clearDeadline();const id=this.sessionId;this.deadline=setTimeout(()=>{if(this.sessionId===id)this.fail(this.finishing?'转写未能完成，已保留识别文字，请重试':'语音接续失败，已保留识别文字，请重试');},5000);}
 private beginSegment():void{
  if(!this.sessionId||!this.engine)return;
  this.ready=false;this.segmentId=this.sessionId+':'+(++this.segmentNumber);this.lastFinal='';this.armDeadline();
  try{this.engine.startListening({sessionId:this.segmentId,audioInfo:{audioType:'pcm',sampleRate:16000,soundChannel:1,sampleBit:16}});}catch{this.fail('语音接续失败，已保留识别文字，请重试');}
 }
 private writeAudio(buffer:ArrayBuffer):void{
  if(!this.engine||this.finishing)return;
  let energy=0;const view=new DataView(buffer);for(let i=0;i+1<buffer.byteLength;i+=2){const v=view.getInt16(i,true)/32768;energy+=v*v;}energy=Math.sqrt(energy/Math.max(1,buffer.byteLength/2));const now=Date.now();
  if(now-this.lastEnergy>65){this.emit('energy','','',energy);this.lastEnergy=now;}
  if(energy>.025){this.lastLoud=now;if(!this.speaking){this.speaking=true;this.emit('speechstart');}}
  const incoming=new Uint8Array(buffer),merged=new Uint8Array(this.pending.length+incoming.length);merged.set(this.pending);merged.set(incoming,this.pending.length);this.pending=merged;
  // At 16 kHz / PCM16 mono this is two seconds, never an unbounded recording.
  if(this.pending.length>64000){this.fail('语音接续超时，已保留识别文字，请重试');return;}
  this.flushPending();
  if(!this.manual&&this.speaking&&this.lastLoud>0&&now-this.lastLoud>=1500)this.stopRecognition(this.sessionId);
 }
 private flushPending():void{
  if(!this.ready||!this.engine)return;
  const merged=new Uint8Array(this.remainder.length+this.pending.length);merged.set(this.remainder);merged.set(this.pending,this.remainder.length);this.pending=new Uint8Array(0);
  let offset=0;while(offset+640<=merged.length){try{this.engine.writeAudio(this.segmentId,merged.slice(offset,offset+640));}catch{this.fail('音频传输中断，请重试');return;}offset+=640;}this.remainder=merged.slice(offset);
 }
 stopRecognition(id:string):string{
  if(id!==this.sessionId||this.finishing)return 'idle';this.finishing=true;
  if(!this.engine||!this.capturer){this.complete();return 'stopped';}
  this.armDeadline();this.stopAudio().then(()=>{if(this.sessionId===id&&this.ready)this.finishEngine();});return 'stopping';
 }
 private finishEngine():void{
  if(!this.engine)return;this.armDeadline();this.flushPending();
  if(this.remainder.length){const tail=new Uint8Array(640);tail.set(this.remainder);this.remainder=new Uint8Array(0);try{this.engine.writeAudio(this.segmentId,tail);}catch{this.fail('音频传输中断，请重试');return;}}
  try{this.engine.finish(this.segmentId);}catch{this.fail('未能结束转写，请重试');}
 }
 cancelRecognition(id:string):string{if(id&&id!==this.sessionId)return 'idle';this.release();return 'cancelled';}
 private complete():void{this.commitPartial();this.emit('complete',this.text());this.release();}
 private fail(message:string):void{this.emit('error',this.text(),message);this.release();}
 private setMicrophoneOpen(value:boolean):void{if(this.microphoneOpen===value)return;this.microphoneOpen=value;try{vibrator.startVibration({type:'time',duration:25},{usage:'touch'}).catch(()=>{});}catch{}}
 private async stopAudio():Promise<void>{const capturer=this.capturer;this.capturer=null;this.setMicrophoneOpen(false);if(!capturer)return;try{capturer.off('readData');await capturer.stop();}catch{}try{await capturer.release();}catch{}}
 private release():void{
  this.sessionId='';this.segmentId='';this.finishing=false;this.ready=false;this.clearDeadline();
  const stopped=this.stopAudio(),engine=this.engine;this.engine=null;
  this.releasing=this.releasing.then(async()=>{await stopped;if(engine){try{await engine.shutdown();}catch{}}});
  this.pending=new Uint8Array(0);this.remainder=new Uint8Array(0);
 }
 private emit(type:string,text:string='',message:string='',energy:number=0):void{const detail:SpeechDetail={sessionId:this.sessionId,segmentId:this.segmentId,sequence:++this.sequence,type,text,message,energy};this.controller.runJavaScript(`window.dispatchEvent(new CustomEvent('native-speech',{detail:${JSON.stringify(detail)}}));`).catch(()=>{});}
}
