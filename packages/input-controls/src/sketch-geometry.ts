export const SKETCH_WIDTH=328;
export const SKETCH_HEIGHT=192;
/** Split intersecting polylines; normalization and one-gesture history stay shared. */
export function eraseSketchAt(lines:number[][][],point:number[],radius=9):number[][][]{
 let changed=false;const out:number[][][]=[];
 for(const line of lines){let run:number[][]=[];const samples:number[][]=[];
  for(let i=0;i<line.length;i++){const a=line[Math.max(0,i-1)],b=line[i],steps=Math.max(1,Math.ceil(Math.hypot((b[0]-a[0])*SKETCH_WIDTH,(b[1]-a[1])*SKETCH_HEIGHT)/3));for(let j=i?1:0;j<=steps;j++)samples.push([a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps]);}
  let hit=false;for(const p of samples){if(Math.hypot((p[0]-point[0])*SKETCH_WIDTH,(p[1]-point[1])*SKETCH_HEIGHT)<=radius){hit=true;if(run.length>1)out.push(run);run=[];}else run.push(p);}
  if(hit){changed=true;if(run.length>1)out.push(run);}else out.push(line);
 }
 return changed?out:lines;
}

/** Serialize the normalized canvas strokes after the user adopts the drawing. */
export function createSketchFile(strokes: number[][][], name = "sketch.svg"): File {
  const lines = strokes.map(line => {
    const points = line.map(([x, y]) => `${x * SKETCH_WIDTH},${y * SKETCH_HEIGHT}`).join(" ");
    return `<polyline points="${points}" fill="none" stroke="#182431" stroke-width="2"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SKETCH_WIDTH}" height="${SKETCH_HEIGHT}">${lines}</svg>`;
  return new File([svg], name, {type: "image/svg+xml"});
}
