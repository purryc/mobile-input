/** Shared tap / second-contact drag recognizer. PointerQueue preserves down/move/up order. */
export class TrackpadTap {
 private active?:{id:number;x:number;y:number;at:number;cancelled:boolean;second:boolean;dragging:boolean};
 private last?:{x:number;y:number;at:number};
 begin(id:number,x:number,y:number,at:number,blocked=false){
  if(this.active){this.cancel();return;}
  const second=!blocked&&!!this.last&&at-this.last.at<=350&&Math.hypot(x-this.last.x,y-this.last.y)<=24;
  this.active={id,x,y,at,cancelled:blocked,second,dragging:false};
  if(blocked)this.last=undefined;
 }
 move(id:number,x:number,y:number){
  const a=this.active;
  if(a?.id!==id||a.cancelled||a.dragging)return;
  if(Math.hypot(x-a.x,y-a.y)>8){this.last=undefined;if(a.second){a.dragging=true;return 'down' as const;}a.cancelled=true;}
 }
 end(id:number,x:number,y:number,at:number):'left'|'double'|'up'|undefined{
  const a=this.active;if(!a||a.id!==id)return;
  this.active=undefined;
  if(a.dragging){this.last=undefined;return 'up';}
  if(Math.hypot(x-a.x,y-a.y)>8)a.cancelled=true;
  if(a.cancelled||at-a.at>260){this.last=undefined;return;}
  const last=this.last;
  if(last&&at-last.at<=350&&Math.hypot(x-last.x,y-last.y)<=24){this.last=undefined;return 'double';}
  this.last={x,y,at};return 'left';
 }
 cancel(){this.active=undefined;this.last=undefined;}
}
