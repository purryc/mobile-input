/** Tap recognition only; pointer movement and button ordering stay in PointerQueue. */
export class TrackpadTap {
 private active?:{id:number;x:number;y:number;at:number;cancelled:boolean};
 private last?:{x:number;y:number;at:number};
 begin(id:number,x:number,y:number,at:number,blocked=false){
  if(this.active){this.cancel();return;}
  this.active={id,x,y,at,cancelled:blocked};
  if(blocked)this.last=undefined;
 }
 move(id:number,x:number,y:number){
  const a=this.active;
  if(a?.id===id&&Math.hypot(x-a.x,y-a.y)>8){a.cancelled=true;this.last=undefined;}
 }
 end(id:number,x:number,y:number,at:number):'left'|'double'|undefined{
  const a=this.active;if(!a||a.id!==id)return;
  this.move(id,x,y);this.active=undefined;
  if(a.cancelled||at-a.at>260){this.last=undefined;return;}
  const last=this.last;
  if(last&&at-last.at<=350&&Math.hypot(x-last.x,y-last.y)<=24){this.last=undefined;return 'double';}
  this.last={x,y,at};return 'left';
 }
 cancel(){this.active=undefined;this.last=undefined;}
}
