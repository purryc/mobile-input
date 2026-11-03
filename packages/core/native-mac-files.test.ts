import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {transformSync} from 'esbuild';
test('native adopted file reads sequential chunks once without relative-offset skips',()=>{
 const bytes=Buffer.alloc(130000);for(let i=0;i<bytes.length;i++)bytes[i]=i%251;let position=0,closed=0;
 const fileIo={readSync:(_fd:number,buffer:ArrayBuffer,options:any)=>{position+=options.offset||0;const n=Math.min(buffer.byteLength,bytes.length-position);new Uint8Array(buffer).set(bytes.subarray(position,position+n));position+=n;return n;},closeSync:()=>closed++};
 const module:{exports:any}={exports:{}};const code=transformSync(readFileSync(new URL('../../apps/harmony/shared/MacFiles.ets',import.meta.url),'utf8'),{loader:'ts',format:'cjs'}).code;
 runInNewContext(code,{module,exports:module.exports,require:(name:string)=>name==='@kit.CoreFileKit'?{fileIo}:name==='@kit.ArkTS'?{util:{Base64Helper:class{encodeToStringSync(b:Uint8Array){return Buffer.from(b).toString('base64');}}}}:{},ArrayBuffer,Uint8Array,Map});
 const reader=new module.exports.MacFiles({},()=>{});reader.files.set('owned',{fd:1});reader.positions.set('owned',0);const parts:Buffer[]=[];
 assert.equal(reader.read('unknown',0),'');assert.equal(reader.read('owned',10),'');
 while(position<bytes.length){const offset=position;parts.push(Buffer.from(reader.read('owned',offset),'base64'));assert.equal(reader.read('owned',offset),'');}
 assert.deepEqual(Buffer.concat(parts),bytes);reader.release('owned');assert.equal(closed,1);assert.equal(reader.read('owned',0),'');
});
