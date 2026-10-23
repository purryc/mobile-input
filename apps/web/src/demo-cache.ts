/** Only replica records are cleared. Pairing preferences and native secrets are unrelated. */
const marker='input-agent-demo-build';
export function clearDemoCaches(){
 for(const storage of [localStorage,sessionStorage]){
  for(const key of Object.keys(storage)){
   if(key==='mobile-input-state-v1'||key.startsWith('mobile-input:')||key.startsWith('wechat-point-and-ask:')||key==='input-agent:pending-camera-v1')storage.removeItem(key);
  }
 }
}
export function prepareDemoBuild(build:number|undefined){
 if(!build||localStorage.getItem(marker)===String(build))return;
 clearDemoCaches();
 // Persist the empty authority before marking the build applied; a normal restart keeps edits.
 localStorage.setItem('input-agent-demo-generation',String(build));
 localStorage.setItem(marker,String(build));
}
