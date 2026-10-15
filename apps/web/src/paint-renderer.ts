import type {PaintLayer,PaintStroke} from '../../../packages/core/paint';
export const PAINT_WIDTH=1000,PAINT_HEIGHT=650;
let legacy:HTMLImageElement|undefined;
export function loadLegacyPaint(redraw:()=>void){legacy=new Image();legacy.onload=redraw;legacy.src='./reference-assets/paint-ink.png';}
export function renderLayer(canvas:HTMLCanvasElement,l:PaintLayer){const c=canvas.getContext('2d',{willReadFrequently:true})!;c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(canvas.width/1000,canvas.height/650);
 if(l.seed==='sea'){const g=c.createLinearGradient(0,0,0,650);g.addColorStop(0,'#e4edf0');g.addColorStop(.43,'#aacbd8');g.addColorStop(.44,'#618d9e');g.addColorStop(1,'#245a6b');c.fillStyle=g;c.fillRect(0,0,1000,650);c.strokeStyle='#cce3e8';for(let i=0;i<18;i++){c.globalAlpha=.18+i%3*.1;c.lineWidth=2;c.beginPath();c.moveTo(0,310+i*18);c.bezierCurveTo(280,280+i*20,560,345+i*13,1000,300+i*19);c.stroke();}c.globalAlpha=1;}
 if(l.seed==='sand'){c.fillStyle='#d7bd91';c.beginPath();c.moveTo(0,470);c.bezierCurveTo(250,570,690,440,1000,550);c.lineTo(1000,650);c.lineTo(0,650);c.fill();c.strokeStyle='#f5ead5';c.lineWidth=13;c.beginPath();c.moveTo(0,470);c.bezierCurveTo(250,570,690,440,1000,550);c.stroke();}
 if(l.seed==='boat'){c.translate(560,325);c.fillStyle='#a75d46';c.beginPath();c.moveTo(-85,35);c.lineTo(90,35);c.lineTo(55,70);c.lineTo(-50,70);c.closePath();c.fill();c.strokeStyle='#42484a';c.lineWidth=5;c.beginPath();c.moveTo(0,40);c.lineTo(0,-160);c.stroke();c.fillStyle='#fafaf7';c.beginPath();c.moveTo(-6,-155);c.lineTo(-6,25);c.lineTo(-100,25);c.closePath();c.fill();c.fillStyle='#d7a349';c.beginPath();c.moveTo(7,-140);c.lineTo(7,25);c.lineTo(80,25);c.closePath();c.fill();}
 if(l.seed==='legacy'&&legacy?.complete)c.drawImage(legacy,0,0,1000,650);
 c.restore();if(l.kind==='text'){c.save();c.fillStyle='#272f37';c.font='42px sans-serif';l.text.split('\n').forEach((text,i)=>c.fillText(text,70,105+i*55));c.restore();}
 for(const st of l.strokes)drawPaintStroke(c,st);
}
export function drawPaintStroke(c:CanvasRenderingContext2D,st:PaintStroke){const w=c.canvas.width,h=c.canvas.height,size=st.size*w/1000,points=st.points.map(([x,y])=>[x*w,y*h]);if(!points.length)return;
 c.save();c.globalAlpha=(st.opacity??100)/100;c.strokeStyle=st.color;c.fillStyle=st.color;c.lineCap='round';c.lineJoin='round';c.lineWidth=size;
 if(st.tool==='smudge'||st.tool==='liquify'){for(let i=1;i<points.length;i++){const [x,y]=points[i], [px,py]=points[i-1];const dx=(x-px)*(st.opacity??100)/100,dy=(y-py)*(st.opacity??100)/100,r=Math.max(12,size*2);if(Math.hypot(dx,dy)<.5)continue;
 const left=Math.max(0,Math.floor(x-r-Math.abs(dx))),top=Math.max(0,Math.floor(y-r-Math.abs(dy))),width=Math.min(w-left,Math.ceil(r*2+Math.abs(dx)*2)),height=Math.min(h-top,Math.ceil(r*2+Math.abs(dy)*2));if(width<=0||height<=0)continue;const src=c.getImageData(left,top,width,height),out=new ImageData(new Uint8ClampedArray(src.data),width,height);
 for(let iy=0;iy<height;iy++)for(let ix=0;ix<width;ix++){const d=Math.hypot(ix+left-x,iy+top-y)/r;if(d>=1)continue;const fall=(1-d)**2,ox=Math.max(0,Math.min(width-1,Math.round(ix-dx*fall))),oy=Math.max(0,Math.min(height-1,Math.round(iy-dy*fall))),a=(iy*width+ix)*4,b=(oy*width+ox)*4;for(let ch=0;ch<4;ch++)out.data[a+ch]=st.tool==='smudge'?src.data[a+ch]*.35+src.data[b+ch]*.65:src.data[b+ch];}c.putImageData(out,left,top);
 }c.restore();return;}
 if(st.tool==='eraser')c.globalCompositeOperation='destination-out';
 if(st.tool==='watercolor'){c.globalAlpha*=.16;c.lineWidth=size*1.7;c.shadowColor=st.color;c.shadowBlur=size*.35;}
 if(st.tool==='pencil'){c.globalAlpha*=.8;c.lineWidth=Math.max(1,size*.45);}
 if(st.tool==='oil'){c.lineWidth=size*1.3;c.lineCap='square';}
 if(st.tool==='knife'){c.lineWidth=size*.6;c.lineCap='square';}
 let seed=7;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 if(st.tool==='spray'){c.globalAlpha*=.28;for(const [x,y]of points)for(let j=0;j<25;j++){const a=random()*Math.PI*2,r=Math.sqrt(random())*size;c.fillRect(x+Math.cos(a)*r,y+Math.sin(a)*r,1.5,1.5);}}
 else {c.beginPath();c.moveTo(points[0][0],points[0][1]);for(const [x,y]of points)c.lineTo(x,y);if(points.length===1)c.lineTo(points[0][0]+.1,points[0][1]);c.stroke();if(st.tool==='oil'||st.tool==='knife'){c.globalAlpha*=.25;c.strokeStyle='#ffffff';c.lineWidth=1;for(let j=-2;j<=2;j++){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x+j*size/5,y+j):c.moveTo(x+j*size/5,y+j));c.stroke();}}}c.restore();
}
