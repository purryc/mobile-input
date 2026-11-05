/** The launch agent restarts the whole bridge, giving every recovery a fresh command session. */
export function watchHelperLifecycle(helper, restart) {
 let closing=false,scheduled=false;
 const failed=()=>{if(closing||scheduled)return;scheduled=true;queueMicrotask(()=>{if(!closing)restart();});};
 helper.on('exit',failed);
 helper.on('error',failed);
 return {close(){closing=true;helper.off('exit',failed);helper.off('error',failed);}};
}
