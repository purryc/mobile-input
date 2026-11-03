import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';

// Execute the native adapter itself; only device SDK dependencies are replaced.
function nativeSpeech(fail=false,hapticFails=false,captureFails=false,delayStart=false){
 const events:{sessionId:string;type:string;text:string;message:string}[]=[];
 const pulses:{duration:number;usage:string}[]=[];
 let listener:any,read:((buffer:ArrayBuffer)=>void)|undefined,segment='';const starts:string[]=[],audio:number[]=[],finishes:string[]=[];
 const engine={setListener:(value:any)=>{listener=value;},startListening:({sessionId}:{sessionId:string})=>{segment=sessionId;starts.push(sessionId);if(!delayStart)listener.onStart(sessionId,'');},writeAudio:(_id:string,bytes:Uint8Array)=>audio.push(bytes.length),finish:(id:string)=>finishes.push(id),shutdown:()=>{}};
 const capturer={on:(_name:string,fn:(buffer:ArrayBuffer)=>void)=>{read=fn;},off:()=>{read=undefined;},start:async()=>{if(captureFails)throw new Error('capture failed');},stop:async()=>{},release:async()=>{}};
 const kits:Record<string,unknown>={
  '@kit.AudioKit':{audio:{AudioSamplingRate:{SAMPLE_RATE_16000:16000},AudioChannel:{CHANNEL_1:1},AudioSampleFormat:{SAMPLE_FORMAT_S16LE:1},AudioEncodingType:{ENCODING_TYPE_RAW:1},SourceType:{SOURCE_TYPE_VOICE_RECOGNITION:1},createAudioCapturer:async()=>capturer}},
  '@kit.CoreSpeechKit':{speechRecognizer:{createEngine:async(params:{language:string;online:number})=>{if(fail||params.language!=='zh-CN'||params.online!==1)throw Object.assign(new Error('Asr CreateEngineParams is wrong!'),{code:1002200001});return engine;}}},
  '@kit.AbilityKit':{abilityAccessCtrl:{createAtManager:()=>({requestPermissionsFromUser:async()=>({authResults:[0]})})}},
  '@kit.SensorServiceKit':{vibrator:{startVibration:async(effect:{duration:number},attribute:{usage:string})=>{pulses.push({duration:effect.duration,usage:attribute.usage});if(hapticFails)throw new Error('no vibrator');}}},
 };
 const module:{exports:any}={exports:{}};const code=transformSync(readFileSync(new URL('../../apps/harmony/shared/Speech.ets',import.meta.url),'utf8'),{loader:'ts',format:'cjs',target:'es2022'}).code;
 runInNewContext(code,{module,exports:module.exports,require:(name:string)=>{assert.ok(name in kits,name);return kits[name];},Uint8Array,DataView,Date,JSON,Error,setTimeout:(fn:()=>void,ms:number)=>{const t=setTimeout(fn,ms);t.unref();return t;},clearTimeout});
 const controller={runJavaScript:async(script:string)=>{runInNewContext(script,{window:{dispatchEvent:(event:any)=>events.push(event.detail)},CustomEvent:class{detail:unknown;constructor(_name:string,options:{detail:unknown}){this.detail=options.detail;}}});}};
 const speech=new module.exports.Speech({},controller);
 return {speech,events,pulses,callbacks:()=>listener,segment:()=>segment,starts,audio,finishes,feed:(bytes=640)=>read?.(new ArrayBuffer(bytes))};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('legacy online retry still starts supported on-device recognition without an invalid engine request',async()=>{
 for(const legacyOnline of [false,true]){const {speech,events}=nativeSpeech();speech.startRecognition('retry-test',legacyOnline,true);await flush();assert.equal(events.find(e=>e.type==='error'),undefined);assert.ok(events.some(e=>e.type==='start'));speech.cancelRecognition('retry-test');}
});
test('capture boundaries pulse once, duplicate callbacks/results and stopping do not repeat haptics',async()=>{
 const {speech,pulses,callbacks}=nativeSpeech();speech.startRecognition('pulse',false,true);await flush();
 assert.deepEqual(pulses,[{duration:25,usage:'touch'}]);
 callbacks().onStart('pulse:1','');callbacks().onResult('pulse:1',{result:'你好',isLast:false,isFinal:false});await flush();assert.equal(pulses.length,1);
 speech.stopRecognition('pulse');speech.stopRecognition('pulse');await flush();assert.equal(pulses.length,2);
 callbacks().onComplete('pulse:1','');speech.cancelRecognition('pulse');await flush();assert.equal(pulses.length,2);
});
test('failed engine or capturer never signals an open microphone and missing haptics never blocks speech',async()=>{
 for(const [engineFail,captureFail] of [[true,false],[false,true]]){const {speech,pulses}=nativeSpeech(engineFail,false,captureFail);speech.startRecognition('fail',false,true);await flush();assert.equal(pulses.length,0);}
 const {speech,events,pulses}=nativeSpeech(false,true);speech.startRecognition('no-vibrator',false,true);await flush();assert.ok(events.some(e=>e.type==='start'));speech.cancelRecognition('no-vibrator');await flush();assert.equal(pulses.length,2);assert.equal(events.some(e=>e.type==='error'),false);
});
test('native engine startup failure reports a Chinese recovery message and numeric code without exposing SDK prose',async()=>{
 const {speech,events}=nativeSpeech(true);speech.startRecognition('failed-test',false,true);await flush();const error=events.find(e=>e.type==='error');assert.ok(error);assert.match(error.message,/语音/);assert.match(error.message,/1002200001/);assert.doesNotMatch(error.message,/CreateEngineParams/);assert.equal(events.some(e=>e.type==='complete'),false);
});

test('sentence completion rotates recognition without ending a manual session or pulsing again',async()=>{
 const n=nativeSpeech();n.speech.startRecognition('continuous',false,true);await flush();
 const first=n.segment();n.callbacks().onResult(first,{result:'第一句。',isFinal:true,isLast:true});n.callbacks().onComplete(first,'');
 assert.equal(n.starts.length,2);assert.equal(n.events.some(e=>e.type==='complete'),false);assert.equal(n.pulses.length,1);
 // Duplicate terminal callbacks from the old segment must not rotate or append.
 n.callbacks().onComplete(first,'');n.callbacks().onResult(first,{result:'过期',isFinal:true,isLast:true});
 const second=n.segment();n.callbacks().onResult(second,{result:'第二句。',isFinal:true,isLast:false});n.callbacks().onResult(second,{result:'第二句。',isFinal:true,isLast:false});
 n.speech.stopRecognition('continuous');await flush();n.callbacks().onComplete(second,'');
 assert.equal(n.events.filter(e=>e.type==='complete').length,1);assert.equal(n.events.at(-1)?.text,'第一句。第二句。');assert.equal(n.pulses.length,2);
});
test('PCM is retained while the next segment starts and flushed without a capture restart',async()=>{
 const n=nativeSpeech(false,false,false,true);n.speech.startRecognition('buffer',false,true);await flush();n.callbacks().onStart(n.segment(),'');await flush();
 n.feed();assert.equal(n.audio.length,1);n.callbacks().onComplete(n.segment(),'');n.feed(1280);assert.equal(n.audio.length,1);
 n.callbacks().onStart(n.segment(),'');assert.equal(n.audio.length,3);assert.equal(n.pulses.length,1);n.speech.cancelRecognition('buffer');
});
test('bounded handover overflow reports a real failure and releases capture without completing commands',async()=>{
 const n=nativeSpeech(false,false,false,true);n.speech.startRecognition('overflow',false,true);await flush();n.callbacks().onStart(n.segment(),'');await flush();
 n.callbacks().onComplete(n.segment(),'');n.feed(64002);await flush();
 assert.equal(n.events.at(-1)?.type,'error');assert.match(n.events.at(-1)?.message||'',/接续超时/);assert.equal(n.events.some(e=>e.type==='complete'),false);assert.equal(n.pulses.length,2);
});
test('stop during startup cannot later open capture; cancelled sessions reject late callbacks',async()=>{
 const n=nativeSpeech();n.speech.startRecognition('early',false,true);n.speech.stopRecognition('early');await flush();assert.equal(n.pulses.length,0);
 n.speech.startRecognition('old',false,true);await flush();const old=n.segment();n.speech.cancelRecognition('old');n.speech.startRecognition('new',false,true);await flush();
 const count=n.events.length;n.callbacks().onResult(old,{result:'过期文本',isFinal:true,isLast:true});n.callbacks().onComplete(old,'');assert.equal(n.events.length,count);n.speech.cancelRecognition('new');
});
test('manual capture remains active during silence and explicit stop finishes only the current engine segment',async()=>{
 const n=nativeSpeech();n.speech.startRecognition('silent',false,true);await flush();for(let i=0;i<4000;i++)n.feed();
 assert.equal(n.finishes.length,0);assert.equal(n.pulses.length,1);n.speech.stopRecognition('silent');await flush();assert.deepEqual(n.finishes,[n.segment()]);n.callbacks().onComplete(n.segment(),'');
});
