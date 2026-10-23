import {useEffect,useRef} from 'react';

/** Original procedural artwork; the article is a layout reference, not a runtime image. */
export function DesktopWallpaper(){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current!;
  function draw(){
   const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
   if(!w||!h)return;
   canvas.width=w*dpr;canvas.height=h*dpr;
   const ctx=canvas.getContext('2d');if(!ctx)return;
   ctx.scale(dpr,dpr);ctx.fillStyle='#030610';ctx.fillRect(0,0,w,h);
   const haze=ctx.createRadialGradient(w*.54,h*.54,0,w*.54,h*.54,w*.7);
   haze.addColorStop(0,'#102155');haze.addColorStop(.6,'#060c20');haze.addColorStop(1,'#02040b');ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
   const cx=w*.53,cy=h*1.17,rx=w*.54,ry=h*.77;
   ctx.save();ctx.translate(cx,cy);ctx.scale(rx,ry);
   const aura=ctx.createRadialGradient(0,0,.96,0,0,1.04);
   aura.addColorStop(0,'#173bb600');aura.addColorStop(.45,'#6cb8f970');aura.addColorStop(.55,'#afdfff98');aura.addColorStop(1,'#336cfa00');
   ctx.fillStyle=aura;ctx.fillRect(-1.1,-1.1,2.2,2.2);
   const planet=ctx.createRadialGradient(-.18,-.95,.01,0,-.08,1.3);
   planet.addColorStop(0,'#7fbeee');planet.addColorStop(.12,'#2f5da8');planet.addColorStop(.32,'#0d1e56');planet.addColorStop(.57,'#030719');planet.addColorStop(1,'#01030c');
   ctx.beginPath();ctx.ellipse(0,0,1,1,0,0,Math.PI*2);ctx.fillStyle=planet;ctx.fill();ctx.restore();
   let seed=73;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
   for(let i=0;i<17000;i++){
    const angle=Math.PI+random()*Math.PI,r=1-Math.pow(random(),2.6)*.48;
    const x=cx+Math.cos(angle)*rx*r,y=cy+Math.sin(angle)*ry*r;if(y>h||x<0||x>w)continue;
    const rim=Math.pow(r,9),light=Math.max(.03,-Math.sin(angle));
    ctx.fillStyle=`rgba(${160+Math.floor(random()*80)},${190+Math.floor(random()*55)},255,${(.1+random()*.65)*rim*light})`;
    const size=.3+random()*.95;ctx.fillRect(x,y,size,size);
   }
   for(let i=0;i<1100;i++){
    const angle=Math.PI+random()*Math.PI,r=1.07+random()*.09,x=cx+Math.cos(angle)*rx*r,y=cy+Math.sin(angle)*ry*r;
    ctx.fillStyle=`rgba(113,149,255,${random()*.24})`;ctx.fillRect(x,y,.65,.65);
   }
  }
  const observer=new ResizeObserver(draw);observer.observe(canvas);draw();return()=>observer.disconnect();
 },[]);
 return <canvas ref={ref} className="hpc-wallpaper" aria-hidden="true"/>;
}
