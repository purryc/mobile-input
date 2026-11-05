import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {EventEmitter,once} from 'node:events';
import {watchHelperLifecycle} from './helper-lifecycle.mjs';
test('an unexpectedly terminated native worker requests bridge recovery once',async()=>{
 const child=spawn(process.execPath,['-e','process.exit(2)']);let recoveries=0;
 const guard=watchHelperLifecycle(child,()=>recoveries++);
 await once(child,'exit');await Promise.resolve();assert.equal(recoveries,1);
 child.emit('error',new Error('late stream failure'));await Promise.resolve();assert.equal(recoveries,1);guard.close();
});
test('intentional shutdown suppresses queued recovery and worker spawn errors recover',async()=>{
 const child=new EventEmitter();let recoveries=0;const guard=watchHelperLifecycle(child,()=>recoveries++);
 child.emit('exit',0);guard.close();await Promise.resolve();assert.equal(recoveries,0);
 const other=new EventEmitter();const second=watchHelperLifecycle(other,()=>recoveries++);
 other.emit('error',new Error('spawn failure'));await Promise.resolve();assert.equal(recoveries,1);second.close();
});
