import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';
import {Store,initialState} from './model';

test('phone release and transport loss release controls without stopping accepted tablet jobs',()=>{
 for(const phone of [true,false]){
  const s=initialState();s.app='workbuddy';s.inputSession={id:'session',client:'phone',phase:'active',source:'field',app:'workbuddy'};
  const task=s.workbuddy.tasks[0];task.status='running';task.epoch='accepted';task.deckJob={engine:'gemini-html',stage:'生成幻灯片'};
  s.gameKeys=['Space'];s.inputPointer={x:.5,y:.5,action:'down',event:'p',app:'workbuddy',held:true};
  const store=new Store(s),ack=store.dispatch({id:'release',type:'release',...(phone?{inputClient:'phone',inputSession:'session'}:{value:{controlsOnly:true}})});
  assert.equal(ack.ok,true);assert.equal(store.state.workbuddy.tasks[0].status,'running');assert.equal(store.state.workbuddy.tasks[0].epoch,'accepted');assert.deepEqual(store.state.gameKeys,[]);assert.equal(store.state.inputPointer,undefined);
  assert.deepEqual(store.receipt('release'),ack);assert.equal(store.receipt('never-sent'),undefined);
 }
});

test('owned camera/gallery background keeps demo transport, ordinary background and expiry close it',()=>{
 let stopped=0,disconnected=0,callback:()=>void=()=>{},clear=0,timers=0;
 const module:{exports:any}={exports:{}};
 const code=transformSync(readFileSync(new URL('../../apps/harmony/shared/NativeBridge.ets',import.meta.url),'utf8'),{loader:'ts',format:'cjs'}).code;
 runInNewContext(code,{module,exports:module.exports,require:(name:string)=>name==='./Config'?{ROLE:'phone'}:name==='./DistributedLink'?{distributedLink:{stop:()=>stopped++}}:{},setTimeout:(fn:()=>void,ms:number)=>{assert.equal(ms,180000);timers++;callback=fn;return 1;},clearTimeout:()=>clear++});
 const native=Object.create(module.exports.NativeBridge.prototype),events:any[]=[];
 native.emit=(name:string,data:string)=>events.push({name,value:JSON.parse(data)});
 native.ai={status(){},cancel(){}};native.deck={cancel(){}};native.mac={close(){}};native.motion={stop(){}};native.speech={cancelRecognition(){}};native.disconnect=()=>disconnected++;
 let picking=true;native.macFiles={isPicking:()=>picking};native.photo={pending:false};
 native.foreground(false);assert.equal(stopped,0);assert.equal(disconnected,0);assert.equal(native.active,false);assert.equal(events.at(-1).value,false);
 picking=false;native.foreground(false);assert.equal(stopped,0);assert.equal(timers,1);
 native.foreground(true);callback();assert.equal(stopped,0);assert.equal(native.active,true);assert.ok(clear>=1);picking=true;
 native.foreground(false);callback();assert.equal(stopped,1);assert.equal(disconnected,1);
 native.foreground(true);picking=false;native.foreground(false);assert.equal(stopped,2);assert.equal(disconnected,2);
 native.foreground(true);native.photo.pending=true;native.foreground(false);assert.equal(stopped,2);
});


test('late automatic composer focus cannot steal a newer task or explicit selection',()=>{
 const store=new Store(initialState());store.dispatch({id:'open',type:'open',value:'workbuddy'});
 store.dispatch({id:'new-task',type:'wb-deck-new'});const target=structuredClone(store.state.target);
 const ack=store.dispatch({id:'late',type:'wb-focus',value:{id:'wb:draft:new',automatic:true}});
 assert.equal(ack.ok,true);assert.deepEqual(store.state.target,target);assert.equal(store.state.workbuddy.task,'new-task');
 store.dispatch({id:'unfocus',type:'wb-unfocus',value:{id:target!.id}});
 store.dispatch({id:'late-without-target',type:'wb-focus',value:{id:'wb:draft:new',automatic:true}});assert.equal(store.state.target,null);
 store.dispatch({id:'current',type:'wb-focus',value:{id:target!.id,automatic:true}});assert.equal((store.state.target as typeof target)?.id,target!.id);
});
