import type {State,Command,Stroke} from './model';
export interface PresentationState {
 session:string; elapsed:number; runningSince:number; lastSlide:number;
 mode:'laser'|'ink'; color:string; size:number;
 volume:{level:number;muted:boolean;request:string;error:string};
 captions:{id:string;enabled:boolean;sequence:number;status:'off'|'listening'|'partial'|'final'|'error';text:string;error:string};
 pointer:{x:number;y:number;active:boolean;gesture:string;sequence:number;heartbeat:number;drawing:boolean;drawSequence:number};
 ink:Record<string,Stroke[]>; live:Stroke|null;
}
export const emptyCaptions=():PresentationState['captions']=>({id:'',enabled:false,sequence:0,status:'off',text:'',error:''});
export const presentationState=():PresentationState=>({session:'',elapsed:0,runningSince:0,lastSlide:0,volume:{level:60,muted:false,request:'',error:''},captions:emptyCaptions(),mode:'laser',color:'#c45337',size:3,pointer:{x:.5,y:.5,active:false,gesture:'',sequence:0,heartbeat:0,drawing:false,drawSequence:0},ink:{},live:null});
export const inkKey=(s:State)=>`${s.officeFile||'sample-slides'}:${s.slide}`;
export function finishInk(s:State){const p=s.presentation;if(p.live?.points.length){const strokes=p.ink[inkKey(s)]||[];p.ink[inkKey(s)]=[...strokes,p.live].slice(-100);}p.live=null;p.pointer.drawing=false;}
export function releasePointer(s:State){finishInk(s);s.presentation.pointer.active=false;s.presentation.pointer.gesture='';}
export function pausePresentation(s:State){releasePointer(s);s.presentation.captions=emptyCaptions();const p=s.presentation;if(p.runningSince)p.elapsed+=Math.max(0,Date.now()-p.runningSince);p.runningSince=0;if(s.officeFile==='sample-slides')p.lastSlide=s.slide;}
export function beginPresentation(s:State){releasePointer(s);s.presenting=true;s.target=null;s.startedAt=Math.max(Date.now(),s.startedAt+1);s.presentation.captions=emptyCaptions();s.presentation.session=crypto.randomUUID();s.presentation.runningSince=Date.now();}
export function presentationInteraction(s:State,c:Command):string|null|undefined {
 if(!c.type.startsWith('present-'))return undefined;
 const p=s.presentation,v=c.value as Record<string,unknown>|undefined;
 if(s.app!=='slides')return '放映已结束';
 if(v?.session!==p.session)return '放映会话已变化';
 if(c.type==='present-volume'){
  if(!Number.isInteger(v.level)||Number(v.level)<0||Number(v.level)>100||typeof v.muted!=='boolean')return '音量无效';
  p.volume={level:Number(v.level),muted:v.muted,request:c.id,error:''};return null;
 }
 if(c.type==='present-volume-result'){
  if(v.request!==p.volume.request)return '音量请求已过期';
  p.volume.error=String(v.error||'');return null;
 }
 if(!s.presenting)return '放映已结束';
 if(c.type==='present-captions'){
  if(v.enabled){if(s.switcher||typeof v.id!=='string'||!v.id)return '字幕会话无效';p.captions={...emptyCaptions(),id:v.id,enabled:true,status:'listening'};}
  else if(v.id===p.captions.id)p.captions=emptyCaptions();
  return null;
 }
 if(c.type==='present-caption-update'){
  const cap=p.captions;
  if(!cap.enabled||v.id!==cap.id||!Number.isInteger(v.sequence)||Number(v.sequence)<=cap.sequence||s.switcher)return '字幕数据已过期';
  if(!['listening','partial','final','error'].includes(String(v.status))||typeof v.text!=='string'||v.text.length>1000)return '字幕数据无效';
  cap.sequence=Number(v.sequence);cap.status=v.status as typeof cap.status;cap.text=v.text;cap.error=String(v.error||'').slice(0,200);if(cap.status==='error'){cap.enabled=false;cap.text='';}return null;
 }
 if(v?.slide!==s.slide)return '放映页面已变化';
 switch(c.type){
 case 'present-mode':if(v.mode!=='laser'&&v.mode!=='ink')return '模式无效';releasePointer(s);p.mode=v.mode;return null;
 case 'present-style':{const color=v.color??p.color,size=v.size??p.size;if(!/^#[0-9a-f]{6}$/i.test(String(color))||!Number.isInteger(size)||Number(size)<1||Number(size)>12)return '画笔设置无效';finishInk(s);p.color=String(color);p.size=Number(size);return null;}
 case 'present-undo':finishInk(s);p.ink[inkKey(s)]?.pop();return null;
 case 'present-clear':finishInk(s);p.ink[inkKey(s)]=[];return null;
 case 'present-start':{
  if(s.switcher)return '正在切换应用';if(typeof v.gesture!=='string'||!v.gesture)return '指向会话无效';releasePointer(s);
  p.pointer={x:.5,y:.5,active:true,gesture:v.gesture,sequence:0,heartbeat:Date.now(),drawing:false,drawSequence:0};
  return null;
 }
 case 'present-draw':{
  if(!p.pointer.active||p.mode!=='ink'||v.gesture!==p.pointer.gesture||s.switcher)return '画笔已停止';
  if(!Number.isInteger(v.sequence)||Number(v.sequence)<=p.pointer.drawSequence||typeof v.down!=='boolean')return '笔触事件已过期';
  p.pointer.drawSequence=Number(v.sequence);finishInk(s);
  if(v.down){p.pointer.drawing=true;p.live={points:[[p.pointer.x,p.pointer.y]],color:p.color,size:p.size,eraser:false};}return null;
 }
 case 'present-stop':if(v.gesture!==p.pointer.gesture)return null;releasePointer(s);return null;
 case 'present-point':{
  if(!p.pointer.active||v.gesture!==p.pointer.gesture||s.switcher)return '指向已结束';
  const x=Number(v.x),y=Number(v.y),seq=Number(v.sequence);
  if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||y<0||x>1||y>1||!Number.isInteger(seq)||seq<=p.pointer.sequence)return '指向数据已过期';
  p.pointer={...p.pointer,x,y,sequence:seq,heartbeat:Date.now()};
  if(p.live){if(p.live.points.length>=2000){const last=p.live.points.at(-1)!;const strokes=p.ink[inkKey(s)]||[];p.ink[inkKey(s)]=[...strokes,p.live].slice(-100);p.live={...p.live,points:[last]};}p.live.points.push([x,y]);}return null;
 }
 default:return '不支持的演示操作';
 }
}
