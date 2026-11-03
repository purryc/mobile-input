import test from 'node:test';import assert from 'node:assert/strict';
import {startUsbRoute,usbTargets} from './usb-route.mjs';
test('USB discovery excludes network and unauthorized devices',()=>assert.deepEqual(usbTargets('phone USB Connected localhost\n10.0.0.1:123 TCP Connected localhost\nbad USB Unauthorized localhost'),['phone']));
test('only authorized phones receive the bridge reverse port; existing and unrelated mappings are retained',async()=>{
 const calls=[];let mapped=false;const run=async args=>{calls.push(args);if(args[0]==='list')return 'phone USB Connected localhost\ntablet USB Connected localhost';if(args[0]==='fport')return mapped?'phone tcp:39872 tcp:39872 [Reverse]':'phone tcp:8787 tcp:61822 [Reverse]';if(args.includes('param'))return args[1]==='phone'?'phone':'tablet';if(args.includes('rport'))mapped=true;return '';};
 const watch=startUsbRoute(39872,run);await new Promise(r=>setTimeout(r,10));await watch.tick();watch.stop();
 assert.deepEqual(calls.filter(c=>c.includes('rport')),[['-t','phone','rport','tcp:39872','tcp:39872']]);assert.equal(calls.some(c=>c.includes('rm')||c.includes('install')),false);
});

function fixture({typeFailures=0,mappingFailure='',unconfirmed=false}={}){
 let connected=true,mapped=false,queries=0,creates=0;const events=[];
 const run=async args=>{if(args[0]==='list')return connected?'phone USB Connected localhost':'';if(args[0]==='fport')return mapped?'phone tcp:39872 tcp:39872 [Reverse]':'[Empty]';if(args.includes('param'))return ++queries<=typeFailures?'[Fail]Device is reconnecting':'phone';if(args.includes('rport')){creates++;if(mappingFailure)return mappingFailure;if(!unconfirmed)mapped=true;}return '';};
 const watcher=startUsbRoute(39872,run,e=>events.push(e));
 return {watcher,events,ready:()=>new Promise(r=>setTimeout(r,10)),disconnect:()=>{connected=false;mapped=false;},connect:()=>{connected=true;},loseMapping:()=>{mapped=false;},stats:()=>({queries,creates})};
}
test('a zero-exit failed type read retries and eventually creates a confirmed tunnel',async()=>{
 const f=fixture({typeFailures:1});try{await f.ready();assert.equal(f.watcher.status().mapped,0);await f.watcher.tick();assert.equal(f.watcher.status().mapped,1);assert.deepEqual(f.stats(),{queries:2,creates:1});assert.ok(f.events.every(e=>!JSON.stringify(e).includes('phone USB')));}finally{f.watcher.stop();}
});
test('zero-exit mapping failure and unconfirmed success never report ready',async()=>{
 for(const opts of [{mappingFailure:'[Fail]Permission denied'},{unconfirmed:true}]){const f=fixture(opts);try{await f.ready();await f.watcher.tick();assert.equal(f.watcher.status().mapped,0);assert.equal(f.watcher.status().detected,1);assert.equal(f.watcher.status().phase,'mapping');assert.equal(f.stats().creates,2);}finally{f.watcher.stop();}}
});
test('mapping loss rebuilds only the bridge tunnel and reconnect reclassifies device',async()=>{
 const f=fixture();try{await f.ready();assert.equal(f.watcher.status().mapped,1);f.loseMapping();await f.watcher.tick();assert.equal(f.stats().creates,2);f.disconnect();await f.watcher.tick();assert.equal(f.watcher.status().mapped,0);f.connect();await f.watcher.tick();assert.deepEqual(f.stats(),{queries:2,creates:3});assert.equal(f.watcher.status().mapped,1);}finally{f.watcher.stop();}
});
