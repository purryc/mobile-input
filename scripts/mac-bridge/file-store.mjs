import {mkdir,writeFile,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
const LIMIT=20*1024*1024,CHUNK=48*1024;
export class FileStore{
 constructor(root){this.root=root;this.pending=new Map();this.files=new Map();}
 async command(m,owner){
  if(m.op==='file-begin'){
   if(this.pending.size>=3||this.files.size>=50)throw Error('材料数量已达上限');
   if(typeof m.name!=='string'||m.name.length>180||/[\/\\\x00-\x1f]/.test(m.name)||!Number.isSafeInteger(m.size)||m.size<1||m.size>LIMIT||!/[a-f0-9]{64}/.test(m.sha256)||m.sha256.length!==64||!['document','photo','sketch'].includes(m.fileKind))throw Error('无效文件');
   if(!/\.(pdf|docx?|pptx?|xlsx?|txt|md|csv|png|jpe?g|webp|json)$/i.test(m.name))throw Error('不支持此文件格式');
   const id=randomUUID();this.pending.set(id,{id,owner,name:m.name,size:m.size,sha256:m.sha256,kind:m.fileKind,parts:[],received:0});return {ok:true,fileId:id};
  }
  const file=this.pending.get(m.fileId);if(!file||file.owner!==owner)throw Error('文件目标已变化');
  if(m.op==='file-chunk'){
   if(m.offset!==file.received||typeof m.data!=='string'||m.data.length>65536||!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(m.data))throw Error('文件分块顺序错误');
   const data=Buffer.from(m.data,'base64');if(!data.length||data.length>CHUNK||file.received+data.length>file.size)throw Error('文件大小超出限制');
   file.parts.push(data);file.received+=data.length;return {ok:true,received:file.received};
  }
  if(m.op!=='file-finish'||file.received!==file.size)throw Error('文件尚未传完');
  const data=Buffer.concat(file.parts);if(createHash('sha256').update(data).digest('hex')!==file.sha256){this.pending.delete(file.id);throw Error('文件校验失败');}
  const dir=path.join(this.root,file.id);await mkdir(dir,{recursive:true,mode:0o700});const dest=path.join(dir,file.name);await writeFile(dest+'.part',data,{mode:0o600});await rename(dest+'.part',dest);
  const {parts,...record}=file;this.pending.delete(file.id);this.files.set(file.id,{...record,path:dest});return {ok:true,file:{id:file.id,name:file.name,size:file.size,sha256:file.sha256,kind:file.kind}};
 }
 get(ids,owner){if(!Array.isArray(ids)||ids.length>10||new Set(ids).size!==ids.length)throw Error('无效附件列表');const names=new Set();return ids.map(id=>{const f=this.files.get(id);if(!f||f.owner!==owner)throw Error('附件不属于当前任务');if(names.has(f.name))throw Error('附件重名，请移除重复文件或先更名');names.add(f.name);return f;});}
 cancel(ownerPrefix){for(const [id,f]of this.pending)if(f.owner.startsWith(ownerPrefix))this.pending.delete(id);}
}
