import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const hex=v=>'#'+v.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('').toUpperCase();
const luminance=rgb=>rgb.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
export async function extractIconTheme(file){
 const bytes=await readFile(file);const hash=createHash('sha256').update(bytes).digest('hex');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 let sample;
 try{const page=await browser.newPage();sample=await page.evaluate(async src=>{
  const img=new Image();img.src=src;await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,128,128);
  const {data}=ctx.getImageData(0,0,128,128);const bins=new Map();let excluded=0,eligible=0;
  for(let i=0;i<data.length;i+=4){const [r,g,b,a]=data.slice(i,i+4);const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,s=max?delta/max:0;
   if(a<224||max>245&&min>235||s<.35||max<70){excluded++;continue;}
   let h=max===r?((g-b)/delta)%6:max===g?(b-r)/delta+2:(r-g)/delta+4;h=(h*60+360)%360;
   const bucket=Math.floor((h+6)%360/12);const cell=bins.get(bucket)||{count:0,score:0,r:0,g:0,b:0};cell.count++;cell.score+=s;cell.r+=r;cell.g+=g;cell.b+=b;bins.set(bucket,cell);eligible++;
  }
  return {excluded,eligible,bins:[...bins.values()].sort((a,b)=>b.score-a.score)};
 },'data:image/svg+xml;base64,'+bytes.toString('base64'));}finally{await browser.close()}
 const winner=sample.bins[0];const ambiguous=!winner||winner.count/sample.eligible<.35;
 const rgb=ambiguous?[10,89,247]:[winner.r,winner.g,winner.b].map(v=>Math.round(v/winner.count));
 const foregrounds=[[24,36,49],[255,255,255],[0,0,0]];const best=foregrounds.map(color=>({color,ratio:ratio(rgb,color)})).sort((a,b)=>b.ratio-a.ratio)[0];
 const neutral=[24,36,49];const onAccent=ratio(rgb,neutral)>=4.5?neutral:best.color;
 return {source:'desktop-icon',sourcePath:file,iconHash:hash,method:'raster-128-hue12-neutral-filter-v1',seed:hex(rgb),accent:hex(rgb),onAccent:hex(onAccent),accentForeground:ratio(rgb,[255,255,255])>=4.5?hex(rgb):hex(neutral),contrast:ratio(rgb,onAccent),background:[.065,.025,.12].map(p=>hex(rgb.map(x=>255*(1-p)+x*p))),eligiblePixels:sample.eligible,excludedPixels:sample.excluded,dominantShare:winner?winner.count/sample.eligible:0,fallback:ambiguous?'ambiguous-or-neutral-icon':null};
}
