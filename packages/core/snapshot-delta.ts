type Json=null|boolean|number|string|Json[]|{[key:string]:Json};
export type Delta={path:string[];value?:Json;remove?:boolean};
const safe=(key:string)=>!['__proto__','constructor','prototype'].includes(key);
export function snapshotDelta(before:unknown,after:unknown):Delta[]{
 const ops:Delta[]=[];
 const visit=(a:Json|undefined,b:Json|undefined,path:string[])=>{
  if(a===b)return;
  if(path[0]!=='inputPointer'&&a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)&&(!Array.isArray(a)||a.length===(b as Json[]).length)){
   const x=a as {[key:string]:Json},y=b as {[key:string]:Json};for(const key of new Set([...Object.keys(x),...Object.keys(y)])){if(!safe(key))throw new Error('无效字段');visit(x[key],y[key],[...path,key]);}
  }else ops.push(b===undefined?{path,remove:true}:{path,value:b});
 };visit(before as Json,after as Json,[]);return ops;
}
export function applySnapshotDelta<T>(source:T,ops:Delta[]):T{
 if(!Array.isArray(ops)||ops.length>10000)throw new Error('无效增量');
 let next=structuredClone(source) as Json;
 for(const op of ops){if(!Array.isArray(op.path)||op.path.length>64||op.path.some(k=>typeof k!=='string'||!safe(k)))throw new Error('无效字段');
  if(!op.path.length){if(op.remove||op.value===undefined)throw new Error('无效快照');next=op.value;continue;}
  let target=next as {[key:string]:Json};for(const key of op.path.slice(0,-1)){if(!Object.hasOwn(target,key)||!target[key]||typeof target[key]!=='object')throw new Error('增量已过期');target=target[key] as {[key:string]:Json};}
  const key=op.path.at(-1)!;if(op.remove)delete target[key];else if(op.value!==undefined)target[key]=op.value;else throw new Error('缺失增量');
 }
 return next as T;
}
