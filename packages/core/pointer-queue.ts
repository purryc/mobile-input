export interface PointerSample {x:number;y:number;action:'move'|'left'|'double'|'right'|'down'|'up'|'scroll';dy:number;relative?:boolean;deltaX?:number;deltaY?:number;}
export interface PointerQueueOptions {maxMoveInFlight?:number|(()=>number);intervalMs?:number;}
/** Relative motion is a paced bounded stream; button edges are acknowledged barriers. */
export class PointerQueue {
 private pending:PointerSample[]=[];
 private active=0;
 private barrier=false;
 private generation=0;
 private timer:ReturnType<typeof setTimeout>|undefined;
 private nextAt=0;
 private readonly limit:()=>number;
 private readonly interval:number;
 constructor(private send:(sample:PointerSample)=>Promise<boolean>,private failed:()=>void=()=>{},options:PointerQueueOptions={}){
  this.limit=()=>Math.max(1,Math.min(4,typeof options.maxMoveInFlight==='function'?options.maxMoveInFlight():options.maxMoveInFlight??1));
  this.interval=Math.max(0,options.intervalMs??0);
 }
 push(sample:PointerSample){
  const last=this.pending.at(-1);
  if(last?.action===sample.action&&sample.action==='move'&&!!last.relative===!!sample.relative){
   const dx=(last.deltaX||0)+(sample.deltaX||0),dy=(last.deltaY||0)+(sample.deltaY||0);
   // Do not truncate travel when a delayed transport accumulates a large move.
   if(!sample.relative)this.pending[this.pending.length-1]={...sample};
   else if(Math.abs(dx)<=4096&&Math.abs(dy)<=4096)this.pending[this.pending.length-1]={...sample,deltaX:dx,deltaY:dy};
   else this.pending.push({...sample});
  }
  else if(last?.action==='scroll'&&sample.action==='scroll')this.pending[this.pending.length-1]={...sample,dy:Math.max(-500,Math.min(500,last.dy+sample.dy))};
  else this.pending.push({...sample});
  if(this.pending.length>16){this.clear();this.failed();return;}
  this.drain();
 }
 clear(){this.generation++;this.pending=[];this.active=0;this.barrier=false;this.nextAt=0;clearTimeout(this.timer);this.timer=undefined;}
 private drain(){
  if(this.timer||this.barrier)return;
  const sample=this.pending[0];if(!sample)return;
  const stream=sample.action==='move'&&sample.relative===true;
  if(this.active>=(stream?this.limit():1)||(!stream&&this.active))return;
  const wait=this.nextAt-Date.now();
  if(stream&&wait>0){this.timer=setTimeout(()=>{this.timer=undefined;this.drain();},wait);return;}
  this.pending.shift();this.active++;this.barrier=!stream;
  if(stream)this.nextAt=Date.now()+this.interval;
  const generation=this.generation;
  void this.dispatch(sample,generation);
  if(stream)this.drain();
 }
 private async dispatch(sample:PointerSample,generation:number){
  let ok=false;try{ok=await this.send(sample);}catch{}
  if(generation!==this.generation)return;
  this.active--;if(sample.action!=='move'||!sample.relative)this.barrier=false;
  if(!ok){this.clear();this.failed();return;}
  this.drain();
 }
}
