import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TrackpadTap} from './trackpad-tap';
test('stationary taps produce immediate click and nearby double click',()=>{
 const t=new TrackpadTap();t.begin(1,10,20,0);assert.equal(t.end(1,12,20,90),'left');
 t.begin(2,11,20,170);assert.equal(t.end(2,12,21,240),'double');
 t.begin(3,10,20,300);assert.equal(t.end(3,10,20,350),'left');
});
test('drag, long press, multiple fingers, held mouse and cancellation never tap',()=>{
 const t=new TrackpadTap();
 t.begin(1,0,0,0);t.move(1,30,0);assert.equal(t.end(1,0,0,100),undefined);
 t.begin(1,0,0,200);assert.equal(t.end(1,0,0,600),undefined);
 t.begin(1,0,0,700);t.begin(2,0,0,710);assert.equal(t.end(1,0,0,750),undefined);assert.equal(t.end(2,0,0,760),undefined);
 t.begin(1,0,0,800,true);assert.equal(t.end(1,0,0,850),undefined);
 t.begin(1,0,0,900);t.cancel();assert.equal(t.end(1,0,0,950),undefined);
 t.begin(1,0,0,1000);assert.equal(t.end(1,0,0,1050),'left');t.cancel();
 t.begin(2,0,0,1100);assert.equal(t.end(2,0,0,1150),'left');
});
test('distant or late second tap is a new single click',()=>{
 const t=new TrackpadTap();t.begin(1,0,0,0);assert.equal(t.end(1,0,0,50),'left');
 t.begin(2,100,0,100);assert.equal(t.end(2,100,0,150),'left');
 t.begin(3,100,0,600);assert.equal(t.end(3,100,0,650),'left');
});
