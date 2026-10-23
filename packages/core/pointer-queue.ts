export interface PointerSample {x:number;y:number;action:'move'|'left'|'double'|'right'|'down'|'up'|'scroll';dy:number;}
/** One in flight, latest unsent position. Button edges remain ordered barriers. */
export class PointerQueue {
 private pending:PointerSample[]=[];
 private running=false;
 private generation=0;
 constructor(private send:(sample:PointerSample)=>Promise<boolean>,private failed:()=>void=()=>{}){}
 push(sample:PointerSample){
  const last=this.pending.at(-1);
  if(last?.action===sample.action&&sample.action==='move')this.pending[this.pending.length-1]={...sample};
  else if(last?.action==='scroll'&&sample.action==='scroll')this.pending[this.pending.length-1]={...sample,dy:Math.max(-500,Math.min(500,last.dy+sample.dy))};
  else this.pending.push({...sample});
  // Repeated buttons on an unresponsive transport must not replay much later.
  if(this.pending.length>16){this.clear();this.failed();return;}
  void this.drain();
 }
 clear(){this.generation++;this.pending=[];this.running=false;}
 private async drain(){
  if(this.running)return;
  const sample=this.pending.shift();if(!sample)return;
  this.running=true;const generation=this.generation;
  let ok=false;try{ok=await this.send(sample);}catch{}
  if(generation!==this.generation)return;
  this.running=false;
  if(!ok){this.clear();this.failed();return;}
  void this.drain();
 }
}
