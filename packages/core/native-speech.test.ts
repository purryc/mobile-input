import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';

// Execute the native adapter itself; only device SDK dependencies are replaced.
function nativeSpeech(fail=false,hapticFails=false,captureFails=false){
 const events:{sessionId:string;type:string;text:string;message:string}[]=[];
 const pulses:{duration:number;usage:string}[]=[];
 let listener:any;
 const engine={setListener:(value:any)=>{listener=value;},startListening:({sessionId}:{sessionId:string})=>listener.onStart(sessionId,''),finish:()=>{},shutdown:()=>{}};
 const capturer={on:()=>{},off:()=>{},start:async()=>{if(captureFails)throw new Error('capture failed');},stop:async()=>{},release:async()=>{}};
 const kits:Record<string,unknown>={
  '@kit.AudioKit':{audio:{AudioSamplingRate:{SAMPLE_RATE_16000:16000},AudioChannel:{CHANNEL_1:1},AudioSampleFormat:{SAMPLE_FORMAT_S16LE:1},AudioEncodingType:{ENCODING_TYPE_RAW:1},SourceType:{SOURCE_TYPE_VOICE_RECOGNITION:1},createAudioCapturer:async()=>capturer}},
  '@kit.CoreSpeechKit':{speechRecognizer:{createEngine:async(params:{language:string;online:number})=>{if(fail||params.language!=='zh-CN'||params.online!==1)throw Object.assign(new Error('Asr CreateEngineParams is wrong!'),{code:1002200001});return engine;}}},
  '@kit.AbilityKit':{abilityAccessCtrl:{createAtManager:()=>({requestPermissionsFromUser:async()=>({authResults:[0]})})}},
  '@kit.SensorServiceKit':{vibrator:{startVibration:async(effect:{duration:number},attribute:{usage:string})=>{pulses.push({duration:effect.duration,usage:attribute.usage});if(hapticFails)throw new Error('no vibrator');}}},
 };
 const module:{exports:any}={exports:{}};const code=transformSync(readFileSync(new URL('../../apps/harmony/shared/Speech.ets',import.meta.url),'utf8'),{loader:'ts',format:'cjs',target:'es2022'}).code;
 runInNewContext(code,{module,exports:module.exports,require:(name:string)=>{assert.ok(name in kits,name);return kits[name];},Uint8Array,DataView,Date,JSON,Error});
 const controller={runJavaScript:async(script:string)=>{runInNewContext(script,{window:{dispatchEvent:(event:any)=>events.push(event.detail)},CustomEvent:class{detail:unknown;constructor(_name:string,options:{detail:unknown}){this.detail=options.detail;}}});}};
 const speech=new module.exports.Speech({},controller);
 return {speech,events,pulses,callbacks:()=>listener};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('legacy online retry still starts supported on-device recognition without an invalid engine request',async()=>{
 for(const legacyOnline of [false,true]){const {speech,events}=nativeSpeech();speech.startRecognition('retry-test',legacyOnline,true);await flush();assert.equal(events.find(e=>e.type==='error'),undefined);assert.ok(events.some(e=>e.type==='start'));speech.cancelRecognition('retry-test');}
});
test('capture boundaries pulse once, duplicate callbacks/results and stopping do not repeat haptics',async()=>{
 const {speech,pulses,callbacks}=nativeSpeech();speech.startRecognition('pulse',false,true);await flush();
 assert.deepEqual(pulses,[{duration:25,usage:'touch'}]);
 callbacks().onStart('pulse','');callbacks().onResult('pulse',{result:'你好',isLast:false,isFinal:false});await flush();assert.equal(pulses.length,1);
 speech.stopRecognition('pulse');speech.stopRecognition('pulse');await flush();assert.equal(pulses.length,2);
 callbacks().onComplete('pulse','');speech.cancelRecognition('pulse');await flush();assert.equal(pulses.length,2);
});
test('failed engine or capturer never signals an open microphone and missing haptics never blocks speech',async()=>{
 for(const [engineFail,captureFail] of [[true,false],[false,true]]){const {speech,pulses}=nativeSpeech(engineFail,false,captureFail);speech.startRecognition('fail',false,true);await flush();assert.equal(pulses.length,0);}
 const {speech,events,pulses}=nativeSpeech(false,true);speech.startRecognition('no-vibrator',false,true);await flush();assert.ok(events.some(e=>e.type==='start'));speech.cancelRecognition('no-vibrator');await flush();assert.equal(pulses.length,2);assert.equal(events.some(e=>e.type==='error'),false);
});
test('native engine startup failure reports a Chinese recovery message and numeric code without exposing SDK prose',async()=>{
 const {speech,events}=nativeSpeech(true);speech.startRecognition('failed-test',false,true);await flush();const error=events.find(e=>e.type==='error');assert.ok(error);assert.match(error.message,/语音/);assert.match(error.message,/1002200001/);assert.doesNotMatch(error.message,/CreateEngineParams/);assert.equal(events.some(e=>e.type==='complete'),false);
});
