import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec = promisify(execFile);
const types=new Set(['phone','tablet','2in1','pc','tv','wearable','liteWearable','car','smartVision']);
export function usbTargets(text) {
 return text.split('\n').map(line=>line.trim().split(/\s+/)).filter(parts=>parts[1]==='USB'&&parts[2]==='Connected'&&/^[\w-]+$/.test(parts[0])).map(parts=>parts[0]);
}
export function checkedHdc(text){if(typeof text!=='string'||/\[Fail\]/i.test(text))throw Error('hdc-failed');return text;}
export function hasReverseMapping(text,id,port){return text.split('\n').some(line=>{const parts=line.trim().split(/\s+/);return parts[0]===id&&parts[1]===`tcp:${port}`&&parts[2]===`tcp:${port}`&&parts.includes('[Reverse]');});}
export function startUsbRoute(port, run=async args=>(await exec(process.env.INPUT_AGENT_HDC||'/Applications/DevEco-Studio.app/Contents/sdk/default/openharmony/toolchains/hdc',args,{timeout:3000,maxBuffer:65536})).stdout, report=()=>{}) {
 let stopped=false,busy=false,lastReport='',reported=0;let status={available:false,detected:0,phones:0,mapped:0,phase:'unavailable',reason:''};const phoneTypes=new Map();
 const query=async args=>checkedHdc(await run(args));
 function publish(next){status=next;const signature=JSON.stringify(next);if(signature!==lastReport){lastReport=signature;if(reported++<256)report({event:'usb-route',...next});}}
 async function tick(){if(stopped||busy)return;busy=true;const next={available:false,detected:0,phones:0,mapped:0,phase:'unavailable',reason:''};try{
  const targets=usbTargets(await query(['list','targets','-v']));next.available=true;next.detected=targets.length;next.phase=targets.length?'detecting':'waiting';
  for(const id of phoneTypes.keys())if(!targets.includes(id))phoneTypes.delete(id);
  let mappings=await query(['fport','ls']);
  for(const id of targets){if(stopped)break;
   try {
    const cached=phoneTypes.get(id);
    if(!cached||Date.now()-cached.at>10000){const type=(await query(['-t',id,'shell','param','get','const.product.devicetype'])).trim();if(!types.has(type)){next.reason='device-type-pending';continue;}phoneTypes.set(id,{type,at:Date.now()});}
    if(phoneTypes.get(id)?.type!=='phone')continue;next.phones++;
    if(!hasReverseMapping(mappings,id,port)){
     next.phase='mapping';await query(['-t',id,'rport',`tcp:${port}`,`tcp:${port}`]);
     if(stopped)break;mappings=await query(['fport','ls']);
    }
    if(hasReverseMapping(mappings,id,port))next.mapped++;else next.reason='mapping-not-confirmed';
   }catch{next.reason='device-or-mapping-failed';/* Retry this device next tick, without poisoning classification. */}
  }
  if(next.mapped>0)next.phase='ready';else if(next.phones>0)next.phase='mapping';
 }catch{next.reason='hdc-unavailable';next.phase='unavailable';next.available=false;next.mapped=0;}finally{if(!stopped)publish(next);busy=false;}}
 const timer=setInterval(tick,1000);timer.unref?.();void tick();
 return {status(){return {...status};},stop(){stopped=true;clearInterval(timer);},tick};
}
