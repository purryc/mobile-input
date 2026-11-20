export const SKETCH_WIDTH=328;
export const SKETCH_HEIGHT=192;

// The optional third number on the first point is the stroke's 24-bit RGB ink.
// Existing two-coordinate strokes use the default black pen.
export const defaultSketchInk = 0x171717;
export const sketchInks = [
  {rgb: defaultSketchInk, zh: '黑色', en: 'Black'},
  {rgb: 0xd54142, zh: '红色', en: 'Red'},
  {rgb: 0xf0bf2e, zh: '黄色', en: 'Yellow'},
  {rgb: 0x356fe4, zh: '蓝色', en: 'Blue'},
] as const;

export function inkHex(rgb: number = defaultSketchInk): string {
  const value = Number.isInteger(rgb) && rgb >= 0 && rgb <= 0xffffff ? rgb : defaultSketchInk;
  return '#' + value.toString(16).padStart(6, '0');
}

/** Split intersecting polylines, carrying the original ink to each surviving piece. */
export function eraseSketchAt(lines: number[][][], point: number[], radius = 9): number[][][] {
  let changed = false;
  const result: number[][][] = [];
  for (const line of lines) {
    const fragments: number[][][] = [];
    let run: number[][] = [];
    let hit = false;
    for (let i = 0; i < line.length; i++) {
      const a = line[Math.max(0, i - 1)], b = line[i];
      const steps = Math.max(1, Math.ceil(Math.hypot((b[0]-a[0])*SKETCH_WIDTH, (b[1]-a[1])*SKETCH_HEIGHT) / 3));
      for (let j = i ? 1 : 0; j <= steps; j++) {
        const x = a[0] + (b[0]-a[0])*j/steps, y = a[1] + (b[1]-a[1])*j/steps;
        if (Math.hypot((x-point[0])*SKETCH_WIDTH, (y-point[1])*SKETCH_HEIGHT) <= radius) {
          hit = true;
          if (run.length > 1) fragments.push(run);
          run = [];
        } else {
          run.push(!run.length && line[0][2] !== undefined ? [x, y, line[0][2]] : [x, y]);
        }
      }
    }
    if (hit) {
      changed = true;
      if (run.length > 1) fragments.push(run);
      result.push(...fragments);
    } else result.push(line);
  }
  return changed ? result : lines;
}

/** Serialize the normalized canvas strokes after the user adopts the drawing. */
export function createSketchFile(strokes: number[][][], name = "sketch.svg"): File {
  const lines = strokes.map(line => {
    const points = line.map(([x, y]) => `${x * SKETCH_WIDTH},${y * SKETCH_HEIGHT}`).join(" ");
    return `<polyline points="${points}" fill="none" stroke="${inkHex(line[0]?.[2])}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SKETCH_WIDTH}" height="${SKETCH_HEIGHT}">${lines}</svg>`;
  return new File([svg], name, {type: "image/svg+xml"});
}
