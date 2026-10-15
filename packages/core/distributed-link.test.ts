import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';import {transformSync} from 'esbuild';import {DistributedReader,DistributedWriter} from './distributed-wire';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function link(){
 const events:{name:string;data:any}[]=[],handlers=new Map<string,Function>(),sent:{id:number;text:string}[]=[],rejected:string[]=[],settings=new Map<string,string>();let sid=100;
 const acm={StartOptionParams:{START_IN_FOREGROUND:0},CollaborationKeys:{PEER_INFO:'peer',CONNECT_OPTIONS:'options'},createAbilityConnectionSession:()=>++sid,on:(name:string,id:number,fn:Function)=>handlers.set(name+id,fn),off:(name:string,id:number)=>handlers.delete(name+id),disconnect(){},destroyAbilityConnectionSession(){},connect:async(id:number)=>{handlers.get('connect'+id)?.();return {isConnected:true};},acceptConnect:async()=>{},reject:(_token:string,reason:string)=>rejected.push(reason),sendMessage:async(id:number,text:string)=>{assert.ok(Buffer.byteLength(text)<=1024);sent.push({id,text});}};
 const kits:Record<string,unknown>={'./Config':{ROLE:'phone'},'./DistributedWire':{DistributedReader,DistributedWriter},'@kit.DistributedServiceKit':{abilityConnectionManager:acm,distributedDeviceManager:{createDeviceManager:()=>({getAvailableDeviceListSync:()=>[{networkId:'tablet',deviceName:'Tablet',deviceType:'17'}]})}},'@kit.ArkData':{preferences:{getPreferencesSync:()=>({getSync:(key:string,fallback:string)=>settings.get(key)||fallback,putSync:(key:string,value:string)=>settings.set(key,value),flush:async()=>{}})}},'@kit.AbilityKit':{abilityAccessCtrl:{createAtManager:()=>({requestPermissionsFromUser:async()=>({authResults:[0]})})}}};
 const module:{exports:any}={exports:{}};runInNewContext(transformSync(readFileSync(new URL('../../apps/harmony/shared/DistributedLink.ets',import.meta.url),'utf8'),{loader:'ts',format:'cjs'}).code,{module,exports:module.exports,require:(name:string)=>kits[name]||{},console,Number,Date,JSON,setTimeout:()=>1,clearTimeout(){}});
 const native=module.exports.distributedLink;native.configure({});native.attach((name:string,data:string)=>events.push({name,data:JSON.parse(data)}));native.webReady();
 return {native,events,handlers,sent,rejected,current:()=>sid};
}
test('discovery alone never marks distributed connection as connected; peer hello is required',async()=>{
 const {native,events,handlers,current,sent}=link();native.select('distributed');native.discover();await flush();assert.equal(JSON.parse(native.snapshot()).devices.length,1);assert.equal(events.some(e=>e.data.type==='connected'),false);
 native.connect('tablet');await flush();assert.ok(sent.length);assert.equal(events.some(e=>e.data.type==='connected'),false);
 const hello=new DistributedWriter().frames(JSON.stringify({kind:'agent-hello',protocol:'input-agent-v1',role:'tablet'}));handlers.get('receiveMessage'+current())!({msg:hello[0]});assert.equal(events.at(-1)?.data.type,'connected');
 native.select('lan');assert.equal(native.send('never deliver'),false);assert.equal(handlers.size,0);
});
test('receiver rejects unsupported app and unselected transport without accepting tokens',()=>{
 const {native,rejected}=link();const params={'ohos.extra.param.key.supportCollaborateIndex':{PeerInfo:{bundleName:'com.hmilab.mobileinput.tablet',moduleName:'entry',abilityName:'EntryAbility'},ConnectOption:{parameters:{protocol:'input-agent-v1'}},'ohos.dms.collabToken':'test-only'}};
 assert.equal(native.accept(params),1);native.select('distributed');params['ohos.extra.param.key.supportCollaborateIndex'].PeerInfo.bundleName='unrelated.app';assert.equal(native.accept(params),1);assert.equal(rejected.length,2);
});
