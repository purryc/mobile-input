import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {controlKinds,widgetWidths} from '../src/types';
import {fromHex,toHex} from '../src/color-math';
import {createSketchFile, eraseSketchAt} from '../src/sketch-geometry';
import {stopMedia,waitForFrame} from '../src/capture-adapter';
test('all 13 widget entries remain independent and exclude text polish',()=>{
 assert.equal(controlKinds.length,13);assert.equal(new Set(controlKinds).size,13);
 for(const kind of controlKinds){assert.ok(widgetWidths[kind]>=288);assert.ok(readFileSync(new URL('../src/'+(kind==='photo'?'image':kind)+'-widget.tsx',import.meta.url),'utf8'));}
 for(const file of readdirSync(new URL('../src/',import.meta.url)).filter(f=>/\.tsx?$/.test(f))){const text=readFileSync(new URL('../src/'+file,import.meta.url),'utf8');assert.doesNotMatch(text,/from\s+["']\.\.\//,file);assert.doesNotMatch(text,/\/api\/|fetch\(|localStorage|WebSocket|navigator\.webdriver|renderWorkspaceRegionToCanvas/,file);}
});
test('color math roundtrips blue, red and neutrals without hue corruption',()=>{for(const hex of ['#356FE4','#FF0000','#000000','#FFFFFF','#919191'])assert.equal(toHex(fromHex(hex)).toUpperCase(),hex);});
test('sketch erasing retains untouched lines and splits crossed strokes',()=>{const lines=[[[0,0],[1,1]],[[0,.9],[.1,.9]]];const result=eraseSketchAt(lines,[.5,.5]);assert.notEqual(result,lines);assert.ok(result.some(line=>line===lines[1]));assert.equal(eraseSketchAt(lines,[.8,.1]),lines);});
test('stream release stops every video and audio track',()=>{let stopped=0;stopMedia({getTracks:()=>[{stop(){stopped++;}},{stop(){stopped++;}}]} as unknown as MediaStream);assert.equal(stopped,2);stopMedia(null);});
test('camera readiness rejects abort and no frames, accepts a real-sized ready frame',async()=>{const abort=new AbortController();abort.abort();await assert.rejects(waitForFrame({readyState:0} as HTMLVideoElement,abort.signal),{name:'AbortError'});await assert.rejects(waitForFrame({readyState:0} as HTMLVideoElement,new AbortController().signal,1),/No camera frame/);await waitForFrame({readyState:2,videoWidth:640,videoHeight:480} as HTMLVideoElement,new AbortController().signal);});
test('all component actions explicitly opt out of native form submission',()=>{for(const file of readdirSync(new URL('../src/',import.meta.url)).filter(f=>f.endsWith('.tsx'))){const source=readFileSync(new URL('../src/'+file,import.meta.url),'utf8');for(const tag of source.match(/<button\b[^>]*>/g)||[])assert.match(tag,/type="button"/,file+': '+tag);}});

test('split strokes keep their ink in the adopted SVG and legacy points use black', async () => {
  const blue = 0x356fe4;
  const lines = eraseSketchAt([[[0, 0, blue], [1, 1]], [[0, .9], [.1, .9]]], [.5, .5]);
  assert.deepEqual(lines.map(line => line[0][2]), [blue, blue, undefined]);
  const svg = await createSketchFile(lines).text();
  assert.deepEqual([...svg.matchAll(/stroke="([^"]+)"/g)].map(match => match[1]), ['#356fe4', '#356fe4', '#171717']);
});
