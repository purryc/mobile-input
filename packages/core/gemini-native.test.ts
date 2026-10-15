import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';
import * as protocol from './gemini-polish';
import * as actions from './polish-actions';
function setup(){
 let stored:Map<number,unknown>|null=null;const events:any[]=[],requests:any[]=[];
 const Tag={ALIAS:1,SECRET:2,RETURN_TYPE:3,ACCESSIBILITY:4,SYNC_TYPE:5,CONFLICT_RESOLUTION:6};
 const kits:Record<string,unknown>={
 './GeminiPolish':protocol,'./PolishActions':actions,
 '@kit.AssetStoreKit':{asset:{Tag,ReturnType:{ALL:0},Accessibility:{DEVICE_UNLOCKED:2},SyncType:{NEVER:0},ConflictResolution:{OVERWRITE:0},querySync:()=>stored?[stored]:[],addSync:(v:Map<number,unknown>)=>{stored=v;},removeSync:()=>{stored=null;}}},
 '@kit.ArkTS':{util:{TextEncoder:class{encodeInto(s:string){return new TextEncoder().encode(s);}},TextDecoder:class{decodeWithStream(b:Uint8Array){return new TextDecoder().decode(b);}}}},
 '@kit.CoreFileKit':{fileIo:{accessSync:()=>false}},
 '@kit.NetworkKit':{http:{RequestMethod:{POST:'POST'},HttpDataType:{STRING:0},createHttp:()=>{const req:any={destroy(){req.destroyed=true;},request:(url:string,options:unknown)=>new Promise(resolve=>{req.url=url;req.options=options;req.resolve=resolve;requests.push(req);})};return req;}}}
 };
 const module:{exports:any}={exports:{}};
 runInNewContext(transformSync(readFileSync(new URL('../../apps/harmony/shared/Gemini.ets',import.meta.url),'utf8'),{loader:'ts',format:'cjs',target:'es2022'}).code,{module,exports:module.exports,require:(n:string)=>kits[n]||{},Uint8Array,JSON,Map,Error});
 const native=new module.exports.Gemini({cacheDir:'/private/cache'},(name:string,data:string)=>events.push({name,...JSON.parse(data)}));
 return {native,requests,events,storage:()=>stored,Tag};
}
test('native Gemini sends only requested text and scoped instructions; secret is device-only and absent from status',async()=>{
 const {native,requests,events,storage,Tag}=setup();const secret='test-key-not-a-real-credential-12345';native.configure(secret,'gemini-3.8-flash');
 assert.equal(storage()?.get(Tag.SYNC_TYPE),0);assert.equal(storage()?.get(Tag.ACCESSIBILITY),2);assert.ok(!JSON.stringify(events).includes(secret));
 const promise=native.polish('one','明天两点讨论30套设备。','task-clear');const r=requests[0],body=JSON.parse(r.options.extraData);
 assert.equal(r.options.header['x-goog-api-key'],secret);assert.ok(!r.url.includes(secret));assert.deepEqual(body.contents,[{role:'user',parts:[{text:'明天两点讨论30套设备。'}]}]);assert.match(body.systemInstruction.parts[0].text,/不执行任务/);
 r.resolve({responseCode:200,result:JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'明天两点讨论30套设备。'}]}}]})});await promise;
 assert.equal(events.find(e=>e.name==='native-polish').ok,true);assert.equal(events.at(-1).verified,true);assert.ok(!JSON.stringify(events).includes(secret));
});
test('native Gemini discards cancelled/reconfigured requests and redacts service errors',async()=>{
 const {native,requests,events}=setup();native.configure('test-key-not-a-real-credential-12345','gemini-3.8-flash');
 const first=native.polish('one','测试','concise');native.cancel('one');requests[0].resolve({responseCode:200,result:'{}'});await first;assert.equal(events.filter(e=>e.name==='native-polish').length,0);
 const next=native.polish('two','测试','concise');requests[1].resolve({responseCode:403,result:'private upstream response'});await next;
 assert.match(events.find(e=>e.id==='two').error,/权限/);assert.ok(!JSON.stringify(events).includes('private upstream'));
 const stale=native.polish('three','测试','concise');native.configure('another-test-key-not-real-123456','gemini-3.8-flash');requests[2].resolve({responseCode:200,result:'{}'});await stale;assert.equal(events.filter(e=>e.id==='three').length,0);
});
