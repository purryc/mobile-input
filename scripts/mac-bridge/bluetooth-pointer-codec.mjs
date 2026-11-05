/** Compact only the wire representation; expand before normal authentication,
 * owner validation, deduplication and execution. No cached/implicit target. */
export function expandBluetoothPointer(value) {
 if(!Array.isArray(value))return value;
 if(value.length!==10||value[0]!=='p1')throw Error('Invalid compact pointer');
 const [,id,seq,session,window,target,action,deltaX,deltaY,dy]=value;
 return {kind:'command',op:'pointer',id,seq,session,window,target,action,relative:true,x:0,y:0,deltaX,deltaY,dy};
}
