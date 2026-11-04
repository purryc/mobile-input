import {test} from 'node:test';import assert from 'node:assert/strict';
import {eraseSketchAt} from './agent-sketch';
test('eraser splits even sparse segments and does not mutate the original sketch',()=>{const lines=[[[.1,.5],[.9,.5]],[[.1,.1],[.9,.1]]];const next=eraseSketchAt(lines,[.5,.5]);assert.equal(next.length,3);assert.deepEqual(lines[0],[[.1,.5],[.9,.5]]);assert.equal(next[2],lines[1]);assert.ok(next[0].at(-1)![0]<.49);assert.ok(next[1][0][0]>.51);assert.equal(eraseSketchAt(lines,[.5,.9]),lines);});
