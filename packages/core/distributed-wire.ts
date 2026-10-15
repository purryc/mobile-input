/** Bounded ordered text framing. Transport sessions own a fresh reader/writer. */
export class DistributedFrame {
 protocol:string='input-agent/1';id:number=0;index:number=0;total:number=0;body:string='';
}
export class DistributedWriter {
 private serial:number=0;
 frames(text:string):string[]{
  if(text.length>2097152)throw new Error('消息超过传输上限');
  const id=++this.serial,chunks:string[]=[];let part='',size=0;
  // sendMessage allows 1 KiB including the JSON envelope. Account for escaped
  // quotes, controls, Chinese UTF-8 and surrogate pairs, not JS string length.
  for(let i=0;i<text.length;i++){
   const c=text.charCodeAt(i);let piece=text[i],bytes=c<128?1:c<2048?2:3;
   if(c===34||c===92)bytes=2;
   else if(c<32)bytes=6;
   else if(c>=0xd800&&c<=0xdbff&&i+1<text.length&&text.charCodeAt(i+1)>=0xdc00&&text.charCodeAt(i+1)<=0xdfff){piece+=text[++i];bytes=4;}
   else if(c>=0xd800&&c<=0xdfff)bytes=6;
   if(size+bytes>800){chunks.push(part);part='';size=0;}part+=piece;size+=bytes;
  }
  if(part||!chunks.length)chunks.push(part);
  const out:string[]=[];
  for(let index=0;index<chunks.length;index++){
   const frame:DistributedFrame={protocol:'input-agent/1',id,index,total:chunks.length,body:chunks[index]};out.push(JSON.stringify(frame));
  }
  return out;
 }
}
export class DistributedReader {
 private id:number=0;private index:number=0;private total:number=0;private text:string='';private completed:number=0;private since:number=0;
 read(packet:string,now:number=Date.now()):string|null{
  if(packet.length>1024)throw new Error('无效的数据包');
  const f=JSON.parse(packet) as DistributedFrame;
  if(f.protocol!=='input-agent/1'||!Number.isInteger(f.id)||f.id<1||!Number.isInteger(f.index)||!Number.isInteger(f.total)||f.total<1||f.total>16384||f.index<0||f.index>=f.total||typeof f.body!=='string'||f.body.length>800)throw new Error('无效的数据包');
  if(f.id<=this.completed)return null;
  if(this.id&&now-this.since>30000)throw new Error('消息接收超时');
  if(!this.id){if(f.index!==0)throw new Error('消息顺序错误');this.id=f.id;this.total=f.total;this.since=now;}
  if(f.id!==this.id||f.total!==this.total||f.index!==this.index)throw new Error('消息顺序错误');
  if(this.text.length+f.body.length>2097152)throw new Error('消息超过传输上限');
  this.text+=f.body;this.index++;
  if(this.index!==this.total)return null;
  const result=this.text;this.completed=this.id;this.id=0;this.index=0;this.total=0;this.text='';return result;
 }
}
